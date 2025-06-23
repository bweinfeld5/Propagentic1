const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// A minimal test function
exports.helloWorld = functions.https.onCall((data, context) => {
  return { message: "Hello from Firebase!" };
});

// Export only this function from this file
module.exports = { helloWorld: exports.helloWorld }; 