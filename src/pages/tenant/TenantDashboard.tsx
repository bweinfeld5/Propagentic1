import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { Bell, Menu, Home, User, BellIcon, AlertTriangle, QrCodeIcon, KeyIcon } from 'lucide-react';
import { db } from '../../firebase/config';
import { collection, query, where, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { PropAgenticMark } from '../../components/brand/PropAgenticMark';
import EmptyStateCard from '../../components/EmptyStateCard';
import InvitationBanner from '../../components/InvitationBanner';
import PropertyInvitationBanner from '../../components/PropertyInvitationBanner';
import PropertyList from '../../components/PropertyList';
import { Skeleton } from '../../components/ui/Skeleton';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import RequestForm from '../../components/tenant/RequestForm';
import RequestHistory from '../../components/tenant/RequestHistory';
import HeaderBar from '../../components/layout/HeaderBar';
import NotificationPanel from '../../components/layout/NotificationPanel';
import inviteService from '../../services/firestore/inviteService';
import propertyInvitationService from '../../services/firestore/propertyInvitationService';
import dataService from '../../services/dataService';
import { getDemoProperty, getDemoMaintenanceTickets, isDemoProperty } from '../../services/demoDataService';
import { QRScanner } from '../../components/tenant/QRScanner';
import { unifiedInviteService } from '../../services/unifiedInviteService';

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
  
  // Property and invite states
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [pendingPropertyInvitations, setPendingPropertyInvitations] = useState<any[]>([]);
  const [tenantProperties, setTenantProperties] = useState<any[]>([]);
  
  // Maintenance/ticket states
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [permissionError, setPermissionError] = useState(false);
  
  // Notification states
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  
  // QR Scanner state
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [processingQR, setProcessingQR] = useState(false);
  
  // Temporary bypass state - for testing tenant view without data
  const [showBypassTenantView, setShowBypassTenantView] = useState(false);

  // Mock property for bypass mode
  const mockBypassProperty = {
    id: 'bypass-property-demo',
    name: 'Demo Property - Empty State',
    nickname: 'Demo Property',
    streetAddress: '123 Demo St',
    landlordName: 'Demo Landlord',
    landlordEmail: 'demo@landlord.com'
  };

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
        
        // Fetch pending invites (traditional invite codes)
        if (currentUser.email) {
          const invites = await inviteService.getPendingInvitesForTenant(currentUser.email);
          setPendingInvites(invites || []);
        }

        // Fetch pending property invitations (from landlords to existing tenants)
        if (currentUser.email && currentUser.uid) {
          const propertyInvitations = await propertyInvitationService.getPendingPropertyInvitations(currentUser.email);
          setPendingPropertyInvitations(propertyInvitations || []);
        }
        
        // Fetch associated properties if the tenant has any
        if (userProfile?.propertyId) {
          const property = await dataService.getPropertyById(userProfile.propertyId);
          if (property) {
            setTenantProperties([property]);
          }
        } else {
          setTenantProperties([]);
        }
      } catch (error) {
        console.error('Error fetching tenant data:', error);
        setIsError(true);
        setErrorMessage('Failed to load your dashboard. Please try again later.');
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
  
  // Handle invite acceptance (traditional invites)
  const handleAcceptInvite = async (inviteId: string) => {
    if (!currentUser?.uid) {
      toast.error('You must be logged in to accept an invitation');
      return;
    }
    
    return inviteService.updateInviteStatus(inviteId, 'accepted', currentUser.uid);
  };
  
  // Handle invite decline (traditional invites)
  const handleDeclineInvite = async (inviteId: string) => {
    return inviteService.updateInviteStatus(inviteId, 'declined');
  };

  // Handle property invitation acceptance
  const handleAcceptPropertyInvitation = async (invitationId: string) => {
    if (!currentUser?.uid) {
      toast.error('You must be logged in to accept an invitation');
      return;
    }
    
    try {
      await propertyInvitationService.acceptPropertyInvitation(invitationId, currentUser.uid);
      // Remove from pending invitations
      setPendingPropertyInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      // Refresh tenant data to show new property
      // You might want to add logic here to fetch the property details and add to tenantProperties
    } catch (error) {
      console.error('Error accepting property invitation:', error);
      throw error;
    }
  };
  
  // Handle property invitation decline
  const handleDeclinePropertyInvitation = async (invitationId: string) => {
    try {
      await propertyInvitationService.declinePropertyInvitation(invitationId);
      // Remove from pending invitations
      setPendingPropertyInvitations(prev => prev.filter(inv => inv.id !== invitationId));
    } catch (error) {
      console.error('Error declining property invitation:', error);
      throw error;
    }
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

  const handleQRScan = async (scannedCode: string) => {
    setProcessingQR(true);
    
    try {
      // Extract invite code from QR data
      let inviteCode = scannedCode;
      
      // If it's a URL, extract the code parameter
      if (scannedCode.includes('/invite/')) {
        const url = new URL(scannedCode);
        const pathParts = url.pathname.split('/');
        inviteCode = pathParts[pathParts.length - 1];
      } else if (scannedCode.includes('code=')) {
        const url = new URL(scannedCode);
        inviteCode = url.searchParams.get('code') || scannedCode;
      }
      
      // Navigate to invite acceptance page with QR source parameter
      navigate(`/invite/${inviteCode}?source=qr`);
      
      setShowQRScanner(false);
      
    } catch (error: any) {
      console.error('Error processing QR code:', error);
      toast.error('Invalid QR code. Please try scanning again.');
    } finally {
      setProcessingQR(false);
    }
  };

  // Component for the No Properties state with invite code functionality
  const NoPropertiesInviteCard: React.FC<{
    onInviteValidated: (propertyInfo: any) => void;
  }> = ({ onInviteValidated }) => {
    const [inviteCode, setInviteCode] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [validationMessage, setValidationMessage] = useState<{
      type: 'success' | 'error';
      message: string;
    } | null>(null);
    const [showInviteSection, setShowInviteSection] = useState(false);

    const handleInviteCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.toUpperCase().replace(/\s/g, '');
      setInviteCode(value);
      if (validationMessage) {
        setValidationMessage(null);
      }
    };

    const validateCode = async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }

      if (!inviteCode.trim()) {
        setValidationMessage({
          type: 'error',
          message: 'Please enter an invite code'
        });
        return;
      }

      setIsValidating(true);
      setValidationMessage(null);

      try {
        const validationResult = await unifiedInviteService.validateInviteCode(inviteCode.trim());
        
        if (validationResult.isValid) {
          setValidationMessage({
            type: 'success',
            message: 'Valid invite code!'
          });
          
          onInviteValidated({
            propertyId: validationResult.propertyId!,
            propertyName: validationResult.propertyName || 'Property',
            unitId: validationResult.unitId,
            inviteCode: inviteCode.trim()
          });
        } else {
          setValidationMessage({
            type: 'error',
            message: validationResult.message
          });
        }
      } catch (error: any) {
        setValidationMessage({
          type: 'error',
          message: error.message || 'Error validating invite code. Please try again.'
        });
      } finally {
        setIsValidating(false);
      }
    };

    return (
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-200 p-8 text-center">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Home className="w-8 h-8 text-orange-600" />
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Properties Found</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          You're not currently associated with any properties. Contact your landlord to get an invitation code to join a property.
        </p>

        {/* Invite Code Section */}
        <div className="max-w-md mx-auto mb-6">
          <button
            onClick={() => setShowInviteSection(!showInviteSection)}
            className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <KeyIcon className="w-5 h-5" />
            {showInviteSection ? 'Hide Invite Code Entry' : 'Enter Invite Code'}
          </button>
          
          {showInviteSection && (
            <div className="mt-4 p-4 bg-white rounded-lg border border-orange-200 text-left">
              <form onSubmit={validateCode} className="space-y-4">
                <div>
                  <label htmlFor="invite-code" className="block text-sm font-medium text-gray-700 mb-2">
                    Property Invite Code
                  </label>
                  <Input
                    id="invite-code"
                    type="text"
                    value={inviteCode}
                    onChange={handleInviteCodeChange}
                    placeholder="Enter code (e.g., BWNR3QPR)"
                    maxLength={12}
                    autoComplete="off"
                    disabled={isValidating}
                    className={`w-full font-mono ${
                      validationMessage?.type === 'error'
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                        : validationMessage?.type === 'success'
                        ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                        : 'border-orange-300 focus:border-orange-500 focus:ring-orange-500'
                    }`}
                  />
                  
                  {validationMessage && (
                    <p className={`text-sm mt-2 ${
                      validationMessage.type === 'success' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {validationMessage.message}
                    </p>
                  )}
                </div>
                
                <Button
                  type="submit"
                  disabled={isValidating || !inviteCode.trim()}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                >
                  {isValidating ? 'Validating...' : 'Join Property'}
                </Button>
              </form>
            </div>
          )}
        </div>

        {/* What can you do section */}
        <div className="bg-white rounded-lg p-4 border border-orange-200 text-left max-w-sm mx-auto">
          <h4 className="font-medium text-gray-900 mb-2">What can you do?</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Ask your landlord for an invitation code</li>
            <li>• Check your email for pending invitations</li>
            <li>• Contact PropAgentic support if you need help</li>
          </ul>
          
          <div className="mt-4 pt-3 border-t border-gray-200">
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="w-full text-orange-600 border-orange-300 hover:bg-orange-50"
            >
              Refresh Page
            </Button>
          </div>
        </div>
      </div>
    );
  };

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
          {isLoading ? (
            // Loading state
            <div className="space-y-6">
              <Skeleton className="h-32 rounded-lg" />
              <Skeleton className="h-64 rounded-lg" />
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
              {/* Invitation Banners */}
              {(pendingInvites.length > 0 || pendingPropertyInvitations.length > 0) && (
                <div className="space-y-4 mb-8">
                  {/* Traditional invite codes */}
                  {pendingInvites.map(invite => (
                    <InvitationBanner
                      key={invite.id}
                      invite={invite}
                      onAccept={handleAcceptInvite}
                      onDecline={handleDeclineInvite}
                    />
                  ))}
                  
                  {/* Property invitations from landlords */}
                  {pendingPropertyInvitations.map(invitation => (
                    <PropertyInvitationBanner
                      key={invitation.id}
                      invitation={invitation}
                      onAccept={handleAcceptPropertyInvitation}
                      onDecline={handleDeclinePropertyInvitation}
                    />
                  ))}
                </div>
              )}
              
              {/* Property Management Section */}
              {tenantProperties.length === 0 ? (
                <div className="mb-8">
                  {pendingPropertyInvitations.length === 0 && pendingInvites.length === 0 ? (
                    <NoPropertiesInviteCard onInviteValidated={(propertyInfo) => {
                      // Handle the validated property info
                      console.log('Validated property info:', propertyInfo);
                      toast.success(`Found property: ${propertyInfo.propertyName}`);
                    }} />
                  ) : (
                    <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-6 text-center">
                      <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <BellIcon className="w-6 h-6 text-yellow-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Pending Invitations</h3>
                      <p className="text-gray-600">
                        You have pending property invitations above. Accept them to start managing your properties.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mb-8">
                  <PropertyList
                    properties={tenantProperties}
                    onRequestMaintenance={handleRequestMaintenance}
                  />
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

              {/* Enhanced Action Buttons */}
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  {/* Existing buttons */}
                  
                  {/* QR Code Scanner Button */}
                  <Button
                    onClick={() => setShowQRScanner(true)}
                    variant="outline"
                    className="flex items-center justify-center gap-2 p-4 h-auto"
                  >
                    <QrCodeIcon className="w-6 h-6 text-orange-600" />
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">Scan QR Code</div>
                      <div className="text-sm text-gray-600">Join a new property</div>
                    </div>
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* QR Scanner Modal */}
      <QRScanner
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScan={handleQRScan}
        isLoading={processingQR}
      />
    </div>
  );
};

export default TenantDashboard; 