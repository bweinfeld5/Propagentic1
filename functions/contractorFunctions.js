/**
 * Firebase Cloud Functions for contractor interactions with maintenance tickets
 */

const {https} = require("firebase-functions/v2");
const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");

// Initialize admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Handles a contractor rejecting a maintenance request
 * - Logs rejection reason
 * - Finds fallback contractor
 * - Updates ticket status
 * - Notifies relevant parties
 */
exports.handleContractorRejection = https.onCall(async (data, context) => {
  try {
    // Verify authentication
    if (!context.auth) {
      throw new https.HttpsError(
        "unauthenticated",
        "You must be logged in to reject a ticket"
      );
    }

    // Extract data
    const { ticketId, rejectionReason } = data;
    if (!ticketId) {
      throw new https.HttpsError(
        "invalid-argument", 
        "The function must be called with a valid ticketId"
      );
    }

    const contractorId = context.auth.uid;
    
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
    
    // Log rejection in ticket history
    await ticketRef.collection("history").add({
      type: "rejection",
      contractorId: contractorId,
      reason: rejectionReason || "No reason provided",
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Update rejection count in ticket metadata
    await ticketRef.update({
      "meta.rejectionCount": admin.firestore.FieldValue.increment(1),
      "meta.lastRejectedBy": contractorId,
      "meta.lastRejectionReason": rejectionReason || "No reason provided",
      "meta.lastRejectionTime": admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Find fallback contractor
    let fallbackContractor = null;
    let needsManualAssignment = false;
    
    // Attempt to find a fallback contractor
    const { category, propertyId, urgency } = ticketData;
    
    // Get property information to find the landlord
    const propertySnapshot = await admin.firestore()
      .collection("properties")
      .doc(propertyId)
      .get();
    
    if (!propertySnapshot.exists) {
      logger.error(`Property ${propertyId} not found for ticket ${ticketId}`);
      throw new https.HttpsError("not-found", "Property not found");
    }
    
    const propertyData = propertySnapshot.data();
    const landlordId = propertyData.owner;
    
    // Check if this is the third rejection - if so, require manual assignment
    if (ticketData.meta && ticketData.meta.rejectionCount >= 2) {
      needsManualAssignment = true;
    } else {
      // Query for contractors with matching specialty who haven't rejected this ticket
      const contractorsQuery = await admin.firestore()
        .collection("users")
        .where("role", "==", "contractor")
        .where("specialties", "array-contains", category)
        .where("available", "==", true)
        .limit(5)
        .get();
      
      // Filter out the contractor who just rejected and any who previously rejected
      const previouslyRejected = ticketData.meta?.previouslyRejectedBy || [];
      previouslyRejected.push(contractorId);
      
      const eligibleContractors = [];
      contractorsQuery.forEach(doc => {
        const contractor = doc.data();
        if (!previouslyRejected.includes(doc.id)) {
          eligibleContractors.push({
            id: doc.id,
            ...contractor
          });
        }
      });
      
      // Sort by rating (descending) and pick the top one
      if (eligibleContractors.length > 0) {
        eligibleContractors.sort((a, b) => 
          (b.rating || 0) - (a.rating || 0)
        );
        fallbackContractor = eligibleContractors[0];
      } else {
        needsManualAssignment = true;
      }
    }
    
    // Update ticket status based on fallback availability
    if (fallbackContractor) {
      // Assign to fallback contractor
      await ticketRef.update({
        assignedTo: fallbackContractor.id,
        status: "pending_acceptance",
        "meta.previouslyRejectedBy": admin.firestore.FieldValue.arrayUnion(contractorId),
        "meta.fallbackAssignedAt": admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Notify the fallback contractor
      await admin.firestore().collection("notifications").add({
        userId: fallbackContractor.id,
        userRole: "contractor",
        type: "job_match",
        title: "New Job Assignment",
        message: `You've been assigned to a ${category} job as a fallback contractor.`,
        data: {
          ticketId: ticketId,
          propertyId: propertyId,
          category: category,
          urgency: urgency
        },
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Log the fallback assignment
      logger.info(`Assigned fallback contractor ${fallbackContractor.id} to ticket ${ticketId}`);
      
      return {
        success: true,
        status: "reassigned",
        fallbackContractor: fallbackContractor.id
      };
    } else {
      // Requires manual assignment
      await ticketRef.update({
        assignedTo: null,
        status: "needs_manual_assignment",
        "meta.previouslyRejectedBy": admin.firestore.FieldValue.arrayUnion(contractorId),
        "meta.manualAssignmentNeededAt": admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Notify the landlord that manual assignment is needed
      await admin.firestore().collection("notifications").add({
        userId: landlordId,
        userRole: "landlord",
        type: "manual_assignment_needed",
        title: "Manual Assignment Required",
        message: `A ${category} maintenance request needs manual contractor assignment after rejection.`,
        data: {
          ticketId: ticketId,
          propertyId: propertyId,
          category: category,
          urgency: urgency,
          rejectionReason: rejectionReason || "No reason provided"
        },
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      logger.info(`Ticket ${ticketId} needs manual assignment after rejection by ${contractorId}`);
      
      return {
        success: true,
        status: "needs_manual_assignment"
      };
    }
    
  } catch (error) {
    logger.error("Error handling contractor rejection:", error);
    throw new https.HttpsError("internal", error.message);
  }
});

/**
 * Handles a contractor accepting a maintenance request
 */
exports.handleContractorAcceptance = https.onCall(async (data, context) => {
  try {
    // Verify authentication
    if (!context.auth) {
      throw new https.HttpsError(
        "unauthenticated",
        "You must be logged in to accept a ticket"
      );
    }

    // Extract data
    const { ticketId } = data;
    if (!ticketId) {
      throw new https.HttpsError(
        "invalid-argument", 
        "The function must be called with a valid ticketId"
      );
    }

    const contractorId = context.auth.uid;
    
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
    
    // Update ticket status
    await ticketRef.update({
      status: "assigned",
      "meta.acceptedAt": admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Log acceptance in ticket history
    await ticketRef.collection("history").add({
      type: "acceptance",
      contractorId: contractorId,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Get property and tenant information for notifications
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
    
    // Notify landlord
    await admin.firestore().collection("notifications").add({
      userId: landlordId,
      userRole: "landlord",
      type: "job_accepted",
      title: "Maintenance Request Accepted",
      message: `Contractor has accepted the ${ticketData.category} maintenance request.`,
      data: {
        ticketId: ticketId,
        propertyId: ticketData.propertyId,
        category: ticketData.category
      },
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Notify tenant
    await admin.firestore().collection("notifications").add({
      userId: tenantId,
      userRole: "tenant",
      type: "job_accepted",
      title: "Maintenance Request Update",
      message: `A contractor has accepted your ${ticketData.category} maintenance request.`,
      data: {
        ticketId: ticketId,
        propertyId: ticketData.propertyId,
        category: ticketData.category
      },
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    logger.info(`Contractor ${contractorId} accepted ticket ${ticketId}`);
    
    return {
      success: true,
      status: "assigned"
    };
    
  } catch (error) {
    logger.error("Error handling contractor acceptance:", error);
    throw new https.HttpsError("internal", error.message);
  }
}); 