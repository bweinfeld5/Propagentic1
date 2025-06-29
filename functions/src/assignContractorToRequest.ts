import { HttpsError, onCall, CallableRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

export const assignContractorToRequest = onCall(async (request: CallableRequest<{ requestId: string; contractorId: string }>) => {
  // 1. Authentication & Validation
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }
  const landlordId = request.auth.uid;
  const { requestId, contractorId } = request.data;

  if (!requestId || !contractorId) {
    throw new HttpsError('invalid-argument', 'The function must be called with "requestId" and "contractorId" arguments.');
  }

  logger.info(`Assigning contractor ${contractorId} to request ${requestId} by landlord ${landlordId}`);

  // 2. Define Document References
  const requestRef = db.collection('maintenanceRequests').doc(requestId);
  const contractorProfileRef = db.collection('contractorProfiles').doc(contractorId);

  try {
    // 3. Perform updates in a single atomic transaction
    await db.runTransaction(async (transaction) => {
      // Read the maintenance request to ensure it exists
      const requestDoc = await transaction.get(requestRef);
      if (!requestDoc.exists) {
        throw new HttpsError('not-found', 'Maintenance request not found.');
      }

      // Read the contractor profile to check if it exists
      const contractorDoc = await transaction.get(contractorProfileRef);

      // Update the maintenance request with the contractorId and set status to 'in-progress'
      transaction.update(requestRef, {
        contractorId: contractorId,
        status: 'in-progress',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Only update contractor profile if it exists
      if (contractorDoc.exists) {
        // Add the maintenance request ID to the contractor's profile
        transaction.update(contractorProfileRef, {
          maintenanceRequests: admin.firestore.FieldValue.arrayUnion(requestId)
        });
        logger.info(`Updated contractor profile ${contractorId} with request ${requestId}`);
      } else {
        // Create a basic contractor profile if it doesn't exist
        transaction.set(contractorProfileRef, {
          contractorId: contractorId,
          maintenanceRequests: [requestId],
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        logger.info(`Created new contractor profile ${contractorId} with request ${requestId}`);
      }
    });

    logger.info(`Successfully assigned contractor ${contractorId} to request ${requestId}`);
    return { success: true, message: "Contractor assigned successfully." };

  } catch (error) {
    console.error("Error assigning contractor:", error);
    // Re-throw errors to be caught by the client
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'An internal error occurred while assigning the contractor.');
  }
}); 