/**
 * Test Script for Invite Code Creation
 * 
 * This script demonstrates how to test the generateInviteCode functionality
 * Run with: node scripts/test-invite-code-creation.js
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
 * Test the invite code creation process
 * @param {string} email - Email for landlord account
 * @param {string} password - Password for landlord account
 * @param {string} propertyId - ID of the property for the invite code
 * @param {Object} options - Optional parameters
 */
async function testInviteCodeCreation(
  email, 
  password, 
  propertyId, 
  options = {}
) {
  const { unitId, tenantEmail, expirationDays = 7 } = options;
  
  try {
    // 1. Sign in as landlord
    console.log(`Signing in as landlord: ${email}`);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const landlord = userCredential.user;
    console.log(`Successfully signed in. Landlord ID: ${landlord.uid}`);
    
    // 2. Call the generateInviteCode function
    console.log(`Creating invite code for property: ${propertyId}`);
    const generateFunction = httpsCallable(functions, 'generateInviteCode');
    
    const result = await generateFunction({ 
      propertyId,
      unitId,
      email: tenantEmail,
      expirationDays
    });
    
    console.log('Invite code creation successful!');
    console.log('Result:', JSON.stringify(result.data, null, 2));
    console.log('\nSHARE THIS CODE WITH TENANT:', result.data.inviteCode.code);
    
    return result.data;
  } catch (error) {
    console.error('Error during invite code creation test:', error);
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
  const usage = 'Usage: node test-invite-code-creation.js <email> <password> <propertyId> [unitId] [tenantEmail] [expirationDays]';
  
  if (process.argv.length < 5) {
    console.log(usage);
    process.exit(1);
  }
  
  const [, , email, password, propertyId, unitId, tenantEmail, expirationDaysStr] = process.argv;
  const expirationDays = expirationDaysStr ? parseInt(expirationDaysStr, 10) : undefined;
  
  try {
    const options = {
      unitId,
      tenantEmail,
      expirationDays
    };
    
    await testInviteCodeCreation(email, password, propertyId, options);
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Test failed');
    process.exit(1);
  }
}

// Run the test
main(); 