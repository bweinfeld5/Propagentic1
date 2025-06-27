#!/usr/bin/env node

/**
 * Simple Firestore Security Rules Test Runner
 * 
 * This script runs basic validation tests for Firestore security rules
 * without requiring Jest or Vitest setup.
 */

const firebase = require('@firebase/testing');
const { readFileSync } = require('fs');
const { join } = require('path');

const PROJECT_ID = 'propagentic-test';
const LANDLORD_UID = 'test-landlord-123';
const OTHER_USER_UID = 'other-user-456';

console.log('🔥 PropAgentic Firestore Security Rules Test Suite');
console.log('='.repeat(50));

// Read Firestore rules
const rules = readFileSync(join(__dirname, '../firestore.rules'), 'utf8');

let testEnv;
let testResults = {
  passed: 0,
  failed: 0,
  total: 0
};

// Helper functions
async function runTest(testName, testFn) {
  testResults.total++;
  try {
    await testFn();
    console.log(`✅ ${testName}`);
    testResults.passed++;
  } catch (error) {
    console.log(`❌ ${testName}`);
    console.log(`   Error: ${error.message}`);
    testResults.failed++;
  }
}

async function createTestUser(uid, userType = 'landlord') {
  const adminDb = testEnv.authenticatedContext('admin', { admin: true }).firestore();
  await adminDb.collection('users').doc(uid).set({
    uid,
    userType,
    role: userType,
    email: `${uid}@test.com`,
    firstName: 'Test',
    lastName: 'User',
  });
}

async function createTestLandlordProfile(landlordId, data = {}) {
  const adminDb = testEnv.authenticatedContext('admin', { admin: true }).firestore();
  const defaultData = {
    uid: landlordId,
    landlordId,
    firstName: 'Test',
    lastName: 'Landlord',
    email: `${landlordId}@test.com`,
    acceptedTenants: [],
    invitesSent: [],
    acceptedTenantDetails: [],
    contractors: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await adminDb.collection('landlordProfiles').doc(landlordId).set({ ...defaultData, ...data });
}

async function setupTestEnvironment() {
  console.log('\n🔧 Setting up test environment...');
  
  testEnv = await firebase.initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules },
  });
  
  console.log('✅ Test environment initialized');
}

async function cleanupTestEnvironment() {
  if (testEnv) {
    await testEnv.cleanup();
    console.log('✅ Test environment cleaned up');
  }
}

