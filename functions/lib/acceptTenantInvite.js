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
exports.acceptTenantInvite = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const corsLib = __importStar(require("cors"));
// Initialize admin if not already initialized
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
const cors = corsLib.default({ origin: true }); // Allow all origins during development
/**
 * Firebase HTTP Function: acceptTenantInvite
 *
 * Allows a tenant to accept an invite from a landlord using an 8-character alphanumeric invite code.
 * This is a clean, simple implementation that replaces the over-engineered system.
 * Converted from callable function to HTTP function with CORS support.
 *
 * @param {functions.Request} req - HTTP request with body: { inviteCode: string, unitId: string }
 * @param {functions.Response} res - HTTP response
 */
exports.acceptTenantInvite = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        var _a, _b, _c;
        if (req.method !== "POST") {
            return res.status(405).send({ success: false, message: "Method Not Allowed" });
        }
        const { inviteCode, unitId } = req.body;
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split("Bearer ")[1];
        if (!token) {
            return res.status(401).json({ success: false, message: "Unauthorized: Missing token." });
        }
        if (!inviteCode || !unitId) {
            return res.status(400).json({ success: false, message: "Invite code and unit ID are required." });
        }
        try {
            const decodedToken = await admin.auth().verifyIdToken(token);
            const uid = decodedToken.uid;
            const normalizedInviteCode = inviteCode.trim().toUpperCase();
            functions.logger.info(`Starting invite acceptance for user ${uid} with code ${normalizedInviteCode} for unit ${unitId}`);
            // --- 1. VALIDATION (Outside Transaction) ---
            const inviteQuery = await db.collection('invites').where('shortCode', '==', normalizedInviteCode).limit(1).get();
            if (inviteQuery.empty) {
                return res.status(404).json({ success: false, message: "Invalid invite code." });
            }
            const inviteDoc = inviteQuery.docs[0];
            const invite = inviteDoc.data();
            if (invite.status !== 'pending' && invite.status !== 'sent') {
                return res.status(400).json({ success: false, message: `This invite has already been ${invite.status}.` });
            }
            const propertyRef = db.collection('properties').doc(invite.propertyId);
            const propertyDoc = await propertyRef.get();
            if (!propertyDoc.exists) {
                return res.status(404).json({ success: false, message: "The associated property does not exist." });
            }
            const propertyData = propertyDoc.data();
            const unit = (_b = propertyData.units) === null || _b === void 0 ? void 0 : _b[unitId];
            if (!unit) {
                return res.status(404).json({ success: false, message: `Unit ${unitId} not found on property.` });
            }
            if ((((_c = unit.tenants) === null || _c === void 0 ? void 0 : _c.length) || 0) >= unit.capacity) {
                return res.status(409).json({ success: false, message: "This unit is at full capacity." });
            }
            const tenantProfileRef = db.collection('tenantProfiles').doc(uid);
            const landlordProfileRef = db.collection('landlordProfiles').doc(invite.landlordId);
            // --- 2. ATOMIC TRANSACTION (All Writes) ---
            await db.runTransaction(async (transaction) => {
                const landlordDoc = await transaction.get(landlordProfileRef);
                if (!landlordDoc.exists) {
                    throw new Error("Landlord profile could not be found.");
                }
                // a. Update Property: Add tenant to the unit's tenants array
                const unitTenantsPath = `units.${unitId}.tenants`;
                transaction.update(propertyRef, {
                    [unitTenantsPath]: admin.firestore.FieldValue.arrayUnion(uid),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                // b. Update Tenant Profile: Add property to tenant's properties array and set address
                const tenantUpdateData = {
                    properties: admin.firestore.FieldValue.arrayUnion(invite.propertyId),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                };
                // Set tenant's address to the property address
                if (propertyData.address) {
                    tenantUpdateData.address = propertyData.address;
                }
                transaction.update(tenantProfileRef, tenantUpdateData);
                // c. Update Landlord Profile: Add tenant to accepted lists
                const acceptedTenantRecord = {
                    tenantId: uid,
                    propertyId: invite.propertyId,
                    unitId: unitId,
                    inviteId: inviteDoc.id,
                    inviteCode: normalizedInviteCode,
                    tenantEmail: invite.tenantEmail || '',
                    acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
                };
                transaction.update(landlordProfileRef, {
                    acceptedTenants: admin.firestore.FieldValue.arrayUnion(uid),
                    acceptedTenantDetails: admin.firestore.FieldValue.arrayUnion(acceptedTenantRecord),
                    totalInvitesAccepted: admin.firestore.FieldValue.increment(1),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                // d. Update Invite: Mark as accepted
                transaction.update(inviteDoc.ref, {
                    status: 'accepted',
                    tenantId: uid,
                    acceptedAt: admin.firestore.FieldValue.serverTimestamp()
                });
            });
            functions.logger.info(`Successfully completed invite acceptance for user ${uid}`);
            return res.status(200).json({ success: true, message: "Successfully joined property!" });
        }
        catch (error) {
            functions.logger.error("Error in acceptTenantInvite:", error);
            return res.status(500).json({ success: false, message: error.message || "An internal error occurred." });
        }
    });
});
//# sourceMappingURL=acceptTenantInvite.js.map