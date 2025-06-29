#!/usr/bin/env node

/**
 * Script to fix super admin permissions by ensuring the user exists in both 
 * users and userProfiles collections with consistent data
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc } = require('firebase/firestore');

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
 * Fix super admin permissions
 */
async function fixSuperAdminPermissions() {
  try {
    console.log('🔧 Fixing super admin permissions...');
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    const adminEmail = 'admin@propagenticai.com';
    const uid = 'VIkgEcFBXBPMi1dOwzlKlDPJHkm1';
    
    console.log(`📋 Admin Details:`);
    console.log(`  - UID: ${uid}`);
    console.log(`  - Email: ${adminEmail}`);
    
    // Create super admin profile data
    const superAdminProfile = {
      uid: uid,
      email: adminEmail,
      displayName: 'PropAgentic Super Admin',
      firstName: 'PropAgentic',
      lastName: 'Super Admin',
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
      status: 'active',
      emailVerified: true,
      onboardingComplete: true,
      profileComplete: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: null
    };
    
    console.log('\n📝 Step 1: Writing to users collection (for security rules)...');
    const usersDocRef = doc(db, 'users', uid);
    await setDoc(usersDocRef, superAdminProfile, { merge: true });
    console.log('✅ Successfully written to users collection');
    
    console.log('\n📝 Step 2: Writing to userProfiles collection (for admin dashboard)...');
    const userProfilesDocRef = doc(db, 'userProfiles', uid);
    await setDoc(userProfilesDocRef, superAdminProfile, { merge: true });
    console.log('✅ Successfully written to userProfiles collection');
    
    console.log('\n🔍 Step 3: Verifying both documents...');
    
    // Verify users collection
    const usersSnapshot = await getDoc(usersDocRef);
    if (usersSnapshot.exists()) {
      const usersData = usersSnapshot.data();
      console.log(`✅ Users collection verified - Role: ${usersData.role}, UserType: ${usersData.userType}`);
    } else {
      console.error('❌ Users collection document not found');
      return false;
    }
    
    // Verify userProfiles collection
    const userProfilesSnapshot = await getDoc(userProfilesDocRef);
    if (userProfilesSnapshot.exists()) {
      const userProfilesData = userProfilesSnapshot.data();
      console.log(`✅ UserProfiles collection verified - Role: ${userProfilesData.role}, UserType: ${userProfilesData.userType}`);
    } else {
      console.error('❌ UserProfiles collection document not found');
      return false;
    }
    
    console.log('\n🎉 Super admin permissions fixed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. The user now exists in both collections required by security rules');
    console.log('2. Have admin@propagenticai.com log out and log back in');
    console.log('3. Custom claims should also be set via Firebase Auth (if not already done)');
    console.log('4. Navigate to /admin/dashboard to test access');
    console.log('5. Verify audit logs and system configuration access');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error fixing super admin permissions:', error.message);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🚀 Starting super admin permissions fix...\n');
    
    const success = await fixSuperAdminPermissions();
    
    if (success) {
      console.log('\n🎉 Super admin permissions fix completed successfully!');
      console.log('\n⚠️  Important Notes:');
      console.log('- The security rules now check both users and userProfiles collections');
      console.log('- Custom claims in Firebase Auth provide the primary role verification');
      console.log('- Firestore documents serve as fallback for role verification');
      console.log('- Both collections are now consistent for the super admin user');
    } else {
      console.error('\n💥 Super admin permissions fix failed');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Fix failed:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { fixSuperAdminPermissions }; 