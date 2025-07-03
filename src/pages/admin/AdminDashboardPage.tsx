import React, { useState, useEffect, useCallback } from 'react';
import {
  HomeIcon,
  UsersIcon,
  ShieldCheckIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  BellIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  WrenchScrewdriverIcon,
  QueueListIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/admin/AdminLayout';
import UserManagementPanel from '../../components/admin/UserManagementPanel';
import PropertyManagementPanel from '../../components/admin/PropertyManagementPanel';
import AuditLogsTable from '../../components/admin/AuditLogsTable';
import SystemConfigPanel from '../../components/admin/SystemConfigPanel';
import AdminStatsCards from '../../components/admin/AdminStatsCards';
import SecurityMonitor from '../../components/admin/SecurityMonitor';
import GlobalSearch from '../../components/search/GlobalSearch';
import WaitlistManagement from '../../components/admin/WaitlistManagement';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot,
  where,
  getDocs,
  doc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase/config';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  view: string;
  adminLevel?: 'moderator' | 'admin' | 'super_admin';
}

interface AdminStats {
  totalUsers: number;
  totalLandlords: number;
  totalTenants: number;
  totalContractors: number;
  activeProperties: number;
  pendingRequests: number;
  criticalAlerts: number;
  systemHealth: 'good' | 'warning' | 'critical';
}

// Temporary component to upgrade current user to super_admin
const SuperAdminUpgrade: React.FC = () => {
  const { userProfile } = useAuth();
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleUpgrade = async () => {
    if (!userProfile?.uid) {
      alert('No user profile found');
      return;
    }
    
    setIsUpgrading(true);
    try {
      // Use Cloud Function instead of direct Firestore update
      const upgradeSuperAdmin = httpsCallable(functions, 'upgradeSuperAdmin');
      const result = await upgradeSuperAdmin({});
      
      const data = result.data as { success: boolean; message: string; userProfile?: any };
      
      if (data.success) {
        alert('✅ ' + data.message + '! Please refresh the page to see changes.');
        window.location.reload();
      } else {
        alert('❌ Upgrade failed: ' + data.message);
      }
    } catch (error) {
      console.error('Upgrade failed:', error);
      alert('❌ Upgrade failed: ' + (error as Error).message);
    }
    setIsUpgrading(false);
  };

  // Don't show if already super admin
  if (userProfile?.role === 'super_admin') {
    return (
      <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="text-green-800 font-medium">✅ Super Admin Status Active</div>
        <div className="text-green-600 text-sm">You have full system access including System Configuration.</div>
      </div>
    );
  }

  // Only show for admin users who are not yet super admins
  if (userProfile?.role !== 'admin') {
    return null;
  }

  return (
    <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-yellow-800 font-medium">Admin Account Detected</div>
          <div className="text-yellow-700 text-sm">
            Upgrade to Super Admin to access System Configuration and advanced features.
          </div>
        </div>
        <Button 
          onClick={handleUpgrade} 
          disabled={isUpgrading}
          className="bg-yellow-600 hover:bg-yellow-700 text-white"
        >
          {isUpgrading ? 'Upgrading...' : 'Upgrade to Super Admin'}
        </Button>
      </div>
    </div>
  );
};

