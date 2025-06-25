/**
 * Invite Code Service - Client-side service for managing invite codes
 */

import { db } from '../firebase/config';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

/**
 * Generate a random invite code
 * @param {number} length - Length of the code (default: 8)
 * @returns {string} Random alphanumeric code
 */
const generateRandomCode = (length = 8) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed potentially confusing characters: I, O, 0, 1
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Check if an invite code is valid without redeeming it
 * @param {string} code - The invite code to validate
 * @returns {Promise<Object>} Validation result with status and message
 */
export const validateInviteCode = async (code) => {
  if (!code || typeof code !== 'string' || code.length < 6) {
    return { 
      isValid: false, 
      message: 'Invalid code format. Codes must be at least 6 characters.' 
    };
  }

  const normalizedCode = code.toUpperCase();
  
  try {
    const codesRef = collection(db, 'inviteCodes');
    const q = query(codesRef, where('code', '==', normalizedCode));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return { 
        isValid: false, 
        message: 'Invalid invite code. Please check the code and try again.' 
      };
    }
    
    const inviteCode = querySnapshot.docs[0].data();
    
    // Check if code is already used
    if (inviteCode.used) {
      return { 
        isValid: false, 
        message: 'This invite code has already been used.' 
      };
    }
    
    // Check if code has expired
    if (inviteCode.expiresAt && inviteCode.expiresAt.toMillis() < Date.now()) {
      return { 
        isValid: false, 
        message: 'This invite code has expired.' 
      };
    }
    
    // Code is valid
    return { 
      isValid: true, 
      message: 'Valid invite code',
      propertyId: inviteCode.propertyId,
      landlordId: inviteCode.landlordId,
      unitId: inviteCode.unitId || null
    };
  } catch (error) {
    console.error('Error validating invite code:', error);
    return { 
      isValid: false, 
      message: 'An error occurred while validating the invite code.' 
    };
  }
};

/**
 * Redeem an invite code using the Firebase Function
 * @param {string} code - The invite code to redeem
 * @returns {Promise<Object>} Redemption result
 */
export const redeemInviteCode = async (code) => {
  if (!code || typeof code !== 'string') {
    throw new Error('Invalid invite code format');
  }
  
  const functions = getFunctions();
  const redeemFunction = httpsCallable(functions, 'redeemInviteCode');
  
  try {
    const result = await redeemFunction({ code });
    return result.data;
  } catch (error) {
    console.error('Error redeeming invite code:', error);
    throw new Error(error.message || 'Failed to redeem invite code');
  }
};

/**
 * Create a new invite code for a property
 * @param {string} propertyId - ID of the property
 * @param {string} landlordId - ID of the landlord creating the code
 * @param {Object} options - Optional parameters
 * @param {string} options.unitId - Unit ID (optional)
 * @param {number} options.expirationDays - Days until expiration (default: 30)
 * @returns {Promise<Object>} The created invite code
 */
export const createInviteCode = async (propertyId, landlordId, options = {}) => {
  if (!propertyId || !landlordId) {
    throw new Error('Property ID and landlord ID are required');
  }
  
  const { unitId, expirationDays = 30 } = options;
  
  try {
    // Generate a unique code
    let code;
    let isUnique = false;
    
    // Try to generate a unique code
    while (!isUnique) {
      code = generateRandomCode();
      
      // Check if the code already exists
      const codesRef = collection(db, 'inviteCodes');
      const q = query(codesRef, where('code', '==', code));
      const querySnapshot = await getDocs(q);
      
      isUnique = querySnapshot.empty;
    }
    
    // Set expiration date (e.g., 30 days from now)
    const expiresAt = new Timestamp(
      Math.floor(Date.now() / 1000) + (expirationDays * 24 * 60 * 60),
      0
    );
    
    // Create the invite code document
    const inviteCodeData = {
      code,
      propertyId,
      landlordId,
      unitId: unitId || null,
      expiresAt,
      used: false,
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'inviteCodes'), inviteCodeData);
    
    return {
      id: docRef.id,
      ...inviteCodeData,
      createdAt: new Date(),
      expiresAt: new Date(expiresAt.toMillis())
    };
  } catch (error) {
    console.error('Error creating invite code:', error);
    throw new Error('Failed to create invite code');
  }
};

/**
 * Get all invite codes created by a landlord
 * @param {string} landlordId - ID of the landlord
 * @returns {Promise<Array>} Array of invite codes
 */
export const getLandlordInviteCodes = async (landlordId) => {
  if (!landlordId) {
    throw new Error('Landlord ID is required');
  }
  
  try {
    const codesRef = collection(db, 'inviteCodes');
    const q = query(codesRef, where('landlordId', '==', landlordId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Convert timestamps to JavaScript dates
      createdAt: doc.data().createdAt?.toDate?.() || null,
      expiresAt: doc.data().expiresAt?.toDate?.() || null,
      usedAt: doc.data().usedAt?.toDate?.() || null
    }));
  } catch (error) {
    console.error('Error getting landlord invite codes:', error);
    throw new Error('Failed to retrieve invite codes');
  }
};

export default {
  validateInviteCode,
  redeemInviteCode,
  createInviteCode,
  getLandlordInviteCodes
}; 