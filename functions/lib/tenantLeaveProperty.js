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
exports.tenantLeaveProperty = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const logger = __importStar(require("firebase-functions/logger"));
// Ensure admin is initialized
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
/**
 * Firebase Cloud Function: tenantLeaveProperty
 * Allows a tenant to leave a property, updating all relevant collections
 */
exports.tenantLeaveProperty = (0, https_1.onCall)(async (request) => {
    // 1. Authentication Check
    if (!request.auth) {
        logger.error("tenantLeaveProperty: Unauthenticated call.");
        throw new https_1.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    const tenantUid = request.auth.uid;
    const { propertyId, reason, moveOutDate } = request.data;
    if (!propertyId) {
        logger.error("tenantLeaveProperty: Missing propertyId argument.");
        throw new https_1.HttpsError("invalid-argument", "Property ID is required.");
    }
    logger.info(`Tenant ${tenantUid} attempting to leave property ${propertyId}`);
    try {
        // 2. Run as transaction for atomicity
        const result = await db.runTransaction(async (transaction) => {
            // Get tenant profile
            const tenantProfileRef = db.collection("tenantProfiles").doc(tenantUid);
            const tenantProfileSnap = await transaction.get(tenantProfileRef);
            if (!tenantProfileSnap.exists) {
                throw new https_1.HttpsError("not-found", "Tenant profile not found.");
            }
            const tenantProfileData = tenantProfileSnap.data();
            const tenantProperties = tenantProfileData.properties || [];
            // Verify tenant is actually associated with this property
            if (!tenantProperties.includes(propertyId)) {
                throw new https_1.HttpsError("permission-denied", "You are not associated with this property.");
            }
            // Get property details
            const propertyRef = db.collection("properties").doc(propertyId);
            const propertySnap = await transaction.get(propertyRef);
            if (!propertySnap.exists) {
                throw new https_1.HttpsError("not-found", "Property not found.");
            }
            const propertyData = propertySnap.data();
            const landlordId = propertyData.landlordId;
            // Get landlord profile
            const landlordProfileRef = db.collection("landlordProfiles").doc(landlordId);
            const landlordProfileSnap = await transaction.get(landlordProfileRef);
            if (!landlordProfileSnap.exists) {
                logger.warn(`Landlord profile ${landlordId} not found during tenant departure`);
                // Continue without updating landlord profile
            }
            // Get tenant user data for notifications
            const tenantUserRef = db.collection("users").doc(tenantUid);
            const tenantUserSnap = await transaction.get(tenantUserRef);
            const tenantUserData = tenantUserSnap.exists ? tenantUserSnap.data() : {};
            // 3. Perform Updates
            // Update tenant profile - remove property
            const updatedTenantProperties = tenantProperties.filter((id) => id !== propertyId);
            transaction.update(tenantProfileRef, {
                properties: updatedTenantProperties,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            // Update tenant user document if it has propertyId field
            if (tenantUserData.propertyId === propertyId) {
                transaction.update(tenantUserRef, {
                    propertyId: admin.firestore.FieldValue.delete(),
                    landlordId: admin.firestore.FieldValue.delete(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
            }
            // Update property - remove tenant from tenants array
            const propertyTenants = propertyData.tenants || [];
            const updatedPropertyTenants = propertyTenants.filter((id) => id !== tenantUid);
            transaction.update(propertyRef, {
                tenants: updatedPropertyTenants,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            // Update landlord profile if it exists
            if (landlordProfileSnap.exists) {
                const landlordData = landlordProfileSnap.data();
                // Remove from acceptedTenants array
                const acceptedTenants = landlordData.acceptedTenants || [];
                const updatedAcceptedTenants = acceptedTenants.filter((id) => id !== tenantUid);
                // Remove from acceptedTenantDetails array
                const acceptedTenantDetails = landlordData.acceptedTenantDetails || [];
                const updatedAcceptedTenantDetails = acceptedTenantDetails.filter((record) => record.tenantId !== tenantUid || record.propertyId !== propertyId);
                // Update statistics
                const currentAccepted = landlordData.totalInvitesAccepted || 0;
                const currentSent = landlordData.totalInvitesSent || 0;
                const newAccepted = Math.max(0, currentAccepted - 1);
                const newRate = currentSent > 0 ? Math.round((newAccepted / currentSent) * 100) : 0;
                transaction.update(landlordProfileRef, {
                    acceptedTenants: updatedAcceptedTenants,
                    acceptedTenantDetails: updatedAcceptedTenantDetails,
                    totalInvitesAccepted: newAccepted,
                    inviteAcceptanceRate: newRate,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
            }
            // 4. Create departure record for audit trail
            const departureRecord = {
                tenantId: tenantUid,
                tenantEmail: tenantUserData.email || '',
                tenantName: tenantUserData.displayName || tenantUserData.name || '',
                propertyId: propertyId,
                propertyName: propertyData.name || propertyData.nickname || 'Unknown Property',
                landlordId: landlordId,
                reason: reason || 'No reason provided',
                moveOutDate: moveOutDate ? admin.firestore.Timestamp.fromDate(new Date(moveOutDate)) : null,
                departedAt: admin.firestore.FieldValue.serverTimestamp(),
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            };
            // Add to tenant departures collection for record keeping
            const departureRef = db.collection("tenantDepartures").doc();
            transaction.set(departureRef, departureRecord);
            // 5. Create notification for landlord
            if (landlordProfileSnap.exists) {
                const notificationRef = db.collection("notifications").doc();
                transaction.set(notificationRef, {
                    userId: landlordId,
                    userRole: "landlord",
                    type: "tenant_departure",
                    title: "Tenant Left Property",
                    message: `${tenantUserData.displayName || tenantUserData.email || 'Tenant'} has left ${propertyData.name || 'your property'}`,
                    read: false,
                    data: {
                        tenantId: tenantUid,
                        tenantName: tenantUserData.displayName || tenantUserData.name || '',
                        tenantEmail: tenantUserData.email || '',
                        propertyId: propertyId,
                        propertyName: propertyData.name || propertyData.nickname || '',
                        reason: reason || 'No reason provided',
                        departureId: departureRef.id
                    },
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
            }
            return {
                propertyId,
                propertyName: propertyData.name || propertyData.nickname || 'Unknown Property',
                landlordId,
                departureId: departureRef.id
            };
        });
        logger.info(`Tenant ${tenantUid} successfully left property ${propertyId}`);
        return Object.assign({ success: true, message: "Successfully left the property." }, result);
    }
    catch (error) {
        logger.error("Error processing tenant departure:", {
            error: error.message,
            tenantUid,
            propertyId
        });
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        else {
            throw new https_1.HttpsError("internal", "An unexpected error occurred while processing the departure.");
        }
    }
});
//# sourceMappingURL=tenantLeaveProperty.js.map