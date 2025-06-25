# Contractor Onboarding Flow Audit

## Overview
This document audits the complete contractor onboarding flow in the Propagentic application, mapping data flow, storage patterns, and identifying gaps between initial signup and dashboard functionality.

## Flow Mapping

### 1. Initial User Registration
**Location**: Auth system (Firebase Auth)
**Data Stored**:
- `uid` (Firebase generated)
- `email`
- `displayName` (optional)
- `emailVerified`

**Storage**: Firebase Authentication

### 2. User Type Selection
**Location**: Role selection during signup
**Data Stored**:
```javascript
{
  userType: 'contractor',
  onboardingComplete: false
}
```
**Storage**: Firestore `users/{uid}` collection

### 3. Contractor Onboarding Process
**Location**: `src/components/onboarding/ContractorOnboarding.jsx`

#### Step 1: Basic Information
**Data Collected**:
```javascript
{
  firstName: string,
  lastName: string,
  phoneNumber: string
}
```

#### Step 2: Services & Availability (Consolidated)
**Data Collected**:
```javascript
{
  // Business Information
  companyName: string (optional),
  yearsExperience: string,
  bio: string,
  
  // Services
  serviceTypes: string[], // Array of service IDs
  hourlyRate: number (optional),
  serviceArea: string,
  
  // Contact & Availability
  email: string (readonly),
  preferredContactMethod: string,
  availabilityNotes: string,
  
  // Business Verification
  taxId: string (optional),
  insuranceInfo: string (optional),
  website: string (optional)
}
```

#### Step 3: W-9 Form Upload
**Data Collected**:
```javascript
{
  w9FormUrl: string // Firebase Storage URL
}
```
**Storage**: 
- File: Firebase Storage `w9-forms/{uid}/{filename}`
- URL: Firestore `users/{uid}.w9FormUrl`

#### Step 4: Stripe Connect Onboarding
**Data Collected**:
```javascript
{
  stripeAccountSetup: boolean
}
```
**External Integration**: Stripe Connect

#### Step 5: Bank Account Verification
**Data Collected**:
```javascript
{
  bankAccountVerified: boolean
}
```

#### Step 6: Payment Methods Setup
**Data Collected**:
```javascript
{
  paymentMethodsSetup: boolean
}
```

### 4. Final Data Consolidation
**Location**: `ContractorOnboarding.handleSubmit()`
**Final Document Structure**:
```javascript
// Firestore: users/{uid}
{
  // Basic Info
  firstName: string,
  lastName: string,
  name: string, // Computed: `${firstName} ${lastName}`
  phoneNumber: string,
  email: string,
  userType: 'contractor',
  
  // Business Info
  companyName: string,
  yearsExperience: string,
  bio: string,
  
  // Services
  serviceTypes: string[],
  hourlyRate: number,
  serviceArea: string,
  
  // Contact
  preferredContactMethod: string,
  availabilityNotes: string,
  
  // Verification
  taxId: string,
  insuranceInfo: string,
  website: string,
  
  // Payment Setup
  w9FormUrl: string,
  stripeAccountSetup: boolean,
  bankAccountVerified: boolean,
  paymentMethodsSetup: boolean,
  
  // Completion
  onboardingComplete: true,
  updatedAt: serverTimestamp()
}
```

## Data Storage Analysis

### Primary Storage: Firestore `users` Collection
**Purpose**: Central user profile storage
**Document ID**: Firebase Auth UID
**Access Pattern**: Direct document access by UID

### Secondary Storage: Firebase Storage
**Purpose**: File uploads (W-9 forms, documents)
**Structure**: `w9-forms/{uid}/{filename}`
**Access Pattern**: URL references stored in Firestore

### External Integrations
1. **Stripe Connect**: Payment account setup
2. **Firebase Authentication**: Identity management

## Dashboard Data Requirements

### ContractorDashboard Data Needs
**Location**: `src/pages/ContractorDashboard.jsx` & `src/components/contractor/ContractorDashboard.jsx`

**Required Data Sources**:
1. **User Profile** (`users/{uid}`)
2. **Assigned Tickets** (`tickets` collection, `where('contractorId', '==', uid)`)
3. **Affiliated Landlords** (`landlordProfiles` collection, `where('contractors', 'array-contains', uid)`)

### Profile Service Integration
**Location**: `src/services/firestore/contractorService.ts`

**Data Model**: `ContractorProfile`
```typescript
{
  contractorId: string,
  userId: string,
  skills: string[],
  serviceArea: string,
  availability: boolean,
  preferredProperties: string[],
  rating: number,
  jobsCompleted: number,
  companyName?: string
}
```

## Identified Gaps and Issues

### 🔴 Critical Gaps

