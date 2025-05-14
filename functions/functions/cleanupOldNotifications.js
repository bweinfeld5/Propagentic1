
/**
 * cleanupOldNotifications function - scheduled to run periodically
 */
exports.cleanupOldNotifications = require('firebase-functions/v2/scheduler').onSchedule({
  schedule: 'every 24 hours',
  region: 'us-central1'
}, async (event) => {
  console.log('cleanupOldNotifications scheduled function triggered');
  return null;
});
