/**
 * Analytics Manager
 * Unified coordination of all PropAgentic analytics services
 */

import { firebaseAnalytics } from './firebaseAnalytics';
import { conversionTracking } from './conversionTracking';
import { abTesting } from './abTesting';
import { auditLogger } from '../security/auditLogger';

export const analyticsManager = {
  isInitialized: false,
  userContext: null,
  eventQueue: [],
  serviceStatus: {
    firebase: { initialized: false, enabled: false, lastError: null },
    conversion: { initialized: false, enabled: false, lastError: null },
    abTesting: { initialized: false, enabled: false, lastError: null }
  },

  config: {
    batchSize: 10,
    flushInterval: 30000, // 30 seconds
    debugMode: false
  },

  flushTimer: null,

  async initialize(userConsent = false, config = {}) {
    try {
      // Apply custom config
      this.config = { ...this.config, ...config };

      const services = [];

      // Initialize Firebase Analytics (only with user consent)
      if (userConsent && config.enableFirebaseAnalytics !== false) {
        try {
          await firebaseAnalytics.initialize(userConsent);
          this.serviceStatus.firebase.initialized = true;
          this.serviceStatus.firebase.enabled = true;
          services.push('firebase');
        } catch (error) {
          this.serviceStatus.firebase.lastError = error.message;
          console.error('Firebase Analytics initialization failed:', error);
        }
      }

      // Initialize Conversion Tracking
      if (config.enableConversionTracking !== false) {
        try {
          await conversionTracking.initialize();
          this.serviceStatus.conversion.initialized = true;
          this.serviceStatus.conversion.enabled = true;
          services.push('conversion');
        } catch (error) {
          this.serviceStatus.conversion.lastError = error.message;
          console.error('Conversion Tracking initialization failed:', error);
        }
      }

      // Initialize A/B Testing
      if (config.enableABTesting !== false) {
        try {
          await abTesting.initialize();
          this.serviceStatus.abTesting.initialized = true;
          this.serviceStatus.abTesting.enabled = true;
          services.push('abTesting');
        } catch (error) {
          this.serviceStatus.abTesting.lastError = error.message;
          console.error('A/B Testing initialization failed:', error);
        }
      }

      this.isInitialized = true;

      // Start batch processing
      this.startBatchProcessing();

      await auditLogger.logEvent('ANALYTICS_MANAGER_INITIALIZED', {
        services,
        serviceStatus: this.serviceStatus,
        userConsent
      });

      return { success: true, services };
    } catch (error) {
      console.error('Analytics Manager initialization failed:', error);
      throw error;
    }
  },

  async setUserContext(userId, userProfile) {
    try {
      this.userContext = { userId, userProfile };

      if (this.serviceStatus.firebase.enabled) {
        await firebaseAnalytics.setUserContext(userId, userProfile);
      }
    } catch (error) {
      console.error('Failed to set user context:', error);
    }
  },

  async trackEvent(eventName, parameters = {}) {
    if (!this.isInitialized) return;

    try {
      const event = {
        eventName,
        parameters: {
          ...parameters,
          timestamp: new Date().toISOString(),
          userId: this.userContext?.userId
        },
        timestamp: Date.now()
      };

      this.eventQueue.push(event);

      // Flush if batch size reached
      if (this.eventQueue.length >= this.config.batchSize) {
        await this.flushEvents();
      }
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  },

  async trackPageView(pageName, additionalParams = {}) {
    if (this.serviceStatus.firebase.enabled) {
      await firebaseAnalytics.trackPageView(pageName, additionalParams);
    }
    await this.trackEvent('page_view', { page_name: pageName, ...additionalParams });
  },

  async flushEvents() {
    if (this.eventQueue.length === 0) return;

    try {
      if (this.serviceStatus.firebase.enabled) {
        const events = this.eventQueue.map(event => ({
          name: event.eventName,
          parameters: event.parameters
        }));

        await firebaseAnalytics.trackEventBatch(events);
      }

      this.eventQueue = [];
    } catch (error) {
      console.error('Failed to flush events:', error);
      // Keep events in queue on error for retry
    }
  },

  startBatchProcessing() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flushEvents();
    }, this.config.flushInterval);
  },

  stopBatchProcessing() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  },

  async assignUserToExperiment(userId, experimentId, userProfile) {
    if (!this.serviceStatus.abTesting.enabled) {
      return null;
    }

    try {
      return await abTesting.assignUserToExperiment(userId, experimentId, userProfile);
    } catch (error) {
      console.error('Failed to assign user to experiment:', error);
      return null;
    }
  },

  async getUserExperimentVariant(userId, experimentId) {
    if (!this.serviceStatus.abTesting.enabled) {
      return null;
    }

    try {
      return await abTesting.getUserVariant(userId, experimentId);
    } catch (error) {
      console.error('Failed to get user experiment variant:', error);
      return null;
    }
  },

  async isFeatureEnabled(userId, featureName, userProfile) {
    if (!this.serviceStatus.abTesting.enabled) {
      return false;
    }

    try {
      return await abTesting.isFeatureEnabled(userId, featureName, userProfile);
    } catch (error) {
      console.error('Failed to check feature enabled:', error);
      return false;
    }
  },

  async clearUserData() {
    this.userContext = null;
    this.eventQueue = [];

    if (this.serviceStatus.firebase.enabled) {
      await firebaseAnalytics.clearUserData();
    }
  },

  getStatus() {
    return {
      initialized: this.isInitialized,
      userContext: this.userContext ? {
        userId: this.userContext.userId,
        userType: this.userContext.userProfile?.userType
      } : null,
      services: this.serviceStatus,
      config: this.config,
      eventQueue: {
        size: this.eventQueue.length,
        batchSize: this.config.batchSize
      },
      lastUpdated: new Date()
    };
  }
}; 