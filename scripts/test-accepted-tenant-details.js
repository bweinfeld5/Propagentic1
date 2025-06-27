#!/usr/bin/env node

/**
 * Test script to verify acceptedTenantDetails functionality
 * Tests the Cloud Functions updates for Task 6
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin (assumes service account or default credentials)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function testAcceptedTenantDetails() {
  console.log('🧪 Testing acceptedTenantDetails functionality...\n');

  try {
    // Step 1: Find a landlord profile with accepted tenants
    console.log('📋 Step 1: Searching for landlord profiles...');
    const landlordProfilesSnapshot = await db.collection('landlordProfiles')
      .where('totalInvitesAccepted', '>', 0)
      .limit(3)
      .get();

    if (landlordProfilesSnapshot.empty) {
      console.log('⚠️  No landlord profiles with accepted tenants found.');
      console.log('   Try running some tenant invite acceptance flows first.');
      return;
    }

    // Step 2: Analyze each landlord profile
    for (const doc of landlordProfilesSnapshot.docs) {
      const landlordId = doc.id;
      const data = doc.data();
      
      console.log(`\n👤 Analyzing Landlord: ${landlordId}`);
      console.log(`   Display Name: ${data.displayName || 'Not set'}`);
      console.log(`   Email: ${data.email || 'Not set'}`);
      
      // Check basic statistics
      console.log('\n📊 Statistics:');
      console.log(`   Total Invites Sent: ${data.totalInvitesSent || 0}`);
      console.log(`   Total Invites Accepted: ${data.totalInvitesAccepted || 0}`);
      console.log(`   Acceptance Rate: ${data.inviteAcceptanceRate || 0}%`);
      
      // Check acceptedTenants array
      const acceptedTenants = data.acceptedTenants || [];
      console.log(`\n✅ acceptedTenants (${acceptedTenants.length} entries):`);
      acceptedTenants.forEach((tenantId, index) => {
        console.log(`   ${index + 1}. ${tenantId}`);
      });
      
      // Check acceptedTenantDetails array
      const acceptedTenantDetails = data.acceptedTenantDetails || [];
      console.log(`\n📝 acceptedTenantDetails (${acceptedTenantDetails.length} entries):`);
      
      if (acceptedTenantDetails.length === 0) {
        console.log('   ❌ No acceptedTenantDetails found - this indicates the issue!');
        console.log('   💡 Expected: Rich tenant records with metadata');
      } else {
        acceptedTenantDetails.forEach((record, index) => {
          console.log(`   ${index + 1}. Tenant Record:`);
          console.log(`      • Tenant ID: ${record.tenantId}`);
          console.log(`      • Property ID: ${record.propertyId}`);
          console.log(`      • Invite ID: ${record.inviteId}`);
          console.log(`      • Invite Code: ${record.inviteCode || 'Not set'}`);
          console.log(`      • Email: ${record.tenantEmail}`);
          console.log(`      • Unit: ${record.unitNumber || 'Not specified'}`);
          console.log(`      • Accepted At: ${record.acceptedAt ? new Date(record.acceptedAt._seconds * 1000).toISOString() : 'Not set'}`);
          console.log(`      • Invite Type: ${record.inviteType || 'Not specified'}`);
        });
      }
      
      // Data consistency check
      console.log(`\n🔍 Data Consistency Check:`);
      if (acceptedTenants.length === acceptedTenantDetails.length) {
        console.log(`   ✅ Arrays are synchronized (${acceptedTenants.length} = ${acceptedTenantDetails.length})`);
      } else {
        console.log(`   ❌ Arrays are NOT synchronized:`);
        console.log(`      • acceptedTenants: ${acceptedTenants.length} entries`);
        console.log(`      • acceptedTenantDetails: ${acceptedTenantDetails.length} entries`);
        console.log(`   💡 This indicates missing acceptedTenantDetails updates`);
      }
      
      // Check for recent activity
      console.log(`\n🕒 Recent Activity:`);
      console.log(`   Last Updated: ${data.updatedAt ? new Date(data.updatedAt._seconds * 1000).toISOString() : 'Not set'}`);
      console.log(`   Created At: ${data.createdAt ? new Date(data.createdAt._seconds * 1000).toISOString() : 'Not set'}`);
      
      console.log('\n' + '─'.repeat(80));
    }

    // Step 3: Summary and recommendations
    console.log('\n📋 Summary & Recommendations:');
    console.log('✅ If acceptedTenantDetails arrays are populated with rich metadata:');
    console.log('   • Task 6 implementation is working correctly');
    console.log('   • Frontend can display detailed tenant information');
    console.log('   • Invite history and context are preserved');
    
    console.log('\n❌ If acceptedTenantDetails arrays are empty or missing:');
    console.log('   • Check Cloud Function deployments');
    console.log('   • Verify acceptTenantInvite and acceptPropertyInvite functions');
    console.log('   • Test new tenant invite acceptance flows');
    console.log('   • Consider running data migration for existing tenants');

  } catch (error) {
    console.error('❌ Error during testing:', error);
    console.error(error.stack);
  }
}

// Run the test
testAcceptedTenantDetails()
  .then(() => {
    console.log('\n🎉 Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  }); 