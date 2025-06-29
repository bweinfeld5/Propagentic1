#!/usr/bin/env node

/**
 * Script to upgrade admin@propagenticai.com to super_admin role
 * Run with: firebase use propagentic && node scripts/upgrade-super-admin.js
 */

const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

/**
 * Generate super admin profile data
 */
function generateSuperAdminProfileData(existingProfile = {}) {
  const timestamp = new Date().toISOString();
  
  return {
    ...existingProfile,
    role: 'super_admin',
    userType: 'super_admin',
    email: 'admin@propagenticai.com',
    displayName: existingProfile.displayName || 'PropAgentic Super Admin',
    updatedAt: timestamp,
    createdAt: existingProfile.createdAt || timestamp,
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
    lastLoginAt: existingProfile.lastLoginAt || null
  };
}

/**
 * Upgrade admin user to super_admin
 */
async function upgradeSuperAdmin() {
  try {
    console.log('🔒 Upgrading admin@propagenticai.com to super_admin...');
    
    const adminEmail = 'admin@propagenticai.com';
    
    // Let's use a known UID pattern or create one if needed
    // First, let's try to read from common UID locations
    const possibleUIDs = [
      'VIkgEcFBXBPMi1dOwzlKlDPJHkm1', // From previous session
      'admin-propagentic',
      'super-admin-propagentic'
    ];
    
    let existingProfile = null;
    let uid = null;
    
    // Try to find existing profile
    for (const testUID of possibleUIDs) {
      try {
        console.log(`🔍 Checking for existing profile with UID: ${testUID}...`);
        const readCommand = `firebase firestore:read "userProfiles/${testUID}"`;
        const { stdout } = await execAsync(readCommand);
        const profile = JSON.parse(stdout);
        
        if (profile && profile.email === adminEmail) {
          console.log(`✅ Found existing profile with UID: ${testUID}`);
          existingProfile = profile;
          uid = testUID;
          break;
        }
      } catch (readError) {
        // Profile doesn't exist with this UID, continue
        console.log(`  - No profile found with UID: ${testUID}`);
      }
    }
    
    // If no existing profile found, use the first UID
    if (!uid) {
      uid = possibleUIDs[0];
      console.log(`📝 Creating new super admin profile with UID: ${uid}`);
    }
    
    // Create updated profile data
    const updatedProfile = generateSuperAdminProfileData(existingProfile || {});
    updatedProfile.uid = uid;
    
    // Write updated data to temp file
    const fs = require('fs');
    const tempFile = '/tmp/super-admin-profile.json';
    
    fs.writeFileSync(tempFile, JSON.stringify(updatedProfile, null, 2));
    
    console.log('📝 Writing super admin profile...');
    console.log(`  - UID: ${uid}`);
    console.log(`  - Email: ${updatedProfile.email}`);
    console.log(`  - Role: ${updatedProfile.role}`);
    console.log(`  - User Type: ${updatedProfile.userType}`);
    console.log(`  - Temp file: ${tempFile}`);
    
    // Debug: Show file content
    console.log('📄 Profile data preview:');
    console.log(JSON.stringify(updatedProfile, null, 2).substring(0, 500) + '...');
    
    // Update the user profile
    const updateCommand = `firebase firestore:write "userProfiles/${uid}" ${tempFile}`;
    
    try {
      const { stdout, stderr } = await execAsync(updateCommand);
      
      if (stderr && stderr.trim()) {
        console.error('❌ Error details from Firebase:', stderr);
        return false;
      }
      
      console.log('✅ Profile written successfully!');
      if (stdout && stdout.trim()) {
        console.log('Firebase response:', stdout);
      }
    } catch (writeError) {
      console.error('❌ Error executing write command:', writeError.message);
      if (writeError.stderr) {
        console.error('❌ Firebase error details:', writeError.stderr);
      }
      return false;
    }
    
    // Clean up temp file
    fs.unlinkSync(tempFile);
    
    // Verify the update
    console.log('🔍 Verifying super_admin upgrade...');
    const verifyCommand = `firebase firestore:read "userProfiles/${uid}"`;
    const { stdout: verifyResult } = await execAsync(verifyCommand);
    
    const updatedUser = JSON.parse(verifyResult);
    
    console.log('✅ Verification complete!');
    console.log(`  - UID: ${updatedUser.uid}`);
    console.log(`  - Email: ${updatedUser.email}`);
    console.log(`  - Display Name: ${updatedUser.displayName}`);
    console.log(`  - Role: ${updatedUser.role}`);
    console.log(`  - User Type: ${updatedUser.userType}`);
    console.log(`  - Permissions: ${updatedUser.permissions ? updatedUser.permissions.length : 0} permissions`);
    console.log(`  - Active: ${updatedUser.isActive}`);
    
    if (updatedUser.role === 'super_admin' && updatedUser.userType === 'super_admin') {
      console.log('🎉 Successfully upgraded admin@propagenticai.com to super_admin!');
      console.log('💡 The user now has full system access including:');
      console.log('  - User management (create, edit, delete)');
      console.log('  - System configuration');
      console.log('  - Audit log access');
      console.log('  - Security monitoring');
      console.log('  - Role management');
      console.log(`\n📋 Important: If using Firebase Auth UID ${uid}, update Firebase Auth custom claims:`);
      console.log(`   firebase auth:set-custom-user-claims ${uid} '{"role":"super_admin","userType":"super_admin"}'`);
      return true;
    } else {
      console.error('❌ Upgrade verification failed - role not properly set');
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
    
    // Set the Firebase project
    console.log('🔧 Setting Firebase project...');
    await execAsync('firebase use propagentic');
    console.log('✅ Firebase project set to propagentic');
    
    // Upgrade the admin
    const success = await upgradeSuperAdmin();
    
    if (success) {
      console.log('\n🎉 Super admin upgrade completed successfully!');
      console.log('📋 Next steps:');
      console.log('1. Have admin@propagenticai.com log out and log back in');
      console.log('2. Navigate to /admin/dashboard');
      console.log('3. Verify access to System Configuration panel');
      console.log('4. Test all admin dashboard features');
      console.log('5. If using Firebase Auth, update custom claims as shown above');
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

module.exports = { upgradeSuperAdmin, generateSuperAdminProfileData }; 