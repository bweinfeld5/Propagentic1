/**
 * Ultra-minimal deployment file to avoid timeout errors
 * ONLY used for deployment, not for production execution
 */

// Minimal imports - no initialization
const {onCall} = require("firebase-functions/v2/https");
const {onDocumentCreated} = require("firebase-functions/v2/firestore");

// Super minimal placeholder function that declares other functions
exports.helloTest = onCall({
  region: "us-central1"
}, () => {
  return { message: "Hello" };
});

// Only include function definitions with NO implementation
// This ensures fast discovery during deployment
exports.deliverMultiChannelNotification = onDocumentCreated({
  document: "notifications/{notificationId}",
  region: "us-central1"
}, () => null);

exports.registerFcmToken = onCall({
  region: "us-central1"
}, () => null);

exports.testNotificationDelivery = onCall({
  region: "us-central1" 
}, () => null);

// Declare any other functions you need to deploy
// with minimal configuration and null implementation 