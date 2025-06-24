import { HttpsError, onCall, CallableRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

/**
 * Firebase Cloud Function: Get All Tenants for Landlord Invitations
 * 
 * This function allows landlords to retrieve tenant data for invitation purposes
 * while maintaining proper security boundaries and validation.
 */

interface TenantData {
  uid: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  role: string;
  userType?: string;
  status?: string;
  phone?: string;
  createdAt?: admin.firestore.Timestamp;
  lastLoginAt?: admin.firestore.Timestamp;
}

interface GetTenantsRequest {
  searchQuery?: string;
  limit?: number;
}

interface GetTenantsResponse {
  success: boolean;
  tenants: TenantData[];
  totalCount: number;
  message?: string;
  error?: string;
}

/**
 * Cloud Function: getAllTenants
 * Allows authenticated landlords to retrieve tenant data for invitation purposes
 */
export const getAllTenants = onCall(async (request: CallableRequest<GetTenantsRequest>): Promise<GetTenantsResponse> => {
  try {
    // Check if user is authenticated
    if (!request.auth) {
      logger.warn("❌ Unauthorized access attempt to getAllTenants");
      throw new HttpsError("unauthenticated", "Authentication required");
    }

    const uid = request.auth.uid;
    const email = request.auth.token.email;
    
    logger.info(`📋 getAllTenants called by user: ${email} (${uid})`);

    // Verify the caller is a landlord
    const callerDoc = await admin.firestore().collection('users').doc(uid).get();
    
    if (!callerDoc.exists) {
      logger.warn(`❌ User document not found for: ${email}`);
      throw new HttpsError("not-found", "User profile not found");
    }

    const callerData = callerDoc.data();
    const isLandlord = callerData?.role === 'landlord' || callerData?.userType === 'landlord';
    
    if (!isLandlord) {
      logger.warn(`❌ Non-landlord attempted to access tenant data: ${email} (role: ${callerData?.role})`);
      throw new HttpsError("permission-denied", "Access denied: Landlord privileges required");
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
    const tenantMap = new Map<string, TenantData>();
    
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

  } catch (error) {
    logger.error("❌ Error in getAllTenants function:", error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError("internal", error instanceof Error ? error.message : "Unknown error occurred");
  }
});

/**
 * Cloud Function: searchTenants
 * More focused search functionality for tenant lookup
 */
export const searchTenants = onCall(async (request: CallableRequest<{ query: string; limit?: number }>): Promise<GetTenantsResponse> => {
  // Check if user is authenticated
  if (!request.auth) {
    logger.warn("❌ Unauthorized access attempt to searchTenants");
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  const uid = request.auth.uid;
  const email = request.auth.token.email;
  
  logger.info(`🔍 searchTenants called by user: ${email} (${uid}) with query: "${request.data.query}"`);

  // Verify the caller is a landlord
  const callerDoc = await admin.firestore().collection('users').doc(uid).get();
  
  if (!callerDoc.exists) {
    logger.warn(`❌ User document not found for: ${email}`);
    throw new HttpsError("not-found", "User profile not found");
  }

  const callerData = callerDoc.data();
  const isLandlord = callerData?.role === 'landlord' || callerData?.userType === 'landlord';
  
  if (!isLandlord) {
    logger.warn(`❌ Non-landlord attempted to search tenant data: ${email} (role: ${callerData?.role})`);
    throw new HttpsError("permission-denied", "Access denied: Landlord privileges required");
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
    const tenantMap = new Map<string, TenantData>();
    
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

  } catch (error) {
    logger.error("❌ Error in searchTenants function:", error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError("internal", error instanceof Error ? error.message : "Unknown error occurred");
  }
}); 