#### 1. Data Model Inconsistency
**Issue**: Two different data models for contractor information
- **Onboarding Model**: Stores in `users/{uid}` with comprehensive fields
- **Service Model**: Expects `contractorProfiles/{contractorId}` with different schema

**Impact**: Dashboard components may not find expected data structure

**Files Affected**:
- `src/services/firestore/contractorService.ts` (expects `contractorProfiles` collection)
- `src/components/onboarding/ContractorOnboarding.jsx` (saves to `users` collection)

#### 2. Missing Profile Creation
**Issue**: Onboarding completes but doesn't create `contractorProfiles` document
**Expected**: `contractorProfiles/{uid}` document creation
**Actual**: Only `users/{uid}` document updated

#### 3. Skills Mapping Gap
**Issue**: Onboarding collects `serviceTypes` array, but dashboard expects `skills` array
**Onboarding**: `serviceTypes: ['plumbing', 'electrical']`
**Service**: `skills: ['plumbing', 'electrical']`

### 🟡 Medium Priority Gaps

#### 4. Landlord Relationship Setup
**Issue**: No mechanism to establish initial landlord-contractor relationships
**Current**: Dashboard queries `landlordProfiles` where `contractors` array contains contractor ID
**Gap**: No way for contractors to be initially added to landlord networks

#### 5. Availability Management
**Issue**: Onboarding collects `availabilityNotes` but service expects boolean `availability`
**Onboarding**: Text-based availability description
**Service**: Boolean availability flag

#### 6. Rating System Initialization
**Issue**: New contractors start with `rating: 0` which may affect search results
**Missing**: Initial rating or "new contractor" handling

### 🟢 Minor Gaps

#### 7. Form Validation Inconsistency
**Issue**: Different validation patterns between onboarding form and profile management
**Location**: `src/components/onboarding/ContractorForm.jsx` vs onboarding flow

#### 8. Profile Image Support
**Issue**: No profile image upload in onboarding flow
**Missing**: Avatar/profile picture functionality

#### 9. Document Verification Integration
**Issue**: W-9 upload exists but no integration with document verification system
**Components**: 
- `src/components/contractor/documents/DocumentVerificationSystem.jsx`
- Onboarding W-9 upload

## Recommended Fixes

### 1. Create Unified Data Migration
```javascript
// Add to ContractorOnboarding.handleSubmit()
const contractorProfileData = {
  contractorId: currentUser.uid,
  userId: currentUser.uid,
  skills: formData.serviceTypes, // Map serviceTypes to skills
  serviceArea: formData.serviceArea,
  availability: true, // Default to available
  preferredProperties: [],
  rating: 5, // Start with neutral rating
  jobsCompleted: 0,
  companyName: formData.companyName || null
};

// Create contractorProfiles document
await setDoc(doc(db, 'contractorProfiles', currentUser.uid), contractorProfileData);
```

### 2. Update Service Integration
**File**: `src/services/firestore/contractorService.ts`
- Add fallback to read from `users` collection if `contractorProfiles` doesn't exist
- Implement data migration utility

### 3. Enhance Dashboard Data Loading
**File**: `src/components/contractor/ContractorDashboard.jsx`
- Add profile validation and migration on load
- Implement graceful fallbacks for missing data

### 4. Standardize Field Mapping
Create utility functions to map between data models:
```javascript
// utils/contractorDataMapper.js
export const mapOnboardingToProfile = (onboardingData) => ({
  skills: onboardingData.serviceTypes,
  availability: true,
  // ... other mappings
});
```

## Testing Recommendations

### 1. End-to-End Flow Testing
- Complete onboarding flow and verify dashboard functionality
- Test with various service type combinations
- Verify payment flow integration

### 2. Data Consistency Testing
- Audit existing contractor documents
- Test migration scripts on staging data
- Verify search functionality works with new data structure

### 3. Integration Testing
- Test Stripe Connect integration
- Verify document upload and storage
- Test landlord-contractor relationship queries

## Migration Strategy

### Phase 1: Data Model Unification
1. Create migration script for existing contractors
2. Update onboarding to create both document types
3. Update services to use unified model

### Phase 2: Enhanced Features
1. Add profile image support
2. Implement rating system improvements
3. Add advanced availability management

### Phase 3: Optimization
1. Implement data caching strategies
2. Add real-time updates
3. Performance optimization

## Monitoring and Metrics

### Key Metrics to Track
1. **Onboarding Completion Rate**: % of contractors completing all steps
2. **Profile Completeness**: % of contractors with complete profiles
3. **Dashboard Load Success**: % of successful dashboard loads post-onboarding
4. **Data Consistency**: % of contractors with consistent data across collections

### Error Monitoring
1. Monitor Firestore write failures during onboarding
2. Track authentication issues
3. Monitor Stripe integration errors
4. Document upload failure rates

---

**Last Updated**: January 2025
**Next Review**: After implementing recommended fixes 