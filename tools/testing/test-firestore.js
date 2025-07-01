/**
 * Test script for creating a maintenance request in Firestore emulator
 * Run with: node test-firestore.js
 */

// Import Firebase Admin SDK
const admin = require('firebase-admin');

// Important: Set Firestore emulator host environment variable BEFORE initializing
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

// Initialize Firebase Admin with emulator configuration
admin.initializeApp({
  projectId: 'propagentic'
  // No need for databaseURL when using FIRESTORE_EMULATOR_HOST
});

// Get a reference to Firestore
const db = admin.firestore();

// Create a test maintenance request
async function createTestRequest() {
  try {
    console.log("🔍 Connected to Firestore emulator at:", process.env.FIRESTORE_EMULATOR_HOST);
    
    // Create a document in the maintenanceRequests collection
    const docRef = await db.collection('maintenanceRequests').add({
      description: "The bathroom sink faucet is constantly dripping, wasting water and making noise at night.",
      photoUrl: "https://example.com/test-photo.jpg",
      submittedBy: "test-user",
      unitNumber: "101",
      status: "pending_classification",
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`✅ Created test document with ID: ${docRef.id}`);
    console.log("⏳ The function should trigger automatically. Check the emulator logs.");
    
    // Wait for a few seconds and check the document status
    setTimeout(async () => {
      try {
        const updatedDoc = await docRef.get();
        const data = updatedDoc.data();
        
        console.log("\n📝 Updated document data:");
        console.log(`Status: ${data.status}`);
        console.log(`Category: ${data.category || 'Not yet classified'}`);
        console.log(`Urgency: ${data.urgency || 'Not yet classified'}`);
        
        if (data.status === 'ready_to_dispatch') {
          console.log("\n✅ Classification successful!");
        } else if (data.status === 'classification_failed') {
          console.log(`\n❌ Classification failed: ${data.classificationError || 'Unknown error'}`);
        } else {
          console.log("\n⏳ Classification still in progress or not triggered.");
        }
        
        console.log("\nNote: If you don't see classification results, check the following:");
        console.log("1. Ensure functions emulator is running with: firebase emulators:start --only functions,firestore");
        console.log("2. Check the emulator logs for any errors");
        console.log("3. Verify OPENAI_API_KEY is properly set in functions/.env");
        
        process.exit(0);
      } catch (err) {
        console.error("Error getting updated document:", err);
        process.exit(1);
      }
    }, 10000); // Check after 10 seconds
    
  } catch (error) {
    console.error("Error creating test document:", error);
    process.exit(1);
  }
}

// Run the test
createTestRequest(); 