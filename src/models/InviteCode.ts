import { Timestamp, FirestoreDataConverter } from 'firebase/firestore';

/**
 * Interface defining an invite code for tenant registration
 */
export interface InviteCode {
  id: string;               // Unique identifier
  code: string;             // The actual code (alphanumeric)
  landlordId: string;       // Reference to landlord who created code
  propertyId: string;       // Property this code is for
  propertyName?: string;    // Property name for display purposes
  unitId?: string;          // Optional specific unit reference
  email?: string;           // Optional pre-assigned email
  status: 'active' | 'used' | 'expired' | 'revoked';
  createdAt: Timestamp;     // When code was created
  expiresAt: Timestamp;     // When code expires
  usedAt?: Timestamp;       // When code was used (if used)
  usedBy?: string;          // Tenant ID who used the code (if used)
}

/**
 * FirestoreDataConverter for InviteCode objects
 */
export const inviteCodeConverter: FirestoreDataConverter<InviteCode> = {
  toFirestore: (inviteCode: InviteCode) => {
    return {
      code: inviteCode.code,
      landlordId: inviteCode.landlordId,
      propertyId: inviteCode.propertyId,
      propertyName: inviteCode.propertyName || null,
      unitId: inviteCode.unitId || null,
      email: inviteCode.email || null,
      status: inviteCode.status,
      createdAt: inviteCode.createdAt,
      expiresAt: inviteCode.expiresAt,
      usedAt: inviteCode.usedAt || null,
      usedBy: inviteCode.usedBy || null,
    };
  },
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      code: data.code,
      landlordId: data.landlordId,
      propertyId: data.propertyId,
      propertyName: data.propertyName || undefined,
      unitId: data.unitId || undefined,
      email: data.email || undefined,
      status: data.status,
      createdAt: data.createdAt,
      expiresAt: data.expiresAt,
      usedAt: data.usedAt || undefined,
      usedBy: data.usedBy || undefined,
    } as InviteCode;
  },
};

/**
 * Creates a new invite code object with default values
 */
export function createInviteCode(
  code: string, 
  landlordId: string, 
  propertyId: string, 
  expirationDays = 7,
  options?: {
    unitId?: string;
    email?: string;
    propertyName?: string;
  }
): Omit<InviteCode, 'id'> {
  const now = Timestamp.now();
  const expiresAt = new Timestamp(
    now.seconds + (expirationDays * 24 * 60 * 60),
    now.nanoseconds
  );
  
  return {
    code,
    landlordId,
    propertyId,
    propertyName: options?.propertyName,
    unitId: options?.unitId,
    email: options?.email,
    status: 'active',
    createdAt: now,
    expiresAt,
  };
}

export default InviteCode; 