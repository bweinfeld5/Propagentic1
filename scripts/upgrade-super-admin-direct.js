#!/usr/bin/env node

/**
 * Script to upgrade admin@propagenticai.com to super_admin role using Firebase Admin SDK
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '../functions/service-account-key.json');

try {
  const serviceAccount = require(serviceAccountPath);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://propagentic.firebaseio.com'
  });
  
  console.log('✅ Firebase Admin initialized successfully');
} catch (error) {
  console.error('❌ Error initializing Firebase Admin:', error.message);
  console.error('💡 Make sure service-account-key.json exists in functions/ directory');
  process.exit(1);
}

/**
 * Upgrade admin user to super_admin
 */
async function upgradeSuperAdmin() {
  try {
    console.log('🔒 Upgrading admin@propagenticai.com to super_admin...');
    
    const adminEmail = 'admin@propagenticai.com';
    const uid = 'VIkgEcFBXBPMi1dOwzlKlDPJHkm1'; // Known UID from previous sessions
    
    const db = admin.firestore();
    
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
    await db.collection('userProfiles').doc(uid).set(superAdminProfile, { merge: true });
    
    console.log('✅ Profile written to Firestore successfully!');
    
    // Update Firebase Auth custom claims
    console.log('🔐 Setting Firebase Auth custom claims...');
    
    try {
      await admin.auth().setCustomUserClaims(uid, {
        role: 'super_admin',
        userType: 'super_admin',
        permissions: superAdminProfile.permissions
      });
      
      console.log('✅ Custom claims set successfully!');
    } catch (authError) {
      console.warn('⚠️  Warning: Could not set custom claims (user may not exist in Auth):', authError.message);
      console.log('💡 This is OK if the user logs in via Google Auth');
    }
    
    // Verify the update
    console.log('🔍 Verifying super_admin upgrade...');
    const updatedProfile = await db.collection('userProfiles').doc(uid).get();
    
    if (updatedProfile.exists) {
      const data = updatedProfile.data();
      
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
    } else {
      console.error('\n💥 Super admin upgrade failed');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Upgrade failed:', error.message);
    process.exit(1);
  } finally {
    // Clean up
    if (admin.apps.length > 0) {
      await admin.app().delete();
    }
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { upgradeSuperAdmin }; 