/**
 * Firebase Cloud Functions for maintenance ticket escalation
 * Handles SLA tracking and urgent ticket escalation
 */

const {onSchedule} = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");

// Initialize admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Scheduled function to escalate urgent tickets that have been unassigned for too long
 * Runs every 30 minutes to check for SLA violations
 */
exports.escalateUnassignedUrgentTickets = onSchedule({
  schedule: "every 30 minutes",
  region: "us-central1",
  timeZone: "America/New_York",
  retryCount: 3,
  maxRetrySeconds: 60
}, async (event) => {
  try {
    logger.info("Starting escalation check for urgent unassigned tickets");
    
    // Calculate time thresholds based on urgency levels
    const now = admin.firestore.Timestamp.now();
    
    // Time thresholds (in milliseconds) for different urgency levels
    const urgencyThresholds = {
      5: 30 * 60 * 1000,    // Urgency 5 (highest): 30 minutes
      4: 60 * 60 * 1000,    // Urgency 4: 1 hour
      3: 3 * 60 * 60 * 1000 // Urgency 3: 3 hours
    };
    
    // Get all tickets that might need escalation
    const ticketsSnapshot = await admin.firestore()
      .collection("tickets")
      .where("status", "in", ["ready_to_dispatch", "pending_acceptance"])
      .where("urgency", ">=", 3)
      .get();
    
    if (ticketsSnapshot.empty) {
      logger.info("No tickets found that match escalation criteria");
      return;
    }
    
    const batch = admin.firestore().batch();
    const escalatedTickets = [];
    
    // Process each ticket to check for SLA violations
    ticketsSnapshot.forEach(doc => {
      const ticket = doc.data();
      const ticketRef = doc.ref;
      const ticketId = doc.id;
      
      // Skip if already escalated
      if (ticket.escalated) {
        return;
      }
      
      // Get the right time threshold based on urgency
      const threshold = urgencyThresholds[ticket.urgency];
      if (!threshold) {
        return; // Skip if urgency doesn't have a threshold
      }
      
      // Calculate the reference time based on ticket status
      let referenceTime;
      if (ticket.status === "ready_to_dispatch") {
        referenceTime = ticket.classifiedAt?.toDate() || ticket.createdAt?.toDate();
      } else if (ticket.status === "pending_acceptance") {
        referenceTime = ticket.assignedAt?.toDate();
      }
      
      if (!referenceTime) {
        logger.warn(`Ticket ${ticketId} missing reference timestamp for escalation check`);
        return;
      }
      
      // Check if the ticket has exceeded its time threshold
      const elapsedMs = now.toDate().getTime() - referenceTime.getTime();
      if (elapsedMs > threshold) {
        // This ticket needs escalation
        batch.update(ticketRef, {
          escalated: true,
          "meta.escalatedAt": now,
          "meta.escalationReason": `Exceeded ${threshold/60000} minute threshold for urgency ${ticket.urgency}`
        });
        
        // Add to escalation log
        const escalationLogRef = ticketRef.collection("meta").doc("escalationLog");
        batch.set(escalationLogRef, {
          escalations: admin.firestore.FieldValue.arrayUnion({
            timestamp: now,
            reason: `Exceeded ${threshold/60000} minute threshold for urgency ${ticket.urgency}`,
            elapsedMinutes: Math.floor(elapsedMs / 60000),
            status: ticket.status
          })
        }, { merge: true });
        
        escalatedTickets.push({
          ticketId,
          urgency: ticket.urgency,
          status: ticket.status,
          propertyId: ticket.propertyId,
          elapsedMinutes: Math.floor(elapsedMs / 60000)
        });
      }
    });
    
    // If no tickets need escalation, we're done
    if (escalatedTickets.length === 0) {
      logger.info("No tickets need escalation at this time");
      return;
    }
    
    // Commit all the updates
    await batch.commit();
    logger.info(`Escalated ${escalatedTickets.length} urgent tickets`);
    
    // Notify admins and landlords about escalated tickets
    await notifyAboutEscalatedTickets(escalatedTickets);
    
    return { escalatedCount: escalatedTickets.length };
  } catch (error) {
    logger.error("Error in escalation function:", error);
    throw error;
  }
});

/**
 * Notifies admins and landlords about escalated tickets
 */
