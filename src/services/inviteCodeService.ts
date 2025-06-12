/**
 * Invite Code Service - Client-side service for managing invite codes for tenant invitation
 */

import { db } from '../firebase/config';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  updateDoc,
  doc,
  Timestamp,
  serverTimestamp,
  getDoc,
  deleteDoc,
  QueryDocumentSnapshot,
  DocumentData,
  WithFieldValue,
  arrayUnion
} from 'firebase/firestore';
import { getFunctions, httpsCallable, HttpsCallableResult } from 'firebase/functions';
import { InviteCode, inviteCodeConverter, createInviteCode as createInviteCodeModel } from '../models/InviteCode';

// Collection reference
const COLLECTION_NAME = 'inviteCodes';

/**
 * Generate a random invite code
 * @param length - Length of the code (default: 8)
 * @returns Random alphanumeric code
 */
const generateRandomCode = (length = 8): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed potentially confusing characters: I, O, 0, 1
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

interface ValidationResult {
  isValid: boolean;
  message: string;
  inviteCode?: InviteCode;
  propertyId?: string;
  landlordId?: string;
  unitId?: string | null;
  email?: string | null;
  restrictedEmail?: string | null;
  propertyName?: string;
}

/**
 * Validate an invite code by checking against Firestore properties
 * @param {string} inviteCode - The invite code to validate
 * @returns {Promise<Object>} Validation result with property details if valid
 */
export const validateInviteCode = async (inviteCode: string) => {
  try {
    // Simple normalization instead of using external function
    const normalizedCode = inviteCode?.toUpperCase().trim();
    console.log('🔍 Starting invite code validation for:', normalizedCode);
    
    if (!normalizedCode || normalizedCode.length === 0) {
      return {
        isValid: false,
        message: 'Please enter a valid invite code'
      };
    }

    // Query Firestore for property with this invite code
    const propertiesRef = collection(db, 'properties');
    const q = query(propertiesRef, where('inviteCode', '==', normalizedCode));
    
    console.log('🔍 Querying Firestore for invite code:', normalizedCode);
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('❌ No property found with invite code:', normalizedCode);
      return {
        isValid: false,
        message: 'Invalid invite code. Please check the code and try again.'
      };
    }

    // Get the first (should be only) matching property
    const propertyDoc = querySnapshot.docs[0];
    const propertyData = propertyDoc.data();
    
    console.log('✅ Found property for invite code:', {
      propertyId: propertyDoc.id,
      propertyName: propertyData.name,
      isDemo: propertyData.isDemo
    });

    // Check if property is active
    console.log('🔍 Property status check:', {
      status: propertyData.status,
      statusType: typeof propertyData.status,
      isNotActive: propertyData.status !== 'active',
      hasStatus: !!propertyData.status,
      fullCheck: propertyData.status && propertyData.status !== 'active'
    });
    
    if (propertyData.status && propertyData.status !== 'active') {
      console.log('❌ Property marked as inactive:', propertyData.status);
      return {
        isValid: false,
        message: 'This property is not currently accepting new tenants.'
      };
    }

    return {
      isValid: true,
      propertyId: propertyDoc.id,
      propertyName: propertyData.name,
      unitId: propertyData.address?.unit || null,
      landlordId: propertyData.landlordId,
      landlordName: propertyData.landlordName,
      isDemo: propertyData.isDemo || false,
      message: 'Valid invite code!'
    };

  } catch (error) {
    console.error('💥 Error validating invite code:', error);
    return {
      isValid: false,
      message: 'Error validating invite code. Please try again.'
    };
  }
};

/**
 * Interface defining the result of redeeming an invite code
 */
interface RedemptionResult {
  success: boolean;
  message: string;
  propertyId?: string;
  propertyName?: string;
  unitId?: string | null;
}

/**
 * Redeem an invite code by associating the tenant with the property
 * @param {string} inviteCode - The invite code to redeem
 * @param {string} tenantId - The tenant's user ID
 * @returns {Promise<Object>} Redemption result
 */
