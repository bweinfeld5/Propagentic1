/**
 * Conversion Tracking Service Tests
 * Comprehensive tests for funnel analytics and conversion optimization
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Firestore before any imports
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  serverTimestamp: vi.fn()
}));

// Mock Firebase config
vi.mock('../../src/firebase/config', () => ({
  db: { type: 'firestore' }
}));

// Mock Firebase Analytics
vi.mock('../../src/services/analytics/firebaseAnalytics', () => ({
  firebaseAnalytics: {
    sessionId: 'test-session-123',
    trackConversion: vi.fn().mockResolvedValue(undefined)
  }
}));

// Mock audit logger
vi.mock('../../src/services/security/auditLogger', () => ({
  auditLogger: {
    logEvent: vi.fn().mockResolvedValue(undefined)
  }
}));

// Import after mocks are set up
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
import { conversionTracking } from '../../src/services/analytics/conversionTracking.js';
import { firebaseAnalytics } from '../../src/services/analytics/firebaseAnalytics';
import { auditLogger } from '../../src/services/security/auditLogger';

describe('Conversion Tracking Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    conversionTracking.isInitialized = false;
    
    // Set up default mocks for Firestore
    collection.mockReturnValue('mock-collection');
    query.mockReturnValue('mock-query');
    getDocs.mockResolvedValue({ docs: [] });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      const result = await conversionTracking.initialize();
      
      expect(result.success).toBe(true);
      expect(conversionTracking.isInitialized).toBe(true);
      expect(auditLogger.logEvent).toHaveBeenCalledWith('CONVERSION_TRACKING_INITIALIZED', {
        service: 'conversion_tracking',
        funnel_stages: expect.any(Number),
        conversion_goals: expect.any(Number)
      });
    });

    it('should handle initialization errors gracefully', async () => {
      auditLogger.logEvent.mockRejectedValueOnce(new Error('Audit logging failed'));
      
      await expect(conversionTracking.initialize()).rejects.toThrow('Audit logging failed');
    });
  });

  describe('Funnel Step Tracking', () => {
    beforeEach(async () => {
      await conversionTracking.initialize();
      serverTimestamp.mockReturnValue({ seconds: 1640995200 });
      addDoc.mockResolvedValue({ id: 'doc123' });
    });

    it('should track funnel step successfully', async () => {
      const userId = 'user123';
      const stage = conversionTracking.funnelStages.SIGNUP_COMPLETED;
      const metadata = { source: 'landing_page' };

      await conversionTracking.trackFunnelStep(userId, stage, metadata);

      expect(addDoc).toHaveBeenCalledWith(
        'mock-collection',
        {
          userId,
          stage,
          timestamp: { seconds: 1640995200 },
          metadata: {
            ...metadata,
            sessionId: 'test-session-123',
            userAgent: expect.any(String),
            pageUrl: expect.any(String)
          }
        }
      );

      expect(firebaseAnalytics.trackConversion).toHaveBeenCalledWith(
        `funnel_${stage}`,
        10,
        'USD',
        {
          funnel_stage: stage,
          funnel_position: expect.any(Number),
          ...metadata
        }
      );
    });

    it('should not track when service is not initialized', async () => {
      conversionTracking.isInitialized = false;
      
      await conversionTracking.trackFunnelStep('user123', 'test_stage', {});
      
      expect(addDoc).not.toHaveBeenCalled();
    });

    it('should handle tracking errors gracefully', async () => {
      addDoc.mockRejectedValueOnce(new Error('Database error'));
      
      // Should not throw
      await conversionTracking.trackFunnelStep('user123', 'test_stage', {});
      
      expect(addDoc).toHaveBeenCalled();
    });
  });

  describe('Conversion Goal Tracking', () => {
    beforeEach(async () => {
      await conversionTracking.initialize();
      serverTimestamp.mockReturnValue({ seconds: 1640995200 });
      addDoc.mockResolvedValue({ id: 'doc123' });
    });

    it('should track conversion goal successfully', async () => {
      const userId = 'user123';
      const goalType = 'SIGNUP';
      const value = 10;
      const metadata = { campaign: 'summer_2024' };

      await conversionTracking.trackConversionGoal(userId, goalType, value, metadata);

      expect(addDoc).toHaveBeenCalledWith(
        'mock-collection',
        {
          userId,
          goalType,
          value,
          timestamp: { seconds: 1640995200 },
          metadata: {
            ...metadata,
            sessionId: 'test-session-123'
          }
        }
      );

      expect(firebaseAnalytics.trackConversion).toHaveBeenCalledWith(
        goalType,
        value,
        'USD',
        {
          conversion_goal: goalType,
          ...metadata
        }
      );
    });

    it('should log high-value conversions to audit trail', async () => {
      const userId = 'user123';
      const goalType = 'SUBSCRIPTION';
      const value = 100;

      await conversionTracking.trackConversionGoal(userId, goalType, value, {});

      expect(auditLogger.logEvent).toHaveBeenCalledWith('HIGH_VALUE_CONVERSION', {
        userId,
        goalType,
        value
      });
    });

    it('should not log low-value conversions to audit trail', async () => {
      const userId = 'user123';
      const goalType = 'SIGNUP';
      const value = 10;

      await conversionTracking.trackConversionGoal(userId, goalType, value, {});

      expect(auditLogger.logEvent).not.toHaveBeenCalledWith('HIGH_VALUE_CONVERSION', expect.anything());
    });

    it('should not track when service is not initialized', async () => {
      conversionTracking.isInitialized = false;
      
      await conversionTracking.trackConversionGoal('user123', 'SIGNUP', 10, {});
      
      expect(addDoc).not.toHaveBeenCalled();
    });
  });

  describe('Funnel Analytics', () => {
    beforeEach(async () => {
      await conversionTracking.initialize();
    });

    it('should get funnel analytics successfully', async () => {
      const mockData = [
        { userId: 'user1', stage: 'signup_completed' },
        { userId: 'user2', stage: 'signup_completed' },
        { userId: 'user1', stage: 'onboarding_completed' }
      ];

      query.mockReturnValue('mock-query');
      getDocs.mockResolvedValue({
        docs: mockData.map(data => ({ data: () => data }))
      });

      const analytics = await conversionTracking.getFunnelAnalytics({ dateRange: 30 });

      expect(query).toHaveBeenCalled();
      expect(where).toHaveBeenCalled();
      expect(orderBy).toHaveBeenCalledWith('timestamp', 'desc');
      expect(getDocs).toHaveBeenCalledWith('mock-query');

      expect(analytics).toEqual({
        stageCounts: {
          signup_completed: 2,
          onboarding_completed: 1
        },
        dropOffRates: expect.any(Object),
        totalUsers: 2,
        averageStepsPerUser: 1.5
      });
    });

    it('should include cohort analysis when requested', async () => {
      getDocs.mockResolvedValue({ docs: [] });
      query.mockReturnValue('mock-query');

      const analytics = await conversionTracking.getFunnelAnalytics({ 
        dateRange: 30, 
        cohortAnalysis: true 
      });

      expect(analytics.cohortAnalysis).toBeDefined();
    });

    it('should handle analytics errors gracefully', async () => {
      getDocs.mockRejectedValueOnce(new Error('Database error'));
      query.mockReturnValue('mock-query');

      await expect(conversionTracking.getFunnelAnalytics({})).rejects.toThrow('Database error');
    });
  });

  describe('Helper Methods', () => {
    it('should return correct stage values', () => {
      expect(conversionTracking.getStageValue('signup_completed')).toBe(10);
      expect(conversionTracking.getStageValue('onboarding_completed')).toBe(25);
      expect(conversionTracking.getStageValue('first_property_added')).toBe(50);
      expect(conversionTracking.getStageValue('subscription_successful')).toBe(100);
      expect(conversionTracking.getStageValue('unknown_stage')).toBe(0);
    });

    it('should return correct stage positions', () => {
      const stages = Object.values(conversionTracking.funnelStages);
      stages.forEach((stage, index) => {
        expect(conversionTracking.getStagePosition(stage)).toBe(index + 1);
      });
    });

    it('should calculate funnel metrics correctly', () => {
      const funnelData = [
        { userId: 'user1', stage: 'signup_completed' },
        { userId: 'user2', stage: 'signup_completed' },
        { userId: 'user1', stage: 'onboarding_completed' },
        { userId: 'user3', stage: 'signup_completed' }
      ];

      const metrics = conversionTracking.calculateFunnelMetrics(funnelData);

      expect(metrics).toEqual({
        stageCounts: {
          signup_completed: 3,
          onboarding_completed: 1
        },
        dropOffRates: expect.any(Object),
        totalUsers: 3,
        averageStepsPerUser: expect.any(Number)
      });

      expect(metrics.totalUsers).toBe(3);
      expect(Math.abs(metrics.averageStepsPerUser - 1.33)).toBeLessThan(0.01);
    });

    it('should check conversion goals correctly', async () => {
      await conversionTracking.initialize();
      vi.spyOn(conversionTracking, 'trackConversionGoal').mockResolvedValue();

      await conversionTracking.checkConversionGoals('user123', 'signup_completed', {});

      expect(conversionTracking.trackConversionGoal).toHaveBeenCalledWith(
        'user123',
        'SIGNUP',
        10,
        {}
      );
    });
  });

  describe('Service Status', () => {
    it('should return correct status when uninitialized', () => {
      const status = conversionTracking.getStatus();

      expect(status).toEqual({
        initialized: false,
        funnelStages: expect.any(Number),
        conversionGoals: expect.any(Number),
        userTypeFunnels: ['landlord', 'tenant', 'contractor']
      });
    });

    it('should return correct status when initialized', async () => {
      await conversionTracking.initialize();
      
      const status = conversionTracking.getStatus();

      expect(status).toEqual({
        initialized: true,
        funnelStages: Object.keys(conversionTracking.funnelStages).length,
        conversionGoals: Object.keys(conversionTracking.conversionGoals).length,
        userTypeFunnels: ['landlord', 'tenant', 'contractor']
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await conversionTracking.initialize();
    });

    it('should handle Firestore errors gracefully in funnel tracking', async () => {
      addDoc.mockRejectedValueOnce(new Error('Firestore error'));
      
      // Should not throw
      await conversionTracking.trackFunnelStep('user123', 'test_stage', {});
      
      expect(addDoc).toHaveBeenCalled();
    });

    it('should handle analytics errors gracefully in conversion tracking', async () => {
      firebaseAnalytics.trackConversion.mockRejectedValueOnce(new Error('Analytics error'));
      
      // Should not throw
      await conversionTracking.trackConversionGoal('user123', 'SIGNUP', 10, {});
      
      expect(firebaseAnalytics.trackConversion).toHaveBeenCalled();
    });
  });
}); 