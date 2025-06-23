import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface TenantAccount {
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
  createdAt?: any;
  lastLoginAt?: any;
}

/**
 * Get all current tenant accounts from the PropAgentic system
 * @returns Promise<TenantAccount[]> - Array of all tenant accounts
 */
export const getAllTenants = async (): Promise<TenantAccount[]> => {
  try {
    // Query all users with role 'tenant' or userType 'tenant'
    const usersRef = collection(db, 'users');
    const tenantQuery1 = query(usersRef, where('role', '==', 'tenant'));
    const tenantQuery2 = query(usersRef, where('userType', '==', 'tenant'));
    
    const [snapshot1, snapshot2] = await Promise.all([
      getDocs(tenantQuery1),
      getDocs(tenantQuery2)
    ]);
    
    const tenantAccounts: TenantAccount[] = [];
    const addedEmails = new Set<string>(); // Prevent duplicates
    
    // Process both query results
    [snapshot1, snapshot2].forEach(snapshot => {
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const email = data.email;
        
        // Skip if we already added this email
        if (addedEmails.has(email)) return;
        addedEmails.add(email);
        
        const tenant: TenantAccount = {
          uid: doc.id,
          email: data.email,
          name: data.name,
          firstName: data.firstName,
          lastName: data.lastName,
          displayName: data.displayName,
          role: data.role || data.userType,
          userType: data.userType,
          status: data.status || 'active',
          phone: data.phone,
          createdAt: data.createdAt,
          lastLoginAt: data.lastLoginAt
        };
        
        tenantAccounts.push(tenant);
      });
    });
    
    // Sort by name/email for better organization
    tenantAccounts.sort((a, b) => {
      const nameA = a.name || a.displayName || `${a.firstName} ${a.lastName}` || a.email;
      const nameB = b.name || b.displayName || `${b.firstName} ${b.lastName}` || b.email;
      return nameA.localeCompare(nameB);
    });
    
    return tenantAccounts;
  } catch (error) {
    console.error('Error loading tenant accounts:', error);
    throw new Error('Failed to load tenant accounts');
  }
};

/**
 * Get a formatted display name for a tenant
 * @param tenant - TenantAccount object
 * @returns string - Formatted display name
 */
export const getTenantDisplayName = (tenant: TenantAccount): string => {
  if (tenant.name) return tenant.name;
  if (tenant.displayName) return tenant.displayName;
  if (tenant.firstName && tenant.lastName) return `${tenant.firstName} ${tenant.lastName}`;
  if (tenant.firstName) return tenant.firstName;
  return tenant.email;
};

/**
 * Format tenant data for display in a table or list
 * @param tenant - TenantAccount object
 * @returns object with formatted display properties
 */
export const formatTenantForDisplay = (tenant: TenantAccount) => {
  return {
    id: tenant.uid,
    name: getTenantDisplayName(tenant),
    email: tenant.email,
    phone: tenant.phone || 'N/A',
    status: tenant.status || 'active',
    role: tenant.role,
    createdAt: tenant.createdAt?.toDate?.() || 'N/A',
    lastLogin: tenant.lastLoginAt?.toDate?.() || 'N/A'
  };
};

/**
 * Search/filter tenants by query string
 * @param tenants - Array of TenantAccount objects
 * @param query - Search query string
 * @returns TenantAccount[] - Filtered tenant accounts
 */
export const searchTenants = (tenants: TenantAccount[], query: string): TenantAccount[] => {
  if (!query.trim()) return tenants;
  
  const searchQuery = query.toLowerCase();
  return tenants.filter(tenant => 
    tenant.email.toLowerCase().includes(searchQuery) ||
    tenant.name?.toLowerCase().includes(searchQuery) ||
    `${tenant.firstName} ${tenant.lastName}`.toLowerCase().includes(searchQuery) ||
    tenant.displayName?.toLowerCase().includes(searchQuery) ||
    tenant.phone?.includes(searchQuery)
  );
}; 