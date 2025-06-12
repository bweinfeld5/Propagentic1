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
  TenantUser,
  BaseUser,
  TenantProfile,
  PropertyAssociation,
  Invite,
  InviteCode,
  MaintenanceTicket,
  Property,
  Unit,
  Notification,
  EmergencyContact,
  DocumentReference,
  UserPreferences,
  NotificationPreferences
} from './tenantSchema';

import { createTypedConverter, safeCast } from '../utils/TypeUtils';

/**
 * Helper function to safely convert Firestore timestamps
 */
function convertTimestamp(timestamp: any): Timestamp {
  if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp as Timestamp;
  }
  if (timestamp instanceof Date) {
    return Timestamp.fromDate(timestamp);
  }
  if (typeof timestamp === 'string') {
    return Timestamp.fromDate(new Date(timestamp));
  }
  return Timestamp.now();
}

/**
 * Helper function to validate and set default preferences
 */
function validateUserPreferences(preferences: any): UserPreferences {
  const defaultNotifications: NotificationPreferences = {
    email: true,
    push: true,
    sms: false,
    maintenanceUpdates: true,
    invoiceReminders: true,
    leaseUpdates: true,
    emergencyAlerts: true
  };

  const defaultPreferences: UserPreferences = {
    notifications: defaultNotifications,
    theme: 'light',
    language: 'en',
    timezone: 'America/New_York',
    contactPreference: 'email'
  };

  if (!preferences || typeof preferences !== 'object') {
    return defaultPreferences;
  }

  return {
    notifications: { ...defaultNotifications, ...(preferences.notifications || {}) },
    theme: preferences.theme || defaultPreferences.theme,
    language: preferences.language || defaultPreferences.language,
    timezone: preferences.timezone || defaultPreferences.timezone,
    contactPreference: preferences.contactPreference || defaultPreferences.contactPreference
  };
}

/**
 * Enhanced converter for BaseUser documents
 */
const baseUserConverter: FirestoreDataConverter<BaseUser> = {
  toFirestore(user: WithFieldValue<BaseUser>): DocumentData {
    const { uid, ...userData } = user as any;
    
    return {
      ...userData,
      updatedAt: serverTimestamp(),
      // Ensure preferences are properly structured
      preferences: user.preferences || validateUserPreferences(null)
    };
  },
  
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options?: SnapshotOptions
  ): BaseUser {
    const data = snapshot.data(options);
    
    return safeCast<BaseUser>({
      uid: snapshot.id,
      email: data.email || '',
      role: data.role || data.userType || 'tenant',
      userType: data.userType || data.role || 'tenant',
      name: data.name || `${data.firstName || ''} ${data.lastName || ''}`.trim(),
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      avatar: data.avatar,
      status: data.status || 'active',
      emailVerified: data.emailVerified || false,
      onboardingComplete: data.onboardingComplete || false,
      profileComplete: data.profileComplete || false,
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt),
      lastLoginAt: data.lastLoginAt ? convertTimestamp(data.lastLoginAt) : undefined,
      preferences: validateUserPreferences(data.preferences)
    });
  }
};

/**
 * Enhanced converter for TenantUser documents
 */
const tenantUserConverter: FirestoreDataConverter<TenantUser> = {
  toFirestore(tenant: WithFieldValue<TenantUser>): DocumentData {
    const { uid, ...tenantData } = tenant as any;
    
    return {
      ...tenantData,
      role: 'tenant',
      userType: 'tenant',
      updatedAt: serverTimestamp()
    };
  },
  
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options?: SnapshotOptions
  ): TenantUser {
    const data = snapshot.data(options);
    const baseUser = baseUserConverter.fromFirestore(snapshot, options);
    
    return safeCast<TenantUser>({
      ...baseUser,
      role: 'tenant',
      tenantProfile: data.tenantProfile || {
        tenantId: snapshot.id,
        emergencyContact: {
          name: '',
          phone: '',
          relationship: ''
        },
        hasKeys: false,
        accessCodes: [],
        documents: []
      },
      propertyAssociations: (data.propertyAssociations || []).map((assoc: any) => ({
        propertyId: assoc.propertyId,
        unitId: assoc.unitId,
        unitNumber: assoc.unitNumber,
        status: assoc.status || 'pending',
        startDate: convertTimestamp(assoc.startDate),
        endDate: assoc.endDate ? convertTimestamp(assoc.endDate) : undefined,
        inviteId: assoc.inviteId,
        inviteCodeId: assoc.inviteCodeId
      }))
    });
  }
};

