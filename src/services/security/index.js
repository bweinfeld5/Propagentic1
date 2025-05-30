/**
 * Security Services Index for PropAgentic
 * Unified interface for all security services
 */

// Import all security services
import { rateLimitService } from './rateLimitService';
import { inputSanitizer } from './inputSanitizer';
import { auditLogger } from './auditLogger';
import { twoFactorAuth } from './twoFactorAuth';
import { sessionManager } from './sessionManager';
import { securityConfig, getSecurityConfig, getServiceConfig } from './securityConfig';

/**
 * Unified Security Manager
 * Provides a single interface to all security services
 */
class SecurityManager {
  constructor() {
    this.config = securityConfig;
    this.services = {
      rateLimiting: rateLimitService,
      inputSanitization: inputSanitizer,
      auditLogging: auditLogger,
      twoFactorAuth: twoFactorAuth,
      sessionManagement: sessionManager
    };
    
    // Initialize security monitoring
    this.isInitialized = false;
    this.securityLevel = 'normal'; // normal, high, critical
    this.threatLevel = 'low'; // low, medium, high, critical
  }

  /**
   * Initialize all security services
   */
  async initialize(options = {}) {
    try {
      console.log('🔐 Initializing PropAgentic Security Services...');
      
      // Set security level based on environment
      this.securityLevel = this.config.environment.isProduction ? 'high' : 'normal';
      
      // Initialize rate limiting
      console.log('  ⏱️  Initializing Rate Limiting Service...');
      await this.services.rateLimiting.initialize(this.config.rateLimiting);
      
      // Initialize input sanitization
      console.log('  🧹 Initializing Input Sanitization Service...');
      await this.services.inputSanitization.initialize(this.config.inputSanitization);
      
      // Initialize audit logging
      console.log('  📝 Initializing Audit Logging Service...');
      await this.services.auditLogging.initialize?.(this.config.auditLogging);
      
      // Initialize 2FA service
      console.log('  🔑 Initializing Two-Factor Authentication Service...');
      await this.services.twoFactorAuth.initialize?.(this.config.twoFactorAuth);
      
      // Initialize session management
      console.log('  🎫 Initializing Session Management Service...');
      await this.services.sessionManagement.initialize?.(this.config.sessionManagement);
      
      // Start security monitoring
      if (this.config.monitoring.enableThreatDetection) {
        console.log('  🛡️  Starting Security Monitoring...');
        this.startSecurityMonitoring();
      }
      
      this.isInitialized = true;
      console.log('✅ All security services initialized successfully');
      
      // Log system startup
      await this.services.auditLogging.logEvent('SYSTEM_STARTUP', {
        securityLevel: this.securityLevel,
        servicesLoaded: Object.keys(this.services),
        environment: this.config.environment
      });
      
      return { success: true, message: 'Security services initialized' };
      
    } catch (error) {
      console.error('❌ Failed to initialize security services:', error);
      
      await this.services.auditLogging.logEvent('SYSTEM_ERROR', {
        error: error.message,
        operation: 'security_initialization'
      });
      
      throw error;
    }
  }

  /**
   * Start comprehensive security monitoring
   */
  startSecurityMonitoring() {
    // Monitor threat level
    setInterval(() => {
      this.assessThreatLevel();
    }, this.config.monitoring.healthCheckInterval);
    
    // Monitor service health
    setInterval(() => {
      this.checkServiceHealth();
    }, this.config.monitoring.healthCheckInterval * 2);
    
    // Cleanup old data
    setInterval(() => {
      this.performMaintenanceTasks();
    }, 24 * 60 * 60 * 1000); // Daily
  }

