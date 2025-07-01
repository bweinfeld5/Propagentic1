#!/usr/bin/env node

/**
 * Script to upgrade admin@propagenticai.com to super_admin role using Firebase Client SDK
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc } = require('firebase/firestore');

// Firebase configuration - use the actual project config
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
 * Upgrade admin user to super_admin
 */
async function upgradeSuperAdmin() {
  try {
    console.log('🔒 Upgrading admin@propagenticai.com to super_admin...');
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    const adminEmail = 'admin@propagenticai.com';
    const uid = 'VIkgEcFBXBPMi1dOwzlKlDPJHkm1'; // Known UID from previous sessions
    
    // Create super admin profile data
    const superAdminProfile = {
      uid: uid,
      email: adminEmail,
      displayName: 'PropAgentic Super Admin',
      role: 'super_admin',
      userType: 'super_admin',
      permissions: [
        'read_users',
        'write_users', 
        'delete_users',
        'read_system_config',
        'write_system_config',
        'read_audit_logs',
        'write_audit_logs',
        'manage_roles',
        'system_maintenance',
        'security_monitoring'
      ],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: null
    };
    
    console.log('📝 Writing super admin profile to Firestore...');
    console.log(`  - UID: ${uid}`);
    console.log(`  - Email: ${adminEmail}`);
    console.log(`  - Role: ${superAdminProfile.role}`);
    console.log(`  - Permissions: ${superAdminProfile.permissions.length} permissions`);
    
    // Write to Firestore
    const userDocRef = doc(db, 'userProfiles', uid);
    await setDoc(userDocRef, superAdminProfile, { merge: true });
    
    console.log('✅ Profile written to Firestore successfully!');
    
    // Verify the update
    console.log('🔍 Verifying super_admin upgrade...');
    const updatedProfileSnapshot = await getDoc(userDocRef);
    
    if (updatedProfileSnapshot.exists()) {
      const data = updatedProfileSnapshot.data();
      
      console.log('✅ Verification complete!');
      console.log(`  - UID: ${data.uid}`);
      console.log(`  - Email: ${data.email}`);
      console.log(`  - Display Name: ${data.displayName}`);
      console.log(`  - Role: ${data.role}`);
      console.log(`  - User Type: ${data.userType}`);
      console.log(`  - Permissions: ${data.permissions ? data.permissions.length : 0} permissions`);
      console.log(`  - Active: ${data.isActive}`);
      
      if (data.role === 'super_admin' && data.userType === 'super_admin') {
        console.log('🎉 Successfully upgraded admin@propagenticai.com to super_admin!');
        console.log('💡 The user now has full system access including:');
        console.log('  - User management (create, edit, delete)');
        console.log('  - System configuration');
        console.log('  - Audit log access');
        console.log('  - Security monitoring');
        console.log('  - Role management');
        return true;
      } else {
        console.error('❌ Upgrade verification failed - role not properly set');
        return false;
      }
    } else {
      console.error('❌ Profile not found after write');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error upgrading super admin:', error.message);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🚀 Starting super admin upgrade...\n');
    
    // Upgrade the admin
    const success = await upgradeSuperAdmin();
    
    if (success) {
      console.log('\n🎉 Super admin upgrade completed successfully!');
      console.log('📋 Next steps:');
      console.log('1. Have admin@propagenticai.com log out and log back in');
      console.log('2. Navigate to /admin/dashboard');
      console.log('3. Verify access to System Configuration panel');
      console.log('4. Test all admin dashboard features');
      console.log('5. If auth issues persist, custom claims may need manual setup');
    } else {
      console.error('\n💥 Super admin upgrade failed');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Upgrade failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { upgradeSuperAdmin }; 