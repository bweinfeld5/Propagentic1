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
  WithFieldValue
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
 * Check if an invite code is valid without redeeming it
 * @param code - The invite code to validate
 * @returns Validation result with status and message
 */
export const validateInviteCode = async (code: string): Promise<ValidationResult> => {
  console.log('🔍 validateInviteCode called with:', code);
  
  if (!code || typeof code !== 'string' || code.length < 6) {
    console.log('❌ Invalid code format');
    return { 
      isValid: false, 
      message: 'Invalid code format. Codes must be at least 6 characters.' 
    };
  }

  const normalizedCode = code.toUpperCase();
  console.log('🔍 Normalized code:', normalizedCode);
  
  // Check for test codes first, before any Firestore operations
  if (normalizedCode === 'TEST1234') {
    console.log('✅ Using test code for development');
    return {
      isValid: true,
      message: 'Valid test invite code (development)',
      propertyId: 'test-property-123',
      propertyName: 'Test Property',
      unitId: null,
      email: null,
      restrictedEmail: null
    };
  }
  
  try {
    console.log('🔍 Querying Firestore for invite codes...');
    // Query without converter first to see raw data
    const codesRef = collection(db, COLLECTION_NAME);
    const q = query(codesRef, where('code', '==', normalizedCode));
    
    console.log('🔍 About to execute Firestore query...');
    const querySnapshot = await getDocs(q);
    console.log('🔍 Firestore query completed successfully');
    
    console.log('🔍 Query result - empty:', querySnapshot.empty, 'docs:', querySnapshot.docs.length);
    
    if (querySnapshot.empty) {
      console.log('❌ No matching invite code found in database');
      return { 
        isValid: false, 
        message: 'Invalid invite code. Please check the code and try again.' 
      };
    }
    
    const docSnapshot = querySnapshot.docs[0];
    const rawData = docSnapshot.data();
    
    console.log('🔍 Found raw invite code data:', {
      id: docSnapshot.id,
      rawData: rawData
    });
    
    // Handle both old and new data formats
    const inviteCodeData = {
      id: docSnapshot.id,
      code: rawData.code,
      status: rawData.status || (rawData.used ? 'used' : 'active'),
      propertyId: rawData.propertyId,
      propertyName: rawData.propertyName || '',
      unitId: rawData.unitId,
      email: rawData.email,
      expiresAt: rawData.expiresAt,
      usedAt: rawData.usedAt,
      usedBy: rawData.usedBy
    };
    
    console.log('🔍 Processed invite code:', inviteCodeData);
    
    // Check if code is already used
    if (inviteCodeData.status === 'used' || rawData.used === true) {
      console.log('❌ Code is already used');
      return { 
        isValid: false, 
        message: 'This invite code has already been used.' 
      };
    }
    
    // Check if code is revoked
    if (inviteCodeData.status === 'revoked') {
      console.log('❌ Code is revoked');
      return { 
        isValid: false, 
        message: 'This invite code has been revoked.' 
      };
    }
    
    // Check if code has expired
    const isExpired = inviteCodeData.status === 'expired' || 
                     (rawData.expiresAt && rawData.expiresAt.toMillis && rawData.expiresAt.toMillis() < Date.now());
    
    if (isExpired) {
      console.log('❌ Code is expired', {
        status: inviteCodeData.status,
        expiresAt: rawData.expiresAt?.toMillis?.(),
        now: Date.now()
      });
      
      // Auto update status to expired if it's past expiration time
      if (inviteCodeData.status !== 'expired' && rawData.expiresAt?.toMillis && rawData.expiresAt.toMillis() < Date.now()) {
        await updateDoc(
          doc(db, COLLECTION_NAME, docSnapshot.id),
          { status: 'expired' }
        );
      }
      
      return { 
        isValid: false, 
        message: 'This invite code has expired.' 
      };
    }
    
    console.log('✅ Code is valid!');
    // Code is valid
    return { 
      isValid: true, 
      message: 'Valid invite code',
      propertyId: inviteCodeData.propertyId,
      landlordId: rawData.landlordId,
      unitId: inviteCodeData.unitId || null,
      email: inviteCodeData.email || null,
      restrictedEmail: inviteCodeData.email || null,
      propertyName: inviteCodeData.propertyName || ''
    };
  } catch (error) {
    console.error('💥 Error in validateInviteCode:', error);
    const err = error as { message?: string; code?: string; stack?: string };
    console.error('💥 Error details:', {
      message: err.message,
      code: err.code,
      stack: err.stack
    });
    
    // If there's a Firestore permission error, still allow test codes
    if (err.code === 'permission-denied') {
      console.log('🔒 Firestore permission denied - this is expected in some environments');
      return { 
        isValid: false, 
        message: 'Unable to validate invite code due to permissions. Please contact support.' 
      };
    }
    
    return { 
      isValid: false, 
      message: 'An error occurred while validating the invite code. ' + (err.message || '') 
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
 * Redeem an invite code and create tenant-property relationship
 * @param code - The invite code to redeem
 * @param tenantId - ID of tenant redeeming the code
 * @returns Redemption result
 */
export const redeemInviteCode = async (
  code: string, 
  tenantId: string
): Promise<RedemptionResult> => {
  if (!code || typeof code !== 'string') {
    throw new Error('Invalid invite code format');
  }
  
  if (!tenantId) {
    throw new Error('Tenant ID is required');
  }
  
  const functions = getFunctions();
  const redeemFunction = httpsCallable<
    { code: string; tenantId: string },
    RedemptionResult
  >(functions, 'redeemInviteCode');
  
  try {
    const result = await redeemFunction({ code, tenantId });
    return result.data;
  } catch (error: any) {
    console.error('Error redeeming invite code:', error);
    throw new Error(error.message || 'Failed to redeem invite code');
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