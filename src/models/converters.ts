import { 
  DocumentData, 
  FirestoreDataConverter, 
  QueryDocumentSnapshot, 
  SnapshotOptions, 
  Timestamp, 
  WithFieldValue,
  serverTimestamp
} from 'firebase/firestore';

import {
  User,
  TenantUser,
  LandlordUser,
  ContractorUser,
  Property,
  MaintenanceTicket,
  LandlordProfile,
  ContractorProfile,
  Invite
} from './schema';

/**
 * Helper function to create a Firestore converter for any model type
 */
function createConverter<T extends { [key: string]: any }>(
  idField: keyof T
): FirestoreDataConverter<T> {
  return {
    toFirestore(model: WithFieldValue<T>): DocumentData {
      // Remove the ID field from the data before storing
      const { [idField]: id, ...data } = model as any;
      
      // Filter out undefined fields
      const filteredData = Object.entries(data).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);
      
      return filteredData;
    },
    
    fromFirestore(
      snapshot: QueryDocumentSnapshot,
      options?: SnapshotOptions
    ): T {
      const data = snapshot.data(options);
      
      // Add the document ID to the data
      return {
        ...data,
        [idField]: snapshot.id
      } as T;
    }
  };
}

/**
 * Converter for User document
 */
export const userConverter = createConverter<User>('uid');

/**
 * Converter for Property document
 */
export const propertyConverter = createConverter<Property>('propertyId');

/**
 * Converter for MaintenanceTicket document
 */
export const maintenanceTicketConverter = createConverter<MaintenanceTicket>('ticketId');

/**
 * Converter for LandlordProfile document
 */
export const landlordProfileConverter = createConverter<LandlordProfile>('landlordId');

/**
 * Converter for ContractorProfile document
 */
export const contractorProfileConverter = createConverter<ContractorProfile>('contractorId');

/**
 * Converter for Invite document
 */
export const inviteConverter = createConverter<Invite>('inviteId');

/**
 * Helper functions for creating new documents with default values
 */

/**
 * Create a new user with default values
 */
export function createNewUser(
  uid: string,
  role: User['role'],
  name: string,
  email: string,
  phone?: string
): User {
  return {
    uid,
    role,
    name,
    email,
    phone: phone || '',
    linkedTo: [],
    createdAt: serverTimestamp() as Timestamp,
    profileComplete: false
  };
}

/**
 * Create a new tenant user with default values
 */
export function createNewTenantUser(
  uid: string,
  name: string,
  email: string,
  landlordId: string,
  propertyId: string,
  unitNumber: string,
  phone?: string
): TenantUser {
  return {
    ...createNewUser(uid, 'tenant', name, email, phone),
    role: 'tenant',
    landlordId,
    propertyId,
    unitNumber
  };
}

/**
 * Create a new landlord user with default values
 */
export function createNewLandlordUser(
  uid: string,
  name: string,
  email: string,
  phone?: string
): LandlordUser {
  return {
    ...createNewUser(uid, 'landlord', name, email, phone),
    role: 'landlord'
  };
}

/**
 * Create a new contractor user with default values
 */
export function createNewContractorUser(
  uid: string,
  name: string,
  email: string,
  skills: string[] = [],
  phone?: string,
  companyId?: string
): ContractorUser {
  return {
    ...createNewUser(uid, 'contractor', name, email, phone),
    role: 'contractor',
    contractorSkills: skills,
    companyId
  };
}

/**
 * Create a new property with default values
 */
export function createNewProperty(
  propertyId: string,
  propertyName: string,
  address: Property['address'],
  landlordId: string,
  unitList: string[] = []
): Property {
  return {
    propertyId,
    propertyName,
    address,
    landlordId,
    unitList,
    tenantIds: [],
    activeRequests: [],
    createdAt: serverTimestamp() as Timestamp
  };
}

/**
 * Create a new maintenance ticket with default values
 */
export function createNewMaintenanceTicket(
  ticketId: string,
  description: string,
  urgency: MaintenanceTicket['urgency'],
  propertyId: string,
  unitNumber: string,
  submittedBy: string,
  photoUrl?: string
): MaintenanceTicket {
  return {
    ticketId,
    description,
    urgency,
    category: '', // Will be determined by AI classification
    photoUrl,
    status: 'pending_classification',
    submittedBy,
    propertyId,
    unitNumber,
    timestamps: {
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp
    }
  };
}

/**
 * Create a new landlord profile with default values
 */
export function createNewLandlordProfile(
  landlordId: string
): LandlordProfile {
  return {
    landlordId,
    userId: landlordId,
    properties: [],
    tenants: [],
    contractors: [],
    invitesSent: []
  };
}

/**
 * Create a new contractor profile with default values
 */
export function createNewContractorProfile(
  contractorId: string,
  skills: string[] = [],
  serviceArea: ContractorProfile['serviceArea'] = '',
  companyName?: string
): ContractorProfile {
  return {
    contractorId,
    userId: contractorId,
    skills,
    serviceArea,
    availability: true,
    preferredProperties: [],
    rating: 0,
    jobsCompleted: 0,
    companyName
  };
}

/**
 * Create a new invite with default values
 */
export function createNewInvite(
  inviteId: string,
  email: string,
  role: Invite['role'],
  landlordId?: string,
  propertyId?: string,
  unitNumber?: string
): Invite {
  const now = Timestamp.now();
  // Default expiration is 7 days from now
  const expiresAt = new Timestamp(
    now.seconds + 7 * 24 * 60 * 60,
    now.nanoseconds
  );
  
  return {
    inviteId,
    email,
    role,
    status: 'pending',
    landlordId,
    propertyId,
    unitNumber,
    createdAt: now,
    expiresAt
  };
} 