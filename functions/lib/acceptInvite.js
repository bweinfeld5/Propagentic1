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
exports.acceptInvite = exports.validateInviteCode = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const logger = __importStar(require("firebase-functions/logger"));
const db = admin.firestore();
/**
 * Validate an invite code and return invite details
 */
exports.validateInviteCode = functions.https.onCall(async (data, context) => {
    var _a;
    const { inviteCode } = data;
    if (!inviteCode) {
        throw new functions.https.HttpsError('invalid-argument', 'Invite code is required');
    }
    try {
        const inviteQuery = await db.collection('invites')
            .where('code', '==', inviteCode)
            .where('status', '==', 'sent')
            .limit(1)
            .get();
        if (inviteQuery.empty) {
            throw new functions.https.HttpsError('not-found', 'Invalid invite code');
        }
        const inviteDoc = inviteQuery.docs[0];
        const invite = inviteDoc.data();
        // Check expiration (48 hours from email sent)
        const emailSentAt = (_a = invite.emailSentAt) === null || _a === void 0 ? void 0 : _a.toDate();
        if (!emailSentAt) {
            throw new functions.https.HttpsError('failed-precondition', 'Invalid invite data');
        }
        const expiresAt = new Date(emailSentAt.getTime() + (48 * 60 * 60 * 1000));
        if (new Date() > expiresAt) {
            // Update invite status to expired
            await inviteDoc.ref.update({ status: 'expired' });
            throw new functions.https.HttpsError('deadline-exceeded', 'Invite has expired');
        }
        return {
            inviteId: inviteDoc.id,
            propertyName: invite.propertyName,
            landlordName: invite.landlordName,
            tenantEmail: invite.tenantEmail,
            propertyId: invite.propertyId,
            landlordId: invite.landlordId
        };
    }
    catch (error) {
        logger.error('Error validating invite code:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Failed to validate invite code');
    }
});
/**
 * Accept an invitation and create tenant account
 */
exports.acceptInvite = functions.https.onCall(async (data, context) => {
    var _a;
    const { inviteCode, firstName, lastName, password, email } = data;
    if (!inviteCode || !firstName || !lastName || !password || !email) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }
    try {
        // 1. Validate invite code first - extract the validation logic
        const inviteQuery = await db.collection('invites')
            .where('code', '==', inviteCode)
            .where('status', '==', 'sent')
            .limit(1)
            .get();
        if (inviteQuery.empty) {
            throw new functions.https.HttpsError('not-found', 'Invalid invite code');
        }
        const inviteDoc = inviteQuery.docs[0];
        const invite = inviteDoc.data();
        // Check expiration (48 hours from email sent)
        const emailSentAt = (_a = invite.emailSentAt) === null || _a === void 0 ? void 0 : _a.toDate();
        if (!emailSentAt) {
            throw new functions.https.HttpsError('failed-precondition', 'Invalid invite data');
        }
        const expiresAt = new Date(emailSentAt.getTime() + (48 * 60 * 60 * 1000));
        if (new Date() > expiresAt) {
            // Update invite status to expired
            await inviteDoc.ref.update({ status: 'expired' });
            throw new functions.https.HttpsError('deadline-exceeded', 'Invite has expired');
        }
        const inviteValidation = {
            inviteId: inviteDoc.id,
            propertyName: invite.propertyName,
            landlordName: invite.landlordName,
            tenantEmail: invite.tenantEmail,
            propertyId: invite.propertyId,
            landlordId: invite.landlordId
        };
        // 2. Create Firebase Auth user
        const userRecord = await admin.auth().createUser({
            email: email,
            password: password,
            displayName: `${firstName} ${lastName}`,
            emailVerified: false
        });
        // 3. Create user document in Firestore
        const userData = {
            uid: userRecord.uid,
            email: email,
            firstName: firstName,
            lastName: lastName,
            role: 'tenant',
            onboardingCompleted: false,
            acceptedInviteId: inviteValidation.inviteId,
            associatedProperties: [inviteValidation.propertyId],
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        await db.collection('users').doc(userRecord.uid).set(userData);
        // 4. Update invite status
        await db.collection('invites').doc(inviteValidation.inviteId).update({
            status: 'accepted',
            acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
            acceptedByUserId: userRecord.uid
        });
        // 5. Create tenant-property relationship
        await db.collection('properties').doc(inviteValidation.propertyId)
            .collection('tenants').doc(userRecord.uid).set({
            userId: userRecord.uid,
            inviteId: inviteValidation.inviteId,
            joinedAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'active',
            firstName: firstName,
            lastName: lastName,
            email: email
        });
        // 6. Create notification for landlord
        await db.collection('notifications').add({
            type: 'tenant_accepted',
            landlordId: inviteValidation.landlordId,
            propertyId: inviteValidation.propertyId,
            tenantId: userRecord.uid,
            tenantName: `${firstName} ${lastName}`,
            message: `${firstName} ${lastName} has accepted your invitation to join ${inviteValidation.propertyName}`,
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        logger.info(`Tenant account created successfully for ${email}`);
        return {
            success: true,
            userId: userRecord.uid,
            redirectUrl: '/tenant/onboarding'
        };
    }
    catch (error) {
        logger.error('Error accepting invite:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Failed to accept invitation');
    }
});
//# sourceMappingURL=acceptInvite.js.map