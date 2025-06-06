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
exports.redeemInviteCode = exports.validateInviteCode = exports.generateInviteCode = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const auth_1 = require("firebase-functions/v1/auth");
// Collection names
const INVITE_CODES_COLLECTION = 'inviteCodes';
const PROPERTY_TENANT_RELATIONSHIPS_COLLECTION = 'propertyTenantRelationships';
// Validate invite code format
const isValidInviteCode = (code) => {
    // Alphanumeric code, 6-12 characters, case-insensitive
    const regex = /^[a-zA-Z0-9]{6,12}$/;
    return regex.test(code);
};
/**
 * Generate an invite code for a property
 * This function allows landlords to create codes that tenants can use to register
 */
exports.generateInviteCode = functions.https.onCall(async (data, context) => {
    // Ensure user is authenticated and has a landlord role
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to create an invite code.');
    }
    // Get the user data to check role
    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'User profile not found.');
    }
    const userData = userDoc.data();
    // Verify user is a landlord or property manager
    if ((userData === null || userData === void 0 ? void 0 : userData.role) !== 'landlord' && (userData === null || userData === void 0 ? void 0 : userData.role) !== 'admin' && (userData === null || userData === void 0 ? void 0 : userData.role) !== 'property_manager') {
        throw new functions.https.HttpsError('permission-denied', 'Only landlords and property managers can create invite codes.');
    }
    // Get parameters from request
    const { propertyId, unitId, email, expirationDays = 7 } = data;
    // Validate required parameters
    if (!propertyId) {
        throw new functions.https.HttpsError('invalid-argument', 'Property ID is required.');
    }
    // Check if the property exists and the user has access to it
    const propertyDoc = await db.collection('properties').doc(propertyId).get();
    if (!propertyDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Property not found.');
    }
    const propertyData = propertyDoc.data();
    // Check if the user has access to this property
    const hasAccess = (propertyData === null || propertyData === void 0 ? void 0 : propertyData.ownerId) === context.auth.uid ||
        ((propertyData === null || propertyData === void 0 ? void 0 : propertyData.managers) && propertyData.managers.includes(context.auth.uid)) ||
        (userData === null || userData === void 0 ? void 0 : userData.role) === 'admin';
    if (!hasAccess) {
        throw new functions.https.HttpsError('permission-denied', 'You do not have permission to create invite codes for this property.');
    }
    // Verify unit exists if specified
    if (unitId && (propertyData === null || propertyData === void 0 ? void 0 : propertyData.units)) {
        const unitExists = propertyData.units.some((unit) => unit.id === unitId || unit.unitNumber === unitId);
        if (!unitExists) {
            throw new functions.https.HttpsError('not-found', 'The specified unit could not be found in this property.');
        }
    }
    try {
        // Generate a unique code
        let code;
        let isUnique = false;
        // Define character set for codes excluding similar-looking characters
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excludes I, O, 0, 1
        // Try to generate a unique code
        while (!isUnique) {
            // Generate an 8-character code
            code = '';
            for (let i = 0; i < 8; i++) {
                code += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            // Check if the code already exists
            const codeQuery = await db.collection(INVITE_CODES_COLLECTION)
                .where('code', '==', code)
                .limit(1)
                .get();
            isUnique = codeQuery.empty;
        }
        // Set expiration date based on provided days or default to 7 days
        const now = admin.firestore.Timestamp.now();
        const expiresAt = new admin.firestore.Timestamp(now.seconds + (expirationDays * 24 * 60 * 60), now.nanoseconds);
        // Create the invite code record
        const inviteCodeData = {
            code,
            landlordId: context.auth.uid,
            propertyId,
            unitId: unitId || undefined,
            email: email || undefined,
            status: 'active',
            createdAt: now,
            expiresAt
        };
        const inviteCodeRef = await db.collection(INVITE_CODES_COLLECTION).add(inviteCodeData);
        // Return the created invite code
        return {
            success: true,
            inviteCode: Object.assign(Object.assign({ id: inviteCodeRef.id }, inviteCodeData), { createdAt: inviteCodeData.createdAt.toMillis(), expiresAt: inviteCodeData.expiresAt.toMillis() })
        };
    }
    catch (error) {
        functions.logger.error('Error creating invite code:', error);
        throw new functions.https.HttpsError('internal', 'An error occurred while creating the invite code. Please try again later.');
    }
});
/**
 * Validate an invite code without redeeming it
 * This helps check if a code is valid during registration process
 */
