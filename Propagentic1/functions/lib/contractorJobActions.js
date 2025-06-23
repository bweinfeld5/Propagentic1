/**
 * Firebase Cloud Functions for contractor job bid actions
 * Handles accepting and rejecting job bids by contractors
 */

const { https } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");

// Initialize admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Contractor accepts a job bid
 */
exports.contractorAcceptJob = https.onCall(async (data, context) => {
  try {
    // Verify authentication
    if (!context.auth) {
      throw new https.HttpsError(
        "unauthenticated",
        "You must be logged in to accept a job"
      );
    }

    // Extract and validate data
    const { bidId, jobId } = data;
    if (!bidId || !jobId) {
      throw new https.HttpsError(
        "invalid-argument",
        "The function must be called with valid bidId and jobId"
      );
    }

    const contractorId = context.auth.uid;
    logger.info(`Contractor ${contractorId} attempting to accept bid ${bidId} for job ${jobId}`);

    // Get bid data and validate ownership
    const bidRef = admin.firestore().collection("bids").doc(bidId);
    const bidSnapshot = await bidRef.get();
    
    if (!bidSnapshot.exists) {
      throw new https.HttpsError(
        "not-found",
        "The specified bid was not found"
      );
    }
    
    const bidData = bidSnapshot.data();
    
    // Verify this bid belongs to the contractor
    if (bidData.contractorId !== contractorId) {
      throw new https.HttpsError(
        "permission-denied",
        "You can only accept your own bids"
      );
    }

    // Verify bid is still pending
    if (bidData.status !== 'pending') {
      throw new https.HttpsError(
        "failed-precondition",
        "Bid is no longer pending and cannot be accepted"
      );
    }

    // Get job data
    const jobRef = admin.firestore().collection("jobs").doc(jobId);
    const jobSnapshot = await jobRef.get();
    
    if (!jobSnapshot.exists) {
      throw new https.HttpsError(
        "not-found",
        "The specified job was not found"
      );
    }
    
    const jobData = jobSnapshot.data();
    
    // Verify job is still open
    if (jobData.status !== 'open') {
      throw new https.HttpsError(
        "failed-precondition",
        "Job is no longer open and cannot accept bids"
      );
    }

    // Use a batch write for atomic operations
    const batch = admin.firestore().batch();

    // Accept this bid
    batch.update(bidRef, {
      status: 'accepted',
      respondedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Assign job to contractor
    batch.update(jobRef, {
      status: 'assigned',
      assignedContractorId: bidData.contractorId,
      assignedContractorName: bidData.contractorName,
      actualCost: bidData.totalCost,
      scheduledDate: bidData.proposedStartDate,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Reject all other pending bids for this job
    const otherBidsQuery = admin.firestore()
      .collection("bids")
      .where("jobId", "==", jobId)
      .where("status", "==", "pending");
    
    const otherBidsSnapshot = await otherBidsQuery.get();
    otherBidsSnapshot.docs.forEach(doc => {
      if (doc.id !== bidId) {
        batch.update(doc.ref, {
          status: 'rejected',
          respondedAt: admin.firestore.FieldValue.serverTimestamp(),
          notes: 'Bid rejected - another bid was accepted'
        });
      }
    });

    // Commit all changes atomically
    await batch.commit();

    // Create notification for landlord
    await admin.firestore().collection("notifications").add({
      userId: jobData.landlordId,
      userRole: "landlord",
      type: "bid_accepted",
      title: "Job Bid Accepted",
      message: `${bidData.contractorName} has accepted your job: ${jobData.title}`,
      data: {
        jobId: jobId,
        bidId: bidId,
        contractorId: bidData.contractorId,
        contractorName: bidData.contractorName,
        amount: bidData.totalCost,
        estimatedDuration: bidData.estimatedDuration
      },
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Create notification for contractor
    await admin.firestore().collection("notifications").add({
      userId: contractorId,
      userRole: "contractor",
      type: "job_assigned",
      title: "Job Assignment Confirmed",
      message: `You have been assigned to: ${jobData.title}`,
      data: {
        jobId: jobId,
        bidId: bidId,
        propertyName: jobData.propertyName,
        propertyAddress: jobData.propertyAddress,
        scheduledDate: bidData.proposedStartDate
      },
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    logger.info(`Successfully accepted bid ${bidId} for job ${jobId} by contractor ${contractorId}`);

    return {
      success: true,
      message: "Job bid accepted successfully",
      jobId: jobId,
      bidId: bidId,
      contractorId: bidData.contractorId,
      contractorName: bidData.contractorName
    };

  } catch (error) {
    logger.error(`Error in contractorAcceptJob:`, error);
    
    if (error instanceof https.HttpsError) {
      throw error;
    }
    
    throw new https.HttpsError(
      "internal",
      "An unexpected error occurred while accepting the job"
    );
  }
});

/**
 * Contractor rejects their own job bid
 */
exports.contractorRejectJob = https.onCall(async (data, context) => {
  try {
    // Verify authentication
    if (!context.auth) {
      throw new https.HttpsError(
        "unauthenticated",
        "You must be logged in to reject a job"
      );
    }

    // Extract and validate data
    const { bidId, jobId, reason } = data;
    if (!bidId || !jobId) {
      throw new https.HttpsError(
        "invalid-argument",
        "The function must be called with valid bidId and jobId"
      );
    }

    const contractorId = context.auth.uid;
    logger.info(`Contractor ${contractorId} attempting to reject bid ${bidId} for job ${jobId}`);

    // Get bid data and validate ownership
    const bidRef = admin.firestore().collection("bids").doc(bidId);
    const bidSnapshot = await bidRef.get();
    
    if (!bidSnapshot.exists) {
      throw new https.HttpsError(
        "not-found",
        "The specified bid was not found"
      );
    }
    
    const bidData = bidSnapshot.data();
    
    // Verify this bid belongs to the contractor
    if (bidData.contractorId !== contractorId) {
      throw new https.HttpsError(
        "permission-denied",
        "You can only reject your own bids"
      );
    }

    // Verify bid is still pending
    if (bidData.status !== 'pending') {
      throw new https.HttpsError(
        "failed-precondition",
        "Bid is no longer pending and cannot be rejected"
      );
    }

    // Get job data for notifications
    const jobRef = admin.firestore().collection("jobs").doc(jobId);
    const jobSnapshot = await jobRef.get();
    
    if (!jobSnapshot.exists) {
      throw new https.HttpsError(
        "not-found",
        "The specified job was not found"
      );
    }
    
    const jobData = jobSnapshot.data();

    // Reject the bid
    await bidRef.update({
      status: 'rejected',
      respondedAt: admin.firestore.FieldValue.serverTimestamp(),
      notes: reason || 'Bid rejected by contractor'
    });

    // Create notification for landlord
    await admin.firestore().collection("notifications").add({
      userId: jobData.landlordId,
      userRole: "landlord",
      type: "bid_rejected",
      title: "Job Bid Rejected",
      message: `${bidData.contractorName} has rejected your job: ${jobData.title}`,
      data: {
        jobId: jobId,
        bidId: bidId,
        contractorId: bidData.contractorId,
        contractorName: bidData.contractorName,
        reason: reason || 'No reason provided'
      },
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    logger.info(`Successfully rejected bid ${bidId} for job ${jobId} by contractor ${contractorId}`);

    return {
      success: true,
      message: "Job bid rejected successfully",
      jobId: jobId,
      bidId: bidId,
      contractorId: bidData.contractorId,
      contractorName: bidData.contractorName
    };

  } catch (error) {
    logger.error(`Error in contractorRejectJob:`, error);
    
    if (error instanceof https.HttpsError) {
      throw error;
    }
    
    throw new https.HttpsError(
      "internal",
      "An unexpected error occurred while rejecting the job"
    );
  }
});

/**
 * Get contractor's bids for a specific job
 */
exports.getContractorBidsForJob = https.onCall(async (data, context) => {
  try {
    // Verify authentication
    if (!context.auth) {
      throw new https.HttpsError(
        "unauthenticated",
        "You must be logged in to view your bids"
      );
    }

    // Extract and validate data
    const { jobId } = data;
    if (!jobId) {
      throw new https.HttpsError(
        "invalid-argument",
        "The function must be called with a valid jobId"
      );
    }

    const contractorId = context.auth.uid;

    // Get bids for this contractor and job
    const bidsQuery = admin.firestore()
      .collection("bids")
      .where("jobId", "==", jobId)
      .where("contractorId", "==", contractorId)
      .orderBy("submittedAt", "desc");

    const bidsSnapshot = await bidsQuery.get();
    const bids = [];

    bidsSnapshot.forEach(doc => {
      const bidData = doc.data();
      bids.push({
        id: doc.id,
        ...bidData,
        submittedAt: bidData.submittedAt?.toDate(),
        respondedAt: bidData.respondedAt?.toDate(),
        proposedStartDate: bidData.proposedStartDate?.toDate()
      });
    });

    return {
      success: true,
      bids: bids,
      count: bids.length
    };

  } catch (error) {
    logger.error(`Error in getContractorBidsForJob:`, error);
    
    if (error instanceof https.HttpsError) {
      throw error;
    }
    
    throw new https.HttpsError(
      "internal",
      "An unexpected error occurred while fetching bids"
    );
  }
});
