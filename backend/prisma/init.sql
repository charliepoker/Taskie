-- Database initialization script for Taskie
-- This script sets up the initial database configuration

-- Create database if it doesn't exist (handled by Docker environment variables)
-- The database 'taskietaskie' is created automatically by the POSTGRES_DB environment variable

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set timezone
SET timezone = 'UTC';

-- Create indexes for better performance (these will be created by Prisma migrations)
-- This file serves as a placeholder for any additional database setup needed