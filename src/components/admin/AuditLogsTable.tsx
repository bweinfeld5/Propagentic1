import React, { useState, useEffect, useCallback } from 'react';
import {
  MagnifyingGlassIcon,
  CalendarIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import Button from '../ui/Button';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  where,
  onSnapshot,
  getDocs,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../firebase/config';

interface AuditLog {
  id: string;
  action: string;
  performedBy: string;
  performedByName?: string;
  targetResource: string;
  targetId: string;
  timestamp: Date;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  result: 'success' | 'failure' | 'partial';
}

interface AuditLogFilters {
  startDate: Date | null;
  endDate: Date | null;
  actionTypes: string[];
  performedBy: string[];
  resultFilter: 'all' | 'success' | 'failure';
  search: string;
}

interface AuditLogsTableProps {
  limit?: number;
  compact?: boolean;
}

const AuditLogsTable: React.FC<AuditLogsTableProps> = ({ 
  limit: maxLimit, 
  compact = false 
}) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = maxLimit || 50;

  const [filters, setFilters] = useState<AuditLogFilters>({
    startDate: null,
    endDate: null,
    actionTypes: [],
    performedBy: [],
    resultFilter: 'all',
    search: ''
  });

  // Sample audit log actions
  const actionTypes = [
    'USER_CREATE',
    'USER_UPDATE', 
    'USER_DELETE',
    'ROLE_UPDATE',
    'STATUS_UPDATE',
    'CONFIG_UPDATE',
    'SYSTEM_ALERT',
    'LOGIN',
    'LOGOUT'
  ];

  const loadAuditLogs = useCallback(async () => {
    setIsLoading(true);

    try {
      let q = query(collection(db, 'auditLogs'));

      // Apply filters
      if (filters.resultFilter !== 'all') {
        q = query(q, where('result', '==', filters.resultFilter));
      }

      if (filters.startDate) {
        q = query(q, where('timestamp', '>=', Timestamp.fromDate(filters.startDate)));
      }

      if (filters.endDate) {
        q = query(q, where('timestamp', '<=', Timestamp.fromDate(filters.endDate)));
      }

      // Apply ordering and pagination
      q = query(q, orderBy('timestamp', 'desc'), limit(pageSize));

      const snapshot = await getDocs(q);
      const auditLogs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date(),
        } as AuditLog;
      });

      setLogs(auditLogs);
      setHasMore(auditLogs.length === pageSize);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading audit logs:', error);
      // Generate sample data for demo purposes
      generateSampleLogs();
      setIsLoading(false);
    }
  }, [filters, pageSize]);

  // Generate sample audit logs for demo
  const generateSampleLogs = () => {
    const sampleLogs: AuditLog[] = [
      {
        id: '1',
        action: 'USER_UPDATE',
        performedBy: 'admin123',
        performedByName: 'John Admin',
        targetResource: 'user',
        targetId: 'user456',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        details: {
          oldRole: 'landlord',
          newRole: 'admin',
          reason: 'Promoted to help with property management',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        result: 'success' as const
      },
      {
        id: '2',
        action: 'USER_DELETE',
        performedBy: 'admin123',
        performedByName: 'John Admin',
        targetResource: 'user',
        targetId: 'user789',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        details: {
          deleteType: 'soft',
          reason: 'Account violation - spam reports',
          userEmail: 'spammer@example.com',
          ipAddress: '192.168.1.100'
        },
        result: 'success' as const
      },
      {
        id: '3',
        action: 'CONFIG_UPDATE',
        performedBy: 'superadmin',
        performedByName: 'Super Admin',
        targetResource: 'system_config',
        targetId: 'maintenance_mode',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        details: {
          section: 'maintenanceMode',
          changes: { enabled: true, message: 'System upgrade in progress' },
          ipAddress: '10.0.0.1'
        },
        result: 'success' as const
      },
      {
        id: '4',
        action: 'USER_CREATE',
        performedBy: 'admin123',
        performedByName: 'John Admin',
        targetResource: 'user',
        targetId: 'user999',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
        details: {
          role: 'contractor',
          inviteMethod: 'email',
          email: 'contractor@example.com',
          ipAddress: '192.168.1.100'
        },
        result: 'success' as const
      },
      {
        id: '5',
        action: 'ROLE_UPDATE',
        performedBy: 'admin123',
        performedByName: 'John Admin',
        targetResource: 'user',
        targetId: 'user111',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        details: {
          oldRole: 'tenant',
          newRole: 'landlord',
          reason: 'User purchased property',
          ipAddress: '192.168.1.100'
        },
        result: 'failure' as const
      }
    ];

    return sampleLogs;
  };

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'USER_CREATE':
      case 'USER_UPDATE':
        return <UserIcon className="w-4 h-4 text-blue-600" />;
      case 'USER_DELETE':
        return <XCircleIcon className="w-4 h-4 text-red-600" />;
      case 'CONFIG_UPDATE':
        return <CheckCircleIcon className="w-4 h-4 text-green-600" />;
      case 'SYSTEM_ALERT':
        return <ExclamationTriangleIcon className="w-4 h-4 text-orange-600" />;
      default:
        return <ClockIcon className="w-4 h-4 text-gray-600" />;
    }
  };

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'success':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Success</span>;
      case 'failure':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Failed</span>;
      case 'partial':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Partial</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Unknown</span>;
    }
  };

  const formatActionName = (action: string) => {
    return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const getTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const exportLogs = () => {
    const csvData = logs.map(log => ({
      'Timestamp': log.timestamp.toISOString(),
      'Action': formatActionName(log.action),
      'Performed By': log.performedByName || log.performedBy,
      'Target': `${log.targetResource}:${log.targetId}`,
      'Result': log.result,
      'Details': JSON.stringify(log.details)
    }));

    const csvContent = "data:text/csv;charset=utf-8," 
      + Object.keys(csvData[0]).join(",") + "\n"
      + csvData.map(row => Object.values(row).map(val => `"${val}"`).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (compact) {
    return (
      <div className="space-y-3">
        {logs.slice(0, maxLimit || 5).map((log) => (
          <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              {getActionIcon(log.action)}
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {formatActionName(log.action)}
                </p>
                <p className="text-xs text-gray-500">
                  by {log.performedByName || log.performedBy} • {getTimeAgo(log.timestamp)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getResultBadge(log.result)}
              <button
                onClick={() => {
                  setSelectedLog(log);
                  setShowDetailsModal(true);
                }}
                className="text-gray-400 hover:text-gray-600"
                title="View Details"
              >
                <EyeIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        
        {logs.length === 0 && (
          <div className="text-center py-6">
            <ClockIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No recent audit logs</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Audit Logs</h2>
          <p className="text-gray-600">Track all administrative actions and system events</p>
        </div>
        
        <Button
          variant="outline"
          onClick={exportLogs}
          className="flex items-center gap-2"
        >
          <ArrowDownTrayIcon className="w-4 h-4" />
          Export Logs
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <select
            value={filters.resultFilter}
            onChange={(e) => setFilters({ ...filters, resultFilter: e.target.value as any })}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="all">All Results</option>
            <option value="success">Success Only</option>
            <option value="failure">Failures Only</option>
          </select>

          <input
            type="date"
            value={filters.startDate?.toISOString().split('T')[0] || ''}
            onChange={(e) => setFilters({ 
              ...filters, 
              startDate: e.target.value ? new Date(e.target.value) : null 
            })}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            placeholder="Start Date"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performed By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Target
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Result
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {getActionIcon(log.action)}
                      <span className="text-sm font-medium text-gray-900">
                        {formatActionName(log.action)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {log.performedByName || log.performedBy}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-500">
                      {log.targetResource}:{log.targetId.slice(0, 8)}...
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-500">
                        {log.timestamp.toLocaleDateString()} {log.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getResultBadge(log.result)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedLog(log);
                        setShowDetailsModal(true);
                      }}
                      className="text-red-600 hover:text-red-900"
                      title="View Details"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="px-6 py-4 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600 mx-auto"></div>
          </div>
        )}

        {/* Empty state */}
        {logs.length === 0 && !isLoading && (
          <div className="px-6 py-12 text-center">
            <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No audit logs found</h3>
            <p className="text-gray-600">No administrative actions have been recorded yet.</p>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedLog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Audit Log Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Action</label>
                  <p className="text-sm text-gray-900">{formatActionName(selectedLog.action)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Result</label>
                  <div className="mt-1">{getResultBadge(selectedLog.result)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Performed By</label>
                  <p className="text-sm text-gray-900">{selectedLog.performedByName || selectedLog.performedBy}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Timestamp</label>
                  <p className="text-sm text-gray-900">
                    {selectedLog.timestamp.toLocaleDateString()} {selectedLog.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Target Resource</label>
                  <p className="text-sm text-gray-900">{selectedLog.targetResource}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Target ID</label>
                  <p className="text-sm text-gray-900 font-mono">{selectedLog.targetId}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Details</label>
                <pre className="mt-1 text-xs bg-gray-50 p-3 rounded-lg overflow-x-auto">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogsTable; 