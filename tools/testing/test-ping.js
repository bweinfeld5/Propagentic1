// Test if Cloud Functions are working
const { initializeApp } = require('firebase/app');
const { getFunctions, httpsCallable } = require('firebase/functions');

// Your Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyA1j5o9uI3NFeufUuJOKR3-TQzQk-mh8JE",
  authDomain: "propagentic.firebaseapp.com",
  projectId: "propagentic",
  storageBucket: "propagentic.firebasestorage.app",
  messagingSenderId: "859812091492",
  appId: "1:859812091492:web:8e9e6c8fbfecbc8fa8f1e5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);

// Test the ping function
async function testPing() {
  try {
    console.log('Testing ping function...');
    const pingFunction = httpsCallable(functions, 'ping');
    const result = await pingFunction({});
    console.log('Ping function response:', result.data);
    console.log('✅ Cloud Functions are working!');
  } catch (error) {
    console.error('❌ Error calling ping function:', error);
  }
}

// Run the test
testPing();
