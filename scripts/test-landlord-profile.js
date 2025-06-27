const admin = require('firebase-admin');
const { Timestamp } = require('firebase-admin/firestore');

// Initialize Firebase Admin (if not already initialized)
if (!admin.apps.length) {
  // Use service account key or Firebase CLI authentication
  const serviceAccount = require('../functions/service-account-key.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'propgentic-d1af3'
  });
}

const db = admin.firestore();

/**
 * Create a comprehensive test landlord profile
 */
async function createTestLandlordProfile() {
  try {
    console.log('🏠 Creating test landlord profile...');
    
    // Test landlord data
    const testLandlordId = 'test-landlord-' + Date.now();
    const currentTime = Timestamp.now();
    
    const landlordProfileData = {
      // Identity
      uid: testLandlordId,
      landlordId: testLandlordId,
      userId: testLandlordId,
      
      // Contact Information
      displayName: 'Test Landlord McProperty',
      email: `test-landlord-${Date.now()}@propagentic-test.com`,
      phoneNumber: '+1 (555) 123-4567',
      businessName: 'PropAgentic Test Properties LLC',
      
      // Core Relationships Arrays (as per specification)
      acceptedTenants: [], // Will be populated when tenants accept invites
      properties: ['test-property-1', 'test-property-2'], // Sample property IDs
      invitesSent: ['invite-123', 'invite-456'], // Sample invite IDs
      contractors: ['contractor-1', 'contractor-2'], // Sample contractor IDs
      
      // Enhanced Tracking
      acceptedTenantDetails: [
        {
          tenantId: 'tenant-001',
          propertyId: 'test-property-1',
          inviteId: 'invite-123',
          inviteCode: 'ABC12345',
          unitNumber: 'Unit 101',
          acceptedAt: currentTime,
          status: 'active'
        }
      ],
      
      // Statistics
      totalInvitesSent: 5,
      totalInvitesAccepted: 1,
      inviteAcceptanceRate: 20, // 1/5 = 20%
      
      // Timestamps
      createdAt: currentTime,
      updatedAt: currentTime
    };
    
    // Add to landlordProfiles collection
    await db.collection('landlordProfiles').doc(testLandlordId).set(landlordProfileData);
    
    console.log('✅ Test landlord profile created successfully!');
    console.log(`📧 Landlord ID: ${testLandlordId}`);
    console.log(`📧 Email: ${landlordProfileData.email}`);
    console.log(`🏢 Business: ${landlordProfileData.businessName}`);
    console.log(`📊 Stats: ${landlordProfileData.totalInvitesAccepted}/${landlordProfileData.totalInvitesSent} invites accepted (${landlordProfileData.inviteAcceptanceRate}%)`);
    
    // Verify the profile was created
    const doc = await db.collection('landlordProfiles').doc(testLandlordId).get();
    if (doc.exists) {
      console.log('✅ Verification: Profile successfully stored in Firestore');
      console.log('📄 Document data preview:');
      const data = doc.data();
      console.log(`  - UID: ${data.uid}`);
      console.log(`  - Email: ${data.email}`);
      console.log(`  - Properties: ${data.properties.length}`);
      console.log(`  - Accepted Tenants: ${data.acceptedTenants.length}`);
      console.log(`  - Invites Sent: ${data.invitesSent.length}`);
      console.log(`  - Contractors: ${data.contractors.length}`);
    } else {
      console.error('❌ Error: Profile was not found after creation');
    }
    
    return testLandlordId;
    
  } catch (error) {
    console.error('❌ Error creating test landlord profile:', error);
    throw error;
  }
}

/**
 * Test the landlord profile service functions
 */
async function testLandlordProfileService(landlordId) {
  try {
    console.log('\n🧪 Testing landlord profile service functions...');
    
    // Test 1: Get landlord profile
    const profileRef = db.collection('landlordProfiles').doc(landlordId);
    const doc = await profileRef.get();
    
    if (doc.exists) {
      console.log('✅ Test 1: Successfully retrieved landlord profile');
      const data = doc.data();
      console.log(`  - Found profile for: ${data.displayName}`);
      console.log(`  - Business: ${data.businessName}`);
    } else {
      console.log('❌ Test 1 Failed: Could not retrieve profile');
    }
    
    // Test 2: Query by email
    const emailQuery = await db.collection('landlordProfiles')
      .where('email', '==', doc.data().email)
      .get();
    
    if (!emailQuery.empty) {
      console.log('✅ Test 2: Successfully queried profile by email');
      console.log(`  - Found ${emailQuery.docs.length} profile(s)`);
    } else {
      console.log('❌ Test 2 Failed: Could not query by email');
    }
    
    // Test 3: Update profile (simulate tenant acceptance)
    const updateData = {
      acceptedTenants: admin.firestore.FieldValue.arrayUnion('new-tenant-123'),
      totalInvitesAccepted: admin.firestore.FieldValue.increment(1),
      updatedAt: Timestamp.now()
    };
    
    await profileRef.update(updateData);
    console.log('✅ Test 3: Successfully updated profile with new accepted tenant');
    
    // Verify update
    const updatedDoc = await profileRef.get();
    const updatedData = updatedDoc.data();
    console.log(`  - New accepted tenants count: ${updatedData.acceptedTenants.length}`);
    console.log(`  - Total invites accepted: ${updatedData.totalInvitesAccepted}`);
    
  } catch (error) {
    console.error('❌ Error testing landlord profile service:', error);
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    console.log('🚀 Starting landlord profile test...\n');
    
    // Create test profile
    const landlordId = await createTestLandlordProfile();
    
    // Test service functions
    await testLandlordProfileService(landlordId);
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('💡 You can now view the profile in the Firebase Console:');
    console.log(`   Firestore > landlordProfiles > ${landlordId}`);
    
  } catch (error) {
    console.error('💥 Test failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  createTestLandlordProfile,
  testLandlordProfileService
}; 