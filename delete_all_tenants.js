const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
// Try to use service account file if available, otherwise use default credentials
let app;
try {
  // Check for service account file in common locations
  const serviceAccountPaths = [
    path.join(__dirname, 'propagentic-firebase-adminsdk-fbsvc-c20b027723.json'),
    path.join(__dirname, 'service-account-key.json'),
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
    // Use application default credentials (works if gcloud CLI is set up)
    console.log('⚠️  No service account file found. Trying default credentials...');
    app = admin.initializeApp({
      projectId: 'propagentic' // Replace with your actual project ID
    });
  }
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
  console.log('\n📋 To fix this, you need a Firebase service account key:');
  console.log('1. Go to Firebase Console → Project Settings → Service Accounts');
  console.log('2. Click "Generate new private key"');
  console.log('3. Save the file as "service-account-key.json" in this directory');
  console.log('4. Or set GOOGLE_APPLICATION_CREDENTIALS environment variable');
  process.exit(1);
}

const db = admin.firestore();

const deleteAllTenants = async (isDryRun) => {
  if (isDryRun) {
    console.log("--- DRY RUN MODE ---");
    console.log("No users will be deleted. The script will only list the tenants it would affect.");
    console.log("To execute the deletion, run the script with the --execute flag.\n");
  } else {
    console.log("--- EXECUTE MODE ---");
    console.log("🛑 WARNING: This will permanently delete all tenant users and their data.");
    // Add a 5-second delay to give the user a chance to cancel (Ctrl+C)
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  try {
    // 1. Query Firestore for all users with userType: "tenant"
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('userType', '==', 'tenant').get();

    if (snapshot.empty) {
      console.log("No tenant users found in the 'users' collection.");
      return;
    }

    console.log(`Found ${snapshot.size} tenant users to process.`);
    const uidsToDelete = snapshot.docs.map(doc => doc.id);

    // 2. Delete users from Firebase Authentication in batches
    // Auth deletions are more intensive, so we do them carefully.
    let authSuccessCount = 0;
    for (const uid of uidsToDelete) {
      const email = snapshot.docs.find(d => d.id === uid).data().email || 'No Email';
      if (isDryRun) {
        console.log(`[DRY RUN] Would delete user: ${email} (UID: ${uid})`);
      } else {
        try {
          await admin.auth().deleteUser(uid);
          console.log(`✅ Deleted from Auth: ${email} (UID: ${uid})`);
          authSuccessCount++;
        } catch (error) {
          console.error(`❌ Failed to delete from Auth: ${email} (UID: ${uid})`, error.message);
        }
      }
    }

    // 3. Delete user data from Firestore collections if not in dry run
    if (!isDryRun) {
      const batchSize = 100;
      for (let i = 0; i < uidsToDelete.length; i += batchSize) {
        const batch = db.batch();
        const chunk = uidsToDelete.slice(i, i + batchSize);
        
        for (const uid of chunk) {
          batch.delete(db.collection('users').doc(uid));
          batch.delete(db.collection('tenantProfiles').doc(uid));
        }
        await batch.commit();
        console.log(`Deleted Firestore data for batch starting at index ${i}.`);
      }
    }

    console.log("\n--- Summary ---");
    if (isDryRun) {
      console.log(`[DRY RUN] Found ${snapshot.size} tenant users that would be deleted.`);
    } else {
      console.log(`Successfully deleted ${authSuccessCount} users from Firebase Authentication.`);
      console.log(`Attempted to delete ${uidsToDelete.length} user documents from Firestore.`);
    }
    console.log("🎉 Cleanup process complete.");

  } catch (error) {
    console.error("❌ An unexpected error occurred during the process:", error);
    process.exit(1);
  }
};

// --- Safety Check ---
const isExecuteMode = process.argv.includes('--execute');
deleteAllTenants(!isExecuteMode); // Pass true for isDryRun if --execute is not present 