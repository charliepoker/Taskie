import { prisma } from '../utils/database';
import { AuthLogger } from '../utils/authLogger';

export interface AuthAttemptRecord {
  id: string;
  email: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  errorCode?: string;
  timestamp: Date;
  requestId?: string;
}

export interface SecurityMetrics {
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  successRate: number;
  suspiciousActivityCount: number;
  topFailureReasons: Array<{ reason: string; count: number }>;
  topFailureIPs: Array<{ ip: string; count: number }>;
}

export interface SuspiciousActivity {
  type:
    | 'brute_force'
    | 'credential_stuffing'
    | 'unusual_location'
    | 'rapid_attempts';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  ipAddress: string;
  email?: string;
  attemptCount: number;
  timeWindow: string;
  firstSeen: Date;
  lastSeen: Date;
}

export class AuthMonitoringService {
  private readonly FAILED_ATTEMPT_THRESHOLD = 5;
  private readonly TIME_WINDOW_MINUTES = 15;
  private readonly RAPID_ATTEMPT_THRESHOLD = 10;
  private readonly RAPID_ATTEMPT_WINDOW_MINUTES = 5;

  /**
   * Record an authentication attempt for monitoring
   */
  async recordAuthAttempt(
    email: string,
    ipAddress: string,
    userAgent: string,
    success: boolean,
    errorCode?: string,
    requestId?: string
  ): Promise<void> {
    try {
      // Store in database for analysis
      await prisma.authAttempt.create({
        data: {
          email,
          ipAddress,
          userAgent,
          success,
          errorCode,
          requestId,
          timestamp: new Date(),
        },
      });

      // Log the attempt
      AuthLogger.logAuthAttempt({
        requestId,
        email,
        ipAddress,
        userAgent,
        action: 'auth_attempt_recorded',
        success: true,
        additionalData: {
          attemptSuccess: success,
          errorCode,
        },
      });

      // Check for suspicious activity
      await this.checkForSuspiciousActivity(email, ipAddress);
    } catch (error) {
      AuthLogger.logAuthError({
        requestId,
        email,
        ipAddress,
        action: 'record_auth_attempt',
        success: false,
        error:
          error instanceof Error
            ? error
            : new Error('Failed to record auth attempt'),
        errorCode: 'MONITORING_ERROR',
      });
    }
  }

