#!/usr/bin/env node

/**
 * Firebase Connection Test Script
 * 
 * This script tests the Firebase Admin SDK connection to ensure
 * authentication and permissions are working before running migrations.
 * 
 * Usage: node scripts/test-firebase-connection.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin with proper configuration
const serviceAccountPath = path.join(__dirname, '../service-account-key.json');

console.log('🔬 Firebase Connection Test');
console.log('==========================');
console.log('');

// Try different authentication methods
if (fs.existsSync(serviceAccountPath)) {
  console.log('🔑 Using service account key for authentication...');
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id || 'propagentic'
  });
  console.log(`📋 Project ID: ${serviceAccount.project_id}`);
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.log('🔑 Using GOOGLE_APPLICATION_CREDENTIALS environment variable...');
  const projectId = process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID || 'propagentic';
  admin.initializeApp({
    projectId: projectId
  });
  console.log(`📋 Project ID: ${projectId}`);
} else {
  console.log('🔑 Using default credentials...');
  const projectId = process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID || 'propagentic';
  admin.initializeApp({
    projectId: projectId
  });
  console.log(`📋 Project ID: ${projectId}`);
}

const db = admin.firestore();

async function runTests() {
  try {
    console.log('');
    console.log('🧪 Running Firebase Tests...');
    console.log('');

    // Test 1: Basic connection
    console.log('1️⃣ Testing basic Firestore connection...');
    await db.collection('_test').limit(1).get();
    console.log('   ✅ Basic connection successful');

    // Test 2: Read contractors collection
    console.log('2️⃣ Testing contractors collection access...');
    const contractorsSnapshot = await db.collection('contractors').limit(1).get();
    console.log(`   ✅ Contractors collection accessible (${contractorsSnapshot.size} documents found)`);

    // Test 3: Read contractorProfiles collection
    console.log('3️⃣ Testing contractorProfiles collection access...');
    const contractorProfilesSnapshot = await db.collection('contractorProfiles').limit(1).get();
    console.log(`   ✅ ContractorProfiles collection accessible (${contractorProfilesSnapshot.size} documents found)`);

    // Test 4: Write permissions test (safe test)
    console.log('4️⃣ Testing write permissions...');
    const testDocRef = db.collection('_migration_test').doc('connection_test');
    await testDocRef.set({
      testTimestamp: admin.firestore.FieldValue.serverTimestamp(),
      testData: 'Firebase connection test'
    });
    console.log('   ✅ Write permissions successful');

    // Clean up test document
    await testDocRef.delete();
    console.log('   🧹 Test document cleaned up');

    // Summary
    console.log('');
    console.log('🎉 All tests passed! Firebase connection is working properly.');
    console.log('✅ Ready to run migration: node scripts/migrate-contractor-contracts.js');

  } catch (error) {
    console.error('');
    console.error('❌ Firebase test failed:', error.message);
    console.error('');
    console.error('💡 Troubleshooting tips:');
    console.error('   1. Make sure service-account-key.json exists in the project root');
    console.error('   2. Verify the service account has Firestore permissions');
    console.error('   3. Check if you need to set GOOGLE_APPLICATION_CREDENTIALS');
    console.error('   4. Ensure you have the correct project ID');
    console.error('   5. Verify your network connection to Firebase');
    console.error('');
    process.exit(1);
  }
}

// Main execution
if (require.main === module) {
  runTests()
    .then(() => {
      console.log('🏁 Firebase connection test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Firebase connection test failed:', error);
      process.exit(1);
    });
}

module.exports = { runTests }; 