/**
 * Converter for TenantProfile documents (stored separately)
 */
const tenantProfileConverter: FirestoreDataConverter<TenantProfile> = {
  toFirestore(profile: WithFieldValue<TenantProfile>): DocumentData {
    const { tenantId, ...profileData } = profile as any;
    
    return {
      ...profileData,
      updatedAt: serverTimestamp()
    };
  },
  
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options?: SnapshotOptions
  ): TenantProfile {
    const data = snapshot.data(options);
    
    return safeCast<TenantProfile>({
      tenantId: snapshot.id,
      landlordId: data.landlordId,
      emergencyContact: data.emergencyContact || {
        name: '',
        phone: '',
        relationship: ''
      },
      moveInDate: data.moveInDate ? convertTimestamp(data.moveInDate) : undefined,
      leaseEndDate: data.leaseEndDate ? convertTimestamp(data.leaseEndDate) : undefined,
      rentAmount: data.rentAmount,
      securityDeposit: data.securityDeposit,
      petDeposit: data.petDeposit,
      hasKeys: data.hasKeys || false,
      accessCodes: data.accessCodes || [],
      notes: data.notes,
      documents: (data.documents || []).map((doc: any) => ({
        id: doc.id,
        name: doc.name,
        type: doc.type,
        url: doc.url,
        uploadedAt: convertTimestamp(doc.uploadedAt)
      }))
    });
  }
};

/**
 * Enhanced converter for Invite documents
 */
const inviteConverter: FirestoreDataConverter<Invite> = {
  toFirestore(invite: WithFieldValue<Invite>): DocumentData {
    const { inviteId, ...inviteData } = invite as any;
    
    return {
      ...inviteData,
      updatedAt: serverTimestamp()
    };
  },
  
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options?: SnapshotOptions
  ): Invite {
    const data = snapshot.data(options);
    
    return safeCast<Invite>({
      inviteId: snapshot.id,
      type: data.type || 'email',
      status: data.status || 'pending',
      tenantEmail: data.tenantEmail || '',
      landlordId: data.landlordId || '',
      landlordName: data.landlordName,
      propertyId: data.propertyId || '',
      propertyName: data.propertyName,
      propertyAddress: data.propertyAddress,
      unitId: data.unitId,
      unitNumber: data.unitNumber,
      inviteCode: data.inviteCode,
      message: data.message,
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt),
      expiresAt: convertTimestamp(data.expiresAt),
      acceptedAt: data.acceptedAt ? convertTimestamp(data.acceptedAt) : undefined,
      acceptedBy: data.acceptedBy
    });
  }
};

/**
 * Enhanced converter for InviteCode documents
 */
const inviteCodeConverter: FirestoreDataConverter<InviteCode> = {
  toFirestore(inviteCode: WithFieldValue<InviteCode>): DocumentData {
    const { id, ...codeData } = inviteCode as any;
    
    return {
      ...codeData,
      updatedAt: serverTimestamp()
    };
  },
  
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options?: SnapshotOptions
  ): InviteCode {
    const data = snapshot.data(options);
    
    return safeCast<InviteCode>({
      id: snapshot.id,
      code: data.code || '',
      landlordId: data.landlordId || '',
      propertyId: data.propertyId || '',
      propertyName: data.propertyName,
      unitId: data.unitId,
      email: data.email,
      status: data.status || 'active',
      createdAt: convertTimestamp(data.createdAt),
      expiresAt: convertTimestamp(data.expiresAt),
      usedAt: data.usedAt ? convertTimestamp(data.usedAt) : undefined,
      usedBy: data.usedBy,
      maxUses: data.maxUses || 1,
      currentUses: data.currentUses || 0
    });
  }
};

