#!/usr/bin/env node

/**
 * Quick check for Charlie Gallagher's email verification status
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin
let app, auth, db;

try {
  const serviceAccount = require('../service-account-key.json');
  
  app = initializeApp({
    credential: cert(serviceAccount),
    databaseURL: "https://propagentic-default-rtdb.firebaseio.com"
  });
  
  auth = getAuth();
  db = getFirestore();
  
  console.log('✅ Firebase Admin initialized');
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin');
  console.error('Please ensure you have the service account key available');
  process.exit(1);
}

async function checkCharlieStatus() {
  const charlieUID = 'SnWJapdP82VWCMicgVhbxHYPmo23';
  const charlieEmail = 'charlie@propagenticai.com';
  
  console.log('🔍 Checking Charlie Gallagher\'s email verification status...\n');
  
  try {
    // Get Auth record
    const authUser = await auth.getUser(charlieUID);
    
    // Get Firestore record
    const firestoreDoc = await db.collection('users').doc(charlieUID).get();
    const firestoreData = firestoreDoc.data();
    
    console.log('📧 CHARLIE GALLAGHER EMAIL VERIFICATION STATUS');
    console.log('================================================');
    console.log(`Email: ${charlieEmail}`);
    console.log(`UID: ${charlieUID}`);
    console.log('');
    console.log(`🔐 Firebase Auth emailVerified: ${authUser.emailVerified}`);
    console.log(`🗃️  Firestore emailVerified: ${firestoreData?.emailVerified}`);
    console.log('');
    
    if (authUser.emailVerified !== firestoreData?.emailVerified) {
      console.log('⚠️  DISCREPANCY DETECTED!');
      console.log('   Auth and Firestore email verification status do not match.');
      console.log('   This needs to be fixed for proper authentication flow.');
    } else {
      console.log('✅ Email verification status is consistent across both systems.');
    }
    
    return {
      auth: authUser.emailVerified,
      firestore: firestoreData?.emailVerified,
      consistent: authUser.emailVerified === firestoreData?.emailVerified
    };
    
  } catch (error) {
    console.error('❌ Error checking Charlie\'s status:', error);
    return { error: error.message };
  }
}

// Run the check
checkCharlieStatus()
  .then(result => {
    console.log('\n📊 Result:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Script error:', error);
    process.exit(1);
  }); 