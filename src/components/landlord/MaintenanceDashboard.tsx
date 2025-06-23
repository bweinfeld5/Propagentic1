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
import { Timestamp } from 'firebase/firestore';

import { useAuth } from '../../context/AuthContext';
import useActionFeedback from '../../hooks/useActionFeedback';
import { maintenanceService } from '../../services/firestore/maintenanceService';
import { communicationService } from '../../services/firestore/communicationService';
import RequestStatusTracker from '../shared/RequestStatusTracker';
import BulkOperations from '../bulk/BulkOperations';
import MobileTable from '../ui/MobileTable';
import Button from '../ui/Button';
import StatusPill from '../ui/StatusPill';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorBoundary from '../error/ErrorBoundary';
import { MaintenanceRequest, MaintenanceStatus, MaintenancePriority, MaintenanceCategory } from '../../models/MaintenanceRequest';

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
  category: MaintenanceCategory | 'all';
}

interface MaintenanceDashboardProps {
  className?: string;
}

const MaintenanceDashboard: React.FC<MaintenanceDashboardProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const { showSuccess, showError, showInfo } = useActionFeedback();
  
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    total: 0, pending: 0, inProgress: 0, completed: 0, overdue: 0,
    totalCost: 0, avgResponseTime: 0, satisfactionScore: 0
  });

  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'calendar'>('grid');

  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all', priority: 'all', property: 'all', contractor: 'all',
    dateRange: { start: null, end: null }, searchTerm: '', category: 'all'
  });

  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);
  
  const [properties, setProperties] = useState<Array<{ id: string; name: string }>>([]);
  const [contractors, setContractors] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    if (!user?.uid) return;

    const setupListeners = async () => {
      try {
        setLoading(true);
        const unsubscribeFn = await maintenanceService.subscribeToLandlordRequests(
          user.uid,
          (updatedRequests: MaintenanceRequest[]) => {
            setRequests(updatedRequests);
            calculateStats(updatedRequests);
          },
          (error: Error) => {
            console.error('Error in maintenance requests listener:', error);
            showError('Failed to sync maintenance requests');
          }
        );
        setUnsubscribe(() => unsubscribeFn);
        await loadFilterOptions();
      } catch (error) {
        console.error('Error setting up dashboard:', error);
        showError('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    setupListeners();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user?.uid, showError]);

  const loadFilterOptions = async () => {
    // In a real app, this would fetch from Firestore
    setProperties([ { id: 'prop1', name: 'Oak Street' } ]);
    setContractors([ { id: 'cont1', name: 'ABC Plumbing' } ]);
  };

  const calculateStats = useCallback((requestList: MaintenanceRequest[]) => {
    const now = new Date();
    const total = requestList.length;
    const pending = requestList.filter(r => r.status === 'pending' || r.status === 'submitted').length;
    
    const inProgressStatuses: MaintenanceStatus[] = ['assigned', 'in-progress', 'scheduled', 'requires_parts', 'pending_approval', 'on-hold'];
    const inProgress = requestList.filter(r => inProgressStatuses.includes(r.status)).length;
    
    const completed = requestList.filter(r => r.status === 'completed').length;
    
    const overdue = requestList.filter(r => {
      const createdAt = (r.createdAt as Timestamp).toDate();
      const hoursDiff = (now.getTime() - createdAt.getTime()) / 3600000;
      if ((r.status === 'pending' || r.status === 'submitted') && hoursDiff > 24) return true;
      if (inProgressStatuses.includes(r.status) && r.scheduledDate && new Date(r.scheduledDate) < now) return true;
      if (inProgressStatuses.includes(r.status) && !r.scheduledDate && hoursDiff > (7 * 24)) return true;
      return false;
    }).length;
    
    const totalCost = requestList.reduce((sum, r) => sum + (r.actualCost || r.estimatedCost || 0), 0);
    
    setStats({
      total, pending, inProgress, completed, overdue, totalCost,
      avgResponseTime: 0, satisfactionScore: 0 // Placeholder
    });
  }, []);

  const filteredRequests = useMemo(() => {
    return requests.filter(request => {
      if (filters.status !== 'all' && request.status !== filters.status) return false;
      if (filters.priority !== 'all' && request.priority !== filters.priority) return false;
      if (filters.property !== 'all' && request.propertyId !== filters.property) return false;
      if (filters.contractor !== 'all' && request.contractorId !== filters.contractor) return false;
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        return request.title.toLowerCase().includes(searchLower) || request.description.toLowerCase().includes(searchLower);
      }
      return true;
    });
  }, [requests, filters]);

  const handleBulkOperation = async (operation: string, selectedIds: string[], data?: any) => {
    try {
      showInfo(`Performing ${operation}...`);
      await maintenanceService.executeBulkOperation(selectedIds, operation as any, data, user!.uid);
      showSuccess('Bulk operation successful');
      setSelectedRequests([]);
    } catch (error) {
      console.error('Bulk operation failed:', error);
      showError('Bulk operation failed');
    }
  };

  return (
    <div className={`p-4 ${className}`}>
      {/* ... JSX ... */}
      <BulkOperations selectedIds={selectedRequests} onBulkAction={handleBulkOperation} />
    </div>
  );
};

export default MaintenanceDashboard; 