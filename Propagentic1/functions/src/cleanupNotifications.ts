import { onSchedule, ScheduledEvent } from "firebase-functions/v2/scheduler"; // v2 import
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

// Ensure admin is initialized if needed
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore(); // db IS used here

// TODO: Implement cleanupOldNotifications logic
export const cleanupOldNotifications = onSchedule('every 24 hours', async (event: ScheduledEvent) => { // Use ScheduledEvent type
  // Log with event ID if available, or just a generic message
  logger.info("Running cleanupOldNotifications function", { eventId: event.jobName || 'unknown-schedule' });
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30); // e.g., delete notifications older than 30 days
  logger.info(`Cleaning up notifications created before: ${cutoff.toISOString()}`);

  try {
    // Query across all users' notification subcollections
    const querySnapshot = await db.collectionGroup('notifications')
                                  .where('createdAt', '<=', admin.firestore.Timestamp.fromDate(cutoff))
                                  .get();

    if (querySnapshot.empty) {
      logger.info("No old notifications found to delete.");
      return; // Return void implicitly
    }

    // Delete documents in batches to avoid overwhelming resources
    const batchSize = 100;
    // let deletedCount = 0; // Not strictly needed if just logging size
    const batches: admin.firestore.WriteBatch[] = [];
    batches.push(db.batch()); // Start with one batch
    let currentBatchIndex = 0;

    querySnapshot.docs.forEach((doc, index) => {
      if (index > 0 && index % batchSize === 0) {
        batches.push(db.batch()); // Create a new batch
        currentBatchIndex++;
      }
      batches[currentBatchIndex].delete(doc.ref);
    });

    // Commit all batches
    await Promise.all(batches.map(batch => batch.commit()));
    const deletedCount = querySnapshot.size;

    logger.info(`Successfully deleted ${deletedCount} old notifications.`);

  } catch (error: any) {
      logger.error("Error cleaning up old notifications:", error?.message || error);
  }

  // Implicitly return void
});

// Add this empty export to treat the file as a module
export {}; 