  /**
   * Assess current threat level based on security metrics
   */
  async assessThreatLevel() {
    try {
      const metrics = await this.getSecurityMetrics();
      
      let threatScore = 0;
      
      // Rate limiting violations
      if (metrics.rateLimitViolations > 10) threatScore += 1;
      if (metrics.rateLimitViolations > 50) threatScore += 2;
      
      // Failed authentication attempts
      if (metrics.failedLogins > 20) threatScore += 1;
      if (metrics.failedLogins > 100) threatScore += 2;
      
      // Suspicious activities
      if (metrics.suspiciousActivities > 5) threatScore += 2;
      if (metrics.suspiciousActivities > 20) threatScore += 3;
      
      // XSS/Injection attempts
      if (metrics.securityViolations > 0) threatScore += 3;
      
      // Update threat level
      const previousLevel = this.threatLevel;
      
      if (threatScore >= 7) {
        this.threatLevel = 'critical';
      } else if (threatScore >= 4) {
        this.threatLevel = 'high';
      } else if (threatScore >= 2) {
        this.threatLevel = 'medium';
      } else {
        this.threatLevel = 'low';
      }
      
      // Log threat level changes
      if (previousLevel !== this.threatLevel) {
        await this.services.auditLogging.logSecurity('threat_level_changed', {
          previousLevel,
          newLevel: this.threatLevel,
          threatScore,
          metrics
        });
        
        // Adjust security measures based on threat level
        await this.adjustSecurityMeasures();
      }
      
    } catch (error) {
      console.error('Error assessing threat level:', error);
    }
  }

  /**
   * Adjust security measures based on current threat level
   */
  async adjustSecurityMeasures() {
    try {
      switch (this.threatLevel) {
        case 'critical':
          // Implement maximum security
          await this.services.rateLimiting.adjustLimits({
            factor: 0.1, // Very restrictive
            duration: 60 * 60 * 1000 // 1 hour
          });
          
          await this.services.sessionManagement.reduceSessionTimeouts({
            factor: 0.5 // Half normal timeout
          });
          
          console.warn('🚨 CRITICAL THREAT LEVEL - Maximum security measures activated');
          break;
          
        case 'high':
          // Implement enhanced security
          await this.services.rateLimiting.adjustLimits({
            factor: 0.3, // More restrictive
            duration: 30 * 60 * 1000 // 30 minutes
          });
          
          await this.services.sessionManagement.reduceSessionTimeouts({
            factor: 0.7
          });
          
          console.warn('⚠️ HIGH THREAT LEVEL - Enhanced security measures activated');
          break;
          
        case 'medium':
          // Implement moderate security
          await this.services.rateLimiting.adjustLimits({
            factor: 0.7, // Slightly restrictive
            duration: 15 * 60 * 1000 // 15 minutes
          });
          
          console.warn('⚡ MEDIUM THREAT LEVEL - Moderate security measures activated');
          break;
          
        case 'low':
          // Normal security measures
          await this.services.rateLimiting.resetLimits();
          await this.services.sessionManagement.resetTimeouts();
          
          console.log('✅ LOW THREAT LEVEL - Normal security measures');
          break;
      }
      
    } catch (error) {
      console.error('Error adjusting security measures:', error);
    }
  }

  /**
   * Get comprehensive security metrics
   */
  async getSecurityMetrics() {
    try {
      const [
        auditStats,
        rateLimitStats,
        sessionStats
      ] = await Promise.all([
        this.services.auditLogging.getStats('hour'),
        this.services.rateLimiting.getStats(),
        this.services.sessionManagement.getStats?.() || {}
      ]);
      
      return {
        // Authentication metrics
        failedLogins: auditStats.eventTypes?.AUTH_LOGIN_FAILURE || 0,
        successfulLogins: auditStats.eventTypes?.AUTH_LOGIN_SUCCESS || 0,
        
        // Security violation metrics
        rateLimitViolations: rateLimitStats.violations || 0,
        suspiciousActivities: auditStats.eventTypes?.SECURITY_SUSPICIOUS_ACTIVITY || 0,
        securityViolations: (auditStats.eventTypes?.SECURITY_XSS_ATTEMPT || 0) + 
                           (auditStats.eventTypes?.SECURITY_SQL_INJECTION_ATTEMPT || 0),
        
        // Session metrics
        activeSessions: sessionStats.activeSessions || 0,
        sessionViolations: sessionStats.violations || 0,
        
        // General metrics
        totalEvents: auditStats.totalEvents || 0,
        criticalEvents: auditStats.criticalEvents || 0,
        
        // Time period
        timeframe: 'last_hour',
        timestamp: new Date()
      };
      
    } catch (error) {
      console.error('Error getting security metrics:', error);
      return {
        failedLogins: 0,
        successfulLogins: 0,
        rateLimitViolations: 0,
        suspiciousActivities: 0,
        securityViolations: 0,
        activeSessions: 0,
        sessionViolations: 0,
        totalEvents: 0,
        criticalEvents: 0,
        timeframe: 'error',
        timestamp: new Date()
      };
    }
  }

