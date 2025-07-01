#!/usr/bin/env node

/**
 * Script to get a real Firebase ID token for testing
 */

const admin = require('firebase-admin');
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword, getIdToken } = require('firebase/auth');

console.log('🔑 Firebase Token Generator for Testing');
console.log('====================================\n');

// Firebase config (this is safe to expose - it's public info)
const firebaseConfig = {
  apiKey: "AIzaSyDcsJWLoVoC_kPORoVJA_-mG3LIWfbU-rw",
  authDomain: "propagentic.firebaseapp.com",
  projectId: "propagentic",
  storageBucket: "propagentic.firebasestorage.app",
  messagingSenderId: "121286300748",
  appId: "1:121286300748:web:0c69ea6ff643c8f75110e9",
  measurementId: "G-7DTWZQH28H"
};

console.log('To get a real Firebase ID token, you have several options:\n');

console.log('Option 1: From Browser (Easiest)');
console.log('--------------------------------');
console.log('1. Go to https://propagentic.web.app');
console.log('2. Login with your account');
console.log('3. Open DevTools (F12)');
console.log('4. Go to Application tab → Local Storage → https://propagentic.web.app');
console.log('5. Look for firebase:authUser:...');
console.log('6. Copy the "accessToken" or "stsTokenManager.accessToken" value');
console.log('7. That\'s your Firebase ID token!\n');

console.log('Option 2: From Console');
console.log('---------------------');
console.log('Run: firebase login');
console.log('Then: firebase auth:print-access-token\n');

console.log('Option 3: Create Test Token (Advanced)');
console.log('--------------------------------------');
console.log('If you want to create a test token programmatically:');
console.log('1. You need Firebase Admin SDK service account key');
console.log('2. Create custom token with admin.auth().createCustomToken()');
console.log('3. Exchange for ID token via Firebase Auth REST API');
console.log('4. This is more complex but useful for automated testing\n');

console.log('Once you have the token:');
console.log('1. Edit test-invite-code-generation.js');
console.log('2. Replace TEST_TOKEN with your real token');
console.log('3. Run: node test-invite-code-generation.js\n');

console.log('🎯 Quick Test Instructions:');
console.log('1. Get token using Option 1 above');
console.log('2. Replace TEST_TOKEN in test-invite-code-generation.js');
console.log('3. Run: node test-invite-code-generation.js');
console.log('4. This will test the actual Firebase Function with real auth\n');

console.log('✅ For immediate debugging, the main issue is:');
console.log('❌ "Decoding Firebase ID token failed"');
console.log('   This means the token being sent is invalid/malformed');
console.log('   Check that your app is sending the full JWT token');
console.log('   Token should look like: eyJhbGciOiJSUzI1NiIs...\n');
