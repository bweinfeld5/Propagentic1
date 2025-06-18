import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  ChartBarIcon, 
  FunnelIcon, 
  CalendarIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import { 
  ExclamationTriangleIcon as ExclamationTriangleSolid,
  ClockIcon as ClockSolid,
  CheckCircleIcon as CheckCircleSolid
} from '@heroicons/react/24/solid';

import { useAuth } from '../../context/AuthContext';
import { useActionFeedback } from '../../hooks/useActionFeedback';
import { maintenanceService } from '../../services/firestore/maintenanceService';
import { communicationService } from '../../services/firestore/communicationService';
import RequestStatusTracker from '../shared/RequestStatusTracker';
import BulkOperations from '../bulk/BulkOperations';
import MobileTable from '../ui/MobileTable';
import Button from '../ui/Button';
import StatusPill from '../ui/StatusPill';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorBoundary from '../error/ErrorBoundary';
import { MaintenanceRequest, MaintenanceStatus, MaintenancePriority } from '../../models/MaintenanceRequest';

interface DashboardStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
  totalCost: number;
  avgResponseTime: number;
  satisfactionScore: number;
}

interface FilterOptions {
  status: MaintenanceStatus | 'all';
  priority: MaintenancePriority | 'all';
  property: string | 'all';
  contractor: string | 'all';
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  searchTerm: string;
  category: string | 'all';
}

interface MaintenanceDashboardProps {
  className?: string;
}

