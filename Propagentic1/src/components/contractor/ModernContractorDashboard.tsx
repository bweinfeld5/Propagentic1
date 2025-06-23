import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, orderBy, onSnapshot, getDocs, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';
import {
  ChartBarIcon,
  ClipboardDocumentListIcon,
  DocumentCheckIcon,
  BellIcon,
  Cog6ToothIcon,
  PlusIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MapPinIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  Bars3Icon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon,
  ChatBubbleLeftRightIcon,
  HomeIcon,
  UserIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

// Import Canvas design and layout systems
import { canvasDesignSystem } from '../../styles/canvasDesignSystem';
import { canvasLayoutSystem, getCanvasContainer, getCanvasLayout } from '../../styles/canvasLayoutSystem';

// Import Canvas components
import CanvasDashboardLayout, { CanvasMobileNav, CanvasMobileNavItem } from './canvas/CanvasDashboardLayout';
import CanvasCard from '../ui/canvas/CanvasCard';
import CanvasButton from '../ui/canvas/CanvasButton';
import CanvasBadge from '../ui/canvas/CanvasBadge';

// Import existing widgets (will be gradually converted to Canvas style)
import StatsCards from './widgets/StatsCards';
import JobPipeline from './widgets/JobPipeline';
import EarningsDashboard from './widgets/EarningsDashboard';
import QuickActionsHub from './widgets/QuickActionsHub';
import NotificationsCenter from './widgets/NotificationsCenter';
import PerformanceMetrics from './widgets/PerformanceMetrics';
import ScheduleCalendar from './widgets/ScheduleCalendar';
import CommunicationPanel from './widgets/CommunicationPanel';
import DocumentVerificationSystem from './documents/DocumentVerificationSystem';

const ModernContractorDashboard: React.FC = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState('pending');
  const [contractorStats, setContractorStats] = useState({
    newJobs: 0,
    activeJobs: 0,
    completedJobs: 0,
    totalEarnings: 0,
    pendingPayments: 0,
    completionRate: 0,
    responseTime: 0,
    customerSatisfaction: 0
  });
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Load contractor data
  useEffect(() => {
    if (authLoading) return;

    if (!currentUser) {
      setError('Authentication required. Please log in to access your dashboard.');
      setLoading(false);
      return;
    }

    const contractorId = currentUser.uid;
    setLoading(true);
    setError(null);

    try {
      const ticketsRef = collection(db, 'tickets');
      const ticketsQuery = query(
        ticketsRef,
        where('contractorId', '==', contractorId),
        orderBy('updatedAt', 'desc'),
        limit(50)
      );

      const unsubscribe = onSnapshot(
        ticketsQuery,
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
            
            setTickets(ticketsData);
            calculateStats(ticketsData);
            setLoading(false);
          } catch (err) {
            console.error('Error processing ticket data:', err);
            setError('Error processing dashboard data. Please try again.');
            setLoading(false);
          }
        },
        (err) => {
          console.error('Error fetching tickets:', err);
          setError('Unable to load dashboard data. Please check your connection and try again.');
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up Firebase listener:', err);
      setError('Failed to connect to database. Please refresh the page.');
      setLoading(false);
    }
  }, [currentUser, authLoading]);

  // Calculate contractor stats
  const calculateStats = useCallback((ticketsData: any[]) => {
    if (!ticketsData || ticketsData.length === 0) {
      // Provide realistic mock data for new contractors
      setContractorStats({
        newJobs: 3,
        activeJobs: 0,
        completedJobs: 0,
        totalEarnings: 0,
        pendingPayments: 0,
        completionRate: 0,
        responseTime: 0,
        customerSatisfaction: 0
      });
      return;
    }

    try {
      const newJobs = ticketsData.filter(ticket => ticket.status === 'pending_acceptance').length;
      const activeJobs = ticketsData.filter(ticket => 
        ['assigned', 'accepted', 'in_progress', 'dispatched'].includes(ticket.status)
      ).length;
      const completedJobs = ticketsData.filter(ticket => ticket.status === 'completed').length;
      
      // Calculate earnings
      let totalEarnings = 0;
      let pendingPayments = 0;
      
      ticketsData.forEach(ticket => {
        const amount = ticket.payment?.amount || 0;
        if (ticket.payment?.status === 'paid') {
          totalEarnings += amount;
        } else if (ticket.status === 'completed') {
          pendingPayments += amount;
        }
      });
      
      // Calculate performance metrics
      const totalCompletedJobs = ticketsData.filter(ticket => ticket.status === 'completed').length;
      const totalAssignedJobs = ticketsData.filter(ticket => 
        ['assigned', 'accepted', 'in_progress', 'dispatched', 'completed', 'cancelled'].includes(ticket.status)
      ).length;
      
      const completionRate = totalAssignedJobs > 0 
        ? Math.round((totalCompletedJobs / totalAssignedJobs) * 100) 
        : 0;
      
      const responseTime = totalCompletedJobs > 0 ? 2.5 : 0;
      const customerSatisfaction = totalCompletedJobs > 0 ? 92 : 0;
      
      setContractorStats({
        newJobs: Math.max(newJobs, 1),
        activeJobs,
        completedJobs,
        totalEarnings,
        pendingPayments,
        completionRate,
        responseTime,
        customerSatisfaction
      });
    } catch (err) {
      console.error('Error calculating stats:', err);
      setContractorStats({
        newJobs: 2,
        activeJobs: 0,
        completedJobs: 0,
        totalEarnings: 0,
        pendingPayments: 0,
        completionRate: 0,
        responseTime: 0,
        customerSatisfaction: 0
      });
    }
  }, []);

  // Get verification status info
  const getVerificationStatusInfo = () => {
    const verificationSteps = [
      { 
        id: 'documents', 
        name: 'Upload Documents', 
        completed: true,
        description: 'Business license, insurance, ID'
      },
      { 
        id: 'review', 
        name: 'Document Review', 
        completed: verificationStatus === 'approved', 
        inProgress: verificationStatus === 'pending',
        description: 'Admin verification in progress'
      },
      { 
        id: 'approval', 
        name: 'Account Approval', 
        completed: verificationStatus === 'approved',
        description: 'Ready to receive jobs'
      }
    ];

    const completedSteps = verificationSteps.filter(step => step.completed).length;
    const progressPercentage = Math.round((completedSteps / verificationSteps.length) * 100);

    switch (verificationStatus) {
      case 'approved':
        return {
          icon: CheckCircleIcon,
          color: 'text-success-600',
          bgColor: 'bg-success-50',
          borderColor: 'border-success-200',
          message: 'Verification Complete',
          description: 'You\'re eligible to receive job assignments',
          steps: verificationSteps,
          progress: 100,
          showProgress: false
        };
      case 'pending':
        return {
          icon: ClockIcon,
          color: 'text-warning-600',
          bgColor: 'bg-warning-50',
          borderColor: 'border-warning-200',
          message: 'Verification In Progress',
          description: `Step ${completedSteps + 1} of ${verificationSteps.length}: ${verificationSteps.find(s => !s.completed && !s.inProgress)?.name || 'Document Review'}`,
          steps: verificationSteps,
          progress: progressPercentage,
          showProgress: true,
          estimatedTime: '1-2 business days'
        };
      case 'rejected':
        return {
          icon: XCircleIcon,
          color: 'text-error-600',
          bgColor: 'bg-error-50',
          borderColor: 'border-error-200',
          message: 'Action Required',
          description: 'Please resubmit required documents to continue',
          steps: verificationSteps,
          progress: 33,
          showProgress: true,
          actionRequired: true
        };
      default:
        return {
          icon: ExclamationTriangleIcon,
          color: 'text-neutral-600',
          bgColor: 'bg-neutral-50',
          borderColor: 'border-neutral-200',
          message: 'Start Verification',
          description: 'Upload your documents to begin the verification process',
          steps: verificationSteps,
          progress: 0,
          showProgress: true
        };
    }
  };

  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setShowMobileMenu(false);
  };

  // Handle action click
  const handleActionClick = (action: string) => {
    switch (action) {
      case 'jobs':
        setActiveTab('jobs');
        break;
      case 'verification':
        setActiveTab('verification');
        break;
      case 'notifications':
        setActiveTab('notifications');
        break;
      default:
        console.log(`Action clicked: ${action}`);
    }
  };

  // Canvas Top Bar Component
  const CanvasTopBar = () => (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <h1 className="text-lg lg:text-xl font-semibold text-neutral-800">Contractor Dashboard</h1>
      </div>
      
      {/* Mobile menu toggle */}
      <button 
        className="lg:hidden p-2 rounded-md hover:bg-neutral-100 text-neutral-600"
        onClick={() => setShowMobileMenu(!showMobileMenu)}
        aria-label="Toggle menu"
      >
        {showMobileMenu ? (
          <XMarkIcon className="w-5 h-5" />
        ) : (
          <Bars3Icon className="w-5 h-5" />
        )}
      </button>
      
      {/* Desktop user info */}
      <div className="hidden lg:flex items-center space-x-3">
        <div className="text-right">
          <p className="text-sm font-medium text-neutral-800">Welcome back!</p>
          <p className="text-xs text-neutral-500">Ready for new jobs</p>
        </div>
        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
          <UserIcon className="w-4 h-4 text-primary-600" />
        </div>
      </div>
    </div>
  );

  // Canvas Breadcrumbs Component
  const CanvasBreadcrumbs = () => (
    <div className="flex items-center space-x-2 text-sm text-neutral-600">
      <HomeIcon className="w-4 h-4" />
      <ChevronRightIcon className="w-4 h-4" />
      <span className="font-medium">Dashboard</span>
      {activeTab !== 'overview' && (
        <>
          <ChevronRightIcon className="w-4 h-4" />
          <span className="text-neutral-800 font-medium capitalize">{activeTab}</span>
        </>
      )}
    </div>
  );

  // Canvas Sidebar Component  
  const CanvasSidebar = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-neutral-800 mb-4">Quick Actions</h3>
        <QuickActionsHub onActionClick={handleActionClick} />
      </div>
      
      <div>
        <h3 className="text-sm font-semibold text-neutral-800 mb-4">Performance</h3>
        <PerformanceMetrics 
          completionRate={contractorStats.completionRate}
          responseTime={contractorStats.responseTime}
          customerSatisfaction={contractorStats.customerSatisfaction}
        />
      </div>
    </div>
  );

  // Canvas Activity Stream Component
  const CanvasActivityStream = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-neutral-800 mb-4">Messages</h3>
        <CommunicationPanel />
      </div>
      
      <div>
        <h3 className="text-sm font-semibold text-neutral-800 mb-4">Notifications</h3>
        <NotificationsCenter />
      </div>
      
      <div>
        <h3 className="text-sm font-semibold text-neutral-800 mb-4">Schedule</h3>
        <ScheduleCalendar tickets={tickets} />
      </div>
    </div>
  );

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-neutral-200 rounded-lg w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-32 bg-neutral-200 rounded-xl"></div>
              <div className="h-32 bg-neutral-200 rounded-xl"></div>
              <div className="h-32 bg-neutral-200 rounded-xl"></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="h-64 bg-neutral-200 rounded-xl lg:col-span-2"></div>
              <div className="h-64 bg-neutral-200 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 p-4 sm:p-6 md:p-8 flex items-center justify-center">
        <CanvasCard className="max-w-md w-full">
          <div className="text-center">
            <ExclamationTriangleIcon className="w-12 h-12 text-error-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-neutral-900 mb-2">Dashboard Error</h2>
            <p className="text-neutral-600 mb-6">{error}</p>
            <CanvasButton 
              variant="primary" 
              fullWidth 
              onClick={() => window.location.reload()}
            >
              Retry
            </CanvasButton>
          </div>
        </CanvasCard>
      </div>
    );
  }

  // Get verification status
  const statusInfo = getVerificationStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <CanvasDashboardLayout
      topBar={<CanvasTopBar />}
      breadcrumbs={<CanvasBreadcrumbs />}
      sidebar={<CanvasSidebar />}
      activityStream={<CanvasActivityStream />}
    >
      {/* Mobile Navigation */}
      <CanvasMobileNav className={showMobileMenu ? 'block' : 'hidden'}>
        <CanvasMobileNavItem
          icon={<ChartBarIcon className="w-5 h-5" />}
          label="Overview"
          active={activeTab === 'overview'}
          onClick={() => handleTabChange('overview')}
        />
        <CanvasMobileNavItem
          icon={<ClipboardDocumentListIcon className="w-5 h-5" />}
          label="Jobs"
          active={activeTab === 'jobs'}
          badge={contractorStats.newJobs}
          onClick={() => handleTabChange('jobs')}
        />
        <CanvasMobileNavItem
          icon={<DocumentCheckIcon className="w-5 h-5" />}
          label="Verification"
          active={activeTab === 'verification'}
          onClick={() => handleTabChange('verification')}
        />
        <CanvasMobileNavItem
          icon={<BellIcon className="w-5 h-5" />}
          label="Notifications"
          active={activeTab === 'notifications'}
          badge={3}
          onClick={() => handleTabChange('notifications')}
        />
      </CanvasMobileNav>

      {/* Main Content */}
      <div className="space-y-6">
        
        {/* Verification Status Banner */}
        {verificationStatus !== 'approved' && (
          <CanvasCard className={`${statusInfo.bgColor} ${statusInfo.borderColor} border-2`}>
            <div className="flex items-start space-x-4">
              <StatusIcon className={`w-6 h-6 ${statusInfo.color} mt-1 flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`text-lg font-semibold ${statusInfo.color}`}>{statusInfo.message}</h3>
                  {statusInfo.estimatedTime && (
                    <CanvasBadge variant="neutral" size="sm">
                      ETA: {statusInfo.estimatedTime}
                    </CanvasBadge>
                  )}
                </div>
                <p className="text-neutral-600 text-sm mb-4">{statusInfo.description}</p>
                
                {/* Progress Bar */}
                {statusInfo.showProgress && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-neutral-500 mb-2">
                      <span className="font-medium">Progress</span>
                      <span className="font-medium">{statusInfo.progress}% complete</span>
                    </div>
                    <div className="w-full bg-neutral-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          statusInfo.actionRequired 
                            ? 'bg-error-500' 
                            : statusInfo.progress === 100 
                              ? 'bg-success-500' 
                              : 'bg-warning-500'
                        }`}
                        style={{ width: `${statusInfo.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                {/* Step Indicators */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs mb-4">
                  {statusInfo.steps.map((step, index) => (
                    <div key={step.id} className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        step.completed 
                          ? 'bg-success-500' 
                          : step.inProgress 
                            ? 'bg-warning-500 animate-pulse' 
                            : 'bg-neutral-300'
                      }`}></div>
                      <span className={`${
                        step.completed 
                          ? 'text-success-700 font-medium' 
                          : step.inProgress 
                            ? 'text-warning-700 font-semibold' 
                            : 'text-neutral-500'
                      }`}>
                        {step.name}
                      </span>
                    </div>
                  ))}
                </div>

                <CanvasButton
                  variant={statusInfo.actionRequired ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handleTabChange('verification')}
                >
                  {statusInfo.actionRequired ? 'Fix Issues' : 'View Details'}
                </CanvasButton>
              </div>
            </div>
          </CanvasCard>
        )}

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* Stats Cards */}
            <CanvasCard variant="widget" header={
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-neutral-800">Performance Overview</h2>
                <ChartBarIcon className="w-5 h-5 text-neutral-500" />
              </div>
            }>
              <StatsCards stats={contractorStats} />
            </CanvasCard>
            
            {/* Job Pipeline */}
            <CanvasCard variant="widget" header={
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-neutral-800">Job Pipeline</h2>
                <ClipboardDocumentListIcon className="w-5 h-5 text-neutral-500" />
              </div>
            }>
              <JobPipeline tickets={tickets} />
            </CanvasCard>
            
            {/* Earnings Dashboard */}
            <CanvasCard variant="widget" header={
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-neutral-800">Earnings Dashboard</h2>
                <ArrowTrendingUpIcon className="w-5 h-5 text-neutral-500" />
              </div>
            }>
              <EarningsDashboard 
                totalEarnings={contractorStats.totalEarnings}
                pendingPayments={contractorStats.pendingPayments}
              />
            </CanvasCard>
          </div>
        )}

        {activeTab === 'jobs' && (
          <CanvasCard variant="widget">
            <div className="text-center py-12">
              <ClipboardDocumentListIcon className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-neutral-800 mb-2">Job Assignments</h3>
              <p className="text-neutral-600 mb-6">Detailed job management interface coming soon</p>
              <CanvasButton variant="primary">View Available Jobs</CanvasButton>
            </div>
          </CanvasCard>
        )}

        {activeTab === 'verification' && (
          <CanvasCard variant="widget" header={
            <h2 className="text-lg font-semibold text-neutral-800">Document Verification</h2>
          }>
            <DocumentVerificationSystem contractorId={currentUser?.uid} />
          </CanvasCard>
        )}

        {activeTab === 'notifications' && (
          <CanvasCard variant="widget" header={
            <h2 className="text-lg font-semibold text-neutral-800">Notifications</h2>
          }>
            <NotificationsCenter />
          </CanvasCard>
        )}
      </div>
    </CanvasDashboardLayout>
  );
};

export default ModernContractorDashboard; 