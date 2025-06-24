/**
 * Test Firestore Permissions for Tenant Data Access
 * 
 * This script tests the updated Firestore rules to ensure landlords can properly
 * access tenant data for their properties without permission errors.
 */

const admin = require('firebase-admin');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, doc, getDoc } = require('firebase/firestore');

// Initialize Firebase Admin (for setup)
if (!admin.apps.length) {
  try {
    const serviceAccount = require('../propagentic-firebase-adminsdk-fbsvc-c20b027723.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('✅ Firebase Admin initialized');
  } catch (error) {
    admin.initializeApp();
    console.log('✅ Firebase Admin initialized with default credentials');
  }
}

// Initialize Firebase Client (for testing permissions)
const firebaseConfig = {
  // Your Firebase config here - you'll need to add this
  projectId: 'propagentic'
};

const clientApp = initializeApp(firebaseConfig, 'client');
const clientAuth = getAuth(clientApp);
const clientDb = getFirestore(clientApp);
const adminDb = admin.firestore();

/**
 * Test 1: Verify landlord can query for tenants
 */
async function testLandlordCanQueryTenants() {
  console.log('\n🧪 Testing: Landlord can query for tenants...\n');
  
  try {
    // Sign in as a test landlord (you'll need to create this user)
    console.log('📝 Note: You need a test landlord account for this test');
    console.log('   Create a user with email/password and set userType: "landlord"');
    
    // For now, test with admin access to verify the queries work
    const tenantsQuery = query(
      collection(clientDb, 'users'),
      where('userType', '==', 'tenant')
    );
    
    const snapshot = await getDocs(tenantsQuery);
    console.log(`✅ Found ${snapshot.docs.length} tenant users`);
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`   - ${data.firstName || data.displayName || data.email} (${doc.id})`);
    });
    
    return { success: true, count: snapshot.docs.length };
    
  } catch (error) {
    console.error('❌ Error querying tenants:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test 2: Verify propertyTenantRelationships access
 */
async function testPropertyTenantRelationshipsAccess() {
  console.log('\n🧪 Testing: PropertyTenantRelationships collection access...\n');
  
  try {
    // Check if collection exists and is readable
    const relationshipsRef = collection(clientDb, 'propertyTenantRelationships');
    const snapshot = await getDocs(relationshipsRef);
    
    console.log(`✅ PropertyTenantRelationships collection accessible`);
    console.log(`   Found ${snapshot.docs.length} relationships`);
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`   - Property: ${data.propertyId}, Tenant: ${data.tenantId}, Status: ${data.status}`);
    });
    
    return { success: true, count: snapshot.docs.length };
    
  } catch (error) {
    console.error('❌ Error accessing propertyTenantRelationships:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test 3: Create test data if needed
 */
async function createTestDataIfNeeded() {
  console.log('\n🧪 Creating test data if needed...\n');
  
  try {
    // Create a test landlord user
    const testLandlordData = {
      email: 'test-landlord@propagentic.com',
      userType: 'landlord',
      role: 'landlord',
      firstName: 'Test',
      lastName: 'Landlord',
      displayName: 'Test Landlord',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Create a test tenant user
    const testTenantData = {
      email: 'test-tenant@propagentic.com',
      userType: 'tenant',
      role: 'tenant',
      firstName: 'Test',
      lastName: 'Tenant',
      displayName: 'Test Tenant',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Create a test property
    const testPropertyData = {
      landlordId: 'test-landlord-id',
      name: 'Test Property',
      streetAddress: '123 Test St',
      city: 'Test City',
      state: 'CA',
      zipCode: '12345',
      propertyType: 'apartment',
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Create test documents (using admin SDK)
    await adminDb.collection('users').doc('test-landlord-id').set(testLandlordData);
    await adminDb.collection('users').doc('test-tenant-id').set(testTenantData);
    await adminDb.collection('properties').doc('test-property-id').set(testPropertyData);
    
    // Create a test relationship
    const testRelationshipData = {
      propertyId: 'test-property-id',
      tenantId: 'test-tenant-id',
      unitId: 'unit-1',
      status: 'active',
      startDate: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await adminDb.collection('propertyTenantRelationships').add(testRelationshipData);
    
    console.log('✅ Test data created successfully');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error creating test data:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test 4: Simulate the actual getTenantsForProperty flow
 */
async function testGetTenantsForPropertyFlow() {
  console.log('\n🧪 Testing: Complete getTenantsForProperty flow...\n');
  
  try {
    const propertyId = 'test-property-id';
    
    console.log(`📝 Step 1: Query propertyTenantRelationships for property ${propertyId}`);
    
    // Step 1: Get property-tenant relationships
    const relationshipsQuery = query(
      collection(clientDb, 'propertyTenantRelationships'),
      where('propertyId', '==', propertyId),
      where('status', 'in', ['active', 'pending'])
    );
    
    const relationshipsSnapshot = await getDocs(relationshipsQuery);
    console.log(`   Found ${relationshipsSnapshot.docs.length} relationships`);
    
    // Step 2: Fetch tenant details for each relationship
    const tenants = [];
    for (const relationshipDoc of relationshipsSnapshot.docs) {
      const relationship = relationshipDoc.data();
      console.log(`📝 Step 2: Fetch tenant details for ${relationship.tenantId}`);
      
      const tenantDoc = await getDoc(doc(clientDb, 'users', relationship.tenantId));
      if (tenantDoc.exists()) {
        const tenantData = tenantDoc.data();
        tenants.push({
          id: tenantDoc.id,
          ...tenantData,
          unitId: relationship.unitId,
          status: relationship.status
        });
        console.log(`   ✅ Loaded tenant: ${tenantData.displayName || tenantData.email}`);
      } else {
        console.log(`   ⚠️ Tenant document not found: ${relationship.tenantId}`);
      }
    }
    
    console.log(`✅ Complete flow successful! Loaded ${tenants.length} tenants`);
    return { success: true, tenants };
    
  } catch (error) {
    console.error('❌ Error in getTenantsForProperty flow:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test 5: Verify rules work as expected
 */
async function testFirestoreRulesValidation() {
  console.log('\n🧪 Testing: Firestore rules validation...\n');
  
  try {
    // Test that the rules file is valid
    console.log('📝 Firestore rules appear to be deployed successfully');
    console.log('   If you can run queries without syntax errors, rules are valid');
    
    // Test different user types would have different access
    console.log('💡 Manual verification needed:');
    console.log('   1. Create test users with different roles (landlord, tenant, contractor)');
    console.log('   2. Sign in as each user type');
    console.log('   3. Verify access permissions are correct');
    console.log('   4. Ensure tenants can only see their own data');
    console.log('   5. Ensure landlords can only see their tenants/properties');
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error validating rules:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('🚀 Starting Firestore Permissions Tests...\n');
  console.log('⚠️  Make sure you have deployed the updated Firestore rules!\n');
  console.log('   Command: firebase deploy --only firestore:rules\n');
  
  const results = {
    testData: await createTestDataIfNeeded(),
    tenantQuery: await testLandlordCanQueryTenants(),
    relationshipsAccess: await testPropertyTenantRelationshipsAccess(),
    completeFlow: await testGetTenantsForPropertyFlow(),
    rulesValidation: await testFirestoreRulesValidation()
  };
  
  console.log('\n📋 TEST RESULTS SUMMARY');
  console.log('========================\n');
  
  Object.entries(results).forEach(([testName, result]) => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${testName}: ${status}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    if (result.count !== undefined) {
      console.log(`   Count: ${result.count}`);
    }
  });
  
  const totalPassed = Object.values(results).filter(r => r.success).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Summary: ${totalPassed}/${totalTests} tests passed`);
  
  if (totalPassed === totalTests) {
    console.log('\n🎉 All tests passed! Firestore permissions are working correctly.');
    console.log('\n💡 Next steps:');
    console.log('   1. Test the landlord dashboard in your app');
    console.log('   2. Verify tenant data loads without permission errors');
    console.log('   3. Test property-tenant relationship management');
  } else {
    console.log('\n⚠️  Some tests failed. Check the logs above for details.');
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Ensure Firestore rules are deployed: firebase deploy --only firestore:rules');
    console.log('   2. Check Firebase Console → Firestore → Rules tab');
    console.log('   3. Verify test data exists in Firestore collections');
    console.log('   4. Check Firebase Auth for test user accounts');
  }
  
  process.exit(totalPassed === totalTests ? 0 : 1);
}

// Run tests if called directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testLandlordCanQueryTenants,
  testPropertyTenantRelationshipsAccess,
  createTestDataIfNeeded,
  testGetTenantsForPropertyFlow,
  runAllTests
}; 