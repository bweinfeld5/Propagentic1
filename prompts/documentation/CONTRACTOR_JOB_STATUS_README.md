# Contractor Job Status Management Migration

## Overview

This document describes the migration from the `contractors` collection to the `contractorProfiles` collection for managing contractor job assignments and status tracking.

## Background

Previously, the system was using the `contractors` collection to store contractor job assignments with a `contracts` structure containing `pending`, `ongoing`, and `finished` arrays. This has been migrated to use the `contractorProfiles` collection instead, which is keyed by the contractor's UID (user ID) for better consistency with the authentication system.

## Changes Made

### 1. Cloud Functions Updates

**Files Modified:**
- `functions/src/assignContractorToRequest.ts`
- `functions/lib/assignContractorToRequest.js`
- `functions/src/updateContractorJobStatus.ts`
- `functions/lib/updateContractorJobStatus.js`

**Changes:**
- Updated to use `contractorProfiles` collection instead of `contractors`
- Maintained the same `contracts` structure with `pending`, `ongoing`, and `finished` arrays
- Contractor profiles are now accessed using the contractor's UID

### 2. Frontend Service Updates

**Files Modified:**
- `src/services/firestore/maintenanceService.ts`

**Changes:**
- `subscribeToContractorJobsByStatus()` now subscribes to `contractorProfiles` collection
- `subscribeToContractorJobs()` now subscribes to `contractorProfiles` collection
- Both functions use the contractor's UID to find their profile

### 3. Contractor Dashboard Updates

**Files Modified:**
- `src/components/contractor/ContractorJobAssignments.tsx`

**Changes:**
- Removed the "Your Assigned Jobs" section for a cleaner interface
- Now displays only:
  - **Job Status Management**: Jobs organized by status (Pending, Ongoing, Finished)
  - **Available Jobs**: Jobs that contractors can accept

### 4. Data Structure

The `contractorProfiles` collection now uses this structure:

```typescript
interface ContractorProfile {
  contractorId: string;
  userId: string; // Contractor's UID from Firebase Auth
  skills: string[];
  serviceArea: string;
  availability: boolean;
  preferredProperties: string[];
  rating: number;
  jobsCompleted: number;
  companyName?: string;
  
  // Legacy field - maintained for backward compatibility
  maintenanceRequests?: string[]; 
  
  // Job status tracking structure
  contracts?: {
    pending: string[];   // Maintenance request IDs in pending status
    ongoing: string[];   // Maintenance request IDs in ongoing status  
    finished: string[]; // Maintenance request IDs in finished status
  };
}
```

## Migration Process

### Pre-Migration Testing

Before running the migration, test your Firebase connection:

```bash
node scripts/test-firebase-connection.js
```

This will verify:
- Firebase Admin SDK authentication
- Firestore read/write permissions
- Access to both `contractors` and `contractorProfiles` collections
- Project ID configuration

### Automatic Migration

A migration script has been created to transfer existing contract data:

```bash
node scripts/migrate-contractor-contracts.js
```

This script will:
1. Test Firebase connection before proceeding
2. Read all contractor documents from the `contractors` collection
3. Find those with `contracts` data (pending, ongoing, finished arrays)
4. Update or create corresponding `contractorProfiles` documents
5. Migrate the contracts structure while preserving existing data
6. Add migration metadata for tracking

### Authentication Setup

The migration scripts will try these authentication methods in order:

1. **Service Account Key** (Recommended): `service-account-key.json` in project root
2. **Environment Variable**: `GOOGLE_APPLICATION_CREDENTIALS` pointing to service account file
3. **Default Credentials**: For Cloud Shell or Compute Engine environments

**Project ID Detection:**
- Reads from service account file (`project_id` field)
- Falls back to environment variables: `GCLOUD_PROJECT` or `FIREBASE_PROJECT_ID`
- Default fallback: `propagentic`

### Manual Verification

After running the migration:

1. **Verify contractor profiles exist:**
   ```javascript
   // Check if contractor profile exists for a UID
   const contractorProfile = await db.collection('contractorProfiles').doc(contractorUID).get();
   ```

2. **Verify contracts structure:**
   ```javascript
   // Check contracts structure
   const contracts = contractorProfile.data()?.contracts;
   console.log({
     pending: contracts?.pending?.length || 0,
     ongoing: contracts?.ongoing?.length || 0,
     finished: contracts?.finished?.length || 0
   });
   ```

## Job Status Workflow

### 1. Job Assignment
When a landlord assigns a job to a contractor:
- The maintenance request gets `contractorId` set to the contractor's UID
- The request ID is added to the contractor's `contracts.pending` array in their profile

### 2. Status Transitions
Contractors can move jobs between statuses:
- **Pending → Ongoing**: Contractor starts work
- **Ongoing → Finished**: Contractor completes work  
- **Ongoing → Pending**: Contractor pauses work

### 3. Frontend Display
The contractor dashboard shows:
- **Job Status Management**: Organized by status with action buttons
- **Available Jobs**: Unassigned jobs that contractors can accept

## Key Benefits