export const redeemInviteCode = async (inviteCode: string, tenantId: string) => {
  try {
    console.log('🎫 Starting invite code redemption:', { inviteCode, tenantId });
    
    // First validate the code
    const validationResult = await validateInviteCode(inviteCode);
    
    if (!validationResult.isValid) {
      return {
        success: false,
        message: validationResult.message
      };
    }

    const { propertyId, propertyName } = validationResult;
    
    if (!propertyId) {
      return {
        success: false,
        message: 'Invalid property information'
      };
    }
    
    // Update the property to include this tenant
    const propertyRef = doc(db, 'properties', propertyId);
    await updateDoc(propertyRef, {
      tenantIds: arrayUnion(tenantId),
      updatedAt: serverTimestamp()
    });
    
    // Update the user's profile to include this property
    const userRef = doc(db, 'users', tenantId);
    await updateDoc(userRef, {
      propertyId: propertyId,
      propertyName: propertyName,
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ Successfully redeemed invite code:', {
      propertyId,
      propertyName,
      tenantId
    });
    
    return {
      success: true,
      propertyId,
      propertyName,
      message: `Successfully joined ${propertyName}!`
    };

  } catch (error) {
    console.error('💥 Error redeeming invite code:', error);
    return {
      success: false,
      message: 'Error joining property. Please try again.'
    };
  }
};

interface InviteCodeOptions {
  unitId?: string;
  email?: string;
  expirationDays?: number;
}

/**
 * Create a new invite code for a property
 * @param propertyId - ID of the property
 * @param landlordId - ID of the landlord creating the code
 * @param options - Optional parameters
 * @returns The created invite code
 */
export const createInviteCode = async (
  propertyId: string, 
  landlordId: string, 
  options: InviteCodeOptions = {}
): Promise<InviteCode> => {
  if (!propertyId || !landlordId) {
    throw new Error('Property ID and landlord ID are required');
  }
  
  const { unitId, email, expirationDays = 7 } = options;
  
  try {
    // Generate a unique code
    let code: string;
    let isUnique = false;
    
    // Try to generate a unique code
    do {
      code = generateRandomCode();
      
      // Check if the code already exists
      const codesRef = collection(db, COLLECTION_NAME);
      const q = query(codesRef, where('code', '==', code));
      const querySnapshot = await getDocs(q);
      
      isUnique = querySnapshot.empty;
    } while (!isUnique);
    
    // Create the invite code model
    const inviteCodeData = createInviteCodeModel(
      code,
      landlordId,
      propertyId,
      expirationDays,
      { unitId, email }
    );
    
    // Add to Firestore
    const docRef = await addDoc(
      collection(db, COLLECTION_NAME).withConverter(inviteCodeConverter),
      inviteCodeData as WithFieldValue<InviteCode>
    );
    
    return {
      ...inviteCodeData,
      id: docRef.id
    };
  } catch (error) {
    console.error('Error creating invite code:', error);
    throw new Error('Failed to create invite code');
  }
};

/**
 * Get all invite codes created by a landlord
 * @param landlordId - ID of the landlord
 * @returns Array of invite codes
 */
