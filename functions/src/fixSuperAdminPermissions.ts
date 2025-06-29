import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/v2';

const auth = getAuth();
const db = getFirestore();

export const fixSuperAdminPermissions = onCall(async (request) => {
  try {
    logger.info('🔧 Fixing super admin permissions...');
    
    const adminEmail = 'admin@propagenticai.com';
    const uid = 'VIkgEcFBXBPMi1dOwzlKlDPJHkm1';
    
    logger.info(`📋 Admin Details: UID: ${uid}, Email: ${adminEmail}`);
    
    // Create super admin profile data
    const superAdminProfile = {
      uid: uid,
      email: adminEmail,
      displayName: 'PropAgentic Super Admin',
      firstName: 'PropAgentic',
      lastName: 'Super Admin',
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
      isActive: true,
      status: 'active',
      emailVerified: true,
      onboardingComplete: true,
      profileComplete: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      lastLoginAt: null
    };
    
    logger.info('📝 Step 1: Writing to users collection (for security rules)...');
    await db.collection('users').doc(uid).set(superAdminProfile, { merge: true });
    logger.info('✅ Successfully written to users collection');
    
    logger.info('📝 Step 2: Writing to userProfiles collection (for admin dashboard)...');
    await db.collection('userProfiles').doc(uid).set(superAdminProfile, { merge: true });
    logger.info('✅ Successfully written to userProfiles collection');
    
    logger.info('📝 Step 3: Setting custom claims in Firebase Auth...');
    try {
      await auth.setCustomUserClaims(uid, {
        role: 'super_admin',
        userType: 'super_admin',
        super_admin: true,
        admin: true,
        permissions: superAdminProfile.permissions
      });
      logger.info('✅ Custom claims updated successfully');
    } catch (authError) {
      logger.warn(`Failed to update custom claims: ${authError}`);
    }
    
    logger.info('🔍 Step 4: Verifying both documents...');
    
    // Verify users collection
    const usersSnapshot = await db.collection('users').doc(uid).get();
    if (usersSnapshot.exists) {
      const usersData = usersSnapshot.data();
      logger.info(`✅ Users collection verified - Role: ${usersData?.role}, UserType: ${usersData?.userType}`);
    } else {
      logger.error('❌ Users collection document not found');
      throw new HttpsError('internal', 'Failed to verify users collection document');
    }
    
    // Verify userProfiles collection
    const userProfilesSnapshot = await db.collection('userProfiles').doc(uid).get();
    if (userProfilesSnapshot.exists) {
      const userProfilesData = userProfilesSnapshot.data();
      logger.info(`✅ UserProfiles collection verified - Role: ${userProfilesData?.role}, UserType: ${userProfilesData?.userType}`);
    } else {
      logger.error('❌ UserProfiles collection document not found');
      throw new HttpsError('internal', 'Failed to verify userProfiles collection document');
    }
    
    // Create audit log
    await db.collection('auditLogs').add({
      action: 'fix_super_admin_permissions',
      performedBy: 'system',
      targetUserId: uid,
      details: {
        email: adminEmail,
        role: 'super_admin',
        method: 'admin_function'
      },
      timestamp: Timestamp.now()
    });
    
    logger.info('🎉 Super admin permissions fixed successfully!');
    
    return {
      success: true,
      message: 'Super admin permissions fixed successfully',
      details: {
        uid,
        email: adminEmail,
        role: 'super_admin',
        collections: ['users', 'userProfiles'],
        customClaims: true
      }
    };
    
  } catch (error: any) {
    logger.error('❌ Error fixing super admin permissions:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError('internal', `Failed to fix super admin permissions: ${error.message}`);
  }
}); 