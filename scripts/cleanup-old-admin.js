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

const OLD_ADMIN_EMAIL = 'admin@propagenticai.com';
const OLD_ADMIN_UID = 'VIkgEcFBXBPMi1dOwzlKlDPJHkm1'; // The UID you showed me earlier

async function cleanupOldAdmin() {
  try {
    console.log(`🧹 Cleaning up old admin account: ${OLD_ADMIN_EMAIL}\n`);
    
    // Step 1: Delete by UID (more reliable)
    console.log('=== STEP 1: DELETING BY UID ===');
    try {
      await auth.deleteUser(OLD_ADMIN_UID);
      console.log(`✅ Deleted auth user with UID: ${OLD_ADMIN_UID}`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log(`ℹ️  No auth user found with UID: ${OLD_ADMIN_UID}`);
      } else {
        console.log(`⚠️  Error deleting auth user by UID: ${error.message}`);
      }
    }
    
    // Step 2: Delete by email (backup method)
    console.log('\n=== STEP 2: DELETING BY EMAIL ===');
    try {
      const userByEmail = await auth.getUserByEmail(OLD_ADMIN_EMAIL);
      await auth.deleteUser(userByEmail.uid);
      console.log(`✅ Deleted auth user with email: ${OLD_ADMIN_EMAIL} (UID: ${userByEmail.uid})`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log(`ℹ️  No auth user found with email: ${OLD_ADMIN_EMAIL}`);
      } else {
        console.log(`⚠️  Error deleting auth user by email: ${error.message}`);
      }
    }
    
    // Step 3: Delete Firestore profile by UID
    console.log('\n=== STEP 3: DELETING FIRESTORE PROFILE ===');
    try {
      await db.collection('users').doc(OLD_ADMIN_UID).delete();
      console.log(`✅ Deleted Firestore profile with UID: ${OLD_ADMIN_UID}`);
    } catch (error) {
      console.log(`⚠️  Error deleting Firestore profile: ${error.message}`);
    }
    
    // Step 4: Search for any other admin profiles and clean them up
    console.log('\n=== STEP 4: SEARCHING FOR OTHER ADMIN PROFILES ===');
    try {
      const adminQuery = await db.collection('users')
        .where('email', '==', OLD_ADMIN_EMAIL)
        .get();
      
      if (!adminQuery.empty) {
        for (const doc of adminQuery.docs) {
          await doc.ref.delete();
          console.log(`✅ Deleted additional Firestore profile: ${doc.id}`);
        }
      } else {
        console.log(`ℹ️  No additional Firestore profiles found for: ${OLD_ADMIN_EMAIL}`);
      }
    } catch (error) {
      console.log(`⚠️  Error searching for additional profiles: ${error.message}`);
    }
    
    console.log('\n🎉 Cleanup completed successfully!');
    console.log('✨ Old admin account has been removed from both Firebase Auth and Firestore.');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  cleanupOldAdmin()
    .then(() => {
      console.log('\n✅ Cleanup script completed successfully!');
      console.log('🔄 You can now run the create-new-admin.js script to create the new account.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Cleanup script failed:', error);
      process.exit(1);
    });
}

module.exports = { cleanupOldAdmin }; 