import bcrypt from 'bcryptjs';
import { hashPassword, comparePassword } from './password';
import { generateTokens, verifyAccessToken, verifyRefreshToken } from './jwt';
import { AuthLogger } from './authLogger';
import { prisma } from './database';

export interface PasswordTestResult {
  success: boolean;
  duration: number;
  error?: string;
  details?: Record<string, any>;
}

export interface DatabaseTestResult {
  success: boolean;
  duration: number;
  result?: any;
  error?: string;
  query?: string;
}

export interface JWTTestResult {
  success: boolean;
  duration: number;
  token?: string;
  payload?: any;
  error?: string;
}

export class AuthDebugger {
  /**
   * Test password hashing function with various inputs
   */
  static async testPasswordHashing(
    password: string,
    requestId?: string
  ): Promise<PasswordTestResult> {
    const startTime = Date.now();

    try {
      // Test our hashPassword function
      const hashedPassword = await hashPassword(password);
      const duration = Date.now() - startTime;

      // Verify the hash is valid bcrypt format
      const isValidBcryptHash = /^\$2[ayb]\$\d{1,2}\$[A-Za-z0-9./]{53}$/.test(
        hashedPassword
      );

      // Test that we can compare against the hash
      const canCompare = await bcrypt.compare(password, hashedPassword);

      const result: PasswordTestResult = {
        success: true,
        duration,
        details: {
          hashedPassword: hashedPassword.substring(0, 20) + '...', // Truncate for security
          isValidBcryptFormat: isValidBcryptHash,
          canCompareSuccessfully: canCompare,
          passwordLength: password.length,
          hashLength: hashedPassword.length,
        },
      };

      AuthLogger.logPasswordOperation('hash', true, duration, { requestId });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      AuthLogger.logPasswordOperation('hash', false, duration, {
        requestId,
        errorMessage,
      });

      return {
        success: false,
        duration,
        error: errorMessage,
      };
    }
  }

  /**
   * Test password comparison function
   */
  static async testPasswordComparison(
    plainPassword: string,
    hashedPassword: string,
    requestId?: string
  ): Promise<PasswordTestResult> {
    const startTime = Date.now();

    try {
      // Test our comparePassword function
      const isMatch = await comparePassword(plainPassword, hashedPassword);
      const duration = Date.now() - startTime;

      // Also test direct bcrypt comparison for comparison
      const directBcryptResult = await bcrypt.compare(
        plainPassword,
        hashedPassword
      );

      const result: PasswordTestResult = {
        success: true,
        duration,
        details: {
          passwordsMatch: isMatch,
          directBcryptMatch: directBcryptResult,
          resultsConsistent: isMatch === directBcryptResult,
          plainPasswordLength: plainPassword.length,
          hashedPasswordLength: hashedPassword.length,
          isValidBcryptHash: /^\$2[ayb]\$\d{1,2}\$[A-Za-z0-9./]{53}$/.test(
            hashedPassword
          ),
        },
      };

      AuthLogger.logPasswordOperation('compare', true, duration, { requestId });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      AuthLogger.logPasswordOperation('compare', false, duration, {
        requestId,
        errorMessage,
      });

      return {
        success: false,
        duration,
        error: errorMessage,
      };
    }
  }

  /**
   * Test complete password flow (hash then compare)
   */
  static async testCompletePasswordFlow(
    password: string,
    requestId?: string
  ): Promise<{
    hashTest: PasswordTestResult;
    compareTest: PasswordTestResult;
    overallSuccess: boolean;
  }> {
    // First test hashing
    const hashTest = await this.testPasswordHashing(password, requestId);

    if (!hashTest.success || !hashTest.details?.hashedPassword) {
      return {
        hashTest,
        compareTest: {
          success: false,
          duration: 0,
          error: 'Cannot test comparison - hashing failed',
        },
        overallSuccess: false,
      };
    }

    // Extract the full hash (we truncated it in the details for security)
    const hashedPassword = await hashPassword(password);

    // Then test comparison
    const compareTest = await this.testPasswordComparison(
      password,
      hashedPassword,
      requestId
    );

    return {
      hashTest,
      compareTest,
      overallSuccess: hashTest.success && compareTest.success,
    };
  }

