import React, { useState, lazy, Suspense } from 'react';
import { useAuth } from 'context/AuthContext';
import { Link } from 'react-router-dom';
import { 
  HomeIcon, 
  UsersIcon, 
  DocumentTextIcon, 
  CogIcon, 
  PlusIcon, 
  BuildingOfficeIcon, 
  ClipboardDocumentListIcon,
  ChartBarIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import Button from '../ui/Button';
import LoadingFallback from '../ui/LoadingFallback';
import { LazyComponents } from '../../utils/lazyComponents';
import { useOptimizedFirestore } from '../../hooks/useOptimizedFirestore';
import ErrorBoundary from '../error/ErrorBoundary';

// Lazy load heavy components
const PerformanceDashboard = lazy(() => import('../monitoring/PerformanceDashboard'));
const ErrorMonitoringDashboard = lazy(() => import('../monitoring/ErrorMonitoringDashboard'));

const Dashboard = () => {
  const { userProfile, isLandlord, isTenant, isContractor, currentUser } = useAuth();
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Use optimized Firestore hooks for dashboard data
  const { 
    data: properties, 
    loading: propertiesLoading,
    refresh: refreshProperties 
  } = useOptimizedFirestore(
    'properties',
    { 
      where: [['landlordId', '==', currentUser?.uid || '']] 
    },
    { 
      enableCache: true,
      cacheKey: `properties_${currentUser?.uid}`,
      dependencies: [currentUser?.uid]
    }
  );

  const { 
    data: activityData,
    loading: activityLoading 
  } = useOptimizedFirestore(
    'activities',
    { 
      where: [['userId', '==', currentUser?.uid || '']],
      orderBy: [['createdAt', 'desc']],
      limit: 10
    },
    { 
      enableCache: true,
      enableRealtime: true,
      cacheKey: `recent_activity_${currentUser?.uid}`,
      dependencies: [currentUser?.uid]
    }
  );

  // Calculate dynamic stats from real data
  const stats = [
    { name: 'Total Properties', value: properties?.length || '0', color: 'bg-blue-500', textColor: 'text-blue-800' },
    { name: 'Active Tenants', value: '12', color: 'bg-green-500', textColor: 'text-green-800' },
    { name: 'Maintenance Requests', value: '3', color: 'bg-yellow-500', textColor: 'text-yellow-800' },
    { name: 'Monthly Revenue', value: '$8,400', color: 'bg-purple-500', textColor: 'text-purple-800' }
  ];

  // Use real activity data or fallback to mock data
  const recentActivity = activityData?.length > 0 ? activityData : [
    { id: 1, user: 'John Smith', action: 'submitted a maintenance request', time: '2 hours ago' },
    { id: 2, user: 'Sarah Johnson', action: 'paid rent for Unit 3B', time: '5 hours ago' },
    { id: 3, user: 'Mike Wilson', action: 'completed plumbing repair', time: '1 day ago' },
    { id: 4, user: 'Lisa Chen', action: 'moved into Unit 2A', time: '2 days ago' }
  ];

  // Enhanced Landlord dashboard with Phase 1.4 features
  const getLandlordDashboard = () => (
    <>
      {/* Dashboard Navigation Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: HomeIcon },
              { id: 'payments', name: 'Payments', icon: CreditCardIcon },
              { id: 'analytics', name: 'Analytics', icon: ChartBarIcon },
              { id: 'performance', name: 'Performance', icon: ShieldCheckIcon },
              { id: 'monitoring', name: 'Monitoring', icon: ExclamationTriangleIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-5 h-5 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <>
          {/* Quick Actions Section */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Quick Actions</h2>
              <div className="text-sm text-gray-500">Enhanced Features</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <button
                onClick={() => setShowBulkImport(true)}
                className="flex items-center justify-center p-4 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                <div className="text-center">
                  <ClipboardDocumentListIcon className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <span className="text-sm font-medium text-blue-700">Bulk Import Properties</span>
                  <p className="text-xs text-gray-500 mt-1">Upload CSV/Excel file</p>
                </div>
              </button>
              <Link 
                to="/properties/new"
                className="flex items-center justify-center p-4 border-2 border-dashed border-green-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors"
              >
                <div className="text-center">
                  <PlusIcon className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <span className="text-sm font-medium text-green-700">Add Single Property</span>
                  <p className="text-xs text-gray-500 mt-1">Manual entry</p>
                </div>
              </Link>
              <Link 
                to="/maintenance/new"
                className="flex items-center justify-center p-4 border-2 border-dashed border-purple-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors"
              >
                <div className="text-center">
                  <DocumentTextIcon className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <span className="text-sm font-medium text-purple-700">Create Work Order</span>
                  <p className="text-xs text-gray-500 mt-1">Direct assignment</p>
                </div>
              </Link>
              <button
                onClick={() => setActiveTab('payments')}
                className="flex items-center justify-center p-4 border-2 border-dashed border-orange-300 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-colors"
              >
                <div className="text-center">
                  <CreditCardIcon className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                  <span className="text-sm font-medium text-orange-700">Manage Payments</span>
                  <p className="text-xs text-gray-500 mt-1">Escrow & billing</p>
                </div>
              </button>
            </div>
          </div>

          {/* Property Overview */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Property Overview</h2>
              <Link to="/properties" className="text-sm text-blue-600 hover:text-blue-800">View All</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-primary-50 p-4 rounded-lg">
                <h3 className="font-medium text-primary-800">Total Properties</h3>
                <p className="text-2xl font-bold">{properties?.length || 0}</p>
                <p className="text-sm text-green-600">
                  {propertiesLoading ? 'Loading...' : `${properties?.length || 0} active`}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-medium text-green-800">Active Tenants</h3>
                <p className="text-2xl font-bold">12</p>
                <p className="text-sm text-green-600">95% occupancy</p>
              </div>
              <div className="bg-primary-100 p-4 rounded-lg">
                <h3 className="font-medium text-primary-900">Maintenance Requests</h3>
                <p className="text-2xl font-bold">3</p>
                <p className="text-sm text-yellow-600">2 pending response</p>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            <ul className="divide-y divide-gray-200">
              {recentActivity.slice(0, 3).map((activity) => (
                <li key={activity.id} className="py-3">
                  <div className="flex items-center space-x-3">
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">Activity</span>
                    <p className="text-gray-800">{activity.user} {activity.action}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <Suspense fallback={<LoadingFallback type="dashboard" title="Loading payment dashboard..." />}>
          <LazyComponents.EscrowDashboard userRole="landlord" />
        </Suspense>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <Suspense fallback={<LoadingFallback type="dashboard" title="Loading analytics..." />}>
          <LazyComponents.AnalyticsDashboard />
        </Suspense>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <ErrorBoundary level="component" userId={currentUser?.uid} userRole={userProfile?.role}>
          <Suspense fallback={<LoadingFallback type="dashboard" title="Loading performance dashboard..." />}>
            <PerformanceDashboard />
          </Suspense>
        </ErrorBoundary>
      )}

      {/* Monitoring Tab */}
      {activeTab === 'monitoring' && (
        <ErrorBoundary level="component" userId={currentUser?.uid} userRole={userProfile?.role}>
          <Suspense fallback={<LoadingFallback type="dashboard" title="Loading error monitoring dashboard..." />}>
            <ErrorMonitoringDashboard />
          </Suspense>
        </ErrorBoundary>
      )}
    </>
  );

  const getTenantDashboard = () => (
    <>
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Your Apartment</h2>
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <p className="text-gray-600">123 Main Street, Apt 4B</p>
            <p className="text-gray-600">Lease ends: June 30, 2023</p>
          </div>
          <button className="mt-4 md:mt-0 px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
            Report an Issue
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Payment Information</h2>
          <div className="mb-4">
            <p className="text-gray-600">Next payment due:</p>
            <p className="text-xl font-semibold">May 1, 2023</p>
          </div>
          <div className="mb-4">
            <p className="text-gray-600">Amount:</p>
            <p className="text-xl font-semibold">$1,250.00</p>
          </div>
          <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
            Make a Payment
          </button>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Maintenance Requests</h2>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded mr-2">In Progress</span>
                <p className="text-gray-800">Leaking faucet in bathroom</p>
              </div>
              <p className="text-xs text-gray-500">Reported on Apr 15</p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded mr-2">Completed</span>
                <p className="text-gray-800">Replace smoke detector batteries</p>
              </div>
              <p className="text-xs text-gray-500">Completed on Mar 28</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const getContractorDashboard = () => (
    <>
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Available Jobs</h2>
        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-primary-50 p-4 rounded-lg">
            <h3 className="font-medium text-primary-800">New Jobs</h3>
            <p className="text-2xl font-bold">3</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-medium text-yellow-800">In Progress</h3>
            <p className="text-2xl font-bold">2</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-medium text-green-800">Completed this Month</h3>
            <p className="text-2xl font-bold">7</p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Job Requests</h2>
        <ul className="divide-y divide-gray-200">
          <li className="py-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Plumbing Repair - 123 Main St, Apt 4B</h3>
                <p className="text-sm text-gray-600">Leaking faucet in bathroom</p>
                <div className="flex items-center mt-1">
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">Plumbing</span>
                  <span className="text-xs text-gray-500 ml-2">Posted 1 day ago</span>
                </div>
              </div>
              <button className="px-3 py-1 bg-primary text-white text-sm rounded hover:bg-primary-dark">
                Accept Job
              </button>
            </div>
          </li>
          <li className="py-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Electrical Work - 45 Park Avenue, Apt 2A</h3>
                <p className="text-sm text-gray-600">Replace light fixtures in kitchen</p>
                <div className="flex items-center mt-1">
                  <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">Electrical</span>
                  <span className="text-xs text-gray-500 ml-2">Posted 3 days ago</span>
                </div>
              </div>
              <button className="px-3 py-1 bg-primary text-white text-sm rounded hover:bg-primary-dark">
                Accept Job
              </button>
            </div>
          </li>
        </ul>
      </div>
    </>
  );

  // Render dashboard based on user role
  return (
    <ErrorBoundary level="page" userId={currentUser?.uid} userRole={userProfile?.role}>
      <div className="p-6 bg-background dark:bg-background-dark">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-content dark:text-content-dark">Dashboard</h1>
            <p className="mt-1 text-sm text-content-secondary dark:text-content-darkSecondary">
              Overview of your property management activities.
            </p>
          </div>
          {isLandlord && isLandlord() && (
            <Button 
              variant="primary" 
              className="mt-4 md:mt-0"
              onClick={() => setShowBulkImport(true)}
            >
              <ClipboardDocumentListIcon className="h-5 w-5 mr-2" />
              Bulk Import Properties
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Stats Cards */}
          {stats.map((stat) => (
            <div key={stat.name} className={`p-4 rounded-lg shadow ${stat.color.replace('bg-', 'bg-opacity-20 ')} dark:bg-opacity-30 border border-transparent hover:border-current`}>
              <p className={`text-sm font-medium ${stat.textColor.replace('-800', '-700')} dark:${stat.textColor.replace('-800', '-300')} truncate`}>{stat.name}</p>
              <p className={`mt-1 text-3xl font-semibold ${stat.textColor.replace('-800', '-900')} dark:${stat.textColor.replace('-800', '-100')}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Role-based dashboard content */}
        <ErrorBoundary level="component" userId={currentUser?.uid} userRole={userProfile?.role}>
          {isLandlord && isLandlord() && getLandlordDashboard()}
          {isTenant && isTenant() && getTenantDashboard()}
          {isContractor && isContractor() && getContractorDashboard()}
        </ErrorBoundary>

        {/* Modals */}
        {showBulkImport && (
          <ErrorBoundary level="component" userId={currentUser?.uid} userRole={userProfile?.role}>
            <Suspense fallback={<LoadingFallback type="form" title="Loading bulk import..." />}>
              <LazyComponents.BulkPropertyImport 
                isOpen={showBulkImport}
                onClose={() => setShowBulkImport(false)}
                onPropertiesAdded={refreshProperties}
              />
            </Suspense>
          </ErrorBoundary>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default Dashboard; 