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
import { getAuth } from 'firebase/auth';

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

// ValidationResult interface removed - part of tenant redemption system to be rebuilt

// validateInviteCode function removed - part of tenant redemption system to be rebuilt

// redeemInviteCode function and related interfaces removed - part of tenant redemption system to be rebuilt

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
    const auth = getAuth();
    const token = await auth.currentUser?.getIdToken();
    
    if (!token) {
      throw new Error('User must be authenticated');
    }

    const response = await fetch('https://us-central1-propagentic.cloudfunctions.net/generateInviteCodeHttp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        propertyId,
        unitId,
        email,
        expirationDays
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create invite code');
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error('Failed to create invite code');
    }

    return data.inviteCode;
  } catch (error) {
    console.error('Error creating invite code:', error);
    throw error;
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
  createInviteCode,
  getLandlordInviteCodes,
  getPropertyInviteCodes,
  updateInviteCode,
  extendInviteCode,
  revokeInviteCode,
  generateBulkInviteCodes
  // validateInviteCode and redeemInviteCode removed - tenant redemption system to be rebuilt
}; 