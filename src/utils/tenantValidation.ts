/**
 * Utility functions for validating tenant accounts and invite code requirements
 */

import { db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';

export interface UserProfile {
  userType?: string;
  role?: string;
  propertyId?: string;
  landlordId?: string;
  onboardingComplete?: boolean;
}

/**
 * Checks if a user is a tenant who needs an invite code (async version that checks tenantProfiles)
 */
export const isTenantNeedingInviteAsync = async (userProfile: UserProfile | null, currentUser: any): Promise<boolean> => {
  if (!userProfile || !currentUser) return false;
  
  // User is a tenant
  const isTenant = userProfile.userType === 'tenant' || userProfile.role === 'tenant';
  if (!isTenant) return false;
  
  // Check legacy propertyId first
  if (userProfile.propertyId || userProfile.landlordId) {
    return false; // Has legacy property connection
  }
  
  // Check new tenantProfiles structure
  try {
    const tenantProfileRef = doc(db, 'tenantProfiles', currentUser.uid);
    const tenantProfileSnap = await getDoc(tenantProfileRef);
    
    if (tenantProfileSnap.exists()) {
      const tenantProfileData = tenantProfileSnap.data();
      const properties = tenantProfileData.properties || [];
      
      // If tenant has properties in the new structure, they don't need an invite
      if (properties.length > 0) {
        return false;
      }
    }
  } catch (error) {
    console.warn('Error checking tenant profile:', error);
  }
  
  // No property connection found in either legacy or new structure
  return true;
};

/**
 * Checks if a user is a tenant who needs an invite code (legacy sync version)
 */
export const isTenantNeedingInvite = (userProfile: UserProfile | null): boolean => {
  if (!userProfile) return false;
  
  // User is a tenant
  const isTenant = userProfile.userType === 'tenant' || userProfile.role === 'tenant';
  
  // Tenant doesn't have propertyId or landlordId (not linked to a property)
  const hasNoPropertyLink = !userProfile.propertyId || !userProfile.landlordId;
  
  return isTenant && hasNoPropertyLink;
};

/**
 * Checks if a tenant has completed the invite process
 */
export const hasTenantCompletedInvite = (userProfile: UserProfile | null): boolean => {
  if (!userProfile) return false;
  
  const isTenant = userProfile.userType === 'tenant' || userProfile.role === 'tenant';
  const hasPropertyLink = !!(userProfile.propertyId && userProfile.landlordId);
  
  return isTenant && hasPropertyLink;
};

/**
 * Checks if user should be allowed to access the app without restrictions
 */
export const shouldAllowAppAccess = (userProfile: UserProfile | null): boolean => {
  if (!userProfile) return false;
  
  // Allow landlords and contractors without restrictions
  if (userProfile.userType === 'landlord' || userProfile.userType === 'contractor') {
    return true;
  }
  
  // Allow tenants only if they have completed the invite process
  if (userProfile.userType === 'tenant' || userProfile.role === 'tenant') {
    return hasTenantCompletedInvite(userProfile);
  }
  
  // Default: allow access for unknown user types (safety)
  return true;
}; 