/**
 * Firebase Cloud Functions for generating real-time notifications
 * These functions trigger notifications for various events in the system
 */

const {onDocumentCreated, onDocumentUpdated} = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");

/**
 * Notification for when a maintenance ticket is classified by AI
 */
exports.notifyTicketClassified = onDocumentUpdated({
  document: "tickets/{ticketId}",
  region: "us-central1",
}, async (event) => {
  try {
    const beforeData = event.data.before.data();
    const afterData = event.data.after.data();
    
    // Check if the ticket was just classified
    if (beforeData.status === "pending_classification" && 
        afterData.status === "ready_to_dispatch" &&
        afterData.category && 
        afterData.urgency) {
      
      logger.info(`Ticket ${event.params.ticketId} classified, sending notifications`);
      
      // Get the ticket information for notification
      const ticketId = event.params.ticketId;
      const propertyId = afterData.propertyId;
      const submittedBy = afterData.submittedBy;
      const category = afterData.category;
      const urgency = afterData.urgency;
      
      // Get property information
      const propertySnapshot = await admin.firestore()
        .collection('properties')
        .doc(propertyId)
        .get();
      
      if (!propertySnapshot.exists) {
        logger.error(`Property ${propertyId} not found`);
        return;
      }
      
      const propertyData = propertySnapshot.data();
      const landlordId = propertyData.landlordId;
      
      // Prepare notification data
      const notificationData = {
        ticketId: ticketId,
        propertyId: propertyId,
        category: category,
        urgency: urgency,
        classifiedAt: admin.firestore.FieldValue.serverTimestamp(),
        message: `Maintenance request has been classified as ${category} with urgency level ${urgency}/5.`
      };
      
      // Notify tenant who submitted the request
      if (submittedBy) {
        await admin.firestore()
          .collection('notifications')
          .add({
            userId: submittedBy,
            userRole: 'tenant',
            type: 'classified',
            data: notificationData,
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
      }
      
      // Notify landlord
      if (landlordId) {
        await admin.firestore()
          .collection('notifications')
          .add({
            userId: landlordId,
            userRole: 'landlord',
            type: 'classified',
            data: notificationData,
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
        
        // For high urgency tickets (4-5), create an urgent notification
        if (typeof urgency === 'number' && urgency >= 4) {
          await admin.firestore()
            .collection('notifications')
            .add({
              userId: landlordId,
              userRole: 'landlord',
              type: 'high_urgency',
              data: {
                ...notificationData,
                message: `URGENT: A high priority ${category} issue (${urgency}/5) requires your attention.`
              },
              read: false,
              createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }
      }
      
      logger.info(`Sent classification notifications for ticket ${ticketId}`);
    }
  } catch (error) {
    logger.error("Error creating classification notifications:", error);
  }
});

/**
 * Notification for when contractors are matched to a ticket
 */
exports.notifyContractorsMatched = onDocumentUpdated({
  document: "tickets/{ticketId}",
  region: "us-central1",
}, async (event) => {
  try {
    const beforeData = event.data.before.data();
    const afterData = event.data.after.data();
    
    // Check if contractors were just matched to the ticket
    if (beforeData.status === "ready_to_dispatch" && 
        afterData.status === "ready_to_assign" &&
        afterData.recommendedContractors &&
        afterData.recommendedContractors.length > 0) {
      
      logger.info(`Contractors matched for ticket ${event.params.ticketId}, sending notification`);
      
      // Get property information
      const propertySnapshot = await admin.firestore()
        .collection('properties')
        .doc(afterData.propertyId)
        .get();
      
      if (!propertySnapshot.exists) {
        logger.error(`Property ${afterData.propertyId} not found`);
        return;
      }
      
      const propertyData = propertySnapshot.data();
      const landlordId = propertyData.landlordId;
      
      // Get contractor count
      const contractorCount = afterData.recommendedContractors.length;
      
      // Prepare notification data
      const notificationData = {
        ticketId: event.params.ticketId,
        propertyId: afterData.propertyId,
        contractorCount: contractorCount,
        category: afterData.category,
        urgency: afterData.urgency,
        matchedAt: admin.firestore.FieldValue.serverTimestamp(),
        message: `${contractorCount} contractors have been matched to your ${afterData.category} maintenance request.`
      };
      
      // Notify landlord
      if (landlordId) {
        await admin.firestore()
          .collection('notifications')
          .add({
            userId: landlordId,
            userRole: 'landlord',
            type: 'contractors_matched',
            data: notificationData,
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
      }
      
      logger.info(`Sent contractor matching notification to landlord ${landlordId}`);
    }
  } catch (error) {
    logger.error("Error creating contractor matching notification:", error);
  }
});

/**
 * Notification for ticket status changes
 */
exports.notifyTicketStatusChange = onDocumentUpdated({
  document: "tickets/{ticketId}",
  region: "us-central1",
}, async (event) => {
  try {
    const beforeData = event.data.before.data();
    const afterData = event.data.after.data();
    
    // Check if the status changed 
    if (beforeData.status !== afterData.status) {
      // Skip for status changes that have dedicated notifications
      const ignoredTransitions = [
        "pending_classification:ready_to_dispatch", // Handled by notifyTicketClassified
        "ready_to_dispatch:ready_to_assign",      // Handled by notifyContractorsMatched
        "ready_to_assign:assigned"                // Handled by notifyAssignedContractor
      ];
      
      const transitionKey = `${beforeData.status}:${afterData.status}`;
      if (ignoredTransitions.includes(transitionKey)) {
        return;
      }
      
      logger.info(`Status change for ticket ${event.params.ticketId} from ${beforeData.status} to ${afterData.status}`);
      
      // Format the status for display
      const formatStatus = (status) => {
        return status
          .replace(/_/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      };
      
      const newStatusFormatted = formatStatus(afterData.status);
      
      // Prepare notification data
      const notificationData = {
        ticketId: event.params.ticketId,
        propertyId: afterData.propertyId,
        oldStatus: beforeData.status,
        newStatus: afterData.status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        message: `Your maintenance request status has changed to: ${newStatusFormatted}`
      };
      
      // Get tenant and landlord IDs
      const propertySnapshot = await admin.firestore()
        .collection('properties')
        .doc(afterData.propertyId)
        .get();
      
      if (!propertySnapshot.exists) {
        logger.error(`Property ${afterData.propertyId} not found`);
        return;
      }
      
      const propertyData = propertySnapshot.data();
      const landlordId = propertyData.landlordId;
      const tenantId = afterData.submittedBy;
      
      // Notify tenant
      if (tenantId) {
        await admin.firestore()
          .collection('notifications')
          .add({
            userId: tenantId,
            userRole: 'tenant',
            type: 'status_change',
            data: notificationData,
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
      }
      
      // Notify landlord
      if (landlordId) {
        await admin.firestore()
          .collection('notifications')
          .add({
            userId: landlordId,
            userRole: 'landlord',
            type: 'status_change',
            data: notificationData,
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
      }
      
      // If a contractor is assigned, notify them about status changes too
      if (afterData.assignedTo && afterData.status !== 'assigned') {
        await admin.firestore()
          .collection('notifications')
          .add({
            userId: afterData.assignedTo,
            userRole: 'contractor',
            type: 'status_change',
            data: notificationData,
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
      }
      
      logger.info(`Sent status change notifications for ticket ${event.params.ticketId}`);
    }
  } catch (error) {
    logger.error("Error creating status change notifications:", error);
  }
});

/**
 * Notification for when a maintenance request is completed
 */
exports.notifyRequestCompleted = onDocumentUpdated({
  document: "tickets/{ticketId}",
  region: "us-central1",
}, async (event) => {
  try {
    const beforeData = event.data.before.data();
    const afterData = event.data.after.data();
    
    // Check if the ticket was just completed
    if (beforeData.status !== "completed" && afterData.status === "completed") {
      logger.info(`Ticket ${event.params.ticketId} completed, sending notifications`);
      
      // Get property information
      const propertySnapshot = await admin.firestore()
        .collection('properties')
        .doc(afterData.propertyId)
        .get();
      
      if (!propertySnapshot.exists) {
        logger.error(`Property ${afterData.propertyId} not found`);
        return;
      }
      
      const propertyData = propertySnapshot.data();
      
      // Prepare notification data
      const notificationData = {
        ticketId: event.params.ticketId,
        propertyId: afterData.propertyId,
        propertyName: propertyData.propertyName || "your property",
        category: afterData.category,
        unitNumber: afterData.unitNumber,
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        message: `Your ${afterData.category} maintenance request for Unit ${afterData.unitNumber} has been completed.`
      };
      
      // Notify tenant
      if (afterData.submittedBy) {
        await admin.firestore()
          .collection('notifications')
          .add({
            userId: afterData.submittedBy,
            userRole: 'tenant',
            type: 'request_completed',
            data: notificationData,
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
      }
      
      // Notify landlord
      if (propertyData.landlordId) {
        await admin.firestore()
          .collection('notifications')
          .add({
            userId: propertyData.landlordId,
            userRole: 'landlord',
            type: 'request_completed',
            data: notificationData,
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
      }
      
      logger.info(`Sent completion notifications for ticket ${event.params.ticketId}`);
    }
  } catch (error) {
    logger.error("Error creating completion notifications:", error);
  }
});

/**
 * Notification for when a new maintenance request is created
 */
exports.notifyNewMaintenanceRequest = onDocumentCreated({
  document: "tickets/{ticketId}",
  region: "us-central1",
}, async (event) => {
  try {
    const ticketData = event.data.data();
    
    // Verify this is a new ticket
    if (!ticketData || ticketData.notified === true) {
      return;
    }
    
    logger.info(`New maintenance request ${event.params.ticketId} created, sending notification`);
    
    // Get property information
    const propertySnapshot = await admin.firestore()
      .collection('properties')
      .doc(ticketData.propertyId)
      .get();
    
    if (!propertySnapshot.exists) {
      logger.error(`Property ${ticketData.propertyId} not found`);
      return;
    }
    
    const propertyData = propertySnapshot.data();
    const landlordId = propertyData.landlordId;
    
    // Get tenant information
    let tenantName = "A tenant";
    if (ticketData.submittedBy) {
      const tenantSnapshot = await admin.firestore()
        .collection('users')
        .doc(ticketData.submittedBy)
        .get();
      
      if (tenantSnapshot.exists) {
        const tenantData = tenantSnapshot.data();
        tenantName = tenantData.firstName || tenantData.email || "A tenant";
      }
    }
    
    // Prepare notification data
    const notificationData = {
      ticketId: event.params.ticketId,
      propertyId: ticketData.propertyId,
      propertyName: propertyData.propertyName || "your property",
      tenantName: tenantName,
      unitNumber: ticketData.unitNumber,
      issueTitle: ticketData.issueTitle || "Maintenance issue",
      description: ticketData.description,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      message: `${tenantName} submitted a new maintenance request for Unit ${ticketData.unitNumber}: ${ticketData.issueTitle || ticketData.description.substring(0, 50) + '...'}`
    };
    
    // Notify landlord
    if (landlordId) {
      await admin.firestore()
        .collection('notifications')
        .add({
          userId: landlordId,
          userRole: 'landlord',
          type: 'new_request',
          data: notificationData,
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
    }
    
    // Mark the ticket as notified
    await event.data.ref.update({
      notified: true
    });
    
    logger.info(`Sent new request notification to landlord ${landlordId}`);
  } catch (error) {
    logger.error("Error creating new request notification:", error);
  }
}); 