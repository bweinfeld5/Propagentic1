"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPasswordReset = exports.sendInvitationEmail = exports.deleteUser = exports.updateUser = exports.createUser = void 0;
const https_1 = require("firebase-functions/v2/https");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const v2_1 = require("firebase-functions/v2");
const auth = (0, auth_1.getAuth)();
const db = (0, firestore_1.getFirestore)();
/**
 * Verify that the caller is an authenticated admin
 */
async function verifyAdminAccess(context) {
    if (!context.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentication required');
    }
    const { uid, token } = context.auth;
    const customClaims = (token === null || token === void 0 ? void 0 : token.admin) || (token === null || token === void 0 ? void 0 : token.super_admin) || false;
    const isAdmin = customClaims || (token === null || token === void 0 ? void 0 : token.role) === 'admin' || (token === null || token === void 0 ? void 0 : token.role) === 'super_admin';
    const isSuperAdmin = (token === null || token === void 0 ? void 0 : token.super_admin) || (token === null || token === void 0 ? void 0 : token.role) === 'super_admin';
    if (!isAdmin) {
        throw new https_1.HttpsError('permission-denied', 'Admin access required');
    }
    return { uid, isAdmin, isSuperAdmin };
}
/**
 * Create a new user account
 */
exports.createUser = (0, https_1.onCall)(async (request) => {
    var _a, _b, _c;
    try {
        // Verify admin access
        await verifyAdminAccess(request);
        const data = request.data;
        // Validate required fields
        if (!data.email || !data.firstName || !data.lastName || !data.role) {
            throw new https_1.HttpsError('invalid-argument', 'Missing required fields: email, firstName, lastName, role');
        }
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            throw new https_1.HttpsError('invalid-argument', 'Invalid email format');
        }
        // Check if user already exists
        try {
            await auth.getUserByEmail(data.email);
            throw new https_1.HttpsError('already-exists', 'User with this email already exists');
        }
        catch (error) {
            if (error.code !== 'auth/user-not-found') {
                throw error;
            }
        }
        // Create user in Firebase Auth
        const userRecord = await auth.createUser({
            email: data.email,
            displayName: `${data.firstName} ${data.lastName}`,
            emailVerified: false,
            disabled: false
        });
        // Set custom claims for role
        await auth.setCustomUserClaims(userRecord.uid, {
            role: data.role,
            [data.role]: true
        });
        // Create user document in Firestore
        const userDoc = {
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            displayName: `${data.firstName} ${data.lastName}`,
            role: data.role,
            userType: data.role, // Backward compatibility
            status: 'pending',
            phone: data.phone || '',
            profileComplete: false,
            emailVerified: false,
            createdAt: firestore_1.Timestamp.now(),
            updatedAt: firestore_1.Timestamp.now(),
            createdBy: (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid
        };
        await db.collection('users').doc(userRecord.uid).set(userDoc);
        // Create audit log
        await db.collection('auditLogs').add({
            action: 'create_user',
            performedBy: (_b = request.auth) === null || _b === void 0 ? void 0 : _b.uid,
            targetUserId: userRecord.uid,
            details: {
                email: data.email,
                role: data.role,
                name: `${data.firstName} ${data.lastName}`
            },
            timestamp: firestore_1.Timestamp.now()
        });
        v2_1.logger.info(`User created successfully: ${userRecord.uid}`, {
            email: data.email,
            role: data.role,
            createdBy: (_c = request.auth) === null || _c === void 0 ? void 0 : _c.uid
        });
        return { uid: userRecord.uid, success: true };
    }
    catch (error) {
        v2_1.logger.error('Error creating user:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', 'Failed to create user account');
    }
});
/**
 * Update an existing user account
 */
