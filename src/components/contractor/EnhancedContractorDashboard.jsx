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
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          message: 'Verification Complete',
          description: 'You\'re eligible to receive job assignments'
        };
      case 'pending':
        return {
          icon: ClockIcon,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          message: 'Verification Pending',
          description: 'Complete document verification to start receiving jobs'
        };
      case 'rejected':
        return {
          icon: XCircleIcon,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          message: 'Verification Required',
          description: 'Please resubmit required documents'
        };
      default:
        return {
          icon: ExclamationTriangleIcon,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
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

        {        /* Recent Activity */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity
          </h3>
          {tickets.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardDocumentListIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">
                No recent activity
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Job assignments will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.slice(0, 5).map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {ticket.issueType?.replace('_', ' ') || 'Maintenance Request'}
                    </p>
                    <p className="text-xs text-gray-600">
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
        <h3 className="text-lg font-semibold text-gray-900">
          Job Assignments
        </h3>
        <div className="text-sm text-gray-600">
          {tickets.length} total jobs
        </div>
      </div>

      {tickets.length === 0 ? (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 p-12 text-center shadow-lg">
          <ClipboardDocumentListIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Job Assignments
          </h3>
          <p className="text-gray-600">
            You'll see jobs here when landlords assign maintenance requests to you.
          </p>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Issue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-orange-100">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {ticket.propertyName || 'Unknown Property'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 capitalize">
                        {ticket.issueType?.replace('_', ' ') || 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusPill status={ticket.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
        <ShieldCheckIcon className="w-8 h-8 text-orange-600" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Document Verification
          </h3>
          <p className="text-gray-600">
            Upload and manage your verification documents
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
        <BellIcon className="w-8 h-8 text-orange-600" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Notifications
          </h3>
          <p className="text-gray-600">
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
      <div className="min-h-screen relative overflow-hidden">
        {/* Orange gradient background */}
        <div className="absolute inset-0 z-0">
          <div 
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, #f97316 0%, #ea580c 100%)`
            }}
          />
        </div>
        
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="text-center bg-white/95 backdrop-blur-sm rounded-xl p-8 shadow-2xl border border-orange-200">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">
              {authLoading ? 'Authenticating...' : 'Loading your dashboard...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state with option to continue in offline mode
  if (error) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Orange gradient background */}
        <div className="absolute inset-0 z-0">
          <div 
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, #f97316 0%, #ea580c 100%)`
            }}
          />
        </div>
        
        {/* Header */}
        <div className="relative z-10 bg-white/95 backdrop-blur-sm border-b border-orange-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Contractor Dashboard
                </h1>
                <p className="text-sm text-red-600">
                  Connection issue detected
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-8 shadow-2xl border border-orange-200 max-w-md mx-auto">
              <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Connection Issue
              </h2>
              <p className="text-red-600 mb-6">{error}</p>
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">

      {/* Header */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-white to-orange-50 border-b border-orange-100 shadow-sm backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Contractor Dashboard
              </h1>
              <p className="text-sm text-orange-600">
                Manage your jobs and verification status
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => setActiveTab('notifications')}
                className="relative hover:bg-orange-50 text-orange-700"
              >
                <BellIcon className="w-5 h-5" />
                {contractorStats.newJobs > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center shadow-lg">
                    {contractorStats.newJobs}
                  </span>
                )}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowSettings(!showSettings)}
                className="hover:bg-orange-50 text-orange-700"
              >
                <Cog6ToothIcon className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                className={`flex items-center px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg transform scale-105'
                    : 'text-orange-700 hover:text-orange-800 hover:bg-gradient-to-r hover:from-orange-50 hover:to-white hover:shadow-md'
                }`}
              >
                <tab.icon className="w-5 h-5 mr-2" />
                {tab.label}
                {tab.id === 'notifications' && contractorStats.newJobs > 0 && (
                  <span className="ml-2 bg-gradient-to-r from-orange-400 to-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center shadow-lg">
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
            <div className="bg-white rounded-xl border border-orange-200 p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
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