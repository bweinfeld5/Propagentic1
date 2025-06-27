import { Timestamp } from 'firebase/firestore';

/**
 * Enhanced Landlord Profile Interface
 * Comprehensive landlord profile with tenant acceptance tracking
 */
export interface LandlordProfile {
  // Identity
  uid: string;                    // Landlord's user ID (same as Auth UID)
  landlordId: string;             // For backward compatibility
  userId: string;                 // Reference to users collection
  
  // Contact Information
  displayName?: string;
  email: string;
  phoneNumber?: string;
  businessName?: string;
  
  // Core Relationships Arrays (as per requirement)
  acceptedTenants: string[];      // Array of tenant UIDs who accepted invites
  properties: string[];           // Array of property IDs owned by landlord
  invitesSent: string[];          // Array of invite document IDs sent
  contractors: string[];          // Array of contractor UIDs in rolodex
  
  // Enhanced Tracking
  acceptedTenantDetails: AcceptedTenantRecord[];
  
  // Statistics
  totalInvitesSent: number;
  totalInvitesAccepted: number;
  inviteAcceptanceRate: number;   // Calculated percentage
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Detailed record of tenant invite acceptance
 */
export interface AcceptedTenantRecord {
  tenantId: string;               // Tenant's user UID
  propertyId: string;             // Property the tenant was invited to
  inviteId: string;               // Reference to the original invite document
  inviteCode: string;             // The shortCode used for acceptance
  unitNumber?: string;            // Specific unit if applicable
  acceptedAt: Timestamp;          // When the tenant accepted
  tenantEmail: string;            // Email address used for invite
  
  // Additional context
  inviteType?: 'email' | 'code';  // How the invite was sent
  landlordNotes?: string;         // Optional notes from landlord
}

/**
 * Type for creating/updating landlord profiles
 */
export type CreateLandlordProfileData = Omit<LandlordProfile, 'uid' | 'landlordId' | 'userId' | 'createdAt' | 'updatedAt'> & {
  uid: string;
};

/**
 * Type for updating landlord profile
 */
export type UpdateLandlordProfileData = Partial<Omit<LandlordProfile, 'uid' | 'landlordId' | 'userId' | 'createdAt'>>;

/**
 * Helper function to create an accepted tenant record
 */
export const createAcceptedTenantRecord = (
  tenantId: string,
  propertyId: string,
  inviteId: string,
  inviteCode: string,
  tenantEmail: string,
  unitNumber?: string,
  landlordNotes?: string
): Omit<AcceptedTenantRecord, 'acceptedAt'> => {
  return {
    tenantId,
    propertyId,
    inviteId,
    inviteCode,
    tenantEmail,
    unitNumber,
    inviteType: 'code',
    landlordNotes
  };
};

/**
 * Default landlord profile factory
 */
export const createDefaultLandlordProfile = (
  uid: string, 
  email: string, 
  displayName?: string
): Omit<LandlordProfile, 'createdAt' | 'updatedAt'> => {
  return {
    uid,
    landlordId: uid,
    userId: uid,
    displayName: displayName || '',
    email,
    phoneNumber: '',
    businessName: '',
    acceptedTenants: [],
    properties: [],
    invitesSent: [],
    contractors: [],
    acceptedTenantDetails: [],
    totalInvitesSent: 0,
    totalInvitesAccepted: 0,
    inviteAcceptanceRate: 0
  };
}; 