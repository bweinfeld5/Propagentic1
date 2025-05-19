export interface InviteBase {
  // All fields from Invite EXCEPT id
  inviteId?: string; 
  tenantId?: string;
  tenantEmail?: string;
  email?: string; 
  propertyId: string;
  status?: 'pending' | 'accepted' | 'declined';
  createdAt?: any; 
  expiresAt?: any; 
  propertyName?: string;
  propertyAddress?: string;
  propertyPhoto?: string;
  managerName?: string;
  managerEmail?: string;
  managerPhone?: string;
  unitId?: string;
  unitDetails?: {
    unitNumber?: string;
    floor?: string;
    bedrooms?: number;
    bathrooms?: number;
  };
  landlordName?: string;
  landlordId?: string;
  role?: string;
  unitNumber?: string;
  [key: string]: any; // Index signature should also be here if needed for extensibility
}

export interface Invite extends InviteBase {
  id: string;
} 