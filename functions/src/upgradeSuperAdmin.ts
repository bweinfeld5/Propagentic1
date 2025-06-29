import { CallableRequest, onCall, HttpsError } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { logger } from 'firebase-functions';

// Initialize Firebase Admin (if not already initialized)
try {
  initializeApp();
} catch (error) {
  // App already initialized
}

const db = getFirestore();
const auth = getAuth();

interface UpgradeSuperAdminData {
  // No input data required - will upgrade the calling user
}

interface UpgradeSuperAdminResult {
  success: boolean;
  message: string;
  userProfile?: any;
}

export const upgradeSuperAdmin = onCall<UpgradeSuperAdminData, Promise<UpgradeSuperAdminResult>>(
  async (request: CallableRequest<UpgradeSuperAdminData>) => {
    try {
      // Verify the user is authenticated
      if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated to upgrade to super admin');
      }

      const uid = request.auth.uid;
      const email = request.auth.token.email;

      logger.info(`Super admin upgrade requested by user: ${uid} (${email})`);

      // Get the current user profile
      const userProfileRef = db.collection('users').doc(uid);
      const userProfileDoc = await userProfileRef.get();

      if (!userProfileDoc.exists) {
        throw new HttpsError('not-found', 'User profile not found');
      }

      const currentProfile = userProfileDoc.data()!;

      // Check if user is already a super admin
      if (currentProfile.role === 'super_admin') {
        return {
          success: true,
          message: 'User is already a super admin',
          userProfile: currentProfile
        };
      }

      // Check if user is at least an admin
      if (currentProfile.role !== 'admin') {
        throw new HttpsError('permission-denied', 'Only admin users can be upgraded to super admin');
      }

      // Prepare super admin profile data
      const superAdminProfile = {
        ...currentProfile,
        role: 'super_admin',
        userType: 'super_admin',
        permissions: [
          'read_users',
          'write_users', 
          'delete_users',
          'read_system_config',
          'write_system_config',
          'read_audit_logs',
          'write_audit_logs',
          'manage_roles',
          'system_maintenance',
          'security_monitoring'
        ],
        updatedAt: new Date().toISOString(),
        upgradedToSuperAdminAt: new Date().toISOString()
      };

      // Update the user profile in Firestore
      await userProfileRef.set(superAdminProfile, { merge: true });

      // Update Firebase Auth custom claims
      try {
        await auth.setCustomUserClaims(uid, {
          role: 'super_admin',
          userType: 'super_admin',
          permissions: superAdminProfile.permissions
        });
        logger.info(`Custom claims updated for user: ${uid}`);
      } catch (authError) {
        logger.warn(`Failed to update custom claims for user ${uid}:`, authError);
        // Don't fail the function if custom claims update fails
      }

      // Log the upgrade action for audit trail
      const auditLogRef = db.collection('auditLogs').doc();
      await auditLogRef.set({
        action: 'upgrade_super_admin',
        performedBy: uid,
        performedByEmail: email,
        targetUser: uid,
        targetUserEmail: email,
        timestamp: new Date().toISOString(),
        details: {
          previousRole: currentProfile.role,
          newRole: 'super_admin',
          method: 'self_upgrade_function'
        }
      });

      logger.info(`Successfully upgraded user ${uid} (${email}) to super admin`);

      return {
        success: true,
        message: 'Successfully upgraded to super admin',
        userProfile: superAdminProfile
      };

    } catch (error: any) {
      logger.error('Error upgrading to super admin:', error);
      
      if (error instanceof HttpsError) {
        throw error;
      }
      
      throw new HttpsError('internal', `Failed to upgrade to super admin: ${error.message}`);
    }
  }
); 