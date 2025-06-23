/**
 * Unified Privacy Manager for PropAgentic
 * Coordinates all privacy services and provides a single interface for privacy compliance
 */

import { gdprService } from './gdprService';
import { dataRetentionService } from './dataRetentionService';
import { privacyControlsService } from './privacyControlsService';
import { encryptionService } from './encryptionService';
import { auditLogger } from '../security/auditLogger';

class PrivacyManager {
  constructor() {
    this.services = {
      gdpr: gdprService,
      retention: dataRetentionService,
      controls: privacyControlsService,
      encryption: encryptionService
    };
    
    this.isInitialized = false;
    this.initializationError = null;
    
    // Privacy compliance configuration
    this.complianceConfig = {
      gdprEnabled: true,
      retentionEnabled: true,
      encryptionEnabled: true,
      privacyControlsEnabled: true,
      auditingEnabled: true,
      complianceReportingEnabled: true
    };
    
    // Privacy metrics
    this.metrics = {
      totalUsers: 0,
      gdprCompliantUsers: 0,
      encryptedRecords: 0,
      retentionComplianceScore: 0,
      privacyScore: 0,
      lastHealthCheck: null
    };
    
    // Privacy health monitoring
    this.healthStatus = {
      overall: 'unknown',
      services: {},
      lastCheck: null,
      issues: []
    };
  }

  /**
   * Initialize all privacy services
   */
  async initialize() {
    try {
      console.log('🔒 Initializing Privacy Manager...');
      
      // Initialize all privacy services
      const initResults = {};
      
      if (this.complianceConfig.encryptionEnabled) {
        initResults.encryption = await this.services.encryption.initialize();
      }
      
      if (this.complianceConfig.gdprEnabled) {
        // GDPR service doesn't need initialization
        initResults.gdpr = { success: true };
      }
      
      if (this.complianceConfig.retentionEnabled) {
        initResults.retention = await this.services.retention.initialize();
      }
      
      if (this.complianceConfig.privacyControlsEnabled) {
        // Privacy controls service doesn't need initialization
        initResults.controls = { success: true };
      }
      
      // Verify all services initialized successfully
      const failedServices = Object.entries(initResults)
        .filter(([_, result]) => !result.success)
        .map(([service, _]) => service);
      
      if (failedServices.length > 0) {
        throw new Error(`Failed to initialize privacy services: ${failedServices.join(', ')}`);
      }
      
      this.isInitialized = true;
      
      // Start health monitoring
      this.startHealthMonitoring();
      
      // Log initialization
      await auditLogger.logEvent('PRIVACY_MANAGER_INITIALIZED', {
        services: Object.keys(initResults),
        config: this.complianceConfig
      });
      
      console.log('✅ Privacy Manager initialized successfully');
      return { success: true, services: Object.keys(initResults) };
      
    } catch (error) {
      this.initializationError = error;
      console.error('Error initializing Privacy Manager:', error);
      throw error;
    }
  }

