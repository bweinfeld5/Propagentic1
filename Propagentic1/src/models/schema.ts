import { Timestamp } from 'firebase/firestore';

/**
 * User interface - base type for all users
 */
export interface User {
  uid: string;
  role: 'tenant' | 'landlord' | 'contractor';
  name: string;
  email: string;
  phone: string;
  linkedTo: string[]; // Linked accounts (family members, etc.)
  createdAt: Timestamp;
  profileComplete: boolean;
}

/**
 * Tenant user interface
 */
export interface TenantUser extends User {
  role: 'tenant';
  landlordId: string; // Reference to landlord
  propertyId: string; // Reference to property
  unitNumber: string; // Unit number within property
}

/**
 * Landlord user interface
 */
export interface LandlordUser extends User {
  role: 'landlord';
}

/**
 * Contractor user interface
 */
export interface ContractorUser extends User {
  role: 'contractor';
  contractorSkills: string[]; // List of skills/specialties
  companyId?: string; // Optional reference to company
}

/**
 * Property interface
 */
export interface Property {
  propertyId: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  propertyName: string;
  unitList: string[]; // Array of unit numbers/identifiers
  landlordId: string; // Reference to the owner/landlord
  tenantIds: string[]; // References to tenant users
  activeRequests: string[]; // References to active maintenance tickets
  createdAt: Timestamp;
}

/**
 * Maintenance ticket interface
 */
export interface MaintenanceTicket {
  ticketId: string;
  description: string;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  category: string; // Type of maintenance issue
  photoUrl?: string; // Optional photo of the issue
  status: TicketStatus;
  submittedBy: string; // Reference to user who submitted
  propertyId: string; // Reference to property
  unitNumber: string; // Unit number within property
  assignedTo?: string; // Reference to contractor assigned (if any)
  timestamps: {
    createdAt: Timestamp;
    updatedAt: Timestamp;
    assignedAt?: Timestamp;
    completedAt?: Timestamp;
    classifiedAt?: Timestamp;
  };
}

/**
 * Ticket status types
 */
export type TicketStatus = 
  'pending_classification' | 
  'classified' | 
  'assigned' | 
  'in_progress' | 
  'completed' | 
  'canceled';

/**
 * Landlord profile interface
 */
export interface LandlordProfile {
  landlordId: string;
  userId: string; // Reference to user document
  properties: string[]; // References to property documents
  tenants: string[]; // References to tenant users
  contractors: string[]; // References to trusted contractors
  invitesSent: string[]; // References to invites sent
}

/**
 * Contractor profile interface
 */
export interface ContractorProfile {
  contractorId: string;
  userId: string; // Reference to user document
  skills: string[]; // List of skills/specialties
  serviceArea: string; // Geographic service area
  availability: boolean; // Whether contractor is available for new jobs
  preferredProperties: string[]; // Properties they prefer to work with
  rating: number; // Average rating (0-5)
  jobsCompleted: number; // Number of jobs completed
  companyName?: string; // Optional company name
}

/**
 * Invite interface
 */
export interface Invite {
  inviteId: string;
  email: string;
  role: 'tenant' | 'contractor';
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  landlordId?: string; // Reference to landlord who sent the invite
  propertyId?: string; // Property ID (for tenant invites)
  unitNumber?: string; // Unit number (for tenant invites)
  createdAt: Timestamp;
  expiresAt: Timestamp;
} 