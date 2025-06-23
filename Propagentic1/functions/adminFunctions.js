/**
 * Firebase Cloud Functions for admin operations on maintenance tickets
 * Handles ticket reassignment, status override, and other admin utilities
 */

const {https} = require("firebase-functions/v2");
const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");

// Initialize admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Allows admins to reassign a ticket to a different contractor
 */
exports.adminReassignTicket = https.onCall(async (data, context) => {
  try {
    // Verify authentication
    if (!context.auth) {
      throw new https.HttpsError(
        "unauthenticated",
        "You must be logged in to reassign a ticket"
      );
    }
    
    // Verify admin or landlord role
    const userRole = context.auth.token.role || "";
    if (userRole !== "admin" && userRole !== "landlord") {
      throw new https.HttpsError(
        "permission-denied",
        "Only admins and landlords can reassign tickets"
      );
    }

    // Extract data
    const { ticketId, newContractorId, reason } = data;
    if (!ticketId || !newContractorId) {
      throw new https.HttpsError(
        "invalid-argument", 
        "The function must be called with a valid ticketId and newContractorId"
      );
    }

    const adminId = context.auth.uid;
    
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
    
    // If user is a landlord, verify they own the property
    if (userRole === "landlord") {
      const propertySnapshot = await admin.firestore()
        .collection("properties")
        .doc(ticketData.propertyId)
        .get();
      
      if (!propertySnapshot.exists || propertySnapshot.data().owner !== adminId) {
        throw new https.HttpsError(
          "permission-denied",
          "You can only reassign tickets for properties you own"
        );
      }
    }
    
    // Verify new contractor exists and is a contractor
    const contractorSnapshot = await admin.firestore()
      .collection("users")
      .doc(newContractorId)
      .get();
    
    if (!contractorSnapshot.exists) {
      throw new https.HttpsError(
        "not-found",
        "The specified contractor was not found"
      );
    }
    
    const contractorData = contractorSnapshot.data();
    if (contractorData.role !== "contractor") {
      throw new https.HttpsError(
        "invalid-argument",
        "The specified user is not a contractor"
      );
    }
    
    // Store previous contractor info
    const previousContractorId = ticketData.assignedTo;
    
    // Log the reassignment in the ticket history
    await ticketRef.collection("adminActions").add({
      type: "reassignment",
      adminId,
      adminRole: userRole,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      previousContractorId,
      newContractorId,
      reason: reason || "Admin reassignment"
    });
    
    // Update the ticket
    await ticketRef.update({
      assignedTo: newContractorId,
      status: "pending_acceptance",
      "meta.reassignedAt": admin.firestore.FieldValue.serverTimestamp(),
      "meta.reassignedBy": adminId,
      "meta.reassignmentReason": reason || "Admin reassignment"
    });
    
    // Send notifications to relevant parties
    
    // Notify new contractor
    await admin.firestore().collection("notifications").add({
      userId: newContractorId,
      userRole: "contractor",
      type: "job_assignment",
      title: "New Job Assignment",
      message: `You have been assigned to a ${ticketData.category} maintenance request by an admin.`,
      data: {
        ticketId,
        propertyId: ticketData.propertyId,
        category: ticketData.category,
        reason: reason || "Admin reassignment"
      },
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Notify previous contractor if there was one
    if (previousContractorId) {
      await admin.firestore().collection("notifications").add({
        userId: previousContractorId,
        userRole: "contractor",
        type: "job_reassigned",
        title: "Job Reassigned",
        message: `A ${ticketData.category} job has been reassigned to another contractor.`,
        data: {
          ticketId,
          reason: reason || "Admin reassignment"
        },
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    // Notify tenant
    if (ticketData.submittedBy) {
      await admin.firestore().collection("notifications").add({
        userId: ticketData.submittedBy,
        userRole: "tenant",
        type: "contractor_changed",
        title: "Contractor Changed",
        message: `A different contractor has been assigned to your ${ticketData.category} maintenance request.`,
        data: {
          ticketId
        },
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    logger.info(`Admin ${adminId} reassigned ticket ${ticketId} from ${previousContractorId || 'unassigned'} to ${newContractorId}`);
    
    return {
      success: true,
      ticketId,
      newContractorId
    };
    
  } catch (error) {
    logger.error("Error in adminReassignTicket:", error);
    throw new https.HttpsError("internal", error.message);
  }
});

/**
 * Allows admins to override a ticket's status
 */
exports.adminOverrideStatus = https.onCall(async (data, context) => {
  try {
    // Verify authentication
    if (!context.auth) {
      throw new https.HttpsError(
        "unauthenticated",
        "You must be logged in to override ticket status"
      );
    }
    
    // Verify admin role
    const userRole = context.auth.token.role || "";
    if (userRole !== "admin" && userRole !== "landlord") {
      throw new https.HttpsError(
        "permission-denied",
        "Only admins and landlords can override ticket status"
      );
    }

    // Extract data
    const { ticketId, newStatus, reason } = data;
    if (!ticketId || !newStatus) {
      throw new https.HttpsError(
        "invalid-argument", 
        "The function must be called with a valid ticketId and newStatus"
      );
    }

    const adminId = context.auth.uid;
    
    // Validate status
    const validStatuses = [
      "new", "ready_to_dispatch", "pending_acceptance", "assigned", 
      "in_progress", "on_hold", "completed", "canceled"
    ];
    
    if (!validStatuses.includes(newStatus)) {
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
    
    // If user is a landlord, verify they own the property
    if (userRole === "landlord") {
      const propertySnapshot = await admin.firestore()
        .collection("properties")
        .doc(ticketData.propertyId)
        .get();
      
      if (!propertySnapshot.exists || propertySnapshot.data().owner !== adminId) {
        throw new https.HttpsError(
          "permission-denied",
          "You can only override status for properties you own"
        );
      }
    }
    
    // Log the status override in the ticket history
    await ticketRef.collection("adminActions").add({
      type: "statusOverride",
      adminId,
      adminRole: userRole,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      previousStatus: ticketData.status,
      newStatus,
      reason: reason || "Admin status override"
    });
    
    // Update the ticket
    await ticketRef.update({
      status: newStatus,
      "meta.statusOverriddenAt": admin.firestore.FieldValue.serverTimestamp(),
      "meta.statusOverriddenBy": adminId,
      "meta.statusOverrideReason": reason || "Admin status override"
    });
    
    // Add status-specific timestamps
    if (newStatus === "completed") {
      await ticketRef.update({
        "meta.completedAt": admin.firestore.FieldValue.serverTimestamp()
      });
    } else if (newStatus === "canceled") {
      await ticketRef.update({
        "meta.canceledAt": admin.firestore.FieldValue.serverTimestamp(),
        "meta.canceledBy": adminId,
        "meta.cancellationReason": reason || "Admin cancellation"
      });
    }
    
    // Send notifications to relevant parties
    
    // Notify contractor if assigned
    if (ticketData.assignedTo) {
      await admin.firestore().collection("notifications").add({
        userId: ticketData.assignedTo,
        userRole: "contractor",
        type: "status_overridden",
        title: "Ticket Status Changed",
        message: `A ${ticketData.category} job status has been changed to ${newStatus} by an admin.`,
        data: {
          ticketId,
          newStatus,
          reason: reason || "Admin status override"
        },
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    // Notify tenant
    if (ticketData.submittedBy) {
      await admin.firestore().collection("notifications").add({
        userId: ticketData.submittedBy,
        userRole: "tenant",
        type: "status_overridden",
        title: "Maintenance Request Update",
        message: `Your ${ticketData.category} maintenance request status has been updated to ${newStatus}.`,
        data: {
          ticketId,
          newStatus
        },
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    logger.info(`Admin ${adminId} overrode ticket ${ticketId} status from ${ticketData.status} to ${newStatus}`);
    
    return {
      success: true,
      ticketId,
      newStatus
    };
    
  } catch (error) {
    logger.error("Error in adminOverrideStatus:", error);
    throw new https.HttpsError("internal", error.message);
  }
});

/**
 * Allows admins to prioritize a ticket (mark as urgent)
 */
exports.adminPrioritizeTicket = https.onCall(async (data, context) => {
  try {
    // Verify authentication
    if (!context.auth) {
      throw new https.HttpsError(
        "unauthenticated",
        "You must be logged in to prioritize a ticket"
      );
    }
    
    // Verify admin or landlord role
    const userRole = context.auth.token.role || "";
    if (userRole !== "admin" && userRole !== "landlord") {
      throw new https.HttpsError(
        "permission-denied",
        "Only admins and landlords can prioritize tickets"
      );
    }

    // Extract data
    const { ticketId, urgency, reason } = data;
    if (!ticketId || !urgency) {
      throw new https.HttpsError(
        "invalid-argument", 
        "The function must be called with a valid ticketId and urgency"
      );
    }

    const adminId = context.auth.uid;
    
    // Validate urgency (1-5)
    if (urgency < 1 || urgency > 5) {
      throw new https.HttpsError(
        "invalid-argument", 
        "Urgency must be between 1 and 5"
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
    
    // If user is a landlord, verify they own the property
    if (userRole === "landlord") {
      const propertySnapshot = await admin.firestore()
        .collection("properties")
        .doc(ticketData.propertyId)
        .get();
      
      if (!propertySnapshot.exists || propertySnapshot.data().owner !== adminId) {
        throw new https.HttpsError(
          "permission-denied",
          "You can only prioritize tickets for properties you own"
        );
      }
    }
    
    // Log the prioritization in the ticket history
    await ticketRef.collection("adminActions").add({
      type: "prioritization",
      adminId,
      adminRole: userRole,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      previousUrgency: ticketData.urgency,
      newUrgency: urgency,
      reason: reason || "Admin prioritization"
    });
    
    // Update the ticket
    await ticketRef.update({
      urgency,
      "meta.prioritizedAt": admin.firestore.FieldValue.serverTimestamp(),
      "meta.prioritizedBy": adminId,
      "meta.prioritizationReason": reason || "Admin prioritization"
    });
    
    // If urgency is high (4 or 5), add a flag
    if (urgency >= 4) {
      await ticketRef.update({
        urgent: true
      });
    }
    
    // Send notifications if urgency increased
    if (urgency > ticketData.urgency) {
      // Notify contractor if assigned
      if (ticketData.assignedTo) {
        await admin.firestore().collection("notifications").add({
          userId: ticketData.assignedTo,
          userRole: "contractor",
          type: "urgency_increased",
          title: "Job Urgency Increased",
          message: `A ${ticketData.category} job urgency has been increased to ${urgency}/5.`,
          data: {
            ticketId,
            urgency,
            reason: reason || "Admin prioritization"
          },
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }
    
    logger.info(`Admin ${adminId} changed ticket ${ticketId} urgency from ${ticketData.urgency || 'unset'} to ${urgency}`);
    
    return {
      success: true,
      ticketId,
      urgency
    };
    
  } catch (error) {
    logger.error("Error in adminPrioritizeTicket:", error);
    throw new https.HttpsError("internal", error.message);
  }
});

/**
 * Gets admin action history for a ticket
 */
exports.getAdminActionHistory = https.onCall(async (data, context) => {
  try {
    // Verify authentication
    if (!context.auth) {
      throw new https.HttpsError(
        "unauthenticated",
        "You must be logged in to view admin actions"
      );
    }
    
    // Verify admin or landlord role
    const userRole = context.auth.token.role || "";
    if (userRole !== "admin" && userRole !== "landlord") {
      throw new https.HttpsError(
        "permission-denied",
        "Only admins and landlords can view admin action history"
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
    
    // If user is a landlord, verify they own the property
    if (userRole === "landlord") {
      const propertySnapshot = await admin.firestore()
        .collection("properties")
        .doc(ticketData.propertyId)
        .get();
      
      if (!propertySnapshot.exists || propertySnapshot.data().owner !== userId) {
        throw new https.HttpsError(
          "permission-denied",
          "You can only view admin actions for properties you own"
        );
      }
    }
    
    // Get admin actions
    const actionsSnapshot = await ticketRef
      .collection("adminActions")
      .orderBy("timestamp", "desc")
      .get();
    
    const actions = [];
    actionsSnapshot.forEach(doc => {
      actions.push({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate().toISOString()
      });
    });
    
    // Get escalation log if it exists
    let escalationLog = null;
    const escalationLogSnapshot = await ticketRef
      .collection("meta")
      .doc("escalationLog")
      .get();
    
    if (escalationLogSnapshot.exists) {
      const logData = escalationLogSnapshot.data();
      
      // Format timestamp in each escalation entry
      const formattedEscalations = (logData.escalations || []).map(escalation => ({
        ...escalation,
        timestamp: escalation.timestamp?.toDate().toISOString()
      }));
      
      escalationLog = {
        ...logData,
        escalations: formattedEscalations
      };
    }
    
    return {
      adminActions: actions,
      escalationLog,
      ticket: {
        id: ticketId,
        status: ticketData.status,
        assignedTo: ticketData.assignedTo,
        urgency: ticketData.urgency
      }
    };
    
  } catch (error) {
    logger.error("Error in getAdminActionHistory:", error);
    throw new https.HttpsError("internal", error.message);
  }
}); 