import React, { useState, useEffect, useCallback } from 'react';
import {
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  FireIcon,
  CpuChipIcon,
  SignalIcon,
  EyeIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import cacheService from '../../services/cacheService';
import { useBreakpoint, darkModeClasses, colors, spacing } from '../../design-system';
import { LoadingState, Skeleton } from '../../design-system/loading-states';

const PerformanceDashboard = () => {
  const { isMobile, isTablet, isDesktop } = useBreakpoint();

  const [performanceData, setPerformanceData] = useState({
    pageLoadTime: 0,
    bundleSize: 0,
    cacheStats: {},
    errorRate: 0,
    firestoreMetrics: {},
    userInteractions: 0,
    networkLatency: 0
  });

  const [realTimeMetrics, setRealTimeMetrics] = useState([]);
  const [errors, setErrors] = useState([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');

  /**
   * Initialize performance monitoring
   */
  useEffect(() => {
    initializePerformanceMonitoring();
    setupErrorTracking();
    startRealTimeMonitoring();

    return () => {
      stopRealTimeMonitoring();
    };
  }, []);

  /**
   * Initialize core performance metrics
   */
  const initializePerformanceMonitoring = () => {
    // Measure initial page load performance
    if (window.performance && window.performance.navigation) {
      const loadTime = window.performance.timing.loadEventEnd - 
                      window.performance.timing.navigationStart;
      
      setPerformanceData(prev => ({
        ...prev,
        pageLoadTime: loadTime
      }));
    }

    // Get bundle size information
    if (window.performance && window.performance.getEntriesByType) {
      const resources = window.performance.getEntriesByType('resource');
      const jsResources = resources.filter(r => r.name.includes('.js'));
      const totalBundleSize = jsResources.reduce((total, resource) => {
        return total + (resource.transferSize || 0);
      }, 0);

      setPerformanceData(prev => ({
        ...prev,
        bundleSize: totalBundleSize
      }));
    }

    // Get cache statistics
    const cacheStats = cacheService.getStats();
    setPerformanceData(prev => ({
      ...prev,
      cacheStats
    }));
  };

  /**
   * Setup global error tracking
   */
  const setupErrorTracking = () => {
    const handleError = (event) => {
      const error = {
        id: Date.now(),
        message: event.error?.message || event.message,
        stack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: new Date(),
        type: 'javascript',
        userAgent: navigator.userAgent
      };

      setErrors(prev => [error, ...prev.slice(0, 49)]); // Keep last 50 errors
      
      // Update error rate
      setPerformanceData(prev => ({
        ...prev,
        errorRate: prev.errorRate + 1
      }));

      // Send to analytics
      if (window.gtag) {
        window.gtag('event', 'javascript_error', {
          error_message: error.message,
          error_filename: error.filename
        });
      }
    };

    const handleUnhandledRejection = (event) => {
      const error = {
        id: Date.now(),
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack,
        timestamp: new Date(),
        type: 'promise_rejection'
      };

      setErrors(prev => [error, ...prev.slice(0, 49)]);
      setPerformanceData(prev => ({
        ...prev,
        errorRate: prev.errorRate + 1
      }));
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  };

  /**
   * Start real-time monitoring
   */
  const startRealTimeMonitoring = () => {
    setIsMonitoring(true);

    const monitoringInterval = setInterval(() => {
      collectRealTimeMetrics();
    }, 5000); // Collect metrics every 5 seconds

    return () => {
      clearInterval(monitoringInterval);
      setIsMonitoring(false);
    };
  };

  /**
   * Stop real-time monitoring
   */
  const stopRealTimeMonitoring = () => {
    setIsMonitoring(false);
  };

  /**
   * Collect real-time performance metrics
   */
  const collectRealTimeMetrics = useCallback(() => {
    const timestamp = new Date();
    
    // Memory usage (if available)
    let memoryUsage = 0;
    if (window.performance && window.performance.memory) {
      memoryUsage = window.performance.memory.usedJSHeapSize;
    }

    // Network latency (approximate using resource timing)
    let networkLatency = 0;
    if (window.performance && window.performance.getEntriesByType) {
      const navigationEntries = window.performance.getEntriesByType('navigation');
      if (navigationEntries.length > 0) {
        const entry = navigationEntries[0];
        networkLatency = entry.responseEnd - entry.requestStart;
      }
    }

    // Cache performance
    const cacheStats = cacheService.getStats();

    // DOM node count
    const domNodeCount = document.querySelectorAll('*').length;

    const metric = {
      timestamp,
      memoryUsage,
      networkLatency,
      domNodeCount,
      cacheHitRate: parseFloat(cacheStats.hitRate) || 0,
      activeRequests: 0 // This would be tracked by intercepting fetch/axios requests
    };

    setRealTimeMetrics(prev => {
      const updated = [metric, ...prev.slice(0, 119)]; // Keep last 2 minutes of data
      return updated;
    });

    // Update performance data
    setPerformanceData(prev => ({
      ...prev,
      networkLatency,
      cacheStats,
      memoryUsage,
      domNodeCount
    }));
  }, []);

  /**
   * Format bytes to human readable format
   */
  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  /**
   * Format time to human readable format
   */
  const formatTime = (ms) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  /**
   * Get performance status color using design tokens
   */
  const getPerformanceColor = (metric, value) => {
    const thresholds = {
      pageLoadTime: { good: 3000, poor: 5000 },
      cacheHitRate: { good: 80, poor: 60 },
      errorRate: { good: 0, poor: 5 },
      memoryUsage: { good: 50 * 1024 * 1024, poor: 100 * 1024 * 1024 }
    };

    const threshold = thresholds[metric];
    if (!threshold) return darkModeClasses.text.muted;

    if (metric === 'errorRate') {
      if (value <= threshold.good) return darkModeClasses.text.success;
      if (value <= threshold.poor) return darkModeClasses.text.warning;
      return darkModeClasses.text.error;
    } else if (metric === 'cacheHitRate') {
      if (value >= threshold.good) return darkModeClasses.text.success;
      if (value >= threshold.poor) return darkModeClasses.text.warning;
      return darkModeClasses.text.error;
    } else {
      if (value <= threshold.good) return darkModeClasses.text.success;
      if (value <= threshold.poor) return darkModeClasses.text.warning;
      return darkModeClasses.text.error;
    }
  };

  // Responsive grid columns
  const getGridCols = () => {
    if (isMobile) return 'grid-cols-1';
    if (isTablet) return 'grid-cols-2';
    return 'grid-cols-4';
  };

  const getDetailGridCols = () => {
    if (isMobile) return 'grid-cols-1';
    return 'grid-cols-2';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`flex ${isMobile ? 'flex-col space-y-4' : 'flex-row justify-between items-center'}`}>
        <div>
          <h2 className={`text-2xl font-bold ${darkModeClasses.text.primary}`}>Performance Dashboard</h2>
          <p className={darkModeClasses.text.secondary}>Real-time application performance monitoring</p>
        </div>
        
        <div className={`flex items-center ${isMobile ? 'flex-col space-y-2' : 'space-x-4'}`}>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isMonitoring ? darkModeClasses.badge.success.split(' ')[0] : darkModeClasses.badge.error.split(' ')[0]}`}></div>
            <span className={`text-sm ${darkModeClasses.text.secondary}`}>
              {isMonitoring ? 'Monitoring Active' : 'Monitoring Inactive'}
            </span>
          </div>
          
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className={`px-3 py-1 text-sm rounded-md ${darkModeClasses.input.base} ${darkModeClasses.border.default}`}
          >
            <option value="5m">Last 5 minutes</option>
            <option value="15m">Last 15 minutes</option>
            <option value="1h">Last hour</option>
            <option value="24h">Last 24 hours</option>
          </select>
        </div>
      </div>

      {/* Core Metrics - Responsive Grid */}
      <div className={`grid ${getGridCols()} gap-4`}>
        <div className={`${darkModeClasses.card.base} p-6 rounded-lg shadow ${darkModeClasses.border.default}`}>
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${darkModeClasses.badge.primary}`}>
              <ClockIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className={`text-sm font-medium ${darkModeClasses.text.secondary}`}>Page Load Time</p>
              <p className={`text-2xl font-bold ${getPerformanceColor('pageLoadTime', performanceData.pageLoadTime)}`}>
                {formatTime(performanceData.pageLoadTime)}
              </p>
            </div>
          </div>
        </div>

        <div className={`${darkModeClasses.card.base} p-6 rounded-lg shadow ${darkModeClasses.border.default}`}>
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${darkModeClasses.badge.success}`}>
              <ChartBarIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className={`text-sm font-medium ${darkModeClasses.text.secondary}`}>Cache Hit Rate</p>
              <p className={`text-2xl font-bold ${getPerformanceColor('cacheHitRate', parseFloat(performanceData.cacheStats.hitRate))}`}>
                {performanceData.cacheStats.hitRate || 0}%
              </p>
            </div>
          </div>
        </div>

        <div className={`${darkModeClasses.card.base} p-6 rounded-lg shadow ${darkModeClasses.border.default}`}>
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${darkModeClasses.badge.error}`}>
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className={`text-sm font-medium ${darkModeClasses.text.secondary}`}>Error Count</p>
              <p className={`text-2xl font-bold ${getPerformanceColor('errorRate', performanceData.errorRate)}`}>
                {performanceData.errorRate}
              </p>
            </div>
          </div>
        </div>

        <div className={`${darkModeClasses.card.base} p-6 rounded-lg shadow ${darkModeClasses.border.default}`}>
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${darkModeClasses.badge.warning}`}>
              <CpuChipIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className={`text-sm font-medium ${darkModeClasses.text.secondary}`}>Memory Usage</p>
              <p className={`text-2xl font-bold ${getPerformanceColor('memoryUsage', performanceData.memoryUsage)}`}>
                {formatBytes(performanceData.memoryUsage)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Metrics - Responsive Layout */}
      <div className={`grid ${getDetailGridCols()} gap-6`}>
        {/* Real-time Chart */}
        <div className={`${darkModeClasses.card.base} rounded-lg shadow p-6`}>
          <h3 className={`text-lg font-semibold mb-4 ${darkModeClasses.text.primary}`}>Real-time Performance</h3>
          
          <LoadingState
            loading={realTimeMetrics.length === 0}
            loader={<Skeleton height="12rem" />}
          >
            <div className="space-y-4">
              <div className={`h-48 ${darkModeClasses.bg.secondary} rounded flex items-center justify-center`}>
                <div className="text-center">
                  <ChartBarIcon className={`w-12 h-12 ${darkModeClasses.text.muted} mx-auto mb-2`} />
                  <p className={darkModeClasses.text.muted}>Chart visualization would go here</p>
                  <p className={`text-sm ${darkModeClasses.text.tertiary} mt-2`}>
                    {realTimeMetrics.length} data points collected
                  </p>
                </div>
              </div>
              
              <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4 text-sm`}>
                <div>
                  <span className={darkModeClasses.text.secondary}>Network Latency:</span>
                  <span className={`ml-2 font-medium ${darkModeClasses.text.primary}`}>{formatTime(performanceData.networkLatency)}</span>
                </div>
                <div>
                  <span className={darkModeClasses.text.secondary}>DOM Nodes:</span>
                  <span className={`ml-2 font-medium ${darkModeClasses.text.primary}`}>{performanceData.domNodeCount?.toLocaleString()}</span>
                </div>
                <div>
                  <span className={darkModeClasses.text.secondary}>Bundle Size:</span>
                  <span className={`ml-2 font-medium ${darkModeClasses.text.primary}`}>{formatBytes(performanceData.bundleSize)}</span>
                </div>
                <div>
                  <span className={darkModeClasses.text.secondary}>Cache Size:</span>
                  <span className={`ml-2 font-medium ${darkModeClasses.text.primary}`}>{performanceData.cacheStats.memorySize || 0} items</span>
                </div>
              </div>
            </div>
          </LoadingState>
        </div>

        {/* Error Log */}
        <div className={`${darkModeClasses.card.base} rounded-lg shadow p-6`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-lg font-semibold ${darkModeClasses.text.primary}`}>Recent Errors</h3>
            <span className={`text-sm ${darkModeClasses.text.muted}`}>{errors.length} total</span>
          </div>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {errors.length > 0 ? (
              errors.slice(0, 10).map((error) => (
                <div key={error.id} className={`p-3 rounded-lg border ${darkModeClasses.badge.error}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${darkModeClasses.text.error}`}>{error.message}</p>
                      <p className={`text-xs mt-1 ${darkModeClasses.text.error}`}>
                        {error.filename}:{error.lineno}
                      </p>
                    </div>
                    <span className={`text-xs ${darkModeClasses.text.tertiary}`}>
                      {error.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <ExclamationTriangleIcon className={`w-8 h-8 ${darkModeClasses.text.muted} mx-auto mb-2`} />
                <p className={darkModeClasses.text.muted}>No errors detected</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cache Analytics - Responsive Grid */}
      <div className={`${darkModeClasses.card.base} rounded-lg shadow p-6`}>
        <h3 className={`text-lg font-semibold mb-4 ${darkModeClasses.text.primary}`}>Cache Performance</h3>
        
        <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-4'} gap-4`}>
          <div className={`text-center p-4 rounded-lg ${darkModeClasses.badge.success}`}>
            <div className={`text-2xl font-bold ${darkModeClasses.text.success}`}>
              {performanceData.cacheStats.hits || 0}
            </div>
            <div className={`text-sm ${darkModeClasses.text.success}`}>Cache Hits</div>
          </div>
          
          <div className={`text-center p-4 rounded-lg ${darkModeClasses.badge.error}`}>
            <div className={`text-2xl font-bold ${darkModeClasses.text.error}`}>
              {performanceData.cacheStats.misses || 0}
            </div>
            <div className={`text-sm ${darkModeClasses.text.error}`}>Cache Misses</div>
          </div>
          
          <div className={`text-center p-4 rounded-lg ${darkModeClasses.badge.primary}`}>
            <div className={`text-2xl font-bold text-blue-600 dark:text-blue-300`}>
              {performanceData.cacheStats.avgResponseTime || 0}ms
            </div>
            <div className={`text-sm text-blue-800 dark:text-blue-300`}>Avg Response Time</div>
          </div>
          
          <div className={`text-center p-4 rounded-lg ${darkModeClasses.badge.warning}`}>
            <div className={`text-2xl font-bold text-purple-600 dark:text-purple-300`}>
              {performanceData.cacheStats.memorySize || 0}/{performanceData.cacheStats.memoryLimit || 0}
            </div>
            <div className={`text-sm text-purple-800 dark:text-purple-300`}>Memory Usage</div>
          </div>
        </div>
      </div>

      {/* Performance Recommendations */}
      <div className={`${darkModeClasses.card.base} rounded-lg shadow p-6`}>
        <h3 className={`text-lg font-semibold mb-4 ${darkModeClasses.text.primary}`}>Performance Recommendations</h3>
        
        <div className="space-y-3">
          {performanceData.pageLoadTime > 3000 && (
            <div className={`flex items-start space-x-3 p-3 rounded-lg ${darkModeClasses.badge.warning}`}>
              <ExclamationTriangleIcon className={`w-5 h-5 mt-0.5 ${darkModeClasses.text.warning}`} />
              <div>
                <p className={`text-sm font-medium ${darkModeClasses.text.warning}`}>Slow Page Load</p>
                <p className={`text-xs ${darkModeClasses.text.warning}`}>
                  Consider implementing more aggressive code splitting or optimizing bundle size.
                </p>
              </div>
            </div>
          )}
          
          {parseFloat(performanceData.cacheStats.hitRate) < 70 && (
            <div className={`flex items-start space-x-3 p-3 rounded-lg ${darkModeClasses.badge.primary}`}>
              <SignalIcon className={`w-5 h-5 mt-0.5 text-blue-600 dark:text-blue-400`} />
              <div>
                <p className={`text-sm font-medium text-blue-800 dark:text-blue-200`}>Low Cache Hit Rate</p>
                <p className={`text-xs text-blue-700 dark:text-blue-300`}>
                  Consider adjusting cache TTL values or improving cache key strategies.
                </p>
              </div>
            </div>
          )}
          
          {performanceData.errorRate > 0 && (
            <div className={`flex items-start space-x-3 p-3 rounded-lg ${darkModeClasses.badge.error}`}>
              <ExclamationTriangleIcon className={`w-5 h-5 mt-0.5 ${darkModeClasses.text.error}`} />
              <div>
                <p className={`text-sm font-medium ${darkModeClasses.text.error}`}>Errors Detected</p>
                <p className={`text-xs ${darkModeClasses.text.error}`}>
                  Review error log and implement proper error boundaries and handling.
                </p>
              </div>
            </div>
          )}
          
          {performanceData.domNodeCount > 1500 && (
            <div className={`flex items-start space-x-3 p-3 rounded-lg ${darkModeClasses.badge.warning}`}>
              <CpuChipIcon className={`w-5 h-5 mt-0.5 text-purple-600 dark:text-purple-400`} />
              <div>
                <p className={`text-sm font-medium text-purple-800 dark:text-purple-200`}>High DOM Complexity</p>
                <p className={`text-xs text-purple-700 dark:text-purple-300`}>
                  Consider virtualizing large lists or reducing DOM node count for better performance.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
  };

export default PerformanceDashboard; 