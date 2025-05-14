const {onCall} = require("firebase-functions/v2/https");

// Super minimal function
exports.helloTest = onCall({
  region: "us-central1",
}, (request) => {
  return { message: "Hello from Firebase!", timestamp: Date.now() };
});
