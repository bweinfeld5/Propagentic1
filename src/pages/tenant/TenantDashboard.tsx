import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { Bell, Menu, Home, User, BellIcon, AlertTriangle } from 'lucide-react';
import { db } from '../../firebase/config';
import { collection, query, where, orderBy, onSnapshot, getDocs, doc, getDoc } from 'firebase/firestore';
import { PropAgenticMark } from '../../components/brand/PropAgenticMark';
import EmptyStateCard from '../../components/EmptyStateCard';
import InvitationBanner from '../../components/InvitationBanner';
import PropertyList from '../../components/PropertyList';
import { Skeleton } from '../../components/ui/Skeleton';
import Button from '../../components/ui/Button';
import RequestForm from '../../components/tenant/RequestForm';
import RequestHistory from '../../components/tenant/RequestHistory';
import HeaderBar from '../../components/layout/HeaderBar';
import NotificationPanel from '../../components/layout/NotificationPanel';
import inviteService from '../../services/firestore/inviteService';
import dataService from '../../services/dataService';
import { getDemoProperty, getDemoMaintenanceTickets, isDemoProperty } from '../../services/demoDataService';

interface Ticket {
  id: string;
  status: string;
  createdAt?: Date;
  submittedBy: string;
  issueTitle: string;
  description: string;
  photoUrl?: string;
  urgency?: string;
  category?: string;
  [key: string]: any;
}

