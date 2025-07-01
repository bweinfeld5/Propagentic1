const testing = require('@firebase/rules-unit-testing');
const fs = require('fs');

const projectId = 'test-' + Date.now();

async function testFirestoreRules() {
  // Read the rules file
  const rules = fs.readFileSync('firestore.rules', 'utf8');
  
  // Create test environment
  let testEnv = await testing.initializeTestEnvironment({
    projectId,
    firestore: {
      rules,
      host: 'localhost',
      port: 8080
    }
  });

  console.log('🧪 Testing Firestore Rules for Waitlist\n');

  // Test 1: Unauthenticated user
  console.log('Test 1: Unauthenticated user adding to waitlist...');
  const unauthedDb = testEnv.unauthenticatedContext().firestore();
  
  try {
    await testing.assertSucceeds(
      unauthedDb.collection('waitlist').add({
        email: 'test@example.com',
        role: 'landlord',
        name: 'Test User',
        timestamp: new Date().toISOString(),
        source: 'test',
        userId: null,
        subscribed_to_newsletter: true,
        marketing_consent: true,
        early_access: true,
        createdAt: testing.firestore.FieldValue.serverTimestamp()
      })
    );
    console.log('✅ Success: Unauthenticated user can add to waitlist');
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }

  console.log('\n---\n');

  // Test 2: Invalid role
  console.log('Test 2: Testing invalid role...');
  try {
    await testing.assertFails(
      unauthedDb.collection('waitlist').add({
        email: 'test@example.com',
        role: 'invalid_role',
        timestamp: new Date().toISOString(),
        source: 'test',
        createdAt: testing.firestore.FieldValue.serverTimestamp()
      })
    );
    console.log('✅ Success: Invalid role rejected');
  } catch (error) {
    console.error('❌ Unexpected: Invalid role was accepted');
  }

  console.log('\n---\n');

  // Test 3: Missing required fields
  console.log('Test 3: Testing missing required fields...');
  try {
    await testing.assertFails(
      unauthedDb.collection('waitlist').add({
        email: 'test@example.com',
        // Missing role
        timestamp: new Date().toISOString(),
        source: 'test',
        createdAt: testing.firestore.FieldValue.serverTimestamp()
      })
    );
    console.log('✅ Success: Missing required fields rejected');
  } catch (error) {
    console.error('❌ Unexpected: Missing fields accepted');
  }

  console.log('\n---\n');

  // Test 4: Supporter role
  console.log('Test 4: Testing supporter role...');
  try {
    await testing.assertSucceeds(
      unauthedDb.collection('waitlist').add({
        email: 'supporter@example.com',
        role: 'supporter',
        timestamp: new Date().toISOString(),
        source: 'test',
        createdAt: testing.firestore.FieldValue.serverTimestamp()
      })
    );
    console.log('✅ Success: Supporter role accepted');
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }

  // Clean up
  await testEnv.cleanup();
  console.log('\n✅ Tests completed');
}

// Run tests
testFirestoreRules().catch(console.error); 