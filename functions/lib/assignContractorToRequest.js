"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignContractorToRequest = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const logger = __importStar(require("firebase-functions/logger"));
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
exports.assignContractorToRequest = (0, https_1.onCall)(async (request) => {
    // 1. Authentication & Validation
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const landlordId = request.auth.uid;
    const { requestId, contractorId } = request.data;
    if (!requestId || !contractorId) {
        throw new https_1.HttpsError('invalid-argument', 'The function must be called with "requestId" and "contractorId" arguments.');
    }
    logger.info(`Assigning contractor ${contractorId} to request ${requestId} by landlord ${landlordId}`);
    // 2. Define Document References
    const requestRef = db.collection('maintenanceRequests').doc(requestId);
    const contractorProfileRef = db.collection('contractorProfiles').doc(contractorId);
    try {
        // 3. Perform updates in a single atomic transaction
        await db.runTransaction(async (transaction) => {
            // Read the maintenance request to ensure it exists
            const requestDoc = await transaction.get(requestRef);
            if (!requestDoc.exists) {
                throw new https_1.HttpsError('not-found', 'Maintenance request not found.');
            }
            // Read the contractor profile to check if it exists
            const contractorDoc = await transaction.get(contractorProfileRef);
            // Update the maintenance request with the contractorId and set status to 'in-progress'
            transaction.update(requestRef, {
                contractorId: contractorId,
                status: 'in-progress',
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            // Only update contractor profile if it exists
            if (contractorDoc.exists) {
                // Add the maintenance request ID to the contractor's profile
                transaction.update(contractorProfileRef, {
                    maintenanceRequests: admin.firestore.FieldValue.arrayUnion(requestId)
                });
                logger.info(`Updated contractor profile ${contractorId} with request ${requestId}`);
            }
            else {
                // Create a basic contractor profile if it doesn't exist
                transaction.set(contractorProfileRef, {
                    contractorId: contractorId,
                    maintenanceRequests: [requestId],
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                logger.info(`Created new contractor profile ${contractorId} with request ${requestId}`);
            }
        });
        logger.info(`Successfully assigned contractor ${contractorId} to request ${requestId}`);
        return { success: true, message: "Contractor assigned successfully." };
    }
    catch (error) {
        console.error("Error assigning contractor:", error);
        // Re-throw errors to be caught by the client
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', 'An internal error occurred while assigning the contractor.');
    }
});
//# sourceMappingURL=assignContractorToRequest.js.map