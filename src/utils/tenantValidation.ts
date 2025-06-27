/**
 * Utility functions for validating tenant accounts and invite code requirements
 */

export interface UserProfile {
  userType?: string;
  role?: string;
  propertyId?: string;
  landlordId?: string;
  onboardingComplete?: boolean;
}

/**
 * Checks if a user is a tenant who needs an invite code
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