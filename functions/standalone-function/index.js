const functions = require("firebase-functions");

exports.pingTest = functions.https.onCall((data, context) => {
  return { message: "pong", timestamp: Date.now() };
}); 