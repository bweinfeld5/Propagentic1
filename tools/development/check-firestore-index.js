#!/usr/bin/env node

/**
 * Quick Firestore Index Check
 * Tests if the missing composite index is causing QR code failures
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, orderBy, limit, getDocs } = require('firebase/firestore');

require('dotenv').config();

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testNotificationsIndex() {
  console.log('🔍 Testing Firestore Notifications Index...');
  console.log('=============================================');
  
  try {
    // This is the exact query that's failing and needs the composite index
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', 'test-user-id'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    
    console.log('🔧 Attempting notifications query that requires composite index...');
    const snapshot = await getDocs(q);
    
    console.log('✅ Query successful! Index exists.');
    console.log(`📊 Found ${snapshot.size} notifications`);
    
  } catch (error) {
    if (error.code === 'failed-precondition' && error.message.includes('index')) {
      console.log('❌ MISSING INDEX CONFIRMED!');
      console.log('🔗 Create the index here:');
      console.log('https://console.firebase.google.com/v1/r/project/propagentic/firestore/indexes?create_composite=ClFwcm9qZWN0cy9wcm9wYWdlbnRpYy9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvbm90aWZpY2F0aW9ucy9pbmRleGVzL18QARoKCgZ1c2VySWQQARoNCgljcmVhdGVkQXQQAioMCghfX25hbWVfXxAC');
      console.log('\n📋 Index Details:');
      console.log('   Collection: notifications');
      console.log('   Fields: userId (ASC), createdAt (DESC)');
      console.log('   Status: MISSING - this is blocking QR code generation!');
      
      return false;
    } else {
      console.log('❌ Query failed with different error:', {
        code: error.code,
        message: error.message
      });
      return false;
    }
  }
  
  return true;
}

async function checkIndexStatus() {
  try {
    const indexExists = await testNotificationsIndex();
    
    if (indexExists) {
      console.log('\n🎉 Index check passed - this is not the issue');
    } else {
      console.log('\n⚠️  Index missing - this is likely causing QR code failures');
      console.log('   Create the index using the URL above, then wait 2-5 minutes for it to build');
    }
    
  } catch (error) {
    console.error('💥 Index check failed:', error);
  }
}

checkIndexStatus();
