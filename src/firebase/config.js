/**
 * Firebase Configuration
 * PropAgentic Firebase setup
 */

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Firebase configuration (using environment variables for security)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "demo-api-key",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "propagentic-demo.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "propagentic-demo",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "propagentic-demo.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:123456789:web:abcdefghijklmnop"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Mock callFunction for development (would be replaced with actual Firebase Functions in production)
export const callFunction = async (functionName, data) => {
  console.warn(`Mock callFunction called: ${functionName}`, data);
  // Return mock response for development
  return Promise.resolve({ data: { success: true } });
};

// Export configuration for testing
export { firebaseConfig }; 