  /**
   * Get authentication metrics for a time period
   */
  async getAuthMetrics(
    startDate: Date,
    endDate: Date = new Date()
  ): Promise<SecurityMetrics> {
    try {
      const attempts = await prisma.authAttempt.findMany({
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      const totalAttempts = attempts.length;
      const successfulAttempts = attempts.filter((a) => a.success).length;
      const failedAttempts = totalAttempts - successfulAttempts;
      const successRate =
        totalAttempts > 0 ? (successfulAttempts / totalAttempts) * 100 : 0;

      // Count failure reasons
      const failureReasons = new Map<string, number>();
      const failureIPs = new Map<string, number>();

      attempts
        .filter((a) => !a.success)
        .forEach((attempt) => {
          const reason = attempt.errorCode || 'UNKNOWN';
          failureReasons.set(reason, (failureReasons.get(reason) || 0) + 1);
          failureIPs.set(
            attempt.ipAddress,
            (failureIPs.get(attempt.ipAddress) || 0) + 1
          );
        });

      const topFailureReasons = Array.from(failureReasons.entries())
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const topFailureIPs = Array.from(failureIPs.entries())
        .map(([ip, count]) => ({ ip, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Count suspicious activities
      const suspiciousActivityCount = await this.getSuspiciousActivityCount(
        startDate,
        endDate
      );

      return {
        totalAttempts,
        successfulAttempts,
        failedAttempts,
        successRate,
        suspiciousActivityCount,
        topFailureReasons,
        topFailureIPs,
      };
    } catch (error) {
      AuthLogger.logAuthError({
        action: 'get_auth_metrics',
        success: false,
        error:
          error instanceof Error
            ? error
            : new Error('Failed to get auth metrics'),
        errorCode: 'METRICS_ERROR',
      });
      throw error;
    }
  }

  /**
   * Check for suspicious authentication activity
   */
  private async checkForSuspiciousActivity(
    email: string,
    ipAddress: string
  ): Promise<void> {
    const now = new Date();
    const timeWindowStart = new Date(
      now.getTime() - this.TIME_WINDOW_MINUTES * 60 * 1000
    );
    const rapidWindowStart = new Date(
      now.getTime() - this.RAPID_ATTEMPT_WINDOW_MINUTES * 60 * 1000
    );

    try {
      // Check for brute force attempts by IP
      const recentFailuresByIP = await prisma.authAttempt.count({
        where: {
          ipAddress,
          success: false,
          timestamp: {
            gte: timeWindowStart,
          },
        },
      });

      if (recentFailuresByIP >= this.FAILED_ATTEMPT_THRESHOLD) {
        await this.recordSuspiciousActivity({
          type: 'brute_force',
          severity: recentFailuresByIP >= 10 ? 'high' : 'medium',
          description: `${recentFailuresByIP} failed login attempts from IP ${ipAddress} in ${this.TIME_WINDOW_MINUTES} minutes`,
          ipAddress,
          email,
          attemptCount: recentFailuresByIP,
          timeWindow: `${this.TIME_WINDOW_MINUTES} minutes`,
          firstSeen: timeWindowStart,
          lastSeen: now,
        });
      }

      // Check for brute force attempts by email
      const recentFailuresByEmail = await prisma.authAttempt.count({
        where: {
          email,
          success: false,
          timestamp: {
            gte: timeWindowStart,
          },
        },
      });

      if (recentFailuresByEmail >= this.FAILED_ATTEMPT_THRESHOLD) {
        await this.recordSuspiciousActivity({
          type: 'credential_stuffing',
          severity: recentFailuresByEmail >= 10 ? 'high' : 'medium',
          description: `${recentFailuresByEmail} failed login attempts for email ${email} in ${this.TIME_WINDOW_MINUTES} minutes`,
          ipAddress,
          email,
          attemptCount: recentFailuresByEmail,
          timeWindow: `${this.TIME_WINDOW_MINUTES} minutes`,
          firstSeen: timeWindowStart,
          lastSeen: now,
        });
      }

      // Check for rapid attempts from same IP
      const rapidAttempts = await prisma.authAttempt.count({
        where: {
          ipAddress,
          timestamp: {
            gte: rapidWindowStart,
          },
        },
      });

      if (rapidAttempts >= this.RAPID_ATTEMPT_THRESHOLD) {
        await this.recordSuspiciousActivity({
          type: 'rapid_attempts',
          severity: 'medium',
          description: `${rapidAttempts} authentication attempts from IP ${ipAddress} in ${this.RAPID_ATTEMPT_WINDOW_MINUTES} minutes`,
          ipAddress,
          email,
          attemptCount: rapidAttempts,
          timeWindow: `${this.RAPID_ATTEMPT_WINDOW_MINUTES} minutes`,
          firstSeen: rapidWindowStart,
          lastSeen: now,
        });
      }
    } catch (error) {
      AuthLogger.logAuthError({
        email,
        ipAddress,
        action: 'check_suspicious_activity',
        success: false,
        error:
          error instanceof Error
            ? error
            : new Error('Failed to check suspicious activity'),
        errorCode: 'SUSPICIOUS_ACTIVITY_CHECK_ERROR',
      });
    }
  }

  /**
   * Record suspicious activity
   */
  private async recordSuspiciousActivity(
    activity: SuspiciousActivity
  ): Promise<void> {
    try {
      await prisma.suspiciousActivity.create({
        data: {
          type: activity.type,
          severity: activity.severity,
          description: activity.description,
          ipAddress: activity.ipAddress,
          email: activity.email,
          attemptCount: activity.attemptCount,
          timeWindow: activity.timeWindow,
          firstSeen: activity.firstSeen,
          lastSeen: activity.lastSeen,
        },
      });

      // Log security event
      AuthLogger.logSecurityEvent('suspicious_activity', {
        ipAddress: activity.ipAddress,
        email: activity.email,
        attemptCount: activity.attemptCount,
        additionalData: {
          type: activity.type,
          severity: activity.severity,
          description: activity.description,
          timeWindow: activity.timeWindow,
        },
      });

      // Send alert for high/critical severity
      if (activity.severity === 'high' || activity.severity === 'critical') {
        await this.sendSecurityAlert(activity);
      }
    } catch (error) {
      AuthLogger.logAuthError({
        ipAddress: activity.ipAddress,
        email: activity.email,
        action: 'record_suspicious_activity',
        success: false,
        error:
          error instanceof Error
            ? error
            : new Error('Failed to record suspicious activity'),
        errorCode: 'RECORD_SUSPICIOUS_ACTIVITY_ERROR',
      });
    }
  }

  /**
   * Send security alert for high-priority events
   */
  private async sendSecurityAlert(activity: SuspiciousActivity): Promise<void> {
    // TODO: Implement actual alerting mechanism (email, Slack, etc.)
    console.log(`🚨 SECURITY ALERT: ${activity.type.toUpperCase()}`);
    console.log(`Severity: ${activity.severity.toUpperCase()}`);
    console.log(`Description: ${activity.description}`);
    console.log(`IP Address: ${activity.ipAddress}`);
    console.log(`Email: ${activity.email || 'N/A'}`);
    console.log(`Time Window: ${activity.timeWindow}`);
    console.log(`Attempt Count: ${activity.attemptCount}`);
  }

  /**
   * Get count of suspicious activities in time period
   */
  private async getSuspiciousActivityCount(
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    return await prisma.suspiciousActivity.count({
      where: {
        firstSeen: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
  }

  /**
   * Get recent suspicious activities
   */
  async getRecentSuspiciousActivities(
    limit: number = 50
  ): Promise<SuspiciousActivity[]> {
    try {
      const activities = await prisma.suspiciousActivity.findMany({
        orderBy: {
          lastSeen: 'desc',
        },
        take: limit,
      });

      return activities.map((activity) => ({
        type: activity.type as SuspiciousActivity['type'],
        severity: activity.severity as SuspiciousActivity['severity'],
        description: activity.description,
        ipAddress: activity.ipAddress,
        email: activity.email || undefined,
        attemptCount: activity.attemptCount,
        timeWindow: activity.timeWindow,
        firstSeen: activity.firstSeen,
        lastSeen: activity.lastSeen,
      }));
    } catch (error) {
      AuthLogger.logAuthError({
        action: 'get_recent_suspicious_activities',
        success: false,
        error:
          error instanceof Error
            ? error
            : new Error('Failed to get suspicious activities'),
        errorCode: 'GET_SUSPICIOUS_ACTIVITIES_ERROR',
      });
      throw error;
    }
  }

  /**
   * Check if IP address is currently blocked due to suspicious activity
   */
  async isIPBlocked(ipAddress: string): Promise<boolean> {
    const now = new Date();
    const blockWindowStart = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour

    try {
      const recentHighSeverityActivity = await prisma.suspiciousActivity.count({
        where: {
          ipAddress,
          severity: {
            in: ['high', 'critical'],
          },
          lastSeen: {
            gte: blockWindowStart,
          },
        },
      });

      return recentHighSeverityActivity > 0;
    } catch (error) {
      AuthLogger.logAuthError({
        ipAddress,
        action: 'check_ip_blocked',
        success: false,
        error:
          error instanceof Error
            ? error
            : new Error('Failed to check IP block status'),
        errorCode: 'IP_BLOCK_CHECK_ERROR',
      });
      return false; // Fail open for availability
    }
  }

  /**
   * Get authentication success/failure rates over time
   */
  async getAuthRatesOverTime(
    startDate: Date,
    endDate: Date,
    intervalMinutes: number = 60
  ): Promise<
    Array<{ timestamp: Date; successRate: number; totalAttempts: number }>
  > {
    try {
      const intervalMs = intervalMinutes * 60 * 1000;
      const intervals: Array<{
        timestamp: Date;
        successRate: number;
        totalAttempts: number;
      }> = [];

      let currentTime = new Date(startDate);
      while (currentTime < endDate) {
        const intervalEnd = new Date(currentTime.getTime() + intervalMs);

        const attempts = await prisma.authAttempt.findMany({
          where: {
            timestamp: {
              gte: currentTime,
              lt: intervalEnd,
            },
          },
        });

        const totalAttempts = attempts.length;
        const successfulAttempts = attempts.filter((a) => a.success).length;
        const successRate =
          totalAttempts > 0 ? (successfulAttempts / totalAttempts) * 100 : 0;

        intervals.push({
          timestamp: new Date(currentTime),
          successRate,
          totalAttempts,
        });

        currentTime = intervalEnd;
      }

      return intervals;
    } catch (error) {
      AuthLogger.logAuthError({
        action: 'get_auth_rates_over_time',
        success: false,
        error:
          error instanceof Error
            ? error
            : new Error('Failed to get auth rates over time'),
        errorCode: 'AUTH_RATES_ERROR',
      });
      throw error;
    }
  }
}
