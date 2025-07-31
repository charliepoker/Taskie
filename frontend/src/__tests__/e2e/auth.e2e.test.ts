/**
 * End-to-End Tests for Authentication Flow
 *
 * These tests simulate real user interactions with the authentication system
 * including registration, login, and logout flows.
 */

import { test, expect, Page } from '@playwright/test';

// Mock API responses for E2E tests
const mockApiResponses = {
  register: {
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
      },
      tokens: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      },
    },
  },
  login: {
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
      },
      tokens: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      },
    },
  },
  currentUser: {
    success: true,
    data: {
      user: {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
      },
    },
  },
};

// Helper function to setup API mocks
async function setupApiMocks(page: Page) {
  // Mock registration endpoint
  await page.route('**/api/auth/register', async route => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify(mockApiResponses.register),
    });
  });

  // Mock login endpoint
  await page.route('**/api/auth/login', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockApiResponses.login),
    });
  });

  // Mock current user endpoint
  await page.route('**/api/auth/me', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockApiResponses.currentUser),
    });
  });

  // Mock logout endpoint
  await page.route('**/api/auth/logout', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, message: 'Logout successful' }),
    });
  });
}

test.describe('Authentication E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  test.describe('User Registration Flow', () => {
    test('should complete registration flow successfully', async ({ page }) => {
      // Navigate to registration page
      await page.goto('/auth/register');

      // Verify registration form is visible
      await expect(page.locator('h1')).toContainText('Create Account');

      // Fill out registration form
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="username-input"]', 'testuser');
      await page.fill('[data-testid="firstName-input"]', 'Test');
      await page.fill('[data-testid="lastName-input"]', 'User');
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await page.fill(
        '[data-testid="confirmPassword-input"]',
        'TestPassword123!'
      );

      // Submit registration form
      await page.click('[data-testid="register-button"]');

      // Verify successful registration and redirect to dashboard
      await expect(page).toHaveURL('/dashboard');
      await expect(page.locator('[data-testid="user-welcome"]')).toContainText(
        'Welcome, Test'
      );
    });

    test('should show validation errors for invalid input', async ({
      page,
    }) => {
      await page.goto('/auth/register');

      // Try to submit with empty fields
      await page.click('[data-testid="register-button"]');

      // Verify validation errors are shown
      await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="password-error"]')
      ).toBeVisible();
    });

    test('should show error for password mismatch', async ({ page }) => {
      await page.goto('/auth/register');

      // Fill form with mismatched passwords
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="username-input"]', 'testuser');
      await page.fill('[data-testid="firstName-input"]', 'Test');
      await page.fill('[data-testid="lastName-input"]', 'User');
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await page.fill(
        '[data-testid="confirmPassword-input"]',
        'DifferentPassword123!'
      );

      await page.click('[data-testid="register-button"]');

      // Verify password mismatch error
      await expect(
        page.locator('[data-testid="confirmPassword-error"]')
      ).toContainText('Passwords do not match');
    });

    test('should handle registration API errors', async ({ page }) => {
      // Mock API error response
      await page.route('**/api/auth/register', async route => {
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Email already exists',
            code: 'USER_EXISTS',
          }),
        });
      });

      await page.goto('/auth/register');

      // Fill and submit form
      await page.fill('[data-testid="email-input"]', 'existing@example.com');
      await page.fill('[data-testid="username-input"]', 'testuser');
      await page.fill('[data-testid="firstName-input"]', 'Test');
      await page.fill('[data-testid="lastName-input"]', 'User');
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await page.fill(
        '[data-testid="confirmPassword-input"]',
        'TestPassword123!'
      );

      await page.click('[data-testid="register-button"]');

      // Verify error message is displayed
      await expect(page.locator('[data-testid="error-message"]')).toContainText(
        'Email already exists'
      );
    });
  });

  test.describe('User Login Flow', () => {
    test('should complete login flow successfully', async ({ page }) => {
      // Navigate to login page
      await page.goto('/auth/login');

      // Verify login form is visible
      await expect(page.locator('h1')).toContainText('Sign In');

      // Fill out login form
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');

      // Submit login form
      await page.click('[data-testid="login-button"]');

      // Verify successful login and redirect to dashboard
      await expect(page).toHaveURL('/dashboard');
      await expect(page.locator('[data-testid="user-welcome"]')).toContainText(
        'Welcome, Test'
      );
    });

    test('should show validation errors for empty fields', async ({ page }) => {
      await page.goto('/auth/login');

      // Try to submit with empty fields
      await page.click('[data-testid="login-button"]');

      // Verify validation errors are shown
      await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="password-error"]')
      ).toBeVisible();
    });

    test('should handle invalid credentials', async ({ page }) => {
      // Mock API error response for invalid credentials
      await page.route('**/api/auth/login', async route => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Invalid email or password',
            code: 'INVALID_CREDENTIALS',
          }),
        });
      });

      await page.goto('/auth/login');

      // Fill and submit form with invalid credentials
      await page.fill('[data-testid="email-input"]', 'wrong@example.com');
      await page.fill('[data-testid="password-input"]', 'wrongpassword');

      await page.click('[data-testid="login-button"]');

      // Verify error message is displayed
      await expect(page.locator('[data-testid="error-message"]')).toContainText(
        'Invalid email or password'
      );
    });

    test('should show loading state during login', async ({ page }) => {
      // Mock delayed API response
      await page.route('**/api/auth/login', async route => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockApiResponses.login),
        });
      });

      await page.goto('/auth/login');

      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');

      await page.click('[data-testid="login-button"]');

      // Verify loading state is shown
      await expect(page.locator('[data-testid="login-button"]')).toContainText(
        'Signing in...'
      );
      await expect(page.locator('[data-testid="login-button"]')).toBeDisabled();
    });
  });

  test.describe('User Logout Flow', () => {
    test('should complete logout flow successfully', async ({ page }) => {
      // First login
      await page.goto('/auth/login');
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await page.click('[data-testid="login-button"]');

      // Verify we're on dashboard
      await expect(page).toHaveURL('/dashboard');

      // Click logout button
      await page.click('[data-testid="logout-button"]');

      // Verify redirect to login page
      await expect(page).toHaveURL('/auth/login');
      await expect(page.locator('h1')).toContainText('Sign In');
    });

    test('should clear user data on logout', async ({ page }) => {
      // Login first
      await page.goto('/auth/login');
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await page.click('[data-testid="login-button"]');

      // Verify user data is displayed
      await expect(page.locator('[data-testid="user-welcome"]')).toContainText(
        'Welcome, Test'
      );

      // Logout
      await page.click('[data-testid="logout-button"]');

      // Try to access protected route
      await page.goto('/dashboard');

      // Should be redirected to login
      await expect(page).toHaveURL('/auth/login');
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
      // Try to access protected route without authentication
      await page.goto('/dashboard');

      // Should be redirected to login page
      await expect(page).toHaveURL('/auth/login');
    });

    test('should allow authenticated users to access protected routes', async ({
      page,
    }) => {
      // Login first
      await page.goto('/auth/login');
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await page.click('[data-testid="login-button"]');

      // Should be able to access dashboard
      await expect(page).toHaveURL('/dashboard');

      // Should be able to access other protected routes
      await page.goto('/projects');
      await expect(page).toHaveURL('/projects');

      await page.goto('/users');
      await expect(page).toHaveURL('/users');
    });
  });

  test.describe('Navigation Between Auth Pages', () => {
    test('should navigate from login to register', async ({ page }) => {
      await page.goto('/auth/login');

      // Click register link
      await page.click('[data-testid="register-link"]');

      // Should navigate to register page
      await expect(page).toHaveURL('/auth/register');
      await expect(page.locator('h1')).toContainText('Create Account');
    });

    test('should navigate from register to login', async ({ page }) => {
      await page.goto('/auth/register');

      // Click login link
      await page.click('[data-testid="login-link"]');

      // Should navigate to login page
      await expect(page).toHaveURL('/auth/login');
      await expect(page.locator('h1')).toContainText('Sign In');
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper form labels and ARIA attributes', async ({
      page,
    }) => {
      await page.goto('/auth/login');

      // Check form accessibility
      await expect(page.locator('label[for="email"]')).toBeVisible();
      await expect(page.locator('label[for="password"]')).toBeVisible();

      // Check ARIA attributes
      await expect(page.locator('[data-testid="email-input"]')).toHaveAttribute(
        'aria-required',
        'true'
      );
      await expect(
        page.locator('[data-testid="password-input"]')
      ).toHaveAttribute('aria-required', 'true');
    });

    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/auth/login');

      // Tab through form elements
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="email-input"]')).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(
        page.locator('[data-testid="password-input"]')
      ).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="login-button"]')).toBeFocused();
    });

    test('should announce errors to screen readers', async ({ page }) => {
      await page.goto('/auth/login');

      // Submit empty form
      await page.click('[data-testid="login-button"]');

      // Check error messages have proper ARIA attributes
      await expect(page.locator('[data-testid="email-error"]')).toHaveAttribute(
        'role',
        'alert'
      );
      await expect(
        page.locator('[data-testid="password-error"]')
      ).toHaveAttribute('role', 'alert');
    });
  });
});
