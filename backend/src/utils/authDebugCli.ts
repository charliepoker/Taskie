#!/usr/bin/env ts-node

/**
 * Authentication Debug CLI Tool
 *
 * This utility allows developers to test authentication components in isolation
 * Usage: npx ts-node src/utils/authDebugCli.ts [command] [options]
 */

import { AuthDebugger } from './authDebugger';
import { connectDatabase, disconnectDatabase } from './database';

interface CliOptions {
  email?: string;
  password?: string;
  hash?: string;
  command: string;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {
    command: args[0] || 'help',
  };

  for (let i = 1; i < args.length; i += 2) {
    const key = args[i]?.replace('--', '');
    const value = args[i + 1];

    if (key && value) {
      (options as any)[key] = value;
    }
  }

  return options;
}

function printHelp() {
  console.log(`
🔍 Authentication Debug CLI Tool
===============================

Available Commands:

  test-password [--password "YourPassword123!"]
    Test password hashing and comparison functions
    
  test-user [--email "user@example.com"]
    Test user lookup functionality
    
  test-jwt [--email "user@example.com"]
    Test JWT token generation and verification
    
  test-all [--email "user@example.com"] [--password "YourPassword123!"]
    Run comprehensive authentication system test
    
  compare-password [--password "plain"] [--hash "hashedPassword"]
    Test password comparison with specific hash

Examples:
  npx ts-node src/utils/authDebugCli.ts test-password --password "MySecurePass123!"
  npx ts-node src/utils/authDebugCli.ts test-user --email "john@example.com"
  npx ts-node src/utils/authDebugCli.ts test-all --email "test@example.com" --password "TestPass123!"
  `);
}

async function main() {
  const options = parseArgs();

  if (
    options.command === 'help' ||
    options.command === '--help' ||
    options.command === '-h'
  ) {
    printHelp();
    return;
  }

  try {
    // Connect to database for tests that need it
    if (['test-user', 'test-all'].includes(options.command)) {
      console.log('🔌 Connecting to database...');
      await connectDatabase();
    }

    switch (options.command) {
      case 'test-password': {
        const password = options.password || 'TestPassword123!';
        console.log(
          `🔐 Testing password hashing and comparison with: "${password}"`
        );

        const result = await AuthDebugger.testCompletePasswordFlow(password);

        console.log('\n📊 Results:');
        console.log(
          `Hash Test: ${result.hashTest.success ? '✅' : '❌'} (${result.hashTest.duration}ms)`
        );
        console.log(
          `Compare Test: ${result.compareTest.success ? '✅' : '❌'} (${result.compareTest.duration}ms)`
        );
        console.log(
          `Overall: ${result.overallSuccess ? '✅ PASS' : '❌ FAIL'}`
        );

        if (result.hashTest.details) {
          console.log('\n🔍 Hash Details:');
          console.log(
            `  Valid bcrypt format: ${result.hashTest.details.isValidBcryptFormat}`
          );
          console.log(
            `  Can compare successfully: ${result.hashTest.details.canCompareSuccessfully}`
          );
        }

        if (result.compareTest.details) {
          console.log('\n🔍 Compare Details:');
          console.log(
            `  Passwords match: ${result.compareTest.details.passwordsMatch}`
          );
          console.log(
            `  Results consistent: ${result.compareTest.details.resultsConsistent}`
          );
        }
        break;
      }

      case 'test-user': {
        const email = options.email || 'test@example.com';
        console.log(`👤 Testing user lookup for: ${email}`);

        const result = await AuthDebugger.testUserLookup(email);

        console.log('\n📊 Results:');
        console.log(
          `User Lookup: ${result.success ? '✅' : '❌'} (${result.duration}ms)`
        );

        if (result.success && result.result) {
          console.log(
            `  User found: ${result.result.username} (${result.result.id})`
          );
        } else if (result.success && !result.result) {
          console.log(
            '  User not found (this is normal for non-existent users)'
          );
        } else {
          console.log(`  Error: ${result.error}`);
        }
        break;
      }

      case 'test-jwt': {
        const email = options.email || 'test@example.com';
        const mockUser = {
          id: 'test-user-id',
          email,
          username: 'testuser',
        };

        console.log(`🎫 Testing JWT flow for: ${email}`);

        const result = await AuthDebugger.testJWTFlow(mockUser);

        console.log('\n📊 Results:');
        console.log(
          `Token Generation: ${result.generateTest.success ? '✅' : '❌'} (${result.generateTest.duration}ms)`
        );
        console.log(
          `Access Token Verify: ${result.verifyAccessTest.success ? '✅' : '❌'} (${result.verifyAccessTest.duration}ms)`
        );
        console.log(
          `Refresh Token Verify: ${result.verifyRefreshTest.success ? '✅' : '❌'} (${result.verifyRefreshTest.duration}ms)`
        );
        console.log(
          `Overall: ${result.overallSuccess ? '✅ PASS' : '❌ FAIL'}`
        );
        break;
      }

      case 'test-all': {
        const email = options.email || 'test@example.com';
        const password = options.password || 'TestPassword123!';

        console.log(`🧪 Running comprehensive authentication test`);
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${password}`);

        const result = await AuthDebugger.runComprehensiveTest(email, password);

        console.log('\n' + result.summary);
        break;
      }

      case 'compare-password': {
        const password = options.password;
        const hash = options.hash;

        if (!password || !hash) {
          console.error(
            '❌ Both --password and --hash are required for compare-password command'
          );
          process.exit(1);
        }

        console.log(`🔍 Testing password comparison`);
        console.log(`   Password: ${password}`);
        console.log(`   Hash: ${hash.substring(0, 20)}...`);

        const result = await AuthDebugger.testPasswordComparison(
          password,
          hash
        );

        console.log('\n📊 Results:');
        console.log(
          `Compare Test: ${result.success ? '✅' : '❌'} (${result.duration}ms)`
        );

        if (result.details) {
          console.log(`  Passwords match: ${result.details.passwordsMatch}`);
          console.log(
            `  Valid bcrypt hash: ${result.details.isValidBcryptHash}`
          );
        }

        if (result.error) {
          console.log(`  Error: ${result.error}`);
        }
        break;
      }

      default:
        console.error(`❌ Unknown command: ${options.command}`);
        console.log('Use "help" to see available commands');
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error running debug command:', error);
    process.exit(1);
  } finally {
    // Disconnect from database
    if (['test-user', 'test-all'].includes(options.command)) {
      console.log('\n🔌 Disconnecting from database...');
      await disconnectDatabase();
    }
  }
}

// Run the CLI if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export { main as runAuthDebugCli };
