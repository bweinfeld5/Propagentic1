#!/usr/bin/env node

/**
 * Script to create test users for admin dashboard testing
 */

const { initializeApp } = require('firebase/app');
const { getFunctions, httpsCallable } = require('firebase/functions');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyASqNnCHAhCiQUm3_8XnCz7Kcjj8fZ5Y-c",
  authDomain: "propagentic.firebaseapp.com",
  databaseURL: "https://propagentic-default-rtdb.firebaseio.com",
  projectId: "propagentic",
  storageBucket: "propagentic.appspot.com",
  messagingSenderId: "1047878139430",
  appId: "1:1047878139430:web:2f7b4b2c1d8e3f4a5b6c7d"
};

/**
 * Create test users for admin dashboard
 */
async function createTestUsers() {
  try {
    console.log('🚀 Creating test users for admin dashboard...\n');
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const functions = getFunctions(app);
    
    // Sign in as super admin first
    console.log('🔐 Signing in as super admin...');
    await signInWithEmailAndPassword(auth, 'admin@propagenticai.com', 'your-admin-password');
    console.log('✅ Signed in successfully\n');
    
    // Get the create user function
    const createUserFunction = httpsCallable(functions, 'createUser');
    
    // Test users to create
    const testUsers = [
      {
        firstName: 'John',
        lastName: 'Landlord',
        email: 'test-landlord@example.com',
        role: 'landlord'
      },
      {
        firstName: 'Jane',
        lastName: 'Tenant',
        email: 'test-tenant@example.com',
        role: 'tenant'
      },
      {
        firstName: 'Bob',
        lastName: 'Contractor',
        email: 'test-contractor@example.com',
        role: 'contractor'
      },
      {
        firstName: 'Alice',
        lastName: 'Admin',
        email: 'test-admin@example.com',
        role: 'admin'
      }
    ];
    
    // Create each test user
    for (const userData of testUsers) {
      try {
        console.log(`👤 Creating ${userData.role}: ${userData.firstName} ${userData.lastName}...`);
        const result = await createUserFunction(userData);
        console.log(`✅ Successfully created user: ${userData.email} (UID: ${result.data.uid})`);
      } catch (error) {
        console.error(`❌ Failed to create ${userData.email}:`, error.message);
      }
    }
    
    console.log('\n🎉 Test user creation completed!');
    console.log('\nℹ️  Note: These users will need to complete their registration via email invitation.');
    
  } catch (error) {
    console.error('\n❌ Error creating test users:', error);
    console.error('\n🔍 Possible issues:');
    console.error('- Super admin credentials incorrect');
    console.error('- Cloud Functions not deployed');
    console.error('- Network connectivity issues');
  }
}

// Run the script
createTestUsers(); 