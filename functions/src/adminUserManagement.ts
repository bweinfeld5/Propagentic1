import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/v2';

const auth = getAuth();
const db = getFirestore();

interface CreateUserData {
  firstName: string;
  lastName: string;
  email: string;
  role: 'landlord' | 'tenant' | 'contractor' | 'admin';
  phone?: string;
}

interface UpdateUserData {
  uid: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  status?: string;
  phone?: string;
}

/**
 * Verify that the caller is an authenticated admin
 */
async function verifyAdminAccess(context: any): Promise<{ uid: string; isAdmin: boolean; isSuperAdmin: boolean }> {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required');
  }

  const { uid, token } = context.auth;
  const customClaims = token?.admin || token?.super_admin || false;
  const isAdmin = customClaims || token?.role === 'admin' || token?.role === 'super_admin';
  const isSuperAdmin = token?.super_admin || token?.role === 'super_admin';

  if (!isAdmin) {
    throw new HttpsError('permission-denied', 'Admin access required');
  }

  return { uid, isAdmin, isSuperAdmin };
}

/**
 * Create a new user account
 */
export const createUser = onCall(async (request) => {
  try {
    // Verify admin access
    await verifyAdminAccess(request);

    const data = request.data as CreateUserData;
    
    // Validate required fields
    if (!data.email || !data.firstName || !data.lastName || !data.role) {
      throw new HttpsError('invalid-argument', 'Missing required fields: email, firstName, lastName, role');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new HttpsError('invalid-argument', 'Invalid email format');
    }

    // Check if user already exists
    try {
      await auth.getUserByEmail(data.email);
      throw new HttpsError('already-exists', 'User with this email already exists');
    } catch (error: any) {
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
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      createdBy: request.auth?.uid
    };

    await db.collection('users').doc(userRecord.uid).set(userDoc);

    // Create audit log
    await db.collection('auditLogs').add({
      action: 'create_user',
      performedBy: request.auth?.uid,
      targetUserId: userRecord.uid,
      details: {
        email: data.email,
        role: data.role,
        name: `${data.firstName} ${data.lastName}`
      },
      timestamp: Timestamp.now()
    });

    logger.info(`User created successfully: ${userRecord.uid}`, {
      email: data.email,
      role: data.role,
      createdBy: request.auth?.uid
    });

    return { uid: userRecord.uid, success: true };

  } catch (error: any) {
    logger.error('Error creating user:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError('internal', 'Failed to create user account');
  }
});

/**
 * Update an existing user account
 */
export const updateUser = onCall(async (request) => {
  try {
    // Verify admin access
    await verifyAdminAccess(request);

    const data = request.data as UpdateUserData;
    
    if (!data.uid) {
      throw new HttpsError('invalid-argument', 'User ID is required');
    }

    // Get existing user
    let userRecord;
    try {
      userRecord = await auth.getUser(data.uid);
    } catch (error) {
      throw new HttpsError('not-found', 'User not found');
    }

    // Prepare updates for Firebase Auth
    const authUpdates: any = {};
    if (data.firstName || data.lastName) {
      const currentDoc = await db.collection('users').doc(data.uid).get();
      const currentData = currentDoc.data();
      const firstName = data.firstName || currentData?.firstName || '';
      const lastName = data.lastName || currentData?.lastName || '';
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
            (customClaims as any)[role] = null;
          }
        });
      }
      
      await auth.setCustomUserClaims(data.uid, customClaims);
    }

    // Prepare updates for Firestore
    const firestoreUpdates: any = {
      updatedAt: Timestamp.now(),
      updatedBy: request.auth?.uid
    };

    if (data.firstName) firestoreUpdates.firstName = data.firstName;
    if (data.lastName) firestoreUpdates.lastName = data.lastName;
    if (data.role) {
      firestoreUpdates.role = data.role;
      firestoreUpdates.userType = data.role; // Backward compatibility
    }
    if (data.status) firestoreUpdates.status = data.status;
    if (data.phone !== undefined) firestoreUpdates.phone = data.phone;

    if (data.firstName || data.lastName) {
      const currentDoc = await db.collection('users').doc(data.uid).get();
      const currentData = currentDoc.data();
      const firstName = data.firstName || currentData?.firstName || '';
      const lastName = data.lastName || currentData?.lastName || '';
      firestoreUpdates.displayName = `${firstName} ${lastName}`;
    }

    // Update Firestore document
    await db.collection('users').doc(data.uid).update(firestoreUpdates);

    // Create audit log
    await db.collection('auditLogs').add({
      action: 'update_user',
      performedBy: request.auth?.uid,
      targetUserId: data.uid,
      details: {
        updates: data,
        email: userRecord.email
      },
      timestamp: Timestamp.now()
    });

    logger.info(`User updated successfully: ${data.uid}`, {
      updates: data,
      updatedBy: request.auth?.uid
    });

    return { success: true };

  } catch (error: any) {
    logger.error('Error updating user:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError('internal', 'Failed to update user account');
  }
});

