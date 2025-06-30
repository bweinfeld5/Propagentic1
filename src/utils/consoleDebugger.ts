import { debugMaintenancePermissions, printDebugResults } from './maintenancePermissionDebugger';

/**
 * Console helper function for debugging maintenance request permissions
 * Usage: Open browser console and run: debugMaintenanceRequest('your-request-id')
 */
(window as any).debugMaintenanceRequest = async (requestId: string) => {
  if (!requestId) {
    console.error('❌ Please provide a request ID. Usage: debugMaintenanceRequest("your-request-id")');
    return;
  }
  
  console.log(`🔍 Debugging permissions for maintenance request: ${requestId}`);
  console.log('─'.repeat(50));
  
  try {
    const results = await debugMaintenancePermissions(requestId);
    printDebugResults(results);
    
    console.log('─'.repeat(50));
    if (results.maintenanceRequest.canDelete) {
      console.log('✅ RESULT: User should be able to delete this maintenance request');
    } else {
      console.log('❌ RESULT: User cannot delete this maintenance request');
      console.log('\n💡 QUICK FIXES:');
      results.recommendations.forEach(rec => {
        if (rec.startsWith('❌')) {
          console.log(`   ${rec}`);
        }
      });
    }
    
    return results;
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
};

/**
 * Console helper to list all maintenance requests for the current user
 */
(window as any).listMaintenanceRequests = async () => {
  try {
    const { auth, db } = await import('../firebase/config');
    const { collection, query, where, getDocs } = await import('firebase/firestore');
    
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error('❌ User not authenticated');
      return;
    }
    
    console.log(`🔍 Fetching maintenance requests for user: ${currentUser.uid}`);
    
    // Get user's properties first
    const propertiesQuery = query(
      collection(db, 'properties'),
      where('landlordId', '==', currentUser.uid)
    );
    const propertiesSnapshot = await getDocs(propertiesQuery);
    const propertyIds = propertiesSnapshot.docs.map(doc => doc.id);
    
    console.log(`Found ${propertyIds.length} properties owned by user`);
    
    if (propertyIds.length === 0) {
      console.log('❌ No properties found for this user');
      return;
    }
    
    // Get maintenance requests for those properties
    const requestsQuery = query(
      collection(db, 'maintenanceRequests'),
      where('propertyId', 'in', propertyIds.slice(0, 10)) // Firestore 'in' limit is 10
    );
    const requestsSnapshot = await getDocs(requestsQuery);
    
    console.log(`Found ${requestsSnapshot.docs.length} maintenance requests`);
    console.table(
      requestsSnapshot.docs.map(doc => ({
        id: doc.id,
        title: doc.data().title || 'No title',
        status: doc.data().status || 'No status',
        propertyId: doc.data().propertyId,
        created: doc.data().createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'
      }))
    );
    
    return requestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('❌ Failed to list maintenance requests:', error);
  }
};

// Add helper instructions to console
console.log('🔧 Maintenance Request Debug Tools Loaded!');
console.log('');
console.log('Available commands:');
console.log('• debugMaintenanceRequest("request-id") - Debug permissions for a specific request');
console.log('• listMaintenanceRequests() - List all maintenance requests for current user');
console.log('');
console.log('Example usage:');
console.log('  debugMaintenanceRequest("abc123")');
console.log('  listMaintenanceRequests()');

export {}; // Make this a module 