# Data Model Standards & Consistency Guide

## Overview
This document establishes standards for data modeling across the Propagentic application to ensure consistency, maintainability, and proper integration between components.

## Core Principles

### 1. Single Source of Truth
- Each entity should have one primary collection
- Related data should reference the primary document
- Avoid data duplication across collections

### 2. Consistent Naming Conventions
- Use camelCase for field names
- Use descriptive, unambiguous field names
- Maintain consistent field names across related documents

### 3. Type Safety
- Define TypeScript interfaces for all data models
- Use consistent data types across related fields
- Validate data at service boundaries

## User Data Model

### Primary Collection: `users/{uid}`
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
  name: string; // Computed: `${firstName} ${lastName}`
  phoneNumber: string;
  
  // Role & Status
  userType: 'landlord' | 'tenant' | 'contractor';
  onboardingComplete: boolean;
  accountStatus: 'active' | 'suspended' | 'pending_verification';
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt?: Timestamp;
  
  // Role-specific data (conditional)
  // Contractor fields
  serviceTypes?: string[];
  serviceArea?: string;
  hourlyRate?: number;
  yearsExperience?: string;
  bio?: string;
  companyName?: string;
  
  // Business verification
  taxId?: string;
  insuranceInfo?: string;
  website?: string;
  
  // Payment setup
  w9FormUrl?: string;
  stripeAccountSetup?: boolean;
  bankAccountVerified?: boolean;
  paymentMethodsSetup?: boolean;
  
  // Contact preferences
  preferredContactMethod?: 'email' | 'phone' | 'text';
  availabilityNotes?: string;
}
```

## Contractor-Specific Data Models

### Enhanced Profile: `contractorProfiles/{contractorId}`
```typescript
interface ContractorProfile {
  // Identity
  contractorId: string; // matches users.uid
  userId: string; // matches users.uid
  
  // Core Info (synced with users collection)
  displayName: string;
  email: string;
  phoneNumber: string;
  companyName?: string;
  
  // Skills & Services
  skills: string[]; // mapped from users.serviceTypes
  serviceArea: string;
  hourlyRate?: number;
  yearsExperience: string;
  
  // Operational Status
  availability: boolean;
  availabilitySchedule?: {
    monday: { start: string; end: string; available: boolean };
    tuesday: { start: string; end: string; available: boolean };
    // ... other days
  };
  
  // Performance Metrics
  rating: number; // 0-5 scale
  reviewCount: number;
  jobsCompleted: number;
  jobsInProgress: number;
  averageResponseTime: number; // in minutes
  
  // Relationships
  preferredProperties: string[]; // property IDs
  affiliatedLandlords: string[]; // landlord IDs
  
  // Verification Status
  verificationStatus: {
    identity: 'pending' | 'verified' | 'rejected';
    insurance: 'pending' | 'verified' | 'rejected';
    license: 'pending' | 'verified' | 'rejected';
    w9: 'pending' | 'verified' | 'rejected';
  };
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastActiveAt: Timestamp;
}
```

## Data Synchronization Patterns

### 1. Primary-Secondary Sync
```typescript
// When updating users collection, sync to contractorProfiles
const syncContractorProfile = async (userId: string, userData: Partial<User>) => {
  const contractorRef = doc(db, 'contractorProfiles', userId);
  const syncData: Partial<ContractorProfile> = {
    displayName: userData.name || `${userData.firstName} ${userData.lastName}`,
    email: userData.email,
    phoneNumber: userData.phoneNumber,
    companyName: userData.companyName,
    skills: userData.serviceTypes || [],
    serviceArea: userData.serviceArea,
    hourlyRate: userData.hourlyRate,
    yearsExperience: userData.yearsExperience,
    updatedAt: serverTimestamp()
  };
  
  await updateDoc(contractorRef, syncData);
};
```

### 2. Computed Fields Pattern
```typescript
// Auto-compute derived fields
const computeContractorMetrics = (profile: ContractorProfile) => ({
  ...profile,
  rating: profile.reviewCount > 0 ? profile.rating : 5, // Default for new contractors
  completionRate: profile.jobsCompleted / (profile.jobsCompleted + profile.jobsInProgress),
  isNewContractor: profile.jobsCompleted < 3
});
```

## Migration Utilities

### Data Model Migration Helper
```typescript
interface MigrationResult {
  success: boolean;
  migratedCount: number;
  errors: Array<{ uid: string; error: string }>;
}

