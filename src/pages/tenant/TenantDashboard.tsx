import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Bell, Menu, Home, User } from 'lucide-react';
import { PropAgenticMark } from '../../components/brand/PropAgenticMark';
import EmptyStateCard from '../../components/EmptyStateCard';
import InvitationBanner from '../../components/InvitationBanner';
import PropertyList from '../../components/PropertyList';
import { Skeleton } from '../../components/ui/Skeleton';
import Button from '../../components/ui/Button';
import TenantInviteModal from '../../components/tenant/TenantInviteModal';
import inviteService from '../../services/firestore/inviteService';
import dataService from '../../services/dataService';

const TenantDashboard: React.FC = () => {
  console.log('RENDERING TenantDashboard.TSX'); // DEBUG LINE
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [tenantProperties, setTenantProperties] = useState<any[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  
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
          userType: userProfile?.userType || userProfile?.role || 'tenant' // Ensure userType is set
        });
        
        // Fetch pending invites
        if (currentUser.email) {
          const invites = await inviteService.getPendingInvitesForTenant(currentUser.email);
          setPendingInvites(invites || []);
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
    navigate('/maintenance/new', { state: { propertyId } });
  };
  
  // Handle opening invite modal
  const openInviteModal = () => {
    setShowInviteModal(true);
  };
  
  // Handle closing invite modal
  const closeInviteModal = () => {
    setShowInviteModal(false);
  };
  
  // Handle successful invite code redemption
  const handleInviteSuccess = (propertyInfo: {
    propertyId: string;
    propertyName: string;
    unitId?: string | null;
  }) => {
    // Refresh the tenant data after adding a property
    const fetchUpdatedProperties = async () => {
      setIsLoading(true);
      try {
        const property = await dataService.getPropertyById(propertyInfo.propertyId);
        if (property) {
          setTenantProperties(prev => [...prev, property]);
        }
      } catch (error) {
        console.error('Error fetching updated property:', error);
        toast.error('Property added, but could not load details. Please refresh.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUpdatedProperties();
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-[--pa-blue-50]">
      {/* <p>DEBUG: TSX VERSION</p> */}
      {/* Top Bar */}
      <header className="sticky top-0 z-10 h-16 bg-white shadow-sm px-4 flex justify-between items-center">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" className="md:hidden mr-2 !p-1">
            <Menu className="h-5 w-5" />
          </Button>
          <PropAgenticMark size={32} />
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" className="!p-1">
            <Bell className="h-5 w-5" />
          </Button>
          
          <Button variant="ghost" size="sm" className="rounded-full bg-pa-blue-50 !p-1">
            <User className="h-5 w-5 text-pa-blue-600" />
          </Button>
        </div>
      </header>
      
      <main className="flex-1 p-6 md:p-10 space-y-8">
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
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
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
            )}
            
            {/* Content area */}
            {tenantProperties.length === 0 ? (
              <EmptyStateCard
                title="No properties yet"
                message="Accept an invitation from your property manager to unlock maintenance tools."
                actionLabel="I have an invite code"
                onAction={openInviteModal}
              />
            ) : (
              <PropertyList
                properties={tenantProperties}
                onRequestMaintenance={handleRequestMaintenance}
              />
            )}
          </>
        )}
      </main>
      
      {/* Tenant Invite Modal */}
      <TenantInviteModal 
        isOpen={showInviteModal}
        onClose={closeInviteModal}
        onSuccess={handleInviteSuccess}
      />
    </div>
  );
};

export default TenantDashboard; 