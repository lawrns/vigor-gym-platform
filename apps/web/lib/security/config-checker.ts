/**
 * Security Configuration Checker
 *
 * Validates security configurations at startup and provides warnings
 */

interface SecurityConfig {
  jwtSecret: string;
  nodeEnv: string;
  corsOrigin: string;
  rateLimitingEnabled: boolean;
  httpsEnabled: boolean;
}

interface SecurityValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  recommendations: string[];
}

/**
 * Validate security configuration at startup
 */
export function validateSecurityConfig(): SecurityValidationResult {
  const config = getSecurityConfig();
  const result: SecurityValidationResult = {
    isValid: true,
    warnings: [],
    errors: [],
    recommendations: [],
  };

  // Validate JWT Secret
  validateJWTSecret(config, result);

  // Validate Environment Configuration
  validateEnvironment(config, result);

  // Validate CORS Configuration
  validateCORS(config, result);

  // Validate Rate Limiting
  validateRateLimiting(config, result);

  // Validate HTTPS Configuration
  validateHTTPS(config, result);

  // Set overall validity
  result.isValid = result.errors.length === 0;

  return result;
}

function getSecurityConfig(): SecurityConfig {
  return {
    jwtSecret: process.env.JWT_SECRET || '',
    nodeEnv: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || process.env.CORS_ORIGINS || '',
    rateLimitingEnabled: process.env.DISABLE_RATE_LIMITING !== 'true',
    httpsEnabled: process.env.HTTPS_ENABLED === 'true' || process.env.NODE_ENV === 'production',
  };
}

function validateJWTSecret(config: SecurityConfig, result: SecurityValidationResult) {
  if (!config.jwtSecret) {
    result.errors.push('JWT_SECRET environment variable is not set');
    result.recommendations.push('Set a strong JWT_SECRET with at least 32 random characters');
    return;
  }

  if (config.jwtSecret.length < 32) {
    result.warnings.push(
      `JWT secret is too short (${config.jwtSecret.length} characters, recommended: 32+)`
    );
    result.recommendations.push('Use a longer JWT secret for better security');
  }

  // Check for common weak patterns
  const weakPatterns = ['secret', 'password', 'dev', 'test', 'default', '123', 'abc', 'change-me'];

  const lowerSecret = config.jwtSecret.toLowerCase();
  const foundWeakPatterns = weakPatterns.filter(pattern => lowerSecret.includes(pattern));

  if (foundWeakPatterns.length > 0) {
    if (config.nodeEnv === 'production') {
      result.errors.push(`JWT secret contains weak patterns: ${foundWeakPatterns.join(', ')}`);
    } else {
      result.warnings.push(`JWT secret contains weak patterns: ${foundWeakPatterns.join(', ')}`);
    }
    result.recommendations.push('Use a cryptographically secure random JWT secret');
  }

  // Check entropy (basic check)
  const uniqueChars = new Set(config.jwtSecret).size;
  if (uniqueChars < 16) {
    result.warnings.push('JWT secret has low character diversity');
    result.recommendations.push('Use a JWT secret with higher entropy (more diverse characters)');
  }
}

function validateEnvironment(config: SecurityConfig, result: SecurityValidationResult) {
  if (config.nodeEnv === 'production') {
    // Check for development variables that shouldn't be in production
    const devVars = ['DEBUG', 'DISABLE_RATE_LIMITING', 'SKIP_AUTH', 'MOCK_AUTH'];

    const foundDevVars = devVars.filter(varName => process.env[varName]);
    if (foundDevVars.length > 0) {
      result.warnings.push(`Development variables found in production: ${foundDevVars.join(', ')}`);
      result.recommendations.push(
        'Remove development-specific environment variables in production'
      );
    }

    // Check for required production variables
    const requiredProdVars = ['JWT_SECRET', 'DATABASE_URL'];

    const missingProdVars = requiredProdVars.filter(varName => !process.env[varName]);
    if (missingProdVars.length > 0) {
      result.errors.push(`Missing required production variables: ${missingProdVars.join(', ')}`);
      result.recommendations.push('Set all required environment variables for production');
    }
  }
}