const TenantDashboard: React.FC = () => {
  console.log('RENDERING TenantDashboard.TSX - MERGED VERSION'); // DEBUG LINE
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [propertiesLoading, setPropertiesLoading] = useState(false);
  
  // Property and invite states
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [tenantProperties, setTenantProperties] = useState<any[]>([]);
  
  // Maintenance/ticket states
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [permissionError, setPermissionError] = useState(false);
  
  // Notification states
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);

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
      // Clear the state to prevent showing the message again
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
        // Configure data service with explicit userType
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
        
        // Fetch tenant properties from tenantProfile collection
        console.log('Fetching tenant profile for uid:', currentUser.uid);
        setPropertiesLoading(true);
        
        const profileRef = doc(db, 'tenantProfiles', currentUser.uid);
        const profileSnap = await getDoc(profileRef);
        
        if (profileSnap.exists()) {
          const tenantProfile = profileSnap.data();
          console.log('Tenant profile data:', tenantProfile);
          
          // Extract the properties array
          const propertyIds = tenantProfile.properties || [];
          console.log('Property IDs found:', propertyIds);
          
          if (propertyIds.length === 0) {
            console.log('No properties found in tenant profile');
            setTenantProperties([]);
          } else {
            // Fetch all property documents using Promise.all for efficiency
            console.log(`Fetching ${propertyIds.length} properties...`);
            const propertyPromises = propertyIds.map(async (propertyId: string) => {
              try {
                console.log('Fetching property:', propertyId);
                const propRef = doc(db, 'properties', propertyId);
                const propSnap = await getDoc(propRef);
                
                if (propSnap.exists()) {
                  const propertyData = propSnap.data();
                  return {
                    id: propSnap.id,
                    ...propertyData
                  };
                } else {
                  console.warn(`Property ${propertyId} not found`);
                  return null;
                }
              } catch (error) {
                console.warn(`Failed to fetch property ${propertyId}:`, error);
                return null;
              }
            });
            
            // Wait for all property fetches to complete
            const properties = await Promise.all(propertyPromises);
            
            // Filter out any null results (failed fetches)
            const validProperties = properties.filter(property => property !== null);
            console.log('Valid properties loaded:', validProperties);
            
            setTenantProperties(validProperties);
          }
        } else {
          console.log('No tenant profile found for uid:', currentUser.uid);
          // Handle case where tenantProfile doesn't exist - show empty state
          setTenantProperties([]);
        }
        
        setPropertiesLoading(false);
        
      } catch (error) {
        console.error('Error fetching tenant data:', error);
        setIsError(true);
        setErrorMessage('Failed to load your dashboard. Please try again later.');
        setPropertiesLoading(false);
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
        
        // First try to fetch tickets using getDocs to check permissions
        const q = query(
          collection(db, 'tickets'),
          where('submittedBy', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        );
        
        await getDocs(q);
        
        // If we get here, we have permission, so set up the real-time listener
        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const ticketData: Ticket[] = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate()
            })) as Ticket[];
            setTickets(ticketData);
            setTicketsLoading(false);
            setPermissionError(false);
          },
          (error) => {
            console.error('Error fetching tickets:', error);
            
            if (error.code === 'permission-denied') {
              setPermissionError(true);
              toast.error('You do not have permission to view maintenance requests');
            } else {
              toast.error('Failed to load your maintenance requests');
            }
            
            setTicketsLoading(false);
          }
        );
        
        return () => unsubscribe();
      } catch (error: any) {
        console.error('Error in initial ticket fetch:', error);
        
        if (error.code === 'permission-denied') {
          setPermissionError(true);
          toast.error('You do not have permission to view maintenance requests');
        } else {
          toast.error('Failed to load your maintenance requests');
        }
        
        setTicketsLoading(false);
        return () => {};
      }
    };
    
    fetchTickets();
  }, [currentUser, userProfile]);
  
  // Handle invite acceptance
  const handleAcceptInvite = async (inviteId: string) => {
    if (!currentUser?.uid) {
      toast.error('You must be logged in to accept an invitation');
      return;
    }
    
    return inviteService.updateInviteStatus(inviteId, 'accepted', currentUser.uid);
  };
  
  // Handle invite decline
  const handleDeclineInvite = async (inviteId: string) => {
    return inviteService.updateInviteStatus(inviteId, 'declined');
  };
  
  // Handle maintenance request
  const handleRequestMaintenance = (propertyId: string) => {
    navigate('/maintenance/enhanced', { state: { propertyId } });
  };
  


  // Handle maintenance form submission success
  const handleRequestSuccess = () => {
    toast.success('Maintenance request submitted successfully!');
  };

  // Filter tickets
  const filteredTickets = filter === 'all' 
    ? tickets 
    : tickets.filter(ticket => ticket.status === filter);

  if (!currentUser || !userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-16 h-16 border-4 border-t-teal-600 border-b-teal-600 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Notification Panel */}
      <NotificationPanel 
        isOpen={notificationPanelOpen} 
        onClose={() => setNotificationPanelOpen(false)} 
      />
      
      {/* Header Bar with filter options */}
      <HeaderBar filter={filter} setFilter={setFilter} />
      
      {/* Mobile Notification Button */}
      <div className="md:hidden fixed bottom-4 right-4 z-20">
        <button
          type="button"
          className="p-3 rounded-full bg-[#176B5D] text-white shadow-lg hover:bg-teal-700 focus:outline-none"
          onClick={() => setNotificationPanelOpen(true)}
        >
          <Bell className="h-6 w-6" />
        </button>
      </div>

      <main className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading || propertiesLoading ? (
            // Loading state
            <div className="space-y-6">
              <Skeleton className="h-32 rounded-lg" />
              <Skeleton className="h-64 rounded-lg" />
              {propertiesLoading && (
                <div className="text-center text-gray-600">
                  <p>Loading your property information...</p>
                </div>
              )}
            </div>
          ) : isError ? (
            // Error state
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
              <div className="flex items-center">
                                 <div className="flex-shrink-0 text-red-500">
                   <AlertTriangle className="h-5 w-5" />
                 </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Invitation Banner */}
              {pendingInvites.length > 0 && (
                <div className="space-y-4 mb-8">
                  {pendingInvites.map(invite => (
                    <InvitationBanner
                      key={invite.id}
                      invite={invite}
                      onAccept={handleAcceptInvite}
                      onDecline={handleDeclineInvite}
                    />
                  ))}
                </div>
              )}
              
              {/* Property Management Section */}
              {tenantProperties.length === 0 ? (
                <div className="mb-8">
                  <EmptyStateCard
                    title="No properties assigned"
                    message="You are not currently assigned to any properties. Please accept a property invitation or contact your landlord to get started."
                    actionLabel=""
                    onAction={undefined}
                  />
                </div>
              ) : (
                <div className="mb-8">
                  <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Home className="w-5 h-5 text-orange-500" />
                        Your {tenantProperties.length === 1 ? 'Property' : 'Properties'}
                      </h3>
                    </div>
                    <div className="p-6 space-y-6">
                      {tenantProperties.map((property) => (
                        <div key={property.id} className="space-y-4">
                          <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4 border border-orange-200">
                            <h4 className="text-xl font-bold text-gray-900 mb-2">
                              {property.name || 'Property'}
                            </h4>
                            {property.address && (
                              <div className="text-gray-600">
                                <p className="font-medium">
                                  {property.address.street || property.streetAddress}
                                  {property.address.unit && `, Unit ${property.address.unit}`}
                                </p>
                                <p>
                                  {property.address.city || property.city}, {property.address.state || property.state} {property.address.zipCode || property.zip}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Landlord Contact Information */}
                          {(property.landlord?.name || property.landlord?.email || property.landlord?.phone) && (
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
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
                          <div className="flex gap-3">
                            <Button
                              variant="primary"
                              onClick={() => handleRequestMaintenance(property.id)}
                              className="flex-1"
                            >
                              Request Maintenance
                            </Button>
                          </div>

                          {/* Divider between properties if there are multiple */}
                          {tenantProperties.length > 1 && property.id !== tenantProperties[tenantProperties.length - 1].id && (
                            <hr className="border-gray-200" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Maintenance Section - Only show if tenant has properties */}
              {tenantProperties.length > 0 && (
                <>
                  {permissionError ? (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                      <div className="flex">
                                                 <div className="flex-shrink-0">
                           <AlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                         </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-yellow-800">
                            Permission Issue Detected
                          </h3>
                          <div className="mt-2 text-sm text-yellow-700">
                            <p>
                              You do not have permission to view maintenance requests. This is likely due to a configuration issue with Firestore security rules.
                            </p>
                            <p className="mt-2">
                              Please contact your administrator and ask them to update the Firestore security rules to allow tenants to view tickets they've submitted.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* New Maintenance Request Form */}
                      <div className="lg:col-span-1">
                        <RequestForm 
                          onSuccess={handleRequestSuccess} 
                          currentUser={currentUser}
                          userProfile={userProfile}
                        />
                      </div>
                      
                      {/* Maintenance Request History */}
                      <div className="lg:col-span-2">
                        <RequestHistory 
                          tickets={filteredTickets} 
                          loading={ticketsLoading} 
                          filter={filter}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </main>

    </div>
  );
};

export default TenantDashboard; 