  /**
   * Check health of all security services
   */
  async checkServiceHealth() {
    const health = {
      overall: 'healthy',
      services: {},
      timestamp: new Date()
    };
    
    for (const [serviceName, service] of Object.entries(this.services)) {
      try {
        // Check if service has health check method
        if (typeof service.healthCheck === 'function') {
          health.services[serviceName] = await service.healthCheck();
        } else {
          // Basic health check - service exists and has methods
          health.services[serviceName] = {
            status: 'healthy',
            message: 'Service operational'
          };
        }
      } catch (error) {
        health.services[serviceName] = {
          status: 'unhealthy',
          message: error.message,
          error: true
        };
        health.overall = 'degraded';
      }
    }
    
    // Log health issues
    if (health.overall !== 'healthy') {
      await this.services.auditLogging.logEvent('SYSTEM_HEALTH_ISSUE', health);
    }
    
    return health;
  }

  /**
   * Perform maintenance tasks
   */
  async performMaintenanceTasks() {
    try {
      console.log('🧹 Performing security maintenance tasks...');
      
      // Cleanup expired data
      if (this.services.auditLogging.cleanup) {
        await this.services.auditLogging.cleanup();
      }
      
      if (this.services.rateLimiting.cleanup) {
        await this.services.rateLimiting.cleanup();
      }
      
      if (this.services.sessionManagement.cleanup) {
        await this.services.sessionManagement.cleanup();
      }
      
      // Generate daily security report
      const securityReport = await this.generateSecurityReport('daily');
      
      // Log maintenance completion
      await this.services.auditLogging.logEvent('SYSTEM_MAINTENANCE', {
        operation: 'daily_cleanup',
        securityReport: {
          summary: securityReport.summary,
          criticalIssues: securityReport.criticalIssues?.length || 0
        }
      });
      
      console.log('✅ Security maintenance completed');
      
    } catch (error) {
      console.error('❌ Security maintenance failed:', error);
      
      await this.services.auditLogging.logEvent('SYSTEM_ERROR', {
        operation: 'security_maintenance',
        error: error.message
      });
    }
  }

  /**
   * Generate comprehensive security report
   */
  async generateSecurityReport(period = 'daily') {
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case 'hourly':
          startDate.setHours(startDate.getHours() - 1);
          break;
        case 'daily':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case 'weekly':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'monthly':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
      }
      
      // Get audit report
      const auditReport = await this.services.auditLogging.generateReport(
        startDate, 
        endDate, 
        { includeDetails: false }
      );
      
      // Get security metrics
      const securityMetrics = await this.getSecurityMetrics();
      
      // Analyze security trends
      const trends = this.analyzeSecurityTrends(auditReport.statistics);
      
      // Identify critical issues
      const criticalIssues = this.identifyCriticalIssues(auditReport, securityMetrics);
      
      // Generate recommendations
      const recommendations = this.generateSecurityRecommendations(criticalIssues, trends);
      
      const report = {
        period: { startDate, endDate },
        summary: {
          totalEvents: auditReport.statistics.totalEvents,
          securityEvents: auditReport.statistics.eventsByCategory?.security || 0,
          criticalEvents: auditReport.statistics.eventsBySeverity?.critical || 0,
          threatLevel: this.threatLevel,
          securityLevel: this.securityLevel
        },
        metrics: securityMetrics,
        trends,
        criticalIssues,
        recommendations,
        serviceHealth: await this.checkServiceHealth(),
        generatedAt: new Date()
      };
      
