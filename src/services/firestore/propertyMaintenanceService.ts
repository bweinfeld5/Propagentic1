import { 
  doc, 
  getDoc, 
  updateDoc,
  arrayUnion
} from 'firebase/firestore';
import { db } from '../../firebase/config';

/**
 * Add a maintenance request to a property's active requests
 */
export async function addMaintenanceRequestToProperty(
  propertyId: string,
  ticketId: string
): Promise<void> {
  const propertyRef = doc(db, 'properties', propertyId);
  const propertySnapshot = await getDoc(propertyRef);
  
  if (propertySnapshot.exists()) {
    const activeRequests = propertySnapshot.data().activeRequests || [];
    
    // Add request if not already in the list
    if (!activeRequests.includes(ticketId)) {
      await updateDoc(propertyRef, {
        activeRequests: [...activeRequests, ticketId]
      });
    }
  }
}

/**
 * Get all maintenance requests associated with a property
 * @param propertyId - The ID of the property
 * @returns Array of maintenance request data
 */
export async function getMaintenanceRequestsForProperty(propertyId: string): Promise<any[]> {
  try {
    console.log('🔍 [DEBUG] Loading maintenance requests for property:', propertyId);
    
    // Step 1: Get the property document and extract maintenanceRequests array
    const propertyRef = doc(db, 'properties', propertyId);
    const propertySnap = await getDoc(propertyRef);
    
    if (!propertySnap.exists()) {
      console.warn('⚠️  [DEBUG] Property not found:', propertyId);
      return [];
    }
    
    const propertyData = propertySnap.data();
    const requestIds = propertyData.maintenanceRequests || [];
    console.log('🔍 [DEBUG] Found maintenance request IDs:', requestIds);
    
    if (requestIds.length === 0) {
      console.log('✅ [DEBUG] No maintenance requests found for property');
      return [];
    }
    
    // Step 2: Fetch each request using Promise.all
    const requestPromises = requestIds.map(async (requestId: string) => {
      try {
        const requestRef = doc(db, 'tickets', requestId);
        const requestSnap = await getDoc(requestRef);
        
        if (requestSnap.exists()) {
          return {
            id: requestSnap.id,
            ...requestSnap.data()
          };
        } else {
          console.warn('⚠️  [DEBUG] Maintenance request not found:', requestId);
          return null;
        }
      } catch (error) {
        console.warn('❌ [DEBUG] Failed to fetch maintenance request:', requestId, error);
        return null;
      }
    });
    
    const requests = await Promise.all(requestPromises);
    
    // Filter out null results (failed fetches)
    const validRequests = requests.filter(request => request !== null);
    console.log('✅ [DEBUG] Successfully loaded maintenance requests:', validRequests.length);
    
    return validRequests;
    
  } catch (error) {
    console.error('❌ [DEBUG] Error loading maintenance requests for property:', error);
    throw new Error(`Failed to load maintenance requests: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get maintenance requests count for a property
 * @param propertyId - The ID of the property
 * @returns Object with counts by status
 */
export async function getMaintenanceRequestsCount(propertyId: string): Promise<{
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
}> {
  try {
    const requests = await getMaintenanceRequestsForProperty(propertyId);
    
    const counts = {
      total: requests.length,
      pending: 0,
      inProgress: 0,
      completed: 0
    };
    
    requests.forEach(request => {
      switch (request.status) {
        case 'pending_classification':
        case 'open':
        case 'new':
          counts.pending++;
          break;
        case 'in_progress':
        case 'assigned':
          counts.inProgress++;
          break;
        case 'completed':
        case 'resolved':
        case 'closed':
          counts.completed++;
          break;
      }
    });
    
    return counts;
    
  } catch (error) {
    console.error('Error getting maintenance requests count:', error);
    return { total: 0, pending: 0, inProgress: 0, completed: 0 };
  }
}

/**
 * Check if a maintenance request is linked to a property
 * @param propertyId - The ID of the property
 * @param requestId - The ID of the maintenance request
 * @returns boolean indicating if the request is linked
 */
export async function isRequestLinkedToProperty(propertyId: string, requestId: string): Promise<boolean> {
  try {
    const propertyRef = doc(db, 'properties', propertyId);
    const propertySnap = await getDoc(propertyRef);
    
    if (!propertySnap.exists()) {
      return false;
    }
    
    const maintenanceRequests = propertySnap.data().maintenanceRequests || [];
    return maintenanceRequests.includes(requestId);
    
  } catch (error) {
    console.error('Error checking if request is linked to property:', error);
    return false;
  }
}

/**
 * Remove a maintenance request from a property's active requests
 */
export async function removeMaintenanceRequestFromProperty(
  propertyId: string,
  ticketId: string
): Promise<void> {
  const propertyRef = doc(db, 'properties', propertyId);
  const propertySnapshot = await getDoc(propertyRef);
  
  if (propertySnapshot.exists()) {
    const activeRequests = propertySnapshot.data().activeRequests || [];
    
    await updateDoc(propertyRef, {
      activeRequests: activeRequests.filter((id: string) => id !== ticketId)
    });
  }
} 