  /**
   * Initialize privacy compliance for a new user
   */
  async initializeUserPrivacy(userId, userEmail, userType = 'tenant', preferences = {}) {
    try {
      if (!this.isInitialized) {
        throw new Error('Privacy Manager not initialized');
      }
      
      console.log(`Initializing privacy compliance for user ${userId}`);
      
      const results = {};
      
      // Initialize GDPR compliance
      if (this.complianceConfig.gdprEnabled) {
        results.gdpr = await this.services.gdpr.initializeUserCompliance(
          userId, 
          userEmail, 
          preferences.gdpr || {}
        );
      }
      
      // Initialize privacy controls
      if (this.complianceConfig.privacyControlsEnabled) {
        results.controls = await this.services.controls.initializeUserPrivacyControls(
          userId, 
          userType, 
          preferences.privacy || {}
        );
      }
      
      // Log user privacy initialization
      await auditLogger.logEvent('USER_PRIVACY_INITIALIZED', {
        userId,
        userType,
        services: Object.keys(results)
      });
      
      return {
        success: true,
        userId,
        services: results
      };
      
    } catch (error) {
      console.error(`Error initializing user privacy for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Comprehensive privacy compliance check for user
   */
  async checkUserPrivacyCompliance(userId) {
    try {
      const compliance = {
        userId,
        overall: 'compliant',
        timestamp: new Date(),
        details: {},
        recommendations: [],
        score: 100
      };
      
      let totalScore = 0;
      let serviceCount = 0;
      
      // Check GDPR compliance
      if (this.complianceConfig.gdprEnabled) {
        try {
          const gdprStatus = await this.services.gdpr.getConsentStatus(userId);
          compliance.details.gdpr = {
            status: gdprStatus ? 'compliant' : 'non-compliant',
            consents: gdprStatus,
            score: gdprStatus ? 100 : 0
          };
          totalScore += compliance.details.gdpr.score;
          serviceCount++;
        } catch (error) {
          compliance.details.gdpr = { status: 'error', error: error.message, score: 0 };
          totalScore += 0;
          serviceCount++;
        }
      }
      
      // Check privacy controls
      if (this.complianceConfig.privacyControlsEnabled) {
        try {
          const dashboard = await this.services.controls.getPrivacyDashboard(userId);
          compliance.details.privacy = {
            status: dashboard.analysis.privacy_score >= 50 ? 'compliant' : 'needs-attention',
            score: dashboard.analysis.privacy_score,
            analysis: dashboard.analysis
          };
          totalScore += dashboard.analysis.privacy_score;
          serviceCount++;
        } catch (error) {
          compliance.details.privacy = { status: 'error', error: error.message, score: 0 };
          totalScore += 0;
          serviceCount++;
        }
      }
      
      // Calculate overall score
      compliance.score = serviceCount > 0 ? Math.round(totalScore / serviceCount) : 0;
      
      // Determine overall status
      if (compliance.score >= 80) {
        compliance.overall = 'compliant';
      } else if (compliance.score >= 50) {
        compliance.overall = 'needs-attention';
      } else {
        compliance.overall = 'non-compliant';
      }
      
      // Generate recommendations
      compliance.recommendations = this.generateComplianceRecommendations(compliance);
      
      return compliance;
      
    } catch (error) {
      console.error(`Error checking privacy compliance for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Handle data export request (GDPR Article 20)
   */
  async exportUserData(userId, format = 'json', options = {}) {
    try {
      if (!this.complianceConfig.gdprEnabled) {
        throw new Error('GDPR service not enabled');
      }
      
      // Check user's privacy settings
      const privacyDashboard = await this.services.controls.getPrivacyDashboard(userId);
      
      // Export data using GDPR service
      const exportResult = await this.services.gdpr.exportUserData(userId, format);
      
      // Apply privacy controls to exported data if needed
      const controlledExport = await this.applyPrivacyControlsToExport(
        exportResult, 
        privacyDashboard.controls,
        options
      );
      
      return controlledExport;
      
    } catch (error) {
      console.error(`Error exporting data for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Handle data deletion request (GDPR Article 17)
   */
  async deleteUserData(userId, options = {}) {
    try {
      if (!this.complianceConfig.gdprEnabled) {
        throw new Error('GDPR service not enabled');
      }
      
      // Use GDPR service to handle deletion
      const deletionResult = await this.services.gdpr.deleteUserData(userId, options);
      
      // Clean up privacy controls
      if (this.complianceConfig.privacyControlsEnabled) {
        // Privacy controls will be deleted as part of user data
        console.log(`Privacy controls will be deleted for user ${userId}`);
      }
      
      return deletionResult;
      
    } catch (error) {
      console.error(`Error deleting data for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Update user privacy preferences
   */
  async updatePrivacyPreferences(userId, preferences = {}) {
    try {
      const results = {};
      
      // Update GDPR consents
      if (preferences.gdpr && this.complianceConfig.gdprEnabled) {
        for (const [consentType, granted] of Object.entries(preferences.gdpr)) {
          results[`gdpr_${consentType}`] = await this.services.gdpr.updateConsent(
            userId, 
            consentType, 
            granted
          );
        }
      }
      
      // Update privacy controls
      if (preferences.privacy && this.complianceConfig.privacyControlsEnabled) {
        for (const [category, setting] of Object.entries(preferences.privacy)) {
          results[`privacy_${category}`] = await this.services.controls.updatePrivacyPreference(
            userId, 
            category, 
            setting
          );
        }
      }
      
      // Update data visibility settings
      if (preferences.visibility && this.complianceConfig.privacyControlsEnabled) {
        for (const [dataType, level] of Object.entries(preferences.visibility)) {
          results[`visibility_${dataType}`] = await this.services.controls.updateDataVisibility(
            userId, 
            dataType, 
            level
          );
        }
      }
      
      await auditLogger.logEvent('PRIVACY_PREFERENCES_UPDATED', {
        userId,
        preferences: Object.keys(preferences),
        results: Object.keys(results)
      });
      
      return { success: true, updates: results };
      
    } catch (error) {
      console.error(`Error updating privacy preferences for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Encrypt sensitive data before storage
   */
  async encryptSensitiveData(data, context = {}) {
    try {
      if (!this.complianceConfig.encryptionEnabled) {
        return data;
      }
      
      return await this.services.encryption.autoEncryptObject(data, context);
      
    } catch (error) {
      console.error('Error encrypting sensitive data:', error);
      throw error;
    }
  }

  /**
   * Decrypt sensitive data after retrieval
   */
  async decryptSensitiveData(data, context = {}) {
    try {
      if (!this.complianceConfig.encryptionEnabled) {
        return data;
      }
      
      return await this.services.encryption.autoDecryptObject(data, context);
      
    } catch (error) {
      console.error('Error decrypting sensitive data:', error);
      throw error;
    }
  }

  /**
   * Check if data access is allowed
   */
  async checkDataAccess(ownerId, requestorId, dataType, accessLevel = 'view') {
    try {
      if (!this.complianceConfig.privacyControlsEnabled) {
        return { allowed: true, reason: 'Privacy controls disabled' };
      }
      
      return await this.services.controls.checkDataAccess(
        ownerId, 
        requestorId, 
        dataType, 
        accessLevel
      );
      
    } catch (error) {
      console.error('Error checking data access:', error);
      return { allowed: false, reason: 'Access check failed' };
    }
  }

  /**
   * Apply data masking based on privacy settings
   */
  async applyDataMasking(data, dataType, ownerId, requestorId) {
    try {
      if (!this.complianceConfig.privacyControlsEnabled) {
        return data;
      }
      
      // Check access level
      const accessCheck = await this.checkDataAccess(ownerId, requestorId, dataType);
      
      if (!accessCheck.allowed) {
        return null; // No access
      }
      
      if (!accessCheck.masked) {
        return data; // No masking needed
      }
      
      // Apply masking
      const privacyDashboard = await this.services.controls.getPrivacyDashboard(ownerId);
      const visibilityLevel = privacyDashboard.controls.visibility[dataType]?.default || 'limited';
      
      return this.services.controls.applyDataMasking(data, dataType, visibilityLevel);
      
    } catch (error) {
      console.error('Error applying data masking:', error);
      return data;
    }
  }

  /**
   * Generate comprehensive privacy report
   */
  async generatePrivacyReport(options = {}) {
    try {
      const { 
        period = 'month',
        includeUsers = false,
        includeRetention = true,
        includeCompliance = true 
      } = options;
      
      const report = {
        period,
        generatedAt: new Date(),
        summary: {},
        details: {},
        recommendations: []
      };
      
      // Overall metrics
      report.summary = await this.getPrivacyMetrics();
      
      // GDPR compliance report
      if (includeCompliance && this.complianceConfig.gdprEnabled) {
        const startDate = this.getStartDateForPeriod(period);
        report.details.gdpr = await this.services.gdpr.generateComplianceReport(
          startDate, 
          new Date()
        );
      }
      
      // Data retention compliance
      if (includeRetention && this.complianceConfig.retentionEnabled) {
        report.details.retention = await this.services.retention.getComplianceStatus();
      }
      
      // Privacy health check
      report.details.health = await this.performHealthCheck();
      
      // Generate recommendations
      report.recommendations = this.generatePrivacyRecommendations(report);
      
      return report;
      
    } catch (error) {
      console.error('Error generating privacy report:', error);
      throw error;
    }
  }

  /**
   * Perform privacy health check
   */
  async performHealthCheck() {
    try {
      const health = {
        overall: 'healthy',
        timestamp: new Date(),
        services: {},
        issues: []
      };
      
      // Check encryption service
      if (this.complianceConfig.encryptionEnabled) {
        try {
          const encryptionStatus = this.services.encryption.getEncryptionStatus();
          health.services.encryption = {
            status: encryptionStatus.enabled ? 'healthy' : 'degraded',
            details: encryptionStatus
          };
        } catch (error) {
          health.services.encryption = { status: 'unhealthy', error: error.message };
          health.issues.push('Encryption service unavailable');
        }
      }
      
      // Check data retention compliance
      if (this.complianceConfig.retentionEnabled) {
        try {
          const retentionStatus = await this.services.retention.getComplianceStatus();
          health.services.retention = {
            status: retentionStatus.compliant ? 'healthy' : 'needs-attention',
            details: retentionStatus
          };
          
          if (!retentionStatus.compliant) {
            health.issues.push('Data retention compliance issues detected');
          }
        } catch (error) {
          health.services.retention = { status: 'unhealthy', error: error.message };
          health.issues.push('Data retention service unavailable');
        }
      }
      
      // Determine overall health
      const serviceStatuses = Object.values(health.services).map(s => s.status);
      if (serviceStatuses.includes('unhealthy')) {
        health.overall = 'unhealthy';
      } else if (serviceStatuses.includes('degraded') || serviceStatuses.includes('needs-attention')) {
        health.overall = 'degraded';
      }
      
      this.healthStatus = health;
      return health;
      
    } catch (error) {
      console.error('Error performing health check:', error);
      return {
        overall: 'unhealthy',
        timestamp: new Date(),
        error: error.message,
        services: {},
        issues: ['Health check failed']
      };
    }
  }

  /**
   * Helper Methods
   */

  async getPrivacyMetrics() {
    // Implementation would gather metrics from all services
    return {
      totalUsers: this.metrics.totalUsers,
      privacyScore: this.metrics.privacyScore,
      encryptionStatus: this.complianceConfig.encryptionEnabled,
      retentionCompliance: this.metrics.retentionComplianceScore,
      lastHealthCheck: this.healthStatus.timestamp
    };
  }

  generateComplianceRecommendations(compliance) {
    const recommendations = [];
    
    if (compliance.score < 50) {
      recommendations.push({
        priority: 'high',
        title: 'Improve Privacy Compliance',
        description: 'Multiple privacy compliance issues detected. Review and update privacy settings.'
      });
    }
    
    if (compliance.details.gdpr?.score < 80) {
      recommendations.push({
        priority: 'medium',
        title: 'Review GDPR Consents',
        description: 'Some GDPR consents may need attention. Ensure all required consents are obtained.'
      });
    }
    
    return recommendations;
  }

  generatePrivacyRecommendations(report) {
    const recommendations = [];
    
    if (report.details.health?.overall !== 'healthy') {
      recommendations.push({
        priority: 'high',
        title: 'Address Privacy Service Issues',
        description: 'Privacy services are experiencing issues. Check system health.'
      });
    }
    
    if (report.details.retention && !report.details.retention.compliant) {
      recommendations.push({
        priority: 'medium',
        title: 'Data Retention Cleanup Needed',
        description: 'Some data has exceeded retention policies. Schedule cleanup.'
      });
    }
    
    return recommendations;
  }

  async applyPrivacyControlsToExport(exportResult, controls, options) {
    // Apply privacy controls to data export
    // This could include filtering sensitive data based on user preferences
    return exportResult;
  }

  getStartDateForPeriod(period) {
    const now = new Date();
    switch (period) {
      case 'week':
        return new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
      case 'month':
        return new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      case 'quarter':
        return new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
      case 'year':
        return new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));
      default:
        return new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    }
  }

  startHealthMonitoring() {
    // Perform health check every hour
    setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        console.error('Error in scheduled health check:', error);
      }
    }, 60 * 60 * 1000);
    
    // Initial health check
    setTimeout(() => this.performHealthCheck(), 5000);
  }

  /**
   * Get privacy manager status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      error: this.initializationError,
      config: this.complianceConfig,
      health: this.healthStatus,
      metrics: this.metrics
    };
  }
}

// Create and export singleton instance
export const privacyManager = new PrivacyManager();

// Export all individual services as well
export {
  gdprService,
  dataRetentionService,
  privacyControlsService,
  encryptionService
};

export default privacyManager; 