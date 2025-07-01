// Script to check user records for common issues
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

// Your Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyA1j5o9uI3NFeufUuJOKR3-TQzQk-mh8JE",
  authDomain: "propagentic.firebaseapp.com",
  projectId: "propagentic",
  storageBucket: "propagentic.appspot.com",
  messagingSenderId: "859812091492",
  appId: "1:859812091492:web:8e9e6c8fbfecbc8fa8f1e5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkUserRecords() {
  console.log('Checking user records for potential issues...');
  
  try {
    const usersRef = collection(db, 'users');
    const userDocs = await getDocs(usersRef);
    
    console.log(`Found ${userDocs.size} user records.`);
    
    const issues = {
      missingUserType: [],
      missingRole: [],
      conflictingRoles: [],
      missingOnboardingState: []
    };
    
    userDocs.forEach(doc => {
      const userData = doc.data();
      console.log(`User ID: ${doc.id}`);
      console.log(` - Email: ${userData.email}`);
      console.log(` - UserType: ${userData.userType || 'MISSING'}`);
      console.log(` - Role: ${userData.role || 'MISSING'}`);
      console.log(` - onboardingComplete: ${userData.onboardingComplete !== undefined ? userData.onboardingComplete : 'MISSING'}`);
      
      // Check for issues
      if (!userData.userType) {
        issues.missingUserType.push(doc.id);
      }
      
      if (!userData.role) {
        issues.missingRole.push(doc.id);
      }
      
      if (userData.userType && userData.role && userData.userType !== userData.role) {
        issues.conflictingRoles.push(doc.id);
      }
      
      if (userData.onboardingComplete === undefined) {
        issues.missingOnboardingState.push(doc.id);
      }
      
      console.log('--------------------');
    });
    
    // Summary of issues
    console.log('\nISSUES SUMMARY:');
    console.log(`Missing userType: ${issues.missingUserType.length} users`);
    console.log(`Missing role: ${issues.missingRole.length} users`);
    console.log(`Conflicting roles: ${issues.conflictingRoles.length} users`);
    console.log(`Missing onboardingState: ${issues.missingOnboardingState.length} users`);
    
  } catch (error) {
    console.error('Error checking user records:', error);
  }
}

checkUserRecords().then(() => console.log('Done!')); 