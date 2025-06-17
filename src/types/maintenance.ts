import { Timestamp } from 'firebase/firestore';

/**
 * Maintenance request categories
 */
export type MaintenanceCategory = 
  | 'plumbing' 
  | 'electrical' 
  | 'hvac' 
  | 'general' 
  | 'emergency'
  | 'appliances'
  | 'carpentry'
  | 'painting'
  | 'flooring'
  | 'roofing'
  | 'landscaping'
  | 'pest_control'
  | 'security'
  | 'cleaning';

/**
 * Maintenance request priority levels
 */
export type MaintenancePriority = 
  | 'low' 
  | 'medium' 
  | 'high' 
  | 'urgent';

/**
 * Maintenance request status workflow
 */
export type MaintenanceStatus = 
  | 'submitted' 
  | 'assigned' 
  | 'in-progress' 
  | 'completed' 
  | 'cancelled'
  | 'pending_approval'
  | 'scheduled'
  | 'on_hold'
  | 'requires_parts';

/**
 * User roles in the maintenance system
 */
export type UserRole = 
  | 'landlord' 
  | 'tenant' 
  | 'contractor'
  | 'property_manager'
  | 'admin';

/**
 * Status change tracking interface
 */
export interface StatusChange {
  status: MaintenanceStatus;
  timestamp: Timestamp;
  userId: string;
  userRole: UserRole;
  notes?: string;
  automaticChange?: boolean; // True if changed by system automation
  estimatedCompletion?: Timestamp; // Updated estimated completion time
}

/**
 * Communication message interface
 */
export interface Communication {
  id: string;
  userId: string;
  userRole: UserRole;
  userName: string; // Display name for the message
  message: string;
  timestamp: Timestamp;
  attachments: string[]; // URLs to attached files/photos
  readBy: string[]; // Array of user IDs who have read this message
  messageType: 'message' | 'status_update' | 'system_notification';
  isUrgent?: boolean; // Flag for urgent communications
}

/**
 * Cost tracking interface
 */
export interface CostBreakdown {
  laborHours: number;
  laborRate: number; // Per hour rate
  materials: MaterialCost[];
  additionalCharges: AdditionalCharge[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string; // Default 'USD'
}

/**
 * Material cost tracking
 */
export interface MaterialCost {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  supplier?: string;
  receiptUrl?: string; // URL to receipt photo/document
}

/**
 * Additional charges (permits, disposal, etc.)
 */
export interface AdditionalCharge {
  id: string;
  description: string;
  amount: number;
  type: 'permit' | 'disposal' | 'emergency' | 'travel' | 'other';
  receiptUrl?: string;
}

/**
 * Time tracking for contractors
 */
export interface TimeTracking {
  sessionId: string;
  startTime: Timestamp;
  endTime?: Timestamp;
  totalMinutes?: number;
  breakMinutes?: number; // Time spent on breaks
  description: string;
  contractorId: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  photos?: string[]; // Progress photos during this session
}

/**
 * Photo documentation interface
 */
export interface PhotoDocumentation {
  id: string;
  url: string;
  thumbnailUrl?: string;
  uploadedBy: string;
  uploadedAt: Timestamp;
  description?: string;
  photoType: 'before' | 'during' | 'after' | 'problem' | 'receipt' | 'other';
  location?: {
    latitude: number;
    longitude: number;
  };
  metadata?: {
    fileSize: number;
    mimeType: string;
    originalName: string;
    width?: number;
    height?: number;
  };
}

/**
 * Contractor rating and feedback
 */
export interface ContractorRating {
  id: string;
  requestId: string;
  contractorId: string;
  ratedBy: string; // User ID who provided the rating
  raterRole: UserRole;
  rating: number; // 1-5 stars
  feedback?: string;
  categories: {
    quality: number; // 1-5
    timeliness: number; // 1-5
    communication: number; // 1-5
    cleanliness: number; // 1-5
    professionalism: number; // 1-5
  };
  timestamp: Timestamp;
  wouldRecommend: boolean;
}

/**
 * Request template for common issues
 */
export interface RequestTemplate {
  id: string;
  title: string;
  description: string;
  category: MaintenanceCategory;
  suggestedPriority: MaintenancePriority;
  estimatedDuration: number; // In hours
  commonSolutions?: string[];
  requiredPhotos?: string[]; // Descriptions of photos needed
  isActive: boolean;
  createdBy: string;
  createdAt: Timestamp;
  usageCount: number; // How many times this template has been used
}

/**
 * Main maintenance request interface
 */
export interface MaintenanceRequest {
  id: string;
  // Property and user references
  propertyId: string;
  propertyName: string;
  propertyAddress: string;
  tenantId: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone?: string;
  contractorId?: string;
  contractorName?: string;
  contractorEmail?: string;
  contractorPhone?: string;
  
