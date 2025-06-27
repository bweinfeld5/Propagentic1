import { Timestamp } from 'firebase/firestore';

/**
 * Interface defining an invite for user registration
 */
export interface Invite {
  id: string;
  inviteId: string;
  email: string;
  role: 'tenant' | 'landlord' | 'contractor';
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  landlordId?: string;
  propertyId?: string;
  unitNumber?: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  acceptedAt?: Timestamp;
  acceptedBy?: string;
}

export default Invite; 