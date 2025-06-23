"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupOldNotifications = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler"); // v2 import
const admin = __importStar(require("firebase-admin"));
const logger = __importStar(require("firebase-functions/logger"));
// Ensure admin is initialized if needed
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore(); // db IS used here
// TODO: Implement cleanupOldNotifications logic
exports.cleanupOldNotifications = (0, scheduler_1.onSchedule)('every 24 hours', async (event) => {
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
        const batches = [];
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
    }
    catch (error) {
        logger.error("Error cleaning up old notifications:", (error === null || error === void 0 ? void 0 : error.message) || error);
    }
    // Implicitly return void
});
//# sourceMappingURL=cleanupNotifications.js.map