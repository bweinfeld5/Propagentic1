import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs,
  query, 
  where,
  serverTimestamp,
  Timestamp,
  deleteDoc,
  getDoc
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { CreateInviteSchema } from '../../schemas/CreateInviteSchema';
import unifiedEmailService from '../unifiedEmailService';

export type InviteStatus = 'pending' | 'sent' | 'accepted' | 'declined' | 'expired' | 'deleted';
export type EmailStatus = 'pending' | 'sent' | 'failed';

export interface InviteData {
  tenantEmail: string;
  propertyId: string;
  landlordId: string;
  propertyName?: string;
  landlordName?: string;
  unitId?: string;
  unitNumber?: string;
}

export interface InviteDocument extends InviteData {
  id: string;
  status: InviteStatus;
  emailSentStatus: EmailStatus;
  createdAt: Date;
  updatedAt?: Date;
  expiresAt: Date;
  acceptedAt?: Date;
  declinedAt?: Date;
  deletedAt?: Date;
  tenantId?: string;
  shortCode?: string; // 8-digit user-friendly code
}

/**
 * Generate a unique 8-digit code
 */
const generateShortCode = (): string => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

/**
 * Check if short code already exists in the database
 */
const isShortCodeUnique = async (shortCode: string): Promise<boolean> => {
  try {
    const invitesRef = collection(db, 'invites');
    const q = query(invitesRef, where('shortCode', '==', shortCode));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty;
  } catch (error) {
    console.error('Error checking short code uniqueness:', error);
    return false;
  }
};

/**
 * Generate a unique 8-digit code with collision checking
 */
const generateUniqueShortCode = async (): Promise<string> => {
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const shortCode = generateShortCode();
    const isUnique = await isShortCodeUnique(shortCode);
    
    if (isUnique) {
      return shortCode;
    }
    
    attempts++;
  }
  
  // If we can't generate a unique code after 10 attempts, 
  // fall back to timestamp-based code
  return Date.now().toString().slice(-8).toUpperCase();
};

/**
 * Create a new invite and send unified email
 */
export const createInvite = async (inviteData: InviteData): Promise<string> => {
  try {
    console.log('Creating invite with data:', inviteData);
    const validatedData = CreateInviteSchema.parse(inviteData);
    console.log('Data validated successfully');
    
    // Generate unique 8-digit short code
    const shortCode = await generateUniqueShortCode();
    console.log('Generated short code:', shortCode);
    
    // Set expiration date (7 days from now)
    const now = Timestamp.now();
    const expiresAt = new Timestamp(
      now.seconds + 7 * 24 * 60 * 60,
      now.nanoseconds
    );

    const inviteRef = collection(db, 'invites');
    console.log('Adding document to invites collection...');
    
    // Filter out undefined values for Firestore
    const inviteDataForFirestore = {
      ...validatedData,
      tenantEmail: validatedData.tenantEmail.toLowerCase(),
      status: 'pending' as InviteStatus,
      shortCode: shortCode, // Store the 8-digit code
      createdAt: serverTimestamp(),
      expiresAt,
      emailSentStatus: 'pending' as EmailStatus
    };

    // Remove undefined values
    Object.keys(inviteDataForFirestore).forEach(key => {
      if (inviteDataForFirestore[key as keyof typeof inviteDataForFirestore] === undefined) {
        delete inviteDataForFirestore[key as keyof typeof inviteDataForFirestore];
      }
    });
    
    const docRef = await addDoc(inviteRef, inviteDataForFirestore);
    
    console.log(`Invite created successfully with ID: ${docRef.id} and short code: ${shortCode}`);

    // Send unified invitation email using the SHORT CODE
    if (validatedData.landlordName && validatedData.propertyName) {
      try {
        console.log('Sending unified invitation email with short code...');
        const emailData = unifiedEmailService.generateEmailData({
          tenantEmail: validatedData.tenantEmail,
          inviteCode: shortCode, // Use short code in email instead of document ID
          landlordName: validatedData.landlordName,
          propertyName: validatedData.propertyName,
          unitInfo: validatedData.unitNumber ? `Unit ${validatedData.unitNumber}` : undefined
        });

        // Add to mail collection for Firebase extension
        await addDoc(collection(db, 'mail'), emailData);
        
        // Update invite status to sent
        await updateDoc(doc(db, 'invites', docRef.id), {
          emailSentStatus: 'sent' as EmailStatus,
          updatedAt: serverTimestamp()
        });
        
        console.log('Unified invitation email sent successfully with short code');
      } catch (emailError) {
        console.error('Error sending unified invitation email:', emailError);
        // Update invite status to failed but don't throw - invite was created successfully
        await updateDoc(doc(db, 'invites', docRef.id), {
          emailSentStatus: 'failed' as EmailStatus,
          updatedAt: serverTimestamp()
        });
      }
    }
    
    // Return the short code for display to landlord
    return shortCode;
  } catch (error) {
    console.error('Error creating invite:', error);
    throw error;
  }
};

/**
 * Get pending invites for tenant email
 */
