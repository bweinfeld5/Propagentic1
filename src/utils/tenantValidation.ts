/**
 * Utility functions for validating tenant accounts and invite code requirements
 */

export interface UserProfile {
  userType?: string;
  role?: string;
  propertyId?: string;
  landlordId?: string;
  onboardingComplete?: boolean;
  email?: string;
}

/**
 * Checks if a user is a tenant who needs an invite code
 * 
 * Updated logic: Allow tenants to access dashboard if they have pending property invitations
 * This way they can see and respond to invitations from landlords
 */
export const isTenantNeedingInvite = (userProfile: UserProfile | null): boolean => {
  if (!userProfile) return false;
  
  // User is a tenant
  const isTenant = userProfile.userType === 'tenant' || userProfile.role === 'tenant';
  
  // If not a tenant, they don't need invite codes
  if (!isTenant) return false;
  
  // Tenant doesn't have propertyId or landlordId (not linked to a property)
  const hasNoPropertyLink = !userProfile.propertyId || !userProfile.landlordId;
  
  // Allow access to dashboard regardless of property link status
  // This enables tenants to see and respond to property invitations
  // The tenant dashboard will handle showing appropriate content based on their status
  return false;
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
  
  // Allow all tenants access to dashboard
  // The dashboard will handle showing appropriate content:
  // - Pending property invitations if available
  // - Empty state with instructions if no invitations and no properties
  // - Normal property management if already linked to a property
  if (userProfile.userType === 'tenant' || userProfile.role === 'tenant') {
    return true;
  }
  
  // Default: allow access for unknown user types (safety)
  return true;
}; 