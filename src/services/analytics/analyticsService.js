import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  Timestamp,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../firebase/config';

class AnalyticsService {
  constructor() {
    this.analyticsCollection = collection(db, 'analytics');
    this.pageViewsCollection = collection(db, 'pageViews');
    this.userSessionsCollection = collection(db, 'userSessions');
    this.performanceMetricsCollection = collection(db, 'performanceMetrics');
  }

  // =============================================
  // EVENT TRACKING
  // =============================================

  /**
   * Track a page view
   */
  async trackPageView(data) {
    try {
      const pageViewData = {
        ...data,
        timestamp: serverTimestamp(),
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        referrer: document.referrer,
        loadTime: performance.navigation?.loadEventEnd - performance.navigation?.navigationStart || 0
      };

      await addDoc(this.pageViewsCollection, pageViewData);
    } catch (error) {
      console.error('Failed to track page view:', error);
    }
  }

  /**
   * Track user interaction events
   */
  async trackEvent(eventName, eventData = {}) {
    try {
      const eventRecord = {
        eventName,
        eventData,
        timestamp: serverTimestamp(),
        sessionId: this.getSessionId(),
        userId: eventData.userId || null,
        userType: eventData.userType || null,
        page: window.location.pathname,
        userAgent: navigator.userAgent
      };

      await addDoc(this.analyticsCollection, eventRecord);
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  /**
   * Track performance metrics
   */
  async trackPerformance(metrics) {
    try {
      const performanceData = {
        ...metrics,
        timestamp: serverTimestamp(),
        page: window.location.pathname,
        userAgent: navigator.userAgent,
        connection: navigator.connection ? {
          effectiveType: navigator.connection.effectiveType,
          downlink: navigator.connection.downlink,
          rtt: navigator.connection.rtt
        } : null
      };

      await addDoc(this.performanceMetricsCollection, performanceData);
    } catch (error) {
      console.error('Failed to track performance:', error);
    }
  }

  /**
   * Track user session
   */
  async trackSession(sessionData) {
    try {
      const session = {
        ...sessionData,
        timestamp: serverTimestamp(),
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      };

      await addDoc(this.userSessionsCollection, session);
    } catch (error) {
      console.error('Failed to track session:', error);
    }
  }

  // =============================================
  // ANALYTICS RETRIEVAL
  // =============================================

  /**
   * Get advanced analytics data for dashboard
   */
  async getAdvancedAnalytics(timeRange = '7d') {
    try {
      const timeRangeMs = this.getTimeRangeMs(timeRange);
      const startDate = new Date(Date.now() - timeRangeMs);

      // Fetch all analytics data in parallel
      const [
        overview,
        performance,
        userBehavior,
        businessMetrics
      ] = await Promise.all([
        this.getOverviewMetrics(startDate),
        this.getPerformanceMetrics(startDate),
        this.getUserBehaviorMetrics(startDate),
        this.getBusinessMetrics(startDate)
      ]);

      return {
        overview,
        performance,
        userBehavior,
        businessMetrics
      };
    } catch (error) {
      console.error('Failed to get advanced analytics:', error);
      // Return default data structure
      return this.getDefaultAnalytics();
    }
  }

  /**
   * Get overview metrics
   */
  async getOverviewMetrics(startDate) {
    try {
      // For demo purposes, returning mock data
      // In production, this would query actual analytics collections
      return {
        totalUsers: 1247,
        activeUsers: 892,
        newSignups: 156,
        retentionRate: 78
      };
    } catch (error) {
      console.error('Failed to get overview metrics:', error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        newSignups: 0,
        retentionRate: 0
      };
    }
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(startDate) {
    try {
      // For demo purposes, returning mock data based on realistic web performance
      return {
        avgPageLoadTime: 1850,
        bounceRate: 34,
        sessionsPerUser: 2.3,
        avgSessionDuration: 480 // seconds
      };
    } catch (error) {
      console.error('Failed to get performance metrics:', error);
      return {
        avgPageLoadTime: 0,
        bounceRate: 0,
        sessionsPerUser: 0,
        avgSessionDuration: 0
      };
    }
  }

  /**
   * Get user behavior metrics
   */
  async getUserBehaviorMetrics(startDate) {
    try {
      // Mock data for demo - in production this would analyze actual page views
      return {
        topPages: [
          { path: '/dashboard', title: 'Dashboard', views: 3421 },
          { path: '/properties', title: 'Properties', views: 2156 },
          { path: '/contractor/dashboard', title: 'Contractor Dashboard', views: 1789 },
          { path: '/maintenance', title: 'Maintenance', views: 1234 },
          { path: '/profile', title: 'Profile', views: 987 }
        ],
        userJourney: [
          'Landing Page → Sign Up → Onboarding → Dashboard',
          'Dashboard → Properties → Property Details → Contact',
          'Login → Dashboard → Maintenance → Create Request'
        ],
        deviceTypes: [
          { type: 'mobile', percentage: 65 },
          { type: 'desktop', percentage: 30 },
          { type: 'tablet', percentage: 5 }
        ],
        conversionFunnel: [
          { name: 'Visited Site', count: 10000, percentage: 100 },
          { name: 'Viewed Signup', count: 3500, percentage: 35 },
          { name: 'Started Registration', count: 2100, percentage: 21 },
          { name: 'Completed Onboarding', count: 1680, percentage: 16.8 },
          { name: 'Active User (7 days)', count: 1344, percentage: 13.4 }
        ]
      };
    } catch (error) {
      console.error('Failed to get user behavior metrics:', error);
      return {
        topPages: [],
        userJourney: [],
        deviceTypes: [],
        conversionFunnel: []
      };
    }
  }

  /**
   * Get business metrics
   */
  async getBusinessMetrics(startDate) {
    try {
      // Mock business data - in production this would query actual collections
      return {
        totalProperties: 423,
        activeListings: 187,
        maintenanceRequests: 89,
        contractorJobs: 156
      };
    } catch (error) {
      console.error('Failed to get business metrics:', error);
      return {
        totalProperties: 0,
        activeListings: 0,
        maintenanceRequests: 0,
        contractorJobs: 0
      };
    }
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  /**
   * Get time range in milliseconds
   */
  getTimeRangeMs(timeRange) {
    const timeRanges = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000
    };
    return timeRanges[timeRange] || timeRanges['7d'];
  }

  /**
   * Get or create session ID
   */
  getSessionId() {
    let sessionId = sessionStorage.getItem('analyticsSessionId');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('analyticsSessionId', sessionId);
    }
    return sessionId;
  }

  /**
   * Get default analytics structure
   */
  getDefaultAnalytics() {
    return {
      overview: {
        totalUsers: 0,
        activeUsers: 0,
        newSignups: 0,
        retentionRate: 0
      },
      performance: {
        avgPageLoadTime: 0,
        bounceRate: 0,
        sessionsPerUser: 0,
        avgSessionDuration: 0
      },
      userBehavior: {
        topPages: [],
        userJourney: [],
        deviceTypes: [],
        conversionFunnel: []
      },
      businessMetrics: {
        totalProperties: 0,
        activeListings: 0,
        maintenanceRequests: 0,
        contractorJobs: 0
      }
    };
  }

  // =============================================
  // REAL-TIME TRACKING HELPERS
  // =============================================

  /**
   * Initialize automatic tracking
   */
  initializeTracking(userId, userType) {
    // Track page views
    this.trackPageView({ userId, userType });

    // Track performance metrics
    if (window.performance && window.performance.timing) {
      setTimeout(() => {
        const timing = window.performance.timing;
        this.trackPerformance({
          pageLoadTime: timing.loadEventEnd - timing.navigationStart,
          domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
          firstPaint: timing.responseStart - timing.navigationStart,
          userId,
          userType
        });
      }, 1000);
    }

    // Track session start
    this.trackSession({
      userId,
      userType,
      sessionId: this.getSessionId(),
      startTime: new Date(),
      page: window.location.pathname
    });
  }

  /**
   * Track user interactions automatically
   */
  setupAutoTracking(userId, userType) {
    // Track clicks on important elements
    document.addEventListener('click', (event) => {
      const target = event.target;
      if (target.matches('button, a, [role="button"]')) {
        this.trackEvent('click', {
          userId,
          userType,
          elementType: target.tagName.toLowerCase(),
          elementText: target.textContent?.slice(0, 50),
          elementId: target.id,
          elementClass: target.className
        });
      }
    });

    // Track form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target;
      if (form.tagName === 'FORM') {
        this.trackEvent('form_submit', {
          userId,
          userType,
          formId: form.id,
          formClass: form.className,
          formAction: form.action
        });
      }
    });

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.trackEvent('visibility_change', {
        userId,
        userType,
        hidden: document.hidden
      });
    });
  }
}

// Create and export singleton instance
export const analyticsService = new AnalyticsService();
export default analyticsService; 