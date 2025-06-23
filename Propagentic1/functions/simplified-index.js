/**
 * Simplified index.js for deploying one function at a time
 * Optimized for cold starts and performance
 */

// Load environment variables from .env file
require("dotenv").config();

const { onInit } = require('firebase-functions/v2/core');
const logger = require("firebase-functions/logger");

// Initialize Firebase Admin SDK only once in global scope
const admin = require("firebase-admin");
if (!admin.apps.length) {
  admin.initializeApp();
}

// Global Firestore reference for reuse
const db = admin.firestore();

// Use onInit to perform initialization during cold start, not deployment
onInit(async () => {
  try {
    // Verify database connection
    await db.collection("system").doc("status").set({
      lastStartup: admin.firestore.FieldValue.serverTimestamp(),
      environment: process.env.NODE_ENV || 'production'
    }, { merge: true });
    
    logger.info("Function initialization completed successfully");
  } catch (error) {
    logger.error("Error during initialization:", error);
  }
});

// Lazy-loaded function exports to reduce cold start time
// Only load the functions when they're first called
let _classifyMaintenanceRequest;
Object.defineProperty(exports, 'classifyMaintenanceRequest', {
  get: function() {
    if (!_classifyMaintenanceRequest) {
      _classifyMaintenanceRequest = require("./classifyMaintenanceRequest").classifyMaintenanceRequest;
      logger.info("Loaded classifyMaintenanceRequest function");
    }
    return _classifyMaintenanceRequest;
  }
});

// We can uncomment and optimize other functions as needed:
/*
let _matchContractorToTicket;
Object.defineProperty(exports, 'matchContractorToTicket', {
  get: function() {
    if (!_matchContractorToTicket) {
      _matchContractorToTicket = require("./matchContractorToTicket").matchContractorToTicket;
      logger.info("Loaded matchContractorToTicket function");
    }
    return _matchContractorToTicket;
  }
});

let _notifyAssignedContractor;
Object.defineProperty(exports, 'notifyAssignedContractor', {
  get: function() {
    if (!_notifyAssignedContractor) {
      _notifyAssignedContractor = require("./notifyAssignedContractor").notifyAssignedContractor;
      logger.info("Loaded notifyAssignedContractor function");
    }
    return _notifyAssignedContractor;
  }
});
*/ 