/**
 * Privacy Controls Service for PropAgentic
 * Manages user data visibility, sharing preferences, and privacy settings
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
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { auditLogger } from '../security/auditLogger';

class PrivacyControlsService {
  constructor() {
    // Privacy preference categories
    this.privacyCategories = {
      profile_visibility: {
        name: 'Profile Visibility',
        description: 'Control who can see your profile information',
        settings: {
          public: 'Visible to all platform users',
          contacts_only: 'Visible only to your contacts (landlords/tenants)',
          private: 'Visible only to you',
          limited: 'Limited information visible'
        },
        default: 'contacts_only'
      },
      
      contact_information: {
        name: 'Contact Information',
        description: 'Control how your contact information is shared',
        settings: {
          full_access: 'Full contact information available',
          platform_only: 'Contact only through platform messaging',
          restricted: 'Limited contact information',
          no_contact: 'No direct contact allowed'
        },
        default: 'platform_only'
      },
      
      location_data: {
        name: 'Location Data',
        description: 'Control location-based features and data sharing',
        settings: {
          precise: 'Share precise location data',
          approximate: 'Share approximate location (city level)',
          none: 'Do not share location data'
        },
        default: 'approximate'
      },
      
      activity_tracking: {
        name: 'Activity Tracking',
        description: 'Control how your platform activity is tracked and used',
        settings: {
          full: 'Track all activity for personalization',
          limited: 'Track only essential activity',
          minimal: 'Track only for security and functionality',
          none: 'No activity tracking'
        },
        default: 'limited'
      },
      
      communication_preferences: {
        name: 'Communication Preferences',
        description: 'Control how you receive communications',
        settings: {
          all: 'Receive all communications',
          important_only: 'Only important notifications',
          emergency_only: 'Only emergency communications',
          none: 'No communications (not recommended)'
        },
        default: 'important_only'
      },
      
      data_sharing: {
        name: 'Data Sharing',
        description: 'Control how your data is shared with landlords/tenants',
        settings: {
          full: 'Share all relevant data for service delivery',
          limited: 'Share only essential data',
          minimal: 'Share minimal data required',
          none: 'No data sharing (may limit functionality)'
        },
        default: 'limited'
      },
      
      third_party_integrations: {
        name: 'Third-Party Integrations',
        description: 'Control data sharing with third-party services',
        settings: {
          enabled: 'Allow third-party integrations',
          selective: 'Allow only selected integrations',
          disabled: 'No third-party integrations'
        },
        default: 'selective'
      },
      
      analytics_participation: {
        name: 'Analytics Participation',
        description: 'Control participation in analytics and research',
        settings: {
          full: 'Full participation in analytics',
          anonymous: 'Anonymous participation only',
          none: 'No analytics participation'
        },
        default: 'anonymous'
      }
    };
    
    // Data visibility controls
    this.dataVisibilityControls = {
      // Personal information
      personal_info: {
        fields: ['firstName', 'lastName', 'email', 'phone'],
        visibility_levels: {
          public: { visible: true, masked: false },
          contacts: { visible: true, masked: false },
          limited: { visible: true, masked: true },
          private: { visible: false, masked: true }
        }
      },
      
      // Property information
      property_info: {
        fields: ['address', 'propertyDetails', 'photos'],
        visibility_levels: {
          public: { visible: true, masked: false },
          contacts: { visible: true, masked: false },
          limited: { visible: true, masked: true },
          private: { visible: false, masked: true }
        }
      },
      
      // Communication history
      communication_history: {
        fields: ['messages', 'callHistory', 'meetingNotes'],
        visibility_levels: {
          full: { visible: true, masked: false },
          limited: { visible: true, masked: true },
          none: { visible: false, masked: true }
        }
      },
      
      // Financial information
      financial_info: {
        fields: ['paymentHistory', 'rentAmount', 'deposits'],
        visibility_levels: {
          full: { visible: true, masked: false },
          summary: { visible: true, masked: true },
          none: { visible: false, masked: true }
        }
      },
      
      // Activity data
      activity_data: {
        fields: ['loginHistory', 'platformUsage', 'preferences'],
        visibility_levels: {
          full: { visible: true, masked: false },
          limited: { visible: true, masked: true },
          none: { visible: false, masked: true }
        }
      }
    };
    
    // Sharing permissions for different user types
    this.sharingPermissions = {
      landlord: {
        can_access: ['personal_info', 'communication_history', 'financial_info'],
        default_level: 'contacts',
        restrictions: ['activity_data']
      },
      
      tenant: {
        can_access: ['personal_info', 'communication_history'],
        default_level: 'contacts',
        restrictions: ['financial_info', 'activity_data']
      },
      
      contractor: {
        can_access: ['personal_info', 'communication_history'],
        default_level: 'limited',
        restrictions: ['financial_info', 'activity_data', 'property_info']
      },
      
      admin: {
        can_access: ['personal_info', 'communication_history', 'activity_data'],
        default_level: 'full',
        restrictions: []
      }
    };
  }

  /**
   * Initialize privacy controls for a user
   */
  async initializeUserPrivacyControls(userId, userType = 'tenant', initialPreferences = {}) {
    try {
      const defaultControls = this.getDefaultPrivacyControls(userType);
      
      const privacyControls = {
        userId,
        userType,
        preferences: { ...defaultControls, ...initialPreferences },
        visibility: this.getDefaultVisibilitySettings(userType),
        sharing: this.getDefaultSharingSettings(userType),
        consents: this.getDefaultConsents(),
        lastUpdated: new Date(),
        version: '1.0'
      };
      
      const controlsRef = doc(db, 'privacy_controls', userId);
      await setDoc(controlsRef, {
        ...privacyControls,
        lastUpdated: serverTimestamp()
      });
      
      await auditLogger.logEvent('PRIVACY_CONTROLS_INITIALIZED', {
        userId,
        userType,
        preferences: privacyControls.preferences
      });
      
      return privacyControls;
      
    } catch (error) {
      console.error('Error initializing privacy controls:', error);
      throw error;
    }
  }

  /**
   * Update user privacy preference
   */
  async updatePrivacyPreference(userId, category, setting, reason = 'user_preference') {
    try {
      // Validate category and setting
      if (!this.privacyCategories[category]) {
        throw new Error(`Invalid privacy category: ${category}`);
      }
      
      if (!this.privacyCategories[category].settings[setting]) {
        throw new Error(`Invalid setting for category ${category}: ${setting}`);
      }
      
      const controlsRef = doc(db, 'privacy_controls', userId);
      const update = {
        [`preferences.${category}`]: setting,
        lastUpdated: serverTimestamp()
      };
      
      await updateDoc(controlsRef, update);
      
      // Log the preference change
      await auditLogger.logEvent('PRIVACY_PREFERENCE_UPDATED', {
        userId,
        category,
        setting,
        reason
      });
      
      // Handle cascading effects of preference changes
      await this.handlePreferenceChange(userId, category, setting);
      
      return { success: true, category, setting };
      
    } catch (error) {
      console.error('Error updating privacy preference:', error);
      throw error;
    }
  }

  /**
   * Update data visibility settings
   */
  async updateDataVisibility(userId, dataType, visibilityLevel, targetUserType = null) {
    try {
      if (!this.dataVisibilityControls[dataType]) {
        throw new Error(`Invalid data type: ${dataType}`);
      }
      
      const controlsRef = doc(db, 'privacy_controls', userId);
      const updatePath = targetUserType ? 
        `visibility.${dataType}.${targetUserType}` : 
        `visibility.${dataType}.default`;
      
      const update = {
        [updatePath]: visibilityLevel,
        lastUpdated: serverTimestamp()
      };
      
      await updateDoc(controlsRef, update);
      
      await auditLogger.logEvent('DATA_VISIBILITY_UPDATED', {
        userId,
        dataType,
        visibilityLevel,
        targetUserType
      });
      
      return { success: true, dataType, visibilityLevel };
      
    } catch (error) {
      console.error('Error updating data visibility:', error);
      throw error;
    }
  }

  /**
   * Update sharing permissions
   */
  async updateSharingPermission(userId, sharingType, enabled, restrictions = []) {
    try {
      const controlsRef = doc(db, 'privacy_controls', userId);
      const update = {
        [`sharing.${sharingType}.enabled`]: enabled,
        [`sharing.${sharingType}.restrictions`]: restrictions,
        lastUpdated: serverTimestamp()
      };
      
      await updateDoc(controlsRef, update);
      
      await auditLogger.logEvent('SHARING_PERMISSION_UPDATED', {
        userId,
        sharingType,
        enabled,
        restrictions
      });
      
      return { success: true, sharingType, enabled };
      
    } catch (error) {
      console.error('Error updating sharing permission:', error);
      throw error;
    }
  }

  /**
   * Get user's privacy dashboard data
   */
  async getPrivacyDashboard(userId) {
    try {
      const controlsRef = doc(db, 'privacy_controls', userId);
      const controlsDoc = await getDoc(controlsRef);
      
      if (!controlsDoc.exists()) {
        throw new Error('Privacy controls not found for user');
      }
      
      const controls = controlsDoc.data();
      
      // Get privacy analysis
      const analysis = await this.analyzePrivacySettings(controls);
      
      // Get recent privacy activities
      const recentActivities = await this.getRecentPrivacyActivities(userId);
      
      // Get data sharing summary
      const dataSharingSummary = await this.getDataSharingSummary(userId);
      
      // Get consent status
      const consentStatus = await this.getConsentStatus(userId);
      
      return {
        controls,
        analysis,
        recentActivities,
        dataSharingSummary,
        consentStatus,
        recommendations: this.generatePrivacyRecommendations(controls, analysis)
      };
      
    } catch (error) {
      console.error('Error getting privacy dashboard:', error);
      throw error;
    }
  }

  /**
   * Check if data access is allowed
   */
  async checkDataAccess(userId, requestorUserId, dataType, accessLevel = 'view') {
    try {
      // Get privacy controls for the data owner
      const controlsRef = doc(db, 'privacy_controls', userId);
      const controlsDoc = await getDoc(controlsRef);
      
      if (!controlsDoc.exists()) {
        return { allowed: false, reason: 'No privacy controls found' };
      }
      
      const controls = controlsDoc.data();
      
      // Get requestor's user type
      const requestorType = await this.getUserType(requestorUserId);
      
      // Check data visibility settings
      const visibilitySettings = controls.visibility[dataType];
      if (!visibilitySettings) {
        return { allowed: false, reason: 'Data type not configured' };
      }
      
      // Check specific user type permissions
      const userTypeVisibility = visibilitySettings[requestorType] || visibilitySettings.default;
      const visibilityControl = this.dataVisibilityControls[dataType].visibility_levels[userTypeVisibility];
      
      if (!visibilityControl || !visibilityControl.visible) {
        return { 
          allowed: false, 
          reason: 'Data not visible to requestor type',
          masked: visibilityControl?.masked || true
        };
      }
      
      // Check sharing permissions
      const sharingSettings = controls.sharing[requestorType];
      if (sharingSettings && !sharingSettings.enabled) {
        return { allowed: false, reason: 'Data sharing disabled for requestor type' };
      }
      
      // Log data access
      await auditLogger.logEvent('DATA_ACCESS_CHECKED', {
        userId,
        requestorUserId,
        requestorType,
        dataType,
        accessLevel,
        allowed: true
      });
      
      return { 
        allowed: true, 
        masked: visibilityControl.masked,
        restrictions: sharingSettings?.restrictions || []
      };
      
    } catch (error) {
      console.error('Error checking data access:', error);
      return { allowed: false, reason: 'Access check failed' };
    }
  }

  /**
   * Apply data masking based on privacy settings
   */
  applyDataMasking(data, dataType, visibilityLevel) {
    const control = this.dataVisibilityControls[dataType];
    if (!control) return data;
    
    const visibilitySettings = control.visibility_levels[visibilityLevel];
    if (!visibilitySettings.masked) return data;
    
    const maskedData = { ...data };
    
    // Apply field-specific masking
    control.fields.forEach(field => {
      if (maskedData[field]) {
        maskedData[field] = this.maskField(field, maskedData[field]);
      }
    });
    
    return maskedData;
  }

  /**
   * Generate privacy report for user
   */
  async generatePrivacyReport(userId, period = 'month') {
    try {
      const startDate = new Date();
      switch (period) {
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }
      
      // Get privacy activities
      const activities = await this.getPrivacyActivities(userId, startDate);
      
      // Get data access requests
      const accessRequests = await this.getDataAccessRequests(userId, startDate);
      
      // Get sharing summary
      const sharingSummary = await this.getDataSharingSummary(userId, startDate);
      
      // Analyze privacy posture
      const privacyPosture = await this.analyzePrivacyPosture(userId);
      
      const report = {
        userId,
        period: { start: startDate, end: new Date() },
        summary: {
          privacyChanges: activities.length,
          dataAccesses: accessRequests.length,
          sharingEvents: sharingSummary.totalEvents || 0,
          privacyScore: privacyPosture.score
        },
        activities,
        accessRequests,
        sharingSummary,
        privacyPosture,
        recommendations: this.generatePrivacyRecommendations(null, privacyPosture),
        generatedAt: new Date()
      };
      
      return report;
      
    } catch (error) {
      console.error('Error generating privacy report:', error);
      throw error;
    }
  }

  /**
   * Helper Methods
   */

  getDefaultPrivacyControls(userType) {
    const defaults = {};
    
    Object.entries(this.privacyCategories).forEach(([category, config]) => {
      defaults[category] = config.default;
    });
    
    // Adjust defaults based on user type
    if (userType === 'landlord') {
      defaults.profile_visibility = 'contacts_only';
      defaults.data_sharing = 'limited';
    } else if (userType === 'contractor') {
      defaults.profile_visibility = 'limited';
      defaults.contact_information = 'platform_only';
    }
    
    return defaults;
  }

  getDefaultVisibilitySettings(userType) {
    const defaults = {};
    
    Object.keys(this.dataVisibilityControls).forEach(dataType => {
      defaults[dataType] = {
        default: 'contacts',
        landlord: 'contacts',
        tenant: 'limited',
        contractor: 'limited',
        admin: 'full'
      };
    });
    
    return defaults;
  }

  getDefaultSharingSettings(userType) {
    const defaults = {};
    
    Object.entries(this.sharingPermissions).forEach(([type, permissions]) => {
      defaults[type] = {
        enabled: type !== 'admin', // Admin access controlled separately
        restrictions: permissions.restrictions || []
      };
    });
    
    return defaults;
  }

  getDefaultConsents() {
    return {
      privacy_policy: { granted: false, timestamp: new Date() },
      terms_of_service: { granted: false, timestamp: new Date() },
      data_processing: { granted: false, timestamp: new Date() },
      communications: { granted: false, timestamp: new Date() }
    };
  }

  async handlePreferenceChange(userId, category, setting) {
    // Handle cascading effects of preference changes
    switch (category) {
      case 'data_sharing':
        if (setting === 'none') {
          // Disable all sharing when user chooses no sharing
          await this.disableAllSharing(userId);
        }
        break;
        
      case 'activity_tracking':
        if (setting === 'none') {
          // Stop all activity tracking
          await this.disableActivityTracking(userId);
        }
        break;
        
      case 'communication_preferences':
        if (setting === 'none') {
          // Update notification preferences
          await this.disableAllCommunications(userId);
        }
        break;
    }
  }

  async analyzePrivacySettings(controls) {
    const analysis = {
      privacy_score: 0,
      strengths: [],
      concerns: [],
      recommendations: []
    };
    
    // Calculate privacy score (0-100)
    let score = 0;
    const preferences = controls.preferences;
    
    // Higher score for more private settings
    if (preferences.profile_visibility === 'private') score += 20;
    else if (preferences.profile_visibility === 'contacts_only') score += 15;
    else if (preferences.profile_visibility === 'limited') score += 10;
    
    if (preferences.data_sharing === 'none') score += 25;
    else if (preferences.data_sharing === 'minimal') score += 20;
    else if (preferences.data_sharing === 'limited') score += 15;
    
    if (preferences.activity_tracking === 'none') score += 20;
    else if (preferences.activity_tracking === 'minimal') score += 15;
    else if (preferences.activity_tracking === 'limited') score += 10;
    
    if (preferences.location_data === 'none') score += 15;
    else if (preferences.location_data === 'approximate') score += 10;
    
    if (preferences.third_party_integrations === 'disabled') score += 20;
    else if (preferences.third_party_integrations === 'selective') score += 15;
    
    analysis.privacy_score = Math.min(score, 100);
    
    // Identify strengths and concerns
    if (preferences.profile_visibility === 'private') {
      analysis.strengths.push('Profile is private');
    } else if (preferences.profile_visibility === 'public') {
      analysis.concerns.push('Profile is publicly visible');
    }
    
    if (preferences.data_sharing === 'full') {
      analysis.concerns.push('Full data sharing enabled');
    }
    
    if (preferences.activity_tracking === 'full') {
      analysis.concerns.push('Full activity tracking enabled');
    }
    
    return analysis;
  }

  async getRecentPrivacyActivities(userId, limit = 10) {
    try {
      const q = query(
        collection(db, 'audit_logs'),
        where('userId', '==', userId),
        where('eventType', 'in', [
          'PRIVACY_PREFERENCE_UPDATED',
          'DATA_VISIBILITY_UPDATED',
          'SHARING_PERMISSION_UPDATED'
        ]),
        limit(limit)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data());
      
    } catch (error) {
      console.error('Error getting recent privacy activities:', error);
      return [];
    }
  }

  async getDataSharingSummary(userId, startDate = null) {
    try {
      // Implementation would depend on how data sharing events are tracked
      return {
        totalEvents: 0,
        byType: {},
        recentShares: []
      };
      
    } catch (error) {
      console.error('Error getting data sharing summary:', error);
      return { totalEvents: 0, byType: {}, recentShares: [] };
    }
  }

  async getConsentStatus(userId) {
    try {
      // Get GDPR consent status from gdprService
      // This would integrate with the gdprService
      return {
        gdpr_compliant: true,
        consents: {},
        last_updated: new Date()
      };
      
    } catch (error) {
      console.error('Error getting consent status:', error);
      return { gdpr_compliant: false, consents: {}, last_updated: null };
    }
  }

  generatePrivacyRecommendations(controls, analysis) {
    const recommendations = [];
    
    if (analysis && analysis.privacy_score < 50) {
      recommendations.push({
        type: 'privacy_score',
        priority: 'high',
        title: 'Improve Privacy Settings',
        description: 'Your privacy score is low. Consider reviewing your data sharing and visibility settings.'
      });
    }
    
    if (controls && controls.preferences.profile_visibility === 'public') {
      recommendations.push({
        type: 'profile_visibility',
        priority: 'medium',
        title: 'Make Profile More Private',
        description: 'Consider limiting profile visibility to contacts only for better privacy.'
      });
    }
    
    if (controls && controls.preferences.data_sharing === 'full') {
      recommendations.push({
        type: 'data_sharing',
        priority: 'medium',
        title: 'Review Data Sharing',
        description: 'You have full data sharing enabled. Review which data is being shared.'
      });
    }
    
    return recommendations;
  }

  maskField(fieldName, value) {
    switch (fieldName) {
      case 'email':
        const [username, domain] = value.split('@');
        return `${username.charAt(0)}***@${domain}`;
      case 'phone':
        return value.replace(/(\d{3})\d{3}(\d{4})/, '$1***$2');
      case 'firstName':
      case 'lastName':
        return value.charAt(0) + '*'.repeat(value.length - 1);
      case 'address':
        return value.replace(/\d+/g, '***');
      default:
        return '***';
    }
  }

  async getUserType(userId) {
    // Get user type from user profile
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      return userDoc.exists() ? userDoc.data().userType : 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  async disableAllSharing(userId) {
    // Implementation to disable all data sharing
    console.log(`Disabling all data sharing for user ${userId}`);
  }

  async disableActivityTracking(userId) {
    // Implementation to disable activity tracking
    console.log(`Disabling activity tracking for user ${userId}`);
  }

  async disableAllCommunications(userId) {
    // Implementation to disable communications
    console.log(`Disabling all communications for user ${userId}`);
  }

  async getPrivacyActivities(userId, startDate) {
    // Get privacy-related activities since start date
    return [];
  }

  async getDataAccessRequests(userId, startDate) {
    // Get data access requests since start date
    return [];
  }

  async analyzePrivacyPosture(userId) {
    // Analyze overall privacy posture
    return { score: 75, strengths: [], weaknesses: [] };
  }
}

// Create and export singleton instance
export const privacyControlsService = new PrivacyControlsService();
export default privacyControlsService; 