exports.validateInviteCode = functions.https.onCall(async (data, context) => {
    // Get the code from the request
    const { code } = data;
    // Validate code format
    if (!code || !isValidInviteCode(code)) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid invite code format. Codes must be 6-12 alphanumeric characters.');
    }
    const normalizedCode = code.toUpperCase();
    const db = admin.firestore();
    try {
        // Look up the invite code
        const codeQuery = await db.collection(INVITE_CODES_COLLECTION)
            .where('code', '==', normalizedCode)
            .limit(1)
            .get();
        if (codeQuery.empty) {
            throw new functions.https.HttpsError('not-found', 'Invalid invite code. Please check the code and try again.');
        }
        const inviteCodeDoc = codeQuery.docs[0];
        const inviteCodeData = inviteCodeDoc.data();
        // Check code status
        if (inviteCodeData.status === 'used') {
            throw new functions.https.HttpsError('already-exists', 'This invite code has already been used.');
        }
        if (inviteCodeData.status === 'revoked') {
            throw new functions.https.HttpsError('permission-denied', 'This invite code has been revoked.');
        }
        if (inviteCodeData.status === 'expired' ||
            (inviteCodeData.expiresAt && inviteCodeData.expiresAt.toMillis() < Date.now())) {
            // Auto-update expired status if needed
            if (inviteCodeData.status !== 'expired' && inviteCodeData.expiresAt.toMillis() < Date.now()) {
                await db.collection(INVITE_CODES_COLLECTION).doc(inviteCodeDoc.id).update({
                    status: 'expired'
                });
            }
            throw new functions.https.HttpsError('deadline-exceeded', 'This invite code has expired.');
        }
        // Check if the property exists
        const propertyDoc = await db.collection('properties').doc(inviteCodeData.propertyId).get();
        if (!propertyDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'The property associated with this invite code could not be found.');
        }
        const propertyData = propertyDoc.data();
        // Return validation success with limited property information
        return {
            isValid: true,
            message: 'Valid invite code',
            propertyId: inviteCodeData.propertyId,
            propertyName: (propertyData === null || propertyData === void 0 ? void 0 : propertyData.name) || 'Property',
            unitId: inviteCodeData.unitId || null,
            restrictedEmail: inviteCodeData.email || null
        };
    }
    catch (error) {
        // Forward HttpsError errors
        if (error instanceof auth_1.HttpsError) {
            throw error;
        }
        functions.logger.error('Error validating invite code:', error);
        throw new functions.https.HttpsError('internal', 'An error occurred while validating the invite code. Please try again later.');
    }
});
/**
 * Redeem an invite code to associate a tenant with a property
 * This function allows tenants to use invite codes during or after registration
 */
