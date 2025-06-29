import { Timestamp, FieldValue } from 'firebase/firestore';

/**
 * Enhanced Tenant Dashboard Data Models
 * Phase 1 - Foundation: Critical data structures and types
 */

// ==================== CORE USER TYPES ====================

export type UserRole = 'tenant' | 'landlord' | 'contractor' | 'admin' | 'system';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending_verification';

/**
 * Base User interface - foundation for all user types
 */
export interface BaseUser {
  uid: string;
  email: string;
  role: UserRole;
  userType: UserRole; // For backward compatibility
  name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  status: UserStatus;
  emailVerified: boolean;
  onboardingComplete: boolean;
  profileComplete: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt?: Timestamp;
  preferences: UserPreferences;
}

/**
 * User Preferences interface
 */
export interface UserPreferences {
  notifications: NotificationPreferences;
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  contactPreference: 'email' | 'phone' | 'text' | 'app';
}

/**
 * Notification Preferences interface
 */
export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  maintenanceUpdates: boolean;
  invoiceReminders: boolean;
  leaseUpdates: boolean;
  emergencyAlerts: boolean;
}

// ==================== TENANT-SPECIFIC TYPES ====================

/**
 * Tenant User interface - extends BaseUser
 */
export interface TenantUser extends BaseUser {
  role: 'tenant';
  tenantProfile: TenantProfile;
  propertyAssociations: PropertyAssociation[];
}

/**
 * Tenant Profile - detailed tenant information
 */
export interface TenantProfile {
  tenantId: string;
  landlordId?: string;
  emergencyContact: EmergencyContact;
  moveInDate?: Timestamp;
  leaseEndDate?: Timestamp;
  rentAmount?: number;
  securityDeposit?: number;
  petDeposit?: number;
  hasKeys: boolean;
  accessCodes: string[];
  notes?: string;
  documents: DocumentReference[];
}

/**
 * Property Association - links tenant to property/unit
 */
export interface PropertyAssociation {
  propertyId: string;
  unitId?: string;
  unitNumber?: string;
  status: 'active' | 'pending' | 'terminated' | 'invited';
  startDate: Timestamp;
  endDate?: Timestamp;
  inviteId?: string;
  inviteCodeId?: string;
}

/**
 * Emergency Contact information
 */
export interface EmergencyContact {
  name: string;
  phone: string;
  email?: string;
  relationship: string;
}

/**
 * Document Reference for tenant documents
 */
export interface DocumentReference {
  id: string;
  name: string;
  type: 'lease' | 'id' | 'insurance' | 'other';
  url: string;
  uploadedAt: Timestamp;
}

// ==================== INVITE & ONBOARDING TYPES ====================

export type InviteStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'revoked';
export type InviteType = 'email' | 'code' | 'link';

/**
 * Enhanced Invite interface
 */
export interface Invite {
  inviteId: string;
  type: InviteType;
  status: InviteStatus;
  tenantEmail: string;
  landlordId: string;
  landlordName?: string;
  propertyId: string;
  propertyName?: string;
  propertyAddress?: string;
  unitId?: string;
  unitNumber?: string;
  inviteCode?: string;
  message?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  expiresAt: Timestamp;
  acceptedAt?: Timestamp;
  acceptedBy?: string; // tenant uid
}

/**
 * Invite Code interface - for code-based invitations
 */
export interface InviteCode {
  id: string;
  code: string;
  landlordId: string;
  propertyId: string;
  propertyName?: string;
  unitId?: string;
  email?: string; // Optional email restriction
  status: 'active' | 'used' | 'expired' | 'revoked';
  createdAt: Timestamp;
  expiresAt: Timestamp;
  usedAt?: Timestamp;
  usedBy?: string; // tenant uid
  maxUses: number;
  currentUses: number;
}

/**
 * Tenant Onboarding Data
 */
