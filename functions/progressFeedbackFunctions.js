/**
 * Firebase Cloud Functions for maintenance job progress updates and feedback
 * Handles contractor progress updates and tenant feedback collection
 */

const {https} = require("firebase-functions/v2");
const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");

// Initialize admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Handles contractor updating job progress
 * - Updates ticket status
 * - Allows uploading progress photos
 * - Notifies tenant and landlord of progress
 */
exports.updateJobProgress = https.onCall(async (data, context) => {
  try {
    // Verify authentication
    if (!context.auth) {
      throw new https.HttpsError(
        "unauthenticated",
        "You must be logged in to update job progress"
      );
    }

    // Extract data
    const { ticketId, status, progressNote, photoUrls } = data;
    if (!ticketId || !status) {
      throw new https.HttpsError(
        "invalid-argument", 
        "The function must be called with a valid ticketId and status"
      );
    }

    const contractorId = context.auth.uid;
    
    // Validate status
    const validStatuses = ["in_progress", "on_hold", "parts_needed", "completed"];
    if (!validStatuses.includes(status)) {
      throw new https.HttpsError(
        "invalid-argument", 
        `Status must be one of: ${validStatuses.join(", ")}`
      );
    }
    
    // Get ticket data
    const ticketRef = admin.firestore().collection("tickets").doc(ticketId);
    const ticketSnapshot = await ticketRef.get();
    
    if (!ticketSnapshot.exists) {
      throw new https.HttpsError(
        "not-found", 
        "The specified ticket was not found"
      );
    }
    
    const ticketData = ticketSnapshot.data();
    
    // Verify this contractor is assigned to the ticket
    if (ticketData.assignedTo !== contractorId) {
      throw new https.HttpsError(
        "permission-denied", 
        "You are not assigned to this ticket"
      );
    }
    
    // Create progress update entry
    const progressUpdate = {
      status,
      previousStatus: ticketData.status,
      contractorId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      note: progressNote || null,
      photoUrls: photoUrls || []
    };
    
    // Add to progress history collection
    await ticketRef.collection("progress").add(progressUpdate);
    
    // Update the main ticket document
    const updateData = {
      status,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      "meta.lastUpdatedBy": contractorId
    };
    
    // Add status-specific timestamps
    if (status === "in_progress" && ticketData.status !== "in_progress") {
      updateData["meta.startedAt"] = admin.firestore.FieldValue.serverTimestamp();
    } else if (status === "completed" && ticketData.status !== "completed") {
      updateData["meta.completedAt"] = admin.firestore.FieldValue.serverTimestamp();
    } else if (status === "on_hold" && ticketData.status !== "on_hold") {
      updateData["meta.onHoldAt"] = admin.firestore.FieldValue.serverTimestamp();
      updateData["meta.onHoldReason"] = progressNote || "No reason provided";
    }
    
    // Add photos to the ticket if provided
    if (photoUrls && photoUrls.length > 0) {
      if (!ticketData.progressPhotos) {
        updateData.progressPhotos = photoUrls;
      } else {
        updateData.progressPhotos = admin.firestore.FieldValue.arrayUnion(...photoUrls);
      }
    }
    
    await ticketRef.update(updateData);
    
    // Get property and user information for notifications
    const propertySnapshot = await admin.firestore()
      .collection("properties")
      .doc(ticketData.propertyId)
      .get();
    
    if (!propertySnapshot.exists) {
      logger.error(`Property ${ticketData.propertyId} not found for ticket ${ticketId}`);
      throw new https.HttpsError("not-found", "Property not found");
    }
    
    const propertyData = propertySnapshot.data();
    const landlordId = propertyData.owner;
    const tenantId = ticketData.submittedBy;
    
    // Prepare notification message based on status
    let notificationMessage;
    let notificationType;
    
    if (status === "in_progress") {
      notificationMessage = `Contractor has started work on the ${ticketData.category} maintenance request.`;
      notificationType = "job_started";
    } else if (status === "on_hold") {
      notificationMessage = `Maintenance request is on hold: ${progressNote || "No reason provided"}`;
      notificationType = "job_on_hold";
    } else if (status === "parts_needed") {
      notificationMessage = `Maintenance request requires parts: ${progressNote || "No details provided"}`;
      notificationType = "job_parts_needed";
    } else if (status === "completed") {
      notificationMessage = `Contractor has completed the ${ticketData.category} maintenance request.`;
      notificationType = "job_completed";
    } else {
      notificationMessage = `Maintenance request status updated to ${status}.`;
      notificationType = "job_updated";
    }
    
    // Send notifications to landlord and tenant
    const notifications = [];
    
    // Notify tenant
    if (tenantId) {
      notifications.push(
        admin.firestore().collection("notifications").add({
          userId: tenantId,
          userRole: "tenant",
          type: notificationType,
          title: "Maintenance Update",
          message: notificationMessage,
          data: {
            ticketId,
            propertyId: ticketData.propertyId,
            status,
            photoUrls: photoUrls || [],
            progressNote: progressNote || null
          },
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        })
      );
    }
    
    // Notify landlord
    if (landlordId) {
      notifications.push(
        admin.firestore().collection("notifications").add({
          userId: landlordId,
          userRole: "landlord",
          type: notificationType,
          title: "Maintenance Update",
          message: notificationMessage,
          data: {
            ticketId,
            propertyId: ticketData.propertyId,
            status,
            photoUrls: photoUrls || [],
            progressNote: progressNote || null
          },
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        })
      );
    }
    
    // Wait for notifications to be sent
    await Promise.all(notifications);
    
    // Trigger feedback request if job is completed
    if (status === "completed" && tenantId) {
      await requestFeedback(ticketId, tenantId);
    }
    
    logger.info(`Updated job progress for ticket ${ticketId} to ${status}`);
    
    return {
      success: true,
      status,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    logger.error("Error updating job progress:", error);
    throw new https.HttpsError("internal", error.message);
  }
});

/**
 * Handles requesting feedback from tenant when job is completed
 */
async function requestFeedback(ticketId, tenantId) {
  try {
    // Create feedback request entry
    const feedbackRequestRef = admin.firestore()
      .collection("tickets")
      .doc(ticketId)
      .collection("feedback")
      .doc("request");
    
    await feedbackRequestRef.set({
      requestedAt: admin.firestore.FieldValue.serverTimestamp(),
      tenantId,
      status: "pending",
      reminderCount: 0
    });
    
    // Send notification to tenant requesting feedback
    await admin.firestore().collection("notifications").add({
      userId: tenantId,
      userRole: "tenant",
      type: "feedback_request",
      title: "Please Rate Your Maintenance Experience",
      message: "Your maintenance request has been completed. Please take a moment to rate your experience.",
      data: {
        ticketId,
        feedbackType: "maintenance"
      },
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    logger.info(`Requested feedback from tenant ${tenantId} for ticket ${ticketId}`);
    return true;
  } catch (error) {
    logger.error(`Error requesting feedback for ticket ${ticketId}:`, error);
    return false;
  }
}

/**
 * Handles tenant submitting feedback for a completed maintenance job
 */
exports.submitFeedback = https.onCall(async (data, context) => {
  try {
    // Verify authentication
    if (!context.auth) {
      throw new https.HttpsError(
        "unauthenticated",
        "You must be logged in to submit feedback"
      );
    }

    // Extract data
    const { ticketId, rating, comment, categories } = data;
    if (!ticketId || rating === undefined) {
      throw new https.HttpsError(
        "invalid-argument", 
        "The function must be called with a valid ticketId and rating"
      );
    }

    const tenantId = context.auth.uid;
    
    // Validate rating is between 1-5
    if (rating < 1 || rating > 5) {
      throw new https.HttpsError(
        "invalid-argument", 
        "Rating must be between 1 and 5"
      );
    }
    
    // Get ticket data
    const ticketRef = admin.firestore().collection("tickets").doc(ticketId);
    const ticketSnapshot = await ticketRef.get();
    
    if (!ticketSnapshot.exists) {
      throw new https.HttpsError(
        "not-found", 
        "The specified ticket was not found"
      );
    }
    
    const ticketData = ticketSnapshot.data();
    
    // Verify this tenant is the one who submitted the ticket
    if (ticketData.submittedBy !== tenantId) {
      throw new https.HttpsError(
        "permission-denied", 
        "You can only provide feedback for your own maintenance requests"
      );
    }
    
    // Verify the ticket is completed
    if (ticketData.status !== "completed") {
      throw new https.HttpsError(
        "failed-precondition", 
        "Feedback can only be provided for completed maintenance requests"
      );
    }
    
    // Get contractor data
    const contractorId = ticketData.assignedTo;
    if (!contractorId) {
      throw new https.HttpsError(
        "not-found", 
        "No contractor found for this ticket"
      );
    }
    
    // Create feedback entry
    const feedbackData = {
      ticketId,
      tenantId,
      contractorId,
      rating,
      comment: comment || "",
      categories: categories || [],
      submittedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Add to feedback collection for this ticket
    await ticketRef.collection("feedback").doc("tenant").set(feedbackData);
    
    // Update the feedback request status
    const feedbackRequestRef = ticketRef.collection("feedback").doc("request");
    await feedbackRequestRef.update({
      status: "completed",
      completedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Update ticket to indicate feedback was received
    await ticketRef.update({
      "meta.hasFeedback": true,
      "meta.feedbackRating": rating
    });
    
    // Update contractor's average rating
    await updateContractorRating(contractorId, rating);
    
    // Notify contractor about the feedback
    if (rating >= 4) {
      // For positive feedback, notify contractor
      await admin.firestore().collection("notifications").add({
        userId: contractorId,
        userRole: "contractor",
        type: "feedback_received",
        title: "You Received Positive Feedback",
        message: `You received a ${rating}-star rating for a recent ${ticketData.category} job.`,
        data: {
          ticketId,
          rating,
          comment: comment || ""
        },
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    // For low ratings, notify landlord
    if (rating <= 2) {
      // Get property to find landlord
      const propertySnapshot = await admin.firestore()
        .collection("properties")
        .doc(ticketData.propertyId)
        .get();
      
      if (propertySnapshot.exists) {
        const propertyData = propertySnapshot.data();
        const landlordId = propertyData.owner;
        
        if (landlordId) {
          await admin.firestore().collection("notifications").add({
            userId: landlordId,
            userRole: "landlord",
            type: "low_feedback_alert",
            title: "Low Contractor Rating",
            message: `A tenant gave a ${rating}-star rating to a contractor for a ${ticketData.category} job.`,
            data: {
              ticketId,
              rating,
              comment: comment || "",
              contractorId
            },
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      }
    }
    
    logger.info(`Tenant ${tenantId} submitted ${rating}-star feedback for ticket ${ticketId}`);
    
    return {
      success: true
    };
    
  } catch (error) {
    logger.error("Error submitting feedback:", error);
    throw new https.HttpsError("internal", error.message);
  }
});

/**
 * Updates contractor's average rating based on new feedback
 */
async function updateContractorRating(contractorId, newRating) {
  try {
    // Get contractor document
    const contractorRef = admin.firestore().collection("users").doc(contractorId);
    const contractorDoc = await contractorRef.get();
    
    if (!contractorDoc.exists) {
      logger.error(`Contractor ${contractorId} not found`);
      return false;
    }
    
    const contractorData = contractorDoc.data();
    
    // Calculate new average rating
    const currentRating = contractorData.rating || 0;
    const ratingCount = contractorData.ratingCount || 0;
    
    let newAvgRating;
    if (ratingCount === 0) {
      newAvgRating = newRating;
    } else {
      // Weighted average: (currentAvg * count + newRating) / (count + 1)
      newAvgRating = ((currentRating * ratingCount) + newRating) / (ratingCount + 1);
      // Round to 1 decimal place
      newAvgRating = Math.round(newAvgRating * 10) / 10;
    }
    
    // Update contractor document
    await contractorRef.update({
      rating: newAvgRating,
      ratingCount: admin.firestore.FieldValue.increment(1),
      lastRatingAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    logger.info(`Updated contractor ${contractorId} rating to ${newAvgRating} (${ratingCount + 1} ratings)`);
    return true;
  } catch (error) {
    logger.error(`Error updating contractor rating for ${contractorId}:`, error);
    return false;
  }
}

/**
 * Gets job progress history for a ticket
 */
exports.getJobProgressHistory = https.onCall(async (data, context) => {
  try {
    // Verify authentication
    if (!context.auth) {
      throw new https.HttpsError(
        "unauthenticated",
        "You must be logged in to view job progress"
      );
    }

    const { ticketId } = data;
    if (!ticketId) {
      throw new https.HttpsError(
        "invalid-argument", 
        "The function must be called with a valid ticketId"
      );
    }

    const userId = context.auth.uid;
    
    // Get ticket data
    const ticketRef = admin.firestore().collection("tickets").doc(ticketId);
    const ticketSnapshot = await ticketRef.get();
    
    if (!ticketSnapshot.exists) {
      throw new https.HttpsError(
        "not-found", 
        "The specified ticket was not found"
      );
    }
    
    const ticketData = ticketSnapshot.data();
    
    // Verify user is authorized to view this ticket
    const userRole = context.auth.token.role || "tenant";
    let isAuthorized = false;
    
    if (userRole === "admin") {
      isAuthorized = true;
    } else if (userRole === "landlord") {
      // Check if user is the property owner
      const propertySnapshot = await admin.firestore()
        .collection("properties")
        .doc(ticketData.propertyId)
        .get();
      
      if (propertySnapshot.exists && propertySnapshot.data().owner === userId) {
        isAuthorized = true;
      }
    } else if (userRole === "tenant") {
      // Check if user submitted the ticket
      if (ticketData.submittedBy === userId) {
        isAuthorized = true;
      }
    } else if (userRole === "contractor") {
      // Check if user is assigned to the ticket
      if (ticketData.assignedTo === userId) {
        isAuthorized = true;
      }
    }
    
    if (!isAuthorized) {
      throw new https.HttpsError(
        "permission-denied", 
        "You are not authorized to view this ticket's progress"
      );
    }
    
    // Get progress updates
    const progressSnapshot = await ticketRef
      .collection("progress")
      .orderBy("timestamp", "desc")
      .get();
    
    const progressUpdates = [];
    progressSnapshot.forEach(doc => {
      progressUpdates.push({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate().toISOString()
      });
    });
    
    // Get feedback if completed
    let feedback = null;
    if (ticketData.status === "completed") {
      const feedbackSnapshot = await ticketRef
        .collection("feedback")
        .doc("tenant")
        .get();
      
      if (feedbackSnapshot.exists) {
        feedback = {
          ...feedbackSnapshot.data(),
          submittedAt: feedbackSnapshot.data().submittedAt?.toDate().toISOString()
        };
      }
    }
    
    return {
      ticket: {
        id: ticketId,
        ...ticketData,
        createdAt: ticketData.createdAt?.toDate().toISOString(),
        lastUpdated: ticketData.lastUpdated?.toDate().toISOString()
      },
      progressUpdates,
      feedback
    };
    
  } catch (error) {
    logger.error("Error getting job progress history:", error);
    throw new https.HttpsError("internal", error.message);
  }
}); 