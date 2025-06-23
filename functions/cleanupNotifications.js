/**
 * Firebase Cloud Function to clean up old notifications
 * This function runs on a schedule to remove old or soft-deleted notifications
 */

const {onSchedule} = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");

/**
 * Clean up old notifications on a schedule
 * - Removes notifications older than 90 days
 * - Permanently deletes notifications marked as deleted after 30 days
 * - Runs every day at 3:00 AM
 */
exports.cleanupOldNotifications = onSchedule({
  schedule: "0 3 * * *", // Run at 3:00 AM every day (cron syntax)
  region: "us-central1",
  timeZone: "America/New_York", // Eastern Time
  retryCount: 3,
  maxRetrySeconds: 60
}, async (event) => {
  try {
    logger.info("Starting notification cleanup process");
    
    const batch = admin.firestore().batch();
    let batchCount = 0;
    let deletedCount = 0;
    
    // Calculate date thresholds
    const ninetyDaysAgo = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    );
    
    const thirtyDaysAgo = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );
    
    // Find very old notifications (older than 90 days)
    const veryOldQuery = admin.firestore()
      .collection("notifications")
      .where("createdAt", "<", ninetyDaysAgo)
      .limit(500); // Process in batches to avoid memory issues
    
    const veryOldSnapshot = await veryOldQuery.get();
    
    // Find soft-deleted notifications that are older than 30 days
    const deletedQuery = admin.firestore()
      .collection("notifications")
      .where("deleted", "==", true)
      .where("deletedAt", "<", thirtyDaysAgo)
      .limit(500);
    
    const deletedSnapshot = await deletedQuery.get();
    
    // Process very old notifications
    veryOldSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
      batchCount++;
      deletedCount++;
    });
    
    // Process soft-deleted notifications
    deletedSnapshot.forEach((doc) => {
      // Avoid duplicate deletes if a doc appeared in both queries
      if (!veryOldSnapshot.docs.some(veryOldDoc => veryOldDoc.id === doc.id)) {
        batch.delete(doc.ref);
        batchCount++;
        deletedCount++;
      }
    });
    
    // If there are docs to delete, commit the batch
    if (batchCount > 0) {
      await batch.commit();
      logger.info(`Deleted ${deletedCount} old notifications`);
    } else {
      logger.info("No old notifications to delete");
    }
    
    return {
      deletedCount: deletedCount
    };
  } catch (error) {
    logger.error("Error cleaning up old notifications:", error);
    throw error;
  }
});

/**
 * Mark read notifications as "archived" after 14 days
 * This doesn't delete them but reduces their visibility in the UI
 */
exports.archiveReadNotifications = onSchedule({
  schedule: "0 4 * * *", // Run at 4:00 AM every day (cron syntax)
  region: "us-central1",
  timeZone: "America/New_York", // Eastern Time
  retryCount: 3,
  maxRetrySeconds: 60
}, async (event) => {
  try {
    logger.info("Starting notification archiving process");
    
    const batch = admin.firestore().batch();
    let archivedCount = 0;
    
    // Calculate date threshold (14 days ago)
    const fourteenDaysAgo = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    );
    
    // Find read notifications older than 14 days that aren't archived yet
    const readNotificationsQuery = admin.firestore()
      .collection("notifications")
      .where("read", "==", true)
      .where("readAt", "<", fourteenDaysAgo)
      .where("archived", "==", false)
      .limit(500);
    
    const readNotificationsSnapshot = await readNotificationsQuery.get();
    
    // Mark all matching notifications as archived
    readNotificationsSnapshot.forEach((doc) => {
      batch.update(doc.ref, {
        archived: true,
        archivedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      archivedCount++;
    });
    
    // If there are docs to update, commit the batch
    if (archivedCount > 0) {
      await batch.commit();
      logger.info(`Archived ${archivedCount} read notifications`);
    } else {
      logger.info("No read notifications to archive");
    }
    
    return {
      archivedCount: archivedCount
    };
  } catch (error) {
    logger.error("Error archiving read notifications:", error);
    throw error;
  }
}); 