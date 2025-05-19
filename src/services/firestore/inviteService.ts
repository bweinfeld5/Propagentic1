import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs,
  query, 
  where,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { CreateInviteSchema } from '../../schemas/CreateInviteSchema';

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
 * Create a new invite
 */
export const createInvite = async (inviteData: InviteData): Promise<string> => {
  try {
    const validatedData = CreateInviteSchema.parse(inviteData);
    
    // Set expiration date (7 days from now)
    const now = Timestamp.now();
    const expiresAt = new Timestamp(
      now.seconds + 7 * 24 * 60 * 60,
      now.nanoseconds
    );

    const inviteRef = collection(db, 'invites');
    const docRef = await addDoc(inviteRef, {
      ...validatedData,
      tenantEmail: validatedData.tenantEmail.toLowerCase(),
      status: 'pending' as InviteStatus,
      createdAt: serverTimestamp(),
      expiresAt,
      emailSentStatus: 'pending' as EmailStatus
    });
    
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
 * Delete invite
 */
export const deleteInvite = async (inviteId: string): Promise<void> => {
  try {
    const inviteRef = doc(db, 'invites', inviteId);
    await updateDoc(inviteRef, {
      status: 'deleted' as InviteStatus,
      deletedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
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
  deleteInvite
};

export default inviteService; 