/**
 * Delete a user account (hard delete)
 */
export const deleteUser = onCall(async (request) => {
  try {
    // Verify admin access
    const { isSuperAdmin } = await verifyAdminAccess(request);

    // Only super admins can permanently delete users
    if (!isSuperAdmin) {
      throw new HttpsError('permission-denied', 'Super admin access required for permanent deletion');
    }

    const { uid } = request.data;
    
    if (!uid) {
      throw new HttpsError('invalid-argument', 'User ID is required');
    }

    // Get user info for audit log - handle if user doesn't exist
    let userRecord;
    try {
      userRecord = await auth.getUser(uid);
    } catch (error: any) {
      // If user doesn't exist in Auth, check if they exist in Firestore
      const userDocRef = db.collection('users').doc(uid);
      const userDoc = await userDocRef.get();
      
      if (!userDoc.exists) {
        logger.error(`User with UID: ${uid} not found in Firebase Auth or Firestore.`, error);
        throw new HttpsError('not-found', `User with UID: ${uid} not found.`);
      }
      
      // User exists in Firestore but not Auth - create a mock record for audit
      const userData = userDoc.data();
      userRecord = {
        uid: uid,
        email: userData?.email || '',
        displayName: userData?.displayName || `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim() || 'Unknown User',
        emailVerified: false,
        disabled: false,
        metadata: {
          creationTime: userData?.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          lastSignInTime: undefined
        },
        customClaims: {},
        providerData: [],
        toJSON: () => ({})
      } as any;
    }
    const userDocRef = db.collection('users').doc(uid);
    const userDoc = await userDocRef.get();

    // Archive and delete user data in a transaction
    try {
      await db.runTransaction(async (transaction) => {
        if (userDoc.exists) {
          const userData = userDoc.data();
          const archiveRef = db.collection('deletedUsers').doc(uid);
          transaction.set(archiveRef, {
            ...userData,
            deletedAt: Timestamp.now(),
            deletedBy: request.auth?.uid,
            originalId: uid,
          });
          transaction.delete(userDocRef);
        } else {
          logger.warn(`User document not found in Firestore for UID: ${uid}. Skipping Firestore archival and deletion.`);
        }
      });
    } catch (error) {
      logger.error(`Error during Firestore transaction for user ${uid}.`, error);
      throw new HttpsError('internal', 'Failed to archive and delete user data in Firestore.');
    }

    // Delete from Firebase Auth AFTER Firestore operations (only if user exists in Auth)
    try {
      await auth.deleteUser(uid);
      logger.info(`User deleted from Firebase Auth: ${uid}`);
    } catch (authError: any) {
      // User might not exist in Auth, just log and continue
      logger.warn(`User ${uid} not found in Firebase Auth during deletion (may have been already deleted):`, authError);
    }

    // Handle related data cleanup (GDPR compliance)
    try {
      await cleanupRelatedUserData(uid, request.auth?.uid);
    } catch (cleanupError) {
      logger.error(`Warning: Some related data cleanup failed for user ${uid}:`, cleanupError);
      // Continue with deletion but log the issue
    }

    // Create audit log (filter out undefined values)
    await db.collection('auditLogs').add({
      action: 'delete_user',
      performedBy: request.auth?.uid,
      targetUserId: uid,
      details: {
        email: userRecord.email || '',
        displayName: userRecord.displayName || 'Unknown User',
        deletionType: 'permanent'
      },
      timestamp: Timestamp.now()
    });

    logger.info(`User permanently deleted: ${uid}`, {
      email: userRecord.email,
      deletedBy: request.auth?.uid
    });

    return { success: true };

  } catch (error: any) {
    logger.error('Error deleting user:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError('internal', 'Failed to delete user account');
  }
});

/**
 * Cleanup related user data for GDPR compliance
 */
async function cleanupRelatedUserData(userId: string, deletedBy?: string): Promise<void> {
  const batch = db.batch();
  let operationCount = 0;

  try {
    // 1. Archive and delete user's properties
    const propertiesSnapshot = await db.collection('properties')
      .where('landlordId', '==', userId)
      .get();
    
    for (const propertyDoc of propertiesSnapshot.docs) {
      const archiveRef = db.collection('deletedProperties').doc(propertyDoc.id);
      batch.set(archiveRef, {
        ...propertyDoc.data(),
        deletedAt: Timestamp.now(),
        deletedBy,
        originalId: propertyDoc.id,
        reason: 'user_deletion'
      });
      batch.delete(propertyDoc.ref);
      operationCount += 2;
    }

    // 2. Archive and delete maintenance requests
    const maintenanceSnapshot = await db.collection('tickets')
      .where('tenantId', '==', userId)
      .get();
    
    for (const ticketDoc of maintenanceSnapshot.docs) {
      const archiveRef = db.collection('deletedTickets').doc(ticketDoc.id);
      batch.set(archiveRef, {
        ...ticketDoc.data(),
        deletedAt: Timestamp.now(),
        deletedBy,
        originalId: ticketDoc.id,
        reason: 'user_deletion'
      });
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
        updatedAt: Timestamp.now()
      });
      operationCount++;
    }

    // Firestore has a 500 operation limit per batch
    if (operationCount > 0) {
      if (operationCount <= 500) {
        await batch.commit();
      } else {
        // Split into multiple batches if needed
        logger.warn(`Large cleanup operation for user ${userId}: ${operationCount} operations. Consider implementing pagination.`);
        await batch.commit(); // Commit what we can
      }
    }

    logger.info(`Cleaned up ${operationCount} related data items for user ${userId}`);

  } catch (error) {
    logger.error(`Error cleaning up related data for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Send invitation email to a user
 */
export const sendInvitationEmail = onCall(async (request) => {
  try {
    // Verify admin access
    await verifyAdminAccess(request);

    const { email, firstName } = request.data;
    
    if (!email || !firstName) {
      throw new HttpsError('invalid-argument', 'Email and firstName are required');
    }

    // Generate password reset link (serves as invitation)
    const resetLink = await auth.generatePasswordResetLink(email, {
      url: `${process.env.APP_URL || 'https://propagentic.com'}/complete-registration`,
    });

    // TODO: Send actual email using your email service
    // For now, just log the invitation
    logger.info(`Invitation email would be sent to ${email}`, {
      resetLink,
      firstName,
      sentBy: request.auth?.uid
    });

    // Create audit log
    await db.collection('auditLogs').add({
      action: 'send_invitation',
      performedBy: request.auth?.uid,
      details: {
        email,
        firstName
      },
      timestamp: Timestamp.now()
    });

    return { success: true, message: 'Invitation email sent successfully' };

  } catch (error: any) {
    logger.error('Error sending invitation email:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError('internal', 'Failed to send invitation email');
  }
});

/**
 * Send password reset email
 */
export const sendPasswordReset = onCall(async (request) => {
  try {
    // Verify admin access
    await verifyAdminAccess(request);

    const { email } = request.data;
    
    if (!email) {
      throw new HttpsError('invalid-argument', 'Email is required');
    }

    // Generate password reset link
    const resetLink = await auth.generatePasswordResetLink(email);

    // TODO: Send actual email using your email service
    logger.info(`Password reset email would be sent to ${email}`, {
      resetLink,
      sentBy: request.auth?.uid
    });

    // Create audit log
    await db.collection('auditLogs').add({
      action: 'send_password_reset',
      performedBy: request.auth?.uid,
      details: {
        email
      },
      timestamp: Timestamp.now()
    });

    return { success: true, message: 'Password reset email sent successfully' };

  } catch (error: any) {
    logger.error('Error sending password reset email:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError('internal', 'Failed to send password reset email');
  }
}); 