exports.redeemInviteCode = functions.https.onCall(async (data, context) => {
    // Ensure user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to redeem an invite code.');
    }
    // Get parameters from request
    const { code } = data;
    const tenantId = context.auth.uid;
    // Validate code
    if (!code || !isValidInviteCode(code)) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid invite code format. Codes must be 6-12 alphanumeric characters.');
    }
    // Standardize code format
    const normalizedCode = code.toUpperCase();
    const db = admin.firestore();
    try {
        // Transaction to ensure atomicity of the redemption process
        return await db.runTransaction(async (transaction) => {
            var _a;
            // Get the invite code
            const inviteCodeQuery = await transaction.get(db.collection(INVITE_CODES_COLLECTION)
                .where('code', '==', normalizedCode)
                .limit(1));
            if (inviteCodeQuery.empty) {
                throw new functions.https.HttpsError('not-found', 'Invalid invite code. Please check the code and try again.');
            }
            const inviteCodeDoc = inviteCodeQuery.docs[0];
            const inviteCodeData = inviteCodeDoc.data();
            const inviteCodeId = inviteCodeDoc.id;
            // Validate the code status
            if (inviteCodeData.status === 'used') {
                throw new functions.https.HttpsError('already-exists', 'This invite code has already been used.');
            }
            if (inviteCodeData.status === 'revoked') {
                throw new functions.https.HttpsError('permission-denied', 'This invite code has been revoked.');
            }
            if (inviteCodeData.status === 'expired' ||
                (inviteCodeData.expiresAt && inviteCodeData.expiresAt.toMillis() < Date.now())) {
                throw new functions.https.HttpsError('deadline-exceeded', 'This invite code has expired.');
            }
            // Check if email restriction applies and matches user's email
            if (inviteCodeData.email) {
                const userRecord = await admin.auth().getUser(tenantId);
                if (((_a = userRecord.email) === null || _a === void 0 ? void 0 : _a.toLowerCase()) !== inviteCodeData.email.toLowerCase()) {
                    throw new functions.https.HttpsError('permission-denied', `This invite code is restricted to ${inviteCodeData.email}.`);
                }
            }
            // Get the property information
            const propertyId = inviteCodeData.propertyId;
            const unitId = inviteCodeData.unitId;
            const propertyDoc = await transaction.get(db.collection('properties').doc(propertyId));
            if (!propertyDoc.exists) {
                throw new functions.https.HttpsError('not-found', 'The property associated with this invite code could not be found.');
            }
            const propertyData = propertyDoc.data();
            // Get the user profile
            const userDoc = await transaction.get(db.collection('users').doc(tenantId));
            if (!userDoc.exists) {
                throw new functions.https.HttpsError('not-found', 'User profile not found. Please complete your profile before redeeming an invite code.');
            }
            // Check if the tenant is already associated with this property
            const existingRelationshipQuery = await transaction.get(db.collection(PROPERTY_TENANT_RELATIONSHIPS_COLLECTION)
                .where('tenantId', '==', tenantId)
                .where('propertyId', '==', propertyId)
                .where('status', '==', 'active')
                .limit(1));
            if (!existingRelationshipQuery.empty) {
                throw new functions.https.HttpsError('already-exists', 'You are already associated with this property.');
            }
            const now = admin.firestore.Timestamp.now();
            // Create the property-tenant relationship
            const relationshipData = {
                propertyId,
                tenantId,
                unitId: unitId || undefined,
                status: 'active',
                inviteCodeId,
                startDate: now
            };
            const relationshipRef = db.collection(PROPERTY_TENANT_RELATIONSHIPS_COLLECTION).doc();
            transaction.set(relationshipRef, relationshipData);
            // Update the invite code to mark as used
            transaction.update(db.collection(INVITE_CODES_COLLECTION).doc(inviteCodeId), {
                status: 'used',
                usedBy: tenantId,
                usedAt: now
            });
            // Update the user's profile
            const userData = userDoc.data();
            const userUpdateData = {
                // Only set these if not already set
                role: (userData === null || userData === void 0 ? void 0 : userData.role) || 'tenant',
                userType: (userData === null || userData === void 0 ? void 0 : userData.userType) || 'tenant',
                updatedAt: now
            };
            // If the user doesn't have properties array, create it
            if (!(userData === null || userData === void 0 ? void 0 : userData.properties) || !Array.isArray(userData.properties)) {
                userUpdateData.properties = [{ id: propertyId, role: 'tenant' }];
            }
            else {
                // Check if property is already in user's properties
                const existingPropertyIndex = userData.properties.findIndex((p) => p.id === propertyId);
                if (existingPropertyIndex === -1) {
                    // Add property to user's properties
                    userUpdateData.properties = [
                        ...userData.properties,
                        { id: propertyId, role: 'tenant' }
                    ];
                }
            }
            transaction.update(db.collection('users').doc(tenantId), userUpdateData);
            // Update the property record if needed to include the tenant
            const updatedPropertyData = {
                updatedAt: now
            };
            // Handle unit-specific or general property assignment
            if (unitId && (propertyData === null || propertyData === void 0 ? void 0 : propertyData.units)) {
                const units = propertyData.units || [];
                const unitIndex = units.findIndex((u) => u.id === unitId || u.unitNumber === unitId);
                if (unitIndex !== -1) {
                    // Unit exists, add tenant to it
                    const updatedUnits = [...units];
                    const unit = updatedUnits[unitIndex];
                    // If unit has tenants array, add to it; otherwise create it
                    if (!unit.tenants || !Array.isArray(unit.tenants)) {
                        unit.tenants = [tenantId];
                    }
                    else if (!unit.tenants.includes(tenantId)) {
                        unit.tenants.push(tenantId);
                    }
                    updatedUnits[unitIndex] = unit;
                    updatedPropertyData.units = updatedUnits;
                }
                else {
                    // Unit doesn't exist, add it to property
                    const newUnit = {
                        id: unitId,
                        unitNumber: unitId,
                        tenants: [tenantId]
                    };
                    updatedPropertyData.units = [...units, newUnit];
                }
            }
            else {
                // No specific unit, add tenant to overall property tenants list
                let tenants = (propertyData === null || propertyData === void 0 ? void 0 : propertyData.tenants) || [];
                if (!Array.isArray(tenants)) {
                    tenants = [];
                }
                if (!tenants.includes(tenantId)) {
                    tenants.push(tenantId);
                    updatedPropertyData.tenants = tenants;
                }
            }
            transaction.update(db.collection('properties').doc(propertyId), updatedPropertyData);
            // Return success response with property details
            return {
                success: true,
                message: 'Invite code redeemed successfully',
                propertyId,
                propertyName: (propertyData === null || propertyData === void 0 ? void 0 : propertyData.name) || 'Property',
                unitId: unitId || null,
                relationshipId: relationshipRef.id
            };
        });
    }
    catch (error) {
        // Forward HttpsError errors
        if (error instanceof auth_1.HttpsError) {
            throw error;
        }
        functions.logger.error('Error redeeming invite code:', error);
        throw new functions.https.HttpsError('internal', 'An error occurred while redeeming the invite code. Please try again later.');
    }
});
//# sourceMappingURL=inviteCode.js.map