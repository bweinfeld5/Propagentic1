/**
 * Firebase Analytics Service Tests
 * Comprehensive testing for Firebase Analytics functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Firebase Analytics before any imports
vi.mock('firebase/analytics', () => ({
  getAnalytics: vi.fn(),
  logEvent: vi.fn(),
  setUserProperties: vi.fn(),
  setUserId: vi.fn(),
  setCurrentScreen: vi.fn()
}));

// Mock Firebase config
vi.mock('../../src/firebase/config', () => ({
  app: { name: '[DEFAULT]' }
}));

// Mock audit logger
vi.mock('../../src/services/security/auditLogger', () => ({
  auditLogger: {
    logEvent: vi.fn().mockResolvedValue(undefined)
  }
}));

// Import after mocks are set up
import { getAnalytics, logEvent, setUserProperties, setUserId, setCurrentScreen } from 'firebase/analytics';
import { firebaseAnalytics } from '../../src/services/analytics/firebaseAnalytics.js';
import { auditLogger } from '../../src/services/security/auditLogger';

describe('Firebase Analytics Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    firebaseAnalytics.isInitialized = false;
    firebaseAnalytics.isEnabled = false;
    firebaseAnalytics.userContext = null;
    firebaseAnalytics.sessionId = null;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize successfully with user consent', async () => {
      getAnalytics.mockReturnValue({});
      
      const result = await firebaseAnalytics.initialize(true);
      
      expect(result.success).toBe(true);
      expect(firebaseAnalytics.isInitialized).toBe(true);
      expect(firebaseAnalytics.isEnabled).toBe(true);
      expect(firebaseAnalytics.sessionId).toBeTruthy();
      expect(auditLogger.logEvent).toHaveBeenCalledWith('ANALYTICS_INITIALIZED', {
        service: 'firebase_analytics',
        sessionId: firebaseAnalytics.sessionId,
        timestamp: expect.any(String),
        environment: expect.any(String)
      });
    });

    it('should fail initialization without user consent', async () => {
      const result = await firebaseAnalytics.initialize(false);
      
      expect(result.success).toBe(false);
      expect(result.reason).toBe('user_consent_required');
      expect(firebaseAnalytics.isInitialized).toBe(false);
      expect(firebaseAnalytics.isEnabled).toBe(false);
    });

    it('should handle initialization errors gracefully', async () => {
      getAnalytics.mockImplementation(() => {
        throw new Error('Firebase initialization failed');
      });
      
      await expect(firebaseAnalytics.initialize(true)).rejects.toThrow('Firebase initialization failed');
    });
  });

  describe('User Context Management', () => {
    beforeEach(async () => {
      getAnalytics.mockReturnValue({});
      await firebaseAnalytics.initialize(true);
    });

    it('should set user context correctly', async () => {
      const userId = 'test-user-123';
      const userProfile = {
        userType: 'landlord',
        subscriptionPlan: 'premium',
        onboardingComplete: true
      };

      await firebaseAnalytics.setUserContext(userId, userProfile);

      expect(setUserId).toHaveBeenCalledWith({}, userId);
      expect(setUserProperties).toHaveBeenCalledWith({}, {
        user_type: 'landlord',
        subscription_plan: 'premium',
        onboarding_completed: 'true'
      });
      expect(firebaseAnalytics.userContext).toEqual({
        userId,
        ...userProfile
      });
    });

    it('should not set user context when service is disabled', async () => {
      firebaseAnalytics.isEnabled = false;
      
      await firebaseAnalytics.setUserContext('test-user', {});
      
      expect(setUserId).not.toHaveBeenCalled();
      expect(setUserProperties).not.toHaveBeenCalled();
    });
  });

  describe('Event Tracking', () => {
    beforeEach(async () => {
      getAnalytics.mockReturnValue({});
      await firebaseAnalytics.initialize(true);
      
      // Mock window object for page tracking
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { href: 'https://test.com/dashboard' }
      });
      
      Object.defineProperty(document, 'title', {
        writable: true,
        value: 'Test Page'
      });
    });

    it('should track events with enhanced parameters', async () => {
      const eventName = 'test_event';
      const parameters = { key: 'value' };

      await firebaseAnalytics.trackEvent(eventName, parameters);

      expect(logEvent).toHaveBeenCalledWith({}, eventName, {
        ...parameters,
        timestamp: expect.any(String),
        session_id: firebaseAnalytics.sessionId,
        user_type: undefined,
        page_url: 'https://test.com/dashboard',
        page_title: 'Test Page'
      });
    });

    it('should track page views correctly', async () => {
      const pageName = 'dashboard';
      const additionalParams = { section: 'overview' };

      await firebaseAnalytics.trackPageView(pageName, additionalParams);

      expect(setCurrentScreen).toHaveBeenCalledWith({}, pageName);
      expect(logEvent).toHaveBeenCalledWith({}, 'page_view', {
        page_name: pageName,
        page_location: 'https://test.com/dashboard',
        page_title: 'Test Page',
        ...additionalParams,
        timestamp: expect.any(String),
        session_id: firebaseAnalytics.sessionId,
        user_type: undefined,
        page_url: 'https://test.com/dashboard',
        page_title: 'Test Page'
      });
    });

    it('should batch track multiple events', async () => {
      const events = [
        { name: 'event1', parameters: { key1: 'value1' } },
        { name: 'event2', parameters: { key2: 'value2' } }
      ];

      await firebaseAnalytics.trackEventBatch(events);

      expect(logEvent).toHaveBeenCalledTimes(2);
      expect(logEvent).toHaveBeenCalledWith({}, 'event1', { key1: 'value1' });
      expect(logEvent).toHaveBeenCalledWith({}, 'event2', { key2: 'value2' });
    });

    it('should not track events when service is disabled', async () => {
      firebaseAnalytics.isEnabled = false;
      
      await firebaseAnalytics.trackEvent('test_event', {});
      
      expect(logEvent).not.toHaveBeenCalled();
    });
  });

  describe('Service Management', () => {
    it('should enable and disable service correctly', () => {
      firebaseAnalytics.setEnabled(true);
      expect(firebaseAnalytics.isEnabled).toBe(true);

      firebaseAnalytics.setEnabled(false);
      expect(firebaseAnalytics.isEnabled).toBe(false);
    });

    it('should clear user data correctly', () => {
      firebaseAnalytics.userContext = { userId: 'test' };
      firebaseAnalytics.analytics = {};

      firebaseAnalytics.clearUserData();

      expect(firebaseAnalytics.userContext).toBe(null);
      expect(setUserId).toHaveBeenCalledWith({}, null);
    });

    it('should return correct status', async () => {
      getAnalytics.mockReturnValue({});
      await firebaseAnalytics.initialize(true);
      firebaseAnalytics.userContext = { userId: 'test', userType: 'landlord' };

      const status = firebaseAnalytics.getStatus();

      expect(status).toEqual({
        initialized: true,
        enabled: true,
        sessionId: expect.any(String),
        userContext: { userId: 'test', userType: 'landlord' },
        debugMode: false
      });
    });
  });

  describe('Session Management', () => {
    it('should generate unique session IDs', () => {
      const sessionId1 = firebaseAnalytics.generateSessionId();
      const sessionId2 = firebaseAnalytics.generateSessionId();

      expect(sessionId1).toMatch(/^session_[a-z0-9]{9}$/);
      expect(sessionId2).toMatch(/^session_[a-z0-9]{9}$/);
      expect(sessionId1).not.toBe(sessionId2);
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      getAnalytics.mockReturnValue({});
      await firebaseAnalytics.initialize(true);
    });

    it('should handle tracking errors gracefully', async () => {
      logEvent.mockImplementation(() => {
        throw new Error('Tracking failed');
      });

      // Should not throw
      await firebaseAnalytics.trackEvent('test_event', {});
      
      expect(logEvent).toHaveBeenCalled();
    });

    it('should handle page view tracking errors gracefully', async () => {
      setCurrentScreen.mockImplementation(() => {
        throw new Error('Screen tracking failed');
      });

      // Should not throw
      await firebaseAnalytics.trackPageView('test_page', {});
      
      expect(setCurrentScreen).toHaveBeenCalled();
    });

    it('should handle user context errors gracefully', async () => {
      setUserId.mockImplementation(() => {
        throw new Error('User ID setting failed');
      });

      // Should not throw
      await firebaseAnalytics.setUserContext('test-user', {});
      
      expect(setUserId).toHaveBeenCalled();
    });
  });
}); 