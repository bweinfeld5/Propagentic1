# Firebase Collections Schema Documentation

## Overview
This document provides a comprehensive reference for all Firestore collections used in the Propagentic application, including their schemas, relationships, and usage patterns.

## Collection Architecture

```
propagentic (Firebase Project)
├── users/{uid}
├── contractorProfiles/{contractorId}
├── landlordProfiles/{landlordId}
├── tenantProfiles/{tenantId}
├── properties/{propertyId}
├── tickets/{ticketId}
├── maintenanceRequests/{requestId}
├── inviteCodes/{codeId}
├── notifications/{notificationId}
├── communications/{communicationId}
├── payments/{paymentId}
├── documents/{documentId}
├── reviews/{reviewId}
└── analytics/{eventId}
```

## Core Collections

### 1. Users Collection
**Path**: `users/{uid}`
**Purpose**: Central user profiles for all user types
**Security**: User can read/write own document

```typescript
interface User {
  // Identity
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  
  // Profile
  firstName: string;
  lastName: string;
  name: string; // Computed field
  phoneNumber: string;
  
  // Authentication & Status
  userType: 'landlord' | 'tenant' | 'contractor';
  onboardingComplete: boolean;
  accountStatus: 'active' | 'suspended' | 'pending_verification' | 'deleted';
  emailVerified: boolean;
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt?: Timestamp;
  
  // Role-specific fields (conditional based on userType)
  // Contractor specific
  serviceTypes?: string[];
  serviceArea?: string;
  hourlyRate?: number;
  yearsExperience?: string;
  bio?: string;
  companyName?: string;
  taxId?: string;
  insuranceInfo?: string;
  website?: string;
  w9FormUrl?: string;
  stripeAccountSetup?: boolean;
  bankAccountVerified?: boolean;
  paymentMethodsSetup?: boolean;
  preferredContactMethod?: 'email' | 'phone' | 'text';
  availabilityNotes?: string;
  
  // Landlord specific
  businessName?: string;
  businessLicense?: string;
  propertyCount?: number;
  
  // Tenant specific
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}
```

**Indexes**:
- `userType` (single field)
- `email` (single field)
- `userType, onboardingComplete` (composite)

### 2. Contractor Profiles Collection
**Path**: `contractorProfiles/{contractorId}`
**Purpose**: Enhanced contractor-specific data for job matching and performance tracking
**Security**: Read by authenticated users, write by contractor owner only

```typescript
interface ContractorProfile {
  // Identity (must match users collection)
  contractorId: string;
  userId: string;
  
  // Basic Info (synced from users)
  displayName: string;
  email: string;
  phoneNumber: string;
  companyName?: string;
  
  // Skills & Capabilities
  skills: string[]; // Mapped from users.serviceTypes
  specializations: string[]; // More specific skills
  serviceArea: string;
  serviceRadius: number; // Miles
  hourlyRate?: number;
  minimumJobSize?: number;
  yearsExperience: string;
  certifications: string[];
  
  // Availability
  availability: boolean;
  availabilitySchedule: {
    [day: string]: {
      start: string; // "09:00"
      end: string; // "17:00"
      available: boolean;
    };
  };
  emergencyAvailable: boolean;
  
  // Performance Metrics
  rating: number; // 0-5 scale
  reviewCount: number;
  jobsCompleted: number;
  jobsInProgress: number;
  jobsCancelled: number;
  averageResponseTime: number; // Minutes
  averageCompletionTime: number; // Hours
  
  // Relationships
  preferredProperties: string[]; // Property IDs
  affiliatedLandlords: string[]; // Landlord IDs
  blockedLandlords: string[]; // Landlord IDs
  
  // Verification & Documents
  verificationStatus: {
    identity: 'pending' | 'verified' | 'rejected';
    insurance: 'pending' | 'verified' | 'rejected';
    license: 'pending' | 'verified' | 'rejected';
    w9: 'pending' | 'verified' | 'rejected';
    background: 'pending' | 'verified' | 'rejected';
  };
  
  // Financial
  stripeAccountId?: string;
  bankAccountStatus: 'pending' | 'verified' | 'requires_action';
  taxDocuments: string[]; // URLs
  
  // Preferences
  preferredJobTypes: string[];
  minimumNoticeHours: number;
  maxJobsPerDay: number;
  
  // Location
  serviceZipCodes: string[];
  primaryAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates: GeoPoint;
  };
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastActiveAt: Timestamp;
  verificationCompletedAt?: Timestamp;
}
```

**Indexes**:
- `skills` (array)
- `serviceArea` (single field)
- `availability` (single field)
- `rating` (single field)
- `affiliatedLandlords` (array)
- `skills, availability` (composite)
- `serviceArea, availability` (composite)

### 3. Properties Collection
**Path**: `properties/{propertyId}`
**Purpose**: Property information and management
**Security**: Read/write by property owner, read by tenants

