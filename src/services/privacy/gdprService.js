/**
 * GDPR Compliance Service for PropAgentic
 * Handles data export, deletion, consent management, and regulatory compliance
 */

import { 
  collection, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  doc, 
  updateDoc, 
  addDoc,
  serverTimestamp,
  writeBatch 
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { auditLogger } from '../security/auditLogger';

class GDPRService {
  constructor() {
    this.dataCategories = {
      // Personal Identifiable Information
      personal: {
        collections: ['users', 'user_profiles'],
        fields: ['email', 'firstName', 'lastName', 'phone', 'address'],
        retention: 2555, // 7 years
        sensitive: true
      },
      
      // Property and business data
      business: {
        collections: ['properties', 'leases', 'tenants'],
        fields: ['propertyDetails', 'leaseTerms', 'businessInfo'],
        retention: 2555, // 7 years for business records
        sensitive: false
      },
      
      // Communication data
      communications: {
        collections: ['messages', 'notifications', 'communications'],
        fields: ['content', 'attachments', 'metadata'],
        retention: 365, // 1 year
        sensitive: true
      },
      
      // Financial data
      financial: {
        collections: ['payments', 'escrow', 'transactions'],
        fields: ['amount', 'paymentMethods', 'bankDetails'],
        retention: 2555, // 7 years (legal requirement)
        sensitive: true
      },
      
      // Maintenance and operational data
      operational: {
        collections: ['maintenance_requests', 'work_orders', 'inspections'],
        fields: ['description', 'photos', 'workDetails'],
        retention: 1095, // 3 years
        sensitive: false
      },
      
      // Analytics and usage data
      analytics: {
        collections: ['user_analytics', 'system_logs', 'usage_stats'],
        fields: ['sessionData', 'behaviorData', 'performanceMetrics'],
        retention: 365, // 1 year
        sensitive: false
      }
    };
    
    // GDPR consent types
    this.consentTypes = {
      essential: {
        name: 'Essential Services',
        description: 'Required for basic platform functionality',
        required: true,
        withdrawable: false
      },
      functional: {
        name: 'Functional Features',
        description: 'Enhanced features and user experience',
        required: false,
        withdrawable: true
      },
      analytics: {
        name: 'Analytics & Performance',
        description: 'Help us improve our services',
        required: false,
        withdrawable: true
      },
      marketing: {
        name: 'Marketing Communications',
        description: 'Product updates and promotional content',
        required: false,
        withdrawable: true
      },
      sharing: {
        name: 'Data Sharing',
        description: 'Share data with landlords/tenants for service delivery',
        required: false,
        withdrawable: true
      }
    };
    
    // Data processing purposes
    this.processingPurposes = {
      service_delivery: 'Providing property management services',
      communication: 'Facilitating communication between parties',
      legal_compliance: 'Meeting legal and regulatory requirements',
      security: 'Protecting user accounts and detecting fraud',
      analytics: 'Understanding usage patterns and improving services',
      marketing: 'Sending relevant updates and promotional content'
    };
  }

  /**
   * Initialize GDPR compliance for a user
   */
  async initializeUserCompliance(userId, userEmail, initialConsents = {}) {
    try {
      const complianceData = {
        userId,
        userEmail,
        consents: this.getDefaultConsents(initialConsents),
        dataProcessingRecord: {
          created: new Date(),
          purposes: Object.keys(this.processingPurposes),
          legalBasis: 'consent',
          dataCategories: Object.keys(this.dataCategories)
        },
        requests: [],
        lastUpdated: new Date(),
        gdprVersion: '2.0',
        region: this.detectUserRegion() // EU, US, etc.
      };
      
      const complianceRef = doc(collection(db, 'gdpr_compliance'), userId);
      await updateDoc(complianceRef, {
        ...complianceData,
        lastUpdated: serverTimestamp()
      });
      
      await auditLogger.logEvent('GDPR_COMPLIANCE_INITIALIZED', {
        userId,
        consents: complianceData.consents,
        region: complianceData.region
      });
      
      return complianceData;
      
    } catch (error) {
      console.error('Error initializing GDPR compliance:', error);
      throw error;
    }
  }

  /**
   * Export all user data (Right to Data Portability)
   */
  async exportUserData(userId, format = 'json') {
    try {
      await auditLogger.logEvent('GDPR_DATA_EXPORT_REQUESTED', { userId, format });
      
      const userData = {};
      const exportTimestamp = new Date();
      
      // Collect data from all categories
      for (const [categoryName, category] of Object.entries(this.dataCategories)) {
        userData[categoryName] = {};
        
        for (const collectionName of category.collections) {
          try {
            const q = query(
              collection(db, collectionName),
              where('userId', '==', userId)
            );
            
            const querySnapshot = await getDocs(q);
            userData[categoryName][collectionName] = querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              exportedAt: exportTimestamp
            }));
            
          } catch (error) {
            console.warn(`Error exporting from ${collectionName}:`, error);
            userData[categoryName][collectionName] = [];
          }
        }
      }
      
      // Add metadata
      const exportData = {
        metadata: {
          exportDate: exportTimestamp,
          userId,
          format,
          gdprVersion: '2.0',
          dataCategories: Object.keys(this.dataCategories),
          totalRecords: this.countRecords(userData)
        },
        userData,
        consentHistory: await this.getConsentHistory(userId),
        processingHistory: await this.getProcessingHistory(userId)
      };
      
      // Format data based on requested format
      let formattedData;
      switch (format.toLowerCase()) {
        case 'csv':
          formattedData = this.formatAsCSV(exportData);
          break;
        case 'xml':
          formattedData = this.formatAsXML(exportData);
          break;
        case 'json':
        default:
          formattedData = JSON.stringify(exportData, null, 2);
          break;
      }
      
      // Log successful export
      await auditLogger.logEvent('GDPR_DATA_EXPORT_COMPLETED', {
        userId,
        format,
        recordCount: exportData.metadata.totalRecords,
        exportSize: formattedData.length
      });
      
      // Record export request
      await this.recordDataRequest(userId, 'export', {
        format,
        recordCount: exportData.metadata.totalRecords,
        status: 'completed'
      });
      
      return {
        data: formattedData,
        metadata: exportData.metadata,
        filename: `propagentic-data-export-${userId}-${exportTimestamp.toISOString().split('T')[0]}.${format}`
      };
      
    } catch (error) {
      console.error('Error exporting user data:', error);
      
      await auditLogger.logEvent('GDPR_DATA_EXPORT_FAILED', {
        userId,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Delete user data (Right to Erasure)
   */
  async deleteUserData(userId, options = {}) {
    try {
      const {
        preserveFinancial = true, // Keep financial records for legal compliance
        preserveAuditLogs = true, // Keep audit logs for security
        anonymizeInstead = false, // Anonymize instead of delete
        reason = 'user_request'
      } = options;
      
      await auditLogger.logEvent('GDPR_DATA_DELETION_REQUESTED', {
        userId,
        options,
        reason
      });
      
      const batch = writeBatch(db);
      const deletionReport = {
        deletedCollections: [],
        preservedCollections: [],
        anonymizedCollections: [],
        errors: []
      };
      
      // Process each data category
      for (const [categoryName, category] of Object.entries(this.dataCategories)) {
        // Skip financial data if preservation requested
        if (preserveFinancial && categoryName === 'financial') {
          deletionReport.preservedCollections.push({
            category: categoryName,
            reason: 'legal_compliance',
            collections: category.collections
          });
          continue;
        }
        
        // Process collections in this category
        for (const collectionName of category.collections) {
          try {
            const q = query(
              collection(db, collectionName),
              where('userId', '==', userId)
            );
            
            const querySnapshot = await getDocs(q);
            
            if (anonymizeInstead) {
              // Anonymize data instead of deleting
              querySnapshot.docs.forEach(docSnapshot => {
                const anonymizedData = this.anonymizeDocument(docSnapshot.data());
                batch.update(docSnapshot.ref, {
                  ...anonymizedData,
                  gdprStatus: 'anonymized',
                  anonymizedAt: serverTimestamp(),
                  originalUserId: userId // Keep reference for auditing
                });
              });
              
              deletionReport.anonymizedCollections.push({
                collection: collectionName,
                recordCount: querySnapshot.docs.length
              });
              
            } else {
              // Delete documents
              querySnapshot.docs.forEach(docSnapshot => {
                batch.delete(docSnapshot.ref);
              });
              
              deletionReport.deletedCollections.push({
                collection: collectionName,
                recordCount: querySnapshot.docs.length
              });
            }
            
          } catch (error) {
            console.error(`Error processing ${collectionName}:`, error);
            deletionReport.errors.push({
              collection: collectionName,
              error: error.message
            });
          }
        }
      }
      
      // Execute batch operations
      await batch.commit();
      
      // Update compliance record
      if (!anonymizeInstead) {
        await this.markUserAsDeleted(userId, deletionReport);
      }
      
      // Log completion
      await auditLogger.logEvent('GDPR_DATA_DELETION_COMPLETED', {
        userId,
        deletionReport,
        anonymized: anonymizeInstead
      });
      
      // Record deletion request
      await this.recordDataRequest(userId, anonymizeInstead ? 'anonymize' : 'delete', {
        status: 'completed',
        report: deletionReport
      });
      
      return deletionReport;
      
    } catch (error) {
      console.error('Error deleting user data:', error);
      
      await auditLogger.logEvent('GDPR_DATA_DELETION_FAILED', {
        userId,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Update user consent preferences
   */
  async updateConsent(userId, consentType, granted, purpose = null) {
    try {
      const complianceRef = doc(db, 'gdpr_compliance', userId);
      const consentUpdate = {
        type: consentType,
        granted,
        timestamp: new Date(),
        purpose,
        version: '2.0'
      };
      
      // Update current consents
      await updateDoc(complianceRef, {
        [`consents.${consentType}`]: consentUpdate,
        lastUpdated: serverTimestamp()
      });
      
      // Add to consent history
      await addDoc(collection(db, 'consent_history'), {
        userId,
        consentType,
        granted,
        purpose,
        timestamp: serverTimestamp(),
        ipAddress: this.getClientIP(),
        userAgent: navigator.userAgent
      });
      
      await auditLogger.logEvent('GDPR_CONSENT_UPDATED', {
        userId,
        consentType,
        granted,
        purpose
      });
      
      // Handle consent withdrawal consequences
      if (!granted) {
        await this.handleConsentWithdrawal(userId, consentType);
      }
      
      return consentUpdate;
      
    } catch (error) {
      console.error('Error updating consent:', error);
      throw error;
    }
  }

  /**
   * Get user's current consent status
   */
  async getConsentStatus(userId) {
    try {
      const complianceRef = doc(db, 'gdpr_compliance', userId);
      const complianceDoc = await getDocs(complianceRef);
      
      if (!complianceDoc.exists()) {
        return this.getDefaultConsents();
      }
      
      return complianceDoc.data().consents || this.getDefaultConsents();
      
    } catch (error) {
      console.error('Error getting consent status:', error);
      throw error;
    }
  }

  /**
   * Generate GDPR compliance report
   */
  async generateComplianceReport(startDate, endDate) {
    try {
      const report = {
        period: { startDate, endDate },
        statistics: {
          totalUsers: 0,
          dataExportRequests: 0,
          dataDeletionRequests: 0,
          consentUpdates: 0,
          complianceIssues: 0
        },
        consentAnalysis: {},
        retentionCompliance: {},
        generatedAt: new Date()
      };
      
      // Get compliance statistics
      const complianceQuery = query(
        collection(db, 'gdpr_compliance'),
        where('lastUpdated', '>=', startDate),
        where('lastUpdated', '<=', endDate)
      );
      
      const complianceSnapshot = await getDocs(complianceQuery);
      report.statistics.totalUsers = complianceSnapshot.docs.length;
      
      // Analyze consent patterns
      complianceSnapshot.docs.forEach(doc => {
        const data = doc.data();
        Object.entries(data.consents || {}).forEach(([type, consent]) => {
          if (!report.consentAnalysis[type]) {
            report.consentAnalysis[type] = { granted: 0, denied: 0 };
          }
          
          if (consent.granted) {
            report.consentAnalysis[type].granted++;
          } else {
            report.consentAnalysis[type].denied++;
          }
        });
      });
      
      // Get data requests statistics
      const requestsQuery = query(
        collection(db, 'gdpr_requests'),
        where('timestamp', '>=', startDate),
        where('timestamp', '<=', endDate)
      );
      
      const requestsSnapshot = await getDocs(requestsQuery);
      requestsSnapshot.docs.forEach(doc => {
        const request = doc.data();
        switch (request.type) {
          case 'export':
            report.statistics.dataExportRequests++;
            break;
          case 'delete':
          case 'anonymize':
            report.statistics.dataDeletionRequests++;
            break;
        }
      });
      
      return report;
      
    } catch (error) {
      console.error('Error generating compliance report:', error);
      throw error;
    }
  }

  /**
   * Check data retention compliance
   */
  async checkRetentionCompliance() {
    try {
      const issues = [];
      const now = new Date();
      
      for (const [categoryName, category] of Object.entries(this.dataCategories)) {
        const retentionDays = category.retention;
        const cutoffDate = new Date(now.getTime() - (retentionDays * 24 * 60 * 60 * 1000));
        
        for (const collectionName of category.collections) {
          try {
            const q = query(
              collection(db, collectionName),
              where('createdAt', '<', cutoffDate)
            );
            
            const oldData = await getDocs(q);
            
            if (oldData.docs.length > 0) {
              issues.push({
                category: categoryName,
                collection: collectionName,
                expiredRecords: oldData.docs.length,
                cutoffDate,
                retentionDays
              });
            }
            
          } catch (error) {
            console.warn(`Error checking retention for ${collectionName}:`, error);
          }
        }
      }
      
      return {
        compliant: issues.length === 0,
        issues,
        checkedAt: now,
        totalCategories: Object.keys(this.dataCategories).length
      };
      
    } catch (error) {
      console.error('Error checking retention compliance:', error);
      throw error;
    }
  }

  /**
   * Helper Methods
   */

  getDefaultConsents(overrides = {}) {
    const defaults = {};
    
    Object.entries(this.consentTypes).forEach(([type, config]) => {
      defaults[type] = {
        granted: overrides[type] !== undefined ? overrides[type] : config.required,
        timestamp: new Date(),
        version: '2.0',
        required: config.required
      };
    });
    
    return defaults;
  }

  anonymizeDocument(data) {
    const anonymized = { ...data };
    
    // Anonymize PII fields
    const piiFields = ['email', 'firstName', 'lastName', 'phone', 'address', 'ssn'];
    
    piiFields.forEach(field => {
      if (anonymized[field]) {
        anonymized[field] = this.anonymizeField(field, anonymized[field]);
      }
    });
    
    // Remove or hash sensitive identifiers
    delete anonymized.userId;
    delete anonymized.email;
    
    return anonymized;
  }

  anonymizeField(fieldType, value) {
    switch (fieldType) {
      case 'email':
        return 'anonymized@example.com';
      case 'firstName':
      case 'lastName':
        return 'ANONYMIZED';
      case 'phone':
        return '+1-XXX-XXX-XXXX';
      case 'address':
        return 'ANONYMIZED ADDRESS';
      default:
        return typeof value === 'string' ? 'ANONYMIZED' : null;
    }
  }

  async handleConsentWithdrawal(userId, consentType) {
    switch (consentType) {
      case 'analytics':
        // Stop analytics collection
        await this.disableAnalytics(userId);
        break;
      case 'marketing':
        // Unsubscribe from marketing communications
        await this.unsubscribeMarketing(userId);
        break;
      case 'sharing':
        // Restrict data sharing
        await this.restrictDataSharing(userId);
        break;
    }
  }

  async recordDataRequest(userId, type, details = {}) {
    try {
      await addDoc(collection(db, 'gdpr_requests'), {
        userId,
        type,
        details,
        timestamp: serverTimestamp(),
        status: details.status || 'pending'
      });
    } catch (error) {
      console.error('Error recording data request:', error);
    }
  }

  async markUserAsDeleted(userId, deletionReport) {
    try {
      const complianceRef = doc(db, 'gdpr_compliance', userId);
      await updateDoc(complianceRef, {
        deleted: true,
        deletedAt: serverTimestamp(),
        deletionReport,
        gdprStatus: 'deleted'
      });
    } catch (error) {
      console.error('Error marking user as deleted:', error);
    }
  }

  countRecords(userData) {
    let total = 0;
    Object.values(userData).forEach(category => {
      Object.values(category).forEach(collection => {
        total += Array.isArray(collection) ? collection.length : 0;
      });
    });
    return total;
  }

  formatAsCSV(exportData) {
    // Simplified CSV formatting - in production, use proper CSV library
    let csv = 'Category,Collection,Field,Value\n';
    
    Object.entries(exportData.userData).forEach(([category, collections]) => {
      Object.entries(collections).forEach(([collection, records]) => {
        records.forEach(record => {
          Object.entries(record).forEach(([field, value]) => {
            csv += `"${category}","${collection}","${field}","${JSON.stringify(value)}"\n`;
          });
        });
      });
    });
    
    return csv;
  }

  formatAsXML(exportData) {
    // Simplified XML formatting
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<PropAgentic_Data_Export>\n';
    xml += `<metadata>\n`;
    Object.entries(exportData.metadata).forEach(([key, value]) => {
      xml += `  <${key}>${value}</${key}>\n`;
    });
    xml += `</metadata>\n`;
    xml += `<userData>\n`;
    // Add user data structure...
    xml += `</userData>\n`;
    xml += '</PropAgentic_Data_Export>';
    
    return xml;
  }

  detectUserRegion() {
    // Simple region detection - in production, use proper geolocation service
    return 'EU'; // Default to EU for GDPR compliance
  }

  getClientIP() {
    // In production, get real client IP
    return 'client_ip_placeholder';
  }

  async getConsentHistory(userId) {
    try {
      const q = query(
        collection(db, 'consent_history'),
        where('userId', '==', userId)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data());
    } catch (error) {
      return [];
    }
  }

  async getProcessingHistory(userId) {
    try {
      const q = query(
        collection(db, 'audit_logs'),
        where('userId', '==', userId)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data());
    } catch (error) {
      return [];
    }
  }

  async disableAnalytics(userId) {
    // Implementation for disabling analytics
    console.log(`Analytics disabled for user ${userId}`);
  }

  async unsubscribeMarketing(userId) {
    // Implementation for unsubscribing from marketing
    console.log(`Marketing unsubscribed for user ${userId}`);
  }

  async restrictDataSharing(userId) {
    // Implementation for restricting data sharing
    console.log(`Data sharing restricted for user ${userId}`);
  }
}

// Create and export singleton instance
export const gdprService = new GDPRService();
export default gdprService; 