export const getPendingInvitesForTenant = async (tenantEmail: string): Promise<InviteDocument[]> => {
  try {
    if (!tenantEmail) throw new Error('Tenant email is required');

    const invitesRef = collection(db, 'invites');
    const q = query(
      invitesRef,
      where('tenantEmail', '==', tenantEmail.toLowerCase()),
      where('status', '==', 'pending')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as InviteDocument[];
  } catch (error) {
    console.error('Error getting pending invites:', error);
    throw error;
  }
};

/**
 * Update invite status
 */
export const updateInviteStatus = async (
  inviteId: string, 
  status: InviteStatus, 
  tenantId?: string
): Promise<void> => {
  try {
    const inviteRef = doc(db, 'invites', inviteId);
    const updateData: Record<string, any> = {
      status,
      updatedAt: serverTimestamp()
    };

    if (status === 'accepted' && tenantId) {
      updateData.tenantId = tenantId;
      updateData.acceptedAt = serverTimestamp();
    }

    if (status === 'declined') {
      updateData.declinedAt = serverTimestamp();
    }

    await updateDoc(inviteRef, updateData);
  } catch (error) {
    console.error('Error updating invite status:', error);
    throw error;
  }
};

/**
 * Decline an invite - updates status to declined
 */
export const declineInvite = async (inviteId: string): Promise<void> => {
  try {
    if (!inviteId) throw new Error('Invite ID is required');
    
    const inviteRef = doc(db, 'invites', inviteId);
    await updateDoc(inviteRef, {
      status: 'declined' as InviteStatus,
      declinedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error declining invite:', error);
    throw error;
  }
};

/**
 * Delete invite
 */
export const deleteInvite = async (inviteId: string): Promise<void> => {
  try {
    if (!inviteId) throw new Error('Invite ID is required');
    
    const inviteRef = doc(db, 'invites', inviteId);
    await deleteDoc(inviteRef);
  } catch (error) {
    console.error('Error deleting invite:', error);
    throw error;
  }
};

/**
 * Resolve both 8-digit short codes and 20-character codes to document ID
 */
export const resolveShortCode = async (code: string): Promise<string | null> => {
  try {
    if (!code) return null;
    
    // Normalize the code to uppercase
    const normalizedCode = code.trim().toUpperCase();
    
    // For 8-digit codes, query by shortCode field
    if (normalizedCode.length === 8) {
      const invitesRef = collection(db, 'invites');
      const q = query(invitesRef, where('shortCode', '==', normalizedCode));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log('No invite found for short code:', normalizedCode);
        return null;
      }
      
      // Return the document ID
      const doc = querySnapshot.docs[0];
      console.log(`Resolved short code ${normalizedCode} to document ID: ${doc.id}`);
      return doc.id;
    }
    
    // For longer codes (like 20-character), check if it's a valid document ID
    if (normalizedCode.length === 20) {
      // First check if this is a valid document ID
      const directDoc = await getDoc(doc(db, 'invites', normalizedCode));
      if (directDoc.exists()) {
        console.log(`Found document with ID: ${normalizedCode}`);
        return normalizedCode;
      }
      
      // If not found as document ID, check if it might be stored as a shortCode
      const invitesRef = collection(db, 'invites');
      const q = query(invitesRef, where('shortCode', '==', normalizedCode));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        console.log(`Found ${normalizedCode} as shortCode, resolved to document ID: ${doc.id}`);
        return doc.id;
      }
      
      console.log('No invite found for 20-character code:', normalizedCode);
      return null;
    }
    
    // For other lengths, treat as shortCode
    const invitesRef = collection(db, 'invites');
    const q = query(invitesRef, where('shortCode', '==', normalizedCode));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('No invite found for code:', normalizedCode);
      return null;
    }
    
    // Return the document ID
    const docRef = querySnapshot.docs[0];
    console.log(`Resolved code ${normalizedCode} to document ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error('Error resolving code:', error);
    return null;
  }
};

/**
 * Validate invite code (accepts both 8-digit and 20-character codes)
 */
export const validateInviteCode = async (code: string): Promise<{
  isValid: boolean;
  inviteData?: InviteDocument;
  message?: string;
}> => {
  try {
    if (!code) {
      return { isValid: false, message: 'Invite code is required' };
    }

    // First, resolve the code to get the document ID
    const documentId = await resolveShortCode(code);
    
    if (!documentId) {
      return { isValid: false, message: 'Invalid invite code. Please check the code and try again.' };
    }

    // Get the invite document using the resolved document ID
    const inviteDoc = await getDoc(doc(db, 'invites', documentId));
    
    if (!inviteDoc.exists()) {
      return { isValid: false, message: 'Invite not found. Please check the code and try again.' };
    }

    const inviteData = { id: inviteDoc.id, ...inviteDoc.data() } as InviteDocument;

    // Check if invite is still pending (allow both 'pending' and 'sent' status)
    if (inviteData.status !== 'pending' && inviteData.status !== 'sent') {
      return { 
        isValid: false, 
        message: `This invitation has been ${inviteData.status}. Please contact your landlord for a new invitation.` 
      };
    }

    // Check if invite has expired
    if (inviteData.expiresAt) {
      const expirationDate = inviteData.expiresAt instanceof Timestamp 
        ? inviteData.expiresAt.toDate() 
        : new Date(inviteData.expiresAt);
        
      if (expirationDate < new Date()) {
        // Update status to expired
        await updateDoc(doc(db, 'invites', documentId), {
          status: 'expired' as InviteStatus,
          updatedAt: serverTimestamp()
        });
        
        return { 
          isValid: false, 
          message: 'This invitation has expired. Please contact your landlord for a new invitation.' 
        };
      }
    }

    return { 
      isValid: true, 
      inviteData,
      message: 'Valid invitation found' 
    };
  } catch (error) {
    console.error('Error validating invite code:', error);
    return { 
      isValid: false, 
      message: 'An error occurred while validating the invite code. Please try again.' 
    };
  }
};

// Export all functions as default object
const inviteService = {
  createInvite,
  updateInviteStatus,
  getPendingInvitesForTenant,
  deleteInvite,
  declineInvite,
  resolveShortCode,
  validateInviteCode
};

export default inviteService; 