export const migrateContractorProfiles = async (): Promise<MigrationResult> => {
  const result: MigrationResult = {
    success: true,
    migratedCount: 0,
    errors: []
  };
  
  try {
    // Get all contractor users
    const usersQuery = query(
      collection(db, 'users'),
      where('userType', '==', 'contractor')
    );
    
    const usersSnapshot = await getDocs(usersQuery);
    
    for (const userDoc of usersSnapshot.docs) {
      try {
        const userData = userDoc.data() as User;
        
        // Check if contractor profile already exists
        const profileDoc = await getDoc(doc(db, 'contractorProfiles', userDoc.id));
        
        if (!profileDoc.exists()) {
          // Create new contractor profile
          const profileData: ContractorProfile = {
            contractorId: userDoc.id,
            userId: userDoc.id,
            displayName: userData.name || `${userData.firstName} ${userData.lastName}`,
            email: userData.email,
            phoneNumber: userData.phoneNumber || '',
            companyName: userData.companyName,
            skills: userData.serviceTypes || [],
            serviceArea: userData.serviceArea || '',
            hourlyRate: userData.hourlyRate,
            yearsExperience: userData.yearsExperience || '0-2',
            availability: true,
            rating: 5,
            reviewCount: 0,
            jobsCompleted: 0,
            jobsInProgress: 0,
            averageResponseTime: 0,
            preferredProperties: [],
            affiliatedLandlords: [],
            verificationStatus: {
              identity: 'pending',
              insurance: 'pending',
              license: 'pending',
              w9: userData.w9FormUrl ? 'verified' : 'pending'
            },
            createdAt: userData.createdAt || serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastActiveAt: serverTimestamp()
          };
          
          await setDoc(doc(db, 'contractorProfiles', userDoc.id), profileData);
          result.migratedCount++;
        }
      } catch (error) {
        result.errors.push({
          uid: userDoc.id,
          error: error.message
        });
        result.success = false;
      }
    }
  } catch (error) {
    result.success = false;
    result.errors.push({ uid: 'general', error: error.message });
  }
  
  return result;
};
```

## Validation Schemas

### User Data Validation
```typescript
import { z } from 'zod';

export const UserSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phoneNumber: z.string().regex(/^\(\d{3}\) \d{3}-\d{4}$/),
  userType: z.enum(['landlord', 'tenant', 'contractor']),
  onboardingComplete: z.boolean(),
  // Optional contractor fields
  serviceTypes: z.array(z.string()).optional(),
  serviceArea: z.string().optional(),
  hourlyRate: z.number().positive().optional()
});

export const ContractorProfileSchema = z.object({
  contractorId: z.string(),
  userId: z.string(),
  skills: z.array(z.string()),
  serviceArea: z.string(),
  availability: z.boolean(),
  rating: z.number().min(0).max(5),
  jobsCompleted: z.number().min(0)
});
```

## Best Practices

### 1. Data Consistency
- Always validate data before writing to Firestore
- Use transactions for multi-document updates
- Implement data sync utilities for related documents

### 2. Performance Optimization
- Index frequently queried fields
- Use compound queries effectively
- Implement pagination for large datasets

### 3. Error Handling
- Graceful degradation when data is missing
- Fallback to default values
- Log data inconsistencies for monitoring

### 4. Security
- Validate user permissions before data access
- Sanitize user input
- Use Firestore security rules effectively

## Monitoring & Alerts

### Data Quality Metrics
1. **Profile Completeness**: % of contractors with complete profiles
2. **Data Consistency**: % match between users and contractorProfiles
3. **Migration Success Rate**: % of successful profile migrations
4. **Validation Failure Rate**: % of failed data validations

### Automated Checks
```typescript
// Daily data consistency check
export const checkDataConsistency = async () => {
  const inconsistencies = [];
  
  // Check contractor users without profiles
  const orphanedUsers = await findOrphanedContractorUsers();
  
  // Check profiles without corresponding users
  const orphanedProfiles = await findOrphanedContractorProfiles();
  
  // Report inconsistencies
  if (orphanedUsers.length > 0 || orphanedProfiles.length > 0) {
    console.warn('Data inconsistencies found:', {
      orphanedUsers: orphanedUsers.length,
      orphanedProfiles: orphanedProfiles.length
    });
  }
};
```

---

**Last Updated**: January 2025
**Next Review**: After implementing data model unification 