  // Request details
  title: string;
  description: string;
  category: MaintenanceCategory;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  
  // Location details
  unitNumber?: string;
  specificLocation?: string; // "Kitchen sink", "Master bedroom", etc.
  accessInstructions?: string; // How to access the property/unit
  
  // Scheduling
  preferredTimeSlots?: {
    start: Timestamp;
    end: Timestamp;
    notes?: string;
  }[];
  scheduledDate?: Timestamp;
  estimatedDuration?: number; // In hours
  
  // Documentation
  photos: PhotoDocumentation[];
  
  // Cost tracking
  estimatedCost?: number;
  actualCost?: number;
  costBreakdown?: CostBreakdown;
  budgetApprovalRequired: boolean;
  budgetApproved?: boolean;
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedDate?: Timestamp;
  lastStatusChange: Timestamp;
  
  // Communication and tracking
  statusHistory: StatusChange[];
  communications: Communication[];
  timeTracking: TimeTracking[];
  
  // Emergency handling
  isEmergency: boolean;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  
  // Quality and feedback
  rating?: ContractorRating;
  tenantSatisfaction?: {
    rating: number; // 1-5
    feedback?: string;
    timestamp: Timestamp;
  };
  
  // System fields
  templateUsed?: string; // ID of template if used
  aiClassification?: {
    suggestedCategory: MaintenanceCategory;
    confidence: number;
    suggestedPriority: MaintenancePriority;
    estimatedCost: number;
    classifiedAt: Timestamp;
  };
  
  // Compliance and legal
  permitRequired?: boolean;
  permitNumber?: string;
  warrantyWork?: boolean;
  insuranceClaim?: boolean;
  
  // Recurring maintenance
  isRecurring?: boolean;
  recurringSchedule?: {
    frequency: 'weekly' | 'monthly' | 'quarterly' | 'annually';
    nextDueDate: Timestamp;
    parentRequestId?: string; // For tracking related recurring requests
  };
}

/**
 * Base interface for creating new maintenance requests (without system-generated fields)
 */
export interface MaintenanceRequestCreate {
  // Required fields for creating a new request
  propertyId: string;
  tenantId: string;
  title: string;
  description: string;
  category: MaintenanceCategory;
  priority: MaintenancePriority;
  
  // Optional fields
  unitNumber?: string;
  specificLocation?: string;
  accessInstructions?: string;
  preferredTimeSlots?: {
    start: Timestamp;
    end: Timestamp;
    notes?: string;
  }[];
  photos?: Omit<PhotoDocumentation, 'id' | 'uploadedAt'>[];
  isEmergency?: boolean;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  templateUsed?: string;
}

/**
 * Contractor profile extensions for maintenance system
 */
export interface ContractorMaintenanceProfile {
  contractorId: string;
  userId: string;
  
  // Skills and certifications
  skills: MaintenanceCategory[];
  certifications: {
    name: string;
    number: string;
    expirationDate?: Timestamp;
    issuingAuthority: string;
  }[];
  
  // Availability and preferences
  availability: {
    isAvailable: boolean;
    maxConcurrentJobs: number;
    workingHours: {
      monday: { start: string; end: string; available: boolean };
      tuesday: { start: string; end: string; available: boolean };
      wednesday: { start: string; end: string; available: boolean };
      thursday: { start: string; end: string; available: boolean };
      friday: { start: string; end: string; available: boolean };
      saturday: { start: string; end: string; available: boolean };
      sunday: { start: string; end: string; available: boolean };
    };
    emergencyAvailable: boolean;
    serviceRadius: number; // Miles from base location
    baseLocation: {
      latitude: number;
      longitude: number;
      address: string;
    };
  };
  
