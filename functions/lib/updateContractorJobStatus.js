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
exports.updateContractorJobStatus = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const logger = __importStar(require("firebase-functions/logger"));
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
/**
 * Update contractor job status - move jobs between pending, ongoing, and finished
 */
exports.updateContractorJobStatus = (0, https_1.onCall)(async (request) => {
    // 1. Authentication & Validation
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const { requestId, fromStatus, toStatus, contractorId } = request.data;
    const userId = request.auth.uid;
    const targetContractorId = contractorId || userId; // Use provided contractorId or default to authenticated user
    if (!requestId || !fromStatus || !toStatus) {
        throw new https_1.HttpsError('invalid-argument', 'The function must be called with "requestId", "fromStatus", and "toStatus" arguments.');
    }
    if (!['pending', 'ongoing', 'finished'].includes(fromStatus) || !['pending', 'ongoing', 'finished'].includes(toStatus)) {
        throw new https_1.HttpsError('invalid-argument', 'Status must be one of: pending, ongoing, finished');
    }
    if (fromStatus === toStatus) {
        throw new https_1.HttpsError('invalid-argument', 'fromStatus and toStatus cannot be the same');
    }
    logger.info(`Moving request ${requestId} from ${fromStatus} to ${toStatus} for contractor ${targetContractorId}`);
    // 2. Define Document References - UPDATED to use contractorProfiles
    const contractorProfileRef = db.collection('contractorProfiles').doc(targetContractorId);
    const requestRef = db.collection('maintenanceRequests').doc(requestId);
    try {
        await db.runTransaction(async (transaction) => {
            var _a;
            // READ PHASE
            const contractorProfileDoc = await transaction.get(contractorProfileRef);
            if (!contractorProfileDoc.exists) {
                throw new https_1.HttpsError('not-found', 'Contractor profile not found.');
            }
            const requestDoc = await transaction.get(requestRef);
            if (!requestDoc.exists) {
                throw new https_1.HttpsError('not-found', 'Maintenance request not found.');
            }
            const contractorProfileData = contractorProfileDoc.data();
            const requestData = requestDoc.data();
            // Verify the contractor is assigned to this request
            if ((requestData === null || requestData === void 0 ? void 0 : requestData.contractorId) !== targetContractorId) {
                throw new https_1.HttpsError('permission-denied', 'Contractor is not assigned to this request.');
            }
            // Ensure contracts structure exists
            if (!(contractorProfileData === null || contractorProfileData === void 0 ? void 0 : contractorProfileData.contracts)) {
                throw new https_1.HttpsError('failed-precondition', 'Contractor profile does not have the contracts structure initialized.');
            }
            // Verify the request is in the expected fromStatus array
            if (!((_a = contractorProfileData.contracts[fromStatus]) === null || _a === void 0 ? void 0 : _a.includes(requestId))) {
                throw new https_1.HttpsError('failed-precondition', `Request ${requestId} is not in the ${fromStatus} status for contractor ${targetContractorId}.`);
            }
            // WRITE PHASE
            // Remove from old status array and add to new status array
            const updateData = {
                [`contracts.${fromStatus}`]: admin.firestore.FieldValue.arrayRemove(requestId),
                [`contracts.${toStatus}`]: admin.firestore.FieldValue.arrayUnion(requestId),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };
            transaction.update(contractorProfileRef, updateData);
            // Update maintenance request status if transitioning to finished
            if (toStatus === 'finished') {
                transaction.update(requestRef, {
                    status: 'completed',
                    completedAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
            }
            else if (toStatus === 'ongoing' && fromStatus === 'pending') {
                transaction.update(requestRef, {
                    status: 'in-progress',
                    startedAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
            }
        });
        logger.info(`Successfully moved request ${requestId} from ${fromStatus} to ${toStatus} for contractor ${targetContractorId}`);
        return {
            success: true,
            message: `Job status updated from ${fromStatus} to ${toStatus} successfully.`
        };
    }
    catch (error) {
        console.error("Error updating contractor job status:", error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', 'An internal error occurred while updating job status.');
    }
});
//# sourceMappingURL=updateContractorJobStatus.js.map