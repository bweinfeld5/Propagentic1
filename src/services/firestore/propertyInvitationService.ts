import { 
  collection, 
  doc, 
  updateDoc, 
  getDocs,
  query, 
  where,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../firebase/config';

export type PropertyInvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired';

export interface PropertyInvitation {
  id: string;
  propertyId: string;
  landlordId: string;
  landlordEmail: string;
  tenantId: string;
  tenantEmail: string;
  tenantName: string;
  status: PropertyInvitationStatus;
  type: 'existing_user' | 'new_user';
  createdAt: Date;
  expiresAt: Date;
  acceptedAt?: Date;
  declinedAt?: Date;
  updatedAt?: Date;
  // Additional property details for display
  propertyName?: string;
  propertyAddress?: string;
  unitId?: string;
}

/**
 * Get pending property invitations for a tenant by email
 */
export const getPendingPropertyInvitations = async (tenantEmail: string): Promise<PropertyInvitation[]> => {
  try {
    if (!tenantEmail) {
      console.warn('No tenant email provided to getPendingPropertyInvitations');
      return [];
    }

    const invitationsRef = collection(db, 'propertyInvitations');
    const q = query(
      invitationsRef,
      where('tenantEmail', '==', tenantEmail.toLowerCase()),
      where('status', '==', 'pending')
    );

    const querySnapshot = await getDocs(q);
    const invitations = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Convert Firestore timestamps to Date objects
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      expiresAt: doc.data().expiresAt?.toDate?.() || new Date(),
      acceptedAt: doc.data().acceptedAt?.toDate?.(),
      declinedAt: doc.data().declinedAt?.toDate?.(),
      updatedAt: doc.data().updatedAt?.toDate?.()
    })) as PropertyInvitation[];

    // Filter out expired invitations
    const now = new Date();
    const validInvitations = invitations.filter(invite => invite.expiresAt > now);

    console.log(`Found ${validInvitations.length} pending property invitations for ${tenantEmail}`);
    return validInvitations;
  } catch (error) {
    console.error('Error getting pending property invitations:', error);
    return [];
  }
};

/**
 * Get pending property invitations for a tenant by user ID
 */
export const getPendingPropertyInvitationsByUserId = async (tenantId: string): Promise<PropertyInvitation[]> => {
  try {
    if (!tenantId) {
      console.warn('No tenant ID provided to getPendingPropertyInvitationsByUserId');
      return [];
    }

    const invitationsRef = collection(db, 'propertyInvitations');
    const q = query(
      invitationsRef,
      where('tenantId', '==', tenantId),
      where('status', '==', 'pending')
    );

    const querySnapshot = await getDocs(q);
    const invitations = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Convert Firestore timestamps to Date objects
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      expiresAt: doc.data().expiresAt?.toDate?.() || new Date(),
      acceptedAt: doc.data().acceptedAt?.toDate?.(),
      declinedAt: doc.data().declinedAt?.toDate?.(),
      updatedAt: doc.data().updatedAt?.toDate?.()
    })) as PropertyInvitation[];

    // Filter out expired invitations
    const now = new Date();
    const validInvitations = invitations.filter(invite => invite.expiresAt > now);

    console.log(`Found ${validInvitations.length} pending property invitations for user ${tenantId}`);
    return validInvitations;
  } catch (error) {
    console.error('Error getting pending property invitations by user ID:', error);
    return [];
  }
};

/**
 * Accept a property invitation
 */
export const acceptPropertyInvitation = async (invitationId: string, tenantId: string): Promise<void> => {
  try {
    if (!invitationId || !tenantId) {
      throw new Error('Invitation ID and tenant ID are required');
    }

    const invitationRef = doc(db, 'propertyInvitations', invitationId);
    await updateDoc(invitationRef, {
      status: 'accepted',
      acceptedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log(`Property invitation ${invitationId} accepted by tenant ${tenantId}`);
  } catch (error) {
    console.error('Error accepting property invitation:', error);
    throw error;
  }
};

/**
 * Decline a property invitation
 */
export const declinePropertyInvitation = async (invitationId: string): Promise<void> => {
  try {
    if (!invitationId) {
      throw new Error('Invitation ID is required');
    }

    const invitationRef = doc(db, 'propertyInvitations', invitationId);
    await updateDoc(invitationRef, {
      status: 'declined',
      declinedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log(`Property invitation ${invitationId} declined`);
  } catch (error) {
    console.error('Error declining property invitation:', error);
    throw error;
  }
};

/**
 * Update property invitation status
 */
export const updatePropertyInvitationStatus = async (
  invitationId: string, 
  status: PropertyInvitationStatus,
  tenantId?: string
): Promise<void> => {
  try {
    if (!invitationId) {
      throw new Error('Invitation ID is required');
    }

    const invitationRef = doc(db, 'propertyInvitations', invitationId);
    const updateData: Record<string, any> = {
      status,
      updatedAt: serverTimestamp()
    };

    if (status === 'accepted') {
      updateData.acceptedAt = serverTimestamp();
      if (tenantId) {
        updateData.tenantId = tenantId;
      }
    } else if (status === 'declined') {
      updateData.declinedAt = serverTimestamp();
    }

    await updateDoc(invitationRef, updateData);
    console.log(`Property invitation ${invitationId} status updated to ${status}`);
  } catch (error) {
    console.error('Error updating property invitation status:', error);
    throw error;
  }
};

// Export as default object
const propertyInvitationService = {
  getPendingPropertyInvitations,
  getPendingPropertyInvitationsByUserId,
  acceptPropertyInvitation,
  declinePropertyInvitation,
  updatePropertyInvitationStatus
};

export default propertyInvitationService; 