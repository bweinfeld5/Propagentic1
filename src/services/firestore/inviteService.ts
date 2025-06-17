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
  deleteDoc
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { CreateInviteSchema } from '../../schemas/CreateInviteSchema';
import { unifiedEmailService } from '../unifiedEmailService';

export type InviteStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'deleted';
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
}

/**
 * Create a new invite and send unified email
 */
export const createInvite = async (inviteData: InviteData): Promise<string> => {
  try {
    console.log('Creating invite with data:', inviteData);
    const validatedData = CreateInviteSchema.parse(inviteData);
    console.log('Data validated successfully');
    
    // Set expiration date (7 days from now)
    const now = Timestamp.now();
    const expiresAt = new Timestamp(
      now.seconds + 7 * 24 * 60 * 60,
      now.nanoseconds
    );

    const inviteRef = collection(db, 'invites');
    console.log('Adding document to invites collection...');
    const docRef = await addDoc(inviteRef, {
      ...validatedData,
      tenantEmail: validatedData.tenantEmail.toLowerCase(),
      status: 'pending' as InviteStatus,
      createdAt: serverTimestamp(),
      expiresAt,
      emailSentStatus: 'pending' as EmailStatus
    });
    
    console.log(`Invite created successfully with ID: ${docRef.id}`);

    // Send unified invitation email
    if (validatedData.landlordName && validatedData.propertyName) {
      try {
        console.log('Sending unified invitation email...');
        const emailData = unifiedEmailService.generateEmailData({
          tenantEmail: validatedData.tenantEmail,
          inviteCode: docRef.id,
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
        
        console.log('Unified invitation email sent successfully');
      } catch (emailError) {
        console.error('Error sending unified invitation email:', emailError);
        // Update invite status to failed but don't throw - invite was created successfully
        await updateDoc(doc(db, 'invites', docRef.id), {
          emailSentStatus: 'failed' as EmailStatus,
          updatedAt: serverTimestamp()
        });
      }
    }
    
    return docRef.id;
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

// Export all functions as default object
const inviteService = {
  createInvite,
  updateInviteStatus,
  getPendingInvitesForTenant,
  deleteInvite,
  declineInvite
};

export default inviteService; 

// Enhanced invite service with acceptance functionality
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase/config';

// Existing invite creation functions...
// ... (keep existing code)

/**
 * Validate an invite code
 */
export const validateInviteCode = async (inviteCode: string) => {
  const validateInvite = httpsCallable(functions, 'validateInviteCode');
  const result = await validateInvite({ inviteCode });
  return result.data;
};

/**
 * Accept an invitation
 */
export const acceptInvite = async (inviteData: {
  inviteCode: string;
  firstName: string;
  lastName: string;
  password: string;
  email: string;
}) => {
  const acceptInvitation = httpsCallable(functions, 'acceptInvite');
  const result = await acceptInvitation(inviteData);
  return result.data;
};