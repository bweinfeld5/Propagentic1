// Firebase Admin Debug Tool
// This script uses Firebase Admin SDK to bypass security rules for debugging purposes
const admin = require('firebase-admin');
const readline = require('readline');

// Path to your service account key file - you'll need to download this from Firebase console
// Go to: Project Settings > Service Accounts > Generate new private key
try {
  // Initialize Firebase Admin with service account or application default credentials
  // If you have downloaded a service account key, uncomment and use this:
  // const serviceAccount = require('./serviceAccountKey.json');
  // admin.initializeApp({
  //   credential: admin.credential.cert(serviceAccount)
  // });
  
  // If you're running in a GCP environment or have used `firebase login:ci`
  admin.initializeApp({
    credential: admin.credential.applicationDefault()
  });
  
  const db = admin.firestore();
  
  // Create readline interface
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  // Menu options
  function showMenu() {
    console.log('\n🔍 FIREBASE ADMIN DEBUG TOOL 🔧');
    console.log('----------------------------------');
    console.log('1. Get user document by email');
    console.log('2. Get user document by UID');
    console.log('3. Get tenant profile by UID');
    console.log('4. Get property document by ID');
    console.log('5. Get tickets for tenant');
    console.log('6. Update user document');
    console.log('7. Add missing tenant profile');
    console.log('8. Fix user permissions');
    console.log('9. Exit');
    console.log('----------------------------------');
    
    rl.question('Select an option: ', (option) => {
      switch(option) {
        case '1':
          getUserByEmail();
          break;
        case '2':
          getUserByUid();
          break;
        case '3':
          getTenantProfile();
          break;
        case '4':
          getPropertyDocument();
          break;
        case '5':
          getTicketsForTenant();
          break;
        case '6':
          updateUserDocument();
          break;
        case '7':
          addMissingTenantProfile();
          break;
        case '8':
          fixUserPermissions();
          break;
        case '9':
          rl.close();
          break;
        default:
          console.log('Invalid option');
          showMenu();
      }
    });
  }
  
  // Get user by email
  function getUserByEmail() {
    rl.question('Enter user email: ', async (email) => {
      try {
        const userRecord = await admin.auth().getUserByEmail(email);
        console.log('Firebase Auth Record:');
        console.log(userRecord.toJSON());
        
        // Also get Firestore user document
        const userDoc = await db.collection('users').doc(userRecord.uid).get();
        if (userDoc.exists) {
          console.log('\nFirestore User Document:');
          console.log(userDoc.data());
        } else {
          console.log('\nNo Firestore user document found.');
        }
        
        showMenu();
      } catch (error) {
        console.error('Error getting user by email:', error);
        showMenu();
      }
    });
  }
  
  // Get user by UID
  function getUserByUid() {
    rl.question('Enter user UID: ', async (uid) => {
      try {
        // Get Auth record
        const userRecord = await admin.auth().getUser(uid);
        console.log('Firebase Auth Record:');
        console.log(userRecord.toJSON());
        
        // Get Firestore user document
        const userDoc = await db.collection('users').doc(uid).get();
        if (userDoc.exists) {
          console.log('\nFirestore User Document:');
          console.log(userDoc.data());
        } else {
          console.log('\nNo Firestore user document found.');
        }
        
        showMenu();
      } catch (error) {
        console.error('Error getting user by UID:', error);
        showMenu();
      }
    });
  }
  
  // Get tenant profile
  function getTenantProfile() {
    rl.question('Enter tenant UID: ', async (uid) => {
      try {
        const profileDoc = await db.collection('tenantProfiles').doc(uid).get();
        if (profileDoc.exists) {
          console.log('Tenant Profile:');
          console.log(profileDoc.data());
        } else {
          console.log('No tenant profile found.');
        }
        
        showMenu();
      } catch (error) {
        console.error('Error getting tenant profile:', error);
        showMenu();
      }
    });
  }
  
  // Get property document
  function getPropertyDocument() {
    rl.question('Enter property ID: ', async (propertyId) => {
      try {
        const propertyDoc = await db.collection('properties').doc(propertyId).get();
        if (propertyDoc.exists) {
          console.log('Property Document:');
          console.log(propertyDoc.data());
        } else {
          console.log('No property document found.');
        }
        
        showMenu();
      } catch (error) {
        console.error('Error getting property document:', error);
        showMenu();
      }
    });
  }
  
  // Get tickets for tenant
  function getTicketsForTenant() {
    rl.question('Enter tenant UID: ', async (uid) => {
      try {
        const ticketsSnapshot = await db.collection('tickets').where('tenantId', '==', uid).get();
        if (!ticketsSnapshot.empty) {
          console.log(`Found ${ticketsSnapshot.size} tickets for tenant:`);
          ticketsSnapshot.forEach(doc => {
            console.log(`\nTicket ID: ${doc.id}`);
            console.log(doc.data());
          });
        } else {
          console.log('No tickets found for this tenant.');
        }
        
        showMenu();
      } catch (error) {
        console.error('Error getting tickets:', error);
        showMenu();
      }
    });
  }
  
  // Update user document
  function updateUserDocument() {
    rl.question('Enter user UID: ', (uid) => {
      rl.question('Enter field to update (e.g., onboardingComplete, userType): ', (field) => {
        rl.question('Enter new value: ', async (value) => {
          try {
            // Format value based on expected type
            let formattedValue = value;
            if (value === 'true') formattedValue = true;
            else if (value === 'false') formattedValue = false;
            else if (!isNaN(Number(value))) formattedValue = Number(value);
            
            const updateObject = {};
            updateObject[field] = formattedValue;
            
            await db.collection('users').doc(uid).update(updateObject);
            console.log(`Successfully updated user document. Field "${field}" set to "${value}"`);
            
            showMenu();
          } catch (error) {
            console.error('Error updating user document:', error);
            showMenu();
          }
        });
      });
    });
  }
  
  // Add missing tenant profile
  function addMissingTenantProfile() {
    rl.question('Enter tenant UID: ', (uid) => {
      rl.question('Enter email: ', async (email) => {
        try {
          const timestamp = admin.firestore.FieldValue.serverTimestamp();
          await db.collection('tenantProfiles').doc(uid).set({
            userId: uid,
            email: email,
            name: email.split('@')[0],
            createdAt: timestamp,
            updatedAt: timestamp
          });
          console.log('Successfully created tenant profile');
          
          showMenu();
        } catch (error) {
          console.error('Error creating tenant profile:', error);
          showMenu();
        }
      });
    });
  }
  
  // Fix user permissions
  function fixUserPermissions() {
    rl.question('Enter user UID: ', async (uid) => {
      try {
        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists) {
          console.log('User document does not exist. Creating it...');
          
          // Get user from Auth
          const userRecord = await admin.auth().getUser(uid);
          
          // Create basic user document
          await db.collection('users').doc(uid).set({
            email: userRecord.email,
            uid: uid,
            userType: 'tenant',  // Default to tenant
            role: 'tenant',      // For backward compatibility
            onboardingComplete: true,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          
          console.log('Successfully created user document with tenant permissions');
        } else {
          await db.collection('users').doc(uid).update({
            userType: 'tenant',
            role: 'tenant',
            onboardingComplete: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          
          console.log('Successfully updated user document with tenant permissions');
        }
        
        showMenu();
      } catch (error) {
        console.error('Error fixing user permissions:', error);
        showMenu();
      }
    });
  }
  
  // Start the tool
  console.log('🔐 Firebase Admin Debug Tool initialized');
  showMenu();

} catch (error) {
  console.error('Failed to initialize Firebase Admin:', error);
  console.log('\nTo fix this, you need to:');
  console.log('1. Install the firebase-admin package: npm install firebase-admin');
  console.log('2. Download a service account key from Firebase console:');
  console.log('   - Go to Project Settings > Service Accounts');
  console.log('   - Click "Generate new private key"');
  console.log('   - Save the file as serviceAccountKey.json in this directory');
  console.log('   - Edit this script to uncomment the serviceAccount section');
  console.log('\nOR authenticate with Firebase CLI:');
  console.log('1. Install Firebase CLI: npm install -g firebase-tools');
  console.log('2. Login: firebase login');
  process.exit(1);
} 