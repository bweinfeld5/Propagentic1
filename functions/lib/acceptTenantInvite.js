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
 * @param {functions.Request} req - HTTP request with body: { inviteCode: string }
 * @param {functions.Response} res - HTTP response
 */
exports.acceptTenantInvite = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        if (req.method !== "POST") {
            return res.status(405).send("Method Not Allowed");
        }
        try {
            const { inviteCode } = req.body;
            // Extract and verify Bearer token
            const authHeader = req.headers.authorization || "";
            const token = authHeader.startsWith("Bearer ") ? authHeader.split("Bearer ")[1] : null;
            if (!token) {
                return res.status(401).json({
                    success: false,
                    error: "unauthenticated",
                    message: "Unauthorized: Missing token."
                });
            }
            // Verify the Firebase ID token
            let decodedToken;
            try {
                decodedToken = await admin.auth().verifyIdToken(token);
            }
            catch (error) {
                functions.logger.error("Invalid token:", error);
                return res.status(401).json({
                    success: false,
                    error: "unauthenticated",
                    message: "Invalid authentication token."
                });
            }
            const uid = decodedToken.uid;
            // Validate input
            if (!inviteCode || typeof inviteCode !== 'string') {
                return res.status(400).json({
                    success: false,
                    error: "invalid-argument",
                    message: "inviteCode must be a non-empty string."
                });
            }
            // Normalize invite code to uppercase
            const normalizedInviteCode = inviteCode.trim().toUpperCase();
            // Validate invite code format (8 alphanumeric characters)
            const codeRegex = /^[A-Z0-9]{8}$/;
            if (!codeRegex.test(normalizedInviteCode)) {
                return res.status(400).json({
                    success: false,
                    error: "invalid-argument",
                    message: "Invalid invite code format. Code must be 8 alphanumeric characters."
                });
            }
            functions.logger.info(`Starting invite acceptance for user ${uid} with code ${normalizedInviteCode}`);
            // Step 1: Fetch the tenant profile using the authenticated user's uid
            const tenantProfileRef = db.collection('tenantProfiles').doc(uid);
            const tenantProfileDoc = await tenantProfileRef.get();
            if (!tenantProfileDoc.exists) {
                functions.logger.error(`Tenant profile not found for uid: ${uid}`);
                return res.status(404).json({
                    success: false,
                    error: "not-found",
                    message: "Tenant profile not found. Please complete your profile setup first."
                });
            }
            const tenantProfile = tenantProfileDoc.data();
            functions.logger.info(`Found tenant profile for uid: ${uid}`);
            // Step 2: Search for the invite by shortCode
            const inviteQuery = await db.collection('invites')
                .where('shortCode', '==', normalizedInviteCode)
                .limit(1)
                .get();
            if (inviteQuery.empty) {
                functions.logger.warn(`Invalid invite code attempted: ${normalizedInviteCode}`);
                return res.status(400).json({
                    success: false,
                    error: "invalid-argument",
                    message: "Invalid invite code."
                });
            }
            const inviteDoc = inviteQuery.docs[0];
            const invite = inviteDoc.data();
            const propertyId = invite.propertyId;
            functions.logger.info(`Found invite for property: ${propertyId}`);
            // Step 3: Verify that the property exists
            const propertyRef = db.collection('properties').doc(propertyId);
            const propertyDoc = await propertyRef.get();
            if (!propertyDoc.exists) {
                functions.logger.error(`Property not found: ${propertyId}`);
                return res.status(404).json({
                    success: false,
                    error: "not-found",
                    message: "Property does not exist."
                });
            }
            const property = propertyDoc.data();
            functions.logger.info(`Verified property exists: ${propertyId}`);
            // Step 4: Check if tenant is already linked to this property
            const currentProperties = tenantProfile.properties || [];
            if (currentProperties.includes(propertyId)) {
                functions.logger.warn(`Tenant ${uid} already linked to property ${propertyId}`);
                return res.status(409).json({
                    success: false,
                    error: "already-exists",
                    message: "Tenant already linked to this property."
                });
            }
            // Step 5: Add the property to the tenant's properties array
            const updatedProperties = [...currentProperties, propertyId];
            await tenantProfileRef.update({
                properties: updatedProperties,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            functions.logger.info(`Successfully linked tenant ${uid} to property ${propertyId}`);
            // Return success response
            return res.status(200).json({
                success: true,
                message: "Successfully joined property!",
                propertyId: propertyId,
                propertyAddress: property.address || property.streetAddress || "Unknown address"
            });
        }
        catch (error) {
            // Log unexpected errors and return generic error
            functions.logger.error("Unexpected error in acceptTenantInvite:", error);
            return res.status(500).json({
                success: false,
                error: "internal",
                message: "An internal error occurred while processing the invite."
            });
        }
    });
});
//# sourceMappingURL=acceptTenantInvite.js.map