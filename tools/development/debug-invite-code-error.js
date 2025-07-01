#!/usr/bin/env node

/**
 * Quick Debug Script for "invalid-argument" Error
 * Focuses specifically on the current QR code generation issue
 */

console.log('🔍 PropAgentic QR Code Generation Debug');
console.log('=====================================\n');

// Check 1: Firestore Index Issue
console.log('1. 🗂️ FIRESTORE INDEX ISSUE (CRITICAL)');
console.log('   Your logs show a missing Firestore index for notifications:');
console.log('   ❌ "The query requires an index"');
console.log('');
console.log('   🔧 FIX: Click this URL to add the index:');
console.log('   https://console.firebase.google.com/v1/r/project/propagentic/firestore/indexes?create_composite=ClFwcm9qZWN0cy9wcm9wYWdlbnRpYy9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvbm90aWZpY2F0aW9ucy9pbmRleGVzL18QARoKCgZ1c2VySWQQARoNCgljcmVhdGVkQXQQAioMCghfX25hbWVfXxAC');
console.log('');

// Check 2: Authentication Issue
console.log('2. 🔐 AUTHENTICATION ISSUE');
console.log('   Your logs show: "Missing or insufficient permissions"');
console.log('   This suggests:');
console.log('   - Invalid or expired Firebase ID token');
console.log('   - User not authenticated properly');
console.log('   - User doesn\'t have access to the property');
console.log('');

// Check 3: QR Code Generation Issues
console.log('3. 🎯 QR CODE GENERATION ISSUES');
console.log('   The "invalid-argument" error likely means:');
console.log('   ❌ Missing or invalid propertyId');
console.log('   ❌ Property doesn\'t exist in Firestore');
console.log('   ❌ User doesn\'t own the property');
console.log('   ❌ Invalid Firebase authentication token');
console.log('');

// Check 4: Icon Loading Issue
console.log('4. 🖼️ ICON LOADING ISSUE (Minor)');
console.log('   Your logs show: "Download error or resource isn\'t a valid image"');
console.log('   Missing icon file: /icons/icon-144x144.png');
console.log('   This is cosmetic but should be fixed for PWA compliance.');
console.log('');

// Immediate Actions
console.log('🚨 IMMEDIATE ACTIONS TO FIX:');
console.log('');
console.log('Step 1: Fix Firestore Index (REQUIRED)');
console.log('  - Click the URL above to add the missing index');
console.log('  - Wait 2-5 minutes for it to build');
console.log('');
console.log('Step 2: Check Firebase Authentication');
console.log('  - Logout and login again in the app');
console.log('  - Make sure you\'re authenticated as a landlord');
console.log('');
console.log('Step 3: Verify Property Ownership');
console.log('  - Make sure you created a property in the app');
console.log('  - Check that the property has your user ID as owner');
console.log('');
console.log('Step 4: Test QR Generation Again');
console.log('  - Try generating QR code after fixing above');
console.log('');

// Advanced Debugging
console.log('🔧 ADVANCED DEBUGGING:');
console.log('');
console.log('Check Firebase Functions logs:');
console.log('  firebase functions:log --only generateInviteCode');
console.log('');
console.log('Check Firestore data:');
console.log('  - Verify your user document exists in users collection');
console.log('  - Verify property document exists in properties collection');
console.log('  - Check that property.landlordId matches your user ID');
console.log('');
console.log('Test with local emulator:');
console.log('  firebase emulators:start');
console.log('  # Then test in local environment');
console.log('');

// Run Firebase logs check
console.log('📋 CHECKING FIREBASE FUNCTIONS STATUS...');
console.log('');

const { spawn } = require('child_process');

// Try to get Firebase Functions logs
const logs = spawn('firebase', ['functions:log', '--only', 'generateInviteCode', '--limit', '10'], {
  stdio: 'pipe'
});

let logOutput = '';

logs.stdout.on('data', (data) => {
  logOutput += data.toString();
});

logs.stderr.on('data', (data) => {
  logOutput += data.toString();
});

logs.on('close', (code) => {
  if (code === 0 && logOutput.trim()) {
    console.log('📋 Recent Firebase Functions Logs:');
    console.log('----------------------------------');
    console.log(logOutput);
  } else {
    console.log('📋 Could not retrieve Firebase Functions logs.');
    console.log('   Run manually: firebase functions:log --only generateInviteCode');
  }
  
  console.log('\n✅ Debug analysis complete!');
  console.log('');
  console.log('🎯 PRIMARY FOCUS: Fix the Firestore index first!');
  console.log('   The missing index is likely causing cascade failures.');
});

logs.on('error', (error) => {
  console.log('📋 Firebase CLI not available or error occurred.');
  console.log('   Install with: npm install -g firebase-tools');
  console.log('   Then run: firebase functions:log --only generateInviteCode');
  
  console.log('\n✅ Debug analysis complete!');
  console.log('');
  console.log('🎯 PRIMARY FOCUS: Fix the Firestore index first!');
  console.log('   The missing index is likely causing cascade failures.');
});