export interface TenantOnboardingData {
  personalInfo: {
    firstName: string;
    lastName: string;
    phone: string;
    dateOfBirth?: string;
  };
  emergencyContact: EmergencyContact;
  preferences: Partial<UserPreferences>;
  propertyInfo: {
    moveInDate?: string;
    previousAddress?: string;
    hasInsurance: boolean;
    insuranceDetails?: string;
  };
  agreements: {
    termsAccepted: boolean;
    privacyAccepted: boolean;
    communicationConsent: boolean;
  };
}

// ==================== PROPERTY & UNIT TYPES ====================

export type PropertyType = 'apartment' | 'house' | 'condo' | 'townhouse' | 'commercial' | 'studio';
export type PropertyStatus = 'active' | 'inactive' | 'maintenance' | 'sold';

/**
 * Property interface - simplified for tenant view
 */
export interface Property {
  propertyId: string;
  name?: string;
  nickname?: string;
  type: PropertyType;
  status: PropertyStatus;
  address: PropertyAddress;
  landlordId: string;
  landlordName?: string;
  description?: string;
  amenities: string[];
  units: Unit[];
  tenants: string[]; // Array of tenant user IDs
  rules: PropertyRule[];
  emergencyInfo: EmergencyInfo;
  maintenanceInfo: MaintenanceInfo;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Property Address
 */
export interface PropertyAddress {
  street: string;
  streetAddress: string; // Full street address
  city: string;
  state: string;
  zipCode: string;
  zip: string; // For backward compatibility
  country?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

/**
 * Unit interface - individual units within property
 */
export interface Unit {
  unitId: string;
  unitNumber: string;
  type: 'studio' | '1br' | '2br' | '3br' | '4br+' | 'other';
  squareFootage?: number;
  bedrooms: number;
  bathrooms: number;
  rentAmount?: number;
  status: 'occupied' | 'vacant' | 'maintenance' | 'reserved';
  tenantId?: string;
  amenities: string[];
  notes?: string;
}

/**
 * Property Rules
 */
export interface PropertyRule {
  id: string;
  title: string;
  description: string;
  category: 'pets' | 'noise' | 'smoking' | 'parking' | 'guests' | 'maintenance' | 'other';
  mandatory: boolean;
}

/**
 * Emergency Information
 */
export interface EmergencyInfo {
  primaryContact: {
    name: string;
    phone: string;
    email?: string;
  };
  backupContact?: {
    name: string;
    phone: string;
    email?: string;
  };
  emergencyServices: {
    police: string;
    fire: string;
    medical: string;
    poison: string;
  };
  utilities: {
    gas?: string;
    electric?: string;
    water?: string;
    internet?: string;
  };
}

/**
 * Maintenance Information
 */
export interface MaintenanceInfo {
  schedule: {
    office_hours: string;
    emergency_hours: string;
    response_time: string;
  };
  contact: {
    phone: string;
    email: string;
    portal_url?: string;
  };
  procedures: {
    routine: string;
    emergency: string;
    after_hours: string;
  };
}

// ==================== MAINTENANCE TICKET TYPES ====================

export type TicketStatus = 
  'pending' | 
  'submitted' | 
  'acknowledged' | 
  'assigned' | 
  'in_progress' | 
  'scheduled' |
  'completed' | 
  'closed' | 
  'cancelled' | 
  'on_hold';

export type TicketPriority = 'low' | 'medium' | 'high' | 'emergency';
export type TicketCategory = 
  'plumbing' | 
  'electrical' | 
  'hvac' | 
  'appliance' | 
  'structural' | 
  'pest_control' | 
  'landscaping' | 
  'security' | 
  'other';

/**
 * Enhanced Maintenance Ticket interface
 */
export interface MaintenanceTicket {
  ticketId: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  
  // Location details
  propertyId: string;
  propertyName?: string;
  unitId?: string;
  unitNumber?: string;
  location: string; // Specific location within unit
  
  // Stakeholders
  submittedBy: string; // tenant uid
  submittedByName?: string;
  assignedTo?: string; // contractor uid
  assignedToName?: string;
  landlordId: string;
  
