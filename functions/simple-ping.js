// Super minimal function for deployment only
const functions = require("firebase-functions");

// Basic Ping Function with absolutely no dependencies
exports.simplePing = functions.https.onCall((data, context) => {
  // Just return a static response
  return { message: "pong", timestamp: Date.now() };
}); 