#!/usr/bin/env node

/**
 * Script to call the fixSuperAdminPermissions Cloud Function
 */

const { initializeApp } = require('firebase/app');
const { getFunctions, httpsCallable } = require('firebase/functions');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyASqNnCHAhCiQUm3_8XnCz7Kcjj8fZ5Y-c",
  authDomain: "propagentic.firebaseapp.com",
  databaseURL: "https://propagentic-default-rtdb.firebaseio.com",
  projectId: "propagentic",
  storageBucket: "propagentic.appspot.com",
  messagingSenderId: "1047878139430",
  appId: "1:1047878139430:web:2f7b4b2c1d8e3f4a5b6c7d"
};

/**
 * Call the Cloud Function to fix super admin permissions
 */
async function callFixSuperAdminPermissions() {
  try {
    console.log('🚀 Calling fixSuperAdminPermissions Cloud Function...\n');
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const functions = getFunctions(app);
    
    // Get the function reference
    const fixSuperAdminPermissions = httpsCallable(functions, 'fixSuperAdminPermissions');
    
    console.log('📞 Invoking Cloud Function...');
    
    // Call the function
    const result = await fixSuperAdminPermissions({});
    
    console.log('✅ Cloud Function completed successfully!');
    console.log('\n📊 Result:', JSON.stringify(result.data, null, 2));
    
    if (result.data.success) {
      console.log('\n🎉 Super admin permissions have been fixed!');
      console.log('\n📋 Next steps:');
      console.log('1. Have admin@propagenticai.com log out and log back in');
      console.log('2. Navigate to /admin/dashboard');
      console.log('3. Verify access to audit logs and system configuration');
      console.log('4. Test all admin dashboard features');
    } else {
      console.error('\n❌ Function reported failure:', result.data.message);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Error calling Cloud Function:', error.message);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    const success = await callFixSuperAdminPermissions();
    
    if (!success) {
      console.error('\n💥 Failed to fix super admin permissions');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Script failed:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { callFixSuperAdminPermissions }; 