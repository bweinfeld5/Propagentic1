"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fixSuperAdminPermissions = void 0;
const https_1 = require("firebase-functions/v2/https");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const v2_1 = require("firebase-functions/v2");
const auth = (0, auth_1.getAuth)();
const db = (0, firestore_1.getFirestore)();
exports.fixSuperAdminPermissions = (0, https_1.onCall)(async (request) => {
    try {
        v2_1.logger.info('🔧 Fixing super admin permissions...');
        const adminEmail = 'admin@propagenticai.com';
        const uid = 'VIkgEcFBXBPMi1dOwzlKlDPJHkm1';
        v2_1.logger.info(`📋 Admin Details: UID: ${uid}, Email: ${adminEmail}`);
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
            createdAt: firestore_1.Timestamp.now(),
            updatedAt: firestore_1.Timestamp.now(),
            lastLoginAt: null
        };
        v2_1.logger.info('📝 Step 1: Writing to users collection (for security rules)...');
        await db.collection('users').doc(uid).set(superAdminProfile, { merge: true });
        v2_1.logger.info('✅ Successfully written to users collection');
        v2_1.logger.info('📝 Step 2: Writing to userProfiles collection (for admin dashboard)...');
        await db.collection('userProfiles').doc(uid).set(superAdminProfile, { merge: true });
        v2_1.logger.info('✅ Successfully written to userProfiles collection');
        v2_1.logger.info('📝 Step 3: Setting custom claims in Firebase Auth...');
        try {
            await auth.setCustomUserClaims(uid, {
                role: 'super_admin',
                userType: 'super_admin',
                super_admin: true,
                admin: true,
                permissions: superAdminProfile.permissions
            });
            v2_1.logger.info('✅ Custom claims updated successfully');
        }
        catch (authError) {
            v2_1.logger.warn(`Failed to update custom claims: ${authError}`);
        }
        v2_1.logger.info('🔍 Step 4: Verifying both documents...');
        // Verify users collection
        const usersSnapshot = await db.collection('users').doc(uid).get();
        if (usersSnapshot.exists) {
            const usersData = usersSnapshot.data();
            v2_1.logger.info(`✅ Users collection verified - Role: ${usersData === null || usersData === void 0 ? void 0 : usersData.role}, UserType: ${usersData === null || usersData === void 0 ? void 0 : usersData.userType}`);
        }
        else {
            v2_1.logger.error('❌ Users collection document not found');
            throw new https_1.HttpsError('internal', 'Failed to verify users collection document');
        }
        // Verify userProfiles collection
        const userProfilesSnapshot = await db.collection('userProfiles').doc(uid).get();
        if (userProfilesSnapshot.exists) {
            const userProfilesData = userProfilesSnapshot.data();
            v2_1.logger.info(`✅ UserProfiles collection verified - Role: ${userProfilesData === null || userProfilesData === void 0 ? void 0 : userProfilesData.role}, UserType: ${userProfilesData === null || userProfilesData === void 0 ? void 0 : userProfilesData.userType}`);
        }
        else {
            v2_1.logger.error('❌ UserProfiles collection document not found');
            throw new https_1.HttpsError('internal', 'Failed to verify userProfiles collection document');
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
            timestamp: firestore_1.Timestamp.now()
        });
        v2_1.logger.info('🎉 Super admin permissions fixed successfully!');
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
    }
    catch (error) {
        v2_1.logger.error('❌ Error fixing super admin permissions:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', `Failed to fix super admin permissions: ${error.message}`);
    }
});
//# sourceMappingURL=fixSuperAdminPermissions.js.map