      return report;
      
    } catch (error) {
      console.error('Error generating security report:', error);
      throw error;
    }
  }

  /**
   * Analyze security trends
   */
  analyzeSecurityTrends(statistics) {
    const trends = {
      authentication: 'stable',
      security: 'stable',
      sessions: 'stable',
      overall: 'stable'
    };
    
    // Simple trend analysis based on event counts
    if (statistics.eventsByCategory?.authentication > 100) {
      trends.authentication = 'increasing';
    }
    
    if (statistics.eventsByCategory?.security > 10) {
      trends.security = 'concerning';
      trends.overall = 'concerning';
    }
    
    if (statistics.eventsBySeverity?.critical > 0) {
      trends.overall = 'critical';
    }
    
    return trends;
  }

  /**
   * Identify critical security issues
   */
  identifyCriticalIssues(auditReport, securityMetrics) {
    const issues = [];
    
    // Check for excessive failed logins
    if (securityMetrics.failedLogins > 50) {
      issues.push({
        type: 'authentication',
        severity: 'high',
        description: `${securityMetrics.failedLogins} failed login attempts in the last hour`,
        recommendation: 'Consider implementing additional rate limiting'
      });
    }
    
    // Check for security violations
    if (securityMetrics.securityViolations > 0) {
      issues.push({
        type: 'security_attack',
        severity: 'critical',
        description: `${securityMetrics.securityViolations} security attack attempts detected`,
        recommendation: 'Investigate immediately and consider blocking source IPs'
      });
    }
    
    // Check for rate limit violations
    if (securityMetrics.rateLimitViolations > 20) {
      issues.push({
        type: 'rate_limiting',
        severity: 'medium',
        description: `${securityMetrics.rateLimitViolations} rate limit violations`,
        recommendation: 'Review and adjust rate limiting thresholds'
      });
    }
    
    return issues;
  }

  /**
   * Generate security recommendations
   */
  generateSecurityRecommendations(criticalIssues, trends) {
    const recommendations = [];
    
    // Based on critical issues
    if (criticalIssues.some(issue => issue.severity === 'critical')) {
      recommendations.push({
        priority: 'immediate',
        category: 'security',
        action: 'Investigate critical security issues immediately',
        description: 'Critical security violations detected requiring immediate attention'
      });
    }
    
    // Based on trends
    if (trends.authentication === 'increasing') {
      recommendations.push({
        priority: 'high',
        category: 'authentication',
        action: 'Review authentication security measures',
        description: 'Unusual increase in authentication events detected'
      });
    }
    
    if (trends.security === 'concerning') {
      recommendations.push({
        priority: 'high',
        category: 'security',
        action: 'Enhance security monitoring',
        description: 'Increase security monitoring and consider additional protection measures'
      });
    }
    
    // General recommendations
    recommendations.push({
      priority: 'normal',
      category: 'maintenance',
      action: 'Regular security review',
      description: 'Continue regular security monitoring and maintenance'
    });
    
    return recommendations;
  }

  /**
   * Emergency security lockdown
   */
  async emergencyLockdown(reason = 'security_incident') {
    try {
      console.error('🚨 EMERGENCY SECURITY LOCKDOWN ACTIVATED');
      
      // Set maximum security restrictions
      await this.services.rateLimiting.emergencyMode(true);
      
      // Reduce session timeouts to minimum
      await this.services.sessionManagement.emergencyLockdown();
      
      // Log the emergency action
      await this.services.auditLogging.logSecurity('emergency_lockdown', {
        reason,
        timestamp: new Date(),
        activatedBy: 'security_system'
      });
      
      this.threatLevel = 'critical';
      this.securityLevel = 'critical';
      
      return { success: true, message: 'Emergency lockdown activated' };
      
    } catch (error) {
      console.error('Failed to activate emergency lockdown:', error);
      throw error;
    }
  }

  /**
   * Get current security status
   */
  getSecurityStatus() {
    return {
      initialized: this.isInitialized,
      securityLevel: this.securityLevel,
      threatLevel: this.threatLevel,
      services: Object.keys(this.services),
      config: {
        environment: this.config.environment.isProduction ? 'production' : 'development',
        version: '1.0.0'
      }
    };
  }
}

// Create singleton instance
const securityManager = new SecurityManager();

// Export individual services and unified manager
export {
  // Individual services
  rateLimitService,
  inputSanitizer,
  auditLogger,
  twoFactorAuth,
  sessionManager,
  
  // Configuration
  securityConfig,
  getSecurityConfig,
  getServiceConfig,
  
  // Unified manager
  securityManager
};

// Export as default for easy importing
export default {
  manager: securityManager,
  services: {
    rateLimiting: rateLimitService,
    inputSanitization: inputSanitizer,
    auditLogging: auditLogger,
    twoFactorAuth: twoFactorAuth,
    sessionManagement: sessionManager
  },
  config: securityConfig
}; 