const MaintenanceDashboard: React.FC<MaintenanceDashboardProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const { showSuccess, showError, showInfo } = useActionFeedback();
  
  // Core state
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
    totalCost: 0,
    avgResponseTime: 0,
    satisfactionScore: 0
  });

  // UI state
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'calendar'>('grid');
  const [refreshing, setRefreshing] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    priority: 'all',
    property: 'all',
    contractor: 'all',
    dateRange: { start: null, end: null },
    searchTerm: '',
    category: 'all'
  });

  // Real-time listener cleanup
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);

  // Properties and contractors for filtering
  const [properties, setProperties] = useState<Array<{ id: string; name: string }>>([]);
  const [contractors, setContractors] = useState<Array<{ id: string; name: string }>>([]);

  // Initialize real-time listeners
  useEffect(() => {
    if (!user?.uid) return;

    const setupListeners = async () => {
      try {
        setLoading(true);
        
        // Set up real-time listener for maintenance requests
        const unsubscribeFn = await maintenanceService.subscribeToLandlordRequests(
          user.uid,
          (updatedRequests) => {
            setRequests(updatedRequests);
            calculateStats(updatedRequests);
          },
          (error) => {
            console.error('Error in maintenance requests listener:', error);
            showError('Failed to sync maintenance requests');
          }
        );
        
        setUnsubscribe(() => unsubscribeFn);
        
        // Load properties and contractors for filtering
        await loadFilterOptions();
        
      } catch (error) {
        console.error('Error setting up maintenance dashboard:', error);
        showError('Failed to load maintenance dashboard');
      } finally {
        setLoading(false);
      }
    };

    setupListeners();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user?.uid, showError]);

  // Load filter options
  const loadFilterOptions = async () => {
    try {
      if (!user?.uid) return;
      
      // Load properties - this would come from your property service
      // For now, using placeholder data
      setProperties([
        { id: 'prop1', name: 'Oak Street Apartments' },
        { id: 'prop2', name: 'Pine View Complex' },
        { id: 'prop3', name: 'Sunset Condos' }
      ]);
      
      // Load contractors - this would come from your contractor service
      setContractors([
        { id: 'cont1', name: 'ABC Plumbing' },
        { id: 'cont2', name: 'Elite HVAC' },
        { id: 'cont3', name: 'Fix-It-Fast Maintenance' }
      ]);
      
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  // Calculate dashboard statistics
  const calculateStats = useCallback((requestList: MaintenanceRequest[]) => {
    const now = new Date();
    const total = requestList.length;
    const pending = requestList.filter(r => r.status === 'pending').length;
    const inProgress = requestList.filter(r => r.status === 'in_progress').length;
    const completed = requestList.filter(r => r.status === 'completed').length;
    
    // Calculate overdue (pending > 24 hours or in_progress > 7 days)
    const overdue = requestList.filter(r => {
      const createdAt = r.createdAt.toDate();
      const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      
      if (r.status === 'pending' && hoursDiff > 24) return true;
      if (r.status === 'in_progress' && hoursDiff > (7 * 24)) return true;
      return false;
    }).length;
    
    // Calculate total cost
    const totalCost = requestList
      .filter(r => r.estimatedCost)
      .reduce((sum, r) => sum + (r.estimatedCost || 0), 0);
    
    // Calculate average response time (hours)
    const completedWithTimes = requestList.filter(r => 
      r.status === 'completed' && r.completedAt
    );
    const avgResponseTime = completedWithTimes.length > 0
      ? completedWithTimes.reduce((sum, r) => {
          const created = r.createdAt.toDate().getTime();
          const completed = r.completedAt!.toDate().getTime();
          return sum + ((completed - created) / (1000 * 60 * 60));
        }, 0) / completedWithTimes.length
      : 0;
    
    // Calculate satisfaction score (placeholder - would come from ratings)
    const satisfactionScore = 4.2; // This would be calculated from actual ratings
    
    setStats({
      total,
      pending,
      inProgress,
      completed,
      overdue,
      totalCost,
      avgResponseTime,
      satisfactionScore
    });
  }, []);

  // Filter requests based on current filters
  const filteredRequests = useMemo(() => {
    return requests.filter(request => {
      // Status filter
      if (filters.status !== 'all' && request.status !== filters.status) {
        return false;
      }
      
      // Priority filter
      if (filters.priority !== 'all' && request.priority !== filters.priority) {
        return false;
      }
      
      // Property filter
      if (filters.property !== 'all' && request.propertyId !== filters.property) {
        return false;
      }
      
      // Contractor filter
      if (filters.contractor !== 'all' && request.contractorId !== filters.contractor) {
        return false;
      }
      
      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesSearch = 
          request.title.toLowerCase().includes(searchLower) ||
          request.description.toLowerCase().includes(searchLower) ||
          request.category?.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }
      
      // Date range filter
      if (filters.dateRange.start || filters.dateRange.end) {
        const requestDate = request.createdAt.toDate();
        
        if (filters.dateRange.start && requestDate < filters.dateRange.start) {
          return false;
        }
        
        if (filters.dateRange.end && requestDate > filters.dateRange.end) {
          return false;
        }
      }
      
      // Category filter
      if (filters.category !== 'all' && request.category !== filters.category) {
        return false;
      }
      
      return true;
    });
  }, [requests, filters]);

  // Handle bulk operations
  const handleBulkOperation = async (operation: string, requestIds: string[], data?: any) => {
    try {
      setRefreshing(true);
      
      switch (operation) {
        case 'updateStatus':
          await maintenanceService.bulkUpdateStatus(requestIds, data.status, user!.uid);
          showSuccess(`Updated ${requestIds.length} requests to ${data.status}`);
          break;
          
        case 'assignContractor':
          await maintenanceService.bulkAssignContractor(requestIds, data.contractorId, user!.uid);
          showSuccess(`Assigned contractor to ${requestIds.length} requests`);
          break;
          
        case 'setPriority':
          await maintenanceService.bulkUpdatePriority(requestIds, data.priority, user!.uid);
          showSuccess(`Updated priority for ${requestIds.length} requests`);
          break;
          
        case 'close':
          await maintenanceService.bulkCloseRequests(requestIds, user!.uid, data.reason);
          showSuccess(`Closed ${requestIds.length} requests`);
          break;
          
        default:
          throw new Error(`Unknown bulk operation: ${operation}`);
      }
      
      setSelectedRequests([]);
      
    } catch (error) {
      console.error('Bulk operation error:', error);
      showError(`Failed to perform bulk operation: ${error}`);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle manual refresh
  const handleRefresh = async () => {
    if (!user?.uid) return;
    
    try {
      setRefreshing(true);
      const freshRequests = await maintenanceService.getLandlordRequests(user.uid);
      setRequests(freshRequests);
      calculateStats(freshRequests);
      showInfo('Dashboard refreshed');
    } catch (error) {
      console.error('Refresh error:', error);
      showError('Failed to refresh dashboard');
    } finally {
      setRefreshing(false);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      status: 'all',
      priority: 'all',
      property: 'all',
      contractor: 'all',
      dateRange: { start: null, end: null },
      searchTerm: '',
      category: 'all'
    });
    showInfo('Filters cleared');
  };

  // Export functionality
  const handleExport = async (format: 'csv' | 'pdf' | 'excel') => {
    try {
      showInfo(`Exporting ${filteredRequests.length} requests as ${format.toUpperCase()}...`);
      
      // This would implement actual export functionality
      // For now, just show success message
      setTimeout(() => {
        showSuccess(`${format.toUpperCase()} export completed`);
      }, 2000);
      
    } catch (error) {
      console.error('Export error:', error);
      showError(`Failed to export as ${format.toUpperCase()}`);
    }
  };

  // Get status icon and color
  const getStatusIcon = (status: MaintenanceStatus) => {
    switch (status) {
      case 'pending':
        return <ClockSolid className="w-5 h-5 text-yellow-500" />;
      case 'in_progress':
        return <ExclamationTriangleSolid className="w-5 h-5 text-blue-500" />;
      case 'completed':
        return <CheckCircleSolid className="w-5 h-5 text-green-500" />;
      case 'cancelled':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  // Get priority color
  const getPriorityColor = (priority: MaintenancePriority) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Loading maintenance dashboard...</span>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className={`space-y-6 ${className}`}>
        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Maintenance Dashboard
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Monitor and manage all maintenance requests across your properties
            </p>
          </div>
          
          <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center"
            >
              {refreshing ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <ChartBarIcon className="w-4 h-4 mr-2" />
              )}
              Refresh
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center"
            >
              <FunnelIcon className="w-4 h-4 mr-2" />
              Filters
            </Button>
            
            <div className="flex border border-gray-300 dark:border-gray-600 rounded-md">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 text-sm font-medium rounded-l-md ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 text-sm font-medium border-l border-gray-300 dark:border-gray-600 ${
                  viewMode === 'table'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-2 text-sm font-medium rounded-r-md border-l border-gray-300 dark:border-gray-600 ${
                  viewMode === 'calendar'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Calendar
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <BuildingOfficeIcon className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Requests</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <ClockIcon className="w-8 h-8 text-yellow-600" />
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
                {stats.overdue > 0 && (
                  <p className="text-sm text-red-600">{stats.overdue} overdue</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <CurrencyDollarIcon className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Cost</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${stats.totalCost.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <UserGroupIcon className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Response</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.avgResponseTime.toFixed(1)}h
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {stats.satisfactionScore.toFixed(1)} ★ rating
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Filters</h3>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Search
                </label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={filters.searchTerm}
                    onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                    placeholder="Search requests..."
                    className="pl-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Priority
                </label>
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value as any }))}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              {/* Property Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Property
                </label>
                <select
                  value={filters.property}
                  onChange={(e) => setFilters(prev => ({ ...prev, property: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
                >
                  <option value="all">All Properties</option>
                  {properties.map(property => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Operations */}
        {selectedRequests.length > 0 && (
          <BulkOperations
            selectedItems={selectedRequests}
            onOperation={handleBulkOperation}
            itemType="maintenance requests"
            operations={[
              { id: 'updateStatus', label: 'Update Status', icon: AdjustmentsHorizontalIcon },
              { id: 'assignContractor', label: 'Assign Contractor', icon: UserGroupIcon },
              { id: 'setPriority', label: 'Set Priority', icon: ExclamationTriangleIcon },
              { id: 'close', label: 'Close Requests', icon: XCircleIcon }
            ]}
            className="border-l-4 border-blue-500"
          />
        )}

        {/* Export Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('csv')}
            className="flex items-center"
          >
            <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('excel')}
            className="flex items-center"
          >
            <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('pdf')}
            className="flex items-center"
          >
            <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>

        {/* Requests Display */}
        {viewMode === 'table' ? (
          <MobileTable
            data={filteredRequests}
            columns={[
              {
                key: 'title',
                label: 'Request',
                render: (request: MaintenanceRequest) => (
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {request.title}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {request.category} • Created {request.createdAt.toDate().toLocaleDateString()}
                    </div>
                  </div>
                )
              },
              {
                key: 'status',
                label: 'Status',
                render: (request: MaintenanceRequest) => (
                  <div className="flex items-center">
                    {getStatusIcon(request.status)}
                    <StatusPill status={request.status} className="ml-2" />
                  </div>
                )
              },
              {
                key: 'priority',
                label: 'Priority',
                render: (request: MaintenanceRequest) => (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(request.priority)}`}>
                    {request.priority}
                  </span>
                )
              },
              {
                key: 'cost',
                label: 'Cost',
                render: (request: MaintenanceRequest) => (
                  <span className="font-medium text-gray-900 dark:text-white">
                    {request.estimatedCost ? `$${request.estimatedCost.toLocaleString()}` : 'N/A'}
                  </span>
                )
              }
            ]}
            onSelectionChange={setSelectedRequests}
            selectable
            className="bg-white dark:bg-gray-800"
          />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRequests.map((request) => (
              <div
                key={request.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => {
                  if (selectedRequests.includes(request.id)) {
                    setSelectedRequests(prev => prev.filter(id => id !== request.id));
                  } else {
                    setSelectedRequests(prev => [...prev, request.id]);
                  }
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    {getStatusIcon(request.status)}
                    <h3 className="ml-2 text-lg font-medium text-gray-900 dark:text-white truncate">
                      {request.title}
                    </h3>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedRequests.includes(request.id)}
                    onChange={() => {}}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
                
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                  {request.description}
                </p>
                
                <div className="flex items-center justify-between mb-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(request.priority)}`}>
                    {request.priority}
                  </span>
                  <StatusPill status={request.status} />
                </div>
                
                <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                  <div>Category: {request.category}</div>
                  <div>Created: {request.createdAt.toDate().toLocaleDateString()}</div>
                  {request.estimatedCost && (
                    <div className="font-medium text-gray-900 dark:text-white">
                      Cost: ${request.estimatedCost.toLocaleString()}
                    </div>
                  )}
                </div>
                
                <div className="mt-4">
                  <RequestStatusTracker
                    requestId={request.id}
                    currentStatus={request.status}
                    compact
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-8">
            <div className="text-center">
              <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Calendar View
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Calendar view will be implemented in a future update
              </p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredRequests.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-8">
            <div className="text-center">
              <BuildingOfficeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No maintenance requests found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {filters.searchTerm || filters.status !== 'all' || filters.priority !== 'all'
                  ? 'Try adjusting your filters to see more requests.'
                  : 'No maintenance requests have been submitted yet.'}
              </p>
              {(filters.searchTerm || filters.status !== 'all' || filters.priority !== 'all') && (
                <Button variant="outline" onClick={clearFilters} className="mt-4">
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default MaintenanceDashboard; 