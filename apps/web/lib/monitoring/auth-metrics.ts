/**
 * Auth Flow Performance Monitoring
 *
 * Tracks key metrics for authentication flows including:
 * - Login success/failure rates
 * - Session duration
 * - Redirect performance
 * - Error patterns
 */

interface AuthMetric {
  timestamp: number;
  event: string;
  duration?: number;
  success: boolean;
  error?: string;
  userAgent?: string;
  sessionId?: string;
}

interface AuthMetrics {
  loginAttempts: number;
  loginSuccesses: number;
  loginFailures: number;
  averageLoginTime: number;
  averageSessionDuration: number;
  redirectPerformance: number;
  errorPatterns: Record<string, number>;
}

class AuthMetricsCollector {
  private metrics: AuthMetric[] = [];
  private sessionStartTimes: Map<string, number> = new Map();
  private isEnabled: boolean;

  constructor() {
    // Only enable in production or when explicitly enabled
    this.isEnabled =
      process.env.NODE_ENV === 'production' || process.env.ENABLE_AUTH_METRICS === 'true';
  }

  /**
   * Track login attempt
   */
  trackLoginAttempt(email: string, startTime: number = Date.now()) {
    if (!this.isEnabled) return;

    this.addMetric({
      timestamp: startTime,
      event: 'login_attempt',
      success: false, // Will be updated on success/failure
    });
  }

  /**
   * Track successful login
   */
  trackLoginSuccess(
    email: string,
    sessionId: string,
    startTime: number,
    endTime: number = Date.now()
  ) {
    if (!this.isEnabled) return;

    const duration = endTime - startTime;

    this.addMetric({
      timestamp: endTime,
      event: 'login_success',
      duration,
      success: true,
      sessionId,
    });

    // Track session start for duration calculation
    this.sessionStartTimes.set(sessionId, endTime);

    // Log performance warning if login is slow
    if (duration > 3000) {
      console.warn(`[AUTH_METRICS] Slow login detected: ${duration}ms for ${email}`);
    }
  }

  /**
   * Track failed login
   */
  trackLoginFailure(email: string, error: string, startTime: number, endTime: number = Date.now()) {
    if (!this.isEnabled) return;

    const duration = endTime - startTime;

    this.addMetric({
      timestamp: endTime,
      event: 'login_failure',
      duration,
      success: false,
      error,
    });

    // Track error patterns
    this.incrementErrorPattern(error);
  }

  /**
   * Track redirect performance
   */
  trackRedirect(from: string, to: string, startTime: number, endTime: number = Date.now()) {
    if (!this.isEnabled) return;

    const duration = endTime - startTime;

    this.addMetric({
      timestamp: endTime,
      event: 'redirect',
      duration,
      success: true,
      error: `${from} -> ${to}`,
    });

    // Log performance warning if redirect is slow
    if (duration > 1000) {
      console.warn(`[AUTH_METRICS] Slow redirect detected: ${duration}ms from ${from} to ${to}`);
    }
  }

  /**
   * Track session end
   */
  trackSessionEnd(sessionId: string, endTime: number = Date.now()) {
    if (!this.isEnabled) return;

    const startTime = this.sessionStartTimes.get(sessionId);
    if (startTime) {
      const duration = endTime - startTime;

      this.addMetric({
        timestamp: endTime,
        event: 'session_end',
        duration,
        success: true,
        sessionId,
      });

      this.sessionStartTimes.delete(sessionId);

      // Log unusually short sessions
      if (duration < 30000) {
        // Less than 30 seconds
        console.warn(
          `[AUTH_METRICS] Short session detected: ${duration}ms for session ${sessionId}`
        );
      }
    }
  }

  /**
   * Track middleware performance
   */
  trackMiddleware(path: string, hasSession: boolean, action: string, duration: number) {
    if (!this.isEnabled) return;

    this.addMetric({
      timestamp: Date.now(),
      event: 'middleware',
      duration,
      success: true,
      error: `${path}|${hasSession}|${action}`,
    });

    // Log slow middleware
    if (duration > 100) {
      console.warn(`[AUTH_METRICS] Slow middleware: ${duration}ms for ${path}`);
    }
  }

  /**
   * Get current metrics summary
   */
  getMetrics(): AuthMetrics {
    const loginAttempts = this.metrics.filter(m => m.event === 'login_attempt').length;
    const loginSuccesses = this.metrics.filter(m => m.event === 'login_success').length;
    const loginFailures = this.metrics.filter(m => m.event === 'login_failure').length;

    const loginTimes = this.metrics
      .filter(m => m.event === 'login_success' && m.duration)
      .map(m => m.duration!);

    const sessionDurations = this.metrics
      .filter(m => m.event === 'session_end' && m.duration)
      .map(m => m.duration!);

    const redirectTimes = this.metrics
      .filter(m => m.event === 'redirect' && m.duration)
      .map(m => m.duration!);

    const errorPatterns: Record<string, number> = {};
    this.metrics
      .filter(m => m.event === 'login_failure' && m.error)
      .forEach(m => {
        errorPatterns[m.error!] = (errorPatterns[m.error!] || 0) + 1;
      });

    return {
      loginAttempts,
      loginSuccesses,
      loginFailures,
      averageLoginTime: this.average(loginTimes),
      averageSessionDuration: this.average(sessionDurations),
      redirectPerformance: this.average(redirectTimes),
      errorPatterns,
    };
  }

  /**
   * Get metrics for the last N minutes
   */
  getRecentMetrics(minutes: number = 60): AuthMetrics {
    const cutoff = Date.now() - minutes * 60 * 1000;
    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoff);

    // Temporarily replace metrics array to calculate recent stats
    const originalMetrics = this.metrics;
    this.metrics = recentMetrics;
    const result = this.getMetrics();
    this.metrics = originalMetrics;

    return result;
  }

  /**
   * Clear old metrics (keep last 24 hours)
   */
  cleanup() {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);

    // Clean up old session start times
    for (const [sessionId, startTime] of this.sessionStartTimes.entries()) {
      if (startTime < cutoff) {
        this.sessionStartTimes.delete(sessionId);
      }
    }
  }

  /**
   * Export metrics for external monitoring
   */
  exportMetrics(): AuthMetric[] {
    return [...this.metrics];
  }

  private addMetric(metric: Omit<AuthMetric, 'userAgent'>) {
    this.metrics.push({
      ...metric,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
    });

    // Auto-cleanup if we have too many metrics
    if (this.metrics.length > 10000) {
      this.cleanup();
    }
  }

  private incrementErrorPattern(error: string) {
    // This is handled in getMetrics() for simplicity
  }

  private average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  }
}

// Global instance
export const authMetrics = new AuthMetricsCollector();

// Convenience functions for common use cases
export const trackLoginStart = () => Date.now();

export const trackLoginSuccess = (email: string, sessionId: string, startTime: number) => {
  authMetrics.trackLoginSuccess(email, sessionId, startTime);
};

export const trackLoginFailure = (email: string, error: string, startTime: number) => {
  authMetrics.trackLoginFailure(email, error, startTime);
};

export const trackRedirectStart = () => Date.now();

export const trackRedirectEnd = (from: string, to: string, startTime: number) => {
  authMetrics.trackRedirect(from, to, startTime);
};

export const getAuthMetrics = () => authMetrics.getMetrics();

export const getRecentAuthMetrics = (minutes?: number) => authMetrics.getRecentMetrics(minutes);