export const getLandlordInviteCodes = async (landlordId: string): Promise<InviteCode[]> => {
  if (!landlordId) {
    throw new Error('Landlord ID is required');
  }
  
  try {
    const codesRef = collection(db, COLLECTION_NAME).withConverter(inviteCodeConverter);
    const q = query(codesRef, where('landlordId', '==', landlordId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error('Error getting landlord invite codes:', error);
    throw new Error('Failed to retrieve invite codes');
  }
};

/**
 * Get invite codes for a specific property
 * @param propertyId - ID of the property
 * @returns Array of invite codes
 */
export const getPropertyInviteCodes = async (propertyId: string): Promise<InviteCode[]> => {
  if (!propertyId) {
    throw new Error('Property ID is required');
  }
  
  try {
    const codesRef = collection(db, COLLECTION_NAME).withConverter(inviteCodeConverter);
    const q = query(codesRef, where('propertyId', '==', propertyId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error('Error getting property invite codes:', error);
    throw new Error('Failed to retrieve invite codes');
  }
};

/**
 * Update an invite code (revoke, extend expiration)
 * @param inviteCodeId - ID of the invite code
 * @param updates - Fields to update
 * @returns Updated invite code
 */
export const updateInviteCode = async (
  inviteCodeId: string, 
  updates: {
    status?: 'active' | 'revoked';
    expiresAt?: Timestamp;
  }
): Promise<InviteCode> => {
  if (!inviteCodeId) {
    throw new Error('Invite code ID is required');
  }
  
  try {
    const docRef = doc(db, COLLECTION_NAME, inviteCodeId).withConverter(inviteCodeConverter);
    await updateDoc(docRef, updates);
    
    const updatedDoc = await getDoc(docRef);
    if (!updatedDoc.exists()) {
      throw new Error('Invite code not found');
    }
    
    return updatedDoc.data();
  } catch (error) {
    console.error('Error updating invite code:', error);
    throw new Error('Failed to update invite code');
  }
};

/**
 * Extends the expiration date of an invite code
 * @param inviteCodeId - ID of the invite code
 * @param expirationDays - New expiration period in days
 */
export const extendInviteCode = async (
  inviteCodeId: string,
  expirationDays: number = 7
): Promise<InviteCode> => {
  if (!inviteCodeId) {
    throw new Error('Invite code ID is required');
  }
  
  try {
    const now = Timestamp.now();
    const expiresAt = new Timestamp(
      now.seconds + (expirationDays * 24 * 60 * 60),
      now.nanoseconds
    );
    
    return updateInviteCode(inviteCodeId, {
      status: 'active',
      expiresAt
    });
  } catch (error) {
    console.error('Error extending invite code:', error);
    throw new Error('Failed to extend invite code');
  }
};

/**
 * Revokes an invite code
 * @param inviteCodeId - ID of the invite code
 */
export const revokeInviteCode = async (inviteCodeId: string): Promise<InviteCode> => {
  if (!inviteCodeId) {
    throw new Error('Invite code ID is required');
  }
  
  try {
    return updateInviteCode(inviteCodeId, { status: 'revoked' });
  } catch (error) {
    console.error('Error revoking invite code:', error);
    throw new Error('Failed to revoke invite code');
  }
};

/**
 * Generate multiple invite codes for bulk tenant invitations
 * @param propertyId - ID of the property
 * @param landlordId - ID of the landlord
 * @param count - Number of codes to generate
 * @param options - Optional parameters
 * @returns Array of created invite codes
 */
export const generateBulkInviteCodes = async (
  propertyId: string,
  landlordId: string,
  count: number = 5,
  options: InviteCodeOptions = {}
): Promise<InviteCode[]> => {
  if (!propertyId || !landlordId) {
    throw new Error('Property ID and landlord ID are required');
  }
  
  if (count <= 0 || count > 50) {
    throw new Error('Count must be between 1 and 50');
  }
  
  try {
    const inviteCodes: InviteCode[] = [];
    
    for (let i = 0; i < count; i++) {
      const inviteCode = await createInviteCode(propertyId, landlordId, options);
      inviteCodes.push(inviteCode);
    }
    
    return inviteCodes;
  } catch (error) {
    console.error('Error generating bulk invite codes:', error);
    throw new Error('Failed to generate bulk invite codes');
  }
};

export default {
  validateInviteCode,
  redeemInviteCode,
  createInviteCode,
  getLandlordInviteCodes,
  getPropertyInviteCodes,
  updateInviteCode,
  extendInviteCode,
  revokeInviteCode,
  generateBulkInviteCodes
}; 