  /**
   * Test database user lookup functionality
   */
  static async testUserLookup(
    email: string,
    requestId?: string
  ): Promise<DatabaseTestResult> {
    const startTime = Date.now();

    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          username: true,
          createdAt: true,
          // Don't select password for security
        },
      });

      const duration = Date.now() - startTime;

      AuthLogger.logDatabaseOperation('user_lookup', true, duration, {
        requestId,
        email,
        query: 'findUnique by email',
      });

      return {
        success: true,
        duration,
        result: user,
        query: 'prisma.user.findUnique({ where: { email } })',
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      AuthLogger.logDatabaseOperation('user_lookup', false, duration, {
        requestId,
        email,
        errorMessage,
        query: 'findUnique by email',
      });

      return {
        success: false,
        duration,
        error: errorMessage,
        query: 'prisma.user.findUnique({ where: { email } })',
      };
    }
  }

  /**
   * Test JWT token generation and verification
   */
  static async testJWTFlow(
    mockUser: { id: string; email: string; username: string },
    requestId?: string
  ): Promise<{
    generateTest: JWTTestResult;
    verifyAccessTest: JWTTestResult;
    verifyRefreshTest: JWTTestResult;
    overallSuccess: boolean;
  }> {
    const startTime = Date.now();

    try {
      // Test token generation
      const tokens = generateTokens(mockUser as any);
      const generateDuration = Date.now() - startTime;

      const generateTest: JWTTestResult = {
        success: true,
        duration: generateDuration,
        token: tokens.accessToken.substring(0, 20) + '...', // Truncate for security
      };

      AuthLogger.logTokenOperation('generate', true, {
        requestId,
        userId: mockUser.id,
      });

      // Test access token verification
      const verifyStartTime = Date.now();
      try {
        const accessPayload = await verifyAccessToken(tokens.accessToken);
        const verifyAccessDuration = Date.now() - verifyStartTime;

        const verifyAccessTest: JWTTestResult = {
          success: true,
          duration: verifyAccessDuration,
          payload: {
            userId: accessPayload.userId,
            email: accessPayload.email,
            username: accessPayload.username,
          },
        };

        AuthLogger.logTokenOperation('verify', true, {
          requestId,
          userId: mockUser.id,
          tokenType: 'access',
        });

        // Test refresh token verification
        const refreshStartTime = Date.now();
        try {
          const refreshPayload = await verifyRefreshToken(tokens.refreshToken);
          const verifyRefreshDuration = Date.now() - refreshStartTime;

          const verifyRefreshTest: JWTTestResult = {
            success: true,
            duration: verifyRefreshDuration,
            payload: {
              userId: refreshPayload.userId,
              email: refreshPayload.email,
              username: refreshPayload.username,
            },
          };

          AuthLogger.logTokenOperation('verify', true, {
            requestId,
            userId: mockUser.id,
            tokenType: 'refresh',
          });

          return {
            generateTest,
            verifyAccessTest,
            verifyRefreshTest,
            overallSuccess: true,
          };
        } catch (error) {
          const verifyRefreshDuration = Date.now() - refreshStartTime;
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';

          AuthLogger.logTokenOperation('verify', false, {
            requestId,
            userId: mockUser.id,
            tokenType: 'refresh',
            errorMessage,
          });

          return {
            generateTest,
            verifyAccessTest,
            verifyRefreshTest: {
              success: false,
              duration: verifyRefreshDuration,
              error: errorMessage,
            },
            overallSuccess: false,
          };
        }
      } catch (error) {
        const verifyAccessDuration = Date.now() - verifyStartTime;
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';

        AuthLogger.logTokenOperation('verify', false, {
          requestId,
          userId: mockUser.id,
          tokenType: 'access',
          errorMessage,
        });

        return {
          generateTest,
          verifyAccessTest: {
            success: false,
            duration: verifyAccessDuration,
            error: errorMessage,
          },
          verifyRefreshTest: {
            success: false,
            duration: 0,
            error: 'Skipped due to access token verification failure',
          },
          overallSuccess: false,
        };
      }
    } catch (error) {
      const generateDuration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      AuthLogger.logTokenOperation('generate', false, {
        requestId,
        userId: mockUser.id,
        errorMessage,
      });

      return {
        generateTest: {
          success: false,
          duration: generateDuration,
          error: errorMessage,
        },
        verifyAccessTest: {
          success: false,
          duration: 0,
          error: 'Skipped due to token generation failure',
        },
        verifyRefreshTest: {
          success: false,
          duration: 0,
          error: 'Skipped due to token generation failure',
        },
        overallSuccess: false,
      };
    }
  }

  /**
   * Run comprehensive authentication system test
   */
  static async runComprehensiveTest(
    testEmail: string = 'test@example.com',
    testPassword: string = 'TestPassword123!',
    requestId?: string
  ): Promise<{
    passwordFlow: {
      hashTest: PasswordTestResult;
      compareTest: PasswordTestResult;
      overallSuccess: boolean;
    };
    userLookup: DatabaseTestResult;
    jwtFlow: {
      generateTest: JWTTestResult;
      verifyAccessTest: JWTTestResult;
      verifyRefreshTest: JWTTestResult;
      overallSuccess: boolean;
    };
    overallSuccess: boolean;
    summary: string;
  }> {
    const testRequestId = requestId || AuthLogger.generateRequestId();

    console.log(
      `🔍 Running comprehensive auth test with request ID: ${testRequestId}`
    );

    // Test password flow
    const passwordFlow = await this.testCompletePasswordFlow(
      testPassword,
      testRequestId
    );

    // Test user lookup
    const userLookup = await this.testUserLookup(testEmail, testRequestId);

    // Test JWT flow with mock user
    const mockUser = {
      id: 'test-user-id',
      email: testEmail,
      username: 'testuser',
    };
    const jwtFlow = await this.testJWTFlow(mockUser, testRequestId);

    const overallSuccess =
      passwordFlow.overallSuccess &&
      userLookup.success &&
      jwtFlow.overallSuccess;

    const summary = `
Auth System Test Summary (Request ID: ${testRequestId})
=======================================================
Password Hashing: ${passwordFlow.hashTest.success ? '✅' : '❌'} (${passwordFlow.hashTest.duration}ms)
Password Comparison: ${passwordFlow.compareTest.success ? '✅' : '❌'} (${passwordFlow.compareTest.duration}ms)
User Lookup: ${userLookup.success ? '✅' : '❌'} (${userLookup.duration}ms)
JWT Generation: ${jwtFlow.generateTest.success ? '✅' : '❌'} (${jwtFlow.generateTest.duration}ms)
JWT Access Verification: ${jwtFlow.verifyAccessTest.success ? '✅' : '❌'} (${jwtFlow.verifyAccessTest.duration}ms)
JWT Refresh Verification: ${jwtFlow.verifyRefreshTest.success ? '✅' : '❌'} (${jwtFlow.verifyRefreshTest.duration}ms)

Overall Result: ${overallSuccess ? '✅ PASS' : '❌ FAIL'}
    `.trim();

    console.log(summary);

    return {
      passwordFlow,
      userLookup,
      jwtFlow,
      overallSuccess,
      summary,
    };
  }
}
