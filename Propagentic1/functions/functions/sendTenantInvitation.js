
/**
 * sendTenantInvitation function
 */
exports.sendTenantInvitation = require('firebase-functions/v2/https').onCall({
  region: 'us-central1',
  maxInstances: 10
}, async (data, context) => {
  console.log('sendTenantInvitation called by:', context.auth?.uid || 'unauthenticated user');
  return { 
    success: true, 
    message: 'Function executed successfully',
    timestamp: Date.now()
  };
});
