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
exports.searchTenants = exports.getAllTenants = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const logger = __importStar(require("firebase-functions/logger"));
/**
 * Cloud Function: getAllTenants
 * Allows authenticated landlords to retrieve tenant data for invitation purposes
 */
exports.getAllTenants = (0, https_1.onCall)(async (request) => {
    try {
        // Check if user is authenticated
        if (!request.auth) {
            logger.warn("❌ Unauthorized access attempt to getAllTenants");
            throw new https_1.HttpsError("unauthenticated", "Authentication required");
        }
        const uid = request.auth.uid;
        const email = request.auth.token.email;
        logger.info(`📋 getAllTenants called by user: ${email} (${uid})`);
        // Verify the caller is a landlord
        const callerDoc = await admin.firestore().collection('users').doc(uid).get();
        if (!callerDoc.exists) {
            logger.warn(`❌ User document not found for: ${email}`);
            throw new https_1.HttpsError("not-found", "User profile not found");
        }
        const callerData = callerDoc.data();
        const isLandlord = (callerData === null || callerData === void 0 ? void 0 : callerData.role) === 'landlord' || (callerData === null || callerData === void 0 ? void 0 : callerData.userType) === 'landlord';
        if (!isLandlord) {
            logger.warn(`❌ Non-landlord attempted to access tenant data: ${email} (role: ${callerData === null || callerData === void 0 ? void 0 : callerData.role})`);
            throw new https_1.HttpsError("permission-denied", "Access denied: Landlord privileges required");
        }
        logger.info(`✅ Verified landlord access for: ${email}`);
        // Extract parameters
        const { searchQuery, limit = 100 } = request.data;
        const searchLimit = Math.min(limit, 500); // Cap at 500 for performance
        // Query tenants from Firestore
        const usersRef = admin.firestore().collection('users');
        // Create queries for both role-based and userType-based tenant identification
        const roleQuery = usersRef.where('role', '==', 'tenant').limit(searchLimit);
        const userTypeQuery = usersRef.where('userType', '==', 'tenant').limit(searchLimit);
        logger.info(`🔍 Querying tenants with limit: ${searchLimit}, search: "${searchQuery || 'none'}"`);
        // Execute both queries
        const [roleSnapshot, userTypeSnapshot] = await Promise.all([
            roleQuery.get(),
            userTypeQuery.get()
        ]);
        // Combine and deduplicate results
        const tenantMap = new Map();
        // Process role-based tenants
        roleSnapshot.forEach(doc => {
            const data = doc.data();
            tenantMap.set(doc.id, {
                uid: doc.id,
                email: data.email || '',
                name: data.name,
                firstName: data.firstName,
                lastName: data.lastName,
                displayName: data.displayName,
                role: data.role || 'tenant',
                userType: data.userType,
                status: data.status || 'active',
                phone: data.phone,
                createdAt: data.createdAt,
                lastLoginAt: data.lastLoginAt
            });
        });
        // Process userType-based tenants (avoid duplicates)
        userTypeSnapshot.forEach(doc => {
            if (!tenantMap.has(doc.id)) {
                const data = doc.data();
                tenantMap.set(doc.id, {
                    uid: doc.id,
                    email: data.email || '',
                    name: data.name,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    displayName: data.displayName,
                    role: data.role,
                    userType: data.userType || 'tenant',
                    status: data.status || 'active',
                    phone: data.phone,
                    createdAt: data.createdAt,
                    lastLoginAt: data.lastLoginAt
                });
            }
        });
        let tenants = Array.from(tenantMap.values());
        logger.info(`📊 Found ${tenants.length} unique tenants before filtering`);
        // Apply search filter if provided
        if (searchQuery && searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            tenants = tenants.filter(tenant => {
                const name = (tenant.name || tenant.displayName || `${tenant.firstName || ''} ${tenant.lastName || ''}`.trim()).toLowerCase();
                const email = (tenant.email || '').toLowerCase();
                const phone = (tenant.phone || '').toLowerCase();
                return name.includes(query) ||
                    email.includes(query) ||
                    phone.includes(query) ||
                    (tenant.firstName && tenant.firstName.toLowerCase().includes(query)) ||
                    (tenant.lastName && tenant.lastName.toLowerCase().includes(query));
            });
            logger.info(`🔍 After search filtering: ${tenants.length} tenants match "${searchQuery}"`);
        }
        // Sort tenants by name/email for consistent ordering
        tenants.sort((a, b) => {
            const nameA = (a.name || a.displayName || `${a.firstName || ''} ${a.lastName || ''}`.trim() || a.email).toLowerCase();
            const nameB = (b.name || b.displayName || `${b.firstName || ''} ${b.lastName || ''}`.trim() || b.email).toLowerCase();
            return nameA.localeCompare(nameB);
        });
        logger.info(`✅ Successfully returning ${tenants.length} tenants to landlord: ${email}`);
        // Log summary for monitoring
        const summary = {
            requestedBy: email,
            tenantCount: tenants.length,
            searchQuery: searchQuery || null,
            timestamp: new Date().toISOString()
        };
        logger.info(`📈 Tenant access summary:`, summary);
        return {
            success: true,
            tenants,
            totalCount: tenants.length,
            message: `Found ${tenants.length} tenant${tenants.length === 1 ? '' : 's'}`
        };
    }
    catch (error) {
        logger.error("❌ Error in getAllTenants function:", error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError("internal", error instanceof Error ? error.message : "Unknown error occurred");
    }
});
/**
 * Cloud Function: searchTenants
 * More focused search functionality for tenant lookup
 */
exports.searchTenants = (0, https_1.onCall)(async (request) => {
    // Check if user is authenticated
    if (!request.auth) {
        logger.warn("❌ Unauthorized access attempt to searchTenants");
        throw new https_1.HttpsError("unauthenticated", "Authentication required");
    }
    const uid = request.auth.uid;
    const email = request.auth.token.email;
    logger.info(`🔍 searchTenants called by user: ${email} (${uid}) with query: "${request.data.query}"`);
    // Verify the caller is a landlord
    const callerDoc = await admin.firestore().collection('users').doc(uid).get();
    if (!callerDoc.exists) {
        logger.warn(`❌ User document not found for: ${email}`);
        throw new https_1.HttpsError("not-found", "User profile not found");
    }
    const callerData = callerDoc.data();
    const isLandlord = (callerData === null || callerData === void 0 ? void 0 : callerData.role) === 'landlord' || (callerData === null || callerData === void 0 ? void 0 : callerData.userType) === 'landlord';
    if (!isLandlord) {
        logger.warn(`❌ Non-landlord attempted to search tenant data: ${email} (role: ${callerData === null || callerData === void 0 ? void 0 : callerData.role})`);
        throw new https_1.HttpsError("permission-denied", "Access denied: Landlord privileges required");
    }
    try {
        // Extract parameters
        const { query: searchQuery, limit = 100 } = request.data;
        const searchLimit = Math.min(limit, 500); // Cap at 500 for performance
        // Query tenants from Firestore
        const usersRef = admin.firestore().collection('users');
        // Create queries for both role-based and userType-based tenant identification
        const roleQuery = usersRef.where('role', '==', 'tenant').limit(searchLimit);
        const userTypeQuery = usersRef.where('userType', '==', 'tenant').limit(searchLimit);
        logger.info(`🔍 Searching tenants with limit: ${searchLimit}, query: "${searchQuery}"`);
        // Execute both queries
        const [roleSnapshot, userTypeSnapshot] = await Promise.all([
            roleQuery.get(),
            userTypeQuery.get()
        ]);
        // Combine and deduplicate results
        const tenantMap = new Map();
        // Process role-based tenants
        roleSnapshot.forEach(doc => {
            const data = doc.data();
            tenantMap.set(doc.id, {
                uid: doc.id,
                email: data.email || '',
                name: data.name,
                firstName: data.firstName,
                lastName: data.lastName,
                displayName: data.displayName,
                role: data.role || 'tenant',
                userType: data.userType,
                status: data.status || 'active',
                phone: data.phone,
                createdAt: data.createdAt,
                lastLoginAt: data.lastLoginAt
            });
        });
        // Process userType-based tenants (avoid duplicates)
        userTypeSnapshot.forEach(doc => {
            if (!tenantMap.has(doc.id)) {
                const data = doc.data();
                tenantMap.set(doc.id, {
                    uid: doc.id,
                    email: data.email || '',
                    name: data.name,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    displayName: data.displayName,
                    role: data.role,
                    userType: data.userType || 'tenant',
                    status: data.status || 'active',
                    phone: data.phone,
                    createdAt: data.createdAt,
                    lastLoginAt: data.lastLoginAt
                });
            }
        });
        let tenants = Array.from(tenantMap.values());
        logger.info(`📊 Found ${tenants.length} unique tenants before search filtering`);
        // Apply search filter
        if (searchQuery && searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            tenants = tenants.filter(tenant => {
                const name = (tenant.name || tenant.displayName || `${tenant.firstName || ''} ${tenant.lastName || ''}`.trim()).toLowerCase();
                const email = (tenant.email || '').toLowerCase();
                const phone = (tenant.phone || '').toLowerCase();
                return name.includes(query) ||
                    email.includes(query) ||
                    phone.includes(query) ||
                    (tenant.firstName && tenant.firstName.toLowerCase().includes(query)) ||
                    (tenant.lastName && tenant.lastName.toLowerCase().includes(query));
            });
            logger.info(`🔍 After search filtering: ${tenants.length} tenants match "${searchQuery}"`);
        }
        // Sort tenants by name/email for consistent ordering
        tenants.sort((a, b) => {
            const nameA = (a.name || a.displayName || `${a.firstName || ''} ${a.lastName || ''}`.trim() || a.email).toLowerCase();
            const nameB = (b.name || b.displayName || `${b.firstName || ''} ${b.lastName || ''}`.trim() || b.email).toLowerCase();
            return nameA.localeCompare(nameB);
        });
        logger.info(`✅ Successfully returning ${tenants.length} matching tenants to landlord: ${email}`);
        return {
            success: true,
            tenants,
            totalCount: tenants.length,
            message: `Found ${tenants.length} tenant${tenants.length === 1 ? '' : 's'} matching "${searchQuery}"`
        };
    }
    catch (error) {
        logger.error("❌ Error in searchTenants function:", error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError("internal", error instanceof Error ? error.message : "Unknown error occurred");
    }
});
//# sourceMappingURL=tenantService.js.map