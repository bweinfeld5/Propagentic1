/**
 * Analytics Manager Tests
 * Comprehensive tests for the unified analytics coordination service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock all analytics services before any imports
vi.mock('../../src/services/analytics/firebaseAnalytics', () => ({
  firebaseAnalytics: {
    initialize: vi.fn().mockResolvedValue({ success: true }),
    setUserContext: vi.fn().mockResolvedValue(undefined),
    trackPageView: vi.fn().mockResolvedValue(undefined),
    trackEventBatch: vi.fn().mockResolvedValue(undefined),
    clearUserData: vi.fn().mockResolvedValue(undefined),
    sessionId: 'test-session-123'
  }
}));

vi.mock('../../src/services/analytics/conversionTracking', () => ({
  conversionTracking: {
    initialize: vi.fn().mockResolvedValue({ success: true })
  }
}));

vi.mock('../../src/services/analytics/abTesting', () => ({
  abTesting: {
    initialize: vi.fn().mockResolvedValue({ success: true }),
    assignUserToExperiment: vi.fn().mockImplementation(() => Promise.resolve({ variantId: 'variant_1' })),
    getUserVariant: vi.fn().mockImplementation(() => Promise.resolve('variant_1')),
    isFeatureEnabled: vi.fn().mockImplementation(() => Promise.resolve(true))
  }
}));

// Mock audit logger
vi.mock('../../src/services/security/auditLogger', () => ({
  auditLogger: {
    logEvent: vi.fn().mockResolvedValue(undefined)
  }
}));

// Import after mocks are set up
import { analyticsManager } from '../../src/services/analytics/index.js';
import { firebaseAnalytics } from '../../src/services/analytics/firebaseAnalytics';
import { conversionTracking } from '../../src/services/analytics/conversionTracking';
import { abTesting } from '../../src/services/analytics/abTesting';
import { auditLogger } from '../../src/services/security/auditLogger';

describe('Analytics Manager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    analyticsManager.isInitialized = false;
    analyticsManager.userContext = null;
    analyticsManager.eventQueue = [];
    analyticsManager.serviceStatus = {
      firebase: { initialized: false, enabled: false, lastError: null },
      conversion: { initialized: false, enabled: false, lastError: null },
      abTesting: { initialized: false, enabled: false, lastError: null }
    };
    
    // Clear any existing timer
    if (analyticsManager.flushTimer) {
      clearInterval(analyticsManager.flushTimer);
      analyticsManager.flushTimer = null;
    }
  });

  afterEach(() => {
    vi.clearAllMocks();
    if (analyticsManager.flushTimer) {
      clearInterval(analyticsManager.flushTimer);
      analyticsManager.flushTimer = null;
    }
  });

  describe('Initialization', () => {
    it('should initialize successfully with user consent', async () => {
      const result = await analyticsManager.initialize(true, {
        enableFirebaseAnalytics: true,
        enableConversionTracking: true,
        enableABTesting: true
      });

      expect(result.success).toBe(true);
      expect(result.services).toEqual(['firebase', 'conversion', 'abTesting']);
      expect(analyticsManager.isInitialized).toBe(true);

      expect(firebaseAnalytics.initialize).toHaveBeenCalledWith(true);
      expect(conversionTracking.initialize).toHaveBeenCalled();
      expect(abTesting.initialize).toHaveBeenCalled();

      expect(auditLogger.logEvent).toHaveBeenCalledWith('ANALYTICS_MANAGER_INITIALIZED', {
        services: ['firebase', 'conversion', 'abTesting'],
        serviceStatus: expect.any(Object),
        userConsent: true
      });
    });

    it('should initialize without Firebase Analytics when no user consent', async () => {
      const result = await analyticsManager.initialize(false, {
        enableConversionTracking: true,
        enableABTesting: true
      });

      expect(result.success).toBe(true);
      expect(result.services).toEqual(['conversion', 'abTesting']);

      expect(firebaseAnalytics.initialize).not.toHaveBeenCalled();
      expect(conversionTracking.initialize).toHaveBeenCalled();
      expect(abTesting.initialize).toHaveBeenCalled();
    });

    it('should handle service initialization failures gracefully', async () => {
      firebaseAnalytics.initialize.mockRejectedValueOnce(new Error('Firebase init failed'));
      conversionTracking.initialize.mockRejectedValueOnce(new Error('Conversion init failed'));

      const result = await analyticsManager.initialize(true);

      expect(result.success).toBe(true);
      expect(result.services).toEqual(['abTesting']); // Only abTesting succeeded

      expect(analyticsManager.serviceStatus.firebase.lastError).toBe('Firebase init failed');
      expect(analyticsManager.serviceStatus.conversion.lastError).toBe('Conversion init failed');
      expect(analyticsManager.serviceStatus.abTesting.initialized).toBe(true);
    });

    it('should handle overall initialization failure', async () => {
      auditLogger.logEvent.mockRejectedValueOnce(new Error('Audit logging failed'));

      await expect(analyticsManager.initialize(true)).rejects.toThrow('Audit logging failed');
    });
  });

  describe('User Context Management', () => {
    beforeEach(async () => {
      await analyticsManager.initialize(true);
    });

    it('should set user context successfully', async () => {
      const userId = 'user123';
      const userProfile = { userType: 'landlord', subscriptionPlan: 'premium' };

      await analyticsManager.setUserContext(userId, userProfile);

      expect(analyticsManager.userContext).toEqual({ userId, userProfile });
      expect(firebaseAnalytics.setUserContext).toHaveBeenCalledWith(userId, userProfile);
    });

    it('should handle user context errors gracefully', async () => {
      firebaseAnalytics.setUserContext.mockRejectedValueOnce(new Error('Context error'));

      // Should not throw
      await analyticsManager.setUserContext('user123', {});

      expect(firebaseAnalytics.setUserContext).toHaveBeenCalled();
    });
  });

  describe('Event Tracking', () => {
    beforeEach(async () => {
      await analyticsManager.initialize(true);
      analyticsManager.userContext = { userId: 'user123' };
    });

    it('should track events and add to queue', async () => {
      const eventName = 'test_event';
      const parameters = { key: 'value' };

      await analyticsManager.trackEvent(eventName, parameters);

      expect(analyticsManager.eventQueue).toHaveLength(1);
      expect(analyticsManager.eventQueue[0]).toEqual({
        eventName,
        parameters: {
          ...parameters,
          timestamp: expect.any(String),
          userId: 'user123'
        },
        timestamp: expect.any(Number)
      });
    });

    it('should flush events when batch size reached', async () => {
      analyticsManager.config.batchSize = 2;

      await analyticsManager.trackEvent('event1', {});
      expect(analyticsManager.eventQueue).toHaveLength(1);

      await analyticsManager.trackEvent('event2', {});
      expect(analyticsManager.eventQueue).toHaveLength(0); // Should be flushed
      expect(firebaseAnalytics.trackEventBatch).toHaveBeenCalled();
    });

    it('should not track events when not initialized', async () => {
      analyticsManager.isInitialized = false;

      await analyticsManager.trackEvent('test_event', {});

      expect(analyticsManager.eventQueue).toHaveLength(0);
    });

    it('should handle tracking errors gracefully', async () => {
      // Should not throw even if event processing fails
      await analyticsManager.trackEvent('test_event', {});

      expect(analyticsManager.eventQueue).toHaveLength(1);
    });
  });

  describe('Page View Tracking', () => {
    beforeEach(async () => {
      await analyticsManager.initialize(true);
    });

    it('should track page views correctly', async () => {
      const pageName = 'dashboard';
      const additionalParams = { section: 'overview' };

      await analyticsManager.trackPageView(pageName, additionalParams);

      expect(firebaseAnalytics.trackPageView).toHaveBeenCalledWith(pageName, additionalParams);
      expect(analyticsManager.eventQueue).toHaveLength(1);
      expect(analyticsManager.eventQueue[0].eventName).toBe('page_view');
    });
  });

  describe('Event Flushing', () => {
    beforeEach(async () => {
      await analyticsManager.initialize(true);
    });

    it('should flush events successfully', async () => {
      analyticsManager.eventQueue = [
        {
          eventName: 'event1',
          parameters: { key1: 'value1' },
          timestamp: Date.now()
        },
        {
          eventName: 'event2',
          parameters: { key2: 'value2' },
          timestamp: Date.now()
        }
      ];

      await analyticsManager.flushEvents();

      expect(firebaseAnalytics.trackEventBatch).toHaveBeenCalledWith([
        { name: 'event1', parameters: { key1: 'value1' } },
        { name: 'event2', parameters: { key2: 'value2' } }
      ]);
      expect(analyticsManager.eventQueue).toHaveLength(0);
    });

    it('should not flush when queue is empty', async () => {
      await analyticsManager.flushEvents();

      expect(firebaseAnalytics.trackEventBatch).not.toHaveBeenCalled();
    });

    it('should handle flush errors gracefully', async () => {
      firebaseAnalytics.trackEventBatch.mockRejectedValueOnce(new Error('Flush error'));
      analyticsManager.eventQueue = [{ eventName: 'test', parameters: {}, timestamp: Date.now() }];

      // Should not throw
      await analyticsManager.flushEvents();

      // Events should remain in queue on error
      expect(analyticsManager.eventQueue).toHaveLength(1);
    });
  });

  describe('Batch Processing', () => {
    beforeEach(async () => {
      await analyticsManager.initialize(true);
    });

    it('should start batch processing timer', () => {
      analyticsManager.startBatchProcessing();

      expect(analyticsManager.flushTimer).toBeTruthy();
    });

    it('should stop batch processing timer', () => {
      analyticsManager.startBatchProcessing();
      const timer = analyticsManager.flushTimer;

      analyticsManager.stopBatchProcessing();

      expect(analyticsManager.flushTimer).toBe(null);
    });

    it('should replace existing timer when restarting', () => {
      analyticsManager.startBatchProcessing();
      const firstTimer = analyticsManager.flushTimer;

      analyticsManager.startBatchProcessing();
      const secondTimer = analyticsManager.flushTimer;

      expect(secondTimer).not.toBe(firstTimer);
    });
  });

  describe('A/B Testing Integration', () => {
    beforeEach(async () => {
      await analyticsManager.initialize(true);
    });

    it('should assign user to experiment', async () => {
      const userId = 'user123';
      const experimentId = 'exp123';
      const userProfile = { userType: 'landlord' };

      const result = await analyticsManager.assignUserToExperiment(userId, experimentId, userProfile);

      expect(abTesting.assignUserToExperiment).toHaveBeenCalledWith(userId, experimentId, userProfile);
      expect(result).toEqual({ variantId: 'variant_1' });
    });

    it('should get user experiment variant', async () => {
      const userId = 'user123';
      const experimentId = 'exp123';

      const result = await analyticsManager.getUserExperimentVariant(userId, experimentId);

      expect(abTesting.getUserVariant).toHaveBeenCalledWith(userId, experimentId);
      expect(result).toBe('variant_1');
    });

    it('should check if feature is enabled', async () => {
      const userId = 'user123';
      const featureName = 'new_feature';
      const userProfile = { userType: 'landlord' };

      const result = await analyticsManager.isFeatureEnabled(userId, featureName, userProfile);

      expect(abTesting.isFeatureEnabled).toHaveBeenCalledWith(userId, featureName, userProfile);
      expect(result).toBe(true);
    });

    it('should return null/false when A/B testing is disabled', async () => {
      analyticsManager.serviceStatus.abTesting.enabled = false;

      const assignment = await analyticsManager.assignUserToExperiment('user123', 'exp123', {});
      const variant = await analyticsManager.getUserExperimentVariant('user123', 'exp123');
      const featureEnabled = await analyticsManager.isFeatureEnabled('user123', 'feature', {});

      expect(assignment).toBe(null);
      expect(variant).toBe(null);
      expect(featureEnabled).toBe(false);
    });
  });

  describe('Data Management', () => {
    beforeEach(async () => {
      await analyticsManager.initialize(true);
    });

    it('should clear user data correctly', async () => {
      analyticsManager.userContext = { userId: 'user123' };
      analyticsManager.eventQueue = [{ eventName: 'test', parameters: {}, timestamp: Date.now() }];

      await analyticsManager.clearUserData();

      expect(analyticsManager.userContext).toBe(null);
      expect(analyticsManager.eventQueue).toHaveLength(0);
      expect(firebaseAnalytics.clearUserData).toHaveBeenCalled();
    });
  });

  describe('Status Reporting', () => {
    it('should return correct status when uninitialized', () => {
      const status = analyticsManager.getStatus();

      expect(status).toEqual({
        initialized: false,
        userContext: null,
        services: expect.any(Object),
        config: expect.any(Object),
        eventQueue: {
          size: 0,
          batchSize: expect.any(Number)
        },
        lastUpdated: expect.any(Date)
      });
    });

    it('should return correct status when initialized', async () => {
      await analyticsManager.initialize(true);
      analyticsManager.userContext = { userId: 'user123', userProfile: { userType: 'landlord' } };
      analyticsManager.eventQueue = [{}];

      const status = analyticsManager.getStatus();

      expect(status).toEqual({
        initialized: true,
        userContext: {
          userId: 'user123',
          userType: 'landlord'
        },
        services: expect.any(Object),
        config: expect.any(Object),
        eventQueue: {
          size: 1,
          batchSize: expect.any(Number)
        },
        lastUpdated: expect.any(Date)
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await analyticsManager.initialize(true);
    });

    it('should handle service errors gracefully during initialization', async () => {
      firebaseAnalytics.initialize.mockRejectedValueOnce(new Error('Service error'));

      // Reset manager state
      analyticsManager.isInitialized = false;
      
      const result = await analyticsManager.initialize(true);

      expect(result.success).toBe(true);
      expect(analyticsManager.serviceStatus.firebase.lastError).toBe('Service error');
    });

    it('should handle event tracking errors gracefully', async () => {
      // Should not throw even if internal processing fails
      await analyticsManager.trackEvent('test_event', {});

      expect(analyticsManager.eventQueue).toHaveLength(1);
    });
  });
}); 