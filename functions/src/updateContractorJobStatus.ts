import { HttpsError, onCall, CallableRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

/**
 * Update contractor job status - move jobs between pending, ongoing, and finished
 */
export const updateContractorJobStatus = onCall(async (request: CallableRequest<{ 
  requestId: string; 
  fromStatus: 'pending' | 'ongoing' | 'finished'; 
  toStatus: 'pending' | 'ongoing' | 'finished';
  contractorId?: string; // Optional - will use auth.uid if not provided
}>) => {
  // 1. Authentication & Validation
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  const { requestId, fromStatus, toStatus, contractorId } = request.data;
  const userId = request.auth.uid;
  const targetContractorId = contractorId || userId; // Use provided contractorId or default to authenticated user

  if (!requestId || !fromStatus || !toStatus) {
    throw new HttpsError('invalid-argument', 'The function must be called with "requestId", "fromStatus", and "toStatus" arguments.');
  }

  if (!['pending', 'ongoing', 'finished'].includes(fromStatus) || !['pending', 'ongoing', 'finished'].includes(toStatus)) {
    throw new HttpsError('invalid-argument', 'Status must be one of: pending, ongoing, finished');
  }

  if (fromStatus === toStatus) {
    throw new HttpsError('invalid-argument', 'fromStatus and toStatus cannot be the same');
  }

  logger.info(`Moving request ${requestId} from ${fromStatus} to ${toStatus} for contractor ${targetContractorId}`);

  // 2. Define Document References - UPDATED to use contractorProfiles
  const contractorProfileRef = db.collection('contractorProfiles').doc(targetContractorId);
  const requestRef = db.collection('maintenanceRequests').doc(requestId);

  try {
    await db.runTransaction(async (transaction) => {
      // READ PHASE
      const contractorProfileDoc = await transaction.get(contractorProfileRef);
      if (!contractorProfileDoc.exists) {
        throw new HttpsError('not-found', 'Contractor profile not found.');
      }

      const requestDoc = await transaction.get(requestRef);
      if (!requestDoc.exists) {
        throw new HttpsError('not-found', 'Maintenance request not found.');
      }

      const contractorProfileData = contractorProfileDoc.data();
      const requestData = requestDoc.data();

      // Verify the contractor is assigned to this request
      if (requestData?.contractorId !== targetContractorId) {
        throw new HttpsError('permission-denied', 'Contractor is not assigned to this request.');
      }

      // Ensure contracts structure exists
      if (!contractorProfileData?.contracts) {
        throw new HttpsError('failed-precondition', 'Contractor profile does not have the contracts structure initialized.');
      }

      // Verify the request is in the expected fromStatus array
      if (!contractorProfileData.contracts[fromStatus]?.includes(requestId)) {
        throw new HttpsError('failed-precondition', `Request ${requestId} is not in the ${fromStatus} status for contractor ${targetContractorId}.`);
      }

      // WRITE PHASE
      // Remove from old status array and add to new status array
      const updateData: any = {
        [`contracts.${fromStatus}`]: admin.firestore.FieldValue.arrayRemove(requestId),
        [`contracts.${toStatus}`]: admin.firestore.FieldValue.arrayUnion(requestId),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      transaction.update(contractorProfileRef, updateData);

      // Update maintenance request status if transitioning to finished
      if (toStatus === 'finished') {
        transaction.update(requestRef, {
          status: 'completed',
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } else if (toStatus === 'ongoing' && fromStatus === 'pending') {
        transaction.update(requestRef, {
          status: 'in-progress',
          startedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    });

    logger.info(`Successfully moved request ${requestId} from ${fromStatus} to ${toStatus} for contractor ${targetContractorId}`);
    return { 
      success: true, 
      message: `Job status updated from ${fromStatus} to ${toStatus} successfully.` 
    };

  } catch (error) {
    console.error("Error updating contractor job status:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'An internal error occurred while updating job status.');
  }
}); 