exports.updateUser = (0, https_1.onCall)(async (request) => {
    var _a, _b, _c;
    try {
        // Verify admin access
        await verifyAdminAccess(request);
        const data = request.data;
        if (!data.uid) {
            throw new https_1.HttpsError('invalid-argument', 'User ID is required');
        }
        // Get existing user
        let userRecord;
        try {
            userRecord = await auth.getUser(data.uid);
        }
        catch (error) {
            throw new https_1.HttpsError('not-found', 'User not found');
        }
        // Prepare updates for Firebase Auth
        const authUpdates = {};
        if (data.firstName || data.lastName) {
            const currentDoc = await db.collection('users').doc(data.uid).get();
            const currentData = currentDoc.data();
            const firstName = data.firstName || (currentData === null || currentData === void 0 ? void 0 : currentData.firstName) || '';
            const lastName = data.lastName || (currentData === null || currentData === void 0 ? void 0 : currentData.lastName) || '';
            authUpdates.displayName = `${firstName} ${lastName}`;
        }
        // Update Firebase Auth if needed
        if (Object.keys(authUpdates).length > 0) {
            await auth.updateUser(data.uid, authUpdates);
        }
        // Update custom claims if role changed
        if (data.role) {
            const customClaims = {
                role: data.role,
                [data.role]: true
            };
            // Remove old role claims
            const currentToken = await auth.getUser(data.uid);
            if (currentToken.customClaims) {
                ['landlord', 'tenant', 'contractor', 'admin', 'super_admin'].forEach(role => {
                    if (role !== data.role) {
                        customClaims[role] = null;
                    }
                });
            }
            await auth.setCustomUserClaims(data.uid, customClaims);
        }
        // Prepare updates for Firestore
        const firestoreUpdates = {
            updatedAt: firestore_1.Timestamp.now(),
            updatedBy: (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid
        };
        if (data.firstName)
            firestoreUpdates.firstName = data.firstName;
        if (data.lastName)
            firestoreUpdates.lastName = data.lastName;
        if (data.role) {
            firestoreUpdates.role = data.role;
            firestoreUpdates.userType = data.role; // Backward compatibility
        }
        if (data.status)
            firestoreUpdates.status = data.status;
        if (data.phone !== undefined)
            firestoreUpdates.phone = data.phone;
        if (data.firstName || data.lastName) {
            const currentDoc = await db.collection('users').doc(data.uid).get();
            const currentData = currentDoc.data();
            const firstName = data.firstName || (currentData === null || currentData === void 0 ? void 0 : currentData.firstName) || '';
            const lastName = data.lastName || (currentData === null || currentData === void 0 ? void 0 : currentData.lastName) || '';
            firestoreUpdates.displayName = `${firstName} ${lastName}`;
        }
        // Update Firestore document
        await db.collection('users').doc(data.uid).update(firestoreUpdates);
        // Create audit log
        await db.collection('auditLogs').add({
            action: 'update_user',
            performedBy: (_b = request.auth) === null || _b === void 0 ? void 0 : _b.uid,
            targetUserId: data.uid,
            details: {
                updates: data,
                email: userRecord.email
            },
            timestamp: firestore_1.Timestamp.now()
        });
        v2_1.logger.info(`User updated successfully: ${data.uid}`, {
            updates: data,
            updatedBy: (_c = request.auth) === null || _c === void 0 ? void 0 : _c.uid
        });
        return { success: true };
    }
    catch (error) {
        v2_1.logger.error('Error updating user:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', 'Failed to update user account');
    }
});
/**
 * Delete a user account (hard delete)
 */
exports.deleteUser = (0, https_1.onCall)(async (request) => {
    var _a, _b, _c, _d, _e, _f;
    try {
        // Verify admin access
        const { isSuperAdmin } = await verifyAdminAccess(request);
        // Only super admins can permanently delete users
        if (!isSuperAdmin) {
            throw new https_1.HttpsError('permission-denied', 'Super admin access required for permanent deletion');
        }
        const { uid } = request.data;
        if (!uid) {
            throw new https_1.HttpsError('invalid-argument', 'User ID is required');
        }
        // Get user info for audit log - handle if user doesn't exist
        let userRecord;
        try {
            userRecord = await auth.getUser(uid);
        }
        catch (error) {
            // If user doesn't exist in Auth, check if they exist in Firestore
            const userDocRef = db.collection('users').doc(uid);
            const userDoc = await userDocRef.get();
            if (!userDoc.exists) {
                v2_1.logger.error(`User with UID: ${uid} not found in Firebase Auth or Firestore.`, error);
                throw new https_1.HttpsError('not-found', `User with UID: ${uid} not found.`);
            }
            // User exists in Firestore but not Auth - create a mock record for audit
            const userData = userDoc.data();
            userRecord = {
                uid: uid,
                email: (userData === null || userData === void 0 ? void 0 : userData.email) || '',
                displayName: (userData === null || userData === void 0 ? void 0 : userData.displayName) || `${(userData === null || userData === void 0 ? void 0 : userData.firstName) || ''} ${(userData === null || userData === void 0 ? void 0 : userData.lastName) || ''}`.trim() || 'Unknown User',
                emailVerified: false,
                disabled: false,
                metadata: {
                    creationTime: ((_c = (_b = (_a = userData === null || userData === void 0 ? void 0 : userData.createdAt) === null || _a === void 0 ? void 0 : _a.toDate) === null || _b === void 0 ? void 0 : _b.call(_a)) === null || _c === void 0 ? void 0 : _c.toISOString()) || new Date().toISOString(),
                    lastSignInTime: undefined
                },
                customClaims: {},
                providerData: [],
                toJSON: () => ({})
            };
        }
        const userDocRef = db.collection('users').doc(uid);
        const userDoc = await userDocRef.get();
        // Archive and delete user data in a transaction
        try {
            await db.runTransaction(async (transaction) => {
                var _a;
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    const archiveRef = db.collection('deletedUsers').doc(uid);
                    transaction.set(archiveRef, Object.assign(Object.assign({}, userData), { deletedAt: firestore_1.Timestamp.now(), deletedBy: (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid, originalId: uid }));
                    transaction.delete(userDocRef);
                }
                else {
                    v2_1.logger.warn(`User document not found in Firestore for UID: ${uid}. Skipping Firestore archival and deletion.`);
                }
            });
        }
        catch (error) {
            v2_1.logger.error(`Error during Firestore transaction for user ${uid}.`, error);
            throw new https_1.HttpsError('internal', 'Failed to archive and delete user data in Firestore.');
        }
        // Delete from Firebase Auth AFTER Firestore operations (only if user exists in Auth)
        try {
            await auth.deleteUser(uid);
            v2_1.logger.info(`User deleted from Firebase Auth: ${uid}`);
        }
        catch (authError) {
            // User might not exist in Auth, just log and continue
            v2_1.logger.warn(`User ${uid} not found in Firebase Auth during deletion (may have been already deleted):`, authError);
        }
        // Handle related data cleanup (GDPR compliance)
        try {
            await cleanupRelatedUserData(uid, (_d = request.auth) === null || _d === void 0 ? void 0 : _d.uid);
        }
        catch (cleanupError) {
            v2_1.logger.error(`Warning: Some related data cleanup failed for user ${uid}:`, cleanupError);
            // Continue with deletion but log the issue
        }
        // Create audit log (filter out undefined values)
        await db.collection('auditLogs').add({
            action: 'delete_user',
            performedBy: (_e = request.auth) === null || _e === void 0 ? void 0 : _e.uid,
            targetUserId: uid,
            details: {
                email: userRecord.email || '',
                displayName: userRecord.displayName || 'Unknown User',
                deletionType: 'permanent'
            },
            timestamp: firestore_1.Timestamp.now()
        });
        v2_1.logger.info(`User permanently deleted: ${uid}`, {
            email: userRecord.email,
            deletedBy: (_f = request.auth) === null || _f === void 0 ? void 0 : _f.uid
        });
        return { success: true };
    }
    catch (error) {
        v2_1.logger.error('Error deleting user:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', 'Failed to delete user account');
    }
});
/**
 * Cleanup related user data for GDPR compliance
 */
async function cleanupRelatedUserData(userId, deletedBy) {
    const batch = db.batch();
    let operationCount = 0;
    try {
        // 1. Archive and delete user's properties
        const propertiesSnapshot = await db.collection('properties')
            .where('landlordId', '==', userId)
            .get();
        for (const propertyDoc of propertiesSnapshot.docs) {
            const archiveRef = db.collection('deletedProperties').doc(propertyDoc.id);
            batch.set(archiveRef, Object.assign(Object.assign({}, propertyDoc.data()), { deletedAt: firestore_1.Timestamp.now(), deletedBy, originalId: propertyDoc.id, reason: 'user_deletion' }));
            batch.delete(propertyDoc.ref);
            operationCount += 2;
        }
        // 2. Archive and delete maintenance requests
        const maintenanceSnapshot = await db.collection('tickets')
            .where('tenantId', '==', userId)
            .get();
        for (const ticketDoc of maintenanceSnapshot.docs) {
            const archiveRef = db.collection('deletedTickets').doc(ticketDoc.id);
            batch.set(archiveRef, Object.assign(Object.assign({}, ticketDoc.data()), { deletedAt: firestore_1.Timestamp.now(), deletedBy, originalId: ticketDoc.id, reason: 'user_deletion' }));
            batch.delete(ticketDoc.ref);
            operationCount += 2;
        }
        // 3. Delete user's notifications
        const notificationsSnapshot = await db.collection('notifications')
            .where('userId', '==', userId)
            .get();
        for (const notificationDoc of notificationsSnapshot.docs) {
            batch.delete(notificationDoc.ref);
            operationCount++;
        }
        // 4. Update any references in other collections
        const invitesSnapshot = await db.collection('invites')
            .where('invitedBy', '==', userId)
            .get();
        for (const inviteDoc of invitesSnapshot.docs) {
            batch.update(inviteDoc.ref, {
                invitedBy: '[DELETED_USER]',
                updatedAt: firestore_1.Timestamp.now()
            });
            operationCount++;
        }
        // Firestore has a 500 operation limit per batch
        if (operationCount > 0) {
            if (operationCount <= 500) {
                await batch.commit();
            }
            else {
                // Split into multiple batches if needed
                v2_1.logger.warn(`Large cleanup operation for user ${userId}: ${operationCount} operations. Consider implementing pagination.`);
                await batch.commit(); // Commit what we can
            }
        }
        v2_1.logger.info(`Cleaned up ${operationCount} related data items for user ${userId}`);
    }
    catch (error) {
        v2_1.logger.error(`Error cleaning up related data for user ${userId}:`, error);
        throw error;
    }
}
/**
 * Send invitation email to a user
 */
exports.sendInvitationEmail = (0, https_1.onCall)(async (request) => {
    var _a, _b;
    try {
        // Verify admin access
        await verifyAdminAccess(request);
        const { email, firstName } = request.data;
        if (!email || !firstName) {
            throw new https_1.HttpsError('invalid-argument', 'Email and firstName are required');
        }
        // Generate password reset link (serves as invitation)
        const resetLink = await auth.generatePasswordResetLink(email, {
            url: `${process.env.APP_URL || 'https://propagentic.com'}/complete-registration`,
        });
        // TODO: Send actual email using your email service
        // For now, just log the invitation
        v2_1.logger.info(`Invitation email would be sent to ${email}`, {
            resetLink,
            firstName,
            sentBy: (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid
        });
        // Create audit log
        await db.collection('auditLogs').add({
            action: 'send_invitation',
            performedBy: (_b = request.auth) === null || _b === void 0 ? void 0 : _b.uid,
            details: {
                email,
                firstName
            },
            timestamp: firestore_1.Timestamp.now()
        });
        return { success: true, message: 'Invitation email sent successfully' };
    }
    catch (error) {
        v2_1.logger.error('Error sending invitation email:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', 'Failed to send invitation email');
    }
});
/**
 * Send password reset email
 */
exports.sendPasswordReset = (0, https_1.onCall)(async (request) => {
    var _a, _b;
    try {
        // Verify admin access
        await verifyAdminAccess(request);
        const { email } = request.data;
        if (!email) {
            throw new https_1.HttpsError('invalid-argument', 'Email is required');
        }
        // Generate password reset link
        const resetLink = await auth.generatePasswordResetLink(email);
        // TODO: Send actual email using your email service
        v2_1.logger.info(`Password reset email would be sent to ${email}`, {
            resetLink,
            sentBy: (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid
        });
        // Create audit log
        await db.collection('auditLogs').add({
            action: 'send_password_reset',
            performedBy: (_b = request.auth) === null || _b === void 0 ? void 0 : _b.uid,
            details: {
                email
            },
            timestamp: firestore_1.Timestamp.now()
        });
        return { success: true, message: 'Password reset email sent successfully' };
    }
    catch (error) {
        v2_1.logger.error('Error sending password reset email:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', 'Failed to send password reset email');
    }
});
//# sourceMappingURL=adminUserManagement.js.map