1. **Consistent UID-based access**: Contractor profiles are keyed by Firebase Auth UID
2. **Better security**: Contractors can only access their own profile data
3. **Cleaner dashboard**: Removed redundant job display sections
4. **Maintained backward compatibility**: Legacy `maintenanceRequests` field preserved
5. **Real-time updates**: Live synchronization of job status changes

## Testing

### Frontend Testing
1. Log in as a contractor
2. Verify the dashboard shows:
   - Job Status Management with Pending/Ongoing/Finished tabs
   - Available Jobs section
   - No "Your Assigned Jobs" section
3. Test job status transitions (Start Work, Complete Job, Pause)
4. Verify real-time updates when jobs are assigned

### Backend Testing
1. Assign a job to a contractor via the landlord interface
2. Verify the job appears in the contractor's `contracts.pending` array
3. Test status transitions via the Cloud Function
4. Verify maintenance request status updates accordingly

## Rollback Plan

If issues arise, the system can be rolled back by:

1. **Reverting Cloud Functions:**
   ```bash
   git checkout HEAD~1 functions/src/assignContractorToRequest.ts
   git checkout HEAD~1 functions/src/updateContractorJobStatus.ts
   npm run build && firebase deploy --only functions
   ```

2. **Reverting Frontend Service:**
   ```bash
   git checkout HEAD~1 src/services/firestore/maintenanceService.ts
   ```

3. **Restoring Original Dashboard:**
   ```bash
   git checkout HEAD~1 src/components/contractor/ContractorJobAssignments.tsx
   ```

## Monitoring

Monitor these metrics post-migration:

1. **Contractor login success rate**
2. **Job assignment completion rate**  
3. **Dashboard loading performance**
4. **Real-time sync functionality**
5. **Error logs in Cloud Functions**

## Support

For issues related to this migration:

1. Check Cloud Function logs in Firebase Console
2. Verify contractor profile data exists
3. Ensure Firebase Auth UID matches contractorProfiles document ID
4. Run the migration script if contractor data is missing
5. Check browser console for frontend errors

---

**Migration Date**: [Current Date]  
**Affected Components**: Cloud Functions, Frontend Services, Contractor Dashboard  
**Data Collections**: `contractors` → `contractorProfiles`

# Contractor Job Status Tracking System

This document describes the newly implemented contractor job status tracking system that allows contractors to manage their maintenance requests through different stages: **Pending**, **Ongoing**, and **Finished**.

## 🎯 Overview

The job status tracking system provides contractors with better visibility and control over their assigned maintenance requests. Instead of having all jobs in a single list, contractors can now:

- View jobs categorized by status (Pending, Ongoing, Finished)
- Transition jobs between statuses with dedicated action buttons
- Track their work progress through a clean, intuitive interface
- Maintain backward compatibility with existing systems

## 📋 Features

### 1. **Status Categories**
- **Pending**: Newly assigned jobs that haven't been started yet
- **Ongoing**: Jobs currently being worked on
- **Finished**: Completed jobs

### 2. **Status Transitions**
- **Pending → Ongoing**: Start working on a job
- **Ongoing → Finished**: Mark a job as completed
- **Ongoing → Pending**: Pause work on a job (if needed)

### 3. **Enhanced UI**
- Tab-based interface for easy navigation between status categories
- Action buttons for status transitions
- Real-time updates via Firebase listeners
- Counts displayed on each tab

### 4. **Data Model**
```javascript
// New contracts structure in contractorProfiles
{
  contractorId: "contractor123",
  // ... existing fields ...
  contracts: {
    pending: ["req1", "req3"],    // Array of maintenance request IDs
    ongoing: ["req2"],            // Array of maintenance request IDs  
    finished: ["req4", "req5"]    // Array of maintenance request IDs
  },
  maintenanceRequests: ["req1", "req2", "req3", "req4", "req5"] // Legacy field (maintained for compatibility)
}
```

## 🚀 Implementation Details

### Backend Changes

#### 1. **Updated Cloud Functions**

**`assignContractorToRequest`** - Enhanced to populate the new contracts structure:
```typescript
// File: functions/src/assignContractorToRequest.ts
// Now initializes contracts.pending when assigning jobs
// Maintains backward compatibility with maintenanceRequests field
```

**`updateContractorJobStatus`** - New function for status transitions:
```typescript
// Allows moving jobs between pending, ongoing, and finished states
// Includes validation and error handling
// Updates both contractor profile and maintenance request status
```

#### 2. **Data Model Updates**

**ContractorProfile Interface** - Added new contracts structure:
```typescript
// File: src/models/schema.ts
interface ContractorProfile {
  // ... existing fields ...
  contracts?: {
    pending: string[];
    ongoing: string[];
    finished: string[];
  };
  maintenanceRequests?: string[]; // Legacy field
}
```

### Frontend Changes

#### 1. **Enhanced Dashboard Component**
```typescript
// File: src/components/contractor/ContractorJobAssignments.tsx
// Added tab-based interface for status management
// Integrated status transition buttons
// Real-time job categorization
```

#### 2. **Status Management UI**
- **Tab Navigation**: Switch between Pending, Ongoing, and Finished jobs
- **Action Buttons**: Context-specific buttons for status transitions
- **Visual Indicators**: Color-coded status badges and counts
- **Empty States**: Helpful messages when no jobs exist in a category

