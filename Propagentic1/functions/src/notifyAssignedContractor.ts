/**
 * Firebase Cloud Function to send notifications when a contractor is assigned to a ticket
 * This function sends emails and optional push notifications to the assigned contractor
 */

// Import Firebase Functions v2
import { onDocumentUpdated, Change, FirestoreEvent, QueryDocumentSnapshot } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import { getMessaging } from "firebase-admin/messaging"; // Import specific messaging function
import * as logger from "firebase-functions/logger";

// Define interfaces for data shapes
interface TicketData {
  assignedTo?: string;
  status?: string;
  propertyId?: string;
  unitNumber?: string;
  category?: string;
  urgency?: number;
  description?: string;
}

interface UserData {
  email?: string;
  name?: string;
  displayName?: string; // Add other potential name fields
  firstName?: string;
}

interface PropertyData {
  propertyName?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
}

interface FcmTokenData {
    token: string;
    // other fields if needed
}

/**
 * Cloud Function that triggers when a maintenance ticket is updated with an assigned contractor
 */
export const notifyAssignedContractor = onDocumentUpdated({
  document: "tickets/{ticketId}",
  region: "us-central1",
}, async (event: FirestoreEvent<Change<QueryDocumentSnapshot> | undefined, { ticketId: string }>) => {
  try {
    if (!event.data) {
        logger.info("Event data missing, skipping.");
        return;
    }
    const beforeData = event.data.before.data() as TicketData | undefined;
    const afterData = event.data.after.data() as TicketData | undefined;
    
    // Check if a contractor was just assigned or data is missing
    if (!afterData || !beforeData || !afterData.assignedTo ||
        (beforeData.assignedTo === afterData.assignedTo && 
         beforeData.status === afterData.status)) {
      // No new assignment happened or data missing
      return;
    }

    // Verify the status is 'assigned'
    if (afterData.status !== "assigned") {
      logger.info(
        `Ticket ${event.params.ticketId} assigned but status is not 'assigned'. ` +
        `Current status: ${afterData.status}`
      );
      return;
    }
    
    logger.info(`Contractor ${afterData.assignedTo} assigned to ticket ${event.params.ticketId}`);
    
    // Get the contractor user data
    const contractorSnapshot = await admin.firestore()
      .collection('users')
      .doc(afterData.assignedTo)
      .get();
    
    if (!contractorSnapshot.exists) {
      throw new Error(`Contractor user ${afterData.assignedTo} not found`);
    }
    
    const contractorData = contractorSnapshot.data() as UserData | undefined;
    if (!contractorData) {
        throw new Error(`Contractor user data missing for ${afterData.assignedTo}`);
    }
    
    // Get property details
    if (!afterData.propertyId) { // Check if propertyId exists
        throw new Error(`Property ID missing on ticket ${event.params.ticketId}`);
    }
    const propertySnapshot = await admin.firestore()
      .collection('properties')
      .doc(afterData.propertyId)
      .get();
    
    if (!propertySnapshot.exists) {
      throw new Error(`Property ${afterData.propertyId} not found`);
    }
    
    const propertyData = propertySnapshot.data() as PropertyData | undefined;
    if (!propertyData) {
        throw new Error(`Property data missing for ${afterData.propertyId}`);
    }
    
    // Prepare notification data
    const notificationDetails = {
      ticketId: event.params.ticketId,
      propertyName: propertyData.propertyName ?? 'Unknown Property',
      propertyAddress: propertyData.address ? `${propertyData.address.street}, ${propertyData.address.city}, ${propertyData.address.state} ${propertyData.address.zip}` : 'Address unavailable',
      unitNumber: afterData.unitNumber ?? 'N/A',
      category: afterData.category ?? 'Uncategorized',
      urgency: afterData.urgency ?? 'N/A',
      description: afterData.description ?? 'No description',
      assignedAt: new Date().toISOString(),
      propertyId: afterData.propertyId // Include propertyId for potential deep linking
    };
    
    // Add to contractor's notifications subcollection (assuming notifications are per-user)
    await admin.firestore()
      .collection('users').doc(afterData.assignedTo).collection('notifications')
      .add({
        // userId: afterData.assignedTo, // Redundant if it's a subcollection of the user
        // userRole: 'contractor', // Might not be needed if collection is specific
        type: 'assignment',
        data: notificationDetails,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    
    // Check if we should send an email notification
    if (contractorData.email) {
      await sendEmailNotification(
        contractorData.email,
        contractorData.name ?? contractorData.displayName ?? contractorData.firstName ?? 'Contractor', // Use available name fields
        notificationDetails
      );
    }
    
    // Check if we need to send a push notification
    await sendPushNotification(afterData.assignedTo, notificationDetails);
    
    logger.info(`Successfully notified contractor ${afterData.assignedTo} about assignment`);
    
  } catch (error: any) {
    logger.error("Error notifying assigned contractor:", error?.message || error);
  }
});

/**
 * Send an email notification to the assigned contractor
 */
async function sendEmailNotification(email: string, name: string, data: Record<string, any>): Promise<void> {
  try {
    logger.info(`Attempting to send email to ${email} for ${name} about ticket ${data.ticketId}`);
    
    // Using Firebase Extensions for email
    await admin.firestore().collection('mail').add({
      to: email,
      message: {
        subject: `New Maintenance Assignment: ${data.category} at ${data.propertyName}`,
        text: `Hello ${name},\n\nYou have been assigned a new maintenance request:\n\n` +
              `Property: ${data.propertyName}\n` +
              `Address: ${data.propertyAddress}\n` +
              `Unit: ${data.unitNumber}\n` +
              `Category: ${data.category}\n` +
              `Urgency: ${data.urgency}\n\n` +
              `Description: ${data.description}\n\n` +
              `Please log in to the Propagentic app to view details and respond.\n\n` +
              `Thank you,\nThe Propagentic Team`,
        // Optional: Add HTML content
        // html: `<strong>Hello ${name},</strong><br>You have been assigned...`,
      }
    });
    logger.info(`Email queued successfully for ${email}`);

  } catch (error: any) {
    logger.error(`Error sending email notification to ${email}:`, error?.message || error);
    // Don't rethrow, just log the error for email sending
  }
}

/**
 * Send a push notification to the assigned contractor
 */
async function sendPushNotification(contractorId: string, data: Record<string, any>): Promise<void> {
  try {
    // Check if the user has registered FCM tokens
    const tokensSnapshot = await admin.firestore()
      .collection('fcmTokens') // Assuming a top-level collection for tokens
      .where('userId', '==', contractorId)
      .get();
    
    if (tokensSnapshot.empty) {
      logger.info(`No FCM tokens found for contractor ${contractorId}`);
      return;
    }
    
    // Get all valid tokens for the user
    const tokens: string[] = [];
    tokensSnapshot.forEach(doc => {
      const tokenData = doc.data() as FcmTokenData | undefined;
      if (tokenData?.token) { // Check if token exists
          tokens.push(tokenData.token);
      }
    });
    
    if (tokens.length === 0) {
        logger.info(`No valid tokens extracted for contractor ${contractorId}`);
      return;
    }
    
    // Craft notification message payload for sendMulticast
    const messagePayload: admin.messaging.MulticastMessage = {
      notification: {
        title: `New Assignment: ${data.category}`,
        body: `You've been assigned to a ${data.urgency} ${data.category} task at ${data.propertyName}`,
      },
      data: { // Data payload for handling in the app
        ticketId: data.ticketId,
        type: 'new_assignment',
        propertyId: data.propertyId,
        createdAt: data.assignedAt,
      },
      tokens: tokens,
    };
    
    logger.info(`Attempting to send push notifications to ${tokens.length} devices for contractor ${contractorId}`);
    // Use getMessaging() from firebase-admin/messaging
    const response = await getMessaging().sendEachForMulticast(messagePayload);
    logger.info(`Push notification response: ${response.successCount} successful, ${response.failureCount} failed.`);
    
    // Clean up invalid tokens
    if (response.failureCount > 0) {
      const tokensToDelete: Promise<any>[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const error = resp.error;
          logger.warn(`Failed to send notification to token: ${tokens[idx]}`, error?.message);
          // Check for specific error codes indicating an invalid or unregistered token
          if (error && (error.code === 'messaging/invalid-registration-token' ||
                       error.code === 'messaging/registration-token-not-registered' ||
                       error.code === 'messaging/invalid-argument')) { // Add other relevant codes
            // Find the document reference for the invalid token and schedule deletion
            const invalidTokenDoc = tokensSnapshot.docs[idx]; // Assuming order is preserved
            if (invalidTokenDoc) {
                tokensToDelete.push(invalidTokenDoc.ref.delete());
                logger.info(`Scheduled deletion for invalid token: ${tokens[idx]}`);
            }
          }
        }
      });
      await Promise.all(tokensToDelete); // Wait for deletions to complete
      logger.info(`Cleaned up ${tokensToDelete.length} invalid tokens.`);
    }
    
  } catch (error: any) {
    logger.error(`Error sending push notification to contractor ${contractorId}:`, error?.message || error);
    // Don't rethrow, just log the error
  }
}

// // Function to delete invalid token - simplified as it's now part of sendPushNotification cleanup
// async function deleteInvalidToken(token: string) { ... }

// Add this empty export to treat the file as a module
export {}; 