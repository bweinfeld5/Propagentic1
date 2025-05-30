/**
 * Centralized Security Configuration for PropAgentic
 * Contains all security settings and environment-specific configurations
 */

// Environment detection
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';
const isTesting = process.env.NODE_ENV === 'test';

/**
 * Security Configuration Object
 */
export const securityConfig = {
  // Environment settings
  environment: {
    isDevelopment,
    isProduction,
    isTesting,
    debugMode: isDevelopment && process.env.REACT_APP_SECURITY_DEBUG === 'true'
  },

  // Rate Limiting Configuration
  rateLimiting: {
    // Authentication rate limits
    auth: {
      login: {
        maxAttempts: isProduction ? 5 : 10,
        windowMs: 15 * 60 * 1000, // 15 minutes
        blockDurationMs: isProduction ? 30 * 60 * 1000 : 10 * 60 * 1000 // 30min prod, 10min dev
      },
      signup: {
        maxAttempts: 3,
        windowMs: 60 * 60 * 1000, // 1 hour
        blockDurationMs: 60 * 60 * 1000 // 1 hour
      },
      passwordReset: {
        maxAttempts: 3,
        windowMs: 60 * 60 * 1000, // 1 hour
        blockDurationMs: 30 * 60 * 1000 // 30 minutes
      },
      twoFactorVerification: {
        maxAttempts: 5,
        windowMs: 15 * 60 * 1000, // 15 minutes
        blockDurationMs: 30 * 60 * 1000 // 30 minutes
      }
    },

    // API rate limits
    api: {
      general: {
        maxRequests: isProduction ? 100 : 500,
        windowMs: 15 * 60 * 1000 // 15 minutes
      },
      payment: {
        maxRequests: 10,
        windowMs: 60 * 1000 // 1 minute
      },
      fileUpload: {
        maxRequests: 20,
        windowMs: 60 * 1000 // 1 minute
      }
    },

    // Global IP-based limits
    global: {
      maxAttemptsPerIP: 100,
      windowMs: 60 * 60 * 1000, // 1 hour
      blockDurationMs: 2 * 60 * 60 * 1000 // 2 hours
    }
  },

  // Input Sanitization Configuration
  inputSanitization: {
    // XSS protection settings
    xss: {
      enableRealTimeScanning: true,
      strictMode: isProduction,
      allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br'], // Allowed HTML tags
      maxStringLength: 10000,
      enableURLValidation: true
    },

    // SQL injection protection
    sqlInjection: {
      enableScanning: true,
      strictMode: isProduction,
      logAttempts: true
    },

    // Password requirements
    passwordPolicy: {
      minLength: 8,
      maxLength: 128,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      bannedPasswords: [
        'password', 'password123', '123456', 'qwerty', 'admin', 'letmein'
      ],
      maxRepeatingChars: 3,
      preventUserInfo: true // Prevent password containing user's email/name
    },

    // Email validation
    emailValidation: {
      enableDomainValidation: true,
      allowedDomains: [], // Empty means all domains allowed
      blockedDomains: [
        'tempmail.org', '10minutemail.com', 'guerrillamail.com'
      ],
      enableMXRecord: isProduction, // Check MX records in production
      enableTypoDetection: true
    }
  },

  // Session Management Configuration
  sessionManagement: {
    // Session timeouts
    timeouts: {
      maxInactiveMinutes: isProduction ? 30 : 60, // Shorter in prod
      maxSessionMinutes: isProduction ? 480 : 720, // 8 hours prod, 12 hours dev
      extendThresholdMinutes: 5,
      rememberMeDays: 30
    },

    // Session limits
    limits: {
      maxConcurrentSessions: isProduction ? 3 : 5,
      maxSessionsPerDay: 50,
      maxDevicesPerUser: 10
    },

    // Security monitoring
    monitoring: {
      heartbeatInterval: 5 * 60 * 1000, // 5 minutes
      securityCheckInterval: 60 * 1000, // 1 minute
      deviceFingerprintValidation: isProduction,
      enableGeoLocationTracking: isProduction,
      enableBehaviorAnalysis: isProduction
    },

    // Storage settings
    storage: {
      encryptLocalStorage: isProduction,
      sessionCookieSecure: isProduction,
      sameSitePolicy: isProduction ? 'strict' : 'lax'
    }
  },

  // Two-Factor Authentication Configuration
  twoFactorAuth: {
    // TOTP settings
    totp: {
      window: 1, // Time steps before/after current
      step: 30, // 30 second intervals
      digits: 6,
      algorithm: 'SHA1',
      issuer: 'PropAgentic'
    },

    // Backup codes
    backupCodes: {
      count: 10,
      length: 8,
      usedRetentionDays: 90,
      enableAutoRegeneration: false
    },

    // Rate limiting for 2FA
    rateLimiting: {
      setup: {
        maxAttempts: 3,
        windowMs: 60 * 60 * 1000 // 1 hour
      },
      verification: {
        maxAttempts: 5,
        windowMs: 15 * 60 * 1000 // 15 minutes
      }
    },

    // Security features
    security: {
      requireForAdminActions: true,
      requireForPasswordChange: true,
      requireForSensitiveData: true,
      enableRememberDevice: false, // Disable for high security
      deviceTrustDuration: 30 * 24 * 60 * 60 * 1000 // 30 days
    }
  },

  // Audit Logging Configuration
  auditLogging: {
    // Log levels
    levels: {
      debug: isDevelopment,
      info: true,
      warning: true,
      error: true,
      critical: true
    },

    // Retention policies (in days)
    retention: {
      debug: 7,
      info: 90,
      warning: 365,
      error: 365,
      critical: 2555, // 7 years for critical events
      financial: 2555, // 7 years for financial records
      authentication: 365,
      dataAccess: 90
    },

    // Real-time alerts
    alerts: {
      enableRealTime: isProduction,
      critical: {
        enableEmail: isProduction,
        enableSlack: isProduction,
        enableSMS: false
      },
      security: {
        enableEmail: isProduction,
        enableSlack: isDevelopment
      }
    },

    // Performance settings
    performance: {
      batchSize: 100,
      flushInterval: 5000, // 5 seconds
      maxQueueSize: 1000,
      enableCompression: isProduction
    },

    // Privacy settings
    privacy: {
      enableDataMasking: true,
      maskSensitiveFields: true,
      anonymizeAfterDays: 365,
      enableGDPRCompliance: true
    }
  },

  // File Upload Security
  fileUpload: {
    // File type restrictions
    allowedTypes: [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'text/plain', 'text/csv',
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],

    // Size limits (in bytes)
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxTotalSize: 100 * 1024 * 1024, // 100MB per user

    // Security scanning
    virusScanning: isProduction,
    malwareDetection: isProduction,
    contentValidation: true,

    // Storage settings
    encryptFiles: isProduction,
    enableVersioning: true,
    automaticBackup: isProduction
  },

  // Content Security Policy
  contentSecurityPolicy: {
    enabled: isProduction,
    reportOnly: isDevelopment,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://apis.google.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.stripe.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      childSrc: ["'none'"]
    }
  },

  // API Security
  apiSecurity: {
    // Request validation
    enableRequestValidation: true,
    enableResponseValidation: isProduction,
    maxRequestSize: 10 * 1024 * 1024, // 10MB

    // CORS settings
    cors: {
      origin: isProduction ? process.env.REACT_APP_DOMAIN : '*',
      credentials: true,
      optionsSuccessStatus: 200
    },

    // Headers security
    securityHeaders: {
      enableHSTS: isProduction,
      enableNoSniff: true,
      enableXSSProtection: true,
      enableFrameguard: true,
      enableHidePoweredBy: true
    }
  },

  // Encryption Settings
  encryption: {
    // Algorithms
    symmetric: 'AES-256-GCM',
    asymmetric: 'RSA-2048',
    hashing: 'SHA-256',

    // Key management
    rotationDays: 90,
    keyStrength: 256,
    enableAutoRotation: isProduction,

    // Data encryption
    encryptPII: isProduction,
    encryptFinancialData: true,
    encryptCommunications: true
  },

  // Compliance Settings
  compliance: {
    // Regulations
    gdpr: {
      enabled: true,
      dataRetentionDays: 2555, // 7 years
      enableRightToErasure: true,
      enableDataPortability: true,
      enableConsentManagement: true
    },

    sox: {
      enabled: isProduction,
      financialDataRetention: 2555, // 7 years
      enableAuditTrails: true,
      enableDataIntegrity: true
    },

    pci: {
      enabled: true,
      tokenizeCardData: true,
      encryptCardData: true,
      enableVault: isProduction
    }
  },

  // Monitoring and Alerting
  monitoring: {
    // Performance monitoring
    enablePerformanceTracking: true,
    slowQueryThreshold: 1000, // 1 second
    enableResourceMonitoring: isProduction,

    // Security monitoring
    enableThreatDetection: isProduction,
    enableAnomalyDetection: isProduction,
    enableBehaviorAnalysis: isProduction,

    // Health checks
    healthCheckInterval: 30000, // 30 seconds
    enableDeepHealthChecks: isProduction,
    enableDependencyChecks: true
  },

  // Feature Flags
  features: {
    enableAdvancedSecurity: isProduction,
    enableMachineLearning: isProduction,
    enableBiometricAuth: false,
    enableBlockchain: false,
    enableQuantumResistance: false
  }
};