  // Media and documentation
  photos: TicketPhoto[];
  documents: TicketDocument[];
  
  // Scheduling
  preferredTimes: string[];
  scheduledDate?: Timestamp;
  completedDate?: Timestamp;
  
  // Communication
  updates: TicketUpdate[];
  messages: TicketMessage[];
  
  // Metadata
  estimatedCost?: number;
  actualCost?: number;
  workOrderNumber?: string;
  externalId?: string;
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  acknowledgedAt?: Timestamp;
  assignedAt?: Timestamp;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  closedAt?: Timestamp;
}

/**
 * Ticket Photo
 */
export interface TicketPhoto {
  id: string;
  url: string;
  thumbnail?: string;
  caption?: string;
  uploadedBy: string;
  uploadedAt: Timestamp;
}

/**
 * Ticket Document
 */
export interface TicketDocument {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
  uploadedBy: string;
  uploadedAt: Timestamp;
}

/**
 * Ticket Update - status and progress updates
 */
export interface TicketUpdate {
  id: string;
  type: 'status_change' | 'assignment' | 'progress' | 'completion' | 'schedule' | 'cost';
  title: string;
  description: string;
  createdBy: string;
  createdByName?: string;
  createdAt: Timestamp;
  previousValue?: string;
  newValue?: string;
  attachments?: TicketPhoto[];
}

/**
 * Ticket Message - communication between stakeholders
 */
export interface TicketMessage {
  id: string;
  text: string;
  senderId: string;
  senderName?: string;
  senderRole: UserRole;
  recipientIds: string[];
  attachments?: TicketPhoto[];
  createdAt: Timestamp;
  readBy: Record<string, Timestamp>; // userId -> timestamp
}

// ==================== FORM DATA TYPES ====================

/**
 * Maintenance Request Form Data
 */
export interface MaintenanceFormData {
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  location: string;
  photos: File[];
  preferredTimes: string[];
  contactPreference: 'email' | 'phone' | 'text' | 'app';
  allowEntry: boolean;
  urgentNotes?: string;
}

/**
 * Tenant Registration Form Data
 */
export interface TenantRegistrationData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  acceptCommunication: boolean;
}

// ==================== NOTIFICATION TYPES ====================

export type NotificationType = 
  'maintenance_update' | 
  'invite_received' | 
  'rent_reminder' | 
  'lease_expiring' | 
  'emergency_alert' | 
  'system_announcement';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

/**
 * Notification interface
 */
export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  userId: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  data?: Record<string, any>;
  createdAt: Timestamp;
  readAt?: Timestamp;
  expiresAt?: Timestamp;
}

// ==================== API RESPONSE TYPES ====================

/**
 * Standard API Response
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
}

/**
 * Paginated Response
 */
export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

/**
 * Validation Result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

// ==================== SERVICE INTERFACES ====================

/**
 * Invite Service Result
 */
export interface InviteServiceResult {
  success: boolean;
  message: string;
  data?: any;
  invite?: Invite;
  code?: string;
}

/**
 * Invite Code Validation Result
 */
export interface InviteCodeValidation {
  isValid: boolean;
  message: string;
  propertyId?: string;
  propertyName?: string;
  unitId?: string;
  restrictedEmail?: string;
  expiresAt?: Timestamp;
}

// ==================== UTILITY TYPES ====================

/**
 * Firestore Timestamp Helper
 */
export type FirestoreTimestamp = Timestamp | FieldValue;

/**
 * Optional ID type for new documents
 */
export type OptionalId<T> = Omit<T, 'id'> & { id?: string };

/**
 * Create type for new documents (without timestamps)
 */
export type CreateType<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Update type for existing documents
 */
export type UpdateType<T> = Partial<Omit<T, 'id' | 'createdAt'>> & { 
  updatedAt?: FirestoreTimestamp;
};

// ==================== EXPORTS ====================

// All types are already exported inline above
// No need for re-export block 