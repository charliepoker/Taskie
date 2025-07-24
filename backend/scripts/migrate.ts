#!/usr/bin/env ts-node

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';
import winston from 'winston';

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.simple()
  ),
  transports: [new winston.transports.Console()],
});

interface MigrationOptions {
  name?: string;
  reset?: boolean;
  deploy?: boolean;
  generate?: boolean;
}

class DatabaseMigrator {
  private prismaPath: string;

  constructor() {
    this.prismaPath = path.join(__dirname, '..', 'prisma');
  }

  private runCommand(command: string): void {
    try {
      logger.info(`Running: ${command}`);
      execSync(command, {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..'),
      });
    } catch (error) {
      logger.error(`Command failed: ${command}`);
      throw error;
    }
  }

  public async generateClient(): Promise<void> {
    logger.info('Generating Prisma client...');
    this.runCommand('npx prisma generate');
    logger.info('Prisma client generated successfully');
  }

  public async createMigration(name: string): Promise<void> {
    logger.info(`Creating migration: ${name}`);
    this.runCommand(`npx prisma migrate dev --name ${name}`);
    logger.info('Migration created successfully');
  }

  public async runMigrations(): Promise<void> {
    logger.info('Running pending migrations...');
    this.runCommand('npx prisma migrate dev');
    logger.info('Migrations completed successfully');
  }

  public async deployMigrations(): Promise<void> {
    logger.info('Deploying migrations to production...');
    this.runCommand('npx prisma migrate deploy');
    logger.info('Migrations deployed successfully');
  }

  public async resetDatabase(): Promise<void> {
    logger.warn('Resetting database - this will delete all data!');
    this.runCommand('npx prisma migrate reset --force');
    logger.info('Database reset completed');
  }

  public async seedDatabase(): Promise<void> {
    const seedFile = path.join(__dirname, '..', 'prisma', 'seed.ts');
    if (existsSync(seedFile)) {
      logger.info('Running database seed...');
      this.runCommand('npx prisma db seed');
      logger.info('Database seeded successfully');
    } else {
      logger.info('No seed file found, skipping seeding');
    }
  }

  public async checkMigrationStatus(): Promise<void> {
    logger.info('Checking migration status...');
    this.runCommand('npx prisma migrate status');
  }

  public async validateSchema(): Promise<void> {
    logger.info('Validating Prisma schema...');
    this.runCommand('npx prisma validate');
    logger.info('Schema validation passed');
  }

  public async introspectDatabase(): Promise<void> {
    logger.info('Introspecting database...');
    this.runCommand('npx prisma db pull');
    logger.info('Database introspection completed');
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const migrator = new DatabaseMigrator();

  try {
    if (args.includes('--help') || args.includes('-h')) {
      console.log(`
Database Migration Script

Usage: npm run migrate [options]

Options:
  --generate, -g          Generate Prisma client
  --create <name>         Create a new migration
  --run, -r              Run pending migrations
  --deploy, -d           Deploy migrations (production)
  --reset                Reset database (WARNING: deletes all data)
  --seed, -s             Seed database with initial data
  --status               Check migration status
  --validate, -v         Validate Prisma schema
  --introspect, -i       Introspect existing database
  --help, -h             Show this help message

Examples:
  npm run migrate --generate
  npm run migrate --create init
  npm run migrate --run
  npm run migrate --deploy
  npm run migrate --reset --seed
      `);
      return;
    }

    // Validate schema first
    await migrator.validateSchema();

    if (args.includes('--generate') || args.includes('-g')) {
      await migrator.generateClient();
    }

    if (args.includes('--create')) {
      const nameIndex = args.findIndex((arg) => arg === '--create') + 1;
      const name = args[nameIndex] || 'migration';
      await migrator.createMigration(name);
    }

    if (args.includes('--run') || args.includes('-r')) {
      await migrator.runMigrations();
    }

    if (args.includes('--deploy') || args.includes('-d')) {
      await migrator.deployMigrations();
    }

    if (args.includes('--reset')) {
      await migrator.resetDatabase();
    }

    if (args.includes('--seed') || args.includes('-s')) {
      await migrator.seedDatabase();
    }

    if (args.includes('--status')) {
      await migrator.checkMigrationStatus();
    }

    if (args.includes('--introspect') || args.includes('-i')) {
      await migrator.introspectDatabase();
    }

    // If no specific action, run default migration flow
    if (args.length === 0) {
      await migrator.runMigrations();
      await migrator.generateClient();
    }
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { DatabaseMigrator };
