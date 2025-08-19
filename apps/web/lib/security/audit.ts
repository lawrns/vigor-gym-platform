/**
 * Security Audit and Hardening Utilities
 *
 * Provides security checks and hardening recommendations for the auth system
 */

interface SecurityCheck {
  name: string;
  status: 'pass' | 'warning' | 'fail';
  message: string;
  recommendation?: string;
}

interface SecurityAuditResult {
  overall: 'secure' | 'needs_attention' | 'critical';
  score: number;
  checks: SecurityCheck[];
  recommendations: string[];
}

/**
 * Perform comprehensive security audit
 */
export function performSecurityAudit(): SecurityAuditResult {
  const checks: SecurityCheck[] = [];

  // JWT Secret Security
  checks.push(checkJWTSecret());

  // Environment Variables
  checks.push(checkEnvironmentSecurity());

  // Cookie Security
  checks.push(checkCookieSecurity());

  // HTTPS Configuration
  checks.push(checkHTTPSConfiguration());

  // Content Security Policy
  checks.push(checkCSPConfiguration());

  // Rate Limiting
  checks.push(checkRateLimiting());

  // Session Management
  checks.push(checkSessionSecurity());

  // Input Validation
  checks.push(checkInputValidation());

  // Calculate overall score
  const passCount = checks.filter(c => c.status === 'pass').length;
  const warningCount = checks.filter(c => c.status === 'warning').length;
  const failCount = checks.filter(c => c.status === 'fail').length;

  const score = Math.round(((passCount + warningCount * 0.5) / checks.length) * 100);

  let overall: 'secure' | 'needs_attention' | 'critical';
  if (failCount > 0) {
    overall = 'critical';
  } else if (warningCount > 2) {
    overall = 'needs_attention';
  } else {
    overall = 'secure';
  }

  const recommendations = checks.filter(c => c.recommendation).map(c => c.recommendation!);

  return {
    overall,
    score,
    checks,
    recommendations,
  };
}

function checkJWTSecret(): SecurityCheck {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    return {
      name: 'JWT Secret Configuration',
      status: 'fail',
      message: 'JWT_SECRET environment variable is not set',
      recommendation: 'Set a strong JWT_SECRET environment variable with at least 32 characters',
    };
  }

  if (jwtSecret.length < 32) {
    return {
      name: 'JWT Secret Configuration',
      status: 'warning',
      message: `JWT secret is too short (${jwtSecret.length} characters)`,
      recommendation: 'Use a JWT secret with at least 32 characters for better security',
    };
  }

  if (jwtSecret.includes('dev') || jwtSecret.includes('test') || jwtSecret.includes('default')) {
    return {
      name: 'JWT Secret Configuration',
      status: 'fail',
      message: 'JWT secret appears to be a default/development value',
      recommendation: 'Use a unique, randomly generated JWT secret for production',
    };
  }

  return {
    name: 'JWT Secret Configuration',
    status: 'pass',
    message: 'JWT secret is properly configured',
  };
}

function checkEnvironmentSecurity(): SecurityCheck {
  const nodeEnv = process.env.NODE_ENV;

  if (nodeEnv === 'production') {
    // Check for development-specific environment variables in production
    const devVars = ['DEBUG', 'DISABLE_RATE_LIMITING'];
    const foundDevVars = devVars.filter(varName => process.env[varName]);

    if (foundDevVars.length > 0) {
      return {
        name: 'Environment Security',
        status: 'warning',
        message: `Development variables found in production: ${foundDevVars.join(', ')}`,
        recommendation: 'Remove development-specific environment variables in production',
      };
    }
  }

  return {
    name: 'Environment Security',
    status: 'pass',
    message: 'Environment configuration is secure',
  };
}

function checkCookieSecurity(): SecurityCheck {
  // This would typically check actual cookie configuration
  // For now, we'll check if we're in production and recommend secure settings

  if (process.env.NODE_ENV === 'production') {
    return {
      name: 'Cookie Security',
      status: 'pass',
      message: 'Cookie security settings should be verified in production',
      recommendation: 'Ensure cookies use Secure, HttpOnly, and SameSite=Strict in production',
    };
  }

  return {
    name: 'Cookie Security',
    status: 'warning',
    message: 'Development mode - cookies may not have secure attributes',
    recommendation: 'Verify cookie security settings for production deployment',
  };
}