/**
 * Enhanced converter for MaintenanceTicket documents
 */
const maintenanceTicketConverter: FirestoreDataConverter<MaintenanceTicket> = {
  toFirestore(ticket: WithFieldValue<MaintenanceTicket>): DocumentData {
    const { ticketId, ...ticketData } = ticket as any;
    
    return {
      ...ticketData,
      updatedAt: serverTimestamp()
    };
  },
  
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options?: SnapshotOptions
  ): MaintenanceTicket {
    const data = snapshot.data(options);
    
    return safeCast<MaintenanceTicket>({
      ticketId: snapshot.id,
      title: data.title || data.issueTitle || '',
      description: data.description || '',
      category: data.category || data.issueType || 'other',
      priority: data.priority || data.urgency || 'medium',
      status: data.status || 'pending',
      
      // Location details
      propertyId: data.propertyId || '',
      propertyName: data.propertyName,
      unitId: data.unitId,
      unitNumber: data.unitNumber,
      location: data.location || '',
      
      // Stakeholders
      submittedBy: data.submittedBy || '',
      submittedByName: data.submittedByName,
      assignedTo: data.assignedTo,
      assignedToName: data.assignedToName,
      landlordId: data.landlordId || '',
      
      // Media and documentation
      photos: (data.photos || []).map((photo: any) => ({
        id: photo.id,
        url: photo.url,
        thumbnail: photo.thumbnail,
        caption: photo.caption,
        uploadedBy: photo.uploadedBy,
        uploadedAt: convertTimestamp(photo.uploadedAt)
      })),
      documents: (data.documents || []).map((doc: any) => ({
        id: doc.id,
        name: doc.name,
        type: doc.type,
        url: doc.url,
        size: doc.size,
        uploadedBy: doc.uploadedBy,
        uploadedAt: convertTimestamp(doc.uploadedAt)
      })),
      
      // Scheduling
      preferredTimes: data.preferredTimes || data.availableTimes || [],
      scheduledDate: data.scheduledDate ? convertTimestamp(data.scheduledDate) : undefined,
      completedDate: data.completedDate ? convertTimestamp(data.completedDate) : undefined,
      
      // Communication
      updates: (data.updates || []).map((update: any) => ({
        id: update.id,
        type: update.type,
        title: update.title,
        description: update.description,
        createdBy: update.createdBy,
        createdByName: update.createdByName,
        createdAt: convertTimestamp(update.createdAt),
        previousValue: update.previousValue,
        newValue: update.newValue,
        attachments: update.attachments || []
      })),
      messages: (data.messages || []).map((message: any) => ({
        id: message.id,
        text: message.text,
        senderId: message.senderId,
        senderName: message.senderName,
        senderRole: message.senderRole,
        recipientIds: message.recipientIds || [],
        attachments: message.attachments || [],
        createdAt: convertTimestamp(message.createdAt),
        readBy: message.readBy || {}
      })),
      
      // Metadata
      estimatedCost: data.estimatedCost,
      actualCost: data.actualCost,
      workOrderNumber: data.workOrderNumber,
      externalId: data.externalId,
      
      // Timestamps
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt),
      acknowledgedAt: data.acknowledgedAt ? convertTimestamp(data.acknowledgedAt) : undefined,
      assignedAt: data.assignedAt ? convertTimestamp(data.assignedAt) : undefined,
      startedAt: data.startedAt ? convertTimestamp(data.startedAt) : undefined,
      completedAt: data.completedAt ? convertTimestamp(data.completedAt) : undefined,
      closedAt: data.closedAt ? convertTimestamp(data.closedAt) : undefined
    });
  }
};

/**
 * Enhanced converter for Property documents (tenant view)
 */