async function notifyAboutEscalatedTickets(escalatedTickets) {
  try {
    // Get unique property IDs to find landlords
    const propertyIds = [...new Set(escalatedTickets.map(ticket => ticket.propertyId))];
    
    // Get properties to find landlords
    const propertySnapshots = await Promise.all(
      propertyIds.map(propertyId => 
        admin.firestore().collection("properties").doc(propertyId).get()
      )
    );
    
    // Map of property ID to landlord ID
    const propertyToLandlord = {};
    propertySnapshots.forEach(snapshot => {
      if (snapshot.exists) {
        const data = snapshot.data();
        propertyToLandlord[snapshot.id] = data.owner;
      }
    });
    
    // Get all admin users for global notifications
    const adminsSnapshot = await admin.firestore()
      .collection("users")
      .where("role", "==", "admin")
      .get();
    
    const adminIds = [];
    adminsSnapshot.forEach(doc => {
      adminIds.push(doc.id);
    });
    
    // Prepare batch for notifications
    const batch = admin.firestore().batch();
    
    // Notify each landlord about their escalated tickets
    for (const propertyId of propertyIds) {
      const landlordId = propertyToLandlord[propertyId];
      if (!landlordId) continue;
      
      // Get tickets for this property
      const propertyTickets = escalatedTickets.filter(t => t.propertyId === propertyId);
      
      // Skip if no tickets for this property
      if (propertyTickets.length === 0) continue;
      
      // Create notification for landlord
      const landlordNotificationRef = admin.firestore().collection("notifications").doc();
      batch.set(landlordNotificationRef, {
        userId: landlordId,
        userRole: "landlord",
        type: "ticket_escalation",
        title: "Urgent Ticket Escalation",
        message: `${propertyTickets.length} urgent maintenance ${
          propertyTickets.length === 1 ? "request has" : "requests have"
        } been escalated due to SLA violations.`,
        data: {
          tickets: propertyTickets,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        },
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    // Notify all admins about all escalated tickets
    for (const adminId of adminIds) {
      const adminNotificationRef = admin.firestore().collection("notifications").doc();
      batch.set(adminNotificationRef, {
        userId: adminId,
        userRole: "admin",
        type: "ticket_escalation",
        title: "System Alert: Escalated Tickets",
        message: `${escalatedTickets.length} maintenance ${
          escalatedTickets.length === 1 ? "ticket has" : "tickets have"
        } been escalated due to SLA violations.`,
        data: {
          tickets: escalatedTickets,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        },
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    // Commit all notifications
    await batch.commit();
    logger.info(`Sent escalation notifications to ${
      Object.keys(propertyToLandlord).length
    } landlords and ${adminIds.length} admins`);
    
  } catch (error) {
    logger.error("Error sending escalation notifications:", error);
  }
}

/**
 * Function to manually escalate a ticket
 * Used by admins or landlords to flag tickets for immediate attention
 */
exports.manuallyEscalateTicket = async (ticketId, userId, reason) => {
  try {
    logger.info(`Manual escalation requested for ticket ${ticketId} by user ${userId}`);
    
    // Get the ticket
    const ticketRef = admin.firestore().collection("tickets").doc(ticketId);
    const ticketSnapshot = await ticketRef.get();
    
    if (!ticketSnapshot.exists) {
      throw new Error(`Ticket ${ticketId} not found`);
    }
    
    const ticket = ticketSnapshot.data();
    
    // Update the ticket
    await ticketRef.update({
      escalated: true,
      "meta.manuallyEscalatedAt": admin.firestore.FieldValue.serverTimestamp(),
      "meta.manuallyEscalatedBy": userId,
      "meta.escalationReason": reason || "Manually escalated by user"
    });
    
    // Add to escalation log
    const escalationLogRef = ticketRef.collection("meta").doc("escalationLog");
    await escalationLogRef.set({
      escalations: admin.firestore.FieldValue.arrayUnion({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        reason: reason || "Manually escalated by user",
        userId: userId,
        status: ticket.status,
        manual: true
      })
    }, { merge: true });
    
    // Notify appropriate users about the escalation
    // (Implementation similar to notifyAboutEscalatedTickets)
    
    logger.info(`Ticket ${ticketId} manually escalated by ${userId}`);
    return { success: true };
    
  } catch (error) {
    logger.error(`Error manually escalating ticket ${ticketId}:`, error);
    throw error;
  }
}; 