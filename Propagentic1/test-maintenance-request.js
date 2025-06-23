/**
 * Test script for creating a maintenance request in Firestore emulator
 * Run with: node test-maintenance-request.js
 */

// Import Firebase Admin SDK
const admin = require('firebase-admin');

// Set environment variables for emulators
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FUNCTIONS_EMULATOR_HOST = 'localhost:5001';

// Initialize Firebase Admin with emulator configuration
admin.initializeApp({
  projectId: 'propagentic'
});

// Get Firestore reference
const db = admin.firestore();

// Create a test maintenance request
async function createTestRequest() {
  try {
    console.log("🔍 Connected to Firestore emulator at:", process.env.FIRESTORE_EMULATOR_HOST);
    console.log("🔍 Functions emulator at:", process.env.FUNCTIONS_EMULATOR_HOST);
    
    // Create a document in the maintenanceRequests collection
    const docRef = await db.collection('maintenanceRequests').add({
      description: "The bathroom sink faucet is constantly dripping, wasting water and making noise at night.",
      photoUrl: "https://example.com/test-photo.jpg",
      submittedBy: "test-user",
      unitNumber: "101",
      status: "pending_classification",
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`\n✅ Created test maintenance request with ID: ${docRef.id}`);
    console.log("\n⏳ The function should trigger automatically. Check the emulator logs.");
    
    // Wait for 15 seconds and check the document status
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
          console.log(`AI identified this as a "${data.category}" issue with urgency level ${data.urgency}`);
        } else if (data.status === 'classification_failed') {
          console.log(`\n❌ Classification failed: ${data.classificationError || 'Unknown error'}`);
        } else if (data.status === 'pending_classification') {
          console.log("\n⏳ Classification still in progress or function not triggered.");
          console.log("\nCheck emulator logs for errors. Common issues include:");
          console.log("1. OpenAI API key not properly set in functions/.env");
          console.log("2. Function code has errors or incompatibilities");
          console.log("3. Function emulator not running correctly");
        }
        
        process.exit(0);
      } catch (err) {
        console.error("Error getting updated document:", err);
        process.exit(1);
      }
    }, 15000); // Check after 15 seconds
    
  } catch (error) {
    console.error("Error creating test document:", error);
    process.exit(1);
  }
}

// Run the test
createTestRequest(); 