## 📦 Deployment Instructions

### 1. **Deploy Cloud Functions**
```bash
# Navigate to functions directory
cd functions

# Install dependencies (if not already done)
npm install

# Deploy the updated functions
firebase deploy --only functions:assignContractorToRequest,functions:updateContractorJobStatus
```

### 2. **Run Data Migration**
```bash
# Initialize contracts structure for existing contractors
node scripts/migrate-contractor-contracts.js

# Verify migration results
node scripts/migrate-contractor-contracts.js --verify
```

### 3. **Deploy Frontend Changes**
```bash
# Build and deploy the updated React application
npm run build
firebase deploy --only hosting
```

## 🔄 Migration Guide

### For Existing Contractors

When contractors log in after the update:

1. **Automatic Migration**: The system automatically initializes the contracts structure when assigning new jobs
2. **Legacy Support**: Existing maintenance requests remain accessible through the legacy interface
3. **Gradual Transition**: Contractors can use both old and new interfaces during the transition period

### Migration Script Usage

```bash
# Run migration
node scripts/migrate-contractor-contracts.js

# Check migration status
node scripts/migrate-contractor-contracts.js --verify

# Get help
node scripts/migrate-contractor-contracts.js --help
```

The migration script:
- ✅ Adds contracts structure to contractor profiles
- ✅ Moves existing maintenanceRequests to contracts.pending
- ✅ Preserves all existing data
- ✅ Uses batch operations for efficiency
- ✅ Provides detailed logging and error handling

## 🎛️ Usage Guide

### For Contractors

#### 1. **Viewing Jobs by Status**
1. Navigate to "My Assignments" tab in the dashboard
2. Use the status tabs (Pending, Ongoing, Finished) to filter jobs
3. View job counts on each tab

#### 2. **Starting Work on a Job**
1. Go to the "Pending" tab
2. Find the job you want to start
3. Click "Start Work" button
4. Job moves to "Ongoing" tab automatically

#### 3. **Completing a Job**
1. Go to the "Ongoing" tab
2. Find the completed job
3. Click "Complete Job" button
4. Job moves to "Finished" tab automatically

#### 4. **Pausing Work (if needed)**
1. Go to the "Ongoing" tab
2. Find the job you need to pause
3. Click "Pause" button
4. Job moves back to "Pending" tab

### For Developers

#### 1. **Calling the Cloud Function**
```javascript
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase/config';

const updateContractorJobStatus = httpsCallable(functions, 'updateContractorJobStatus');

// Example: Move job from pending to ongoing
await updateContractorJobStatus({
  requestId: 'maintenance_request_id',
  fromStatus: 'pending',
  toStatus: 'ongoing',
  contractorId: 'contractor_uid' // Optional, defaults to current user
});
```

#### 2. **Listening to Real-time Updates**
The existing `maintenanceService.subscribeToContractorJobs()` function automatically categorizes jobs by status and updates the UI in real-time.

## 🛡️ Error Handling

### Common Error Scenarios

1. **Invalid Status Transition**: System validates that jobs exist in the source status
2. **Permission Denied**: Only assigned contractors can update job status
3. **Missing Data**: Graceful handling of missing contractor profiles or requests
4. **Network Issues**: Retry mechanisms and user feedback

### Error Messages

- `Contractor profile not found` - Profile doesn't exist
- `Request not in expected status` - Job isn't in the specified source status
- `Permission denied` - User isn't assigned to the request
- `Service temporarily unavailable` - Network or server issues

## 📊 Monitoring and Analytics

### Key Metrics to Track

1. **Status Transition Rates**
   - Pending → Ongoing conversion rate
   - Ongoing → Finished completion rate
   - Average time in each status

2. **User Adoption**
   - Contractors using the new status management
   - Frequency of status updates
   - Error rates during transitions

3. **System Performance**
   - Cloud function execution times
   - Database read/write operations
   - Real-time listener performance

## 🔮 Future Enhancements

### Planned Features

1. **Time Tracking**: Automatic timing of how long jobs spend in each status
2. **Status History**: Track all status changes with timestamps
3. **Notifications**: Alert contractors about overdue jobs or status changes
4. **Reporting**: Generate reports based on job status data
5. **Bulk Operations**: Update status for multiple jobs at once

### Migration Path

The current implementation maintains full backward compatibility, allowing for gradual migration and future enhancements without breaking existing functionality.

## 📞 Support

For questions or issues with the contractor job status tracking system:

1. **Development Issues**: Check the console logs for detailed error messages
2. **Data Migration**: Run the verification script to check migration status
3. **User Training**: Use this document to train contractors on the new interface

## 🔗 Related Documentation

- [FEATURE_CONTRACTOR_JOB_STATUS.md](./FEATURE_CONTRACTOR_JOB_STATUS.md) - Original feature specification
- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [Firestore Data Modeling](https://firebase.google.com/docs/firestore/data-model)
- [React Component Documentation](./src/components/contractor/README.md)

---

*Last updated: [Current Date]*
*Version: 1.0.0* 