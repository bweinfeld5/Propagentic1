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
exports.rejectPropertyInvite = exports.acceptPropertyInvite = exports.addContractorToRolodex = exports.sendPropertyInvite = void 0;
// import * as functions from "firebase-functions"; // Removed unused v1 import
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const logger = __importStar(require("firebase-functions/logger"));
// Ensure admin is initialized if needed (though index.ts should handle it)
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
/**
 * Sends a property invitation to a potential tenant.
 * Creates an invite document in Firestore.
 */
exports.sendPropertyInvite = (0, https_1.onCall)(async (request) => {
    var _a;
    logger.info("sendPropertyInvite function called with data:", request.data);
    // 1. Authentication Check
    if (!request.auth) {
        logger.error("sendPropertyInvite: Unauthenticated call.");
        throw new https_1.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    const landlordUid = request.auth.uid;
    // 2. Input Validation
    const { propertyId, tenantEmail } = request.data;
    if (!propertyId || !tenantEmail) {
        logger.error("sendPropertyInvite: Missing propertyId or tenantEmail.", request.data);
        throw new https_1.HttpsError("invalid-argument", "Property ID and Tenant Email are required.");
    }
    // Basic email format check (can be improved)
    if (!/\S+@\S+\.\S+/.test(tenantEmail)) {
        logger.error("sendPropertyInvite: Invalid tenant email format.", { email: tenantEmail });
        throw new https_1.HttpsError("invalid-argument", "Invalid tenant email format provided.");
    }
    try {
        logger.info(`Attempting to send invite from landlord ${landlordUid} to ${tenantEmail} for property ${propertyId}`);
        // 3. Fetch Optional Data (Landlord Name & Property Name)
        let landlordName = "Your Landlord"; // Default
        let propertyName = "Their Property"; // Default
        try {
            const landlordUserSnap = await db.collection("users").doc(landlordUid).get();
            if (landlordUserSnap.exists) {
                const landlordData = landlordUserSnap.data();
                landlordName = (landlordData === null || landlordData === void 0 ? void 0 : landlordData.displayName) || (landlordData === null || landlordData === void 0 ? void 0 : landlordData.firstName) || landlordName;
            }
            const propertySnap = await db.collection("properties").doc(propertyId).get();
            if (propertySnap.exists) {
                propertyName = ((_a = propertySnap.data()) === null || _a === void 0 ? void 0 : _a.name) || propertyName;
            }
        }
        catch (fetchError) { // Catch errors during optional data fetch but proceed
            logger.warn("sendPropertyInvite: Could not fetch landlord/property name, using defaults.", { error: fetchError.message });
        }
        // 4. Create Invite Document
        const inviteData = {
            landlordId: landlordUid,
            landlordName: landlordName,
            propertyId: propertyId,
            propertyName: propertyName,
            tenantEmail: tenantEmail.toLowerCase(), // Store email in lowercase for consistency
            status: "pending",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        const inviteRef = await db.collection("invites").add(inviteData);
        logger.info(`Successfully created invite document ${inviteRef.id} for ${tenantEmail}`);
        // 5. Return Success
        // Note: The actual notification to the tenant is handled by the
        // 'createNotificationOnInvite' trigger listening to the 'invites' collection.
        return { success: true, message: "Invitation sent successfully.", inviteId: inviteRef.id };
    }
    catch (error) {
        logger.error("sendPropertyInvite: Failed to send invitation.", {
            error: error.message,
            landlordUid,
            propertyId,
            tenantEmail
        });
        if (error instanceof https_1.HttpsError) { // Re-throw HttpsErrors
            throw error;
        }
        // Throw a generic internal error for other issues
        throw new https_1.HttpsError("internal", "An unexpected error occurred while sending the invitation.");
    }
});
// TODO: Implement addContractorToRolodex logic
exports.addContractorToRolodex = (0, https_1.onCall)(async (request) => {
    logger.warn("addContractorToRolodex function called but not implemented.");
    // Placeholder logic - Replace with actual implementation
    return { success: false, message: "Function not implemented yet." };
});
/**
 * Firebase Cloud Function: acceptPropertyInvite
 * Updates relevant documents when a tenant accepts a property invitation.
 */
exports.acceptPropertyInvite = (0, https_1.onCall)(async (request) => {
    // 1. Authentication Check: Ensure the user is authenticated.
    if (!request.auth) {
        logger.error("acceptPropertyInvite: Unauthenticated call.");
        throw new https_1.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    const tenantUid = request.auth.uid;
    const tenantEmail = request.auth.token.email;
    const inviteId = request.data.inviteId;
    if (!inviteId) {
        logger.error("acceptPropertyInvite: Missing inviteId argument.");
        throw new https_1.HttpsError("invalid-argument", "Invite ID is required.");
    }
    logger.info(`Tenant ${tenantUid} attempting to accept invite ${inviteId}`);
    const inviteRef = db.collection("invites").doc(inviteId);
    const tenantUserRef = db.collection("users").doc(tenantUid);
    let landlordProfileRef = null;
    try {
        // 2. Run as transaction for atomicity
        await db.runTransaction(async (transaction) => {
            // Read documents within the transaction
            const inviteSnap = await transaction.get(inviteRef);
            const tenantUserSnap = await transaction.get(tenantUserRef);
            // 3. Validation
            if (!inviteSnap.exists) {
                throw new https_1.HttpsError("not-found", "Invitation not found.");
            }
            if (!tenantUserSnap.exists) {
                throw new https_1.HttpsError("not-found", "Tenant user profile not found.");
            }
            // Assert data exists after checking exists
            const inviteData = inviteSnap.data();
            const tenantUserData = tenantUserSnap.data();
            const propertyId = inviteData.propertyId;
            const landlordId = inviteData.landlordId;
            // Verify tenant email matches the invite
            if (inviteData.tenantEmail !== tenantEmail) {
                logger.warn(`Permission Denied: Invite email (${inviteData.tenantEmail}) != Auth email (${tenantEmail}) for invite ${inviteId}`);
                throw new https_1.HttpsError("permission-denied", "This invitation is not for you.");
            }
            // Verify invite status is pending
            if (inviteData.status !== "pending") {
                throw new https_1.HttpsError("failed-precondition", `This invitation has already been ${inviteData.status}.`);
            }
            // Check required data from invite
            if (!propertyId || !landlordId) {
                logger.error(`Invite ${inviteId} is missing propertyId or landlordId.`);
                throw new https_1.HttpsError("internal", "Invite data is incomplete.");
            }
            const propertyRef = db.collection("properties").doc(propertyId);
            landlordProfileRef = db.collection("landlordProfiles").doc(landlordId);
            // Check if property exists within transaction
            const propertySnap = await transaction.get(propertyRef);
            if (!propertySnap.exists) {
                logger.error(`Property ${propertyId} from invite ${inviteId} not found.`);
                throw new https_1.HttpsError("not-found", "The property associated with this invite no longer exists.");
            }
            // Check if tenant is already linked to THIS property (idempotency)
            // If using single property model (as current code does): Check if tenantUserData.propertyId exists AT ALL
            // Let's stick to the single property model for now based on existing code:
            if (tenantUserData.propertyId) {
                if (tenantUserData.propertyId === propertyId) {
                    logger.warn(`Tenant ${tenantUid} already linked to property ${propertyId}. Invite ${inviteId} acceptance is idempotent.`);
                    // Don't throw error, just update invite status and proceed if needed, or return early?
                    // For simplicity, let's just update the invite and return.
                    transaction.update(inviteRef, {
                        status: "accepted",
                        acceptedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                    return; // Exit transaction early
                }
                else {
                    logger.error(`Tenant ${tenantUid} is already associated with a different property (${tenantUserData.propertyId}). Cannot accept invite ${inviteId} for property ${propertyId}.`);
                    throw new https_1.HttpsError("failed-precondition", "You are already associated with a different property.");
                }
            }
            // 4. Perform Updates
            // Update invite status
            transaction.update(inviteRef, {
                status: "accepted",
                acceptedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            // Update tenant user profile
            transaction.update(tenantUserRef, {
                propertyId: propertyId,
                landlordId: landlordId,
                // Mark onboarding complete as they are now linked to a property
                onboardingComplete: true,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            // Update property document (add tenant to list)
            transaction.update(propertyRef, {
                tenants: admin.firestore.FieldValue.arrayUnion(tenantUid)
                // Optionally update occupied status/count if needed
            });
            // Optional: Update landlord profile (add tenant to list)
            // Ensure landlord profile exists before attempting update
            const landlordProfileSnap = await transaction.get(landlordProfileRef);
            if (landlordProfileSnap.exists) {
                transaction.update(landlordProfileRef, {
                    tenants: admin.firestore.FieldValue.arrayUnion(tenantUid)
                });
            }
        });
        logger.info(`Invite ${inviteId} successfully accepted by tenant ${tenantUid}`);
        return { success: true, message: "Invitation accepted successfully." };
    }
    catch (error) {
        logger.error("Error accepting invitation:", { error: error.message, code: error.code });
        // Check for specific HttpsError codes vs internal errors
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        else { // It's an internal server error
            throw new https_1.HttpsError("internal", "An unexpected error occurred.", error.message);
        }
    }
});
/**
 * Firebase Cloud Function: rejectPropertyInvite
 * Updates invite status when a tenant rejects an invitation.
 */
exports.rejectPropertyInvite = (0, https_1.onCall)(async (request) => {
    // 1. Authentication Check
    if (!request.auth) {
        logger.error("rejectPropertyInvite: Unauthenticated call.");
        throw new https_1.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    const tenantUid = request.auth.uid;
    const tenantEmail = request.auth.token.email;
    const inviteId = request.data.inviteId;
    if (!inviteId) {
        logger.error("rejectPropertyInvite: Missing inviteId argument.");
        throw new https_1.HttpsError("invalid-argument", "Invite ID is required.");
    }
    logger.info(`Tenant ${tenantUid} attempting to reject invite ${inviteId}`);
    const inviteRef = db.collection("invites").doc(inviteId);
    try {
        // Use transaction for read-then-write safety
        await db.runTransaction(async (transaction) => {
            const inviteSnap = await transaction.get(inviteRef);
            // 2. Validation
            if (!inviteSnap.exists) {
                throw new https_1.HttpsError("not-found", "Invitation not found.");
            }
            // Assert data exists after checking exists
            const inviteData = inviteSnap.data();
            if (inviteData.tenantEmail !== tenantEmail) {
                logger.warn(`Permission Denied: Invite email (${inviteData.tenantEmail}) != Auth email (${tenantEmail}) for invite ${inviteId}`);
                throw new https_1.HttpsError("permission-denied", "This invitation is not for you.");
            }
            if (inviteData.status !== "pending") {
                logger.warn(`Invite ${inviteId} has status ${inviteData.status}, cannot reject.`);
                throw new https_1.HttpsError("failed-precondition", "This invitation is no longer pending.");
            }
            // 3. Perform Update
            transaction.update(inviteRef, {
                status: "declined",
                rejectedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        });
        logger.info(`Invite ${inviteId} successfully rejected by tenant ${tenantUid}`);
        return { success: true, message: "Invitation rejected." };
    }
    catch (error) {
        logger.error("Error rejecting invitation:", { error: error.message, code: error.code });
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        else {
            throw new https_1.HttpsError("internal", "An unexpected error occurred.", error.message);
        }
    }
});
// No need for export {} when using named exports like this
// export {}; 
//# sourceMappingURL=userRelationships.js.map