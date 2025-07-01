const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

// Initialize Firebase Admin
try {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'propagentic'
  });
} catch (error) {
  console.log('Admin already initialized or using different initialization method');
}

const db = getFirestore();
const auth = getAuth();

const ADMIN_EMAIL = 'ben@propagenticai.com';
const ADMIN_PASSWORD = 'TempAdmin123!'; // You can change this after creation

async function createNewAdminAccount() {
  try {
    console.log(`🚀 Creating new super admin account: ${ADMIN_EMAIL}\n`);
    
    // Step 1: Check and delete existing Firebase Auth user
    console.log('=== STEP 1: CLEANING UP EXISTING AUTH USER ===');
    try {
      const existingUser = await auth.getUserByEmail(ADMIN_EMAIL);
      console.log(`📧 Found existing auth user with UID: ${existingUser.uid}`);
      
      // Delete the existing auth user
      await auth.deleteUser(existingUser.uid);
      console.log(`✅ Deleted existing auth user: ${existingUser.uid}`);
      
      // Also clean up their Firestore profile if it exists
      try {
        await db.collection('users').doc(existingUser.uid).delete();
        console.log(`✅ Deleted existing Firestore profile: ${existingUser.uid}`);
      } catch (firestoreError) {
        console.log(`ℹ️  No existing Firestore profile found for: ${existingUser.uid}`);
      }
      
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log(`ℹ️  No existing auth user found for: ${ADMIN_EMAIL}`);
      } else {
        throw error;
      }
    }
    
    // Step 2: Create new Firebase Auth user
    console.log('\n=== STEP 2: CREATING NEW AUTH USER ===');
    const newUser = await auth.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      displayName: 'Ben Weinfeld - Super Admin',
      emailVerified: true
    });
    
    console.log(`✅ Created new auth user with UID: ${newUser.uid}`);
    
    // Step 3: Set custom claims for admin role
    console.log('\n=== STEP 3: SETTING CUSTOM CLAIMS ===');
    await auth.setCustomUserClaims(newUser.uid, {
      admin: true,
      super_admin: true,
      role: 'super_admin'
    });
    
    console.log(`✅ Set custom claims for admin role`);
    
    // Step 4: Create Firestore profile
    console.log('\n=== STEP 4: CREATING FIRESTORE PROFILE ===');
    const adminProfile = {
      uid: newUser.uid,
      email: ADMIN_EMAIL,
      displayName: 'Ben Weinfeld - Super Admin',
      firstName: 'Ben',
      lastName: 'Weinfeld',
      role: 'super_admin',
      userType: 'super_admin',
      status: 'active',
      isActive: true,
      emailVerified: true,
      onboardingComplete: true,
      profileComplete: true,
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
        'security_monitoring',
        'full_admin_access'
      ],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLoginAt: null
    };
    
    await db.collection('users').doc(newUser.uid).set(adminProfile);
    console.log(`✅ Created Firestore profile for: ${newUser.uid}`);
    
    // Step 5: Verify the setup
    console.log('\n=== STEP 5: VERIFICATION ===');
    
    // Verify auth user
    const verifyUser = await auth.getUser(newUser.uid);
    console.log(`✅ Auth user verified:`);
    console.log(`   - UID: ${verifyUser.uid}`);
    console.log(`   - Email: ${verifyUser.email}`);
    console.log(`   - Email Verified: ${verifyUser.emailVerified}`);
    console.log(`   - Custom Claims:`, verifyUser.customClaims);
    
    // Verify Firestore profile
    const verifyProfile = await db.collection('users').doc(newUser.uid).get();
    if (verifyProfile.exists) {
      const profileData = verifyProfile.data();
      console.log(`✅ Firestore profile verified:`);
      console.log(`   - Role: ${profileData.role}`);
      console.log(`   - UserType: ${profileData.userType}`);
      console.log(`   - Status: ${profileData.status}`);
      console.log(`   - Permissions: ${profileData.permissions.length} permissions`);
    }
    
    console.log('\n🎉 SUCCESS! New super admin account created successfully!');
    console.log('\n📋 LOGIN CREDENTIALS:');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log(`   UID: ${newUser.uid}`);
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');
    console.log('\n🔗 You can now log in at: http://localhost:3002');
    
  } catch (error) {
    console.error('❌ Error creating admin account:', error);
    
    if (error.code) {
      switch (error.code) {
        case 'auth/email-already-exists':
          console.log('\n💡 TIP: There might be a timing issue. Wait a moment and try again.');
          break;
        case 'auth/invalid-email':
          console.log('\n💡 TIP: Check that the email format is correct.');
          break;
        case 'auth/weak-password':
          console.log('\n💡 TIP: The password needs to be at least 6 characters.');
          break;
        default:
          console.log(`\n💡 Error code: ${error.code}`);
      }
    }
    
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  createNewAdminAccount()
    .then(() => {
      console.log('\n✨ Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { createNewAdminAccount }; 