  // Performance metrics
  performance: {
    totalJobs: number;
    completedJobs: number;
    averageRating: number;
    onTimePercentage: number;
    responseTime: number; // Average response time in hours
    completionRate: number; // Percentage of accepted jobs completed
  };
  
  // Financial
  rates: {
    hourlyRate: number;
    emergencyRate: number;
    minimumCharge: number;
    travelCharge: number;
  };
  
  // Preferences
  preferredProperties: string[];
  blacklistedProperties: string[];
  preferredCategories: MaintenanceCategory[];
  
  // Contact and business info
  businessInfo: {
    companyName?: string;
    licenseNumber?: string;
    insuranceInfo?: {
      provider: string;
      policyNumber: string;
      expirationDate: Timestamp;
      coverageAmount: number;
    };
    bondedInfo?: {
      provider: string;
      policyNumber: string;
      expirationDate: Timestamp;
      amount: number;
    };
  };
  
  // System fields
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isVerified: boolean;
  verificationDate?: Timestamp;
  isActive: boolean;
  lastActiveDate: Timestamp;
}

/**
 * Bulk operation interfaces for landlord dashboard
 */
export interface BulkOperation {
  id: string;
  operationType: 'assign_contractor' | 'update_status' | 'update_priority' | 'close_requests';
  requestIds: string[];
  parameters: {
    contractorId?: string;
    status?: MaintenanceStatus;
    priority?: MaintenancePriority;
    notes?: string;
  };
  initiatedBy: string;
  initiatedAt: Timestamp;
  completedAt?: Timestamp;
  results: {
    successful: string[];
    failed: {
      requestId: string;
      error: string;
    }[];
  };
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

/**
 * Analytics and reporting interfaces
 */
export interface MaintenanceMetrics {
  propertyId?: string; // If property-specific, otherwise system-wide
  timeRange: {
    start: Timestamp;
    end: Timestamp;
  };
  
  // Request metrics
  totalRequests: number;
  requestsByStatus: Record<MaintenanceStatus, number>;
  requestsByCategory: Record<MaintenanceCategory, number>;
  requestsByPriority: Record<MaintenancePriority, number>;
  
  // Performance metrics
  averageResponseTime: number; // Hours from submission to assignment
  averageCompletionTime: number; // Hours from assignment to completion
  completionRate: number; // Percentage of requests completed
  tenantSatisfactionAverage: number; // Average tenant satisfaction rating
  
  // Cost metrics
  totalCost: number;
  averageCostPerRequest: number;
  costByCategory: Record<MaintenanceCategory, number>;
  budgetVariance: number; // Difference between estimated and actual costs
  
  // Contractor metrics
  contractorPerformance: {
    contractorId: string;
    contractorName: string;
    jobsCompleted: number;
    averageRating: number;
    averageCompletionTime: number;
    totalEarnings: number;
  }[];
}

/**
 * Notification preferences and settings
 */
export interface NotificationSettings {
  userId: string;
  userRole: UserRole;
  
  // Email notifications
  email: {
    enabled: boolean;
    newRequests: boolean;
    statusUpdates: boolean;
    assignments: boolean;
    completions: boolean;
    emergencies: boolean;
    ratings: boolean;
    reminders: boolean;
  };
  
  // Push notifications (future feature)
  push: {
    enabled: boolean;
    newRequests: boolean;
    statusUpdates: boolean;
    assignments: boolean;
    completions: boolean;
    emergencies: boolean;
    ratings: boolean;
    reminders: boolean;
  };
  
  // SMS notifications (future feature)
  sms: {
    enabled: boolean;
    emergencyOnly: boolean;
    phone?: string;
  };
  
  // Notification timing
  quietHours: {
    enabled: boolean;
    start: string; // "22:00"
    end: string; // "08:00"
    timezone: string;
  };
  
  updatedAt: Timestamp;
}

// All types and interfaces are exported individually above 