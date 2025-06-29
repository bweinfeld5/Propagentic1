import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Debug utility to check maintenanceRequests collection
 * Call this from browser console: debugMaintenanceRequests.checkRequests('USER_ID')
 */
export const debugMaintenanceRequests = {
  // Check all maintenance requests for a specific tenant through property relationships
  async checkRequests(tenantId: string) {
    console.log('🔍 [Debug] Checking maintenanceRequests for tenantId via property relationships:', tenantId);
    
    try {
      // First, get tenant's properties
      const tenantProfileRef = doc(db, 'tenantProfiles', tenantId);
      const tenantProfileSnap = await getDoc(tenantProfileRef);
      
      let propertyIds: string[] = [];
      
      if (tenantProfileSnap.exists()) {
        const tenantProfile = tenantProfileSnap.data();
        propertyIds = tenantProfile.properties || [];
        console.log('📊 [Debug] Found', propertyIds.length, 'properties in tenant profile');
      } else {
        // Fallback to legacy user profile
        const userRef = doc(db, 'users', tenantId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists() && userSnap.data().propertyId) {
          propertyIds = [userSnap.data().propertyId];
          console.log('📊 [Debug] Found legacy property ID:', propertyIds[0]);
        }
      }
      
      if (propertyIds.length === 0) {
        console.log('❌ [Debug] No properties found for tenant');
        return [];
      }
      
      // Get all maintenance request IDs from all properties
      const allMaintenanceRequestIds: string[] = [];
      
      for (const propertyId of propertyIds) {
        try {
          const propertyRef = doc(db, 'properties', propertyId);
          const propertySnap = await getDoc(propertyRef);
          
          if (propertySnap.exists()) {
            const propertyData = propertySnap.data();
            const requestIds = propertyData.maintenanceRequests || [];
            allMaintenanceRequestIds.push(...requestIds);
            console.log('📊 [Debug] Property', propertyId, 'has', requestIds.length, 'maintenance requests');
          }
        } catch (error) {
          console.warn('❌ [Debug] Failed to fetch property:', propertyId, error);
        }
      }
      
      console.log('📊 [Debug] Total maintenance request IDs found:', allMaintenanceRequestIds.length);
      
      if (allMaintenanceRequestIds.length === 0) {
        console.log('❌ [Debug] No maintenance requests found in properties');
        return [];
      }
      
      // Fetch each maintenance request by ID
      const requests = [];
      for (const requestId of allMaintenanceRequestIds) {
        try {
          const requestRef = doc(db, 'maintenanceRequests', requestId);
          const requestSnap = await getDoc(requestRef);
          
          if (requestSnap.exists()) {
            requests.push({
              id: requestSnap.id,
              ...requestSnap.data()
            });
          } else {
            console.warn('📊 [Debug] Maintenance request not found:', requestId);
          }
        } catch (error) {
          console.warn('❌ [Debug] Failed to fetch maintenance request:', requestId, error);
        }
      }
      
      console.log('📋 [Debug] Maintenance requests found via properties:', requests);
      
      return requests;
    } catch (error) {
      console.error('❌ [Debug] Error fetching maintenance requests via properties:', error);
      return [];
    }
  },

  // Check all maintenance requests (no filter)
  async checkAllRequests() {
    console.log('🔍 [Debug] Checking ALL maintenanceRequests');
    
    try {
      const requestsRef = collection(db, 'maintenanceRequests');
      const snapshot = await getDocs(requestsRef);
      
      console.log('📊 [Debug] Found', snapshot.size, 'total maintenance requests');
      
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('📋 [Debug] All maintenance requests:', requests);
      
      return requests;
    } catch (error) {
      console.error('❌ [Debug] Error fetching all maintenance requests:', error);
      return [];
    }
  },

  // Check a specific maintenance request by ID
  async checkRequest(requestId: string) {
    console.log('🔍 [Debug] Checking maintenance request:', requestId);
    
    try {
      const requestRef = doc(db, 'maintenanceRequests', requestId);
      const requestSnap = await getDoc(requestRef);
      
      if (!requestSnap.exists()) {
        console.log('❌ [Debug] Maintenance request not found:', requestId);
        return null;
      }
      
      const requestData = {
        id: requestSnap.id,
        ...requestSnap.data()
      };
      
      console.log('📋 [Debug] Maintenance request data:', requestData);
      
      return requestData;
    } catch (error) {
      console.error('❌ [Debug] Error fetching maintenance request:', error);
      return null;
    }
  },

  // Check property maintenanceRequests arrays
  async checkPropertyMaintenanceArrays(tenantId: string) {
    console.log('🔍 [Debug] Checking property maintenanceRequests arrays for tenantId:', tenantId);
    
    try {
      // Get tenant's properties
      const tenantProfileRef = doc(db, 'tenantProfiles', tenantId);
      const tenantProfileSnap = await getDoc(tenantProfileRef);
      
      let propertyIds: string[] = [];
      
      if (tenantProfileSnap.exists()) {
        const tenantProfile = tenantProfileSnap.data();
        propertyIds = tenantProfile.properties || [];
        console.log('📊 [Debug] Found', propertyIds.length, 'properties in tenant profile');
      } else {
        // Fallback to legacy user profile
        const userRef = doc(db, 'users', tenantId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists() && userSnap.data().propertyId) {
          propertyIds = [userSnap.data().propertyId];
          console.log('📊 [Debug] Found legacy property ID:', propertyIds[0]);
        }
      }
      
      if (propertyIds.length === 0) {
        console.log('❌ [Debug] No properties found for tenant');
        return [];
      }
      
      // Check each property's maintenanceRequests array
      const results = [];
      for (const propertyId of propertyIds) {
        try {
          const propertyRef = doc(db, 'properties', propertyId);
          const propertySnap = await getDoc(propertyRef);
          
          if (propertySnap.exists()) {
            const propertyData = propertySnap.data();
            const requestIds = propertyData.maintenanceRequests || [];
            
            results.push({
              propertyId,
              propertyName: propertyData.name || 'Unknown Property',
              maintenanceRequestIds: requestIds,
              count: requestIds.length
            });
            
            console.log('📊 [Debug] Property', propertyId, ':', {
              name: propertyData.name || 'Unknown',
              maintenanceRequests: requestIds,
              count: requestIds.length
            });
          } else {
            console.warn('❌ [Debug] Property not found:', propertyId);
          }
        } catch (error) {
          console.warn('❌ [Debug] Failed to fetch property:', propertyId, error);
        }
      }
      
      console.log('📋 [Debug] Property maintenance arrays summary:', results);
      return results;
    } catch (error) {
      console.error('❌ [Debug] Error checking property maintenance arrays:', error);
      return [];
    }
  },

  // Check tickets collection for comparison
  async checkTickets(tenantId: string) {
    console.log('🔍 [Debug] Checking tickets for comparison, tenantId:', tenantId);
    
    try {
      const ticketsRef = collection(db, 'tickets');
      const q = query(ticketsRef, where('submittedBy', '==', tenantId));
      
      const snapshot = await getDocs(q);
      
      console.log('📊 [Debug] Found', snapshot.size, 'tickets');
      
      const tickets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('📋 [Debug] Tickets:', tickets);
      
      return tickets;
    } catch (error) {
      console.error('❌ [Debug] Error fetching tickets:', error);
      return [];
    }
  },

  // Test creating a maintenance request
  async testCreateRequest(tenantId: string) {
    console.log('🔍 [Debug] Testing creation of maintenance request for:', tenantId);
    
    try {
      const { setDoc, doc, serverTimestamp } = await import('firebase/firestore');
      
      const requestRef = doc(collection(db, 'maintenanceRequests'));
      const requestId = requestRef.id;
      
      const testData = {
        tenantId,
        tenantName: 'Test Tenant',
        tenantEmail: 'test@example.com',
        chatSessionId: `debug-test-${Date.now()}`,
        propertyId: null,
        landlordId: null,
        timestamp: serverTimestamp(),
        status: 'pending',
        issueType: 'plumbing',
        category: 'Plumbing',
        description: 'Debug test maintenance request',
        images: [],
        createdVia: 'debug_test'
      };
      
      await setDoc(requestRef, testData);
      
      console.log('✅ [Debug] Test maintenance request created:', requestId);
      console.log('📋 [Debug] Test data:', testData);
      
      return requestId;
    } catch (error) {
      console.error('❌ [Debug] Error creating test maintenance request:', error);
      return null;
    }
  },

  // Test deleting a maintenance request
  async testDeleteRequest(requestId: string, tenantId: string) {
    console.log('🗑️ [Debug] Testing deletion of maintenance request:', requestId);
    
    try {
      const { deleteDoc, doc, getDoc, updateDoc, arrayRemove } = await import('firebase/firestore');
      
      // 1. Delete the maintenance request document
      const requestRef = doc(db, 'maintenanceRequests', requestId);
      const requestSnap = await getDoc(requestRef);
      
      if (!requestSnap.exists()) {
        console.log('❌ [Debug] Maintenance request not found:', requestId);
        return false;
      }
      
      await deleteDoc(requestRef);
      console.log('✅ [Debug] Deleted maintenance request document:', requestId);
      
      // 2. Remove from tenant's properties
      const tenantProfileRef = doc(db, 'tenantProfiles', tenantId);
      const tenantProfileSnap = await getDoc(tenantProfileRef);
      
      let propertyIds: string[] = [];
      
      if (tenantProfileSnap.exists()) {
        const tenantProfile = tenantProfileSnap.data();
        propertyIds = tenantProfile.properties || [];
        console.log('🗑️ [Debug] Found', propertyIds.length, 'properties in tenant profile');
      } else {
        // Fallback to legacy user profile
        const userRef = doc(db, 'users', tenantId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists() && userSnap.data().propertyId) {
          propertyIds = [userSnap.data().propertyId];
          console.log('🗑️ [Debug] Found legacy property ID:', propertyIds[0]);
        }
      }
      
      // Remove request ID from each property's maintenanceRequests array
      for (const propertyId of propertyIds) {
        try {
          const propertyRef = doc(db, 'properties', propertyId);
          await updateDoc(propertyRef, {
            maintenanceRequests: arrayRemove(requestId)
          });
          console.log('✅ [Debug] Removed request from property:', propertyId);
        } catch (error) {
          console.warn('⚠️ [Debug] Failed to remove request from property:', propertyId, error);
        }
      }
      
      console.log('✅ [Debug] Successfully deleted maintenance request and cleaned up references');
      return true;
      
    } catch (error) {
      console.error('❌ [Debug] Error deleting maintenance request:', error);
      return false;
    }
  }
};

// Make it available globally for debugging
(window as any).debugMaintenanceRequests = debugMaintenanceRequests;

export default debugMaintenanceRequests; 