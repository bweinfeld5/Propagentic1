/**
 * Firebase Cloud Functions for multi-channel notification delivery
 * Handles sending notifications via different channels (in-app, email, SMS)
 * with delivery tracking
 */

const {https} = require("firebase-functions/v2");
const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const {onInit} = require("firebase-functions/v2/core");
const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");
const twilio = require("twilio");

// Initialize admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// Global DB references for reuse
const db = admin.firestore();
const usersCollection = db.collection("users");
const notificationsCollection = db.collection("notifications");
const deliveryCollection = db.collection("notification_delivery");

// Lazy-loaded SMS client
let _twilioClient;
function getTwilioClient() {
  if (!_twilioClient && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    _twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return _twilioClient;
}

// Pre-warm connections during initialization, not deployment
onInit(async () => {
  // Pre-warm connections
  try {
    const twilioClient = getTwilioClient();
    if (twilioClient) {
      logger.info("Twilio client initialized");
    }
    
    // Verify Firestore connection
    await db.collection("system").doc("status").set({
      lastStartup: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    logger.info("All services initialized successfully");
  } catch (error) {
    logger.error("Error during initialization:", error);
  }
});

/**
 * Trigger function that runs whenever a new notification is created
 * Handles delivery through multiple channels based on user preferences
 */
exports.deliverMultiChannelNotification = onDocumentCreated({
  document: "notifications/{notificationId}",
  region: "us-central1",
  minInstances: 1, // Keep one instance warm for better notification delivery performance
  maxInstances: 10,
}, async (event) => {
  try {
    const notificationId = event.params.notificationId;
    const notificationData = event.data.data();
    logger.info(`Processing notification delivery for ${notificationId}`);
    
    // Skip if this is a delivery log
    if (notificationData.isDeliveryLog) {
      return;
    }
    
    // Create delivery tracking document
    const deliveryRef = deliveryCollection.doc(notificationId);
    
    await deliveryRef.set({
      notificationId,
      userId: notificationData.userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      channels: {
        inApp: { status: "delivered", timestamp: admin.firestore.FieldValue.serverTimestamp() }
      },
      isDeliveryLog: true
    });
    
    // Get user data to check notification preferences
    const userRef = usersCollection.doc(notificationData.userId);
    const userSnapshot = await userRef.get();
    
    if (!userSnapshot.exists) {
      logger.error(`User ${notificationData.userId} not found for notification ${notificationId}`);
      await deliveryRef.update({
        error: "User not found",
        status: "failed"
      });
      return;
    }
    
    const userData = userSnapshot.data();
    const notificationPrefs = userData.notificationPreferences || {};
    
    // Track delivery promises to wait for all channels
    const deliveryPromises = [];
    
    // Check if email notifications are enabled for this user
    if (notificationPrefs.email && userData.email) {
      deliveryPromises.push(
        sendEmailNotification(
          notificationData, 
          userData, 
          deliveryRef
        )
      );
    }
    
    // Check if SMS notifications are enabled for this user
    if (notificationPrefs.sms && userData.phoneNumber && process.env.TWILIO_ACCOUNT_SID) {
      deliveryPromises.push(
        sendSmsNotification(
          notificationData, 
          userData, 
          deliveryRef
        )
      );
    }
    
    // Check if push notifications are enabled
    if (notificationPrefs.push) {
      deliveryPromises.push(
        sendPushNotification(
          notificationData, 
          userData, 
          deliveryRef
        )
      );
    }
    
    // Wait for all delivery attempts to complete
    if (deliveryPromises.length > 0) {
      await Promise.allSettled(deliveryPromises);
    }
    
    // Update final delivery status
    await deliveryRef.update({
      completed: true,
      completedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    logger.info(`Notification ${notificationId} delivery processing completed`);
    return { success: true };
  } catch (error) {
    logger.error(`Error delivering notification:`, error);
    throw new https.HttpsError("internal", "Failed to deliver notification: " + error.message);
  }
});

/**
 * Sends an email notification
 */
async function sendEmailNotification(notification, user, deliveryRef) {
  try {
    // Update delivery status to pending
    await deliveryRef.update({
      "channels.email": { 
        status: "pending", 
        timestamp: admin.firestore.FieldValue.serverTimestamp() 
      }
    });
    
    // Use Firebase Extension to send email
    const emailData = {
      to: user.email,
      message: {
        subject: notification.title,
        text: notification.message,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>${notification.title}</h2>
            <p>${notification.message}</p>
            ${notification.data && notification.data.ticketId ? 
              `<p><a href="${process.env.APP_URL}/tickets/${notification.data.ticketId}" 
                style="background-color: #4CAF50; color: white; padding: 10px 15px; 
                text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 10px;">
                View Details
              </a></p>` : ''
            }
            <hr>
            <p style="color: #777; font-size: 12px;">
              This is an automated message from Propagentic Property Management.
              You can manage your notification preferences in your account settings.
            </p>
          </div>
        `
      },
      // Add metadata for tracking
      metadata: {
        notificationId: notification.id,
        userId: user.uid || user.id,
        type: 'notification_delivery'
      }
    };
    
    // Add email to the mail collection for Firebase Extension to process
    await db.collection('mail').add(emailData);
    
    // Update delivery status to successful (queued)
    await deliveryRef.update({
      "channels.email": { 
        status: "delivered", 
        timestamp: admin.firestore.FieldValue.serverTimestamp() 
      }
    });
    
    logger.info(`Email notification queued for ${user.email} for notification ${notification.id}`);
    return true;
  } catch (error) {
    logger.error(`Error sending email notification:`, error);
    
    // Update delivery status to failed
    await deliveryRef.update({
      "channels.email": { 
        status: "failed", 
        error: error.message,
        timestamp: admin.firestore.FieldValue.serverTimestamp() 
      }
    });
    
    return false;
  }
}

/**
 * Sends an SMS notification
 */
async function sendSmsNotification(notification, user, deliveryRef) {
  try {
    const twilioClient = getTwilioClient();
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
    
    // Skip if Twilio is not configured
    if (!twilioClient || !twilioPhoneNumber) {
      await deliveryRef.update({
        "channels.sms": { 
          status: "skipped", 
          reason: "Twilio not configured",
          timestamp: admin.firestore.FieldValue.serverTimestamp() 
        }
      });
      return false;
    }
    
    // Update delivery status to pending
    await deliveryRef.update({
      "channels.sms": { 
        status: "pending", 
        timestamp: admin.firestore.FieldValue.serverTimestamp() 
      }
    });
    
    // Prepare SMS content - keep it short
    let smsContent = `${notification.title}: ${notification.message}`;
    // SMS content should not exceed 160 characters
    if (smsContent.length > 157) {
      smsContent = smsContent.substring(0, 154) + "...";
    }
    
    // Send the SMS
    const result = await twilioClient.messages.create({
      body: smsContent,
      from: twilioPhoneNumber,
      to: user.phoneNumber
    });
    
    // Update delivery status based on Twilio response
    await deliveryRef.update({
      "channels.sms": { 
        status: "delivered", 
        twilioSid: result.sid,
        timestamp: admin.firestore.FieldValue.serverTimestamp() 
      }
    });
    
    logger.info(`SMS notification sent to ${user.phoneNumber} for notification ${notification.id}`);
    return true;
  } catch (error) {
    logger.error(`Error sending SMS notification:`, error);
    
    // Update delivery status to failed
    await deliveryRef.update({
      "channels.sms": { 
        status: "failed", 
        error: error.message,
        timestamp: admin.firestore.FieldValue.serverTimestamp() 
      }
    });
    
    return false;
  }
}

/**
 * Sends a push notification using Firebase Cloud Messaging
 */
async function sendPushNotification(notification, user, deliveryRef) {
  try {
    // Skip if user has no FCM tokens
    if (!user.fcmTokens || Object.keys(user.fcmTokens || {}).length === 0) {
      await deliveryRef.update({
        "channels.push": { 
          status: "skipped", 
          reason: "No FCM tokens",
          timestamp: admin.firestore.FieldValue.serverTimestamp() 
        }
      });
      return false;
    }
    
    // Update delivery status to pending
    await deliveryRef.update({
      "channels.push": { 
        status: "pending", 
        timestamp: admin.firestore.FieldValue.serverTimestamp() 
      }
    });
    
    // Prepare notification message
    const message = {
      notification: {
        title: notification.title,
        body: notification.message
      },
      data: {
        notificationId: notification.id || "",
        type: notification.type || "",
        // Convert any objects to strings for FCM
        ...Object.entries(notification.data || {}).reduce((acc, [key, value]) => {
          acc[key] = typeof value === 'object' ? JSON.stringify(value) : String(value);
          return acc;
        }, {})
      },
      tokens: Object.keys(user.fcmTokens || {})
    };
    
    // Send the push notification
    const response = await admin.messaging().sendMulticast(message);
    
    // Update delivery status based on response
    await deliveryRef.update({
      "channels.push": { 
        status: response.successCount > 0 ? "delivered" : "failed",
        successCount: response.successCount,
        failureCount: response.failureCount,
        timestamp: admin.firestore.FieldValue.serverTimestamp() 
      }
    });
    
    if (response.failureCount > 0) {
      // Clean up invalid tokens
      const invalidTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const token = Object.keys(user.fcmTokens || {})[idx];
          invalidTokens.push(token);
        }
      });
      
      if (invalidTokens.length > 0) {
        logger.info(`Removing ${invalidTokens.length} invalid FCM tokens for user ${user.uid}`);
        
        // Remove invalid tokens from user document
        const userRef = usersCollection.doc(user.uid);
        const tokenUpdates = {};
        invalidTokens.forEach(token => {
          tokenUpdates[`fcmTokens.${token}`] = admin.firestore.FieldValue.delete();
        });
        
        await userRef.update(tokenUpdates);
      }
    }
    
    logger.info(`Push notification sent to user ${user.uid} with ${response.successCount} successful deliveries`);
    return response.successCount > 0;
  } catch (error) {
    logger.error(`Error sending push notification:`, error);
    
    // Update delivery status to failed
    await deliveryRef.update({
      "channels.push": { 
        status: "failed", 
        error: error.message,
        timestamp: admin.firestore.FieldValue.serverTimestamp() 
      }
    });
    
    return false;
  }
}

/**
 * Function to register an FCM token for a user (for push notifications)
 * Optimized with idempotent implementation
 */
exports.registerFcmToken = https.onCall({
  region: "us-central1",
  minInstances: 0,
  maxInstances: 10,
}, async (data, context) => {
  try {
    // Verify authentication
    if (!context.auth) {
      throw new https.HttpsError(
        "unauthenticated",
        "You must be logged in to register an FCM token"
      );
    }
    
    const userId = context.auth.uid;
    const { token } = data;
    
    if (!token) {
      throw new https.HttpsError(
        "invalid-argument",
        "The function must be called with a valid FCM token"
      );
    }
    
    // Add token to user document with idempotent operation
    const userRef = usersCollection.doc(userId);
    await userRef.set({
      [`fcmTokens.${token}`]: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    logger.info(`Registered FCM token for user ${userId}`);
    
    return { success: true };
  } catch (error) {
    logger.error("Error registering FCM token:", error);
    throw new https.HttpsError("internal", error.message);
  }
});

/**
 * Function to test notification delivery to a user across all channels
 */
exports.testNotificationDelivery = https.onCall({
  region: "us-central1",
  maxInstances: 5,
}, async (data, context) => {
  try {
    // Only allow admins to test
    if (!context.auth) {
      throw new https.HttpsError(
        "unauthenticated",
        "You must be logged in to test notification delivery"
      );
    }
    
    // Check if user is an admin
    const adminId = context.auth.uid;
    const adminRef = usersCollection.doc(adminId);
    const adminSnapshot = await adminRef.get();
    
    if (!adminSnapshot.exists || adminSnapshot.data().role !== "admin") {
      throw new https.HttpsError(
        "permission-denied",
        "Only administrators can test notification delivery"
      );
    }
    
    const { userId } = data;
    if (!userId) {
      throw new https.HttpsError(
        "invalid-argument",
        "The function must be called with a valid userId"
      );
    }
    
    // Create a test notification
    const notificationRef = await notificationsCollection.add({
      userId: userId,
      userRole: data.userRole || "tenant",
      type: "test",
      title: "Test Notification",
      message: "This is a test notification to verify delivery across all channels.",
      data: {
        testId: Date.now().toString(),
        initiatedBy: adminId
      },
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    logger.info(`Created test notification ${notificationRef.id} for user ${userId}`);
    
    return { 
      success: true, 
      notificationId: notificationRef.id 
    };
  } catch (error) {
    logger.error("Error testing notification delivery:", error);
    throw new https.HttpsError("internal", error.message);
  }
}); 