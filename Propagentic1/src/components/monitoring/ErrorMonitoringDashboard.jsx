import React, { useState, useEffect, useCallback } from 'react';
import {
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  SignalIcon,
  BellIcon,
  ChartBarIcon,
  ClockIcon,
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  FireIcon
} from '@heroicons/react/24/outline';
import Button from '../ui/Button';
import { useWebVitals } from '../../hooks/useWebVitals';
import errorReportingService from '../../services/errorReportingService';
import uptimeMonitoringService from '../../services/uptimeMonitoringService';
import { useBreakpoint, darkModeClasses } from '../../design-system';
import { LoadingState, Skeleton } from '../../design-system/loading-states';

const ErrorMonitoringDashboard = () => {
  const [errorStats, setErrorStats] = useState({});
  const [uptimeStats, setUptimeStats] = useState({});
  const [recentErrors, setRecentErrors] = useState([]);
  const [systemStatus, setSystemStatus] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [showAlertDetails, setShowAlertDetails] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Web Vitals monitoring
  const {
    vitals,
    userExperience,
    interactionMetrics,
    performanceScore,
    recommendations
  } = useWebVitals({
    enableRealTimeReporting: true,
    onReport: handleWebVitalsReport
  });

  // Responsive breakpoint
  const { isMobile, isTablet, isDesktop } = useBreakpoint();

  /**
   * Initialize monitoring dashboard
   */
  useEffect(() => {
    loadDashboardData();
    setupAlertListeners();

    // Refresh data every 30 seconds
    const refreshInterval = setInterval(loadDashboardData, 30000);

    return () => {
      clearInterval(refreshInterval);
      cleanup();
    };
  }, [selectedTimeRange]);

  /**
   * Load all dashboard data
   */
  const loadDashboardData = useCallback(async () => {
    try {
      // Load error statistics
      const errorData = errorReportingService.getErrorStats();
      setErrorStats(errorData);

      // Load recent errors
      const errors = errorReportingService.getLocalErrors().slice(-20);
      setRecentErrors(errors);

      // Load uptime statistics
      const uptimeData = uptimeMonitoringService.getStats();
      setUptimeStats(uptimeData);

      // Get current system status
      const status = uptimeMonitoringService.getCurrentStatus();
      setSystemStatus(status);

      // Load recent alerts
      const recentAlerts = uptimeMonitoringService.getRecentAlerts(10);
      setAlerts(recentAlerts);

      console.log('[ErrorMonitoring] Dashboard data loaded');
    } catch (error) {
      console.error('[ErrorMonitoring] Failed to load dashboard data:', error);
    }
  }, [selectedTimeRange]);

  /**
   * Setup alert listeners
   */
  const setupAlertListeners = useCallback(() => {
    const handleAlert = (alertData) => {
      setAlerts(prev => [alertData, ...prev.slice(0, 9)]);
      
      // Show browser notification for critical alerts
      if (alertData.critical && 'Notification' in window) {
        new Notification(`Critical Alert: ${alertData.type}`, {
          body: alertData.message || `Service ${alertData.serviceName} is down`,
          icon: '/favicon.ico'
        });
      }
    };

    uptimeMonitoringService.addAlertCallback(handleAlert);

    return () => {
      uptimeMonitoringService.removeAlertCallback(handleAlert);
    };
  }, []);

  /**
   * Handle Web Vitals reports
   */
  function handleWebVitalsReport(metricName, data) {
    console.log(`[ErrorMonitoring] Web Vital reported: ${metricName}`, data);
    
    // You could store these in state or send to analytics
    if (data.rating === 'poor') {
      // Automatically create an alert for poor performance
      const alert = {
        type: 'performance_poor',
        message: `${metricName} performance is poor: ${data.value}`,
        timestamp: new Date().toISOString(),
        critical: false,
        metric: metricName,
        value: data.value,
        rating: data.rating
      };
      
      setAlerts(prev => [alert, ...prev.slice(0, 9)]);
    }
  }

  /**
   * Refresh all data manually
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadDashboardData();
      // Trigger a new health check
      await uptimeMonitoringService.runHealthCheck();
    } catch (error) {
      console.error('[ErrorMonitoring] Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  /**
   * Clear error history
   */
  const handleClearErrors = () => {
    errorReportingService.clearLocalErrors();
    setRecentErrors([]);
  };

  /**
   * Dismiss alert
   */
  const dismissAlert = (alertIndex) => {
    setAlerts(prev => prev.filter((_, index) => index !== alertIndex));
  };

  /**
   * Get status color based on system health using design tokens
   */
  const getStatusColor = (status) => {
    switch (status) {
      case 'operational': return darkModeClasses.text.success;
      case 'degraded': return darkModeClasses.text.warning;
      case 'critical': return darkModeClasses.text.error;
      default: return darkModeClasses.text.muted;
    }
  };

  /**
   * Get status icon
   */
  const getStatusIcon = (status) => {
    switch (status) {
      case 'operational': return CheckCircleIcon;
      case 'degraded': return ExclamationCircleIcon;
      case 'critical': return XCircleIcon;
      default: return ExclamationTriangleIcon;
    }
  };

  /**
   * Format uptime percentage
   */
  const formatUptime = (uptime) => {
    return `${uptime?.toFixed(2) || 0}%`;
  };

  /**
   * Format time ago
   */
  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  /**
   * Get alert priority color using design tokens
   */
  const getAlertPriorityColor = (alert) => {
    if (alert.critical) return `border-red-500 ${darkModeClasses.badge.error}`;
    if (alert.type?.includes('warning')) return `border-yellow-500 ${darkModeClasses.badge.warning}`;
    return `border-blue-500 ${darkModeClasses.badge.primary}`;
  };

  // Responsive grid columns
  const getGridCols = () => {
    if (isMobile) return 'grid-cols-1';
    if (isTablet) return 'grid-cols-2';
    return 'grid-cols-4';
  };

  const getServiceGridCols = () => {
    if (isMobile) return 'grid-cols-1';
    if (isTablet) return 'grid-cols-2';
    return 'grid-cols-3';
  };

  const getDetailGridCols = () => {
    if (isMobile) return 'grid-cols-1';
    return 'grid-cols-2';
  };

  /**
   * Cleanup function
   */
  const cleanup = useCallback(() => {
    // Any cleanup needed
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`flex ${isMobile ? 'flex-col space-y-4' : 'flex-row justify-between items-center'}`}>
        <div>
          <h2 className={`text-2xl font-bold ${darkModeClasses.text.primary}`}>Error & Monitoring Dashboard</h2>
          <p className={darkModeClasses.text.secondary}>Real-time system health, errors, and performance monitoring</p>
        </div>
        
        <div className={`flex items-center ${isMobile ? 'flex-col space-y-2' : 'space-x-4'}`}>
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className={`px-3 py-1 text-sm rounded-md ${darkModeClasses.input.base} ${darkModeClasses.border.default}`}
          >
            <option value="1h">Last hour</option>
            <option value="6h">Last 6 hours</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
          </select>
          
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={refreshing}
          >
            <ArrowPathIcon className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Status Overview - Responsive Grid */}
      <div className={`grid ${getGridCols()} gap-4`}>
        <div className={`${darkModeClasses.card.base} p-6 rounded-lg shadow ${darkModeClasses.border.default}`}>
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${
              systemStatus?.overall === 'operational' ? darkModeClasses.badge.success :
              systemStatus?.overall === 'degraded' ? darkModeClasses.badge.warning :
              darkModeClasses.badge.error
            }`}>
              {React.createElement(getStatusIcon(systemStatus?.overall), {
                className: `w-6 h-6 ${
                  systemStatus?.overall === 'operational' ? darkModeClasses.text.success :
                  systemStatus?.overall === 'degraded' ? darkModeClasses.text.warning :
                  darkModeClasses.text.error
                }`
              })}
            </div>
            <div className="ml-4">
              <p className={`text-sm font-medium ${darkModeClasses.text.secondary}`}>System Status</p>
              <p className={`text-lg font-bold capitalize ${getStatusColor(systemStatus?.overall)}`}>
                {systemStatus?.overall || 'Unknown'}
              </p>
            </div>
          </div>
        </div>

        <div className={`${darkModeClasses.card.base} p-6 rounded-lg shadow ${darkModeClasses.border.default}`}>
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${darkModeClasses.badge.primary}`}>
              <SignalIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className={`text-sm font-medium ${darkModeClasses.text.secondary}`}>Uptime</p>
              <p className={`text-lg font-bold text-blue-900 dark:text-blue-100`}>
                {formatUptime(uptimeStats.uptime)}
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
              <p className={`text-sm font-medium ${darkModeClasses.text.secondary}`}>Error Rate</p>
              <p className={`text-lg font-bold text-red-900 dark:text-red-100`}>
                {errorStats.errorFrequency?.toFixed(1) || 0}/hr
              </p>
            </div>
          </div>
        </div>

        <div className={`${darkModeClasses.card.base} p-6 rounded-lg shadow ${darkModeClasses.border.default}`}>
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${darkModeClasses.badge.warning}`}>
              <ChartBarIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className={`text-sm font-medium ${darkModeClasses.text.secondary}`}>Performance Score</p>
              <p className={`text-lg font-bold text-purple-900 dark:text-purple-100`}>
                {performanceScore}/100
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div className={`${darkModeClasses.card.base} rounded-lg shadow p-6`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-lg font-semibold flex items-center ${darkModeClasses.text.primary}`}>
              <BellIcon className="w-5 h-5 mr-2 text-red-500 dark:text-red-400" />
              Active Alerts ({alerts.length})
            </h3>
            <Button
              onClick={() => setShowAlertDetails(!showAlertDetails)}
              variant="outline"
              size="sm"
            >
              {showAlertDetails ? 'Hide Details' : 'Show Details'}
            </Button>
          </div>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {alerts.map((alert, index) => (
              <div key={index} className={`p-3 rounded-lg border ${getAlertPriorityColor(alert)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      {alert.critical && <FireIcon className="w-4 h-4 text-red-500 dark:text-red-400 mr-2" />}
                      <span className={`font-medium ${darkModeClasses.text.primary}`}>
                        {alert.type?.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      {alert.serviceName && (
                        <span className={`ml-2 text-sm ${darkModeClasses.text.secondary}`}>
                          ({alert.serviceName})
                        </span>
                      )}
                    </div>
                    <p className={`text-sm mt-1 ${darkModeClasses.text.secondary}`}>
                      {alert.message || alert.error || 'No message provided'}
                    </p>
                    {showAlertDetails && (
                      <div className={`mt-2 text-xs ${darkModeClasses.text.tertiary}`}>
                        <p>Time: {formatTimeAgo(alert.timestamp)}</p>
                        {alert.consecutiveFailures && (
                          <p>Consecutive failures: {alert.consecutiveFailures}</p>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => dismissAlert(index)}
                    className={`ml-2 ${darkModeClasses.text.muted} hover:${darkModeClasses.text.secondary}`}
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Services Status - Responsive Grid */}
      <div className={`${darkModeClasses.card.base} rounded-lg shadow p-6`}>
        <h3 className={`text-lg font-semibold mb-4 ${darkModeClasses.text.primary}`}>Services Status</h3>
        
        <div className={`grid ${getServiceGridCols()} gap-4`}>
          {uptimeStats.services?.map((service) => {
            const StatusIcon = getStatusIcon(service.currentStatus);
            return (
              <div key={service.id} className={`p-4 rounded-lg ${darkModeClasses.border.default} border`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <StatusIcon className={`w-5 h-5 mr-2 ${
                      service.currentStatus === 'up' ? darkModeClasses.text.success : darkModeClasses.text.error
                    }`} />
                    <div>
                      <p className={`font-medium ${darkModeClasses.text.primary}`}>{service.name}</p>
                      <p className={`text-xs capitalize ${darkModeClasses.text.tertiary}`}>{service.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      service.currentStatus === 'up' 
                        ? darkModeClasses.badge.success
                        : darkModeClasses.badge.error
                    }`}>
                      {service.currentStatus === 'up' ? 'Operational' : 'Down'}
                    </span>
                    {service.critical && (
                      <p className={`text-xs mt-1 ${darkModeClasses.text.warning}`}>Critical</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Errors & Web Vitals - Responsive Layout */}
      <div className={`grid ${getDetailGridCols()} gap-6`}>
        {/* Recent Errors */}
        <div className={`${darkModeClasses.card.base} rounded-lg shadow p-6`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-lg font-semibold ${darkModeClasses.text.primary}`}>Recent Errors</h3>
            <div className="flex space-x-2">
              <span className={`text-sm ${darkModeClasses.text.muted}`}>{recentErrors.length} total</span>
              {recentErrors.length > 0 && (
                <Button
                  onClick={handleClearErrors}
                  variant="outline"
                  size="sm"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
          
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {recentErrors.length > 0 ? (
              recentErrors.slice(0, 10).map((error, index) => (
                <div key={index} className={`p-3 rounded-lg border ${darkModeClasses.badge.error}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${darkModeClasses.text.error}`}>{error.message}</p>
                      <p className={`text-xs mt-1 capitalize ${darkModeClasses.text.error}`}>
                        {error.type?.replace(/_/g, ' ')} • {formatTimeAgo(error.timestamp)}
                      </p>
                      {error.url && (
                        <p className={`text-xs mt-1 truncate ${darkModeClasses.text.secondary}`}>{error.url}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <CheckCircleIcon className={`w-8 h-8 ${darkModeClasses.text.success} mx-auto mb-2`} />
                <p className={darkModeClasses.text.muted}>No recent errors</p>
              </div>
            )}
          </div>
        </div>

        {/* Web Vitals */}
        <div className={`${darkModeClasses.card.base} rounded-lg shadow p-6`}>
          <h3 className={`text-lg font-semibold mb-4 ${darkModeClasses.text.primary}`}>Core Web Vitals</h3>
          
          <div className="space-y-4">
            {[
              { name: 'FCP', label: 'First Contentful Paint', data: vitals.fcp, threshold: 1800 },
              { name: 'LCP', label: 'Largest Contentful Paint', data: vitals.lcp, threshold: 2500 },
              { name: 'FID', label: 'First Input Delay', data: vitals.fid, threshold: 100 },
              { name: 'CLS', label: 'Cumulative Layout Shift', data: vitals.cls, threshold: 0.1 }
            ].map((vital) => (
              <div key={vital.name} className={`flex items-center justify-between p-3 rounded-lg ${darkModeClasses.bg.secondary}`}>
                <div>
                  <p className={`font-medium ${darkModeClasses.text.primary}`}>{vital.label}</p>
                  <p className={`text-sm ${darkModeClasses.text.secondary}`}>{vital.name}</p>
                </div>
                <div className="text-right">
                  {vital.data ? (
                    <>
                      <p className={`font-medium ${darkModeClasses.text.primary}`}>
                        {vital.data.value?.toFixed(vital.name === 'CLS' ? 3 : 0)}
                        {vital.name === 'CLS' ? '' : 'ms'}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        vital.data.rating === 'good' ? darkModeClasses.badge.success :
                        vital.data.rating === 'needs-improvement' ? darkModeClasses.badge.warning :
                        darkModeClasses.badge.error
                      }`}>
                        {vital.data.rating}
                      </span>
                    </>
                  ) : (
                    <p className={`text-sm ${darkModeClasses.text.muted}`}>Not measured</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Performance Recommendations */}
          {recommendations.length > 0 && (
            <div className={`mt-4 pt-4 border-t ${darkModeClasses.border.default}`}>
              <h4 className={`font-medium mb-2 ${darkModeClasses.text.primary}`}>Recommendations</h4>
              <div className="space-y-2">
                {recommendations.slice(0, 3).map((rec, index) => (
                  <div key={index} className={`text-sm p-2 rounded ${darkModeClasses.badge.primary}`}>
                    <span className={`font-medium ${darkModeClasses.text.primary}`}>{rec.type}:</span>{' '}
                    <span className={darkModeClasses.text.secondary}>{rec.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Statistics - Responsive Grid */}
      <div className={`${darkModeClasses.card.base} rounded-lg shadow p-6`}>
        <h3 className={`text-lg font-semibold mb-4 ${darkModeClasses.text.primary}`}>Error Statistics</h3>
        
        <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-4'} gap-4`}>
          <div className={`text-center p-4 rounded-lg ${darkModeClasses.badge.error}`}>
            <div className={`text-2xl font-bold ${darkModeClasses.text.error}`}>
              {errorStats.totalLocalErrors || 0}
            </div>
            <div className={`text-sm ${darkModeClasses.text.error}`}>Total Errors</div>
          </div>
          
          <div className={`text-center p-4 rounded-lg ${darkModeClasses.badge.warning}`}>
            <div className={`text-2xl font-bold ${darkModeClasses.text.warning}`}>
              {errorStats.queuedErrors || 0}
            </div>
            <div className={`text-sm ${darkModeClasses.text.warning}`}>Queued</div>
          </div>
          
          <div className={`text-center p-4 rounded-lg ${darkModeClasses.badge.primary}`}>
            <div className={`text-2xl font-bold text-blue-600 dark:text-blue-300`}>
              {Object.keys(errorStats.errorTypes || {}).length}
            </div>
            <div className={`text-sm text-blue-800 dark:text-blue-300`}>Error Types</div>
          </div>
          
          <div className={`text-center p-4 rounded-lg ${darkModeClasses.badge.success}`}>
            <div className={`text-2xl font-bold ${darkModeClasses.text.success}`}>
              {uptimeStats.totalChecks || 0}
            </div>
            <div className={`text-sm ${darkModeClasses.text.success}`}>Health Checks</div>
          </div>
        </div>

        {/* Error Types Breakdown */}
        {errorStats.errorTypes && Object.keys(errorStats.errorTypes).length > 0 && (
          <div className="mt-6">
            <h4 className={`font-medium mb-3 ${darkModeClasses.text.primary}`}>Error Types Breakdown</h4>
            <div className="space-y-2">
              {Object.entries(errorStats.errorTypes).map(([type, count]) => (
                <div key={type} className={`flex items-center justify-between p-2 rounded ${darkModeClasses.bg.secondary}`}>
                  <span className={`text-sm capitalize ${darkModeClasses.text.secondary}`}>
                    {type.replace(/_/g, ' ')}
                  </span>
                  <span className={`text-sm font-medium ${darkModeClasses.text.primary}`}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorMonitoringDashboard; 