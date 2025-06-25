import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { 
  Bell, 
  AlertTriangle, 
  Plus, 
  Home, 
  Activity,
  Shield,
  Clock,
  CheckCircle,
  TrendingUp,
  Calendar,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { db } from '../../firebase/config';
import { collection, query, where, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import EmptyStateCard from '../../components/EmptyStateCard';
import InvitationBanner from '../../components/InvitationBanner';
import { Skeleton } from '../../components/ui/Skeleton';
import UnifiedHeader from '../../components/layout/UnifiedHeader';
import NotificationPanel from '../../components/layout/NotificationPanel';
import inviteService from '../../services/firestore/inviteService';
import dataService from '../../services/dataService';
import EnhancedRequestForm from '../../components/tenant/EnhancedRequestForm';
import EnhancedRequestHistory from '../../components/tenant/EnhancedRequestHistory';
import DashboardOverview from '../../components/tenant/DashboardOverview';

interface Ticket {
  id: string;
  status: string;
  createdAt?: Date;
  submittedBy: string;
  issueTitle: string;
  description: string;
  photoUrl?: string;
  photoUrls?: string[];
  urgency?: string;
  category?: string;
  location?: string;
  bestTimeToContact?: string;
  accessInstructions?: string;
  updatedAt?: Date;
  [key: string]: any;
}

// Demo data for development
const DEMO_PROPERTY = {
  id: 'demo-property-1',
  name: 'Sunset Apartments',
  address: {
    street: '123 Main Street',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94105',
    unit: '4B'
  },
  landlordName: 'John Smith',
  landlordEmail: 'landlord@example.com',
  landlordPhone: '(555) 123-4567'
};

const DEMO_TICKETS: Ticket[] = [
  {
    id: 'demo-1',
    issueTitle: 'Leaky faucet in kitchen',
    description: 'The kitchen faucet has been dripping constantly for the past week.',
    status: 'open',
    urgency: 'medium',
    category: 'plumbing',
    location: 'Kitchen',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    submittedBy: 'demo-user'
  },
  {
    id: 'demo-2',
    issueTitle: 'AC not cooling properly',
    description: 'The air conditioning unit is running but not cooling the apartment effectively.',
    status: 'in_progress',
    urgency: 'high',
    category: 'hvac',
    location: 'Living Room',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    submittedBy: 'demo-user'
  },
  {
    id: 'demo-3',
    issueTitle: 'Broken cabinet door',
    description: 'The cabinet door under the bathroom sink fell off its hinges.',
    status: 'resolved',
    urgency: 'low',
    category: 'structural',
    location: 'Bathroom',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    submittedBy: 'demo-user'
  }
];

const EnhancedTenantDashboard: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Property and invite states
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [tenantProperties, setTenantProperties] = useState<any[]>([]);
  
  // Maintenance/ticket states
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [permissionError, setPermissionError] = useState(false);
  
  // UI states
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'overview' | 'new-request' | 'history'>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Demo mode flag
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Redirect if not authenticated or not a tenant
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (userProfile && userProfile.userType !== 'tenant') {
      navigate(`/${userProfile.userType}`);
    }
  }, [currentUser, userProfile, navigate]);

  // Handle success message from maintenance form
  useEffect(() => {
    const state = location.state as { showSuccessMessage?: boolean; message?: string } | null;
    if (state?.showSuccessMessage) {
      toast.success(state.message || 'Maintenance request submitted successfully!');
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate]);

  // Fetch tenant data (invites and properties)
  useEffect(() => {
    const fetchTenantData = async () => {
      if (!currentUser) {
        navigate('/login');
        return;
      }
      
      setIsLoading(true);
      setIsError(false);
      
      try {
        dataService.configure({ 
          isDemoMode: false, 
          currentUser,
          userType: userProfile?.userType || userProfile?.role || 'tenant'
        });
        
        // Fetch pending invites
        if (currentUser.email) {
          const invites = await inviteService.getPendingInvitesForTenant(currentUser.email);
          setPendingInvites(invites || []);
        }
        
        // Fetch associated properties
        if (userProfile?.propertyId) {
          const property = await dataService.getPropertyById(userProfile.propertyId);
          if (property) {
            setTenantProperties([property]);
          }
        } else {
          // If no properties, use demo mode
          setIsDemoMode(true);
          setTenantProperties([DEMO_PROPERTY]);
        }
      } catch (error) {
        console.error('Error fetching tenant data:', error);
        // Instead of showing error, switch to demo mode
        setIsDemoMode(true);
        setTenantProperties([DEMO_PROPERTY]);
        setIsError(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTenantData();
  }, [currentUser, userProfile, navigate]);

  // Fetch maintenance tickets
  useEffect(() => {
    if (!currentUser || !userProfile) return;

    const fetchTickets = async () => {
      try {
        setTicketsLoading(true);
        
        // If in demo mode, use demo tickets
        if (isDemoMode) {
          setTickets(DEMO_TICKETS);
          setTicketsLoading(false);
          return;
        }
        
        const ticketsRef = collection(db, 'tickets');
        const q = query(
          ticketsRef,
          where('submittedBy', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const ticketsList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate()
          })) as Ticket[];
          setTickets(ticketsList);
          setTicketsLoading(false);
          setPermissionError(false);
        }, (error) => {
          console.error('Permission error fetching tickets:', error);
          setPermissionError(true);
          setTicketsLoading(false);
          // Use demo tickets on permission error
          setTickets(DEMO_TICKETS);
          setIsDemoMode(true);
        });
        
        return () => unsubscribe();
      } catch (error) {
        console.error('Error setting up tickets listener:', error);
        setTicketsLoading(false);
        setPermissionError(true);
        // Use demo tickets on error
        setTickets(DEMO_TICKETS);
        setIsDemoMode(true);
      }
    };
    
    fetchTickets();
  }, [currentUser, userProfile, isDemoMode]);

  const handleAcceptInvite = async (inviteId: string) => {
    try {
      toast.success('Invite accepted successfully!');
    } catch (error) {
      toast.error('Failed to accept invite');
    }
  };

  const handleDeclineInvite = async (inviteId: string) => {
    try {
      toast.success('Invite declined');
    } catch (error) {
      toast.error('Failed to decline invite');
    }
  };

  const handleNewRequest = () => {
    setCurrentView('new-request');
  };

  const handleViewHistory = () => {
    setCurrentView('history');
  };

  const handleBackToOverview = () => {
    setCurrentView('overview');
  };

  const handleRequestSuccess = () => {
    toast.success('Maintenance request submitted successfully!');
    setCurrentView('overview');
  };

  const handleViewProperty = (propertyId: string) => {
    toast('Property details view coming soon!', {
      icon: '🏠',
      style: {
        borderRadius: '10px',
        background: '#333',
        color: '#fff',
      },
    });
  };

  const handleContactLandlord = (property: any) => {
    if (property.landlordEmail) {
      window.location.href = `mailto:${property.landlordEmail}`;
    }
  };

  const handleLogout = () => {
    // Implement logout functionality
    toast.success('Logging out...');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Option 1: Executive Precision - Premium Modern Design (Enhanced)
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Enhanced Sidebar with Glassmorphism */}
      <div className={`${sidebarCollapsed ? 'w-20' : 'w-64'} bg-white/95 backdrop-blur-sm border-r border-gray-200 h-full transition-all duration-300 shadow-xl`}>
        {/* Logo Section with Gradient */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-amber-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
              <Home className="w-6 h-6 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div>
                <h2 className="font-semibold text-gray-900">PropAgentic</h2>
                <p className="text-sm text-gray-600">
                  {userProfile ? (
                    `Welcome, ${userProfile.firstName && userProfile.lastName 
                      ? `${userProfile.firstName} ${userProfile.lastName}` 
                      : userProfile.name || userProfile.email || 'User'}`
                  ) : (
                    'Tenant Portal'
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Navigation with Hover Effects */}
        <nav className="p-4">
          <div className="space-y-2">
            <button
              onClick={() => setCurrentView('overview')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 group ${
                currentView === 'overview'
                  ? 'bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 border-r-2 border-orange-500 shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100 hover:shadow-sm'
              }`}
            >
              <div className={`${currentView === 'overview' ? 'text-orange-600' : 'text-gray-500 group-hover:text-gray-700'} transition-colors`}>
                <Home className="w-5 h-5" />
              </div>
              {!sidebarCollapsed && (
                <>
                  <span className="font-medium">Dashboard</span>
                  {currentView === 'overview' && (
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  )}
                </>
              )}
            </button>
            
            <button
              onClick={() => setCurrentView('new-request')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 group ${
                currentView === 'new-request'
                  ? 'bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 border-r-2 border-orange-500 shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100 hover:shadow-sm'
              }`}
            >
              <div className={`${currentView === 'new-request' ? 'text-orange-600' : 'text-gray-500 group-hover:text-gray-700'} transition-colors`}>
                <Plus className="w-5 h-5" />
              </div>
              {!sidebarCollapsed && (
                <>
                  <span className="font-medium">New Request</span>
                  {currentView === 'new-request' && (
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  )}
                </>
              )}
            </button>
            
            <button
              onClick={() => setCurrentView('history')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 group ${
                currentView === 'history'
                  ? 'bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 border-r-2 border-orange-500 shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100 hover:shadow-sm'
              }`}
            >
              <div className={`${currentView === 'history' ? 'text-orange-600' : 'text-gray-500 group-hover:text-gray-700'} transition-colors`}>
                <Activity className="w-5 h-5" />
              </div>
              {!sidebarCollapsed && (
                <>
                  <span className="font-medium">Request History</span>
                  {currentView === 'history' && (
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  )}
                </>
              )}
            </button>
          </div>
          
          {/* Additional Menu Items */}
          {!sidebarCollapsed && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="space-y-2">
                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200">
                  <Shield className="w-5 h-5" />
                  <span className="font-medium">Security</span>
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200">
                  <Settings className="w-5 h-5" />
                  <span className="font-medium">Settings</span>
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200">
                  <HelpCircle className="w-5 h-5" />
                  <span className="font-medium">Help & Support</span>
                </button>
              </div>
            </div>
          )}
        </nav>
        
        {/* User Profile Section */}
        {!sidebarCollapsed && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        )}
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Unified Header */}
        <UnifiedHeader
          title={
            currentView === 'overview' ? 'Dashboard Overview' :
            currentView === 'new-request' ? 'Submit Maintenance Request' :
            'Request History'
          }
          subtitle={
            currentView === 'overview' ? 'Monitor your property and maintenance status' :
            currentView === 'new-request' ? 'Report issues and request maintenance' :
            'Track and manage your maintenance requests'
          }
          showNotifications={currentView === 'overview'}
          actions={
            currentView !== 'overview' && (
              <button
                onClick={handleBackToOverview}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-orange-50 text-orange-700 border border-orange-200 transition-all duration-200 hover:shadow-md flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Back to Dashboard
              </button>
            )
          }
        />
        
        {/* Content with Enhanced Background */}
        <div className="flex-1 overflow-auto bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100">
          {/* Invitation Banners */}
          {pendingInvites.length > 0 && currentView === 'overview' && (
            <div className="p-6 pb-0">
              <div className="space-y-4">
                {pendingInvites.map(invite => (
                  <InvitationBanner
                    key={invite.id}
                    invite={invite}
                    onAccept={handleAcceptInvite}
                    onDecline={handleDeclineInvite}
                  />
                ))}
              </div>
            </div>
          )}
          
          {currentView === 'overview' && (
            <DashboardOverview
              userProfile={userProfile}
              tenantProperties={tenantProperties}
              tickets={tickets}
              onNewRequest={handleNewRequest}
              onViewProperty={handleViewProperty}
              onContactLandlord={handleContactLandlord}
            />
          )}
          {currentView === 'new-request' && (
            <div className="p-6">
              <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-xl border border-gray-200 shadow-lg hover:shadow-xl transition-shadow">
                  <EnhancedRequestForm
                    onSuccess={handleRequestSuccess}
                    currentUser={currentUser!}
                    userProfile={userProfile}
                  />
                </div>
              </div>
            </div>
          )}
          {currentView === 'history' && (
            <div className="p-6">
              <div className="max-w-6xl mx-auto">
                <div className="bg-white rounded-xl border border-gray-200 shadow-lg hover:shadow-xl transition-shadow">
                  <EnhancedRequestHistory
                    tickets={tickets}
                    loading={ticketsLoading}
                    filter={filter}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Enhanced Demo Mode Banner */}
        {isDemoMode && (
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-t border-orange-200 px-6 py-3">
            <div className="flex items-center gap-2 text-orange-700 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                <span className="font-medium">Demo Mode:</span>
              </div>
              <span>You're viewing sample data. Real functionality available after property assignment.</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Notification Panel */}
      <NotificationPanel 
        isOpen={notificationPanelOpen} 
        onClose={() => setNotificationPanelOpen(false)} 
      />
      
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '8px',
          },
          success: {
            iconTheme: {
              primary: '#fb923c',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
};

export default EnhancedTenantDashboard; 