/**
 * Get environment-specific configuration
 */
export function getSecurityConfig(environment = process.env.NODE_ENV) {
  // Override settings based on environment
  const envOverrides = {
    development: {
      rateLimiting: {
        auth: {
          login: { maxAttempts: 10, blockDurationMs: 5 * 60 * 1000 }
        }
      },
      sessionManagement: {
        timeouts: { maxInactiveMinutes: 120 }
      }
    },
    
    production: {
      rateLimiting: {
        auth: {
          login: { maxAttempts: 3, blockDurationMs: 60 * 60 * 1000 }
        }
      },
      sessionManagement: {
        timeouts: { maxInactiveMinutes: 15 }
      }
    },
    
    test: {
      rateLimiting: {
        auth: {
          login: { maxAttempts: 100, blockDurationMs: 1000 }
        }
      },
      sessionManagement: {
        timeouts: { maxInactiveMinutes: 1 }
      }
    }
  };

  // Deep merge configuration with environment overrides
  return deepMerge(securityConfig, envOverrides[environment] || {});
}

/**
 * Validate security configuration
 */
export function validateSecurityConfig(config = securityConfig) {
  const errors = [];

  // Validate rate limiting settings
  if (config.rateLimiting.auth.login.maxAttempts < 1) {
    errors.push('Login max attempts must be at least 1');
  }

  // Validate session settings
  if (config.sessionManagement.timeouts.maxInactiveMinutes < 1) {
    errors.push('Max inactive time must be at least 1 minute');
  }

  // Validate password policy
  if (config.inputSanitization.passwordPolicy.minLength < 6) {
    errors.push('Minimum password length must be at least 6 characters');
  }

  // Validate 2FA settings
  if (config.twoFactorAuth.totp.digits < 4 || config.twoFactorAuth.totp.digits > 8) {
    errors.push('TOTP digits must be between 4 and 8');
  }

  if (errors.length > 0) {
    throw new Error(`Security configuration validation failed: ${errors.join(', ')}`);
  }

  return true;
}

/**
 * Deep merge utility function
 */
function deepMerge(target, source) {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
}

/**
 * Get configuration for specific security service
 */
export function getServiceConfig(serviceName) {
  const config = getSecurityConfig();
  
  switch (serviceName) {
    case 'rateLimiting':
      return config.rateLimiting;
    case 'inputSanitization':
      return config.inputSanitization;
    case 'sessionManagement':
      return config.sessionManagement;
    case 'twoFactorAuth':
      return config.twoFactorAuth;
    case 'auditLogging':
      return config.auditLogging;
    default:
      return config;
  }
}

// Validate configuration on module load
try {
  validateSecurityConfig();
  console.log('✅ Security configuration validated successfully');
} catch (error) {
  console.error('❌ Security configuration validation failed:', error.message);
  
  if (isProduction) {
    throw error; // Fail fast in production
  }
}

export default securityConfig; 