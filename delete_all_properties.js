const admin = require('firebase-admin');

// Initialize the Firebase Admin SDK
// Explicitly specify the project ID to avoid authentication issues
admin.initializeApp({
  projectId: 'propagentic'
});

const db = admin.firestore();
const propertiesCollection = db.collection('properties');

const BATCH_SIZE = 100;

async function deleteAllProperties() {
  console.log("Fetching all properties to delete...");

  try {
    const snapshot = await propertiesCollection.get();
    
    if (snapshot.empty) {
      console.log("No properties found to delete. The collection is already empty.");
      return;
    }

    console.log(`Found ${snapshot.size} properties. Preparing to delete...`);

    const batches = [];
    let currentBatch = db.batch();
    let batchCount = 0;

    snapshot.docs.forEach((doc, index) => {
      currentBatch.delete(doc.ref);
      batchCount++;
      if (batchCount === BATCH_SIZE || index === snapshot.size - 1) {
        batches.push(currentBatch);
        currentBatch = db.batch();
        batchCount = 0;
      }
    });

    console.log(`Committing ${batches.length} batch(es) of deletions.`);
    await Promise.all(batches.map(batch => batch.commit()));

    console.log(`✅ Successfully deleted ${snapshot.size} properties.`);

  } catch (error) {
    console.error("❌ Error deleting properties:", error);
    process.exit(1);
  }
}

// Safety Check: Use a command-line argument to confirm deletion.
const confirmArg = process.argv[2];
if (confirmArg !== '--confirm') {
  console.log("\n🛑 This is a destructive operation.");
  console.log("To proceed, run the script with the --confirm flag:");
  console.log("node delete_all_properties.js --confirm\n");
  process.exit(0);
}

deleteAllProperties(); 