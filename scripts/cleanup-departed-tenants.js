const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'propagentic'
  });
}

const db = admin.firestore();

async function cleanupDepartedTenants(landlordId) {
  console.log(`🧹 Starting cleanup for landlord: ${landlordId}`);
  
  try {
    // Get landlord profile
    const landlordRef = db.collection('landlordProfiles').doc(landlordId);
    const landlordDoc = await landlordRef.get();
    
    if (!landlordDoc.exists) {
      console.log('❌ Landlord profile not found');
      return;
    }
    
    const landlordData = landlordDoc.data();
    const acceptedTenants = landlordData.acceptedTenants || [];
    const acceptedTenantDetails = landlordData.acceptedTenantDetails || [];
    
    console.log(`📊 Current state:`);
    console.log(`   - acceptedTenants: ${acceptedTenants.length} entries`);
    console.log(`   - acceptedTenantDetails: ${acceptedTenantDetails.length} entries`);
    
    // Check each tenant in acceptedTenantDetails
    const validTenantDetails = [];
    const invalidTenants = [];
    
    for (const tenantDetail of acceptedTenantDetails) {
      try {
        const { tenantId, propertyId } = tenantDetail;
        
        // Check if tenant still exists in users collection
        const userDoc = await db.collection('users').doc(tenantId).get();
        let tenantStillExists = false;
        
        if (userDoc.exists) {
          const userData = userDoc.data();
          // Check if tenant still has this property
          if (userData.propertyId === propertyId || 
              (userData.properties && userData.properties.includes(propertyId))) {
            tenantStillExists = true;
          }
        }
        
        // Check if property still has this tenant
        const propertyDoc = await db.collection('properties').doc(propertyId).get();
        let propertyStillHasTenant = false;
        
        if (propertyDoc.exists) {
          const propertyData = propertyDoc.data();
          if (propertyData.tenants && propertyData.tenants.includes(tenantId)) {
            propertyStillHasTenant = true;
          }
        }
        
        if (tenantStillExists && propertyStillHasTenant) {
          validTenantDetails.push(tenantDetail);
          console.log(`✅ Valid: ${tenantDetail.tenantEmail} at property ${propertyId}`);
        } else {
          invalidTenants.push(tenantDetail);
          console.log(`❌ Invalid: ${tenantDetail.tenantEmail} at property ${propertyId}`);
          console.log(`   - Tenant exists: ${tenantStillExists}`);
          console.log(`   - Property has tenant: ${propertyStillHasTenant}`);
        }
        
      } catch (error) {
        console.error(`Error checking tenant ${tenantDetail.tenantId}:`, error);
        invalidTenants.push(tenantDetail);
      }
    }
    
    // Update acceptedTenants array to match valid tenants
    const validTenantIds = validTenantDetails.map(t => t.tenantId);
    
    console.log(`\n🔄 Cleanup results:`);
    console.log(`   - Valid tenants: ${validTenantDetails.length}`);
    console.log(`   - Invalid tenants to remove: ${invalidTenants.length}`);
    
    if (invalidTenants.length > 0) {
      console.log(`\n🗑️ Removing invalid tenants:`);
      invalidTenants.forEach(tenant => {
        console.log(`   - ${tenant.tenantEmail} (${tenant.tenantId})`);
      });
      
      // Update landlord profile
      await landlordRef.update({
        acceptedTenants: validTenantIds,
        acceptedTenantDetails: validTenantDetails,
        totalTenants: validTenantIds.length,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`✅ Successfully cleaned up landlord profile`);
      console.log(`   - Removed ${invalidTenants.length} invalid tenant(s)`);
      console.log(`   - Remaining tenants: ${validTenantIds.length}`);
    } else {
      console.log(`✅ No cleanup needed - all tenants are valid`);
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

// Main execution
async function main() {
  const landlordId = process.argv[2] || 'owner@propagenticai.com';
  
  console.log('🧹 Departed Tenants Cleanup Script');
  console.log('===================================');
  
  // If landlordId looks like an email, try to find the user ID
  if (landlordId.includes('@')) {
    console.log(`🔍 Looking up user ID for email: ${landlordId}`);
    
    try {
      const userRecord = await admin.auth().getUserByEmail(landlordId);
      console.log(`✅ Found user ID: ${userRecord.uid}`);
      await cleanupDepartedTenants(userRecord.uid);
    } catch (error) {
      console.error(`❌ Could not find user for email ${landlordId}:`, error.message);
    }
  } else {
    // Assume it's already a user ID
    await cleanupDepartedTenants(landlordId);
  }
  
  console.log('\n🏁 Cleanup completed');
  process.exit(0);
}

main().catch(console.error); 