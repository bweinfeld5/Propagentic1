/**
 * Firebase Cloud Functions for contractor job bid actions
 * Handles accepting and rejecting job bids by contractors
 */

const { onCall } = require('firebase-functions/v2/https');
const { getFirestore } = require('firebase-admin/firestore');
const { initializeApp } = require('firebase-admin/app');
const logger = require("firebase-functions/logger");

// Initialize Firebase Admin if not already initialized
if (!getFirestore()) {
  initializeApp();
}

const db = getFirestore();

/**
 * Contractor accepts a job bid
 * - Validates contractor ownership of the bid
 * - Updates bid status to 'accepted'
 * - Assigns job to contractor
 * - Rejects all other competing bids
 * - Triggers notifications
 */
exports.contractorAcceptJob = onCall(async (request) => {
  try {
    const { jobId, bidId, contractorId } = request.data;
    
    if (!jobId || !bidId || !contractorId) {
      throw new Error('Missing required parameters: jobId, bidId, contractorId');
    }

    // Get job and bid details
    const jobRef = db.collection('jobs').doc(jobId);
    const bidRef = db.collection('bids').doc(bidId);
    const contractorRef = db.collection('users').doc(contractorId);

    const [jobDoc, bidDoc, contractorDoc] = await Promise.all([
      jobRef.get(),
      bidRef.get(),
      contractorRef.get()
    ]);

    if (!jobDoc.exists) {
      throw new Error('Job not found');
    }
    if (!bidDoc.exists) {
      throw new Error('Bid not found');
    }
    if (!contractorDoc.exists) {
      throw new Error('Contractor not found');
    }

    const job = jobDoc.data();
    const bid = bidDoc.data();
    const contractor = contractorDoc.data();

    // Validate contractor owns the bid
    if (bid.contractorId !== contractorId) {
      throw new Error('Contractor does not own this bid');
    }

    // Use Firestore transaction to ensure data consistency
    const result = await db.runTransaction(async (transaction) => {
      // Update bid status
      transaction.update(bidRef, {
        status: 'accepted',
        acceptedAt: new Date(),
        updatedAt: new Date()
      });

      // Update job status and assign contractor
      transaction.update(jobRef, {
        status: 'assigned',
        assignedContractorId: contractorId,
        assignedContractorName: contractor.displayName || contractor.email,
        assignedAt: new Date(),
        updatedAt: new Date()
      });

      // Reject all other bids for this job
      const otherBidsQuery = db.collection('bids')
        .where('jobId', '==', jobId)
        .where('contractorId', '!=', contractorId)
        .where('status', '==', 'pending');

      const otherBidsSnapshot = await transaction.get(otherBidsQuery);
      otherBidsSnapshot.docs.forEach(doc => {
        transaction.update(doc.ref, {
          status: 'rejected',
          rejectedAt: new Date(),
          updatedAt: new Date()
        });
      });

      return {
        jobId,
        bidId,
        contractorId,
        contractorName: contractor.displayName || contractor.email,
        landlordId: job.landlordId,
        landlordName: job.landlordName,
        propertyId: job.propertyId,
        propertyName: job.propertyName,
        jobTitle: job.title,
        amount: bid.amount
      };
    });

    // Create real-time notifications
    await createBidAcceptedNotifications(result);

    return {
      success: true,
      message: 'Job bid accepted successfully',
      data: result
    };

  } catch (error) {
    console.error('Error accepting job bid:', error);
    throw new Error(`Failed to accept job bid: ${error.message}`);
  }
});

/**
 * Contractor rejects their own job bid
 * - Validates contractor ownership of the bid
 * - Updates bid status to 'rejected'
 * - Triggers notifications if needed
 */
