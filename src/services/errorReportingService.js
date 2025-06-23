/**
 * Error Reporting Service for PropAgentic
 * Integrates with external error tracking services (Sentry, LogRocket, etc.)
 * Provides fallback local storage and comprehensive error logging
 */

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

class ErrorReportingService {
  constructor() {
    this.isInitialized = false;
    this.sentryDsn = process.env.REACT_APP_SENTRY_DSN;
    this.environment = process.env.NODE_ENV;
    this.release = process.env.REACT_APP_VERSION || '1.0.0';
    this.errorQueue = [];
    this.maxQueueSize = 100;
    this.flushInterval = 30000; // 30 seconds
    
    this.initialize();
  }

  /**
   * Initialize error reporting service
   */
  async initialize() {
    try {
      // Initialize Sentry if DSN is provided
      if (this.sentryDsn && !this.isInitialized) {
        await this.initializeSentry();
      }

      // Setup global error handlers
      this.setupGlobalErrorHandlers();

      // Start error queue processing
      this.startErrorQueueProcessor();

      this.isInitialized = true;
      console.log('[ErrorReporting] Service initialized successfully');
    } catch (error) {
      console.error('[ErrorReporting] Failed to initialize:', error);
      // Continue without external service
      this.isInitialized = true;
    }
  }

  /**
   * Initialize Sentry integration
   */
  async initializeSentry() {
    try {
      // Dynamic import to avoid loading if not needed
      const Sentry = await import('@sentry/react');
      
      Sentry.init({
        dsn: this.sentryDsn,
        environment: this.environment,
        release: this.release,
        integrations: [
          new Sentry.BrowserTracing(),
          new Sentry.Replay({
            maskAllText: true,
            blockAllMedia: true,
          }),
        ],
        tracesSampleRate: this.environment === 'production' ? 0.1 : 1.0,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
        beforeSend: (event) => {
          // Filter out certain errors
          if (this.shouldIgnoreError(event)) {
            return null;
          }
          return event;
        },
      });

      // Set user context
      this.setSentryUser();
      
      console.log('[ErrorReporting] Sentry initialized');
    } catch (error) {
      console.warn('[ErrorReporting] Sentry initialization failed:', error);
    }
  }

