/**
 * A/B Testing Service Tests
 * Comprehensive tests for experiment management and statistical analysis
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Firestore before any imports
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
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
    trackEvent: vi.fn().mockResolvedValue(undefined)
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
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { abTesting } from '../../src/services/analytics/abTesting.js';
import { firebaseAnalytics } from '../../src/services/analytics/firebaseAnalytics';
import { auditLogger } from '../../src/services/security/auditLogger';

describe('A/B Testing Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    abTesting.isInitialized = false;
    abTesting.activeExperiments.clear();
    abTesting.userExperiments.clear();
    
    // Set up default mocks for Firestore
    query.mockReturnValue('mock-query');
    getDocs.mockResolvedValue({ docs: [] });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      query.mockReturnValue('mock-query');
      getDocs.mockResolvedValue({ docs: [] });

      const result = await abTesting.initialize();

      expect(result.success).toBe(true);
      expect(abTesting.isInitialized).toBe(true);
      expect(auditLogger.logEvent).toHaveBeenCalledWith('AB_TESTING_INITIALIZED', {
        service: 'ab_testing',
        active_experiments: 0,
        experiment_types: expect.any(Number)
      });
    });

    it('should load active experiments during initialization', async () => {
      const mockExperiment = {
        id: 'exp1',
        name: 'Test Experiment',
        status: 'active'
      };

      query.mockReturnValue('mock-query');
      getDocs.mockResolvedValue({
        docs: [{ id: 'exp1', data: () => mockExperiment }]
      });

      await abTesting.initialize();

      expect(abTesting.activeExperiments.has('exp1')).toBe(true);
      expect(abTesting.activeExperiments.get('exp1')).toEqual({
        id: 'exp1',
        ...mockExperiment
      });
    });

    it('should handle initialization errors gracefully', async () => {
      query.mockReturnValue('mock-query');
      getDocs.mockRejectedValueOnce(new Error('Database error'));

      await expect(abTesting.initialize()).rejects.toThrow('Database error');
    });
  });

  describe('Experiment Creation', () => {
    beforeEach(async () => {
      await abTesting.initialize();
      serverTimestamp.mockReturnValue({ seconds: 1640995200 });
      addDoc.mockResolvedValue({ id: 'exp123' });
    });

    it('should create experiment successfully', async () => {
      const config = {
        name: 'Test Experiment',
        description: 'Testing button colors',
        type: 'ui_component',
        variants: [
          { name: 'Control', description: 'Blue button' },
          { name: 'Variant A', description: 'Red button' }
        ],
        targetAudience: { userTypes: ['landlord'] },
        trafficAllocation: 50,
        metrics: ['click_rate'],
        duration: 14,
        hypothesis: 'Red button will increase clicks',
        owner: 'product_team'
      };

      const experiment = await abTesting.createExperiment(config);

      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          name: config.name,
          type: config.type,
          status: 'draft',
          variants: [
            {
              id: 'variant_0',
              name: 'Control',
              description: 'Blue button',
              allocation: 50,
              configuration: {}
            },
            {
              id: 'variant_1',
              name: 'Variant A',
              description: 'Red button',
              allocation: 50,
              configuration: {}
            }
          ]
        })
      );

      expect(firebaseAnalytics.trackEvent).toHaveBeenCalledWith('experiment_created', {
        experiment_id: 'exp123',
        experiment_type: config.type,
        variant_count: 2,
        owner: config.owner
      });

      expect(experiment.id).toBe('exp123');
    });

    it('should reject invalid experiment config', async () => {
      const invalidConfig = {
        name: 'Test',
        variants: [{ name: 'Only one variant' }] // Less than 2 variants
      };

      await expect(abTesting.createExperiment(invalidConfig)).rejects.toThrow(
        'Experiment must have at least 2 variants'
      );
    });

    it('should reject missing required fields', async () => {
      const invalidConfig = {}; // Missing name and variants

      await expect(abTesting.createExperiment(invalidConfig)).rejects.toThrow(
        'Missing required experiment configuration'
      );
    });

    it('should reject invalid experiment type', async () => {
      const invalidConfig = {
        name: 'Test',
        type: 'invalid_type',
        variants: [{ name: 'A' }, { name: 'B' }]
      };

      await expect(abTesting.createExperiment(invalidConfig)).rejects.toThrow(
        'Invalid experiment type: invalid_type'
      );
    });
  });

  describe('Experiment Management', () => {
    beforeEach(async () => {
      await abTesting.initialize();
      serverTimestamp.mockReturnValue({ seconds: 1640995200 });
    });

    it('should start experiment successfully', async () => {
      const mockExperiment = {
        name: 'Test Experiment',
        status: 'draft',
        duration: 14
      };

      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockExperiment
      });

      const result = await abTesting.startExperiment('exp123');

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        {
          status: 'active',
          startDate: { seconds: 1640995200 },
          endDate: expect.any(Date)
        }
      );

      expect(abTesting.activeExperiments.has('exp123')).toBe(true);
      expect(firebaseAnalytics.trackEvent).toHaveBeenCalledWith('experiment_started', {
        experiment_id: 'exp123',
        experiment_name: mockExperiment.name,
        duration_days: 14
      });

      expect(result.success).toBe(true);
      expect(result.experimentId).toBe('exp123');
    });

    it('should not start non-existent experiment', async () => {
      getDoc.mockResolvedValue({
        exists: () => false
      });

      await expect(abTesting.startExperiment('nonexistent')).rejects.toThrow(
        'Experiment nonexistent not found'
      );
    });

    it('should not start experiment not in draft status', async () => {
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ status: 'active' })
      });

      await expect(abTesting.startExperiment('exp123')).rejects.toThrow(
        'Cannot start experiment in active status'
      );
    });
  });

  describe('User Assignment', () => {
    beforeEach(async () => {
      await abTesting.initialize();
      serverTimestamp.mockReturnValue({ seconds: 1640995200 });
      addDoc.mockResolvedValue({ id: 'assignment123' });

      // Set up active experiment
      abTesting.activeExperiments.set('exp123', {
        id: 'exp123',
        name: 'Test Experiment',
        type: 'ui_component',
        variants: [
          { id: 'variant_0', name: 'Control', allocation: 50 },
          { id: 'variant_1', name: 'Variant A', allocation: 50 }
        ],
        targetAudience: {},
        trafficAllocation: 100
      });
    });

    it('should assign user to experiment successfully', async () => {
      const userId = 'user123';
      const userProfile = { userType: 'landlord' };

      const assignment = await abTesting.assignUserToExperiment(userId, 'exp123', userProfile);

      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        {
          userId,
          experimentId: 'exp123',
          variantId: expect.stringMatching(/^variant_[01]$/),
          variantName: expect.any(String),
          assignedAt: { seconds: 1640995200 },
          experimentName: 'Test Experiment',
          experimentType: 'ui_component'
        }
      );

      expect(firebaseAnalytics.trackEvent).toHaveBeenCalledWith('experiment_assigned', {
        experiment_id: 'exp123',
        variant_id: expect.stringMatching(/^variant_[01]$/),
        user_type: 'landlord'
      });

      expect(assignment).toBeTruthy();
      expect(assignment.userId).toBe(userId);
      expect(assignment.experimentId).toBe('exp123');
    });

    it('should return null for inactive experiment', async () => {
      const assignment = await abTesting.assignUserToExperiment('user123', 'inactive_exp', {});

      expect(assignment).toBe(null);
      expect(addDoc).not.toHaveBeenCalled();
    });

    it('should return cached assignment for already assigned user', async () => {
      const userId = 'user123';
      const cachedAssignment = { userId, experimentId: 'exp123', variantId: 'variant_0' };
      abTesting.userExperiments.set(`${userId}_exp123`, cachedAssignment);

      const assignment = await abTesting.assignUserToExperiment(userId, 'exp123', {});

      expect(assignment).toBe(cachedAssignment);
      expect(addDoc).not.toHaveBeenCalled();
    });

    it('should respect traffic allocation', async () => {
      // Set traffic allocation to 0 (no users should be assigned)
      abTesting.activeExperiments.get('exp123').trafficAllocation = 0;

      const assignment = await abTesting.assignUserToExperiment('user123', 'exp123', {});

      expect(assignment).toBe(null);
      expect(addDoc).not.toHaveBeenCalled();
    });

    it('should handle assignment errors gracefully', async () => {
      addDoc.mockRejectedValueOnce(new Error('Database error'));

      const assignment = await abTesting.assignUserToExperiment('user123', 'exp123', {});

      expect(assignment).toBe(null);
    });
  });

  describe('Variant Retrieval', () => {
    beforeEach(async () => {
      await abTesting.initialize();
    });

    it('should get user variant from cache', async () => {
      const userId = 'user123';
      const cachedAssignment = { variantId: 'variant_1' };
      abTesting.userExperiments.set(`${userId}_exp123`, cachedAssignment);

      const variant = await abTesting.getUserVariant(userId, 'exp123');

      expect(variant).toBe('variant_1');
      expect(getDocs).not.toHaveBeenCalled();
    });

    it('should get user variant from database when not cached', async () => {
      const userId = 'user123';
      const mockAssignment = { variantId: 'variant_0' };

      query.mockReturnValue('mock-query');
      getDocs.mockResolvedValue({
        empty: false,
        docs: [{ data: () => mockAssignment }]
      });

      const variant = await abTesting.getUserVariant(userId, 'exp123');

      expect(variant).toBe('variant_0');
      expect(getDocs).toHaveBeenCalledWith('mock-query');
      expect(abTesting.userExperiments.has(`${userId}_exp123`)).toBe(true);
    });

    it('should return null when user not assigned', async () => {
      query.mockReturnValue('mock-query');
      getDocs.mockResolvedValue({ empty: true });

      const variant = await abTesting.getUserVariant('user123', 'exp123');

      expect(variant).toBe(null);
    });

    it('should handle database errors gracefully', async () => {
      getDocs.mockRejectedValueOnce(new Error('Database error'));

      const variant = await abTesting.getUserVariant('user123', 'exp123');

      expect(variant).toBe(null);
    });
  });

  describe('Feature Flags', () => {
    beforeEach(async () => {
      await abTesting.initialize();
    });

    it('should check feature flag correctly when enabled', async () => {
      // Set up feature flag experiment
      abTesting.activeExperiments.set('feature_test_feature', {
        id: 'feature_test_feature',
        type: 'feature_flag'
      });

      vi.spyOn(abTesting, 'getUserVariant').mockResolvedValue('variant_1');

      const isEnabled = await abTesting.isFeatureEnabled('user123', 'feature_test', {});

      expect(isEnabled).toBe(true);
      expect(abTesting.getUserVariant).toHaveBeenCalledWith('user123', 'feature_test_feature');
    });

    it('should check feature flag correctly when disabled', async () => {
      abTesting.activeExperiments.set('feature_test_feature', {
        id: 'feature_test_feature',
        type: 'feature_flag'
      });

      vi.spyOn(abTesting, 'getUserVariant').mockResolvedValue('variant_0');

      const isEnabled = await abTesting.isFeatureEnabled('user123', 'feature_test', {});

      expect(isEnabled).toBe(false);
    });

    it('should return false when no feature flag experiment exists', async () => {
      const isEnabled = await abTesting.isFeatureEnabled('user123', 'nonexistent_feature', {});

      expect(isEnabled).toBe(false);
    });
  });

  describe('Helper Methods', () => {
    it('should select variant based on user hash', () => {
      const variants = [
        { id: 'variant_0', allocation: 30 },
        { id: 'variant_1', allocation: 70 }
      ];

      // Test with known user IDs to verify deterministic behavior
      const variant1 = abTesting.selectVariant('user1', variants);
      const variant2 = abTesting.selectVariant('user2', variants);

      expect(['variant_0', 'variant_1']).toContain(variant1.id);
      expect(['variant_0', 'variant_1']).toContain(variant2.id);

      // Same user should always get same variant
      const variant1Again = abTesting.selectVariant('user1', variants);
      expect(variant1Again.id).toBe(variant1.id);
    });

    it('should hash user IDs consistently', () => {
      const hash1 = abTesting.hashUserId('test_user');
      const hash2 = abTesting.hashUserId('test_user');
      const hash3 = abTesting.hashUserId('different_user');

      expect(hash1).toBe(hash2); // Same user ID should produce same hash
      expect(hash1).not.toBe(hash3); // Different user IDs should produce different hashes
      expect(typeof hash1).toBe('number');
      expect(hash1).toBeGreaterThanOrEqual(0);
    });

    it('should match target audience correctly', () => {
      const userProfile = { userType: 'landlord', country: 'US' };

      // Empty audience should match all users
      expect(abTesting.matchesTargetAudience(userProfile, {})).toBe(true);

      // Matching user type
      expect(abTesting.matchesTargetAudience(userProfile, {
        userTypes: ['landlord', 'tenant']
      })).toBe(true);

      // Non-matching user type
      expect(abTesting.matchesTargetAudience(userProfile, {
        userTypes: ['contractor']
      })).toBe(false);

      // Matching country
      expect(abTesting.matchesTargetAudience(userProfile, {
        countries: ['US', 'CA']
      })).toBe(true);

      // Non-matching country
      expect(abTesting.matchesTargetAudience(userProfile, {
        countries: ['UK', 'DE']
      })).toBe(false);
    });
  });

  describe('Service Status', () => {
    it('should return correct status when uninitialized', () => {
      const status = abTesting.getStatus();

      expect(status).toEqual({
        initialized: false,
        activeExperiments: 0,
        userExperiments: 0,
        experimentTypes: expect.any(Array),
        templates: ['pricing_test', 'onboarding_flow', 'cta_optimization']
      });
    });

    it('should return correct status when initialized', async () => {
      await abTesting.initialize();
      abTesting.activeExperiments.set('exp1', {});
      abTesting.userExperiments.set('user1_exp1', {});

      const status = abTesting.getStatus();

      expect(status).toEqual({
        initialized: true,
        activeExperiments: 1,
        userExperiments: 1,
        experimentTypes: expect.any(Array),
        templates: ['pricing_test', 'onboarding_flow', 'cta_optimization']
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await abTesting.initialize();
    });

    it('should handle Firestore errors gracefully in experiment creation', async () => {
      addDoc.mockRejectedValueOnce(new Error('Firestore error'));

      const config = {
        name: 'Test',
        type: 'ui_component',
        variants: [{ name: 'A' }, { name: 'B' }]
      };

      await expect(abTesting.createExperiment(config)).rejects.toThrow('Firestore error');
    });

    it('should handle analytics errors gracefully in assignment', async () => {
      abTesting.activeExperiments.set('exp123', {
        variants: [{ id: 'variant_0', allocation: 100 }],
        targetAudience: {},
        trafficAllocation: 100
      });

      firebaseAnalytics.trackEvent.mockRejectedValueOnce(new Error('Analytics error'));

      // Should still complete assignment despite analytics error
      const assignment = await abTesting.assignUserToExperiment('user123', 'exp123', {});

      expect(assignment).toBeTruthy();
    });
  });
}); 