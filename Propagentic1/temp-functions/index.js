/**
 * Simplified Firebase Functions for Testing
 * This file contains streamlined functions that won't time out during initialization
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase without custom configuration for testing
admin.initializeApp();

// Simplified notification function for testing
exports.createTestNotification = functions.https.onCall(async (data, context) => {
  try {
    // Basic validation
    if (!data.userId || !data.type) {
      throw new Error('Missing required fields: userId and type');
    }

    // Create a simple notification
    const notificationData = {
      userId: data.userId,
      userRole: data.userRole || 'tenant',
      type: data.type,
      title: data.title || 'Test Notification',
      message: data.message || 'This is a test notification',
      data: data.data || {},
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Add to notifications collection
    const result = await admin.firestore()
      .collection('notifications')
      .add(notificationData);

    return { success: true, notificationId: result.id };
  } catch (error) {
    console.error('Error creating test notification:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Simple function to mark a notification as read
exports.markNotificationRead = functions.https.onCall(async (data, context) => {
  try {
    // Validate input
    if (!data.notificationId) {
      throw new Error('Missing required field: notificationId');
    }

    // Update the notification
    await admin.firestore()
      .collection('notifications')
      .doc(data.notificationId)
      .update({
        read: true,
        readAt: admin.firestore.FieldValue.serverTimestamp()
      });

    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Simple function to get notifications for a user
exports.getUserNotifications = functions.https.onCall(async (data, context) => {
  try {
    // Validate input
    if (!data.userId) {
      throw new Error('Missing required field: userId');
    }

    // Query for notifications
    const snapshot = await admin.firestore()
      .collection('notifications')
      .where('userId', '==', data.userId)
      .orderBy('createdAt', 'desc')
      .limit(data.limit || 20)
      .get();

    // Format the results
    const notifications = [];
    snapshot.forEach(doc => {
      notifications.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return { notifications };
  } catch (error) {
    console.error('Error getting user notifications:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Helper function to create a test maintenance request
exports.createTestMaintenanceRequest = functions.https.onCall(async (data, context) => {
  try {
    // Basic validation
    if (!data.propertyId || !data.submittedBy) {
      throw new Error('Missing required fields: propertyId and submittedBy');
    }

    // Create a maintenance request
    const requestData = {
      propertyId: data.propertyId,
      unitNumber: data.unitNumber || '101',
      submittedBy: data.submittedBy,
      description: data.description || 'Test maintenance request',
      status: 'new',
      priority: data.priority || 'medium',
      category: data.category || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      notified: false
    };

    // Add to tickets collection
    const result = await admin.firestore()
      .collection('tickets')
      .add(requestData);

    return { success: true, ticketId: result.id };
  } catch (error) {
    console.error('Error creating test maintenance request:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
}); 