  /**
   * Setup global error handlers
   */
  setupGlobalErrorHandlers() {
    // Unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.reportError({
        type: 'javascript_error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError({
        type: 'unhandled_promise_rejection',
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      });
    });

    // Network errors (fetch failures)
    this.interceptFetchErrors();
  }

  /**
   * Intercept fetch errors for network monitoring
   */
  interceptFetchErrors() {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        // Report HTTP errors
        if (!response.ok) {
          this.reportError({
            type: 'network_error',
            message: `HTTP ${response.status}: ${response.statusText}`,
            url: args[0],
            status: response.status,
            statusText: response.statusText,
            timestamp: new Date().toISOString()
          });
        }
        
        return response;
      } catch (error) {
        // Report network failures
        this.reportError({
          type: 'network_failure',
          message: error.message,
          stack: error.stack,
          url: args[0],
          timestamp: new Date().toISOString()
        });
        throw error;
      }
    };
  }

  /**
   * Report error to all configured services
   */
  async reportError(errorDetails) {
    try {
      // Enhance error details
      const enhancedError = this.enhanceErrorDetails(errorDetails);

      // Report to external services
      await this.reportToExternalServices(enhancedError);

      // Store locally for fallback
      this.storeErrorLocally(enhancedError);

      // Queue for batch processing
      this.queueError(enhancedError);

      console.log('[ErrorReporting] Error reported:', enhancedError.errorId);
    } catch (error) {
      console.error('[ErrorReporting] Failed to report error:', error);
      // Ensure we don't create infinite error loops
    }
  }

  /**
   * Enhance error details with additional context
   */
  enhanceErrorDetails(errorDetails) {
    const enhanced = {
      ...errorDetails,
      errorId: errorDetails.errorId || this.generateErrorId(),
      timestamp: errorDetails.timestamp || new Date().toISOString(),
      url: errorDetails.url || window.location.href,
      userAgent: errorDetails.userAgent || navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      screen: {
        width: window.screen.width,
        height: window.screen.height,
        pixelRatio: window.devicePixelRatio
      },
      connection: this.getConnectionInfo(),
      performance: this.getPerformanceInfo(),
      localStorage: this.getLocalStorageInfo(),
      sessionStorage: this.getSessionStorageInfo(),
      cookies: this.getCookieInfo()
    };

    // Add user context if available
    const userContext = this.getUserContext();
    if (userContext) {
      enhanced.user = userContext;
    }

    return enhanced;
  }

  /**
   * Report to external error tracking services
   */
  async reportToExternalServices(errorDetails) {
    const promises = [];

    // Report to Sentry
    if (this.sentryDsn) {
      promises.push(this.reportToSentry(errorDetails));
    }

    // Report to Firebase (as backup storage)
    promises.push(this.reportToFirebase(errorDetails));

    // Report to custom analytics
    promises.push(this.reportToAnalytics(errorDetails));

    await Promise.allSettled(promises);
  }

  /**
   * Report to Sentry
   */
  async reportToSentry(errorDetails) {
    try {
      const Sentry = await import('@sentry/react');
      
      Sentry.withScope((scope) => {
        scope.setTag('errorId', errorDetails.errorId);
        scope.setTag('errorType', errorDetails.type);
        scope.setLevel('error');
        
        scope.setContext('errorDetails', errorDetails);
        scope.setContext('device', {
          viewport: errorDetails.viewport,
          screen: errorDetails.screen,
          userAgent: errorDetails.userAgent
        });
        
        if (errorDetails.user) {
          scope.setUser(errorDetails.user);
        }

        if (errorDetails.stack) {
          Sentry.captureException(new Error(errorDetails.message), {
            extra: { originalStack: errorDetails.stack }
          });
        } else {
          Sentry.captureMessage(errorDetails.message, 'error');
        }
      });
    } catch (error) {
      console.warn('[ErrorReporting] Sentry reporting failed:', error);
    }
  }

  /**
   * Report to Firebase for backup storage
   */
  async reportToFirebase(errorDetails) {
    try {
      await addDoc(collection(db, 'error_reports'), {
        ...errorDetails,
        timestamp: serverTimestamp(),
        reported_at: new Date().toISOString()
      });
    } catch (error) {
      console.warn('[ErrorReporting] Firebase reporting failed:', error);
    }
  }

  /**
   * Report to analytics service
   */
  async reportToAnalytics(errorDetails) {
    try {
      if (window.gtag) {
        window.gtag('event', 'exception', {
          description: errorDetails.message,
          fatal: errorDetails.type === 'javascript_error',
          error_id: errorDetails.errorId,
          error_type: errorDetails.type
        });
      }
    } catch (error) {
      console.warn('[ErrorReporting] Analytics reporting failed:', error);
    }
  }

  /**
   * Store error locally for offline scenarios
   */
  storeErrorLocally(errorDetails) {
    try {
      const errors = this.getLocalErrors();
      errors.push(errorDetails);
      
      // Keep only last 50 errors
      const trimmedErrors = errors.slice(-50);
      localStorage.setItem('propAgentic_errors', JSON.stringify(trimmedErrors));
    } catch (error) {
      console.warn('[ErrorReporting] Local storage failed:', error);
    }
  }

  /**
   * Queue error for batch processing
   */
  queueError(errorDetails) {
    this.errorQueue.push(errorDetails);
    
    // Trim queue if too large
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue = this.errorQueue.slice(-this.maxQueueSize);
    }
  }

  /**
   * Start error queue processor for batch operations
   */
  startErrorQueueProcessor() {
    setInterval(() => {
      if (this.errorQueue.length > 0) {
        this.processErrorQueue();
      }
    }, this.flushInterval);
  }

  /**
   * Process queued errors
   */
  async processErrorQueue() {
    const errors = [...this.errorQueue];
    this.errorQueue = [];

    try {
      // Send batch to analytics
      if (window.gtag && errors.length > 0) {
        window.gtag('event', 'error_batch', {
          error_count: errors.length,
          error_types: [...new Set(errors.map(e => e.type))].join(',')
        });
      }

      // Additional batch processing can be added here
      console.log(`[ErrorReporting] Processed ${errors.length} queued errors`);
    } catch (error) {
      console.warn('[ErrorReporting] Queue processing failed:', error);
      // Re-queue errors on failure
      this.errorQueue.unshift(...errors);
    }
  }

  /**
   * Get locally stored errors
   */
  getLocalErrors() {
    try {
      const stored = localStorage.getItem('propAgentic_errors');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Clear local error storage
   */
  clearLocalErrors() {
    try {
      localStorage.removeItem('propAgentic_errors');
    } catch (error) {
      console.warn('[ErrorReporting] Failed to clear local errors:', error);
    }
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    const localErrors = this.getLocalErrors();
    const queuedErrors = this.errorQueue.length;
    
    const errorTypes = {};
    localErrors.forEach(error => {
      errorTypes[error.type] = (errorTypes[error.type] || 0) + 1;
    });

    return {
      totalLocalErrors: localErrors.length,
      queuedErrors,
      errorTypes,
      lastError: localErrors[localErrors.length - 1],
      errorFrequency: this.calculateErrorFrequency(localErrors)
    };
  }

  /**
   * Calculate error frequency
   */
  calculateErrorFrequency(errors) {
    if (errors.length < 2) return 0;
    
    const timeSpan = new Date(errors[errors.length - 1].timestamp) - 
                    new Date(errors[0].timestamp);
    return errors.length / (timeSpan / (1000 * 60 * 60)); // errors per hour
  }

  /**
   * Utility methods for context gathering
   */
  generateErrorId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  getUserContext() {
    try {
      const user = JSON.parse(localStorage.getItem('propAgentic_user') || '{}');
      return {
        id: user.uid,
        email: user.email,
        role: user.role
      };
    } catch (error) {
      return null;
    }
  }

  getConnectionInfo() {
    return navigator.connection ? {
      effectiveType: navigator.connection.effectiveType,
      downlink: navigator.connection.downlink,
      rtt: navigator.connection.rtt
    } : null;
  }

  getPerformanceInfo() {
    if (!window.performance) return null;
    
    const navigation = window.performance.getEntriesByType('navigation')[0];
    return navigation ? {
      loadTime: navigation.loadEventEnd - navigation.loadEventStart,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      firstPaint: navigation.responseEnd - navigation.requestStart
    } : null;
  }

  getLocalStorageInfo() {
    try {
      const used = JSON.stringify(localStorage).length;
      return { used, available: 5242880 - used }; // Approximate 5MB limit
    } catch (error) {
      return null;
    }
  }

  getSessionStorageInfo() {
    try {
      const used = JSON.stringify(sessionStorage).length;
      return { used, available: 5242880 - used };
    } catch (error) {
      return null;
    }
  }

  getCookieInfo() {
    try {
      return {
        count: document.cookie.split(';').length,
        size: document.cookie.length
      };
    } catch (error) {
      return null;
    }
  }

  setSentryUser() {
    try {
      const userContext = this.getUserContext();
      if (userContext) {
        import('@sentry/react').then(Sentry => {
          Sentry.setUser(userContext);
        });
      }
    } catch (error) {
      console.warn('[ErrorReporting] Failed to set Sentry user:', error);
    }
  }

  shouldIgnoreError(event) {
    const message = event.exception?.values?.[0]?.value || event.message || '';
    
    // Ignore common non-critical errors
    const ignoredMessages = [
      'Script error',
      'Non-Error promise rejection captured',
      'ResizeObserver loop limit exceeded',
      'Network request failed',
      'Loading chunk'
    ];

    return ignoredMessages.some(ignored => message.includes(ignored));
  }

  /**
   * Manual error reporting for custom errors
   */
  async captureException(error, context = {}) {
    const errorDetails = {
      type: 'manual_exception',
      message: error.message,
      stack: error.stack,
      ...context
    };

    await this.reportError(errorDetails);
  }

  /**
   * Manual message reporting
   */
  async captureMessage(message, level = 'info', context = {}) {
    const errorDetails = {
      type: 'manual_message',
      message,
      level,
      ...context
    };

    await this.reportError(errorDetails);
  }
}

// Create singleton instance
const errorReportingService = new ErrorReportingService();

export default errorReportingService; 