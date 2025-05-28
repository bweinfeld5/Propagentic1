import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import ContractorOverviewCards from './ContractorOverviewCards';
import DocumentVerificationSystem from './documents/DocumentVerificationSystem';
import DocumentVerificationNotifications from '../notifications/DocumentVerificationNotifications';
import NotificationPreferences from '../notifications/NotificationPreferences';
import EarningsSummary from './widgets/EarningsSummary';
import PerformanceMetrics from './widgets/PerformanceMetrics';
import QuickActionsPanel from './widgets/QuickActionsPanel';
import WeatherWidget from './widgets/WeatherWidget';
import UpcomingSchedule from './widgets/UpcomingSchedule';
import RecentMessages from './widgets/RecentMessages';
import Button from '../ui/Button';
import StatusPill from '../ui/StatusPill';
import {
  ChartBarIcon,
  ClipboardDocumentListIcon,
  DocumentCheckIcon,
  BellIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const EnhancedContractorDashboard = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('pending');
  const [contractorStats, setContractorStats] = useState({
    newJobs: 0,
    activeJobs: 0,
    completedThisMonth: 0,
    avgCompletionTime: null
  });

  // Load contractor data
  useEffect(() => {
    // Wait for auth to load
    if (authLoading) {
      return;
    }

    // If no user, set error state
    if (!currentUser) {
      setError('Authentication required. Please log in to access your dashboard.');
      setLoading(false);
      return;
    }

    const contractorId = currentUser.uid;
    
    // Reset error state when starting fresh
    setError(null);
    setLoading(true);

    try {
      // Create a simpler query first to test Firebase connection
      const ticketsRef = collection(db, 'tickets');
      
      // Try a basic query without complex where clauses first
      const basicQuery = query(ticketsRef, where('contractorId', '==', contractorId));

      const unsubscribe = onSnapshot(basicQuery, 
        (snapshot) => {
          try {
            const ticketsData = snapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
              };
            });
            
            // Sort by updatedAt in memory since orderBy might cause index issues
            ticketsData.sort((a, b) => b.updatedAt - a.updatedAt);
            
            setTickets(ticketsData);
            setLoading(false);
            setError(null);
          } catch (processingError) {
            console.error('Error processing ticket data:', processingError);
            setError('Error processing dashboard data. Please try again.');
            setLoading(false);
          }
        }, 
        (queryError) => {
          console.error('Error fetching tickets:', queryError);
          
          // Provide more specific error messages
          if (queryError.code === 'failed-precondition') {
            setError('Database index required. Please contact support or try again later.');
          } else if (queryError.code === 'permission-denied') {
            setError('Access denied. Please check your permissions or contact support.');
          } else if (queryError.code === 'unavailable') {
            setError('Database temporarily unavailable. Please try again in a moment.');
          } else {
            setError('Unable to load dashboard data. Please check your connection and try again.');
          }
          setLoading(false);
        }
      );

      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    } catch (setupError) {
      console.error('Error setting up Firebase listener:', setupError);
      setError('Failed to connect to database. Please refresh the page.');
      setLoading(false);
    }
  }, [currentUser, authLoading]);

  // Calculate contractor stats
  useEffect(() => {
    if (!tickets || tickets.length === 0) {
      setContractorStats({
        newJobs: 0,
        activeJobs: 0,
        completedThisMonth: 0,
        avgCompletionTime: null
      });
      return;
    }

    try {
      const newJobs = tickets.filter(ticket => ticket.status === 'pending_acceptance').length;
      const activeJobs = tickets.filter(ticket => 
        ['assigned', 'accepted', 'in_progress', 'dispatched'].includes(ticket.status)
      ).length;
      
      // Calculate completed jobs this month
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const completedThisMonth = tickets.filter(ticket => {
        if (ticket.status === 'completed' && ticket.updatedAt) {
          const ticketDate = ticket.updatedAt;
          return ticketDate.getMonth() === currentMonth && ticketDate.getFullYear() === currentYear;
        }
        return false;
      }).length;

      setContractorStats({
        newJobs,
        activeJobs,
        completedThisMonth,
        avgCompletionTime: null
      });
    } catch (statsError) {
      console.error('Error calculating stats:', statsError);
      // Don't set error state for stats calculation, just use defaults
    }
  }, [tickets]);

  const getVerificationStatusInfo = () => {
    switch (verificationStatus) {
      case 'approved':
        return {
          icon: CheckCircleIcon,
          color: 'text-success',
          bgColor: 'bg-success/10',
          borderColor: 'border-success/20',
          message: 'Verification Complete',
          description: 'You\'re eligible to receive job assignments'
        };
      case 'pending':
        return {
          icon: ClockIcon,
          color: 'text-warning',
          bgColor: 'bg-warning/10',
          borderColor: 'border-warning/20',
          message: 'Verification Pending',
          description: 'Complete document verification to start receiving jobs'
        };
      case 'rejected':
        return {
          icon: XCircleIcon,
          color: 'text-error',
          bgColor: 'bg-error/10',
          borderColor: 'border-error/20',
          message: 'Verification Required',
          description: 'Please resubmit required documents'
        };
      default:
        return {
          icon: ExclamationTriangleIcon,
          color: 'text-content-secondary',
          bgColor: 'bg-background-subtle',
          borderColor: 'border-border',
          message: 'Verification Status Unknown',
          description: 'Check your verification status'
        };
    }
  };

  const handleActionClick = (action) => {
    switch (action) {
      case 'verification':
        setActiveTab('verification');
        break;
      case 'jobs':
        setActiveTab('jobs');
        break;
      case 'notifications':
        setActiveTab('notifications');
        break;
      case 'settings':
        setShowSettings(true);
        break;
      case 'availability':
        console.log('Update availability clicked');
        break;
      case 'profile':
        console.log('Edit profile clicked');
        break;
      case 'messages':
        console.log('Messages clicked');
        break;
      case 'service-area':
        console.log('Service area clicked');
        break;
      case 'time-tracking':
        console.log('Time tracking clicked');
        break;
      default:
        console.log('Action clicked:', action);
    }
  };

  const renderOverviewTab = () => {
    const verificationInfo = getVerificationStatusInfo();
    const VerificationIcon = verificationInfo.icon;

    return (
      <div className="space-y-8">
        {/* Stats Cards */}
        <ContractorOverviewCards stats={contractorStats} />

        {/* Main Dashboard Widgets Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Earnings Summary */}
          <div className="lg:col-span-1">
            <EarningsSummary />
          </div>

          {/* Performance Metrics */}
          <div className="lg:col-span-1">
            <PerformanceMetrics />
          </div>

          {/* Quick Actions Panel */}
          <div className="lg:col-span-1">
            <QuickActionsPanel onActionClick={handleActionClick} />
          </div>

          {/* Weather Widget */}
          <div className="lg:col-span-1">
            <WeatherWidget location="San Francisco, CA" />
          </div>

          {/* Upcoming Schedule */}
          <div className="lg:col-span-1">
            <UpcomingSchedule />
          </div>

          {/* Recent Messages */}
          <div className="lg:col-span-1">
            <RecentMessages />
          </div>
        </div>

        {/* Verification Status Card */}
        <div className={`rounded-xl border p-6 ${verificationInfo.bgColor} ${verificationInfo.borderColor}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-lg ${verificationInfo.bgColor}`}>
                <VerificationIcon className={`w-6 h-6 ${verificationInfo.color}`} />
              </div>
              <div>
                <h3 className={`text-lg font-semibold ${verificationInfo.color}`}>
                  {verificationInfo.message}
                </h3>
                <p className="text-content-secondary dark:text-content-darkSecondary mt-1">
                  {verificationInfo.description}
                </p>
              </div>
            </div>
            {verificationStatus !== 'approved' && (
              <Button
                variant="outline"
                onClick={() => setActiveTab('verification')}
                className="flex-shrink-0"
              >
                Complete Verification
              </Button>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-background dark:bg-background-darkSubtle rounded-xl border border-border dark:border-border-dark p-6">
          <h3 className="text-lg font-semibold text-content dark:text-content-dark mb-4">
            Recent Activity
          </h3>
          {tickets.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardDocumentListIcon className="w-12 h-12 mx-auto text-content-secondary dark:text-content-darkSecondary mb-4" />
              <p className="text-content-secondary dark:text-content-darkSecondary">
                No recent activity
              </p>
              <p className="text-sm text-content-secondary dark:text-content-darkSecondary mt-1">
                Job assignments will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.slice(0, 5).map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between p-3 bg-background dark:bg-background-dark rounded-lg border border-border dark:border-border-dark"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-content dark:text-content-dark">
                      {ticket.issueType?.replace('_', ' ') || 'Maintenance Request'}
                    </p>
                    <p className="text-xs text-content-secondary dark:text-content-darkSecondary">
                      {ticket.propertyName} • {ticket.updatedAt.toLocaleDateString()}
                    </p>
                  </div>
                  <StatusPill status={ticket.status} size="sm" />
                </div>
              ))}
              {tickets.length > 5 && (
                <Button
                  variant="ghost"
                  onClick={() => setActiveTab('jobs')}
                  className="w-full mt-4"
                >
                  View All Jobs ({tickets.length})
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderJobsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-content dark:text-content-dark">
          Job Assignments
        </h3>
        <div className="text-sm text-content-secondary dark:text-content-darkSecondary">
          {tickets.length} total jobs
        </div>
      </div>

      {tickets.length === 0 ? (
        <div className="bg-background dark:bg-background-darkSubtle rounded-xl border border-border dark:border-border-dark p-12 text-center">
          <ClipboardDocumentListIcon className="w-16 h-16 mx-auto text-content-secondary dark:text-content-darkSecondary mb-4" />
          <h3 className="text-lg font-medium text-content dark:text-content-dark mb-2">
            No Job Assignments
          </h3>
          <p className="text-content-secondary dark:text-content-darkSecondary">
            You'll see jobs here when landlords assign maintenance requests to you.
          </p>
        </div>
      ) : (
        <div className="bg-background dark:bg-background-darkSubtle rounded-xl border border-border dark:border-border-dark overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border dark:divide-border-dark">
              <thead className="bg-background-subtle dark:bg-background-dark">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-content-secondary dark:text-content-darkSecondary uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-content-secondary dark:text-content-darkSecondary uppercase tracking-wider">
                    Issue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-content-secondary dark:text-content-darkSecondary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-content-secondary dark:text-content-darkSecondary uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-content-secondary dark:text-content-darkSecondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border dark:divide-border-dark">
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-background-subtle dark:hover:bg-background-dark">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-content dark:text-content-dark">
                        {ticket.propertyName || 'Unknown Property'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-content dark:text-content-dark capitalize">
                        {ticket.issueType?.replace('_', ' ') || 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusPill status={ticket.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-content-secondary dark:text-content-darkSecondary">
                      {ticket.updatedAt.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderVerificationTab = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <ShieldCheckIcon className="w-8 h-8 text-primary" />
        <div>
          <h3 className="text-lg font-semibold text-content dark:text-content-dark">
            Document Verification
          </h3>
          <p className="text-content-secondary dark:text-content-darkSecondary">
            Complete verification to start receiving job assignments
          </p>
        </div>
      </div>

      <DocumentVerificationSystem
        contractorId={currentUser?.uid}
        onVerificationComplete={(isVerified) => {
          setVerificationStatus(isVerified ? 'approved' : 'pending');
        }}
      />
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <BellIcon className="w-8 h-8 text-primary" />
        <div>
          <h3 className="text-lg font-semibold text-content dark:text-content-dark">
            Notifications
          </h3>
          <p className="text-content-secondary dark:text-content-darkSecondary">
            Stay updated on your verification status and job assignments
          </p>
        </div>
      </div>

      <DocumentVerificationNotifications
        showUnreadOnly={false}
        maxNotifications={20}
        onNotificationClick={(notification) => {
          if (notification.actionRequired) {
            setActiveTab('verification');
          }
        }}
      />
    </div>
  );

  // Show loading state while auth is loading
  if (authLoading || (loading && !error)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-background-dark">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary dark:border-primary-light mx-auto mb-4"></div>
          <p className="text-content-secondary dark:text-content-darkSecondary">
            {authLoading ? 'Authenticating...' : 'Loading your dashboard...'}
          </p>
        </div>
      </div>
    );
  }

  // Show error state with option to continue in offline mode
  if (error) {
    return (
      <div className="min-h-screen bg-background dark:bg-background-dark">
        {/* Header */}
        <div className="bg-background dark:bg-background-darkSubtle border-b border-border dark:border-border-dark">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div>
                <h1 className="text-2xl font-bold text-content dark:text-content-dark">
                  Contractor Dashboard
                </h1>
                <p className="text-sm text-content-secondary dark:text-content-darkSecondary">
                  Connection issue detected
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <ExclamationTriangleIcon className="w-16 h-16 text-error mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-content dark:text-content-dark mb-2">
              Connection Issue
            </h2>
            <p className="text-error mb-6 max-w-md mx-auto">{error}</p>
            <div className="space-y-4">
              <Button onClick={() => window.location.reload()}>
                Retry Connection
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setError(null);
                  setLoading(false);
                  // Continue with empty data
                }}
              >
                Continue Offline
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark">
      {/* Header */}
      <div className="bg-background dark:bg-background-darkSubtle border-b border-border dark:border-border-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-content dark:text-content-dark">
                Contractor Dashboard
              </h1>
              <p className="text-sm text-content-secondary dark:text-content-darkSecondary">
                Manage your jobs and verification status
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => setActiveTab('notifications')}
                className="relative"
              >
                <BellIcon className="w-5 h-5" />
                {contractorStats.newJobs > 0 && (
                  <span className="absolute -top-1 -right-1 bg-error text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {contractorStats.newJobs}
                  </span>
                )}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Cog6ToothIcon className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: ChartBarIcon },
              { id: 'jobs', label: 'Job Assignments', icon: ClipboardDocumentListIcon },
              { id: 'verification', label: 'Document Verification', icon: DocumentCheckIcon },
              { id: 'notifications', label: 'Notifications', icon: BellIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'bg-primary text-white shadow-md'
                    : 'text-content-secondary dark:text-content-darkSecondary hover:text-content dark:hover:text-content-dark hover:bg-background-subtle dark:hover:bg-background-darkSubtle'
                }`}
              >
                <tab.icon className="w-5 h-5 mr-2" />
                {tab.label}
                {tab.id === 'notifications' && contractorStats.newJobs > 0 && (
                  <span className="ml-2 bg-error text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {contractorStats.newJobs}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="min-h-[600px]">
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'jobs' && renderJobsTab()}
          {activeTab === 'verification' && renderVerificationTab()}
          {activeTab === 'notifications' && renderNotificationsTab()}
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background dark:bg-background-darkSubtle rounded-xl border border-border dark:border-border-dark p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-content dark:text-content-dark">
                  Settings & Preferences
                </h3>
                <Button
                  variant="ghost"
                  onClick={() => setShowSettings(false)}
                >
                  ×
                </Button>
              </div>
              <NotificationPreferences />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedContractorDashboard; 