```typescript
interface Property {
  // Identity
  propertyId: string;
  landlordId: string;
  
  // Basic Information
  name: string;
  type: 'single_family' | 'apartment' | 'condo' | 'townhouse' | 'commercial';
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    unit?: string;
    coordinates?: GeoPoint;
  };
  
  // Property Details
  bedrooms: number;
  bathrooms: number;
  squareFootage?: number;
  yearBuilt?: number;
  lotSize?: number;
  
  // Amenities & Features
  amenities: string[];
  appliances: string[];
  utilities: {
    electric: 'landlord' | 'tenant';
    gas: 'landlord' | 'tenant';
    water: 'landlord' | 'tenant';
    internet: 'landlord' | 'tenant';
    trash: 'landlord' | 'tenant';
  };
  
  // Rental Information
  rentAmount: number;
  securityDeposit: number;
  petDeposit?: number;
  applicationFee: number;
  leaseTerms: string[];
  availableDate?: Timestamp;
  
  // Occupancy
  currentTenants: string[]; // Tenant IDs
  maxOccupancy: number;
  petPolicy: {
    allowed: boolean;
    types: string[];
    maxNumber: number;
    monthlyFee: number;
  };
  
  // Maintenance
  preferredContractors: string[]; // Contractor IDs
  maintenanceHistory: string[]; // Ticket IDs
  lastInspectionDate?: Timestamp;
  
  // Media
  photos: string[]; // Storage URLs
  floorPlan?: string; // Storage URL
  virtualTourUrl?: string;
  
  // Status
  status: 'available' | 'occupied' | 'maintenance' | 'offline';
  listed: boolean;
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  listedAt?: Timestamp;
}
```

### 4. Maintenance Tickets Collection
**Path**: `tickets/{ticketId}`
**Purpose**: Maintenance request tracking and workflow
**Security**: Read/write by involved parties (tenant, landlord, contractor)

```typescript
interface MaintenanceTicket {
  // Identity
  ticketId: string;
  ticketNumber: string; // Human-readable ID
  
  // Parties
  tenantId: string;
  landlordId: string;
  propertyId: string;
  contractorId?: string;
  
  // Issue Details
  title: string;
  description: string;
  category: 'plumbing' | 'electrical' | 'hvac' | 'appliance' | 'structural' | 'cosmetic' | 'emergency' | 'other';
  subcategory?: string;
  location: string; // Room/area in property
  
  // Priority & Urgency
  priority: 'low' | 'medium' | 'high' | 'urgent';
  urgencyLevel: 'routine' | 'urgent' | 'emergency';
  emergencyContact?: string;
  
  // Status Tracking
  status: 'submitted' | 'reviewed' | 'approved' | 'assigned' | 'pending_acceptance' | 'accepted' | 'in_progress' | 'completed' | 'closed' | 'cancelled';
  statusHistory: Array<{
    status: string;
    timestamp: Timestamp;
    changedBy: string;
    note?: string;
  }>;
  
  // Assignment
  assignmentType: 'automatic' | 'manual' | 'preferred';
  assignedAt?: Timestamp;
  acceptedAt?: Timestamp;
  
  // Cost & Payment
  estimatedCost?: number;
  actualCost?: number;
  costBreakdown?: {
    labor: number;
    materials: number;
    other: number;
    notes: string;
  };
  paymentStatus: 'pending' | 'authorized' | 'paid' | 'disputed';
  
  // Work Details
  scheduledDate?: Timestamp;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  workSummary?: string;
  
  // Progress Tracking
  progressUpdates: Array<{
    timestamp: Timestamp;
    message: string;
    progressPercent: number;
    photos: string[];
    contractorId: string;
  }>;
  
  // Media & Documentation
  photos: string[]; // Initial photos from tenant
  beforePhotos: string[]; // Contractor photos before work
  afterPhotos: string[]; // Contractor photos after work
  receipts: string[]; // Cost documentation
  
  // Communication
  lastMessageAt?: Timestamp;
  messageCount: number;
  
  // Rating & Feedback
  tenantRating?: number;
  landlordRating?: number;
  contractorRating?: number;
  feedback?: {
    tenant?: string;
    landlord?: string;
    contractor?: string;
  };
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  dueDate?: Timestamp;
  closedAt?: Timestamp;
}
```

**Indexes**:
- `tenantId` (single field)
- `landlordId` (single field)
- `contractorId` (single field)
- `propertyId` (single field)
- `status` (single field)
- `category` (single field)
- `priority` (single field)
- `contractorId, status` (composite)
- `landlordId, status` (composite)
- `createdAt` (single field, descending)

### 5. Invite Codes Collection
**Path**: `inviteCodes/{codeId}`
**Purpose**: Property invitation management
**Security**: Read/write by code creator, read by code user

