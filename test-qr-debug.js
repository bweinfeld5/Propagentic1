#!/usr/bin/env node

/**
 * QR Code Generation Debugging Script
 * Tests each step of the QR code generation process to identify root causes
 */

const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFunctions, httpsCallable } = require('firebase/functions');
const { getFirestore, collection, query, where, getDocs } = require('firebase/firestore');

// Load environment variables
require('dotenv').config();

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

console.log('🔧 QR Code Generation Debug Tool');
console.log('==========================================');

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const functions = getFunctions(app);
const db = getFirestore(app);

async function testFirebaseConfig() {
  console.log('\n📋 Step 1: Testing Firebase Configuration');
  console.log('------------------------------------------');
  
  console.log('🔧 Firebase Config:', {
    apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 20)}...` : 'MISSING',
    authDomain: firebaseConfig.authDomain || 'MISSING',
    projectId: firebaseConfig.projectId || 'MISSING',
    storageBucket: firebaseConfig.storageBucket || 'MISSING',
    appId: firebaseConfig.appId ? `${firebaseConfig.appId.substring(0, 20)}...` : 'MISSING'
  });
  
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'appId'];
  const missingFields = requiredFields.filter(field => !firebaseConfig[field]);
  
  if (missingFields.length > 0) {
    console.error('❌ Missing required Firebase config fields:', missingFields);
    return false;
  }
  
  console.log('✅ Firebase configuration appears valid');
  return true;
}

async function testAuthentication() {
  console.log('\n📋 Step 2: Testing Authentication');
  console.log('----------------------------------');
  
  const email = process.env.FIREBASE_TEST_EMAIL || 'your-test-email@example.com';
  const password = process.env.FIREBASE_TEST_PASSWORD || 'your-test-password';
  
  if (email === 'your-test-email@example.com') {
    console.log('⚠️  Please set FIREBASE_TEST_EMAIL and FIREBASE_TEST_PASSWORD in your .env file');
    console.log('   FIREBASE_TEST_EMAIL=your-landlord-email@example.com');
    console.log('   FIREBASE_TEST_PASSWORD=your-password');
    return null;
  }
  
  try {
    console.log('🔧 Attempting to sign in with:', email);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('✅ Authentication successful:', {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified
    });
    
    const idToken = await user.getIdToken(true);
    console.log('✅ ID Token acquired:', {
      length: idToken.length,
      prefix: idToken.substring(0, 30) + '...'
    });
    
    return user;
  } catch (error) {
    console.error('❌ Authentication failed:', {
      code: error.code,
      message: error.message
    });
    return null;
  }
}

async function testInviteCodeGeneration(user) {
  console.log('\n📋 Step 3: Testing Invite Code Generation');
  console.log('-------------------------------------------');
  
  if (!user) {
    console.log('⚠️  Skipping invite code test (no authenticated user)');
    return;
  }
  
  try {
    // Get user's properties
    const propertiesRef = collection(db, 'properties');
    const propertiesQuery = query(propertiesRef, where('landlordId', '==', user.uid));
    const propertiesSnapshot = await getDocs(propertiesQuery);
    
    if (propertiesSnapshot.empty) {
      console.log('⚠️  No properties found - creating test data...');
      console.log('   Please ensure you have at least one property in Firestore');
      return;
    }
    
    const property = propertiesSnapshot.docs[0];
    console.log('✅ Found property:', {
      id: property.id,
      name: property.data().name || 'Unnamed'
    });
    
    // Test Firebase Function call
    const generateInviteCodeFunction = httpsCallable(functions, 'generateInviteCode');
    
    console.log('🔧 Calling generateInviteCode function...');
    const result = await generateInviteCodeFunction({
      propertyId: property.id,
      expirationDays: 7
    });
    
    console.log('📥 Function response:', result.data);
    
    if (result.data && result.data.success) {
      console.log('✅ Invite code generation successful!');
      console.log('🎉 Generated code:', result.data.inviteCode.code);
    } else {
      console.error('❌ Function returned unsuccessful result');
    }
    
  } catch (error) {
    console.error('❌ Invite code generation failed:', {
      code: error.code,
      message: error.message,
      details: error.details
    });
    
    // Error analysis
    if (error.code === 'functions/unauthenticated') {
      console.log('\n🔍 AUTHENTICATION ERROR DETECTED');
      console.log('This means the Firebase Function cannot verify your identity.');
      console.log('Possible causes:');
      console.log('• ID token is not being sent with the request');
      console.log('• Token has expired or is invalid');
      console.log('• Function auth verification is failing');
    } else if (error.code === 'functions/invalid-argument') {
      console.log('\n🔍 INVALID ARGUMENT ERROR DETECTED');
      console.log('This means the function parameters are invalid.');
      console.log('Possible causes:');
      console.log('• Property ID doesn\'t exist');
      console.log('• User doesn\'t own the property');
      console.log('• Missing required parameters');
    } else if (error.code === 'functions/internal') {
      console.log('\n🔍 INTERNAL FUNCTION ERROR DETECTED');
      console.log('This means the function crashed internally.');
      console.log('Possible causes:');
      console.log('• Missing Firestore index');
      console.log('• Database permissions issue');
      console.log('• Function code error');
    }
  }
}

async function runDebugSuite() {
  console.log('🚀 Starting QR Code Debug Suite...');
  
  try {
    const configValid = await testFirebaseConfig();
    if (!configValid) return;
    
    const user = await testAuthentication();
    await testInviteCodeGeneration(user);
    
    console.log('\n🏁 Debug Suite Complete');
    console.log('========================');
    
  } catch (error) {
    console.error('💥 Debug suite crashed:', error);
  }
}

runDebugSuite().then(() => {
  console.log('\n👋 Debug complete.');
}).catch(console.error);
