import bcrypt from 'bcryptjs';
import {
  hashPassword,
  comparePassword,
  validatePasswordStrength,
} from '../password';

// Mock bcrypt
jest.mock('bcryptjs');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

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

    it('should throw error when bcrypt.compare fails', async () => {
      const password = 'testPassword123!';
      const hashedPassword = 'hashedPassword123';

      mockedBcrypt.compare.mockRejectedValue(new Error('Compare failed'));

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
  });
});