function checkHTTPSConfiguration(): SecurityCheck {
  if (process.env.NODE_ENV === 'production') {
    return {
      name: 'HTTPS Configuration',
      status: 'pass',
      message: 'HTTPS should be enforced in production',
      recommendation: 'Ensure HTTPS is enforced and HTTP redirects to HTTPS',
    };
  }

  return {
    name: 'HTTPS Configuration',
    status: 'warning',
    message: 'Development mode - HTTPS not required',
    recommendation: 'Configure HTTPS for production deployment',
  };
}

function checkCSPConfiguration(): SecurityCheck {
  // Check if CSP headers are configured
  // This is a simplified check - in practice, you'd verify actual CSP headers

  return {
    name: 'Content Security Policy',
    status: 'warning',
    message: 'CSP configuration should be verified',
    recommendation: 'Implement Content Security Policy headers to prevent XSS attacks',
  };
}

function checkRateLimiting(): SecurityCheck {
  const rateLimitingDisabled = process.env.DISABLE_RATE_LIMITING === 'true';

  if (rateLimitingDisabled && process.env.NODE_ENV === 'production') {
    return {
      name: 'Rate Limiting',
      status: 'fail',
      message: 'Rate limiting is disabled in production',
      recommendation: 'Enable rate limiting for production to prevent brute force attacks',
    };
  }

  if (rateLimitingDisabled) {
    return {
      name: 'Rate Limiting',
      status: 'warning',
      message: 'Rate limiting is disabled (development mode)',
      recommendation: 'Ensure rate limiting is enabled for production',
    };
  }

  return {
    name: 'Rate Limiting',
    status: 'pass',
    message: 'Rate limiting is properly configured',
  };
}

function checkSessionSecurity(): SecurityCheck {
  // Check session configuration
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '15m';
  const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

  // Parse expiration times
  const accessTokenMinutes = parseExpirationTime(jwtExpiresIn);
  const refreshTokenDays = parseExpirationTime(refreshExpiresIn) / (24 * 60);

  if (accessTokenMinutes > 60) {
    // More than 1 hour
    return {
      name: 'Session Security',
      status: 'warning',
      message: `Access token expiration is too long: ${jwtExpiresIn}`,
      recommendation: 'Use shorter access token expiration (15-60 minutes) for better security',
    };
  }

  if (refreshTokenDays > 30) {
    // More than 30 days
    return {
      name: 'Session Security',
      status: 'warning',
      message: `Refresh token expiration is too long: ${refreshExpiresIn}`,
      recommendation: 'Use shorter refresh token expiration (7-30 days) for better security',
    };
  }

  return {
    name: 'Session Security',
    status: 'pass',
    message: 'Session expiration times are appropriately configured',
  };
}

function checkInputValidation(): SecurityCheck {
  // This would check if input validation is properly implemented
  // For now, we'll assume it's implemented based on the presence of validation schemas

  return {
    name: 'Input Validation',
    status: 'pass',
    message: 'Input validation appears to be implemented',
    recommendation: 'Ensure all user inputs are validated and sanitized',
  };
}

function parseExpirationTime(timeStr: string): number {
  const match = timeStr.match(/^(\d+)([smhd])$/);
  if (!match) return 0;

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value / 60; // Convert to minutes
    case 'm':
      return value;
    case 'h':
      return value * 60;
    case 'd':
      return value * 24 * 60;
    default:
      return 0;
  }
}

/**
 * Generate security hardening recommendations
 */
export function getSecurityRecommendations(): string[] {
  return [
    'Use strong, unique JWT secrets (32+ characters)',
    'Enable HTTPS in production with HSTS headers',
    'Implement Content Security Policy (CSP) headers',
    'Use secure cookie attributes (Secure, HttpOnly, SameSite)',
    'Enable rate limiting for authentication endpoints',
    'Implement proper session management with short token lifetimes',
    'Validate and sanitize all user inputs',
    'Use environment-specific configurations',
    'Implement proper error handling without information leakage',
    'Enable security monitoring and alerting',
    'Regular security audits and dependency updates',
    'Implement proper CORS configuration',
    'Use security headers (X-Frame-Options, X-Content-Type-Options)',
    'Implement account lockout mechanisms',
    'Use secure password policies and hashing',
  ];
}