const AdminDashboardPage: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [showGlobalSearch, setShowGlobalSearch] = useState<boolean>(false);
  const [adminStats, setAdminStats] = useState<AdminStats>({
    totalUsers: 0,
    totalLandlords: 0,
    totalTenants: 0,
    totalContractors: 0,
    activeProperties: 0,
    pendingRequests: 0,
    criticalAlerts: 0,
    systemHealth: 'good'
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Check admin access
  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'super_admin';
  const isSuperAdmin = userProfile?.role === 'super_admin';
  
  // Debug admin access
  console.log('AdminDashboardPage - Access Check:', {
    userEmail: userProfile?.email,
    userRole: userProfile?.role,
    userType: userProfile?.userType,
    isAdmin,
    isSuperAdmin
  });

  // Navigation items based on admin level
  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: HomeIcon,
      view: 'dashboard'
    },
    {
      id: 'users',
      label: 'User Management',
      icon: UsersIcon,
      view: 'users',
      adminLevel: 'moderator'
    },
    {
      id: 'tenants',
      label: 'Tenant Management',
      icon: UserGroupIcon,
      view: 'tenants',
      adminLevel: 'moderator'
    },
    {
      id: 'contractors',
      label: 'Contractor Management',
      icon: WrenchScrewdriverIcon,
      view: 'contractors',
      adminLevel: 'moderator'
    },
    {
      id: 'waitlist',
      label: 'Waitlist Management',
      icon: QueueListIcon,
      view: 'waitlist',
      adminLevel: 'moderator'
    },
    {
      id: 'properties',
      label: 'Property Oversight',
      icon: BuildingOfficeIcon,
      view: 'properties',
      adminLevel: 'admin'
    },
    {
      id: 'audit',
      label: 'Audit Logs',
      icon: ClipboardDocumentListIcon,
      view: 'audit',
      adminLevel: 'moderator'
    },
    {
      id: 'security',
      label: 'Security Monitor',
      icon: ShieldCheckIcon,
      view: 'security',
      adminLevel: 'admin'
    },
    {
      id: 'config',
      label: 'System Config',
      icon: Cog6ToothIcon,
      view: 'config',
      adminLevel: 'super_admin'
    },
    {
      id: 'reports',
      label: 'Reports & Analytics',
      icon: ChartBarIcon,
      view: 'reports',
      adminLevel: 'admin'
    }
  ];

  // Filter navigation based on admin level
  const getFilteredNavigation = (): NavigationItem[] => {
    return navigationItems.filter(item => {
      if (!item.adminLevel) return true;
      
      const adminHierarchy = {
        'moderator': ['moderator', 'admin', 'super_admin'],
        'admin': ['admin', 'super_admin'],
        'super_admin': ['super_admin']
      };
      
      const requiredLevels = adminHierarchy[item.adminLevel] || [];
      return requiredLevels.includes(userProfile?.role);
    });
  };

  // Load dashboard statistics
  const loadAdminStats = useCallback(async () => {
    if (!currentUser || !isAdmin) return;

    setIsLoading(true);
    setError(null);

    try {
      // Get user counts by role
      const [
        usersSnapshot,
        landlordsSnapshot,
        tenantsSnapshot,
        contractorsSnapshot,
        propertiesSnapshot,
        alertsSnapshot
      ] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(query(collection(db, 'users'), where('role', '==', 'landlord'))),
        getDocs(query(collection(db, 'users'), where('role', '==', 'tenant'))),
        getDocs(query(collection(db, 'users'), where('role', '==', 'contractor'))),
        getDocs(collection(db, 'properties')),
        getDocs(query(
          collection(db, 'systemAlerts'), 
          where('level', '==', 'critical'),
          where('acknowledged', '==', false)
        ))
      ]);

      // Get pending maintenance requests count
      const pendingRequestsSnapshot = await getDocs(
        query(collection(db, 'tickets'), where('status', '==', 'pending'))
      );

      const stats: AdminStats = {
        totalUsers: usersSnapshot.size,
        totalLandlords: landlordsSnapshot.size,
        totalTenants: tenantsSnapshot.size,
        totalContractors: contractorsSnapshot.size,
        activeProperties: propertiesSnapshot.size,
        pendingRequests: pendingRequestsSnapshot.size,
        criticalAlerts: alertsSnapshot.size,
        systemHealth: alertsSnapshot.size > 5 ? 'critical' : 
                     alertsSnapshot.size > 2 ? 'warning' : 'good'
      };

      setAdminStats(stats);
      setIsLoading(false);
    } catch (error: any) {
      console.error('Error loading admin stats:', error);
      setError(error.message);
      setIsLoading(false);
      toast.error('Failed to load dashboard statistics');
    }
  }, [currentUser, isAdmin]);

  useEffect(() => {
    loadAdminStats();
  }, [loadAdminStats]);

  // Set up real-time listeners for critical updates
  useEffect(() => {
    if (!currentUser || !isAdmin) return;

    // Listen for critical alerts
    const alertsQuery = query(
      collection(db, 'systemAlerts'),
      where('level', '==', 'critical'),
      where('acknowledged', '==', false),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    const unsubscribeAlerts = onSnapshot(alertsQuery, (snapshot) => {
      const criticalCount = snapshot.size;
      setAdminStats(prev => ({
        ...prev,
        criticalAlerts: criticalCount,
        systemHealth: criticalCount > 5 ? 'critical' : 
                     criticalCount > 2 ? 'warning' : 'good'
      }));

      // Show toast for new critical alerts
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const alert = change.doc.data();
          toast.error(`Critical Alert: ${alert.message}`, {
            duration: 8000,
            icon: '🚨'
          });
        }
      });
    });

    return () => {
      unsubscribeAlerts();
    };
  }, [currentUser, isAdmin]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      // Ctrl/Cmd + K for global search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowGlobalSearch(true);
      }
      // Escape to close search
      if (e.key === 'Escape' && showGlobalSearch) {
        setShowGlobalSearch(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showGlobalSearch]);

  // Render action bar
  const renderActionBar = (): JSX.Element => (
    <div className="bg-gradient-to-r from-white to-red-50 border-b border-red-100 px-6 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <ShieldCheckIcon className="w-6 h-6 text-red-600" />
            {navigationItems.find(item => item.view === currentView)?.label || 'Admin Dashboard'}
          </h1>
          {adminStats.criticalAlerts > 0 && (
            <div className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 rounded-full">
              <ExclamationTriangleIcon className="w-4 h-4" />
              <span className="text-sm font-medium">
                {adminStats.criticalAlerts} Critical Alert{adminStats.criticalAlerts !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGlobalSearch(true)}
            className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2"
            title="Search (Ctrl+K)"
          >
            <MagnifyingGlassIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Search</span>
          </button>
          
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
            <div className={`w-2 h-2 rounded-full ${
              adminStats.systemHealth === 'good' ? 'bg-green-500' :
              adminStats.systemHealth === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            <span className="text-sm font-medium text-gray-700 capitalize">
              {adminStats.systemHealth}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  // Render main content based on current view
  const renderMainContent = (): JSX.Element | null => {
    switch (currentView) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <AdminStatsCards stats={adminStats} isLoading={isLoading} />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Admin Actions</h3>
                <AuditLogsTable limit={5} compact={true} />
              </div>
              
              {/* System Health */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
                <SecurityMonitor compact={true} />
              </div>
            </div>
          </div>
        );
      
      case 'users':
        return <UserManagementPanel />;
      
      case 'tenants':
        return <UserManagementPanel roleFilter="tenant" />;
      
      case 'contractors':
        return <UserManagementPanel roleFilter="contractor" />;
      
      case 'waitlist':
        return <WaitlistManagement />;
      
      case 'properties':
        return <PropertyManagementPanel />;
      
      case 'audit':
        return <AuditLogsTable />;
      
      case 'security':
        return <SecurityMonitor />;
      
      case 'config':
        return <SystemConfigPanel />;
      
      case 'reports':
        return (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reports & Analytics</h3>
            <p className="text-gray-600">Advanced reporting features coming soon...</p>
          </div>
        );
      
      default:
        return (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Page Not Found</h3>
            <p className="text-gray-600">The requested page could not be found.</p>
          </div>
        );
    }
  };

  // Redirect if not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShieldCheckIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout
      navigationItems={getFilteredNavigation()}
      currentView={currentView}
      onViewChange={setCurrentView}
      actionBar={renderActionBar()}
      userProfile={userProfile}
    >
      {/* Global Search Modal */}
      {showGlobalSearch && (
        <GlobalSearch
          onClose={() => setShowGlobalSearch(false)}
          isOpen={showGlobalSearch}
        />
      )}
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Super Admin Upgrade Component */}
          <SuperAdminUpgrade />
          
          {renderMainContent()}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboardPage; 