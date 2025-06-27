/**
 * Error Reporting Service
 * Standardized error handling and reporting for PropAgentic
 */

class ErrorReportingService {
  constructor() {
    this.isInitialized = false;
    this.errorQueue = [];
    this.maxQueueSize = 50;
    this.reportingEnabled = process.env.NODE_ENV === 'production';
    this.sessionId = this.generateSessionId();
  }

  /**
   * Initialize the error reporting service
   */
  async initialize() {
    try {
      // Initialize error monitoring (e.g., Sentry, LogRocket, etc.)
      if (this.reportingEnabled) {
        // Add initialization logic for your error monitoring service here
        console.log('Error reporting service initialized in production mode');
      } else {
        console.log('Error reporting service initialized in development mode');
      }
      
      this.isInitialized = true;
      
      // Process any queued errors
      await this.processErrorQueue();
    } catch (error) {
      console.error('Failed to initialize error reporting service:', error);
    }
  }

  /**
   * Generate a unique session ID
   */
  generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Report an error with context
   */
  async reportError(errorDetails) {
    const enhancedError = this.enhanceErrorDetails(errorDetails);
    
    if (!this.isInitialized) {
      this.queueError(enhancedError);
      return;
    }

    try {
      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.group('🚨 Error Report');
        console.error('Error:', enhancedError.error);
        console.log('Context:', enhancedError.context);
        console.log('User Info:', enhancedError.userInfo);
        console.log('System Info:', enhancedError.systemInfo);
        console.groupEnd();
      }

      // Send to error monitoring service in production
      if (this.reportingEnabled) {
        await this.sendToMonitoringService(enhancedError);
      }

      // Store locally for debugging
      this.storeLocalError(enhancedError);

    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
      this.queueError(enhancedError);
    }
  }

  /**
   * Enhance error details with additional context
   */
  enhanceErrorDetails(errorDetails) {
    return {
      ...errorDetails,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      context: {
        ...errorDetails.context,
        url: window.location.href,
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        referrer: document.referrer
      },
      systemInfo: {
        platform: navigator.platform,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        memory: performance.memory ? {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit
        } : null
      }
    };
  }

  /**
   * Queue error for later processing
   */
  queueError(errorDetails) {
    if (this.errorQueue.length >= this.maxQueueSize) {
      this.errorQueue.shift(); // Remove oldest error
    }
    this.errorQueue.push(errorDetails);
  }

  /**
   * Process queued errors
   */
  async processErrorQueue() {
    const errors = [...this.errorQueue];
    this.errorQueue = [];

    for (const error of errors) {
      try {
        await this.reportError(error);
      } catch (processingError) {
        console.error('Failed to process queued error:', processingError);
      }
    }
  }

  /**
   * Send error to monitoring service
   */
  async sendToMonitoringService(errorDetails) {
    try {
      // Example implementation - replace with your actual monitoring service
      const response = await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorDetails)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      // If external service fails, still log locally
      console.error('Failed to send error to monitoring service:', error);
      throw error;
    }
  }

  /**
   * Store error locally for debugging
   */
  storeLocalError(errorDetails) {
    try {
      const localErrors = JSON.parse(localStorage.getItem('propAgentic_errors') || '[]');
      localErrors.push({
        ...errorDetails,
        timestamp: errorDetails.timestamp
      });

      // Keep only last 10 errors locally
      if (localErrors.length > 10) {
        localErrors.splice(0, localErrors.length - 10);
      }

      localStorage.setItem('propAgentic_errors', JSON.stringify(localErrors));
    } catch (storageError) {
      console.error('Failed to store error locally:', storageError);
    }
  }

  /**
   * Get locally stored errors (for debugging)
   */
  getLocalErrors() {
    try {
      return JSON.parse(localStorage.getItem('propAgentic_errors') || '[]');
    } catch (error) {
      console.error('Failed to retrieve local errors:', error);
      return [];
    }
  }

  /**
   * Clear locally stored errors
   */
  clearLocalErrors() {
    try {
      localStorage.removeItem('propAgentic_errors');
    } catch (error) {
      console.error('Failed to clear local errors:', error);
    }
  }

  /**
   * Report a JavaScript exception
   */
  async captureException(error, context = {}) {
    await this.reportError({
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      type: 'javascript_exception',
      context,
      severity: 'error'
    });
  }

  /**
   * Report a user action error
   */
  async captureUserActionError(action, error, userInfo = {}) {
    await this.reportError({
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      type: 'user_action_error',
      context: {
        action,
        userInfo
      },
      severity: 'warning'
    });
  }

  /**
   * Report a performance issue
   */
  async capturePerformanceIssue(metric, value, threshold) {
    await this.reportError({
      error: {
        message: `Performance threshold exceeded: ${metric}`,
        stack: null,
        name: 'PerformanceError'
      },
      type: 'performance_issue',
      context: {
        metric,
        value,
        threshold,
        performanceEntries: this.getPerformanceEntries()
      },
      severity: 'info'
    });
  }

  /**
   * Get performance entries for debugging
   */
  getPerformanceEntries() {
    try {
      return {
        navigation: performance.getEntriesByType('navigation')[0],
        paint: performance.getEntriesByType('paint'),
        resource: performance.getEntriesByType('resource').slice(-10) // Last 10 resources
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Set user context for error reporting
   */
  setUserContext(userInfo) {
    this.userContext = {
      id: userInfo.id,
      email: userInfo.email,
      role: userInfo.role,
      // Don't store sensitive information
    };
  }

  /**
   * Clear user context
   */
  clearUserContext() {
    this.userContext = null;
  }

  /**
   * Add breadcrumb for debugging
   */
  addBreadcrumb(message, category = 'general', level = 'info') {
    if (!this.breadcrumbs) {
      this.breadcrumbs = [];
    }

    this.breadcrumbs.push({
      message,
      category,
      level,
      timestamp: new Date().toISOString()
    });

    // Keep only last 20 breadcrumbs
    if (this.breadcrumbs.length > 20) {
      this.breadcrumbs.shift();
    }
  }
}

// Create singleton instance
const errorReportingService = new ErrorReportingService();

// Initialize on load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    errorReportingService.initialize();
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    errorReportingService.captureException(
      new Error(`Unhandled Promise Rejection: ${event.reason}`),
      { type: 'unhandled_promise_rejection' }
    );
  });

  // Handle global errors
  window.addEventListener('error', (event) => {
    errorReportingService.captureException(event.error, {
      type: 'global_error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });
}

export default errorReportingService; 