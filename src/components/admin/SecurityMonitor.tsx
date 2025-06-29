import React, { useState, useEffect } from 'react';
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  GlobeAltIcon,
  UserIcon
} from '@heroicons/react/24/outline';

interface SecurityAlert {
  id: string;
  level: 'info' | 'warning' | 'critical';
  category: 'authentication' | 'data' | 'network' | 'access';
  message: string;
  timestamp: Date;
  details?: Record<string, any>;
  acknowledged: boolean;
  source?: string;
}

interface SecurityMetrics {
  activeUsers: number;
  failedLogins: number;
  suspiciousActivity: number;
  systemHealth: 'good' | 'warning' | 'critical';
}

interface SecurityMonitorProps {
  compact?: boolean;
}

const SecurityMonitor: React.FC<SecurityMonitorProps> = ({ compact = false }) => {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    activeUsers: 0,
    failedLogins: 0,
    suspiciousActivity: 0,
    systemHealth: 'good'
  });

  // Generate sample security data
  useEffect(() => {
    const sampleAlerts: SecurityAlert[] = [
      {
        id: '1',
        level: 'warning',
        category: 'authentication',
        message: 'Multiple failed login attempts from IP 192.168.1.100',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        details: { ip: '192.168.1.100', attempts: 5, user: 'admin@example.com' },
        acknowledged: false,
        source: 'Auth Service'
      },
      {
        id: '2',
        level: 'info',
        category: 'access',
        message: 'New admin user logged in',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        details: { user: 'super.admin@propagentic.com', ip: '10.0.0.1' },
        acknowledged: true,
        source: 'Access Control'
      },
      {
        id: '3',
        level: 'critical',
        category: 'data',
        message: 'Unusual data access pattern detected',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        details: { resource: 'user_database', queries: 150, timeframe: '10min' },
        acknowledged: false,
        source: 'Data Monitor'
      }
    ];

    const sampleMetrics: SecurityMetrics = {
      activeUsers: 42,
      failedLogins: 3,
      suspiciousActivity: 1,
      systemHealth: sampleAlerts.some(a => a.level === 'critical' && !a.acknowledged) ? 'critical' :
                   sampleAlerts.some(a => a.level === 'warning' && !a.acknowledged) ? 'warning' : 'good'
    };

    setAlerts(sampleAlerts);
    setMetrics(sampleMetrics);
  }, []);

  const getAlertIcon = (level: string) => {
    switch (level) {
      case 'critical':
        return <XCircleIcon className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />;
      case 'info':
        return <CheckCircleIcon className="w-5 h-5 text-blue-600" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  const getAlertBadge = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'info':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'authentication':
        return <UserIcon className="w-4 h-4" />;
      case 'network':
        return <GlobeAltIcon className="w-4 h-4" />;
      case 'data':
        return <ShieldCheckIcon className="w-4 h-4" />;
      default:
        return <EyeIcon className="w-4 h-4" />;
    }
  };

  const getTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    return `${diffHours}h ago`;
  };

  if (compact) {
    return (
      <div className="space-y-4">
        {/* System Health Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <ShieldCheckIcon className={`w-5 h-5 ${
              metrics.systemHealth === 'good' ? 'text-green-600' :
              metrics.systemHealth === 'warning' ? 'text-yellow-600' : 'text-red-600'
            }`} />
            <div>
              <p className="text-sm font-medium text-gray-900">System Security</p>
              <p className="text-xs text-gray-500 capitalize">{metrics.systemHealth}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Active Users</p>
            <p className="text-sm font-medium text-gray-900">{metrics.activeUsers}</p>
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="space-y-2">
          {alerts.slice(0, 3).map((alert) => (
            <div key={alert.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
              {getAlertIcon(alert.level)}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 truncate">{alert.message}</p>
                <p className="text-xs text-gray-500">{getTimeAgo(alert.timestamp)}</p>
              </div>
              {!alert.acknowledged && (
                <div className="w-2 h-2 bg-red-500 rounded-full" />
              )}
            </div>
          ))}
        </div>

        {alerts.length === 0 && (
          <div className="text-center py-4">
            <ShieldCheckIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No security alerts</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ShieldCheckIcon className="w-8 h-8 text-red-600" />
          Security Monitor
        </h2>
        <p className="text-gray-600">Monitor system security and threat detection</p>
      </div>

      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">System Health</p>
              <p className={`text-2xl font-bold capitalize ${
                metrics.systemHealth === 'good' ? 'text-green-600' :
                metrics.systemHealth === 'warning' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {metrics.systemHealth}
              </p>
            </div>
            <ShieldCheckIcon className={`w-8 h-8 ${
              metrics.systemHealth === 'good' ? 'text-green-600' :
              metrics.systemHealth === 'warning' ? 'text-yellow-600' : 'text-red-600'
            }`} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-blue-600">{metrics.activeUsers}</p>
            </div>
            <UserIcon className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Failed Logins</p>
              <p className={`text-2xl font-bold ${metrics.failedLogins > 10 ? 'text-red-600' : 'text-gray-900'}`}>
                {metrics.failedLogins}
              </p>
            </div>
            <ExclamationTriangleIcon className={`w-8 h-8 ${
              metrics.failedLogins > 10 ? 'text-red-600' : 'text-gray-400'
            }`} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Suspicious Activity</p>
              <p className={`text-2xl font-bold ${metrics.suspiciousActivity > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {metrics.suspiciousActivity}
              </p>
            </div>
            <EyeIcon className={`w-8 h-8 ${
              metrics.suspiciousActivity > 0 ? 'text-red-600' : 'text-green-600'
            }`} />
          </div>
        </div>
      </div>

      {/* Security Alerts */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Security Alerts</h3>
        </div>

        <div className="divide-y divide-gray-200">
          {alerts.map((alert) => (
            <div key={alert.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {getAlertIcon(alert.level)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getAlertBadge(alert.level)}`}>
                      {alert.level.toUpperCase()}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      {getCategoryIcon(alert.category)}
                      {alert.category}
                    </span>
                    {alert.source && (
                      <span className="text-xs text-gray-400">• {alert.source}</span>
                    )}
                  </div>
                  
                  <p className="text-sm font-medium text-gray-900 mb-1">{alert.message}</p>
                  <p className="text-xs text-gray-500">{getTimeAgo(alert.timestamp)}</p>
                  
                  {alert.details && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                        {JSON.stringify(alert.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
                
                <div className="flex-shrink-0">
                  {alert.acknowledged ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-600" />
                  ) : (
                    <button 
                      className="text-gray-400 hover:text-gray-600"
                      title="Acknowledge Alert"
                    >
                      <EyeIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {alerts.length === 0 && (
          <div className="px-6 py-12 text-center">
            <ShieldCheckIcon className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">All Clear</h3>
            <p className="text-gray-600">No security alerts detected.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityMonitor; 