function validateCORS(config: SecurityConfig, result: SecurityValidationResult) {
  if (!config.corsOrigin) {
    result.warnings.push('CORS origin not configured');
    result.recommendations.push('Configure CORS_ORIGIN to restrict cross-origin requests');
    return;
  }

  // Check for overly permissive CORS
  if (config.corsOrigin.includes('*')) {
    if (config.nodeEnv === 'production') {
      result.errors.push('Wildcard CORS origin (*) is not secure for production');
    } else {
      result.warnings.push('Wildcard CORS origin (*) should not be used in production');
    }
    result.recommendations.push('Use specific domain names for CORS origins');
  }

  // Check for HTTP origins in production
  if (config.nodeEnv === 'production' && config.corsOrigin.includes('http://')) {
    result.warnings.push('HTTP origins detected in production CORS configuration');
    result.recommendations.push('Use HTTPS origins in production');
  }
}

function validateRateLimiting(config: SecurityConfig, result: SecurityValidationResult) {
  if (!config.rateLimitingEnabled) {
    if (config.nodeEnv === 'production') {
      result.errors.push('Rate limiting is disabled in production');
      result.recommendations.push('Enable rate limiting to prevent abuse');
    } else {
      result.warnings.push('Rate limiting is disabled (development mode)');
      result.recommendations.push('Ensure rate limiting is enabled for production');
    }
  }
}

function validateHTTPS(config: SecurityConfig, result: SecurityValidationResult) {
  if (config.nodeEnv === 'production' && !config.httpsEnabled) {
    result.warnings.push('HTTPS not explicitly enabled in production');
    result.recommendations.push('Ensure HTTPS is enforced in production');
  }
}

/**
 * Log security validation results
 */
export function logSecurityValidation(result: SecurityValidationResult) {
  if (result.errors.length > 0) {
    console.error('🚨 SECURITY ERRORS:');
    result.errors.forEach(error => console.error(`  ❌ ${error}`));
  }

  if (result.warnings.length > 0) {
    console.warn('⚠️  SECURITY WARNINGS:');
    result.warnings.forEach(warning => console.warn(`  ⚠️  ${warning}`));
  }

  if (result.recommendations.length > 0) {
    console.info('💡 SECURITY RECOMMENDATIONS:');
    result.recommendations.forEach(rec => console.info(`  💡 ${rec}`));
  }

  if (result.isValid && result.warnings.length === 0) {
    console.info('✅ Security configuration validation passed');
  } else if (result.isValid) {
    console.info('✅ Security configuration is valid (with warnings)');
  } else {
    console.error('❌ Security configuration validation failed');
  }
}

/**
 * Generate security configuration report
 */
export function generateSecurityReport(): string {
  const result = validateSecurityConfig();
  const config = getSecurityConfig();

  let report = '# Security Configuration Report\n\n';

  report += `**Environment:** ${config.nodeEnv}\n`;
  report += `**Validation Status:** ${result.isValid ? '✅ Valid' : '❌ Invalid'}\n\n`;

  if (result.errors.length > 0) {
    report += '## 🚨 Critical Issues\n\n';
    result.errors.forEach(error => {
      report += `- ❌ ${error}\n`;
    });
    report += '\n';
  }

  if (result.warnings.length > 0) {
    report += '## ⚠️ Warnings\n\n';
    result.warnings.forEach(warning => {
      report += `- ⚠️ ${warning}\n`;
    });
    report += '\n';
  }

  if (result.recommendations.length > 0) {
    report += '## 💡 Recommendations\n\n';
    result.recommendations.forEach(rec => {
      report += `- 💡 ${rec}\n`;
    });
    report += '\n';
  }

  report += '## Configuration Summary\n\n';
  report += `- **JWT Secret Length:** ${config.jwtSecret.length} characters\n`;
  report += `- **Rate Limiting:** ${config.rateLimitingEnabled ? 'Enabled' : 'Disabled'}\n`;
  report += `- **CORS Origin:** ${config.corsOrigin || 'Not configured'}\n`;
  report += `- **HTTPS:** ${config.httpsEnabled ? 'Enabled' : 'Disabled'}\n`;

  return report;
}

/**
 * Initialize security validation at startup
 */
export function initializeSecurityValidation() {
  const result = validateSecurityConfig();
  logSecurityValidation(result);

  // In production, fail fast on critical security issues
  if (!result.isValid && process.env.NODE_ENV === 'production') {
    console.error('🚨 CRITICAL SECURITY ISSUES DETECTED - APPLICATION STARTUP ABORTED');
    process.exit(1);
  }

  return result;
}