exports.contractorRejectJob = onCall(async (request) => {
  try {
    const { jobId, bidId, contractorId, reason } = request.data;
    
    if (!jobId || !bidId || !contractorId) {
      throw new Error('Missing required parameters: jobId, bidId, contractorId');
    }

    // Get job and bid details
    const jobRef = db.collection('jobs').doc(jobId);
    const bidRef = db.collection('bids').doc(bidId);
    const contractorRef = db.collection('users').doc(contractorId);

    const [jobDoc, bidDoc, contractorDoc] = await Promise.all([
      jobRef.get(),
      bidRef.get(),
      contractorRef.get()
    ]);

    if (!jobDoc.exists) {
      throw new Error('Job not found');
    }
    if (!bidDoc.exists) {
      throw new Error('Bid not found');
    }
    if (!contractorDoc.exists) {
      throw new Error('Contractor not found');
    }

    const job = jobDoc.data();
    const bid = bidDoc.data();
    const contractor = contractorDoc.data();

    // Validate contractor owns the bid
    if (bid.contractorId !== contractorId) {
      throw new Error('Contractor does not own this bid');
    }

    // Use Firestore transaction
    const result = await db.runTransaction(async (transaction) => {
      // Update bid status
      transaction.update(bidRef, {
        status: 'rejected',
        rejectedAt: new Date(),
        rejectionReason: reason || 'No reason provided',
        updatedAt: new Date()
      });

      return {
        jobId,
        bidId,
        contractorId,
        contractorName: contractor.displayName || contractor.email,
        landlordId: job.landlordId,
        landlordName: job.landlordName,
        propertyId: job.propertyId,
        propertyName: job.propertyName,
        jobTitle: job.title,
        reason: reason || 'No reason provided'
      };
    });

    // Create real-time notification
    await createBidRejectedNotification(result);

    return {
      success: true,
      message: 'Job bid rejected successfully',
      data: result
    };

  } catch (error) {
    console.error('Error rejecting job bid:', error);
    throw new Error(`Failed to reject job bid: ${error.message}`);
  }
});

/**
 * Get contractor's bids for a specific job
 * - Returns all bids by the authenticated contractor for the specified job
 */
exports.getContractorBidsForJob = onCall(async (request) => {
  try {
    const { jobId, contractorId } = request.data;
    
    if (!jobId || !contractorId) {
      throw new Error('Missing required parameters: jobId, contractorId');
    }

    const bidsQuery = db.collection('bids')
      .where('jobId', '==', jobId)
      .where('contractorId', '==', contractorId)
      .orderBy('createdAt', 'desc');

    const bidsSnapshot = await bidsQuery.get();
    const bids = [];

    bidsSnapshot.forEach(doc => {
      bids.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        acceptedAt: doc.data().acceptedAt?.toDate(),
        rejectedAt: doc.data().rejectedAt?.toDate()
      });
    });

    return {
      success: true,
      data: bids
    };

  } catch (error) {
    console.error('Error getting contractor bids:', error);
    throw new Error(`Failed to get contractor bids: ${error.message}`);
  }
});

/**
 * Helper function: Create notifications for bid acceptance
 */
