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
  ContractorProfile
} from './schema';

import { Invite } from '../types/invite';
import { 
  MaintenanceRequest,
  StatusChange,
  Communication,
  ContractorMaintenanceProfile,
  BulkOperation,
  RequestTemplate,
  ContractorRating,
  NotificationSettings,
  PhotoDocumentation,
  TimeTracking
} from '../types/maintenance';
import { createTypedConverter, safeCast } from '../utils/TypeUtils';

/**
 * Helper function to create a Firestore converter for any model type
 * @deprecated Use createTypedConverter from utils/TypeUtils.ts instead
 */
function createConverter<T extends { [key: string]: any }>(
  idField: keyof T
): FirestoreDataConverter<T> {
  return {
    toFirestore(model: WithFieldValue<T>): DocumentData {
      // Remove the ID fields from the data before storing
      const { [idField]: id, id: docId, ...data } = model as any;
      
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
      const result = {
        ...data,
        [idField]: snapshot.id,
        id: snapshot.id
      };
      return safeCast<T>(result);
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

// =============================================
// MAINTENANCE SYSTEM CONVERTERS
// =============================================

/**
 * Converter for MaintenanceRequest document
 */
export const maintenanceRequestConverter = createConverter<MaintenanceRequest>('id');

/**
 * Converter for Communication document (subcollection)
 */
export const communicationConverter = createConverter<Communication>('id');

/**
 * Converter for ContractorMaintenanceProfile document
 */
export const contractorMaintenanceProfileConverter = createConverter<ContractorMaintenanceProfile>('contractorId');

/**
 * Converter for BulkOperation document
 */
export const bulkOperationConverter = createConverter<BulkOperation>('id');

/**
 * Converter for RequestTemplate document
 */
export const requestTemplateConverter = createConverter<RequestTemplate>('id');

/**
 * Converter for ContractorRating document
 */
export const contractorRatingConverter = createConverter<ContractorRating>('id');

/**
 * Converter for NotificationSettings document
 */
export const notificationSettingsConverter = createConverter<NotificationSettings>('userId');

/**
 * Converter for PhotoDocumentation document (subcollection)
 */
export const photoDocumentationConverter = createConverter<PhotoDocumentation>('id');

/**
 * Converter for TimeTracking document (subcollection)
 */
export const timeTrackingConverter = createConverter<TimeTracking>('sessionId');

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
  propertyId: string = '',
  unitNumber?: string
): Invite {
  const now = Timestamp.now();
  // Default expiration is 7 days from now
  const expiresAt = new Timestamp(
    now.seconds + 7 * 24 * 60 * 60,
    now.nanoseconds
  );
  
  return {
    id: inviteId,
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

// =============================================
// MAINTENANCE SYSTEM HELPER FUNCTIONS
// =============================================

/**
 * Create a new maintenance request with default values
 */
export function createNewMaintenanceRequest(
  requestData: {
    id: string;
    propertyId: string;
    propertyName: string;
    propertyAddress: string;
    tenantId: string;
    tenantName: string;
    tenantEmail: string;
    title: string;
    description: string;
    category: MaintenanceRequest['category'];
    priority: MaintenanceRequest['priority'];
    unitNumber?: string;
    isEmergency?: boolean;
  }
): MaintenanceRequest {
  const now = serverTimestamp() as Timestamp;
  
  return {
    id: requestData.id,
    propertyId: requestData.propertyId,
    propertyName: requestData.propertyName,
    propertyAddress: requestData.propertyAddress,
    tenantId: requestData.tenantId,
    tenantName: requestData.tenantName,
    tenantEmail: requestData.tenantEmail,
    tenantPhone: undefined,
    contractorId: undefined,
    contractorName: undefined,
    contractorEmail: undefined,
    contractorPhone: undefined,
    
    title: requestData.title,
    description: requestData.description,
    category: requestData.category,
    priority: requestData.priority,
    status: 'submitted',
    
    unitNumber: requestData.unitNumber,
    specificLocation: undefined,
    accessInstructions: undefined,
    
    preferredTimeSlots: undefined,
    scheduledDate: undefined,
    estimatedDuration: undefined,
    
    photos: [],
    
    estimatedCost: undefined,
    actualCost: undefined,
    costBreakdown: undefined,
    budgetApprovalRequired: false,
    budgetApproved: undefined,
    
    createdAt: now,
    updatedAt: now,
    completedDate: undefined,
    lastStatusChange: now,
    
    statusHistory: [],
    communications: [],
    timeTracking: [],
    
    isEmergency: requestData.isEmergency || false,
    emergencyContact: undefined,
    
    rating: undefined,
    tenantSatisfaction: undefined,
    
    templateUsed: undefined,
    aiClassification: undefined,
    
    permitRequired: undefined,
    permitNumber: undefined,
    warrantyWork: undefined,
    insuranceClaim: undefined,
    
    isRecurring: undefined,
    recurringSchedule: undefined
  };
}

/**
 * Create a new status change entry
 */
export function createNewStatusChange(
  status: StatusChange['status'],
  userId: string,
  userRole: StatusChange['userRole'],
  notes?: string,
  automaticChange: boolean = false
): StatusChange {
  return {
    status,
    timestamp: serverTimestamp() as Timestamp,
    userId,
    userRole,
    notes,
    automaticChange
  };
}

/**
 * Create a new communication entry
 */
export function createNewCommunication(
  id: string,
  userId: string,
  userRole: Communication['userRole'],
  userName: string,
  message: string,
  messageType: Communication['messageType'] = 'message',
  attachments: string[] = [],
  isUrgent: boolean = false
): Communication {
  return {
    id,
    userId,
    userRole,
    userName,
    message,
    timestamp: serverTimestamp() as Timestamp,
    attachments,
    readBy: [userId], // Creator has read it
    messageType,
    isUrgent
  };
}

/**
 * Create a new contractor maintenance profile with default values
 */
export function createNewContractorMaintenanceProfile(
  contractorId: string,
  userId: string,
  skills: ContractorMaintenanceProfile['skills'] = [],
  hourlyRate: number = 50
): ContractorMaintenanceProfile {
  const now = serverTimestamp() as Timestamp;
  
  return {
    contractorId,
    userId,
    
    skills,
    certifications: [],
    
    availability: {
      isAvailable: true,
      maxConcurrentJobs: 5,
      workingHours: {
        monday: { start: '08:00', end: '17:00', available: true },
        tuesday: { start: '08:00', end: '17:00', available: true },
        wednesday: { start: '08:00', end: '17:00', available: true },
        thursday: { start: '08:00', end: '17:00', available: true },
        friday: { start: '08:00', end: '17:00', available: true },
        saturday: { start: '09:00', end: '15:00', available: false },
        sunday: { start: '09:00', end: '15:00', available: false }
      },
      emergencyAvailable: false,
      serviceRadius: 25, // 25 miles
      baseLocation: {
        latitude: 0,
        longitude: 0,
        address: ''
      }
    },
    
    performance: {
      totalJobs: 0,
      completedJobs: 0,
      averageRating: 0,
      onTimePercentage: 0,
      responseTime: 0,
      completionRate: 0
    },
    
    rates: {
      hourlyRate,
      emergencyRate: hourlyRate * 1.5,
      minimumCharge: hourlyRate,
      travelCharge: 0
    },
    
    preferredProperties: [],
    blacklistedProperties: [],
    preferredCategories: [],
    
    businessInfo: {
      companyName: undefined,
      licenseNumber: undefined,
      insuranceInfo: undefined,
      bondedInfo: undefined
    },
    
    createdAt: now,
    updatedAt: now,
    isVerified: false,
    verificationDate: undefined,
    isActive: true,
    lastActiveDate: now
  };
}

/**
 * Create a new request template
 */
export function createNewRequestTemplate(
  id: string,
  title: string,
  description: string,
  category: RequestTemplate['category'],
  suggestedPriority: RequestTemplate['suggestedPriority'],
  estimatedDuration: number,
  createdBy: string
): RequestTemplate {
  return {
    id,
    title,
    description,
    category,
    suggestedPriority,
    estimatedDuration,
    commonSolutions: [],
    requiredPhotos: [],
    isActive: true,
    createdBy,
    createdAt: serverTimestamp() as Timestamp,
    usageCount: 0
  };
}

/**
 * Create a new contractor rating
 */
export function createNewContractorRating(
  id: string,
  requestId: string,
  contractorId: string,
  ratedBy: string,
  raterRole: ContractorRating['raterRole'],
  rating: number,
  categories: ContractorRating['categories'],
  wouldRecommend: boolean,
  feedback?: string
): ContractorRating {
  return {
    id,
    requestId,
    contractorId,
    ratedBy,
    raterRole,
    rating,
    feedback,
    categories,
    timestamp: serverTimestamp() as Timestamp,
    wouldRecommend
  };
}

/**
 * Create default notification settings for a user
 */
export function createDefaultNotificationSettings(
  userId: string,
  userRole: NotificationSettings['userRole']
): NotificationSettings {
  // Different default settings based on role
  const baseSettings = {
    userId,
    userRole,
    
    email: {
      enabled: true,
      newRequests: true,
      statusUpdates: true,
      assignments: true,
      completions: true,
      emergencies: true,
      ratings: true,
      reminders: true
    },
    
    push: {
      enabled: false, // Future feature, default disabled
      newRequests: false,
      statusUpdates: false,
      assignments: false,
      completions: false,
      emergencies: false,
      ratings: false,
      reminders: false
    },
    
    sms: {
      enabled: false, // Future feature, default disabled
      emergencyOnly: true,
      phone: undefined
    },
    
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00',
      timezone: 'America/New_York'
    },
    
    updatedAt: serverTimestamp() as Timestamp
  };

  // Role-specific adjustments
  if (userRole === 'contractor') {
    baseSettings.email.newRequests = true; // Contractors want to know about new jobs
    baseSettings.email.assignments = true;
  } else if (userRole === 'tenant') {
    baseSettings.email.assignments = false; // Tenants don't care about assignments to contractors
    baseSettings.email.statusUpdates = true; // But they want status updates
  } else if (userRole === 'landlord') {
    // Landlords want all notifications by default
    baseSettings.email.newRequests = true;
    baseSettings.email.statusUpdates = true;
    baseSettings.email.assignments = true;
    baseSettings.email.completions = true;
  }

  return baseSettings;
}

/**
 * Create a new photo documentation entry
 */
export function createNewPhotoDocumentation(
  id: string,
  url: string,
  uploadedBy: string,
  photoType: PhotoDocumentation['photoType'],
  description?: string,
  thumbnailUrl?: string
): PhotoDocumentation {
  return {
    id,
    url,
    thumbnailUrl,
    uploadedBy,
    uploadedAt: serverTimestamp() as Timestamp,
    description,
    photoType,
    location: undefined,
    metadata: undefined
  };
}

/**
 * Create a new time tracking entry
 */
export function createNewTimeTracking(
  sessionId: string,
  contractorId: string,
  description: string,
  startTime?: Timestamp
): TimeTracking {
  return {
    sessionId,
    startTime: startTime || serverTimestamp() as Timestamp,
    endTime: undefined,
    totalMinutes: undefined,
    breakMinutes: 0,
    description,
    contractorId,
    location: undefined,
    photos: []
  };
} 