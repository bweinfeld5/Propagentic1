/**
 * Test Script for Invite Code Redemption
 * 
 * This script demonstrates how to test the redeemInviteCode functionality
 * Run with: node scripts/test-invite-code-redemption.js
 */

const { initializeApp } = require('firebase/app');
const { getFunctions, httpsCallable, connectFunctionsEmulator } = require('firebase/functions');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

// Load environment variables for local testing
require('dotenv').config();

// Firebase config - Replace with your own or load from environment variables
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const functions = getFunctions(app);

// For local testing with Firebase emulator
const useEmulator = process.env.USE_EMULATOR === 'true';
if (useEmulator) {
  connectFunctionsEmulator(functions, 'localhost', 5001);
  console.log('Using Firebase Functions emulator');
}

/**
 * Test the invite code redemption process
 * @param {string} email - Email for tenant account
 * @param {string} password - Password for tenant account
 * @param {string} inviteCode - Invite code to redeem
 */
async function testInviteCodeRedemption(email, password, inviteCode) {
  try {
    // 1. Sign in as tenant
    console.log(`Signing in as tenant: ${email}`);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const tenant = userCredential.user;
    console.log(`Successfully signed in. Tenant ID: ${tenant.uid}`);
    
    // 2. Call the redeemInviteCode function
    console.log(`Redeeming invite code: ${inviteCode}`);
    const redeemFunction = httpsCallable(functions, 'redeemInviteCode');
    
    const result = await redeemFunction({ 
      code: inviteCode
      // tenantId is automatically included from auth context
    });
    
    console.log('Redemption successful!');
    console.log('Result:', JSON.stringify(result.data, null, 2));
    
    return result.data;
  } catch (error) {
    console.error('Error during invite code redemption test:', error);
    if (error.code) {
      console.error(`Firebase error code: ${error.code}`);
    }
    if (error.details) {
      console.error('Error details:', error.details);
    }
    throw error;
  }
}

/**
 * Run the test with command line arguments
 */
async function main() {
  if (process.argv.length < 5) {
    console.log('Usage: node test-invite-code-redemption.js <email> <password> <inviteCode>');
    process.exit(1);
  }
  
  const [, , email, password, inviteCode] = process.argv;
  
  try {
    await testInviteCodeRedemption(email, password, inviteCode);
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Test failed');
    process.exit(1);
  }
}

// Run the test
main(); 