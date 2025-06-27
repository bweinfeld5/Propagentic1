"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeTenantFromLandlord = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const firebase_functions_1 = require("firebase-functions");
/**
 * Cloud Function to remove a tenant from a landlord's accepted tenants list
 * and optionally revoke their access in tenantProfiles
 */
exports.removeTenantFromLandlord = (0, https_1.onCall)(async (request) => {
    const { data, auth } = request;
    // Validate authentication
    if (!auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    // Validate input data
    if (!data.landlordId || !data.tenantId || !data.propertyId) {
        throw new https_1.HttpsError('invalid-argument', 'Missing required fields: landlordId, tenantId, propertyId');
    }
    // Ensure the authenticated user is the landlord
    if (auth.uid !== data.landlordId) {
        throw new https_1.HttpsError('permission-denied', 'User can only remove tenants from their own properties');
    }
    const db = (0, firestore_1.getFirestore)();
    const { landlordId, tenantId, propertyId } = data;
    try {
        // Use a transaction to ensure consistency
        await db.runTransaction(async (transaction) => {
            const landlordProfileRef = db.collection('landlordProfiles').doc(landlordId);
            const tenantProfileRef = db.collection('tenantProfiles').doc(tenantId);
            // Get current landlord profile
            const landlordDoc = await transaction.get(landlordProfileRef);
            if (!landlordDoc.exists) {
                throw new https_1.HttpsError('not-found', 'Landlord profile not found');
            }
            const landlordData = landlordDoc.data();
            const acceptedTenants = (landlordData === null || landlordData === void 0 ? void 0 : landlordData.acceptedTenants) || [];
            const acceptedTenantDetails = (landlordData === null || landlordData === void 0 ? void 0 : landlordData.acceptedTenantDetails) || [];
            // Check if tenant is actually in the accepted list
            const tenantIndex = acceptedTenants.indexOf(tenantId);
            if (tenantIndex === -1) {
                throw new https_1.HttpsError('not-found', 'Tenant not found in landlord\'s accepted tenants list');
            }
            // Remove tenant from acceptedTenants array
            const updatedAcceptedTenants = acceptedTenants.filter((id) => id !== tenantId);
            // Remove tenant details for this property
            const updatedAcceptedTenantDetails = acceptedTenantDetails.filter((detail) => !(detail.tenantId === tenantId && detail.propertyId === propertyId));
            // Update landlord profile
            transaction.update(landlordProfileRef, {
                acceptedTenants: updatedAcceptedTenants,
                acceptedTenantDetails: updatedAcceptedTenantDetails,
                updatedAt: firestore_1.FieldValue.serverTimestamp()
            });
            // Check if tenant profile exists and update it
            const tenantDoc = await transaction.get(tenantProfileRef);
            if (tenantDoc.exists) {
                const tenantData = tenantDoc.data();
                const currentProperties = (tenantData === null || tenantData === void 0 ? void 0 : tenantData.properties) || [];
                // Remove the property from tenant's properties list
                const updatedProperties = currentProperties.filter((id) => id !== propertyId);
                transaction.update(tenantProfileRef, {
                    properties: updatedProperties,
                    updatedAt: firestore_1.FieldValue.serverTimestamp()
                });
                firebase_functions_1.logger.info(`Updated tenant profile ${tenantId} - removed property ${propertyId}`);
            }
            else {
                firebase_functions_1.logger.warn(`Tenant profile ${tenantId} not found during removal`);
            }
            // Update property to reflect the change (optional)
            const propertyRef = db.collection('properties').doc(propertyId);
            const propertyDoc = await transaction.get(propertyRef);
            if (propertyDoc.exists) {
                const propertyData = propertyDoc.data();
                const currentTenants = (propertyData === null || propertyData === void 0 ? void 0 : propertyData.tenants) || [];
                const updatedTenants = currentTenants.filter((id) => id !== tenantId);
                transaction.update(propertyRef, {
                    tenants: updatedTenants,
                    isOccupied: updatedTenants.length > 0,
                    occupiedUnits: updatedTenants.length,
                    updatedAt: firestore_1.FieldValue.serverTimestamp()
                });
                firebase_functions_1.logger.info(`Updated property ${propertyId} - removed tenant ${tenantId}`);
            }
            firebase_functions_1.logger.info(`Successfully removed tenant ${tenantId} from landlord ${landlordId}'s property ${propertyId}`);
        });
        return {
            success: true,
            message: 'Tenant successfully removed',
            removedTenantId: tenantId,
            propertyId: propertyId
        };
    }
    catch (error) {
        firebase_functions_1.logger.error('Error removing tenant from landlord:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', 'Failed to remove tenant: ' + error.message);
    }
});
//# sourceMappingURL=removeTenantFromLandlord.js.map