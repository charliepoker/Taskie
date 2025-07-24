# Database Setup Guide

This document explains the database and caching setup for the Taskie backend application.

## Overview

The application uses:

- **PostgreSQL 15** as the primary database
- **Redis 7** for session caching and performance optimization
- **Prisma ORM** for type-safe database access
- **Docker Compose** for local development environment

## Quick Start

### 1. Start Database Services

```bash
# Start PostgreSQL and Redis containers
docker-compose up -d postgres redis

# Check if services are running
docker-compose ps
```

### 2. Set up Database Schema

```bash
cd backend

# Install dependencies
npm install

# Run database migrations
npm run prisma:migrate

# Generate Prisma client
npm run prisma:generate

# Seed database with demo data
npm run prisma:seed
```

### 3. Verify Setup

```bash
# Run database tests
npm test -- --testPathPattern=database.test.ts

# Start the server
npm run dev

# Check health endpoints
curl http://localhost:5000/health
curl http://localhost:5000/health/detailed
```

## Database Schema

### Core Models

#### User

- `id`: UUID primary key
- `email`: Unique email address
- `username`: Unique username
- `firstName`, `lastName`: User's name
- `password`: Hashed password
- `avatar`: Optional profile picture URL
- `createdAt`, `updatedAt`: Timestamps

#### Project

- `id`: UUID primary key
- `name`: Project name
- `description`: Optional project description
- `color`: Project color (hex code)
- `ownerId`: Reference to User who owns the project
- `createdAt`, `updatedAt`: Timestamps

#### ProjectMember (Junction Table)

- `id`: UUID primary key
- `userId`: Reference to User
- `projectId`: Reference to Project
- `role`: User's role in the project (OWNER, ADMIN, MEMBER, VIEWER)
- `joinedAt`: When user joined the project

#### Task

- `id`: UUID primary key
- `title`: Task title
- `description`: Optional task description
- `status`: Task status (TODO, IN_PROGRESS, IN_REVIEW, DONE)
- `priority`: Task priority (LOW, MEDIUM, HIGH, URGENT)
- `assigneeId`: Optional reference to assigned User
- `projectId`: Reference to parent Project
- `dueDate`: Optional due date
- `createdAt`, `updatedAt`: Timestamps

#### Comment

- `id`: UUID primary key
- `content`: Comment text
- `taskId`: Reference to parent Task
- `authorId`: Reference to User who wrote the comment
- `createdAt`, `updatedAt`: Timestamps

### Relationships

- Users can be members of multiple projects
- Projects can have multiple members with different roles
- Tasks belong to one project and can be assigned to one user
- Comments belong to one task and are written by one user

## Environment Configuration

### Required Environment Variables

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/taskietaskie

# Redis
REDIS_URL=redis://localhost:6379

# JWT Secrets (change in production!)
JWT_SECRET=your-jwt-secret-key
JWT_REFRESH_SECRET=your-jwt-refresh-secret-key
```

### Docker Compose Services

The `docker-compose.yml` file defines:

- **postgres**: PostgreSQL 15 database on port 5433
- **redis**: Redis 7 cache on port 6379
- **backend**: Express.js API server on port 5000
- **frontend**: Next.js application on port 3000

## Database Operations

### Migration Commands

```bash
# Create a new migration
npm run migrate -- --create migration_name

# Run pending migrations
npm run migrate -- --run

# Reset database (WARNING: deletes all data)
npm run migrate -- --reset

# Check migration status
npm run migrate -- --status

# Deploy migrations (production)
npm run migrate -- --deploy
```

### Prisma Commands

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations in development
npm run prisma:migrate

# Open Prisma Studio (database GUI)
npm run prisma:studio

# Seed database with demo data
npm run prisma:seed
```

### Database Utilities

The application includes several utility functions:

#### Database Connection (`src/utils/database.ts`)

- `connectDatabase()`: Initialize database connection
- `disconnectDatabase()`: Close database connection
- `healthCheck()`: Check database and Redis health
- `handlePrismaError()`: Convert Prisma errors to application errors

#### Redis Service (`src/utils/redis.ts`)

- `RedisService`: General Redis operations (get, set, del, etc.)
- `SessionManager`: Session management utilities
- Key-value operations, JSON storage, sets, expiration handling

## Session Management

### Redis Session Storage

Sessions are stored in Redis with the following structure:

```
session:{sessionId} -> JSON session data
user_sessions:{userId} -> Set of session IDs for the user
```

### Session Operations

```typescript
import { sessionManager } from '../utils/redis';

// Create session
await sessionManager.createSession(sessionId, userId, data, expirationSeconds);

// Get session
const session = await sessionManager.getSession(sessionId);

// Delete session
await sessionManager.deleteSession(sessionId);

// Delete all user sessions
await sessionManager.deleteUserSessions(userId);
```

## Health Monitoring

### Health Check Endpoints

- `GET /health`: Basic health status
- `GET /health/detailed`: Detailed system information

### Health Check Response

```json
{
  "status": "healthy",
  "timestamp": "2025-07-24T14:00:00.000Z",
  "services": {
    "database": {
      "status": "up",
      "type": "PostgreSQL",
      "connection": "active"
    },
    "redis": {
      "status": "up",
      "type": "Redis",
      "connection": "active",
      "operations": "working"
    }
  }
}
```

## Troubleshooting

### Common Issues

1. **Port 5432 already in use**
   - The Docker Compose uses port 5433 to avoid conflicts
   - Update `DATABASE_URL` to use port 5433

2. **Connection refused errors**
   - Ensure Docker services are running: `docker-compose ps`
   - Check service logs: `docker-compose logs postgres redis`

3. **Migration errors**
   - Reset database: `npm run migrate -- --reset`
   - Check schema syntax: `npm run migrate -- --validate`

4. **Redis connection issues**
   - Verify Redis is running: `docker-compose logs redis`
   - Test connection: `redis-cli -p 6379 ping`

### Logs and Debugging

- Database queries are logged in development mode
- Redis operations include debug logging
- Health check endpoints provide service status
- Use Prisma Studio for database inspection: `npm run prisma:studio`

## Production Considerations

### Security

- Change default JWT secrets
- Use environment-specific database credentials
- Enable SSL for database connections
- Configure Redis authentication

### Performance

- Set up connection pooling
- Configure Redis memory limits
- Add database indexes for query optimization
- Monitor query performance

### Backup and Recovery

- Set up automated database backups
- Configure Redis persistence
- Test disaster recovery procedures
- Monitor disk space and memory usage
