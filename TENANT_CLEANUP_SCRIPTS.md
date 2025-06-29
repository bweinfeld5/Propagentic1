
# Scripts for Tenant User Cleanup

**DANGER: The bulk deletion script in this guide is extremely destructive and will permanently delete users from Firebase Authentication and their associated data from Firestore. Use with extreme caution. Always run the dry run first.**

## 1. Objective

This guide provides two Node.js scripts to help you manage and clean up tenant user accounts:
1.  **`delete_single_tenant.js`**: Safely deletes one specific tenant by their email. **This is the recommended solution for your current problem.**
2.  **`delete_all_tenants.js`**: Deletes all users with `userType: "tenant"`. This script includes critical safety features to prevent accidental data loss.

## 2. Setup Instructions (for both scripts)

1.  **Save the Scripts:** Save the code for each script into files named `delete_single_tenant.js` and `delete_all_tenants.js` in the root directory of your project.

2.  **Install `firebase-admin`:** If you haven't already, install the Firebase Admin SDK:
    ```bash
    npm install firebase-admin
    ```

3.  **Set Firebase Credentials:** You need to provide your Firebase service account credentials to the script.
    *   Go to your Firebase project settings > Service accounts.
    *   Click "Generate new private key" and download the JSON file.
    *   In your terminal, set an environment variable that points to the location of this file. Replace `/path/to/your/serviceAccountKey.json` with the actual path.
    ```bash
    export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/serviceAccountKey.json"
    ```

---

## 3. Script 1: Delete a Single Tenant (Recommended)

This script will delete a user from Firebase Authentication and also delete their documents from the `users` and `tenantProfiles` collections in Firestore.

### `delete_single_tenant.js`
```javascript
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

const deleteTenantByEmail = async (email) => {
  if (!email) {
    console.error("❌ Error: Please provide an email address as an argument.");
    console.log("Usage: node delete_single_tenant.js <email_to_delete> --confirm");
    return;
  }

  console.log(`Attempting to delete tenant with email: ${email}...`);

  try {
    // 1. Get the user by email from Firebase Auth
    const userRecord = await admin.auth().getUserByEmail(email);
    const { uid } = userRecord;
    console.log(`Found user with UID: ${uid}`);

    // 2. Delete the user from Firebase Authentication
    await admin.auth().deleteUser(uid);
    console.log(`✅ Successfully deleted user from Firebase Authentication.`);

    // 3. Delete the user's document from the 'users' collection
    const userDocRef = db.collection('users').doc(uid);
    if ((await userDocRef.get()).exists) {
      await userDocRef.delete();
      console.log(`✅ Successfully deleted document from 'users' collection.`);
    } else {
      console.log(`ℹ️ No document found in 'users' collection for UID: ${uid}.`);
    }

    // 4. Delete the user's profile from the 'tenantProfiles' collection
    const tenantProfileDocRef = db.collection('tenantProfiles').doc(uid);
    if ((await tenantProfileDocRef.get()).exists) {
      await tenantProfileDocRef.delete();
      console.log(`✅ Successfully deleted document from 'tenantProfiles' collection.`);
    } else {
      console.log(`ℹ️ No document found in 'tenantProfiles' collection for UID: ${uid}.`);
    }

    console.log(`\n🎉 Cleanup complete for ${email}.`);

  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.error(`❌ Error: No user found with the email: ${email}`);
    } else {
      console.error("❌ An unexpected error occurred:", error);
    }
    process.exit(1);
  }
};

// --- Safety Check ---
const emailArg = process.argv[2];
const confirmArg = process.argv[3];

if (confirmArg !== '--confirm') {
  console.log("\n🛑 This is a destructive operation.");
  console.log("To proceed, you must confirm by running the script with the --confirm flag:");
  console.log(`   node delete_single_tenant.js ${emailArg || '<email>'} --confirm\n`);
  process.exit(0);
}

deleteTenantByEmail(emailArg);
```

### How to Run
Run the script from your terminal, providing the tenant's email and the `--confirm` flag.
```bash
node delete_single_tenant.js tenant-to-delete@example.com --confirm
```

---

## 4. Script 2: Bulk Delete All Tenants (Use with Caution)

This script finds all users with `userType: "tenant"` and deletes them.

**Safety First:**
-   **Dry Run by Default:** If you run the script normally, it will **only list the users** it would delete. It will not make any changes.
-   **`--execute` Flag Required:** To actually delete the users, you **must** add the `--execute` flag to the command.

### `delete_all_tenants.js`
```javascript
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp();
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
```

### How to Run

**Step 1: Perform a Dry Run (ALWAYS DO THIS FIRST)**
This will show you a list of all tenants that would be deleted without actually deleting them.
```bash
node delete_all_tenants.js
```

**Step 2: Execute the Deletion (ONLY if you are sure)**
After reviewing the dry run list, if you want to proceed with the permanent deletion, run the command with the `--execute` flag.
```bash
node delete_all_tenants.js --execute
```
