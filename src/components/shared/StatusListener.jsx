import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';

/**
 * StatusListener component - Listens for real-time updates to tickets relevant to the current user
 * and shows toast notifications for important status changes.
 * 
 * This component doesn't render anything visible but provides real-time sync functionality.
 */
const StatusListener = ({ onStatusUpdate, toastManager }) => {
  const [lastUpdates, setLastUpdates] = useState({});
  
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    
    const userId = currentUser.uid;
    
    // Get user profile to determine role
    const fetchUserRole = async () => {
      try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const userRole = userData.role;
          
          // Set up different listeners based on user role
          setupRoleBasedListeners(userId, userRole);
        }
      } catch (err) {
        console.error('Error getting user role:', err);
      }
    };
    
    fetchUserRole();
    
    // Cleanup on unmount
    return () => {
      // Unsubscribe functions will be returned by setupRoleBasedListeners
      // but we don't need to store them since return () => {} is executed on unmount
    };
  }, [onStatusUpdate, toastManager]);

  const setupRoleBasedListeners = (userId, userRole) => {
    let ticketsRef = collection(db, 'tickets');
    let ticketsQuery;
    
    // Configure different queries based on user role
    if (userRole === 'tenant') {
      // Tenants only see their own tickets
      ticketsQuery = query(
        ticketsRef,
        where('tenantId', '==', userId),
        orderBy('updatedAt', 'desc')
      );
    } else if (userRole === 'contractor') {
      // Contractors see tickets assigned to them
      ticketsQuery = query(
        ticketsRef,
        where('contractorId', '==', userId),
        orderBy('updatedAt', 'desc')
      );
    } else if (userRole === 'landlord') {
      // For landlords, we need to get their properties first
      return setupLandlordListeners(userId);
    } else {
      // Unsupported role
      return;
    }
    
    // Subscribe to ticket updates
    const unsubscribe = onSnapshot(ticketsQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        // We only care about modified documents for status updates
        if (change.type === 'modified') {
          const ticketData = {
            id: change.doc.id,
            ...change.doc.data()
          };
          
          // Process the status update
          processStatusUpdate(ticketData, userRole);
        }
      });
    }, (err) => {
      console.error(`Error in ${userRole} ticket listener:`, err);
    });
    
    return unsubscribe;
  };

  const setupLandlordListeners = async (landlordId) => {
    try {
      // Get properties owned by landlord
      const propertiesRef = collection(db, 'properties');
      const propertyQuery = query(propertiesRef, where('landlordId', '==', landlordId));
      
      // eslint-disable-next-line no-undef
      const propertySnapshot = await getDocs(propertyQuery);
      const propertyIds = propertySnapshot.docs.map(doc => doc.id);
      
      if (propertyIds.length === 0) {
        return; // No properties to monitor
      }
      
      // Create a listener for tickets associated with any of the landlord's properties
      const ticketsRef = collection(db, 'tickets');
      const ticketsQuery = query(
        ticketsRef,
        where('propertyId', 'in', propertyIds),
        orderBy('updatedAt', 'desc')
      );
      
      const unsubscribe = onSnapshot(ticketsQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          // We only care about modified documents for status updates
          if (change.type === 'modified') {
            const ticketData = {
              id: change.doc.id,
              ...change.doc.data()
            };
            
            // Process the status update
            processStatusUpdate(ticketData, 'landlord');
          }
        });
      }, (err) => {
        console.error('Error in landlord ticket listener:', err);
      });
      
      return unsubscribe;
    } catch (err) {
      console.error('Error setting up landlord listeners:', err);
    }
  };

  const processStatusUpdate = (ticket, userRole) => {
    const ticketId = ticket.id;
    const currentStatus = ticket.status;
    const previousUpdate = lastUpdates[ticketId];
    
    // Skip if this is the first time we're seeing this ticket
    if (!previousUpdate) {
      setLastUpdates(prev => ({
        ...prev,
        [ticketId]: {
          status: currentStatus,
          timestamp: new Date()
        }
      }));
      return;
    }
    
    // Skip if status hasn't changed
    if (previousUpdate.status === currentStatus) {
      return;
    }
    
    // Status has changed, create notification
    const statusMessages = {
      pending_classification: 'Your request is being processed',
      ready_to_dispatch: 'Looking for an available contractor',
      pending_acceptance: 'Waiting for contractor to accept',
      accepted: 'A contractor has accepted your request',
      in_progress: 'Work on your request has started',
      completed: 'Your maintenance request has been completed',
      rejected: 'Contractor has declined this job',
      escalated: 'This issue has been escalated'
    };
    
    // Role-specific messages for the same status change
    const roleSpecificMessages = {
      contractor: {
        pending_acceptance: 'You have a new job request',
        escalated: 'A job has been escalated by the landlord'
      },
      landlord: {
        accepted: 'Contractor has accepted the assignment',
        rejected: 'Contractor declined the assignment',
        completed: 'Maintenance work has been completed',
        escalated: 'A ticket has been automatically escalated'
      }
    };
    
    // Get appropriate message based on role and status
    const message = 
      (roleSpecificMessages[userRole] && roleSpecificMessages[userRole][currentStatus]) || 
      statusMessages[currentStatus] || 
      `Status updated to ${currentStatus}`;
    
    // Determine notification type
    const notificationType = 
      currentStatus === 'completed' ? 'success' :
      currentStatus === 'rejected' || currentStatus === 'escalated' ? 'error' :
      currentStatus === 'in_progress' ? 'info' : 'default';
    
    // Show toast notification if toast manager is provided
    if (toastManager && typeof toastManager.show === 'function') {
      toastManager.show({
        title: message,
        description: `Ticket #${ticketId.substring(0, 6)} for ${ticket.propertyName || 'your property'}`,
        status: notificationType,
        duration: 5000,
        isClosable: true,
      });
    }
    
    // Update last known status
    setLastUpdates(prev => ({
      ...prev,
      [ticketId]: {
        status: currentStatus,
        timestamp: new Date()
      }
    }));
    
    // Trigger callback if provided
    if (onStatusUpdate && typeof onStatusUpdate === 'function') {
      onStatusUpdate(ticket);
    }
  };

  // This component doesn't render anything visible
  return null;
};

export default StatusListener; 