async function runTests() {
  console.log('\n🧪 Running Security Rules Tests...\n');

  // Test 1: Profile Creation Access Control
  await runTest('Landlord can create their own profile', async () => {
    await testEnv.clearFirestore();
    await createTestUser(LANDLORD_UID, 'landlord');
    
    const landlordDb = testEnv.authenticatedContext(LANDLORD_UID).firestore();
    const profileData = {
      uid: LANDLORD_UID,
      landlordId: LANDLORD_UID,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@test.com',
      acceptedTenants: [],
      invitesSent: [],
      acceptedTenantDetails: [],
      contractors: [],
    };

    await landlordDb.collection('landlordProfiles').doc(LANDLORD_UID).set(profileData);
  });

  await runTest('Other users cannot create landlord profiles', async () => {
    await testEnv.clearFirestore();
    await createTestUser(OTHER_USER_UID, 'tenant');
    
    const otherUserDb = testEnv.authenticatedContext(OTHER_USER_UID).firestore();
    const profileData = {
      uid: LANDLORD_UID,
      landlordId: LANDLORD_UID,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@test.com',
    };

    try {
      await otherUserDb.collection('landlordProfiles').doc(LANDLORD_UID).set(profileData);
      throw new Error('Should have been denied');
    } catch (error) {
      if (!error.message.includes('PERMISSION_DENIED')) {
        throw error;
      }
    }
  });

  // Test 2: Profile Reading Access Control
  await runTest('Landlord can read their own profile', async () => {
    await testEnv.clearFirestore();
    await createTestUser(LANDLORD_UID, 'landlord');
    await createTestLandlordProfile(LANDLORD_UID);
    
    const landlordDb = testEnv.authenticatedContext(LANDLORD_UID).firestore();
    await landlordDb.collection('landlordProfiles').doc(LANDLORD_UID).get();
  });

  await runTest('Other users cannot read landlord profiles', async () => {
    await testEnv.clearFirestore();
    await createTestUser(LANDLORD_UID, 'landlord');
    await createTestUser(OTHER_USER_UID, 'tenant');
    await createTestLandlordProfile(LANDLORD_UID);
    
    const otherUserDb = testEnv.authenticatedContext(OTHER_USER_UID).firestore();
    
    try {
      await otherUserDb.collection('landlordProfiles').doc(LANDLORD_UID).get();
      throw new Error('Should have been denied');
    } catch (error) {
      if (!error.message.includes('PERMISSION_DENIED')) {
        throw error;
      }
    }
  });

  // Test 3: Profile Update Access Control
  await runTest('Landlord can update allowed profile fields', async () => {
    await testEnv.clearFirestore();
    await createTestUser(LANDLORD_UID, 'landlord');
    await createTestLandlordProfile(LANDLORD_UID);
    
    const landlordDb = testEnv.authenticatedContext(LANDLORD_UID).firestore();
    await landlordDb.collection('landlordProfiles').doc(LANDLORD_UID).update({
      firstName: 'Updated',
      lastName: 'Name',
      phone: '+1234567890',
    });
  });

  // Test 4: Restricted Field Protection
  await runTest('Landlord cannot update acceptedTenants array', async () => {
    await testEnv.clearFirestore();
    await createTestUser(LANDLORD_UID, 'landlord');
    await createTestLandlordProfile(LANDLORD_UID, {
      acceptedTenants: ['tenant1'],
    });
    
    const landlordDb = testEnv.authenticatedContext(LANDLORD_UID).firestore();
    
    try {
      await landlordDb.collection('landlordProfiles').doc(LANDLORD_UID).update({
        acceptedTenants: ['tenant1', 'tenant2'],
      });
      throw new Error('Should have been denied');
    } catch (error) {
      if (!error.message.includes('PERMISSION_DENIED')) {
        throw error;
      }
    }
  });

  await runTest('Landlord cannot update invitesSent array', async () => {
    await testEnv.clearFirestore();
    await createTestUser(LANDLORD_UID, 'landlord');
    await createTestLandlordProfile(LANDLORD_UID, {
      invitesSent: ['invite1'],
    });
    
    const landlordDb = testEnv.authenticatedContext(LANDLORD_UID).firestore();
    
    try {
      await landlordDb.collection('landlordProfiles').doc(LANDLORD_UID).update({
        invitesSent: ['invite1', 'invite2'],
      });
      throw new Error('Should have been denied');
    } catch (error) {
      if (!error.message.includes('PERMISSION_DENIED')) {
        throw error;
      }
    }
  });

  await runTest('Landlord cannot update acceptedTenantDetails array', async () => {
    await testEnv.clearFirestore();
    await createTestUser(LANDLORD_UID, 'landlord');
    await createTestLandlordProfile(LANDLORD_UID, {
      acceptedTenantDetails: [{ id: 'tenant1', name: 'Test Tenant' }],
    });
    
    const landlordDb = testEnv.authenticatedContext(LANDLORD_UID).firestore();
    
    try {
      await landlordDb.collection('landlordProfiles').doc(LANDLORD_UID).update({
        acceptedTenantDetails: [
          { id: 'tenant1', name: 'Test Tenant' },
          { id: 'tenant2', name: 'Another Tenant' }
        ],
      });
      throw new Error('Should have been denied');
    } catch (error) {
      if (!error.message.includes('PERMISSION_DENIED')) {
        throw error;
      }
    }
  });

  // Test 5: Cloud Functions (Admin) Access
  await runTest('Admin can update restricted fields', async () => {
    await testEnv.clearFirestore();
    await createTestUser(LANDLORD_UID, 'landlord');
    await createTestLandlordProfile(LANDLORD_UID);
    
    // Simulate Cloud Functions using admin SDK
    const adminDb = testEnv.authenticatedContext('admin', { admin: true }).firestore();
    await adminDb.collection('landlordProfiles').doc(LANDLORD_UID).update({
      acceptedTenants: ['tenant1', 'tenant2'],
      invitesSent: ['invite1', 'invite2'],
      acceptedTenantDetails: [
        { id: 'tenant1', name: 'Test Tenant 1' },
        { id: 'tenant2', name: 'Test Tenant 2' }
      ],
    });
  });

  // Test 6: Profile Deletion Access Control
  await runTest('Landlord can delete their own profile', async () => {
    await testEnv.clearFirestore();
    await createTestUser(LANDLORD_UID, 'landlord');
    await createTestLandlordProfile(LANDLORD_UID);
    
    const landlordDb = testEnv.authenticatedContext(LANDLORD_UID).firestore();
    await landlordDb.collection('landlordProfiles').doc(LANDLORD_UID).delete();
  });

  await runTest('Other users cannot delete landlord profiles', async () => {
    await testEnv.clearFirestore();
    await createTestUser(LANDLORD_UID, 'landlord');
    await createTestUser(OTHER_USER_UID, 'tenant');
    await createTestLandlordProfile(LANDLORD_UID);
    
    const otherUserDb = testEnv.authenticatedContext(OTHER_USER_UID).firestore();
    
    try {
      await otherUserDb.collection('landlordProfiles').doc(LANDLORD_UID).delete();
      throw new Error('Should have been denied');
    } catch (error) {
      if (!error.message.includes('PERMISSION_DENIED')) {
        throw error;
      }
    }
  });

  // Test 7: Unauthenticated Access
  await runTest('Unauthenticated users cannot access profiles', async () => {
    await testEnv.clearFirestore();
    await createTestUser(LANDLORD_UID, 'landlord');
    await createTestLandlordProfile(LANDLORD_UID);
    
    const unauthDb = testEnv.unauthenticatedContext().firestore();
    
    try {
      await unauthDb.collection('landlordProfiles').doc(LANDLORD_UID).get();
      throw new Error('Should have been denied');
    } catch (error) {
      if (!error.message.includes('PERMISSION_DENIED')) {
        throw error;
      }
    }
  });
}

