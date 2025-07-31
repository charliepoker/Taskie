#!/bin/bash

# Test runner script for Taskie application
set -e

echo "🧪 Starting Taskie Test Suite"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Start test databases
print_status "Starting test databases..."
docker-compose -f docker-compose.test.yml up -d

# Wait for databases to be ready
print_status "Waiting for databases to be ready..."
sleep 10

# Setup test database
print_status "Setting up test database..."
cd backend
npm run prisma:migrate
npm run prisma:generate
cd ..

# Run backend tests
print_status "Running backend tests..."
cd backend
npm run test:coverage
cd ..

# Run frontend tests
print_status "Running frontend tests..."
cd frontend
npm run test:coverage
cd ..

# Cleanup
print_status "Cleaning up test databases..."
docker-compose -f docker-compose.test.yml down -v

print_status "✅ All tests completed successfully!"