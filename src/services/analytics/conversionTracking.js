/**
 * Conversion Tracking Service
 * Funnel analytics and conversion optimization for PropAgentic
 */

import { 
  collection, 
  addDoc, 
  updateDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { firebaseAnalytics } from './firebaseAnalytics';
import { auditLogger } from '../security/auditLogger';

export const conversionTracking = {
  isInitialized: false,

  // Funnel stages
  funnelStages: {
    WEBSITE_VISIT: 'website_visit',
    SIGNUP_START: 'signup_start',
    SIGNUP_COMPLETED: 'signup_completed',
    ONBOARDING_START: 'onboarding_start',
    ONBOARDING_COMPLETED: 'onboarding_completed',
    FIRST_LOGIN: 'first_login',
    FIRST_PROPERTY_ADDED: 'first_property_added',
    SUBSCRIPTION_SUCCESSFUL: 'subscription_successful'
  },

  // Conversion goals with values
  conversionGoals: {
    SIGNUP: { value: 10, stage: 'signup_completed' },
    ONBOARDING: { value: 25, stage: 'onboarding_completed' },
    ACTIVATION: { value: 50, stage: 'first_property_added' },
    SUBSCRIPTION: { value: 100, stage: 'subscription_successful' },
    RETENTION_7D: { value: 75, stage: 'day_7_return' },
    RETENTION_30D: { value: 150, stage: 'day_30_return' }
  },

  async initialize() {
    try {
      this.isInitialized = true;

      await auditLogger.logEvent('CONVERSION_TRACKING_INITIALIZED', {
        service: 'conversion_tracking',
        funnel_stages: Object.keys(this.funnelStages).length,
        conversion_goals: Object.keys(this.conversionGoals).length
      });

      return { success: true };
    } catch (error) {
      console.error('Conversion tracking initialization failed:', error);
      throw error;
    }
  },

  async trackFunnelStep(userId, stage, metadata = {}) {
    if (!this.isInitialized) return;

    try {
      const funnelData = {
        userId,
        stage,
        timestamp: serverTimestamp(),
        metadata: {
          ...metadata,
          sessionId: firebaseAnalytics.sessionId,
          userAgent: navigator.userAgent,
          pageUrl: window.location.href
        }
      };

      await addDoc(collection(db, 'funnel_events'), funnelData);

      // Track conversion value
      const stageValue = this.getStageValue(stage);
      await firebaseAnalytics.trackConversion(`funnel_${stage}`, stageValue, 'USD', {
        funnel_stage: stage,
        funnel_position: this.getStagePosition(stage),
        ...metadata
      });

      // Check for conversion goals
      await this.checkConversionGoals(userId, stage, metadata);

    } catch (error) {
      console.error('Failed to track funnel step:', error);
    }
  },

  async trackConversionGoal(userId, goalType, value, metadata = {}) {
    if (!this.isInitialized) return;

    try {
      const conversionData = {
        userId,
        goalType,
        value,
        timestamp: serverTimestamp(),
        metadata: {
          ...metadata,
          sessionId: firebaseAnalytics.sessionId
        }
      };

      await addDoc(collection(db, 'conversions'), conversionData);

      await firebaseAnalytics.trackConversion(goalType, value, 'USD', {
        conversion_goal: goalType,
        ...metadata
      });

      // Log high-value conversions
      if (value >= 50) {
        await auditLogger.logEvent('HIGH_VALUE_CONVERSION', {
          userId,
          goalType,
          value
        });
      }

    } catch (error) {
      console.error('Failed to track conversion goal:', error);
    }
  },

  async getFunnelAnalytics(options = {}) {
    const { userType, dateRange = 30, cohortAnalysis = false } = options;

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - dateRange);

      let q = query(
        collection(db, 'funnel_events'),
        where('timestamp', '>=', startDate),
        orderBy('timestamp', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const funnelData = querySnapshot.docs.map(doc => doc.data());

      const analytics = this.calculateFunnelMetrics(funnelData);

      if (cohortAnalysis) {
        analytics.cohortAnalysis = this.calculateCohortAnalysis(funnelData);
      }

      return analytics;
    } catch (error) {
      console.error('Failed to get funnel analytics:', error);
      throw error;
    }
  },

  getStageValue(stage) {
    const stageValues = {
      [this.funnelStages.SIGNUP_COMPLETED]: 10,
      [this.funnelStages.ONBOARDING_COMPLETED]: 25,
      [this.funnelStages.FIRST_PROPERTY_ADDED]: 50,
      [this.funnelStages.SUBSCRIPTION_SUCCESSFUL]: 100
    };
    return stageValues[stage] || 0;
  },

  getStagePosition(stage) {
    const stages = Object.values(this.funnelStages);
    return stages.indexOf(stage) + 1;
  },

  calculateFunnelMetrics(funnelData) {
    const stageCounts = {};
    const users = new Set();

    funnelData.forEach(event => {
      stageCounts[event.stage] = (stageCounts[event.stage] || 0) + 1;
      users.add(event.userId);
    });

    const stages = Object.values(this.funnelStages);
    const dropOffRates = {};

    for (let i = 0; i < stages.length - 1; i++) {
      const currentStage = stages[i];
      const nextStage = stages[i + 1];
      const currentCount = stageCounts[currentStage] || 0;
      const nextCount = stageCounts[nextStage] || 0;
      
      if (currentCount > 0) {
        dropOffRates[`${currentStage}_to_${nextStage}`] = 1 - (nextCount / currentCount);
      }
    }

    return {
      stageCounts,
      dropOffRates,
      totalUsers: users.size,
      averageStepsPerUser: users.size > 0 ? funnelData.length / users.size : 0
    };
  },

  async checkConversionGoals(userId, stage, metadata) {
    // Check if this stage triggers any conversion goals
    const goalEntries = Object.entries(this.conversionGoals);
    
    for (const [goalType, goalData] of goalEntries) {
      if (goalData.stage === stage) {
        await this.trackConversionGoal(userId, goalType, goalData.value, metadata);
      }
    }
  },

  calculateCohortAnalysis(funnelData) {
    // Simple cohort analysis implementation
    // In a real implementation, this would be more sophisticated
    return {
      message: 'Cohort analysis would be implemented here',
      dataPoints: funnelData ? funnelData.length : 0
    };
  },

  getStatus() {
    return {
      initialized: this.isInitialized,
      funnelStages: Object.keys(this.funnelStages).length,
      conversionGoals: Object.keys(this.conversionGoals).length,
      userTypeFunnels: ['landlord', 'tenant', 'contractor']
    };
  }
}; 