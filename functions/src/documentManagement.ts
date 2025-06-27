import * as functions from 'firebase-functions';

//Cloud Functions for server side processing.

// Triggered when a file is uploaded to Storage
export const processUploadedDocument = functions.storage.object().onFinalize(async (object) => {
  // TODO: Parse path, create thumbnail, extract metadata, scan, update Firestore
});

// Callable function for uploading documents
export const uploadWorkOrderDocument = functions.https.onCall(async (data, context) => {
  // TODO: Implement upload logic
}); 