import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
  updateDoc,
  deleteDoc,
  arrayRemove,
  runTransaction
} from 'firebase/firestore';
import { db } from '../firebase/config';

interface MaintenanceRequest {
  id: string;
  category: string;
  status: string;
  timestamp: string;
  unitNumber?: string;
  description?: string;
  title?: string;
  submittedBy?: string;
  createdAt?: any;
  [key: string]: any;
}

/**
 * Get maintenance requests for a tenant based on their tenant profile properties
 */
export const getMaintenanceRequestsForTenant = async (tenantId: string): Promise<MaintenanceRequest[]> => {
  try {
    console.log('🔍 Getting maintenance requests for tenant:', tenantId);
    
    // Step 1: Get the tenant's propertyId from tenantProfile.properties array
    const tenantProfileRef = doc(db, 'tenantProfiles', tenantId);
    const tenantProfileSnap = await getDoc(tenantProfileRef);
    
    if (!tenantProfileSnap.exists()) {
      console.log('❌ Tenant profile not found for:', tenantId);
      return [];
    }
    
    const tenantProfile = tenantProfileSnap.data();
    const propertyIds = tenantProfile.properties || [];
    console.log('🏠 Property IDs found in tenant profile:', propertyIds);
    
    if (propertyIds.length === 0) {
      console.log('⚠️  No properties found in tenant profile');
      return [];
    }
    
    // Step 2: For each property, get the maintenance requests
    const allRequests: MaintenanceRequest[] = [];
    
    for (const propertyId of propertyIds) {
      console.log(`🔍 Checking property ${propertyId} for maintenance requests...`);
      
      // Step 3: Query the properties collection to get the property document
      const propertyRef = doc(db, 'properties', propertyId);
      const propertySnap = await getDoc(propertyRef);
      
      if (!propertySnap.exists()) {
        console.warn(`⚠️  Property ${propertyId} not found`);
        continue;
      }
      
      const propertyData = propertySnap.data();
      
      // Step 4: Check for maintenanceRequests array in the property document
      const maintenanceRequestIds = propertyData.maintenanceRequests || [];
      console.log(`📋 Found ${maintenanceRequestIds.length} maintenance request IDs in property ${propertyId}:`, maintenanceRequestIds);
      
      if (maintenanceRequestIds.length === 0) {
        console.log(`ℹ️  No maintenance requests found for property ${propertyId}`);
        continue;
      }
      
      // Step 5: Fetch the associated maintenanceRequests documents from Firestore
      for (const requestId of maintenanceRequestIds) {
        try {
          console.log(`📄 Fetching maintenance request: ${requestId}`);
          const requestRef = doc(db, 'maintenanceRequests', requestId);
          const requestSnap = await getDoc(requestRef);
          
          if (requestSnap.exists()) {
            const requestData = requestSnap.data();
            allRequests.push({
              id: requestSnap.id,
              ...requestData
            } as MaintenanceRequest);
            console.log(`✅ Successfully fetched maintenance request: ${requestId}`);
          } else {
            console.warn(`⚠️  Maintenance request ${requestId} not found`);
          }
        } catch (error) {
          console.error(`❌ Error fetching maintenance request ${requestId}:`, error);
        }
      }
    }
    
    // Sort by timestamp/createdAt (newest first)
    allRequests.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.timestamp || 0);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.timestamp || 0);
      return dateB.getTime() - dateA.getTime();
    });
    
    console.log(`🎉 Successfully fetched ${allRequests.length} total maintenance requests for tenant`);
    return allRequests;
    
  } catch (error) {
    console.error('❌ Error fetching maintenance requests for tenant:', error);
    throw error;
  }
};

/**
 * Subscribe to maintenance requests for a tenant with real-time updates
 */
export const subscribeToMaintenanceRequestsForTenant = (
  tenantId: string,
  onUpdate: (requests: MaintenanceRequest[]) => void,
  onError: (error: Error) => void
): Unsubscribe => {
  console.log('🔄 Setting up real-time subscription for tenant maintenance requests:', tenantId);
  
  // For now, we'll use a simpler approach and poll periodically
  // TODO: Implement real-time listeners for property changes
  const fetchAndUpdate = async () => {
    try {
      const requests = await getMaintenanceRequestsForTenant(tenantId);
      onUpdate(requests);
    } catch (error) {
      console.error('Error in maintenance requests subscription:', error);
      onError(error as Error);
    }
  };
  
  // Initial fetch
  fetchAndUpdate();
  
  // Set up periodic refresh (every 30 seconds)
  const intervalId = setInterval(fetchAndUpdate, 30000);
  
  // Return unsubscribe function
  return () => {
    console.log('🔄 Unsubscribing from tenant maintenance requests');
    clearInterval(intervalId);
  };
};

/**
 * Legacy function for backward compatibility - fetch from tickets collection
 */
export const getLegacyTicketsForTenant = async (tenantId: string): Promise<MaintenanceRequest[]> => {
  try {
    console.log('🔄 Fetching legacy tickets for tenant:', tenantId);
    
    const q = query(
      collection(db, 'tickets'),
      where('submittedBy', '==', tenantId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const tickets = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    })) as MaintenanceRequest[];
    
    console.log(`🎫 Found ${tickets.length} legacy tickets`);
    return tickets;
  } catch (error) {
    console.error('❌ Error fetching legacy tickets:', error);
    throw error;
  }
};

/**
 * Delete a maintenance request and remove it from the property's array
 */
export const deleteMaintenanceRequest = async (requestId: string, tenantId: string): Promise<void> => {
  try {
    console.log('🗑️  Deleting maintenance request:', requestId);
    
    // First, find which property contains this request
    const tenantProfileRef = doc(db, 'tenantProfiles', tenantId);
    const tenantProfileSnap = await getDoc(tenantProfileRef);
    
    if (!tenantProfileSnap.exists()) {
      throw new Error('Tenant profile not found');
    }
    
    const tenantProfile = tenantProfileSnap.data();
    const propertyIds = tenantProfile.properties || [];
    
    if (propertyIds.length === 0) {
      throw new Error('No properties found for tenant');
    }
    
    // Use a transaction to ensure atomicity
    await runTransaction(db, async (transaction) => {
      // Find the property that contains this maintenance request
      let propertyId = null;
      
      for (const propId of propertyIds) {
        const propertyRef = doc(db, 'properties', propId);
        const propertySnap = await transaction.get(propertyRef);
        
        if (propertySnap.exists()) {
          const propertyData = propertySnap.data();
          const maintenanceRequests = propertyData.maintenanceRequests || [];
          
          if (maintenanceRequests.includes(requestId)) {
            propertyId = propId;
            break;
          }
        }
      }
      
      if (!propertyId) {
        throw new Error('Maintenance request not found in any property');
      }
      
      // 1. Remove the request ID from the property's maintenanceRequests array
      const propertyRef = doc(db, 'properties', propertyId);
      transaction.update(propertyRef, {
        maintenanceRequests: arrayRemove(requestId)
      });
      
      // 2. Delete the actual maintenance request document
      const requestRef = doc(db, 'maintenanceRequests', requestId);
      transaction.delete(requestRef);
      
      console.log(`✅ Successfully deleted maintenance request ${requestId} from property ${propertyId}`);
    });
    
  } catch (error) {
    console.error('❌ Error deleting maintenance request:', error);
    throw error;
  }
};

export default {
  getMaintenanceRequestsForTenant,
  subscribeToMaintenanceRequestsForTenant,
  getLegacyTicketsForTenant,
  deleteMaintenanceRequest
}; 