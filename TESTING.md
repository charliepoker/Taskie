# Testing Guide

This document provides comprehensive information about the testing infrastructure and practices for the Taskie application.

## Overview

The Taskie application uses a comprehensive testing setup that includes:

- **Unit Tests**: Testing individual components and functions
- **Integration Tests**: Testing API endpoints and database interactions
- **Component Tests**: Testing React components with user interactions
- **Test Database**: Isolated PostgreSQL database for integration tests
- **API Mocking**: MSW (Mock Service Worker) for frontend API testing
- **Coverage Reporting**: Code coverage tracking and thresholds

## Testing Stack

### Frontend Testing

- **Jest**: Test runner and assertion library
- **React Testing Library**: Component testing utilities
- **MSW (Mock Service Worker)**: API mocking for tests
- **@testing-library/jest-dom**: Additional DOM matchers
- **@testing-library/user-event**: User interaction simulation

### Backend Testing

- **Jest**: Test runner and assertion library
- **ts-jest**: TypeScript support for Jest
- **Supertest**: HTTP assertion library for API testing
- **Test Database**: Isolated PostgreSQL instance for integration tests

## Project Structure

```
├── frontend/
│   ├── src/
│   │   ├── components/__tests__/     # Component tests
│   │   ├── hooks/__tests__/          # Hook tests
│   │   ├── stores/__tests__/         # Store tests
│   │   ├── lib/test-utils.tsx        # Test utilities and custom render
│   │   └── mocks/                    # MSW handlers and setup
│   ├── jest.config.js                # Jest configuration
│   └── jest.setup.js                 # Global test setup
├── backend/
│   ├── src/
│   │   ├── __tests__/                # Integration tests
│   │   ├── utils/__tests__/          # Utility tests
│   │   └── utils/test-helpers.ts     # Test utilities and helpers
│   ├── jest.config.js                # Jest configuration
│   └── jest.setup.js                 # Global test setup
├── docker-compose.test.yml           # Test database configuration
├── scripts/test.sh                   # Test runner script
└── TESTING.md                        # This file
```

## Running Tests

### Quick Start

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in CI mode
npm run test:ci
```

### Frontend Tests

```bash
cd frontend

# Run all frontend tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --testPathPatterns=Button.test.tsx
```

### Backend Tests

```bash
cd backend

# Start test database
npm run test:db:setup

# Run all backend tests
npm test

# Run tests with coverage
npm run test:coverage

# Clean up test database
npm run test:db:teardown
```

### Full Test Suite

```bash
# Run the comprehensive test script
./scripts/test.sh
```

This script will:

1. Start test databases with Docker
2. Set up the test database schema
3. Run backend tests with coverage
4. Run frontend tests with coverage
5. Clean up test databases

## Test Database Setup

The application uses a separate PostgreSQL database for testing to ensure test isolation.

### Configuration

- **Host**: localhost
- **Port**: 5433 (different from dev database)
- **Database**: taskie_test
- **User**: postgres
- **Password**: postgres

### Setup Commands

```bash
# Start test database
docker-compose -f docker-compose.test.yml up -d

# Run migrations
cd backend
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/taskie_test" npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

## Writing Tests

### Frontend Component Tests

```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Button } from "../ui/Button";

describe("Button Component", () => {
  it("renders button with text", () => {
    render(<Button>Click me</Button>);

    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  it("handles click events", () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Backend Integration Tests

```typescript
import {
  createTestUser,
  createTestProject,
  cleanupDatabase,
} from "../utils/test-helpers";
import request from "supertest";
import app from "../app";

describe("Project API", () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  it("should create a new project", async () => {
    const user = await createTestUser();

    const response = await request(app)
      .post("/api/projects")
      .set("Authorization", `Bearer ${generateTestToken(user.id)}`)
      .send({
        name: "Test Project",
        description: "A test project",
        color: "#0D65F2",
      });

    expect(response.status).toBe(201);
    expect(response.body.name).toBe("Test Project");
  });
});
```

### Test Utilities

#### Frontend Test Utils

```typescript
// Custom render with providers
import { render } from "../../lib/test-utils";

// Mock data
import { mockUser, mockProject, mockTask } from "../../lib/test-utils";
```

#### Backend Test Helpers

```typescript
// Database utilities
import {
  createTestUser,
  createTestProject,
  createTestTask,
  cleanupDatabase,
} from "../utils/test-helpers";

// Mock request/response
import { createMockRequest, createMockResponse } from "../utils/test-helpers";
```

## Coverage Requirements

The project maintains the following coverage thresholds:

- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

### Viewing Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View HTML coverage report
open frontend/coverage/lcov-report/index.html
open backend/coverage/lcov-report/index.html
```

## CI/CD Integration

The testing infrastructure is integrated with GitHub Actions for continuous integration.

### Pre-commit Hooks

Tests are automatically run on changed files before commits:

```bash
# This runs automatically on git commit
npm run test -- --bail --findRelatedTests --passWithNoTests
```

### GitHub Actions

The CI pipeline includes:

1. **Test Job**: Runs all tests with coverage
2. **Lint Job**: Code quality checks
3. **Build Job**: Ensures application builds successfully

## Best Practices

### Test Organization

1. **Group related tests** using `describe` blocks
2. **Use descriptive test names** that explain the expected behavior
3. **Follow AAA pattern**: Arrange, Act, Assert
4. **Clean up after tests** to ensure isolation

### Mocking Guidelines

1. **Mock external dependencies** (APIs, databases, third-party services)
2. **Use MSW for API mocking** in frontend tests
3. **Mock at the boundary** (service layer, not implementation details)
4. **Keep mocks simple** and focused on the test scenario

### Performance

1. **Use test database cleanup** instead of recreating databases
2. **Run tests in parallel** when possible
3. **Use focused tests** (`it.only`, `describe.only`) during development
4. **Avoid unnecessary setup** in test files

## Troubleshooting

### Common Issues

#### Database Connection Errors

```bash
# Ensure test database is running
docker-compose -f docker-compose.test.yml ps

# Check database logs
docker-compose -f docker-compose.test.yml logs postgres-test
```

#### Port Conflicts

```bash
# Check if ports are in use
lsof -i :5433  # Test database
lsof -i :6380  # Test Redis
```

#### Test Timeouts

- Increase Jest timeout in configuration
- Check for hanging promises or async operations
- Ensure proper cleanup in `afterEach` hooks

#### Coverage Issues

- Check excluded files in Jest configuration
- Ensure all code paths are tested
- Use coverage reports to identify untested code

### Getting Help

1. Check the test output for specific error messages
2. Review the Jest documentation for configuration options
3. Check the React Testing Library documentation for component testing
4. Review the MSW documentation for API mocking

## Future Enhancements

- **E2E Testing**: Add Playwright or Cypress for end-to-end tests
- **Visual Regression Testing**: Add screenshot testing for UI components
- **Performance Testing**: Add load testing for API endpoints
- **Accessibility Testing**: Expand a11y testing coverage
- **Contract Testing**: Add API contract testing between frontend and backend
