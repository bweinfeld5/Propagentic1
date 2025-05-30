/**
 * Legal Manager Service for PropAgentic
 * Coordinates all legal documents, user acknowledgments, and compliance tracking
 */

import { 
  doc, 
  updateDoc, 
  getDoc, 
  setDoc, 
  addDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { auditLogger } from '../security/auditLogger';
import { privacyManager } from '../privacy';

// Import all legal documents
import { termsOfService } from './termsOfService';
import { privacyPolicy } from './privacyPolicy';
import { contractorAgreement } from './contractorAgreement';
import { liabilityDisclaimer } from './liabilityDisclaimer';

class LegalManager {
  constructor() {
    // Legal document registry
    this.documents = {
      terms_of_service: termsOfService,
      privacy_policy: privacyPolicy,
      contractor_agreement: contractorAgreement,
      liability_disclaimer: liabilityDisclaimer
    };
    
    // User type to required documents mapping
    this.requiredDocuments = {
      landlord: [
        'terms_of_service',
        'privacy_policy', 
        'liability_disclaimer'
      ],
      tenant: [
        'terms_of_service',
        'privacy_policy'
      ],
      contractor: [
        'terms_of_service',
        'privacy_policy',
        'contractor_agreement',
        'liability_disclaimer'
      ]
    };
    
    // Document dependencies and relationships
    this.documentRelationships = {
      terms_of_service: {
        incorporates: ['privacy_policy', 'liability_disclaimer'],
        supplements: ['contractor_agreement']
      },
      privacy_policy: {
        implements: 'gdpr_ccpa_compliance',
        integrates_with: 'privacy_infrastructure'
      },
      contractor_agreement: {
        incorporates: ['terms_of_service', 'liability_disclaimer'],
        requires: 'insurance_verification'
      },
      liability_disclaimer: {
        protects: 'platform_operations',
        allocates: 'user_responsibilities'
      }
    };
    
    // Acknowledgment requirements
    this.acknowledgmentRequirements = {
      initial_signup: {
        required: true,
        documents: 'user_type_specific',
        verification_method: 'electronic_signature',
        ip_logging: true,
        timestamp_required: true
      },
      annual_renewal: {
        required: true,
        documents: 'updated_only',
        notification_advance: 30, // days
        grace_period: 14 // days
      },
      document_updates: {
        material_changes: 'explicit_consent_required',
        minor_changes: 'notification_only',
        emergency_updates: 'immediate_effect'
      }
    };
    
    // Compliance tracking
    this.complianceMetrics = {
      acknowledgment_rate: 0,
      outstanding_renewals: 0,
      compliance_score: 0,
      last_audit: null
    };
    
    this.isInitialized = false;
  }

  /**
   * Initialize legal management service
   */
  async initialize() {
    try {
      console.log('⚖️ Initializing Legal Manager...');
      
      // Validate all legal documents
      await this.validateDocuments();
      
      // Load compliance metrics
      await this.loadComplianceMetrics();
      
      // Schedule compliance monitoring
      this.scheduleComplianceChecks();
      
      this.isInitialized = true;
      
      await auditLogger.logEvent('LEGAL_MANAGER_INITIALIZED', {
        documents: Object.keys(this.documents),
        userTypes: Object.keys(this.requiredDocuments)
      });
      
      console.log('✅ Legal Manager initialized successfully');
      return { success: true };
      
    } catch (error) {
      console.error('Error initializing Legal Manager:', error);
      throw error;
    }
  }

  /**
   * Get required documents for user type
   */
  getRequiredDocuments(userType) {
    return this.requiredDocuments[userType] || [];
  }

  /**
   * Get legal document by type
   */
  getDocument(documentType, version = 'current') {
    const document = this.documents[documentType];
    if (!document) {
      throw new Error(`Document type not found: ${documentType}`);
    }
    
    if (version === 'current') {
      return document;
    }
    
    // TODO: Implement version history retrieval
    return document;
  }

  /**
   * Initialize legal compliance for new user
   */
  async initializeUserCompliance(userId, userType, userEmail, initialConsents = {}) {
    try {
      console.log(`Initializing legal compliance for user ${userId} (${userType})`);
      
      const requiredDocs = this.getRequiredDocuments(userType);
      const complianceData = {
        userId,
        userType,
        userEmail,
        acknowledgedDocuments: {},
        complianceStatus: 'pending',
        pendingDocuments: [...requiredDocs],
        lastUpdated: new Date(),
        createdAt: new Date()
      };
      
      // Store initial compliance record
      const complianceRef = doc(db, 'legal_compliance', userId);
      await setDoc(complianceRef, {
        ...complianceData,
        lastUpdated: serverTimestamp(),
        createdAt: serverTimestamp()
      });
      
      // Integration with privacy manager for comprehensive compliance
      if (privacyManager.isInitialized) {
        await privacyManager.initializeUserPrivacy(
          userId, 
          userEmail, 
          userType, 
          initialConsents
        );
      }
      
      await auditLogger.logEvent('USER_LEGAL_COMPLIANCE_INITIALIZED', {
        userId,
        userType,
        requiredDocuments: requiredDocs
      });
      
      return complianceData;
      
    } catch (error) {
      console.error(`Error initializing legal compliance for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Record document acknowledgment
   */
  async acknowledgeDocument(userId, documentType, acknowledgeData = {}) {
    try {
      const {
        version = 'current',
        method = 'electronic',
        ipAddress = null,
        userAgent = null,
        timestamp = new Date()
      } = acknowledgeData;
      
      // Validate document exists
      const document = this.getDocument(documentType, version);
      
      // Create acknowledgment record
      const acknowledgment = {
        documentType,
        documentVersion: document.version,
        acknowledgmentMethod: method,
        acknowledgedAt: timestamp,
        ipAddress,
        userAgent,
        userId,
        documentEffectiveDate: document.effectiveDate,
        complianceVerified: true
      };
      
      // Store acknowledgment
      await addDoc(collection(db, 'document_acknowledgments'), {
        ...acknowledgment,
        acknowledgedAt: serverTimestamp()
      });
      
      // Update user compliance status
      await this.updateUserComplianceStatus(userId, documentType, acknowledgment);
      
      // Log acknowledgment
      await auditLogger.logEvent('DOCUMENT_ACKNOWLEDGED', {
        userId,
        documentType,
        version: document.version,
        method
      });
      
      return acknowledgment;
      
    } catch (error) {
      console.error(`Error recording acknowledgment for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Check user compliance status
   */
  async checkUserCompliance(userId) {
    try {
      const complianceRef = doc(db, 'legal_compliance', userId);
      const complianceDoc = await getDoc(complianceRef);
      
      if (!complianceDoc.exists()) {
        return {
          compliant: false,
          reason: 'No compliance record found',
          pendingDocuments: [],
          acknowledgedDocuments: {}
        };
      }
      
      const complianceData = complianceDoc.data();
      const requiredDocs = this.getRequiredDocuments(complianceData.userType);
      
      // Check for missing acknowledgments
      const pendingDocuments = [];
      const acknowledgedDocuments = complianceData.acknowledgedDocuments || {};
      
      for (const docType of requiredDocs) {
        const currentDoc = this.getDocument(docType);
        const userAcknowledgment = acknowledgedDocuments[docType];
        
        if (!userAcknowledgment || userAcknowledgment.version !== currentDoc.version) {
          pendingDocuments.push({
            type: docType,
            currentVersion: currentDoc.version,
            userVersion: userAcknowledgment?.version || null,
            required: true
          });
        }
      }
      
      // Check renewal requirements
      const renewalRequired = await this.checkRenewalRequirements(userId, complianceData);
      
      const compliance = {
        compliant: pendingDocuments.length === 0 && !renewalRequired,
        pendingDocuments,
        acknowledgedDocuments,
        renewalRequired,
        complianceScore: this.calculateComplianceScore(complianceData, pendingDocuments),
        lastChecked: new Date()
      };
      
      return compliance;
      
    } catch (error) {
      console.error(`Error checking compliance for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get user acknowledgment history
   */
  async getUserAcknowledmentHistory(userId) {
    try {
      const q = query(
        collection(db, 'document_acknowledgments'),
        where('userId', '==', userId),
        orderBy('acknowledgedAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
    } catch (error) {
      console.error(`Error getting acknowledgment history for ${userId}:`, error);
      return [];
    }
  }

  /**
   * Handle document updates and user notifications
   */
  async handleDocumentUpdate(documentType, updateType = 'minor', notificationData = {}) {
    try {
      const document = this.getDocument(documentType);
      
      // Determine notification strategy based on update type
      let notificationStrategy;
      switch (updateType) {
        case 'material':
          notificationStrategy = 'explicit_consent_required';
          break;
        case 'minor':
          notificationStrategy = 'notification_only';
          break;
        case 'emergency':
          notificationStrategy = 'immediate_effect';
          break;
        default:
          notificationStrategy = 'notification_only';
      }
      
      // Get affected users
      const affectedUsers = await this.getAffectedUsers(documentType);
      
      // Create update record
      const updateRecord = {
        documentType,
        documentVersion: document.version,
        updateType,
        notificationStrategy,
        affectedUserCount: affectedUsers.length,
        updateDescription: notificationData.description || 'Document updated',
        effectiveDate: notificationData.effectiveDate || new Date(),
        createdAt: new Date()
      };
      
      // Store update record
      await addDoc(collection(db, 'document_updates'), {
        ...updateRecord,
        createdAt: serverTimestamp()
      });
      
      // Process notifications based on strategy
      await this.processUpdateNotifications(
        affectedUsers, 
        updateRecord, 
        notificationStrategy
      );
      
      await auditLogger.logEvent('DOCUMENT_UPDATED', {
        documentType,
        updateType,
        affectedUsers: affectedUsers.length
      });
      
      return updateRecord;
      
    } catch (error) {
      console.error(`Error handling document update for ${documentType}:`, error);
      throw error;
    }
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(options = {}) {
    try {
      const {
        period = 'month',
        userType = null,
        documentType = null,
        includeDetails = false
      } = options;
      
      const startDate = this.getStartDateForPeriod(period);
      const endDate = new Date();
      
      // Get compliance data
      const complianceQuery = query(
        collection(db, 'legal_compliance'),
        ...(userType ? [where('userType', '==', userType)] : [])
      );
      
      const complianceSnapshot = await getDocs(complianceQuery);
      
      // Get acknowledgment data
      const acknowledgmentQuery = query(
        collection(db, 'document_acknowledgments'),
        where('acknowledgedAt', '>=', startDate),
        where('acknowledgedAt', '<=', endDate),
        ...(documentType ? [where('documentType', '==', documentType)] : [])
      );
      
      const acknowledgmentSnapshot = await getDocs(acknowledgmentQuery);
      
      // Compile report
      const report = {
        period: { start: startDate, end: endDate },
        filters: { userType, documentType },
        summary: {
          totalUsers: complianceSnapshot.docs.length,
          compliantUsers: 0,
          pendingUsers: 0,
          acknowledgmentsThisPeriod: acknowledgmentSnapshot.docs.length,
          complianceRate: 0
        },
        byUserType: {},
        byDocument: {},
        recentAcknowledgments: [],
        pendingCompliance: [],
        generatedAt: new Date()
      };
      
      // Process compliance data
      complianceSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const userTypeData = report.byUserType[data.userType] || {
          total: 0,
          compliant: 0,
          pending: 0
        };
        
        userTypeData.total++;
        
        if (data.complianceStatus === 'compliant') {
          userTypeData.compliant++;
          report.summary.compliantUsers++;
        } else {
          userTypeData.pending++;
          report.summary.pendingUsers++;
        }
        
        report.byUserType[data.userType] = userTypeData;
      });
      
      // Calculate compliance rate
      if (report.summary.totalUsers > 0) {
        report.summary.complianceRate = Math.round(
          (report.summary.compliantUsers / report.summary.totalUsers) * 100
        );
      }
      
      // Process acknowledgment data by document
      acknowledgmentSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const docData = report.byDocument[data.documentType] || {
          acknowledgments: 0,
          uniqueUsers: new Set()
        };
        
        docData.acknowledgments++;
        docData.uniqueUsers.add(data.userId);
        
        report.byDocument[data.documentType] = docData;
        
        // Add to recent acknowledgments
        if (report.recentAcknowledgments.length < 50) {
          report.recentAcknowledgments.push({
            userId: data.userId,
            documentType: data.documentType,
            acknowledgedAt: data.acknowledgedAt,
            method: data.acknowledgmentMethod
          });
        }
      });
      
      // Convert Sets to counts
      Object.keys(report.byDocument).forEach(docType => {
        report.byDocument[docType].uniqueUsers = report.byDocument[docType].uniqueUsers.size;
      });
      
      return report;
      
    } catch (error) {
      console.error('Error generating compliance report:', error);
      throw error;
    }
  }

  /**
   * Helper Methods
   */

  async updateUserComplianceStatus(userId, documentType, acknowledgment) {
    try {
      const complianceRef = doc(db, 'legal_compliance', userId);
      const complianceDoc = await getDoc(complianceRef);
      
      if (!complianceDoc.exists()) {
        throw new Error(`Compliance record not found for user ${userId}`);
      }
      
      const complianceData = complianceDoc.data();
      const acknowledgedDocuments = complianceData.acknowledgedDocuments || {};
      
      // Update acknowledged documents
      acknowledgedDocuments[documentType] = {
        version: acknowledgment.documentVersion,
        acknowledgedAt: acknowledgment.acknowledgedAt,
        method: acknowledgment.acknowledgmentMethod
      };
      
      // Update pending documents
      const pendingDocuments = (complianceData.pendingDocuments || [])
        .filter(docType => docType !== documentType);
      
      // Determine new compliance status
      const complianceStatus = pendingDocuments.length === 0 ? 'compliant' : 'pending';
      
      // Update record
      await updateDoc(complianceRef, {
        acknowledgedDocuments,
        pendingDocuments,
        complianceStatus,
        lastUpdated: serverTimestamp()
      });
      
    } catch (error) {
      console.error(`Error updating compliance status for ${userId}:`, error);
      throw error;
    }
  }

  async validateDocuments() {
    const validationResults = {};
    
    for (const [docType, document] of Object.entries(this.documents)) {
      validationResults[docType] = {
        valid: true,
        version: document.version,
        effectiveDate: document.effectiveDate,
        lastUpdated: document.lastUpdated
      };
      
      // Basic validation
      if (!document.document || !document.version || !document.effectiveDate) {
        validationResults[docType].valid = false;
        validationResults[docType].errors = ['Missing required fields'];
      }
    }
    
    console.log('Document validation results:', validationResults);
    return validationResults;
  }

  async checkRenewalRequirements(userId, complianceData) {
    // Check if annual renewal is required
    const lastRenewal = complianceData.lastRenewal || complianceData.createdAt;
    const oneYearAgo = new Date(Date.now() - (365 * 24 * 60 * 60 * 1000));
    
    return lastRenewal < oneYearAgo;
  }

  calculateComplianceScore(complianceData, pendingDocuments) {
    const requiredDocs = this.getRequiredDocuments(complianceData.userType);
    if (requiredDocs.length === 0) return 100;
    
    const acknowledgedCount = requiredDocs.length - pendingDocuments.length;
    return Math.round((acknowledgedCount / requiredDocs.length) * 100);
  }

  async getAffectedUsers(documentType) {
    // Get users who need to acknowledge this document type
    const affectedUserTypes = [];
    
    for (const [userType, requiredDocs] of Object.entries(this.requiredDocuments)) {
      if (requiredDocs.includes(documentType)) {
        affectedUserTypes.push(userType);
      }
    }
    
    if (affectedUserTypes.length === 0) return [];
    
    const q = query(
      collection(db, 'legal_compliance'),
      where('userType', 'in', affectedUserTypes)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      userId: doc.id,
      ...doc.data()
    }));
  }

  async processUpdateNotifications(affectedUsers, updateRecord, strategy) {
    // Implementation would depend on notification system
    console.log(`Processing ${strategy} notifications for ${affectedUsers.length} users`);
    
    // This would integrate with email/notification service
    // For now, we'll just log the intent
    for (const user of affectedUsers) {
      await auditLogger.logEvent('DOCUMENT_UPDATE_NOTIFICATION', {
        userId: user.userId,
        documentType: updateRecord.documentType,
        notificationStrategy: strategy
      });
    }
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

  async loadComplianceMetrics() {
    try {
      // Load current compliance metrics
      const q = query(collection(db, 'legal_compliance'));
      const snapshot = await getDocs(q);
      
      let compliant = 0;
      let total = snapshot.docs.length;
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.complianceStatus === 'compliant') {
          compliant++;
        }
      });
      
      this.complianceMetrics = {
        acknowledgment_rate: total > 0 ? Math.round((compliant / total) * 100) : 0,
        outstanding_renewals: total - compliant,
        compliance_score: total > 0 ? Math.round((compliant / total) * 100) : 100,
        last_audit: new Date()
      };
      
    } catch (error) {
      console.error('Error loading compliance metrics:', error);
    }
  }

  scheduleComplianceChecks() {
    // Run compliance checks daily
    setInterval(async () => {
      try {
        await this.loadComplianceMetrics();
      } catch (error) {
        console.error('Error in scheduled compliance check:', error);
      }
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * Get legal manager status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      documents: Object.keys(this.documents),
      complianceMetrics: this.complianceMetrics,
      userTypes: Object.keys(this.requiredDocuments)
    };
  }
}

// Create and export singleton instance
export const legalManager = new LegalManager();
export default legalManager; 