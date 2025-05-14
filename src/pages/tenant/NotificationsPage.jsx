import React, { useState, useEffect, useCallback } from 'react';
import { auth, db, callFunction } from '../../firebase/config'; // Assuming callFunction is exported
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import InvitationCard from '../../components/tenant/InvitationCard'; // Adjust path if needed
import { BellIcon } from '@heroicons/react/24/outline';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingInvite, setProcessingInvite] = useState(null); // Track which invite is being processed

  const currentUser = auth.currentUser;

  // Fetch Notifications
  useEffect(() => {
    if (!currentUser) {
      setError("User not authenticated.");
      setLoading(false);
      return;
    }

    setLoading(true);
    const notificationsRef = collection(db, 'users', currentUser.uid, 'notifications');
    // Query for unread or pending invites, ordered by creation time
    const q = query(notificationsRef, 
                    orderBy('createdAt', 'desc')); 
                    // Add where clauses if needed, e.g., where('status', '==', 'unread')

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedNotifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNotifications(fetchedNotifications);
      setError(null);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching notifications: ", err);
      setError("Failed to load notifications.");
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [currentUser]);

  // Placeholder for Accept Invite Logic
  const handleAcceptInvite = useCallback(async (inviteId) => {
    if (!inviteId) return;
    setProcessingInvite(inviteId); // Set loading state for this card
    setError(null);
    console.log(`Attempting to accept invite: ${inviteId}`);
    try {
      // Call the 'acceptPropertyInvite' Cloud Function
      const result = await callFunction('acceptPropertyInvite', { inviteId: inviteId });
      console.log('Accept invite result:', result);
      alert('Invitation accepted successfully!'); // Basic feedback
      // The notification might update/disappear automatically if the Firestore listener 
      // filters by status='unread'. If not, manual state update might be needed.
    } catch (err) {
      console.error("Error accepting invite:", err);
      const errorMessage = err.message || "An unknown error occurred.";
      setError(`Failed to accept invite: ${errorMessage}`);
      alert(`Error accepting invite: ${errorMessage}`);
    } finally {
      setProcessingInvite(null); // Clear loading state for this card
    }
  }, []);

  // Placeholder for Decline Invite Logic
  const handleDeclineInvite = useCallback(async (inviteId) => {
    if (!inviteId) return;
    setProcessingInvite(inviteId); // Set loading state for this card
    setError(null);
    console.log(`Attempting to decline invite: ${inviteId}`);
    try {
      // Call the 'rejectPropertyInvite' Cloud Function
      const result = await callFunction('rejectPropertyInvite', { inviteId: inviteId });
      console.log('Decline invite result:', result);
      alert('Invitation declined.'); // Basic feedback
    } catch (err) {
      console.error("Error declining invite:", err);
      const errorMessage = err.message || "An unknown error occurred.";
      setError(`Failed to decline invite: ${errorMessage}`);
      alert(`Error declining invite: ${errorMessage}`);
    } finally {
      setProcessingInvite(null); // Clear loading state for this card
    }
  }, []);

  // Filter for property invite notifications to display with InvitationCard
  const inviteNotifications = notifications.filter(n => n.type === 'property_invite' && n.status === 'unread');
  // TODO: Potentially filter other notification types for different display components

  return (
    <div>
      <h1 className="text-2xl font-semibold text-content dark:text-content-dark mb-6 flex items-center">
        <BellIcon className="w-6 h-6 mr-2 text-primary dark:text-primary-light" />
        Notifications
      </h1>

      {loading && <p>Loading notifications...</p>}
      
      {error && (
          <div className="bg-danger-subtle dark:bg-danger-darkSubtle border-l-4 border-danger dark:border-red-400 p-4 rounded-md mb-4">
              <p className="text-sm text-danger dark:text-red-300">Error: {error}</p>
          </div>
      )}

      {!loading && !error && notifications.length === 0 && (
        <p className="text-content-secondary dark:text-content-darkSecondary">You have no new notifications.</p>
      )}

      {!loading && !error && inviteNotifications.length > 0 && (
        <div className="space-y-4">
            <h2 className="text-lg font-medium text-content dark:text-content-dark">Pending Invitations</h2>
            {inviteNotifications.map(invite => (
                <InvitationCard 
                    key={invite.id} 
                    // Assuming notification data structure matches InvitationCard props
                    // The trigger creates `relatedData` containing invite details
                    invite={{
                        inviteId: invite.relatedData?.inviteId || invite.id, // Prefer inviteId from relatedData
                        propertyName: invite.relatedData?.propertyName,
                        landlordName: invite.relatedData?.landlordName,
                        createdAt: invite.createdAt 
                    }}
                    onAccept={handleAcceptInvite}
                    onDecline={handleDeclineInvite}
                    isProcessing={processingInvite === (invite.relatedData?.inviteId || invite.id)}
                />
            ))}
        </div>
      )}
      
      {/* TODO: Display other notification types */} 

    </div>
  );
};

export default NotificationsPage; 