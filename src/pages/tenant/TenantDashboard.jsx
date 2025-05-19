import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import dataService from '../../services/dataService';
import Button from '../../components/ui/Button';
import { HomeIcon, EnvelopeOpenIcon, ExclamationTriangleIcon, TicketIcon, ArrowUpTrayIcon, BellAlertIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { query, collection, where, getDocs, addDoc, serverTimestamp, orderBy, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; // Import storage functions
import { db, storage } from '../../firebase/config'; // Import storage
import MaintenanceRequestModal from '../../components/tenant/MaintenanceRequestModal'; // Import the modal
import StatusPill from '../../components/ui/StatusPill'; // Import StatusPill
import InvitationCard from '../../components/tenant/InvitationCard';
import toast from 'react-hot-toast';
import { getPendingInvitesForTenant, acceptInvite, deleteInvite } from '../../services/firestore/inviteService';

const TenantDashboard = () => {
  console.log('RENDERING TenantDashboard.JSX'); // DEBUG LINE
  // COMPONENT_TRACE_LOGGER
  useEffect(() => {
    console.log('COMPONENT_LOADED: TenantDashboard.jsx');
    // Save to local storage for debugging
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('LAST_COMPONENT_LOADED', 'TenantDashboard.jsx');
        localStorage.setItem('LAST_COMPONENT_LOAD_TIME', new Date().toISOString());
      } catch (e) {
        console.error('Could not write to localStorage');
      }
    }
  }, []);

  const { currentUser, userProfile, loading: authLoading, fetchUserProfile } = useAuth();
  const [pendingInvites, setPendingInvites] = useState([]);
  const [propertyDetails, setPropertyDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for Maintenance Modal
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [submitError, setSubmitError] = useState(''); // Separate error state for submission
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false); // Separate loading for requests
  const [isLoadingInvites, setIsLoadingInvites] = useState(true);
  const [isProcessingInvite, setIsProcessingInvite] = useState(false); // To disable buttons during action

  // Fetch initial data (Invites or Property Details)
  useEffect(() => {
    let isMounted = true; // Prevent state updates on unmounted component
    let invitesListener = null; // Store listener cleanup
    let ticketsListener = null;

    if (authLoading) return; 
    if (!currentUser) { 
        setIsLoading(false);
        setError("Not authenticated");
        return; 
    }
    
    dataService.configure({ isDemoMode: false, currentUser });

    const fetchData = async () => {
      if (!isMounted) return;
      setIsLoading(true);
      setError(null);
      setPendingInvites([]);
      setPropertyDetails(null);
      setMaintenanceRequests([]);

      try {
        console.log('[TenantDashboard] Fetching data. CurrentUser:', currentUser, 'User Profile from context:', userProfile);
        const currentProfile = userProfile || await fetchUserProfile(currentUser.uid);
        console.log('[TenantDashboard] Fetched currentProfile:', currentProfile);

        if (!currentProfile) {
          console.warn('[TenantDashboard] No user profile found. Attempting to fetch invites.');
          if (!currentUser?.email) {
            console.error('[TenantDashboard] Cannot fetch invites: currentUser email is missing.');
            setError("User email not found. Cannot fetch invitations.");
            setIsLoading(false);
            return;
          }
        }
        
        if (currentProfile?.propertyId) {
          console.log('[TenantDashboard] Tenant associated with property:', currentProfile.propertyId);
          const details = await dataService.getPropertyById(currentProfile.propertyId);
          if (!isMounted) return;
          setPropertyDetails(details);
          
          // Fetch Maintenance Requests if property exists
          setRequestsLoading(true);
          const ticketsQuery = query(
            collection(db, 'tickets'),
            where('tenantId', '==', currentUser.uid),
            where('propertyId', '==', currentProfile.propertyId),
            orderBy('createdAt', 'desc')
          );
          ticketsListener = onSnapshot(ticketsQuery, (snapshot) => {
             if (!isMounted) return;
             const requestsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
             setMaintenanceRequests(requestsData);
             setRequestsLoading(false);
          }, (err) => {
             if (!isMounted) return;
             console.error("Error fetching maintenance requests:", err);
             setError("Failed to load maintenance requests."); // Can use a separate error state if preferred
             setRequestsLoading(false);
          });
          
        } else {
          console.log('[TenantDashboard] No propertyId found. Fetching pending invites for email:', currentUser?.email);
          if (!currentUser?.email) {
            console.error('[TenantDashboard] Critical error: Attempting to fetch invites without an email.');
            setError("Unable to fetch invites: User email is not available.");
            setIsLoading(false);
            return;
          }
          const invitesCollectionRef = collection(db, 'invites');
          const invitesQuery = query(
            invitesCollectionRef,
            where('tenantEmail', '==', currentUser.email),
            where('status', '==', 'pending')
          );
          // Use onSnapshot for real-time invite updates
          invitesListener = onSnapshot(invitesQuery, (inviteSnapshot) => {
              if (!isMounted) return;
              const invites = inviteSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
              console.log('Found invites:', invites);
              setPendingInvites(invites);
          }, (err) => {
              if (!isMounted) return;
              console.error("Error fetching invites:", err);
              setError(err.message || "Failed to load invitations.");
          });
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("[TenantDashboard] Error in fetchData try block:", err);
        setError(err.message || "Failed to load dashboard data.");
      } finally {
         if (isMounted) {
            setIsLoading(false); // Set main loading false after initial check
         } 
      }
    };

    fetchData();

    // Cleanup listeners
    return () => {
        isMounted = false;
        if (invitesListener) invitesListener();
        if (ticketsListener) ticketsListener();
    };
    
  }, [currentUser, userProfile, authLoading, fetchUserProfile]); // Added fetchUserProfile dependency

  // Fetch pending invites function
  const fetchInvites = useCallback(async () => {
    if (!currentUser || !currentUser.email) {
      // Don't fetch if user or email is not available yet
      // Maybe wait for auth context to be fully loaded
      console.log("User email not available yet for fetching invites.");
      setIsLoadingInvites(false);
      return;
    }
    
    setIsLoadingInvites(true);
    setError('');
    try {
      const invites = await getPendingInvitesForTenant(currentUser.email);
      setPendingInvites(invites);
    } catch (err) {
      console.error("Error fetching pending invites:", err);
      setError('Failed to load pending invitations. Please refresh.');
      toast.error('Could not load invitations.');
    } finally {
      setIsLoadingInvites(false);
    }
  }, [currentUser]); // Depend on currentUser

  // Fetch invites on component mount and when currentUser changes
  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  // Handle accepting an invite
  const handleAcceptInvite = async (inviteId) => {
    if (!currentUser || !currentUser.uid) {
      toast.error("Authentication error.");
      return;
    }
    setIsProcessingInvite(true);
    try {
      await acceptInvite(inviteId, currentUser.uid);
      toast.success('Invitation accepted!');
      // Refresh the list of invites
      fetchInvites(); 
    } catch (err) {
      console.error("Error accepting invite:", err);
      toast.error(err.message || 'Failed to accept invitation.');
    } finally {
      setIsProcessingInvite(false);
    }
  };

  // Handle declining an invite
  const handleDeclineInvite = async (inviteId) => {
    setIsProcessingInvite(true);
    try {
      await deleteInvite(inviteId);
      toast.success('Invitation declined.');
      // Refresh the list of invites
      fetchInvites(); 
    } catch (err) {
      console.error("Error declining invite:", err);
      toast.error(err.message || 'Failed to decline invitation.');
    } finally {
      setIsProcessingInvite(false);
    }
  };

  // Handle Maintenance Request Submission
  const handleMaintenanceSubmit = async (requestData) => {
    if (!currentUser || !userProfile?.propertyId) {
      throw new Error("User or property information is missing.");
    }
    setSubmitError(''); // Clear previous errors
    
    try {
      // 1. Upload Photos (if any) to Firebase Storage
      let photoURLs = [];
      if (requestData.photos && requestData.photos.length > 0) {
        console.log(`Uploading ${requestData.photos.length} photos...`);
        const uploadPromises = requestData.photos.map(async (photoFile) => {
          const storageRef = ref(storage, `tickets/${userProfile.propertyId}/${Date.now()}_${photoFile.name}`);
          await uploadBytes(storageRef, photoFile);
          return await getDownloadURL(storageRef);
        });
        photoURLs = await Promise.all(uploadPromises);
        console.log("Photo URLs:", photoURLs);
      }

      // 2. Prepare ticket data for Firestore
      const ticketPayload = {
        tenantId: currentUser.uid,
        propertyId: userProfile.propertyId,
        description: requestData.description,
        issueType: requestData.issueType,
        urgencyLevel: requestData.urgencyLevel,
        photos: photoURLs, // Add uploaded photo URLs
        status: 'new', // Initial status
        // Add propertyName and tenantName if needed by dataService or backend
        propertyName: propertyDetails?.name || 'Unknown Property',
        tenantName: currentUser.displayName || currentUser.email,
      };
      
      // 3. Call dataService to create the ticket
      await dataService.createMaintenanceTicket(ticketPayload);
      console.log("Maintenance request submitted successfully.");
      // Request list will update automatically due to onSnapshot listener
      
    } catch (err) {
      console.error("Error submitting maintenance request:", err);
      setSubmitError(err.message || 'Failed to submit request.');
      // Re-throw the error so the modal can display it
      throw err;
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary dark:border-primary-light"></div>
      </div>
    );
  }

  return (
    <div>
      {/* <p>DEBUG: JSX VERSION</p> */}
      <h1 className="text-2xl font-semibold text-content dark:text-content-dark mb-6">
        Tenant Dashboard
      </h1>

      {error && (
        <div className="bg-danger-subtle dark:bg-danger-darkSubtle border-l-4 border-danger dark:border-red-400 p-4 rounded-md mb-6">
            <div className="flex">
                <div className="flex-shrink-0">
                    <ExclamationTriangleIcon className="h-5 w-5 text-danger dark:text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                    <p className="text-sm text-danger dark:text-red-300">Error: {error}</p>
                </div>
            </div>
        </div>
      )}

      {/* Display Invitations */} 
      {!propertyDetails && pendingInvites.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-medium text-content dark:text-content-dark mb-3 flex items-center">
            <BellAlertIcon className="w-5 h-5 mr-2 text-primary dark:text-primary-light"/>
            You have pending property invitations!
          </h2>
          <div className="space-y-4">
            {pendingInvites.map(invite => (
              <InvitationCard 
                key={invite.id} 
                invite={invite} 
                onAccept={handleAcceptInvite} 
                onDecline={handleDeclineInvite} 
                isProcessing={isProcessingInvite} 
              />
            ))}
          </div>
        </div>
      )}

      {/* Display Property Info */} 
      {propertyDetails && (
         <div className="mb-8 bg-background dark:bg-background-darkSubtle p-6 rounded-lg shadow border border-border dark:border-border-dark">
           <h2 className="text-lg font-medium text-content dark:text-content-dark mb-3 flex items-center">
             <HomeIcon className="w-5 h-5 mr-2 text-primary dark:text-primary-light"/>
             Your Property
           </h2>
           <p><span className="font-medium">Address:</span> {propertyDetails.address?.street || 'N/A'}, {propertyDetails.address?.city || 'N/A'}, {propertyDetails.address?.state || 'N/A'} {propertyDetails.address?.zip || 'N/A'}</p>
           {/* TODO: Add landlord contact info if available in propertyDetails */}
         </div>
      )}
      
      {/* Display Placeholder if no property and no invites */}
       {!propertyDetails && pendingInvites.length === 0 && !isLoading && !authLoading && !error && (
           <div className="bg-background dark:bg-background-darkSubtle p-8 rounded-lg shadow-md border border-border dark:border-border-dark text-center flex flex-col items-center">
                <EnvelopeIcon className="w-16 h-16 text-primary dark:text-primary-light mb-6" />
                <h3 className="text-xl font-semibold text-content dark:text-content-dark mb-2">You're not yet connected to a property.</h3>
                <p className="text-content-secondary dark:text-content-darkSecondary max-w-md mx-auto mb-1">
                    To get started, please ask your property manager to send an invitation to your email address:
                </p>
                <p className="text-md font-medium text-accent dark:text-accent-dark mb-4">{currentUser.email}</p>
                <p className="text-sm text-content-subtle dark:text-content-darkSubtle max-w-md mx-auto">
                    Once they send it, your invitation will appear here automatically. If you've already been invited, it might take a moment to show up.
                </p>
           </div>
       )}

      {/* Maintenance Request Section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-content dark:text-content-dark mb-4">
          Maintenance Requests
        </h2>
        {propertyDetails ? (
            <div>
                {/* Button to open the modal */}
                <Button 
                  variant="primary" 
                  onClick={() => setIsMaintenanceModalOpen(true)} 
                  icon={<ArrowUpTrayIcon className="w-5 h-5"/>}
                 >
                    Submit New Request
                </Button>
                {submitError && (
                    <p className="text-sm text-danger mt-2">Submit Error: {submitError}</p>
                )}
                <div className="mt-4">
                   {/* Display Past Requests */} 
                   {requestsLoading && <p>Loading requests...</p>}
                   {!requestsLoading && maintenanceRequests.length === 0 && (
                       <p className="text-content-secondary dark:text-content-darkSecondary">You haven't submitted any maintenance requests yet.</p>
                   )}
                   {!requestsLoading && maintenanceRequests.length > 0 && (
                       <div className="space-y-3">
                           {maintenanceRequests.map(req => (
                               <div key={req.id} className="bg-background dark:bg-background-darkSubtle p-4 rounded-lg shadow-sm border border-border dark:border-border-dark">
                                   <div className="flex justify-between items-center mb-1">
                                       <p className="text-sm font-medium text-content dark:text-content-dark truncate" title={req.description}>{req.description?.substring(0, 80)}{req.description?.length > 80 ? '...' : ''}</p>
                                       <StatusPill status={req.status} />
                                   </div>
                                   <p className="text-xs text-content-secondary dark:text-content-darkSecondary">
                                       Submitted: {req.createdAt?.toDate ? req.createdAt.toDate().toLocaleDateString() : 'N/A'}
                                   </p>
                                   {/* Optionally show more details like assigned contractor */} 
                               </div>
                           ))}
                       </div>
                   )}
                </div>
            </div>
        ) : (
            <p className="text-content-secondary dark:text-content-darkSecondary">You need to be associated with a property to submit maintenance requests.</p>
        )}
      </div>
      
      {/* Render Maintenance Modal */}
      <MaintenanceRequestModal 
        isOpen={isMaintenanceModalOpen}
        onClose={() => setIsMaintenanceModalOpen(false)}
        onSubmit={handleMaintenanceSubmit}
      />

    </div>
  );
};

export default TenantDashboard; 