```typescript
interface InviteCode {
  // Identity
  codeId: string;
  inviteCode: string; // The actual code string
  
  // Creator & Target
  createdBy: string; // Landlord ID
  propertyId: string;
  unitId?: string; // For multi-unit properties
  email?: string; // Specific email invitation
  
  // Usage
  usedBy?: string; // Tenant ID who used the code
  usedAt?: Timestamp;
  maxUses: number;
  currentUses: number;
  
  // Validity
  expiresAt: Timestamp;
  active: boolean;
  
  // Permissions
  permissions: {
    canViewProperty: boolean;
    canSubmitMaintenanceRequests: boolean;
    canViewMaintenanceHistory: boolean;
    canCommunicateWithLandlord: boolean;
  };
  
  // Metadata
  note?: string; // Internal note for landlord
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 6. Communications Collection
**Path**: `communications/{communicationId}`
**Purpose**: Message threading for maintenance tickets and general communication
**Security**: Read/write by conversation participants

```typescript
interface Communication {
  // Identity
  communicationId: string;
  
  // Context
  ticketId?: string; // If related to maintenance ticket
  propertyId?: string; // For general property communication
  threadId: string; // Groups related messages
  
  // Message Details
  content: string;
  messageType: 'text' | 'image' | 'document' | 'system';
  
  // Sender
  senderId: string;
  senderRole: 'tenant' | 'landlord' | 'contractor' | 'system';
  senderName: string;
  
  // Recipients
  recipients: string[]; // User IDs
  readBy: Array<{
    userId: string;
    readAt: Timestamp;
  }>;
  
  // Attachments
  attachments: Array<{
    type: 'image' | 'document' | 'receipt';
    url: string;
    filename: string;
    size: number;
  }>;
  
  // Status
  edited: boolean;
  editedAt?: Timestamp;
  deleted: boolean;
  deletedAt?: Timestamp;
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## Subcollections

### User Documents Subcollection
**Path**: `users/{uid}/documents/{documentId}`
**Purpose**: User-specific document storage references

```typescript
interface UserDocument {
  documentId: string;
  userId: string;
  
  type: 'id' | 'license' | 'insurance' | 'w9' | 'lease' | 'receipt' | 'other';
  filename: string;
  storageUrl: string;
  
  status: 'pending' | 'verified' | 'rejected';
  verifiedBy?: string; // Admin user ID
  verifiedAt?: Timestamp;
  rejectionReason?: string;
  
  metadata: {
    size: number;
    mimeType: string;
    uploadedFrom: 'web' | 'mobile';
  };
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Property Tenants Subcollection
**Path**: `properties/{propertyId}/tenants/{tenantId}`
**Purpose**: Track tenant-property relationships with lease details

```typescript
interface PropertyTenant {
  tenantId: string;
  propertyId: string;
  
  leaseDetails: {
    startDate: Timestamp;
    endDate: Timestamp;
    monthlyRent: number;
    securityDeposit: number;
    leaseDocumentUrl?: string;
  };
  
  status: 'active' | 'pending' | 'terminated' | 'expired';
  moveInDate?: Timestamp;
  moveOutDate?: Timestamp;
  
  permissions: {
    canSubmitMaintenance: boolean;
    canViewHistory: boolean;
    canCommunicate: boolean;
  };
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## Data Relationships

### Primary Relationships
1. **User → Profile**: One-to-one relationship via userType
2. **Property → Landlord**: Many-to-one via landlordId
3. **Property → Tenants**: One-to-many via subcollection
4. **Ticket → Property**: Many-to-one via propertyId
5. **Ticket → Contractor**: Many-to-one via contractorId
6. **Communication → Ticket**: Many-to-one via ticketId

### Cross-Collection Queries
```typescript
// Get all properties for a landlord
const propertiesQuery = query(
  collection(db, 'properties'),
  where('landlordId', '==', landlordId)
);

// Get active tickets for a contractor
const ticketsQuery = query(
  collection(db, 'tickets'),
  where('contractorId', '==', contractorId),
  where('status', 'in', ['assigned', 'accepted', 'in_progress'])
);

// Get available contractors for a service type
const contractorsQuery = query(
  collection(db, 'contractorProfiles'),
  where('skills', 'array-contains', 'plumbing'),
  where('availability', '==', true)
);
```

## Security Rules Summary

### Users Collection
```javascript
// Users can read/write their own profile
match /users/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

### Properties Collection
```javascript
// Property owners can read/write, tenants can read
match /properties/{propertyId} {
  allow read, write: if request.auth.uid == resource.data.landlordId;
  allow read: if request.auth.uid in resource.data.currentTenants;
}
```

### Tickets Collection
```javascript
// Involved parties can read/write
match /tickets/{ticketId} {
  allow read, write: if request.auth.uid in [
    resource.data.tenantId,
    resource.data.landlordId,
    resource.data.contractorId
  ];
}
```

---

**Last Updated**: January 2025
**Next Review**: After schema migrations complete 