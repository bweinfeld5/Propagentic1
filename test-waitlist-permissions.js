const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');
const { getAuth, signInAnonymously } = require('firebase/auth');

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBInjhlP96C6BrVJE7Ch5G_0w-YsFbnEHY",
  authDomain: "propagentic.firebaseapp.com",
  databaseURL: "https://propagentic-default-rtdb.firebaseio.com",
  projectId: "propagentic",
  storageBucket: "propagentic.appspot.com",
  messagingSenderId: "138135792002",
  appId: "1:138135792002:web:e491bbeb2e5f8c09c00d60",
  measurementId: "G-9R6XNJMZTB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function testWaitlistPermissions() {
  console.log('🧪 Testing Waitlist Permissions...\n');

  // Test 1: Try without authentication
  console.log('Test 1: Submitting without authentication...');
  try {
    const testData = {
      email: 'test@example.com',
      role: 'landlord',
      name: 'Test User',
      timestamp: new Date().toISOString(),
      source: 'test_script',
      userId: null,
      subscribed_to_newsletter: true,
      marketing_consent: true,
      early_access: true,
      createdAt: serverTimestamp()
    };

    console.log('Sending data:', JSON.stringify(testData, null, 2));
    
    const docRef = await addDoc(collection(db, 'waitlist'), testData);
    console.log('✅ Success without auth! Document ID:', docRef.id);
  } catch (error) {
    console.error('❌ Failed without auth:', error.code, '-', error.message);
  }

  console.log('\n---\n');

  // Test 2: Try with anonymous authentication
  console.log('Test 2: Submitting with anonymous authentication...');
  try {
    await signInAnonymously(auth);
    console.log('✅ Signed in anonymously');

    const testData = {
      email: 'test-anon@example.com',
      role: 'tenant',
      name: 'Anonymous Test',
      timestamp: new Date().toISOString(),
      source: 'test_script_anon',
      userId: auth.currentUser?.uid || null,
      subscribed_to_newsletter: true,
      marketing_consent: true,
      early_access: true,
      createdAt: serverTimestamp()
    };

    console.log('Sending data:', JSON.stringify(testData, null, 2));
    
    const docRef = await addDoc(collection(db, 'waitlist'), testData);
    console.log('✅ Success with anonymous auth! Document ID:', docRef.id);
  } catch (error) {
    console.error('❌ Failed with anonymous auth:', error.code, '-', error.message);
  }

  console.log('\n---\n');

  // Test 3: Test minimal required fields
  console.log('Test 3: Testing minimal required fields...');
  try {
    const minimalData = {
      email: 'minimal@example.com',
      role: 'contractor',
      timestamp: new Date().toISOString(),
      source: 'test_minimal',
      createdAt: serverTimestamp()
    };

    console.log('Sending minimal data:', JSON.stringify(minimalData, null, 2));
    
    const docRef = await addDoc(collection(db, 'waitlist'), minimalData);
    console.log('✅ Success with minimal data! Document ID:', docRef.id);
  } catch (error) {
    console.error('❌ Failed with minimal data:', error.code, '-', error.message);
  }

  console.log('\n---\n');

  // Test 4: Test with supporter role
  console.log('Test 4: Testing supporter role...');
  try {
    const supporterData = {
      email: 'supporter@example.com',
      role: 'supporter',
      timestamp: new Date().toISOString(),
      source: 'test_supporter',
      createdAt: serverTimestamp()
    };

    console.log('Sending supporter data:', JSON.stringify(supporterData, null, 2));
    
    const docRef = await addDoc(collection(db, 'waitlist'), supporterData);
    console.log('✅ Success with supporter role! Document ID:', docRef.id);
  } catch (error) {
    console.error('❌ Failed with supporter role:', error.code, '-', error.message);
    console.log('Full error:', error);
  }

  process.exit(0);
}

// Run the test
testWaitlistPermissions().catch(console.error); 