import bcrypt from 'bcryptjs';
import {
  hashPassword,
  comparePassword,
  validatePasswordStrength,
} from '../password';

// Mock bcrypt
jest.mock('bcryptjs');

// Mock AuthLogger
jest.mock('../authLogger', () => ({
  AuthLogger: {
    logPasswordOperation: jest.fn(),
  },
}));

const mockedBcrypt = bcrypt as any;

describe('Password Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('should hash password successfully', async () => {
      const password = 'testPassword123!';
      const salt = 'mockedSalt';
      const hashedPassword = 'hashedPassword123';

      mockedBcrypt.genSalt.mockResolvedValue(salt);
      mockedBcrypt.hash.mockResolvedValue(hashedPassword);

      const result = await hashPassword(password);

      expect(mockedBcrypt.genSalt).toHaveBeenCalledWith(12);
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(password, salt);
      expect(result).toBe(hashedPassword);
    });

    it('should hash password with request ID successfully', async () => {
      const password = 'testPassword123!';
      const requestId = 'test-request-123';
      const salt = 'mockedSalt';
      const hashedPassword = 'hashedPassword123';

      mockedBcrypt.genSalt.mockResolvedValue(salt);
      mockedBcrypt.hash.mockResolvedValue(hashedPassword);

      const result = await hashPassword(password, requestId);

      expect(mockedBcrypt.genSalt).toHaveBeenCalledWith(12);
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(password, salt);
      expect(result).toBe(hashedPassword);
    });

    it('should handle empty password', async () => {
      const password = '';
      const salt = 'mockedSalt';
      const hashedPassword = 'hashedEmptyPassword';

      mockedBcrypt.genSalt.mockResolvedValue(salt);
      mockedBcrypt.hash.mockResolvedValue(hashedPassword);

      const result = await hashPassword(password);

      expect(mockedBcrypt.genSalt).toHaveBeenCalledWith(12);
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(password, salt);
      expect(result).toBe(hashedPassword);
    });

    it('should handle very long password', async () => {
      const password = 'A'.repeat(1000) + '123!';
      const salt = 'mockedSalt';
      const hashedPassword = 'hashedLongPassword';

      mockedBcrypt.genSalt.mockResolvedValue(salt);
      mockedBcrypt.hash.mockResolvedValue(hashedPassword);

      const result = await hashPassword(password);

      expect(mockedBcrypt.genSalt).toHaveBeenCalledWith(12);
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(password, salt);
      expect(result).toBe(hashedPassword);
    });

    it('should handle password with unicode characters', async () => {
      const password = 'Test🔒Password123!';
      const salt = 'mockedSalt';
      const hashedPassword = 'hashedUnicodePassword';

      mockedBcrypt.genSalt.mockResolvedValue(salt);
      mockedBcrypt.hash.mockResolvedValue(hashedPassword);

      const result = await hashPassword(password);

      expect(mockedBcrypt.genSalt).toHaveBeenCalledWith(12);
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(password, salt);
      expect(result).toBe(hashedPassword);
    });

    it('should throw error when bcrypt.genSalt fails', async () => {
      const password = 'testPassword123!';
      mockedBcrypt.genSalt.mockRejectedValue(
        new Error('Salt generation failed')
      );

      await expect(hashPassword(password)).rejects.toThrow(
        'Failed to hash password'
      );
    });

    it('should throw error when bcrypt.hash fails', async () => {
      const password = 'testPassword123!';
      const salt = 'mockedSalt';

      mockedBcrypt.genSalt.mockResolvedValue(salt);
      mockedBcrypt.hash.mockRejectedValue(new Error('Hash failed'));

      await expect(hashPassword(password)).rejects.toThrow(
        'Failed to hash password'
      );
    });

    it('should throw generic error for non-Error exceptions', async () => {
      const password = 'testPassword123!';
      mockedBcrypt.genSalt.mockRejectedValue('String error');

      await expect(hashPassword(password)).rejects.toThrow(
        'Failed to hash password'
      );
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching passwords', async () => {
      const password = 'testPassword123!';
      const hashedPassword = 'hashedPassword123';

      mockedBcrypt.compare.mockResolvedValue(true);

      const result = await comparePassword(password, hashedPassword);

      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        password,
        hashedPassword
      );
      expect(result).toBe(true);
    });

    it('should return false for non-matching passwords', async () => {
      const password = 'testPassword123!';
      const hashedPassword = 'hashedPassword123';

      mockedBcrypt.compare.mockResolvedValue(false);

      const result = await comparePassword(password, hashedPassword);

      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        password,
        hashedPassword
      );
      expect(result).toBe(false);
    });

    it('should compare password with request ID', async () => {
      const password = 'testPassword123!';
      const hashedPassword = 'hashedPassword123';
      const requestId = 'test-request-456';

      mockedBcrypt.compare.mockResolvedValue(true);

      const result = await comparePassword(password, hashedPassword, requestId);

      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        password,
        hashedPassword
      );
      expect(result).toBe(true);
    });

    it('should handle empty password comparison', async () => {
      const password = '';
      const hashedPassword = 'hashedPassword123';

      mockedBcrypt.compare.mockResolvedValue(false);

      const result = await comparePassword(password, hashedPassword);

      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        password,
        hashedPassword
      );
      expect(result).toBe(false);
    });

    it('should handle empty hash comparison', async () => {
      const password = 'testPassword123!';
      const hashedPassword = '';

      mockedBcrypt.compare.mockResolvedValue(false);

      const result = await comparePassword(password, hashedPassword);

      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        password,
        hashedPassword
      );
      expect(result).toBe(false);
    });

    it('should handle unicode characters in password comparison', async () => {
      const password = 'Test🔒Password123!';
      const hashedPassword = 'hashedUnicodePassword';

      mockedBcrypt.compare.mockResolvedValue(true);

      const result = await comparePassword(password, hashedPassword);

      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        password,
        hashedPassword
      );
      expect(result).toBe(true);
    });

    it('should handle very long password comparison', async () => {
      const password = 'A'.repeat(1000) + '123!';
      const hashedPassword = 'hashedLongPassword';

      mockedBcrypt.compare.mockResolvedValue(true);

      const result = await comparePassword(password, hashedPassword);

      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        password,
        hashedPassword
      );
      expect(result).toBe(true);
    });

    it('should handle malformed hash gracefully', async () => {
      const password = 'testPassword123!';
      const hashedPassword = 'not-a-valid-bcrypt-hash';

      mockedBcrypt.compare.mockRejectedValue(new Error('Invalid hash format'));

      await expect(comparePassword(password, hashedPassword)).rejects.toThrow(
        'Failed to compare password'
      );
    });

    it('should throw error when bcrypt.compare fails', async () => {
      const password = 'testPassword123!';
      const hashedPassword = 'hashedPassword123';

      mockedBcrypt.compare.mockRejectedValue(new Error('Compare failed'));

      await expect(comparePassword(password, hashedPassword)).rejects.toThrow(
        'Failed to compare password'
      );
    });

    it('should throw generic error for non-Error exceptions', async () => {
      const password = 'testPassword123!';
      const hashedPassword = 'hashedPassword123';

      mockedBcrypt.compare.mockRejectedValue('String error');

      await expect(comparePassword(password, hashedPassword)).rejects.toThrow(
        'Failed to compare password'
      );
    });
  });

  describe('validatePasswordStrength', () => {
    it('should validate strong password', () => {
      const password = 'StrongPass123!';
      const result = validatePasswordStrength(password);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate minimum length password', () => {
      const password = 'MinLen1!';
      const result = validatePasswordStrength(password);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate maximum length password', () => {
      const password = 'A'.repeat(120) + 'a1!Test';
      const result = validatePasswordStrength(password);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject password that is too short', () => {
      const password = 'Short1!';
      const result = validatePasswordStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Password must be at least 8 characters long'
      );
    });

    it('should reject password that is too long', () => {
      const password = 'A'.repeat(129) + '1!';
      const result = validatePasswordStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Password must be less than 128 characters long'
      );
    });

    it('should reject password without lowercase letter', () => {
      const password = 'UPPERCASE123!';
      const result = validatePasswordStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Password must contain at least one lowercase letter'
      );
    });

    it('should reject password without uppercase letter', () => {
      const password = 'lowercase123!';
      const result = validatePasswordStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Password must contain at least one uppercase letter'
      );
    });

    it('should reject password without number', () => {
      const password = 'NoNumbers!';
      const result = validatePasswordStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Password must contain at least one number'
      );
    });

    it('should reject password without special character', () => {
      const password = 'NoSpecial123';
      const result = validatePasswordStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Password should contain at least one special character'
      );
    });

    it('should return multiple errors for weak password', () => {
      const password = 'weak';
      const result = validatePasswordStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Password must be at least 8 characters long'
      );
      expect(result.errors).toContain(
        'Password must contain at least one uppercase letter'
      );
      expect(result.errors).toContain(
        'Password must contain at least one number'
      );
      expect(result.errors).toContain(
        'Password should contain at least one special character'
      );
    });

    it('should validate password with various special characters', () => {
      const specialChars = '!@#$%^&*()_+-=[]{};\':"|,.<>/?';

      for (const char of specialChars) {
        const password = `StrongPass123${char}`;
        const result = validatePasswordStrength(password);
        expect(result.isValid).toBe(true);
      }
    });

    it('should handle empty password', () => {
      const password = '';
      const result = validatePasswordStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Password must be at least 8 characters long'
      );
      expect(result.errors).toContain(
        'Password must contain at least one lowercase letter'
      );
      expect(result.errors).toContain(
        'Password must contain at least one uppercase letter'
      );
      expect(result.errors).toContain(
        'Password must contain at least one number'
      );
      expect(result.errors).toContain(
        'Password should contain at least one special character'
      );
    });

    it('should handle password with only spaces', () => {
      const password = '        ';
      const result = validatePasswordStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Password must contain at least one lowercase letter'
      );
      expect(result.errors).toContain(
        'Password must contain at least one uppercase letter'
      );
      expect(result.errors).toContain(
        'Password must contain at least one number'
      );
      expect(result.errors).toContain(
        'Password should contain at least one special character'
      );
    });

    it('should handle password with unicode characters', () => {
      const password = 'Test🔒Password123!';
      const result = validatePasswordStrength(password);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle password with accented characters', () => {
      const password = 'Tëst123!Pássword';
      const result = validatePasswordStrength(password);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle password with numbers at different positions', () => {
      const passwords = [
        '1TestPassword!',
        'Test1Password!',
        'TestPassword1!',
        'TestPassword!1',
      ];

      passwords.forEach((password) => {
        const result = validatePasswordStrength(password);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should handle edge case with exactly 128 characters', () => {
      const password = 'A'.repeat(124) + 'a1!';
      const result = validatePasswordStrength(password);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle password with backslash special character', () => {
      const password = 'TestPassword123\\';
      const result = validatePasswordStrength(password);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
