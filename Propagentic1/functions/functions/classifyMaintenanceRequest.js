
/**
 * classifyMaintenanceRequest function - triggered on document creation
 */
exports.classifyMaintenanceRequest = require('firebase-functions/v2/firestore').onDocumentCreated({
  document: 'maintenanceRequests/{id}',
  region: 'us-central1'
}, async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    console.error('No data associated with the event');
    return;
  }
  
  console.log('classifyMaintenanceRequest triggered for document:', event.params.id);
  return null;
});
