/**
 * Firebase Analytics Service
 * Custom analytics implementation for PropAgentic
 */

import { getAnalytics, logEvent, setUserProperties, setUserId, setCurrentScreen } from 'firebase/analytics';
import { app } from '../../firebase/config';
import { auditLogger } from '../security/auditLogger';

export const firebaseAnalytics = {
  analytics: null,
  isInitialized: false,
  isEnabled: false,
  userContext: null,
  sessionId: null,
  debugMode: false,

  async initialize(userConsent = false) {
    try {
      if (!userConsent) {
        return { success: false, reason: 'user_consent_required' };
      }

      this.analytics = getAnalytics(app);
      this.isInitialized = true;
      this.isEnabled = true;
      this.sessionId = this.generateSessionId();

      await auditLogger.logEvent('ANALYTICS_INITIALIZED', {
        service: 'firebase_analytics',
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      });

      return { success: true, sessionId: this.sessionId };
    } catch (error) {
      console.error('Firebase Analytics initialization failed:', error);
      throw error;
    }
  },

  async setUserContext(userId, userProfile) {
    if (!this.isEnabled) return;

    try {
      setUserId(this.analytics, userId);
      
      const userProps = {
        user_type: userProfile.userType,
        subscription_plan: userProfile.subscriptionPlan,
        onboarding_completed: userProfile.onboardingComplete ? 'true' : 'false'
      };

      setUserProperties(this.analytics, userProps);
      
      this.userContext = { userId, ...userProfile };
    } catch (error) {
      console.error('Failed to set user context:', error);
    }
  },

  async trackEvent(eventName, parameters = {}) {
    if (!this.isEnabled) return;

    try {
      const enhancedParams = {
        ...parameters,
        timestamp: new Date().toISOString(),
        session_id: this.sessionId,
        user_type: this.userContext?.userType,
        page_url: window.location.href,
        page_title: document.title
      };

      logEvent(this.analytics, eventName, enhancedParams);

      if (this.debugMode) {
        console.log('Event tracked:', eventName, enhancedParams);
      }
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  },

  async trackPageView(pageName, additionalParams = {}) {
    if (!this.isEnabled) return;

    try {
      setCurrentScreen(this.analytics, pageName);
      
      await this.trackEvent('page_view', {
        page_name: pageName,
        page_location: window.location.href,
        page_title: document.title,
        ...additionalParams
      });
    } catch (error) {
      console.error('Failed to track page view:', error);
    }
  },

  async trackEventBatch(events) {
    if (!this.isEnabled) return;

    try {
      for (const event of events) {
        logEvent(this.analytics, event.name, event.parameters);
      }
    } catch (error) {
      console.error('Failed to track event batch:', error);
    }
  },

  setEnabled(enabled) {
    this.isEnabled = enabled;
  },

  clearUserData() {
    this.userContext = null;
    if (this.analytics) {
      setUserId(this.analytics, null);
    }
  },

  getStatus() {
    return {
      initialized: this.isInitialized,
      enabled: this.isEnabled,
      sessionId: this.sessionId,
      userContext: this.userContext,
      debugMode: this.debugMode
    };
  },

  generateSessionId() {
    return 'session_' + Math.random().toString(36).substr(2, 9);
  }
}; 