async function displayResults() {
  console.log('\n📊 Test Results:');
  console.log('='.repeat(30));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📋 Total:  ${testResults.total}`);
  console.log(`📈 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

  if (testResults.failed === 0) {
    console.log('\n🎉 All security rules tests passed!');
    console.log('\n🛡️ Security Validation Summary:');
    console.log('   ✅ Profile ownership verification');
    console.log('   ✅ Restricted field protection');
    console.log('   ✅ Cloud Functions admin access');
    console.log('   ✅ Unauthorized access prevention');
    console.log('   ✅ Data integrity enforcement');
    
    console.log('\n✨ The landlordProfiles collection is properly secured!');
    return true;
  } else {
    console.log('\n❌ Some security tests failed. Please review the Firestore rules.');
    return false;
  }
}

async function main() {
  try {
    console.log('\n📖 About these tests:');
    console.log('   These tests validate the enhanced security rules for the landlordProfiles collection.');
    console.log('   They ensure proper access control and field-level restrictions.\n');

    await setupTestEnvironment();
    await runTests();
    const success = await displayResults();
    await cleanupTestEnvironment();

    process.exit(success ? 0 : 1);

  } catch (error) {
    console.error('\n❌ Test runner failed:', error.message);
    await cleanupTestEnvironment();
    process.exit(1);
  }
}

// Run the tests if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  runTests: main
}; 