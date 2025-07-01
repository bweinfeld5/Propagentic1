const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
let app;
try {
  const serviceAccountPaths = [
    path.join(__dirname, 'service-account-key.json'),
    path.join(__dirname, 'propagentic-firebase-adminsdk-fbsvc-c20b027723.json'),
    path.join(__dirname, 'firebaseServiceAccountKey.json')
  ];
  
  let serviceAccount = null;
  for (const accountPath of serviceAccountPaths) {
    try {
      serviceAccount = require(accountPath);
      console.log(`✅ Found service account at: ${accountPath}`);
      break;
    } catch (e) {
      // Continue to next path
    }
  }
  
  if (serviceAccount) {
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else {
    console.log('⚠️  No service account file found. Trying default credentials...');
    app = admin.initializeApp({
      projectId: 'propagentic'
    });
  }
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
  process.exit(1);
}

const db = admin.firestore();

const findAndAnalyzeEmail = async (email, shouldDelete = false) => {
  if (!email) {
    console.error("❌ Error: Please provide an email address as an argument.");
    console.log("Usage: node find_and_delete_email.js <email> [--delete]");
    return;
  }

  console.log(`🔍 Searching for email: ${email}...`);
  console.log(`🗑️  Delete mode: ${shouldDelete ? 'ENABLED' : 'DISABLED'}`);
  console.log('='.repeat(50));

  try {
    // 1. Check Firebase Authentication
    console.log('\n📧 Checking Firebase Authentication...');
    let authUser = null;
    try {
      authUser = await admin.auth().getUserByEmail(email);
      console.log(`✅ FOUND in Firebase Auth:`);
      console.log(`   - UID: ${authUser.uid}`);
      console.log(`   - Email: ${authUser.email}`);
      console.log(`   - Email Verified: ${authUser.emailVerified}`);
      console.log(`   - Created: ${new Date(authUser.metadata.creationTime)}`);
      console.log(`   - Last Login: ${authUser.metadata.lastSignInTime || 'Never'}`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log(`❌ NOT FOUND in Firebase Auth`);
      } else {
        console.log(`❌ Error checking Firebase Auth: ${error.message}`);
      }
    }

    // 2. Check Firestore users collection
    console.log('\n📊 Checking Firestore users collection...');
    if (authUser) {
      const userDoc = await db.collection('users').doc(authUser.uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        console.log(`✅ FOUND in users collection:`);
        console.log(`   - UserType: ${userData.userType || 'Not set'}`);
        console.log(`   - Name: ${userData.firstName || ''} ${userData.lastName || ''}`);
        console.log(`   - Email: ${userData.email || 'Not set'}`);
      } else {
        console.log(`❌ NOT FOUND in users collection (orphaned auth record)`);
      }
    }

    // 3. Check Firestore tenantProfiles collection
    console.log('\n👤 Checking Firestore tenantProfiles collection...');
    if (authUser) {
      const tenantDoc = await db.collection('tenantProfiles').doc(authUser.uid).get();
      if (tenantDoc.exists) {
        const tenantData = tenantDoc.data();
        console.log(`✅ FOUND in tenantProfiles collection:`);
        console.log(`   - Name: ${tenantData.firstName || ''} ${tenantData.lastName || ''}`);
        console.log(`   - Phone: ${tenantData.phoneNumber || 'Not set'}`);
      } else {
        console.log(`❌ NOT FOUND in tenantProfiles collection`);
      }
    }

    // 4. Search by email in collections (case-insensitive)
    console.log('\n🔎 Searching collections by email...');
    const usersQuery = await db.collection('users').where('email', '==', email).get();
    const tenantsQuery = await db.collection('tenantProfiles').where('email', '==', email).get();
    
    console.log(`📊 Users collection search: ${usersQuery.size} documents found`);
    console.log(`👤 TenantProfiles collection search: ${tenantsQuery.size} documents found`);

    // 5. DELETE if requested and user exists in auth
    if (shouldDelete && authUser) {
      console.log('\n🗑️  DELETING USER...');
      
      try {
        // Delete from Firebase Auth
        await admin.auth().deleteUser(authUser.uid);
        console.log(`✅ Deleted from Firebase Authentication`);
        
        // Delete from Firestore collections
        const userDocRef = db.collection('users').doc(authUser.uid);
        if ((await userDocRef.get()).exists) {
          await userDocRef.delete();
          console.log(`✅ Deleted from users collection`);
        }
        
        const tenantDocRef = db.collection('tenantProfiles').doc(authUser.uid);
        if ((await tenantDocRef.get()).exists) {
          await tenantDocRef.delete();
          console.log(`✅ Deleted from tenantProfiles collection`);
        }
        
        console.log(`\n🎉 Successfully deleted ${email} from all Firebase services`);
        
      } catch (deleteError) {
        console.error(`❌ Error during deletion: ${deleteError.message}`);
      }
    } else if (shouldDelete && !authUser) {
      console.log('\n⚠️  Cannot delete: User not found in Firebase Authentication');
    }

    // 6. Provide recommendations
    console.log('\n💡 DIAGNOSIS & RECOMMENDATIONS:');
    if (authUser && !shouldDelete) {
      console.log('🔧 ISSUE: This email exists in Firebase Auth (possibly orphaned)');
      console.log('✅ SOLUTION: Run this script with --delete flag to remove it:');
      console.log(`   node find_and_delete_email.js ${email} --delete`);
    } else if (!authUser) {
      console.log('🤔 STRANGE: Email not found in Firebase Auth but signup is blocked');
      console.log('💭 Possible causes:');
      console.log('   - Email case sensitivity (try different capitalization)');
      console.log('   - Special characters or spaces');
      console.log('   - Firebase Auth cache issue');
      console.log('   - Different Firebase project');
    }

  } catch (error) {
    console.error("❌ An unexpected error occurred:", error);
    process.exit(1);
  }
};

// Parse command line arguments
const emailArg = process.argv[2];
const shouldDelete = process.argv.includes('--delete');

if (!emailArg) {
  console.log('Usage: node find_and_delete_email.js <email> [--delete]');
  console.log('Example: node find_and_delete_email.js tenant@propagenticai.com');
  console.log('Example: node find_and_delete_email.js tenant@propagenticai.com --delete');
  process.exit(1);
}

findAndAnalyzeEmail(emailArg, shouldDelete); 