
/**
 * rejectPropertyInvite function
 */
exports.rejectPropertyInvite = require('firebase-functions/v2/https').onCall({
  region: 'us-central1',
  maxInstances: 10
}, async (data, context) => {
  console.log('rejectPropertyInvite called by:', context.auth?.uid || 'unauthenticated user');
  return { 
    success: true, 
    message: 'Function executed successfully',
    timestamp: Date.now()
  };
});
