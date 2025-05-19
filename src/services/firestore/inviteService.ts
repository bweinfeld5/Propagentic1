import { Timestamp } from 'firebase/firestore';
import { Invite, InviteBase } from '../../types/invite';
import api, { FirestoreDocument, ApiError } from '../api';
import { CreateInviteSchema, type CreateInviteData, InviteSchema } from '../../schemas/inviteSchema';

/**
 * Get an invite by ID
 */
export async function getInviteById(inviteId: string): Promise<FirestoreDocument<InviteBase> | null> {
  return api.getById<InviteBase>('invites', inviteId, InviteSchema);
}

/**
 * Get invite by email
 */
export async function getInviteByEmail(email: string): Promise<FirestoreDocument<InviteBase> | null> {
  const queryOptions = {
    filters: [
      { field: 'tenantEmail', operator: '==' as const, value: email },
      { field: 'status', operator: '==' as const, value: 'pending' },
    ],
    limit: 1,
  };
  const invites = await api.getAll<InviteBase>('invites', queryOptions, InviteSchema);
  return invites.length > 0 ? invites[0] : null;
}

/**
 * Get pending invites for tenant
 */
export async function getPendingInvitesForTenant(tenantEmail: string): Promise<FirestoreDocument<InviteBase>[]> {
  if (!tenantEmail) {
    throw new Error('Tenant email is required');
  }

  try {
    const queryOptions = {
      filters: [
        { field: 'tenantEmail', operator: '==' as const, value: tenantEmail.toLowerCase() },
        { field: 'status', operator: '==' as const, value: 'pending' },
      ],
    };
    const invites = await api.getAll<InviteBase>('invites', queryOptions, InviteSchema);
    
    return invites;
  } catch (err: unknown) {
    const apiError = err as ApiError;
    console.error('Error getting pending invites:', apiError.message, apiError.originalError);
    throw new Error(`Failed to load pending invitations: ${apiError.message}`);
  }
}

/**
 * Create a new invite
 */
export async function createInvite(
  inviteInput: CreateInviteData
): Promise<string> {
  const now = Timestamp.now();
  const expiresAt = new Timestamp(
    now.seconds + 7 * 24 * 60 * 60,
    now.nanoseconds
  );

  const dataForApiCreate = {
    ...inviteInput,
    tenantEmail: inviteInput.tenantEmail.toLowerCase(),
    expiresAt: expiresAt,
  };

  return api.create<typeof CreateInviteSchema>(
    'invites',
    dataForApiCreate,
    CreateInviteSchema
  );
}

/**
 * Update an invite
 */
export async function updateInvite(
  docId: string,
  updateData: Partial<Omit<InviteBase, 'propertyId' | 'tenantEmail' | 'landlordId'>>
): Promise<void> {
  return api.update('invites', docId, updateData, InviteSchema);
}

/**
 * Delete an invite
 */
export async function deleteInvite(inviteId: string): Promise<void> {
  return api.delete('invites', inviteId);
}

/**
 * Accept an invite
 */
export async function acceptInvite(inviteId: string, userId: string): Promise<void> {
  const updateData: Partial<InviteBase> = {
    status: 'accepted',
    tenantId: userId,
  };
  await api.update('invites', inviteId, updateData, InviteSchema);
}

/**
 * Decline an invite
 */
export async function declineInvite(inviteId: string): Promise<void> {
  const updateData: Partial<InviteBase> = {
    status: 'declined',
  };
  await api.update('invites', inviteId, updateData, InviteSchema);
}

// Re-export functions as part of the default export
const inviteService = {
  getInviteById,
  getInviteByEmail,
  getPendingInvitesForTenant,
  createInvite,
  updateInvite,
  deleteInvite,
  acceptInvite,
  declineInvite
};

export default inviteService; 