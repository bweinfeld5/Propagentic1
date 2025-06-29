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
  Sparkles,
  User,
  Menu
} from 'lucide-react';
import { db } from '../../firebase/config';
import { collection, query, where, orderBy, onSnapshot, getDocs, doc, getDoc } from 'firebase/firestore';
import EmptyStateCard from '../../components/EmptyStateCard';
import InvitationBanner from '../../components/InvitationBanner';
import { Skeleton } from '../../components/ui/Skeleton';
import UnifiedHeader from '../../components/layout/UnifiedHeader';
import NotificationPanel from '../../components/layout/NotificationPanel';
import inviteService from '../../services/firestore/inviteService';
import dataService from '../../services/dataService';

import EnhancedRequestHistory from '../../components/tenant/EnhancedRequestHistory';
import DashboardOverview from '../../components/tenant/DashboardOverview';
import LeavePropertyModal from '../../components/tenant/LeavePropertyModal';

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

// Demo data for development - FALLBACK ONLY
const DEMO_PROPERTY = {
  id: 'demo-property-1',
  name: 'Demo Property (No Real Data)',
  address: {
    street: '123 Demo Street',
    city: 'Demo City',
    state: 'CA',
    zipCode: '94105',
    unit: '4B'
  },
  landlord: {
    name: 'Demo Landlord',
    email: 'demo@example.com',
    phone: '(555) 123-4567'
  }
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
  console.log('🚀 [DEBUG] === ENHANCED TENANT DASHBOARD RENDERING ===');
  
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
  const [currentView, setCurrentView] = useState<'overview' | 'history'>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Leave Property Modal states
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);

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
      console.log('🔍 [DEBUG] Starting fetchTenantData');
      console.log('🔍 [DEBUG] Current User:', currentUser?.uid);
      console.log('🔍 [DEBUG] User Profile:', userProfile);
      
      if (!currentUser) {
        console.log('❌ [DEBUG] No current user, redirecting to login');
        navigate('/login');
        return;
      }
      
      setIsLoading(true);
      setIsError(false);
      
      try {
        // Configure data service with explicit userType
        dataService.configure({ 
          isDemoMode: false, 
          currentUser,
          userType: userProfile?.userType || userProfile?.role || 'tenant'
        });
        
        // Fetch pending invites
        console.log('🔍 [DEBUG] Fetching pending invites for email:', currentUser.email);
        if (currentUser.email) {
          const invites = await inviteService.getPendingInvitesForTenant(currentUser.email);
          console.log('🔍 [DEBUG] Found pending invites:', invites);
          setPendingInvites(invites || []);
        }
        
        // NEW: Fetch tenant properties from tenantProfile collection
        console.log('🔍 [DEBUG] Fetching tenant profile for uid:', currentUser.uid);
        const profileRef = doc(db, 'tenantProfiles', currentUser.uid);
        const profileSnap = await getDoc(profileRef);
        
        if (profileSnap.exists()) {
          const tenantProfile = profileSnap.data();
          console.log('✅ [DEBUG] Tenant profile found:', tenantProfile);
          
          // Extract the properties array
          const propertyIds = tenantProfile.properties || [];
          console.log('🔍 [DEBUG] Property IDs found:', propertyIds);
          
          if (propertyIds.length === 0) {
            console.log('⚠️  [DEBUG] No properties found in tenant profile');
            setTenantProperties([]);
            setIsDemoMode(false); // Don't use demo mode if profile exists but no properties
          } else {
            // Fetch all property documents using Promise.all for efficiency
            console.log(`🔍 [DEBUG] Fetching ${propertyIds.length} properties...`);
            const propertyPromises = propertyIds.map(async (propertyId: string) => {
              try {
                console.log('🔍 [DEBUG] Fetching property:', propertyId);
                const propRef = doc(db, 'properties', propertyId);
                const propSnap = await getDoc(propRef);
                
                if (!propSnap.exists()) {
                  console.warn('❌ [DEBUG] Property not found:', propertyId);
                  return { id: propertyId, error: 'Property not found', errorType: 'not-found' };
                }

                const propertyData = propSnap.data();
                console.log('✅ [DEBUG] Property data loaded:', propertyId, propertyData);
                return {
                  id: propSnap.id,
                  ...propertyData
                };
              } catch (error: any) {
                console.warn('❌ [DEBUG] Failed to fetch property:', propertyId, error);
                
                if (error.code === 'permission-denied') {
                  console.error('🔒 [DEBUG] Permission denied for property:', propertyId);
                  return { 
                    id: propertyId, 
                    error: 'You do not have permission to view this property. Please contact your landlord.',
                    errorType: 'permission-denied'
                  };
                }
                
                return { 
                  id: propertyId, 
                  error: 'An unexpected error occurred while loading this property.',
                  errorType: 'unknown'
                };
              }
            });
            
            // Wait for all property fetches to complete
            const properties = await Promise.all(propertyPromises);
            
            // Separate successful properties from errors
            const validProperties = properties.filter(property => !property.error);
            const errorProperties = properties.filter(property => property.error);
            
            console.log('✅ [DEBUG] Valid properties loaded:', validProperties);
            if (errorProperties.length > 0) {
              console.log('❌ [DEBUG] Properties with errors:', errorProperties);
            }
            
            // Show both valid properties and error messages
            const allPropertiesWithErrors = properties; // Include both valid and error properties
            setTenantProperties(allPropertiesWithErrors);
            
            if (validProperties.length > 0) {
              setIsDemoMode(false);
            } else if (errorProperties.length > 0) {
              // All properties had errors - show error state but not demo mode
              setIsDemoMode(false);
            } else {
              console.log('⚠️  [DEBUG] No valid properties loaded, using empty state');
              setTenantProperties([]);
              setIsDemoMode(false);
            }
          }
        } else {
          console.log('❌ [DEBUG] No tenant profile found for uid:', currentUser.uid);
          console.log('🔍 [DEBUG] Checking legacy userProfile.propertyId:', userProfile?.propertyId);
          
          // Fallback: Check legacy userProfile.propertyId
        if (userProfile?.propertyId) {
            console.log('🔍 [DEBUG] Attempting to load property via legacy propertyId');
          const property = await dataService.getPropertyById(userProfile.propertyId);
          if (property) {
              console.log('✅ [DEBUG] Legacy property loaded:', property);
            setTenantProperties([property]);
              setIsDemoMode(false);
            } else {
              console.log('❌ [DEBUG] Legacy property fetch failed, showing empty state');
              setTenantProperties([]);
              setIsDemoMode(false);
            }
          } else {
            console.log('⚠️  [DEBUG] No tenant profile and no legacy propertyId, showing empty state');
            setTenantProperties([]);
            setIsDemoMode(false);
          }
        }
        
      } catch (error) {
        console.error('❌ [DEBUG] Error fetching tenant data:', error);
        console.log('⚠️  [DEBUG] Falling back to demo mode due to error');
        // Only use demo mode as last resort
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
    navigate('/maintenance/ai-chat');
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

  // Handle leaving a property
  const handleLeavePropertyClick = (property: any) => {
    console.log('🚪 Leave Property clicked for:', property.name);
    setSelectedProperty(property);
    setLeaveModalOpen(true);
  };

  const handleLeavePropertySuccess = () => {
    console.log('✅ Leave Property successful');
    setLeaveModalOpen(false);
    setSelectedProperty(null);
    
    // Refresh the page to update all data
    window.location.reload();
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
              onClick={handleNewRequest}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 group text-gray-700 hover:bg-gray-100 hover:shadow-sm"
            >
              <div className="text-gray-500 group-hover:text-gray-700 transition-colors">
                <Plus className="w-5 h-5" />
              </div>
              {!sidebarCollapsed && (
                  <span className="font-medium">New Request</span>
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
            'Request History'
          }
          subtitle={
            currentView === 'overview' ? 'Monitor your property and maintenance status' :
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
          {/* Development Notice */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 m-6 mb-0">
              <div className="flex items-center">
                <div className="text-blue-400 mr-3">🔧</div>
                <div>
                  <h3 className="text-sm font-medium text-blue-800">Development Mode Active</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Enhanced debugging enabled. Check console for detailed property loading information.
                    Current dashboard: <strong>EnhancedTenantDashboard</strong>
                  </p>
                </div>
              </div>
            </div>
          )}



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
            <div>
              {/* Custom Property Display with Error Handling */}
              <div className="p-6">
                <div className="max-w-6xl mx-auto">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Quick Actions */}
                    <div className="lg:col-span-1">
                      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Plus className="w-5 h-5 text-orange-500" />
                            Quick Actions
                          </h3>
                        </div>
                        <div className="p-6 space-y-3">
                          <button
                            onClick={handleNewRequest}
                            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
                          >
                            <Plus className="w-5 h-5" />
                            Submit New Request
                          </button>
                          
                          <button
                            onClick={handleViewHistory}
                            className="w-full border-2 border-gray-200 hover:border-orange-300 text-gray-700 hover:text-orange-700 font-medium py-3 px-4 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                          >
                            <Activity className="w-5 h-5" />
                            View Request History
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Property Information with Error Handling */}
                    <div className="lg:col-span-2">
                      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Home className="w-5 h-5 text-orange-500" />
                            Your {tenantProperties.length === 1 ? 'Property' : 'Properties'}
                          </h3>
                        </div>
                        <div className="p-6">
                          {tenantProperties.length === 0 ? (
                            <div className="text-center py-8">
                              <Home className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                              <h4 className="text-lg font-medium text-gray-900 mb-2">No Properties Assigned</h4>
                              <p className="text-gray-600">
                                You are not currently assigned to any properties. Please accept a property invitation or contact your landlord to get started.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-6">
                              {tenantProperties.map((property, index) => (
                                <div key={property.id} className="space-y-4">
                                  {property.error ? (
                                    /* Error State for Property */
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                      <div className="flex items-start">
                                        <div className="flex-shrink-0">
                                          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                                            <Home className="w-5 h-5 text-red-600" />
                                          </div>
                                        </div>
                                        <div className="ml-3 flex-1">
                                          <h4 className="text-sm font-medium text-red-800">
                                            Property Loading Error
                                          </h4>
                                          <p className="text-sm text-red-700 mt-1">{property.error}</p>
                                          {property.errorType === 'permission-denied' && (
                                            <div className="mt-3 p-3 bg-red-100 rounded-md">
                                              <p className="text-xs text-red-800">
                                                <strong>Possible solutions:</strong>
                                              </p>
                                              <ul className="text-xs text-red-700 mt-1 list-disc list-inside">
                                                <li>Ask your landlord to update Firestore security rules</li>
                                                <li>Verify your tenant profile is properly configured</li>
                                                <li>Contact support if the issue persists</li>
                                              </ul>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    /* Successful Property Display */
                                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4 border border-orange-200">
                                      <h4 className="text-xl font-bold text-gray-900 mb-2">
                                        {property.name || 'Property'}
                                      </h4>
                                      {(property.address || property.streetAddress) && (
                                        <div className="text-gray-600">
                                          <p className="font-medium">
                                            {property.address?.street || property.streetAddress}
                                            {property.address?.unit && `, Unit ${property.address.unit}`}
                                          </p>
                                          <p>
                                            {property.address?.city || property.city}, {property.address?.state || property.state} {property.address?.zipCode || property.zip}
                                          </p>
                                        </div>
                                      )}

                                      {/* Landlord Contact Information */}
                                      {(property.landlord?.name || property.landlord?.email || property.landlord?.phone) && (
                                        <div className="mt-4 bg-white rounded-lg p-4 border border-gray-200">
                                          <h5 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                            <User className="w-4 h-4 text-orange-500" />
                                            Landlord Contact Information
                                          </h5>
                                          <div className="space-y-2">
                                            {property.landlord?.name && (
                                              <p className="text-sm text-gray-700">
                                                <span className="font-medium">Name:</span> {property.landlord.name}
                                              </p>
                                            )}
                                            {property.landlord?.email && (
                                              <p className="text-sm text-gray-700">
                                                <span className="font-medium">Email:</span> 
                                                <a 
                                                  href={`mailto:${property.landlord.email}`}
                                                  className="text-orange-600 hover:text-orange-700 ml-2 hover:underline"
                                                >
                                                  {property.landlord.email}
                                                </a>
                                              </p>
                                            )}
                                            {property.landlord?.phone && (
                                              <p className="text-sm text-gray-700">
                                                <span className="font-medium">Phone:</span> 
                                                <a 
                                                  href={`tel:${property.landlord.phone}`}
                                                  className="text-orange-600 hover:text-orange-700 ml-2 hover:underline"
                                                >
                                                  {property.landlord.phone}
                                                </a>
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      )}

                                      {/* Property Actions */}
                                      <div className="mt-4 flex gap-3">
                                        <button
                                          onClick={handleNewRequest}
                                          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                                        >
                                          Request Maintenance
                                        </button>
                                        <button
                                          onClick={() => handleLeavePropertyClick(property)}
                                          className="flex items-center gap-2 bg-white hover:bg-red-50 text-red-600 border border-red-300 hover:border-red-400 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                                        >
                                          <LogOut className="w-4 h-4" />
                                          Leave Property
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  {/* Divider between properties */}
                                  {index < tenantProperties.length - 1 && (
                                    <hr className="border-gray-200" />
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tickets Overview */}
                  <div className="mt-6">
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                      <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          <Activity className="w-5 h-5 text-orange-500" />
                          Recent Maintenance Requests
                        </h3>
                      </div>
            <div className="p-6">
                        {tickets.length === 0 ? (
                          <div className="text-center py-8">
                            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h4 className="text-lg font-medium text-gray-900 mb-2">No Requests Yet</h4>
                            <p className="text-gray-600 mb-4">
                              You haven't submitted any maintenance requests.
                            </p>
                            <button
                              onClick={handleNewRequest}
                              className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
                            >
                              Submit Your First Request
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {tickets.slice(0, 3).map((ticket) => (
                              <div key={ticket.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h4 className="font-medium text-gray-900">{ticket.issueTitle}</h4>
                                    <p className="text-sm text-gray-600 mt-1">{ticket.description}</p>
                                    <div className="flex items-center gap-4 mt-2">
                                      <span className={`text-xs px-2 py-1 rounded-full ${
                                        ticket.status === 'resolved' ? 'bg-green-100 text-green-700' :
                                        ticket.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                        'bg-yellow-100 text-yellow-700'
                                      }`}>
                                        {ticket.status.replace('_', ' ').toUpperCase()}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : 'No date'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                            {tickets.length > 3 && (
                              <div className="text-center pt-4">
                                <button
                                  onClick={handleViewHistory}
                                  className="text-orange-600 hover:text-orange-700 font-medium text-sm"
                                >
                                  View All Requests ({tickets.length})
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
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
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border-t border-red-200 px-6 py-3">
            <div className="flex items-center gap-2 text-red-700 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="font-medium">⚠️ DEMO MODE ACTIVE:</span>
              </div>
              <span>No real property data found. Check browser console for detailed debugging info.</span>
            </div>
          </div>
        )}

        {/* Debug Panel - Only shown when needed */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-900 text-green-400 text-xs p-4 font-mono">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-green-300 font-semibold mb-1">User Info:</div>
                  <div>UID: {currentUser?.uid || 'None'}</div>
                  <div>Email: {currentUser?.email || 'None'}</div>
                  <div>UserType: {userProfile?.userType || 'Unknown'}</div>
                </div>
                <div>
                  <div className="text-green-300 font-semibold mb-1">Property Data:</div>
                  <div>Properties Count: {tenantProperties.length}</div>
                  <div>Demo Mode: {isDemoMode ? 'YES' : 'NO'}</div>
                  <div>Loading: {isLoading ? 'YES' : 'NO'}</div>
                </div>
                <div>
                  <div className="text-green-300 font-semibold mb-1">Data Sources:</div>
                  <div>tenantProfiles checked</div>
                  <div>properties collection accessed</div>
                  <div>Console logs active</div>
                </div>
              </div>
              <div className="mt-2 text-yellow-400">
                🔍 Check browser console (F12) for detailed debugging information
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Notification Panel */}
      <NotificationPanel 
        isOpen={notificationPanelOpen} 
        onClose={() => setNotificationPanelOpen(false)} 
      />

      {/* Leave Property Modal */}
      {selectedProperty && (
        <LeavePropertyModal
          isOpen={leaveModalOpen}
          onClose={() => {
            setLeaveModalOpen(false);
            setSelectedProperty(null);
          }}
          onSuccess={handleLeavePropertySuccess}
          property={selectedProperty}
        />
      )}
      
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