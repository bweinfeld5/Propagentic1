/**
 * Firebase Cloud Function to classify maintenance requests (simplified version)
 * For testing initialization only
 */

// Import Firebase Functions v2
const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const logger = require("firebase-functions/logger");

// Initialize Firebase Admin
const admin = require('firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp();
}

// Remove OpenAI dependency for initialization testing

/**
 * Cloud Function that triggers when a new maintenance request is added to Firestore
 * with status 'pending_classification'
 */
exports.classifyMaintenanceRequest = onDocumentCreated({
  document: "tickets/{ticketId}",
  region: "us-central1",
}, async (event) => {
  try {
    const snapshot = event.data;
    if (!snapshot) {
      logger.error("No data associated with the event");
      return;
    }
    
    const ticketData = snapshot.data();
    
    // Only process documents with 'pending_classification' status
    if (ticketData.status !== "pending_classification") {
      logger.info(
          `Ticket ${event.params.ticketId} already processed. ` +
          `Status: ${ticketData.status}`
      );
      return;
    }
    
    logger.info(`Processing maintenance ticket: ${event.params.ticketId}`);
    
    // Mock classification for testing
    const classification = {
      category: "plumbing",
      urgency: 3
    };
    
    // Update the Firestore document with the classification results
    await snapshot.ref.update({
      category: classification.category,
      urgency: classification.urgency,
      status: "ready_to_dispatch",
      classifiedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    logger.info(
        `Successfully classified ticket ${event.params.ticketId} as ` +
        `${classification.category} with urgency level ${classification.urgency}`
    );
  } catch (error) {
    logger.error("Error classifying maintenance ticket:", error);
    
    try {
      // Update the document with error information
      if (event.data && event.data.ref) {
        await event.data.ref.update({
          status: "classification_failed",
          classificationError: error.message,
        });
      }
    } catch (updateError) {
      logger.error("Error updating document with error status:", updateError);
    }
  }
});
