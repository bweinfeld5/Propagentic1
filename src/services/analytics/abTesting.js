/**
 * A/B Testing Service
 * Experiment management and statistical analysis for PropAgentic
 */

import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc, 
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

export const abTesting = {
  isInitialized: false,
  activeExperiments: new Map(),
  userExperiments: new Map(),

  // Experiment types
  experimentTypes: {
    PRICING: 'pricing',
    ONBOARDING: 'onboarding',
    UI_COMPONENT: 'ui_component',
    FEATURE_FLAG: 'feature_flag',
    MESSAGING: 'messaging',
    CTA_BUTTON: 'cta_button',
    LANDING_PAGE: 'landing_page',
    EMAIL_CAMPAIGN: 'email_campaign'
  },

  // Experiment status
  experimentStatus: {
    DRAFT: 'draft',
    ACTIVE: 'active',
    PAUSED: 'paused',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  },

  async initialize() {
    try {
      this.isInitialized = true;

      // Load active experiments
      const activeExperimentsSnapshot = await getDocs(
        query(
          collection(db, 'experiments'),
          where('status', '==', this.experimentStatus.ACTIVE)
        )
      );

      activeExperimentsSnapshot.docs.forEach(doc => {
        this.activeExperiments.set(doc.id, { id: doc.id, ...doc.data() });
      });

      await auditLogger.logEvent('AB_TESTING_INITIALIZED', {
        service: 'ab_testing',
        active_experiments: this.activeExperiments.size,
        experiment_types: Object.keys(this.experimentTypes).length
      });

      return { success: true };
    } catch (error) {
      console.error('A/B testing initialization failed:', error);
      throw error;
    }
  },

  async createExperiment(config) {
    if (!config.name || !config.variants || config.variants.length < 2) {
      throw new Error('Missing required experiment configuration');
    }

    if (config.variants.length < 2) {
      throw new Error('Experiment must have at least 2 variants');
    }

    if (!Object.values(this.experimentTypes).includes(config.type)) {
      throw new Error(`Invalid experiment type: ${config.type}`);
    }

    try {
      const experiment = {
        name: config.name,
        description: config.description || '',
        type: config.type,
        status: this.experimentStatus.DRAFT,
        variants: config.variants.map((variant, index) => ({
          id: `variant_${index}`,
          name: variant.name,
          description: variant.description || '',
          allocation: 100 / config.variants.length, // Equal allocation by default
          configuration: variant.configuration || {}
        })),
        targetAudience: config.targetAudience || {},
        trafficAllocation: config.trafficAllocation || 100,
        metrics: config.metrics || [],
        duration: config.duration || 14,
        hypothesis: config.hypothesis || '',
        owner: config.owner || '',
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'experiments'), experiment);

      await firebaseAnalytics.trackEvent('experiment_created', {
        experiment_id: docRef.id,
        experiment_type: config.type,
        variant_count: config.variants.length,
        owner: config.owner
      });

      return { id: docRef.id, ...experiment };
    } catch (error) {
      console.error('Failed to create experiment:', error);
      throw error;
    }
  },

  async startExperiment(experimentId) {
    try {
      const experimentDoc = await getDoc(doc(db, 'experiments', experimentId));
      
      if (!experimentDoc.exists()) {
        throw new Error(`Experiment ${experimentId} not found`);
      }

      const experiment = experimentDoc.data();
      
      if (experiment.status !== this.experimentStatus.DRAFT) {
        throw new Error(`Cannot start experiment in ${experiment.status} status`);
      }

      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + (experiment.duration * 24 * 60 * 60 * 1000));

      await updateDoc(doc(db, 'experiments', experimentId), {
        status: this.experimentStatus.ACTIVE,
        startDate: serverTimestamp(),
        endDate
      });

      // Add to active experiments cache
      this.activeExperiments.set(experimentId, { 
        id: experimentId, 
        ...experiment, 
        status: this.experimentStatus.ACTIVE 
      });

      await firebaseAnalytics.trackEvent('experiment_started', {
        experiment_id: experimentId,
        experiment_name: experiment.name,
        duration_days: experiment.duration
      });

      return { 
        success: true, 
        experimentId, 
        startDate, 
        endDate 
      };
    } catch (error) {
      console.error('Failed to start experiment:', error);
      throw error;
    }
  },

  async assignUserToExperiment(userId, experimentId, userProfile = {}) {
    const experiment = this.activeExperiments.get(experimentId);
    if (!experiment) {
      return null; // Experiment not active
    }

    // Check if user already assigned (cache first, then database)
    const cacheKey = `${userId}_${experimentId}`;
    if (this.userExperiments.has(cacheKey)) {
      return this.userExperiments.get(cacheKey);
    }

    // Check target audience
    if (!this.matchesTargetAudience(userProfile, experiment.targetAudience)) {
      return null;
    }

    // Check traffic allocation
    if (this.hashUserId(userId) % 100 >= experiment.trafficAllocation) {
      return null;
    }

    try {
      const selectedVariant = this.selectVariant(userId, experiment.variants);
      
      const assignment = {
        userId,
        experimentId,
        variantId: selectedVariant.id,
        variantName: selectedVariant.name,
        assignedAt: serverTimestamp(),
        experimentName: experiment.name,
        experimentType: experiment.type
      };

      await addDoc(collection(db, 'experiment_assignments'), assignment);

      // Cache the assignment
      this.userExperiments.set(cacheKey, assignment);

      await firebaseAnalytics.trackEvent('experiment_assigned', {
        experiment_id: experimentId,
        variant_id: selectedVariant.id,
        user_type: userProfile.userType
      });

      return assignment;
    } catch (error) {
      console.error('Failed to assign user to experiment:', error);
      return null;
    }
  },

  async getUserVariant(userId, experimentId) {
    const cacheKey = `${userId}_${experimentId}`;
    
    // Check cache first
    if (this.userExperiments.has(cacheKey)) {
      return this.userExperiments.get(cacheKey).variantId;
    }

    try {
      // Check database
      const q = query(
        collection(db, 'experiment_assignments'),
        where('userId', '==', userId),
        where('experimentId', '==', experimentId),
        limit(1)
      );

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return null;
      }

      const assignment = snapshot.docs[0].data();
      this.userExperiments.set(cacheKey, assignment);
      
      return assignment.variantId;
    } catch (error) {
      console.error('Failed to get user variant:', error);
      return null;
    }
  },

  async isFeatureEnabled(userId, featureName, userProfile = {}) {
    const featureExperimentId = `${featureName}_feature`;
    const experiment = this.activeExperiments.get(featureExperimentId);
    
    if (!experiment || experiment.type !== this.experimentTypes.FEATURE_FLAG) {
      return false;
    }

    const variant = await this.getUserVariant(userId, featureExperimentId);
    return variant === 'variant_1'; // Assuming variant_1 is "enabled"
  },

  selectVariant(userId, variants) {
    const hash = this.hashUserId(userId);
    let cumulativeAllocation = 0;
    
    for (const variant of variants) {
      cumulativeAllocation += variant.allocation;
      if (hash % 100 < cumulativeAllocation) {
        return variant;
      }
    }
    
    return variants[0]; // Fallback
  },

  hashUserId(userId) {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  },

  matchesTargetAudience(userProfile, targetAudience) {
    if (!targetAudience || Object.keys(targetAudience).length === 0) {
      return true; // No targeting rules = all users
    }

    if (targetAudience.userTypes && !targetAudience.userTypes.includes(userProfile.userType)) {
      return false;
    }

    if (targetAudience.countries && !targetAudience.countries.includes(userProfile.country)) {
      return false;
    }

    return true;
  },

  getStatus() {
    return {
      initialized: this.isInitialized,
      activeExperiments: this.activeExperiments.size,
      userExperiments: this.userExperiments.size,
      experimentTypes: Object.values(this.experimentTypes),
      templates: ['pricing_test', 'onboarding_flow', 'cta_optimization']
    };
  }
}; 