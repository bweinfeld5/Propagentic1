
/**
 * notifyAssignedContractor function - triggered on document update
 */
exports.notifyAssignedContractor = require('firebase-functions/v2/firestore').onDocumentUpdated({
  document: 'tickets/{id}',
  region: 'us-central1'
}, async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    console.error('No data associated with the event');
    return;
  }
  
  console.log('notifyAssignedContractor triggered for document:', event.params.id);
  return null;
});
