/**
 * A comprehensive troubleshooting script to diagnose admin authentication issues.
 * 
 * This script will:
 * 1. Check Firebase Authentication for the admin user.
 * 2. Verify the user's custom claims.
 * 3. Inspect the corresponding Firestore user document.
 * 4. Provide a detailed report and steps for manual browser-level debugging.
 */

const admin = require('firebase-admin');

// --- Configuration ---
const ADMIN_EMAIL = 'admin@propagenticai.com';
const EXPECTED_ROLE = 'super_admin';
const EXPECTED_USER_TYPE = 'super_admin';
// IMPORTANT: Set this environment variable before running the script.
// export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/service-account-key.json"
// ---

function initializeFirebase() {
    try {
        admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            projectId: process.env.GCLOUD_PROJECT || 'propagentic',
        });
        console.log('Firebase Admin SDK initialized successfully.');
    } catch (error) {
        if (error.code === 'app/duplicate-app') {
            console.log('Firebase Admin SDK already initialized.');
        } else {
            console.error('Error initializing Firebase Admin SDK:', error);
            console.log('\nPlease ensure you have set the GOOGLE_APPLICATION_CREDENTIALS environment variable.');
            process.exit(1);
        }
    }
}

async function troubleshootAdmin() {
    console.log(`\n--- 🕵️  Starting Admin Authentication Troubleshooting for ${ADMIN_EMAIL} ---\n`);

    // 1. Firebase Auth Check
    console.log('--- Step 1: Checking Firebase Authentication ---');
    let userRecord;
    try {
        userRecord = await admin.auth().getUserByEmail(ADMIN_EMAIL);
        console.log(`✅ User found in Firebase Auth.`);
        console.log(`   - UID: ${userRecord.uid}`);
        console.log(`   - Email Verified: ${userRecord.emailVerified}`);
        console.log(`   - Disabled: ${userRecord.disabled}`);
    } catch (error) {
        if (error.code === 'auth/user-not-found') {
            console.error(`❌ CRITICAL: User with email ${ADMIN_EMAIL} does not exist in Firebase Auth.`);
            console.log('   - SOLUTION: Create the user in the Firebase Console > Authentication tab.');
        } else {
            console.error('❌ An unexpected error occurred while fetching the user:', error);
        }
        process.exit(1);
    }
    console.log('--------------------------------------------------\n');

    // 2. Custom Claims Check
    console.log('--- Step 2: Verifying Custom Claims ---');
    const claims = userRecord.customClaims || {};
    console.log('   - Current Custom Claims:', JSON.stringify(claims, null, 2));

    const hasCorrectRole = claims.role === EXPECTED_ROLE;
    const hasCorrectUserType = claims.userType === EXPECTED_USER_TYPE;

    if (hasCorrectRole && hasCorrectUserType) {
        console.log('✅ Custom claims for role and userType are set correctly.');
    } else {
        console.error('❌ CRITICAL: Custom claims are incorrect.');
        if (!hasCorrectRole) console.log(`   - Expected role: '${EXPECTED_ROLE}', but found: '${claims.role}'`);
        if (!hasCorrectUserType) console.log(`   - Expected userType: '${EXPECTED_USER_TYPE}', but found: '${claims.userType}'`);
        console.log(`   - SOLUTION: Run the 'fix-admin-user.js' script or manually set claims.`);
    }
    console.log('--------------------------------------------------\n');

    // 3. Firestore Document Check
    console.log('--- Step 3: Inspecting Firestore User Document ---');
    const db = admin.firestore();
    const userDocRef = db.collection('users').doc(userRecord.uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
        console.error(`❌ CRITICAL: Firestore document not found for UID ${userRecord.uid}.`);
        console.log(`   - SOLUTION: The user document should be created automatically on first login. If not, run 'fix-admin-user.js' to create it.`);
    } else {
        console.log('✅ Firestore document found.');
        const userData = userDoc.data();
        console.log('   - Firestore Data:', JSON.stringify(userData, null, 2));

        const firestoreRole = userData.role;
        const firestoreUserType = userData.userType;

        if (firestoreRole === EXPECTED_ROLE && firestoreUserType === EXPECTED_USER_TYPE) {
            console.log('✅ Firestore role and userType are correct.');
        } else {
            console.error('❌ CRITICAL: Firestore role or userType is incorrect.');
            if (firestoreRole !== EXPECTED_ROLE) console.log(`   - Expected role: '${EXPECTED_ROLE}', but found: '${firestoreRole}'`);
            if (firestoreUserType !== EXPECTED_USER_TYPE) console.log(`   - Expected userType: '${EXPECTED_USER_TYPE}', but found: '${firestoreUserType}'`);
            console.log(`   - SOLUTION: Update the document in Firestore or run 'fix-admin-user.js'.`);
        }
    }
    console.log('--------------------------------------------------\n');

    // 4. Manual Browser-Level Debugging Guide
    console.log('--- Step 4: Manual Browser-Level Troubleshooting ---');
    console.log('If server-side checks pass, the issue is likely on the client-side. Follow these steps in your browser:');
    console.log('\n   1. Log out and Clear Application State:');
    console.log('      - Open the application and log out.');
    console.log('      - Open Developer Tools (Cmd+Opt+I or F12).');
    console.log('      - Go to the "Application" tab.');
    console.log('      - Under "Storage", click "Clear site data". This clears localStorage, IndexedDB, etc.');
    
    console.log('\n   2. Log In and Inspect Auth State:');
    console.log(`      - Log in as ${ADMIN_EMAIL}.`);
    console.log('      - In the Developer Tools Console, type: \`firebase.auth().currentUser\` and press Enter.');
    console.log('      - Inspect the returned user object. Look for the \`uid\` and \`email\`.');

    console.log('\n   3. Force Refresh ID Token and Inspect Claims:');
    console.log('      - In the console, run: \`await firebase.auth().currentUser.getIdTokenResult(true)\`');
    console.log('      - This forces a refresh of the ID token from Firebase Auth servers.');
    console.log('      - Expand the result object and look at \`result.claims\`.');
    console.log(`      - Verify that 'claims.role' is '${EXPECTED_ROLE}' and 'claims.userType' is '${EXPECTED_USER_TYPE}'.`);
    console.log('      - If claims are correct here but the app behaves wrongly, the issue is in the React app\'s state management (e.g., AuthContext).');

    console.log('\n   4. Check Application Code:');
    console.log('      - Review \`src/context/AuthContext.jsx\` or similar files.');
    console.log('      - Ensure the logic that consumes the ID token claims and sets the user role in the app state is correct.');
    console.log('      - Look for how \`user.role\` or \`user.userType\` is being read and distributed throughout the application.');
    console.log('--------------------------------------------------\n');

    console.log('--- ✅ Troubleshooting Complete ---');
}

(async () => {
    initializeFirebase();
    await troubleshootAdmin();
})();
