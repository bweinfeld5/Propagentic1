/**
 * Firebase Configuration
 * PropAgentic Firebase setup
 */

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAnalytics } from 'firebase/analytics';
import { getDatabase } from 'firebase/database';

// Firebase configuration (using environment variables for security)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "demo-api-key",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "propagentic-demo.firebaseapp.com",
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL || "https://propagentic-default-rtdb.firebaseio.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "propagentic-demo",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "propagentic-demo.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:123456789:web:abcdefghijklmnop",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
export const database = getDatabase(app); // Realtime Database

// Initialize Analytics only if measurement ID is provided
export const analytics = firebaseConfig.measurementId ? getAnalytics(app) : null;

// Real callFunction implementation using Firebase Functions
export const callFunction = async (functionName, data) => {
  try {
    console.log(`Calling Firebase Function: ${functionName}`, data);
    const callable = httpsCallable(functions, functionName);
    const result = await callable(data);
    return result.data;
  } catch (error) {
    console.error(`Error calling function ${functionName}:`, error);
    
    // Handle specific function failures gracefully
    if (functionName === 'getStripeBankAccountStatus') {
      return { bankAccount: null };
    }
    if (functionName === 'createBankAccountSetupLink') {
      throw new Error('Payment functions are being deployed. Please skip this step for now and return later to complete payment setup.');
    }
    if (functionName === 'verifyBankAccountMicroDeposits') {
      return { success: false };
    }
    
    // Re-throw other errors
    throw error;
  }
};

// Export configuration for testing
export { firebaseConfig }; 