const propertyConverter: FirestoreDataConverter<Property> = {
  toFirestore(property: WithFieldValue<Property>): DocumentData {
    const { propertyId, ...propertyData } = property as any;
    
    return {
      ...propertyData,
      updatedAt: serverTimestamp()
    };
  },
  
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options?: SnapshotOptions
  ): Property {
    const data = snapshot.data(options);
    
    return safeCast<Property>({
      propertyId: snapshot.id,
      name: data.name || data.propertyName,
      nickname: data.nickname,
      type: data.type || data.propertyType || 'apartment',
      status: data.status || 'active',
      address: {
        street: data.address?.street || data.streetAddress || '',
        streetAddress: data.address?.streetAddress || data.streetAddress || '',
        city: data.address?.city || data.city || '',
        state: data.address?.state || data.state || '',
        zipCode: data.address?.zipCode || data.address?.zip || data.zipCode || data.zip || '',
        zip: data.address?.zip || data.zip || data.zipCode || '',
        country: data.address?.country || 'US',
        coordinates: data.address?.coordinates || data.coordinates
      },
      landlordId: data.landlordId || '',
      landlordName: data.landlordName,
      description: data.description,
      amenities: data.amenities || [],
      units: (data.units || []).map((unit: any) => ({
        unitId: unit.unitId || unit.id,
        unitNumber: unit.unitNumber || unit.number,
        type: unit.type || 'other',
        squareFootage: unit.squareFootage,
        bedrooms: unit.bedrooms || 0,
        bathrooms: unit.bathrooms || 0,
        rentAmount: unit.rentAmount,
        status: unit.status || 'vacant',
        tenantId: unit.tenantId,
        amenities: unit.amenities || [],
        notes: unit.notes
      })),
      rules: (data.rules || []).map((rule: any) => ({
        id: rule.id,
        title: rule.title,
        description: rule.description,
        category: rule.category || 'other',
        mandatory: rule.mandatory || false
      })),
      emergencyInfo: data.emergencyInfo || {
        primaryContact: { name: '', phone: '' },
        emergencyServices: {
          police: '911',
          fire: '911',
          medical: '911',
          poison: '1-800-222-1222'
        },
        utilities: {}
      },
      maintenanceInfo: data.maintenanceInfo || {
        schedule: {
          office_hours: '9 AM - 5 PM',
          emergency_hours: '24/7',
          response_time: '24-48 hours'
        },
        contact: {
          phone: '',
          email: ''
        },
        procedures: {
          routine: 'Submit maintenance request online',
          emergency: 'Call emergency number immediately',
          after_hours: 'Leave voicemail or send email'
        }
      },
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt)
    });
  }
};

/**
 * Converter for Notification documents
 */
const notificationConverter: FirestoreDataConverter<Notification> = {
  toFirestore(notification: WithFieldValue<Notification>): DocumentData {
    const { id, ...notificationData } = notification as any;
    
    return {
      ...notificationData,
      updatedAt: serverTimestamp()
    };
  },
  
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options?: SnapshotOptions
  ): Notification {
    const data = snapshot.data(options);
    
    return safeCast<Notification>({
      id: snapshot.id,
      type: data.type || 'system_announcement',
      priority: data.priority || 'low',
      title: data.title || '',
      message: data.message || '',
      userId: data.userId || '',
      read: data.read || false,
      actionUrl: data.actionUrl,
      actionLabel: data.actionLabel,
      data: data.data || {},
      createdAt: convertTimestamp(data.createdAt),
      readAt: data.readAt ? convertTimestamp(data.readAt) : undefined,
      expiresAt: data.expiresAt ? convertTimestamp(data.expiresAt) : undefined
    });
  }
};

/**
 * Utility function to get the appropriate converter for a collection
 */
export function getConverterForCollection(collectionName: string): FirestoreDataConverter<any> | null {
  const converters: Record<string, FirestoreDataConverter<any>> = {
    'users': baseUserConverter,
    'tenants': tenantUserConverter,
    'tenantProfiles': tenantProfileConverter,
    'invites': inviteConverter,
    'inviteCodes': inviteCodeConverter,
    'tickets': maintenanceTicketConverter,
    'properties': propertyConverter,
    'notifications': notificationConverter
  };
  
  return converters[collectionName] || null;
}

/**
 * Export all converters
 */
export {
  baseUserConverter,
  tenantUserConverter,
  tenantProfileConverter,
  inviteConverter,
  inviteCodeConverter,
  maintenanceTicketConverter,
  propertyConverter,
  notificationConverter
}; 