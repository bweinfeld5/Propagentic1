import React, { useState, useEffect } from 'react';
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ChartBarIcon,
  ArrowPathIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import Button from '../ui/Button';
import errorReportingService from '../../services/errorReportingService';

interface ErrorSummary {
  id: string;
  message: string;
  type: string;
  count: number;
  firstOccurred: string;
  lastOccurred: string;
  severity: string;
  affectedUsers: number;
}

interface SystemMetrics {
  totalErrors: number;
  errorRate: number;
  resolvedErrors: number;
  criticalErrors: number;
  memoryUsage?: {
    used: number;
    total: number;
    limit: number;
  };
}

/**
 * Admin dashboard for monitoring application errors and system health
 * Provides insights into error patterns, frequencies, and system performance
 */
const ErrorMonitoringDashboard: React.FC = () => {
  const [errors, setErrors] = useState<ErrorSummary[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [timeFilter, setTimeFilter] = useState('24h');

  /**
   * Load error data from the error reporting service
   */
  const loadErrorData = async () => {
    try {
      setLoading(true);
      
      // Get local errors for demo purposes
      const localErrors = errorReportingService.getLocalErrors();
      
      // Group errors by type and message
      const errorGroups = new Map<string, ErrorSummary>();
      
             localErrors.forEach((error: any, index: number) => {
        const key = `${error.type}-${error.error?.message || 'Unknown'}`;
        const existing = errorGroups.get(key);
        
        if (existing) {
          existing.count++;
          existing.lastOccurred = error.timestamp;
        } else {
          errorGroups.set(key, {
            id: key,
            message: error.error?.message || 'Unknown error',
            type: error.type || 'unknown',
            count: 1,
            firstOccurred: error.timestamp,
            lastOccurred: error.timestamp,
            severity: error.severity || 'error',
            affectedUsers: error.userInfo?.userId ? 1 : 0
          });
        }
      });
      
      const errorSummaries = Array.from(errorGroups.values())
        .sort((a, b) => b.count - a.count);
      
      setErrors(errorSummaries);
      
      // Calculate metrics
      const totalErrors = localErrors.length;
             const criticalErrors = localErrors.filter((e: any) => e.severity === 'error').length;
      const resolvedErrors = 0; // Would come from actual resolution tracking
      
             // Get memory info if available
       const memoryInfo = (performance as any).memory ? {
         used: (performance as any).memory.usedJSHeapSize,
         total: (performance as any).memory.totalJSHeapSize,
         limit: (performance as any).memory.jsHeapSizeLimit
       } : undefined;
      
      setMetrics({
        totalErrors,
        errorRate: totalErrors / 24, // errors per hour (rough estimate)
        resolvedErrors,
        criticalErrors,
        memoryUsage: memoryInfo
      });
      
    } catch (error) {
      console.error('Failed to load error data:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clear all stored errors
   */
  const clearErrors = async () => {
    if (window.confirm('Are you sure you want to clear all error data?')) {
      errorReportingService.clearLocalErrors();
      await loadErrorData();
    }
  };

  /**
   * Toggle auto-refresh
   */
  const toggleAutoRefresh = () => {
    if (autoRefresh) {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
      setAutoRefresh(false);
    } else {
      const interval = setInterval(loadErrorData, 30000); // Refresh every 30 seconds
      setRefreshInterval(interval);
      setAutoRefresh(true);
    }
  };

  /**
   * Get severity color
   */
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'text-red-600 bg-red-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'info': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  /**
   * Format time ago
   */
  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  /**
   * Format memory size
   */
  const formatMemorySize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  useEffect(() => {
    loadErrorData();
    
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [timeFilter]);

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2 text-gray-600">Loading error data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Error Monitoring Dashboard</h1>
          <p className="text-gray-600">Monitor application errors and system health</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          
          <Button
            onClick={toggleAutoRefresh}
            variant={autoRefresh ? "primary" : "secondary"}
            size="sm"
          >
            <ArrowPathIcon className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-Refresh On' : 'Auto-Refresh Off'}
          </Button>
          
          <Button onClick={loadErrorData} variant="outline" size="sm">
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Errors</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalErrors}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <ChartBarIcon className="w-8 h-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Error Rate</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.errorRate.toFixed(1)}/hr</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Critical Errors</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.criticalErrors}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <CheckCircleIcon className="w-8 h-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.resolvedErrors}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Memory Usage */}
      {metrics?.memoryUsage && (
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-4">Memory Usage</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Used</p>
              <p className="text-lg font-bold">{formatMemorySize(metrics.memoryUsage.used)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-lg font-bold">{formatMemorySize(metrics.memoryUsage.total)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Limit</p>
              <p className="text-lg font-bold">{formatMemorySize(metrics.memoryUsage.limit)}</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${(metrics.memoryUsage.used / metrics.memoryUsage.limit) * 100}%` 
                }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Error List */}
      <div className="bg-white rounded-lg shadow border">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold">Recent Errors</h3>
          {errors.length > 0 && (
            <Button onClick={clearErrors} variant="outline" size="sm">
              <TrashIcon className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>
        
        {errors.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No Errors Found</h3>
            <p className="mt-1 text-sm text-gray-500">Great! No errors have been recorded recently.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {errors.map((error) => (
              <div key={error.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(error.severity)}`}>
                        {error.severity}
                      </span>
                      <span className="text-sm font-medium text-gray-900">{error.type}</span>
                      <span className="text-sm text-gray-500">×{error.count}</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-700 truncate">{error.message}</p>
                    <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                      <span className="flex items-center">
                        <ClockIcon className="w-3 h-3 mr-1" />
                        First: {formatTimeAgo(error.firstOccurred)}
                      </span>
                      <span className="flex items-center">
                        <ClockIcon className="w-3 h-3 mr-1" />
                        Last: {formatTimeAgo(error.lastOccurred)}
                      </span>
                      {error.affectedUsers > 0 && (
                        <span>Users affected: {error.affectedUsers}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorMonitoringDashboard; 