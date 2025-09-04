import bcrypt from 'bcryptjs';
import { AuthLogger } from './authLogger';

// Salt rounds for bcrypt hashing
const SALT_ROUNDS = 12;

/**
 * Hash a plain text password
 */
export async function hashPassword(
  password: string,
  requestId?: string
): Promise<string> {
  const startTime = Date.now();

  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);
    const duration = Date.now() - startTime;

    AuthLogger.logPasswordOperation('hash', true, duration, { requestId });

    return hashedPassword;
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to hash password';

    AuthLogger.logPasswordOperation('hash', false, duration, {
      requestId,
      errorMessage,
    });

    throw new Error('Failed to hash password');
  }
}

/**
 * Compare a plain text password with a hashed password
 */
export async function comparePassword(
  password: string,
  hashedPassword: string,
  requestId?: string
): Promise<boolean> {
  const startTime = Date.now();

  try {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    const duration = Date.now() - startTime;

    AuthLogger.logPasswordOperation('compare', true, duration, { requestId });

    return isMatch;
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to compare password';

    AuthLogger.logPasswordOperation('compare', false, duration, {
      requestId,
      errorMessage,
    });

    throw new Error('Failed to compare password');
  }
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (password.length > 128) {
    errors.push('Password must be less than 128 characters long');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Optional: Check for special characters
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password should contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