async function createBidAcceptedNotifications(data) {
  const batch = db.batch();

  // Create notification for landlord
  const landlordNotificationRef = db.collection('jobNotifications').doc();
  const landlordNotification = {
    type: 'bid_accepted',
    priority: 'high',
    title: 'Job Bid Accepted',
    message: `${data.contractorName} has accepted your job: ${data.jobTitle}`,
    userId: data.landlordId,
    userRole: 'landlord',
    jobId: data.jobId,
    bidId: data.bidId,
    contractorId: data.contractorId,
    contractorName: data.contractorName,
    landlordId: data.landlordId,
    landlordName: data.landlordName,
    propertyId: data.propertyId,
    propertyName: data.propertyName,
    data: {
      amount: data.amount,
      jobTitle: data.jobTitle,
      actionUrl: `/jobs/${data.jobId}`,
      actionText: 'View Job Details'
    },
    read: false,
    createdAt: new Date()
  };
  batch.set(landlordNotificationRef, landlordNotification);

  // Create notification for contractor
  const contractorNotificationRef = db.collection('jobNotifications').doc();
  const contractorNotification = {
    type: 'job_assigned',
    priority: 'high',
    title: 'Job Assignment Confirmed',
    message: `You have been assigned to: ${data.jobTitle}`,
    userId: data.contractorId,
    userRole: 'contractor',
    jobId: data.jobId,
    bidId: data.bidId,
    contractorId: data.contractorId,
    contractorName: data.contractorName,
    landlordId: data.landlordId,
    landlordName: data.landlordName,
    propertyId: data.propertyId,
    propertyName: data.propertyName,
    data: {
      amount: data.amount,
      jobTitle: data.jobTitle,
      actionUrl: `/contractor/jobs/${data.jobId}`,
      actionText: 'View Job Details'
    },
    read: false,
    createdAt: new Date()
  };
  batch.set(contractorNotificationRef, contractorNotification);

  // Also create notifications in the main notifications collection for compatibility
  const mainLandlordNotificationRef = db.collection('notifications').doc();
  const mainLandlordNotification = {
    userId: data.landlordId,
    userRole: 'landlord',
    type: 'bid_accepted',
    title: 'Job Bid Accepted',
    message: `${data.contractorName} has accepted your job: ${data.jobTitle}`,
    data: {
      jobId: data.jobId,
      bidId: data.bidId,
      contractorId: data.contractorId,
      contractorName: data.contractorName,
      amount: data.amount,
      propertyName: data.propertyName,
      actionUrl: `/jobs/${data.jobId}`
    },
    read: false,
    createdAt: new Date()
  };
  batch.set(mainLandlordNotificationRef, mainLandlordNotification);

  const mainContractorNotificationRef = db.collection('notifications').doc();
  const mainContractorNotification = {
    userId: data.contractorId,
    userRole: 'contractor',
    type: 'job_assigned',
    title: 'Job Assignment Confirmed',
    message: `You have been assigned to: ${data.jobTitle}`,
    data: {
      jobId: data.jobId,
      bidId: data.bidId,
      propertyName: data.propertyName,
      propertyAddress: data.propertyName,
      actionUrl: `/contractor/jobs/${data.jobId}`
    },
    read: false,
    createdAt: new Date()
  };
  batch.set(mainContractorNotificationRef, mainContractorNotification);

  await batch.commit();
  console.log('Bid accepted notifications created successfully');
}

/**
 * Helper function: Create notification for bid rejection
 */
async function createBidRejectedNotification(data) {
  const batch = db.batch();

  // Create notification for landlord
  const landlordNotificationRef = db.collection('jobNotifications').doc();
  const landlordNotification = {
    type: 'bid_rejected',
    priority: 'normal',
    title: 'Job Bid Rejected',
    message: `${data.contractorName} has rejected your job: ${data.jobTitle}`,
    userId: data.landlordId,
    userRole: 'landlord',
    jobId: data.jobId,
    bidId: data.bidId,
    contractorId: data.contractorId,
    contractorName: data.contractorName,
    landlordId: data.landlordId,
    landlordName: data.landlordName,
    propertyId: data.propertyId,
    propertyName: data.propertyName,
    data: {
      reason: data.reason,
      jobTitle: data.jobTitle,
      actionUrl: `/jobs/${data.jobId}`,
      actionText: 'View Job Details'
    },
    read: false,
    createdAt: new Date()
  };
  batch.set(landlordNotificationRef, landlordNotification);

  // Also create notification in main notifications collection
  const mainLandlordNotificationRef = db.collection('notifications').doc();
  const mainLandlordNotification = {
    userId: data.landlordId,
    userRole: 'landlord',
    type: 'bid_rejected',
    title: 'Job Bid Rejected',
    message: `${data.contractorName} has rejected your job: ${data.jobTitle}`,
    data: {
      jobId: data.jobId,
      bidId: data.bidId,
      contractorId: data.contractorId,
      contractorName: data.contractorName,
      reason: data.reason,
      actionUrl: `/jobs/${data.jobId}`
    },
    read: false,
    createdAt: new Date()
  };
  batch.set(mainLandlordNotificationRef, mainLandlordNotification);

  await batch.commit();
  console.log('Bid rejected notification created successfully');
} 