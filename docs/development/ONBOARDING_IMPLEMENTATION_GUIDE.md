# Contractor Onboarding Implementation Guide

## Overview
This guide provides step-by-step instructions for implementing the fixes identified in the contractor onboarding audit. It prioritizes critical fixes that will ensure contractors can successfully access their dashboard after completing onboarding.

## Implementation Priority

### 🔴 Phase 1: Critical Fixes (Week 1)
1. **Data Model Unification**: Create `contractorProfiles` documents during onboarding
2. **Field Mapping**: Standardize `serviceTypes` → `skills` mapping
3. **Dashboard Compatibility**: Update services to handle both data models

### 🟡 Phase 2: Enhanced Features (Week 2-3)
1. **Availability Management**: Improve availability tracking
2. **Rating System**: Implement proper rating initialization
3. **Document Integration**: Connect W-9 upload to verification system

### 🟢 Phase 3: Optimizations (Week 4+)
1. **Profile Images**: Add avatar support
2. **Landlord Relationships**: Implement network building
3. **Performance**: Add caching and optimization

## Phase 1 Implementation

### 1. Update Contractor Onboarding Component

**File**: `src/components/onboarding/ContractorOnboarding.jsx`

Add the profile creation logic to the `handleSubmit` function:

```javascript
// Add imports at the top
import { setDoc, writeBatch } from 'firebase/firestore';

// Update the handleSubmit function
const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!currentUser) return;
  
  setLoading(true);
  setError('');
  
  try {
    // Prepare user document data
    const userDocData = {
      ...formData,
      onboardingComplete: true,
      name: `${formData.firstName} ${formData.lastName}`,
      userType: 'contractor',
      updatedAt: serverTimestamp(),
      hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : null,
    };
    
    // Prepare contractor profile data
    const contractorProfileData = {
      // Identity
      contractorId: currentUser.uid,
      userId: currentUser.uid,
      
      // Basic Info (synced from user data)
      displayName: userDocData.name,
      email: userDocData.email || currentUser.email,
      phoneNumber: userDocData.phoneNumber,
      companyName: userDocData.companyName || null,
      
      // Skills & Services (mapped from onboarding data)
      skills: userDocData.serviceTypes || [],
      serviceArea: userDocData.serviceArea || '',
      hourlyRate: userDocData.hourlyRate,
      yearsExperience: userDocData.yearsExperience || '0-2',
      
      // Operational Status
      availability: true, // Default to available
      emergencyAvailable: false,
      
      // Performance Metrics (defaults for new contractors)
      rating: 5, // Neutral starting rating
      reviewCount: 0,
      jobsCompleted: 0,
      jobsInProgress: 0,
      jobsCancelled: 0,
      averageResponseTime: 0,
      averageCompletionTime: 0,
      
      // Relationships
      preferredProperties: [],
      affiliatedLandlords: [],
      blockedLandlords: [],
      
      // Verification Status
      verificationStatus: {
        identity: 'pending',
        insurance: userDocData.insuranceInfo ? 'pending' : 'pending',
        license: 'pending',
        w9: userDocData.w9FormUrl ? 'verified' : 'pending',
        background: 'pending'
      },
      
      // Financial
      bankAccountStatus: userDocData.bankAccountVerified ? 'verified' : 'pending',
      taxDocuments: userDocData.w9FormUrl ? [userDocData.w9FormUrl] : [],
      
      // Preferences (defaults)
      preferredJobTypes: userDocData.serviceTypes || [],
      minimumNoticeHours: 2,
      maxJobsPerDay: 3,
      
      // Location
      serviceZipCodes: [], // Can be enhanced later
      
      // Timestamps
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastActiveAt: serverTimestamp()
    };
    
    // Use a batch write to ensure both documents are created atomically
    const batch = writeBatch(db);
    
    // Update users document
    const userDocRef = doc(db, 'users', currentUser.uid);
    batch.update(userDocRef, userDocData);
    
    // Create contractor profile document
    const contractorProfileRef = doc(db, 'contractorProfiles', currentUser.uid);
    batch.set(contractorProfileRef, contractorProfileData);
    
    // Commit the batch
    await batch.commit();
    
    // Refresh the user profile before redirecting
    await fetchUserProfile(currentUser.uid);
    
    console.log('Contractor onboarding complete with profile creation');
    
    // Redirect to contractor dashboard
    navigate('/contractor/dashboard');
  } catch (error) {
    console.error('Error saving onboarding data:', error);
    setError(`Error saving your information: ${error.message}`);
  } finally {
    setLoading(false);
  }
};
```

Don't forget to add the import for `writeBatch`:
```javascript
import { doc, updateDoc, serverTimestamp, writeBatch, setDoc } from 'firebase/firestore';
```

### 2. Update Contractor Service for Fallback Support

**File**: `src/services/firestore/contractorService.ts`

Add fallback logic to read from `users` collection when `contractorProfiles` doesn't exist:

```typescript
// Add this utility function at the top of the file
const mapUserDataToProfile = (userData: any, userId: string): ContractorProfile => ({
  contractorId: userId,
  userId: userId,
  skills: userData.serviceTypes || [],
  serviceArea: userData.serviceArea || '',
  availability: true,
  preferredProperties: [],
  rating: 5, // Default for migrated profiles
  jobsCompleted: 0,
  companyName: userData.companyName || null
});

// Update the getContractorProfileById function
export async function getContractorProfileById(contractorId: string): Promise<ContractorProfile | null> {
  try {
    // First, try to get from contractorProfiles collection
    const profileDoc = doc(db, 'contractorProfiles', contractorId);
    const profileSnapshot = await getDoc(profileDoc);
    
    if (profileSnapshot.exists()) {
      const data = profileSnapshot.data();
      return {
        contractorId: profileSnapshot.id,
        userId: data.userId,
        skills: data.skills || [],
        serviceArea: data.serviceArea || '',
        availability: data.availability || true,
        preferredProperties: data.preferredProperties || [],
        rating: data.rating || 0,
        jobsCompleted: data.jobsCompleted || 0,
        companyName: data.companyName
      };
    }
    
    // Fallback: try to get from users collection and migrate
    const userDoc = doc(db, 'users', contractorId);
    const userSnapshot = await getDoc(userDoc);
    
    if (userSnapshot.exists() && userSnapshot.data().userType === 'contractor') {
      const userData = userSnapshot.data();
      
      // Create a profile from user data
      const profileData = mapUserDataToProfile(userData, contractorId);
      
      // Optionally, create the contractorProfiles document for future use
      try {
        await setDoc(profileDoc, {
          ...profileData,
          displayName: userData.name || `${userData.firstName} ${userData.lastName}`,
          email: userData.email,
          phoneNumber: userData.phoneNumber || '',
          yearsExperience: userData.yearsExperience || '0-2',
          hourlyRate: userData.hourlyRate,
          verificationStatus: {
            identity: 'pending',
            insurance: 'pending',
            license: 'pending',
            w9: userData.w9FormUrl ? 'verified' : 'pending',
            background: 'pending'
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastActiveAt: serverTimestamp()
        });
        
        console.log(`Migrated contractor profile for ${contractorId}`);
      } catch (migrationError) {
        console.warn(`Failed to migrate contractor profile for ${contractorId}:`, migrationError);
      }
      
      return profileData;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting contractor profile:', error);
    return null;
  }
}
```

### 3. Create Data Migration Script

**File**: `scripts/migrate-contractor-profiles.js`

```javascript
const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs,
  doc,
  getDoc,
  setDoc,
  serverTimestamp 
} = require('firebase/firestore');

// Initialize Firebase (you'll need your config)
const firebaseConfig = {
  // Your Firebase config
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateContractorProfiles() {
  console.log('Starting contractor profile migration...');
  
  try {
    // Get all contractor users
    const usersQuery = query(
      collection(db, 'users'),
      where('userType', '==', 'contractor'),
      where('onboardingComplete', '==', true)
    );
    
    const usersSnapshot = await getDocs(usersQuery);
    console.log(`Found ${usersSnapshot.docs.length} contractor users to migrate`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      try {
        const userData = userDoc.data();
        const userId = userDoc.id;
        
        // Check if contractor profile already exists
        const profileDoc = doc(db, 'contractorProfiles', userId);
        const profileSnapshot = await getDoc(profileDoc);
        
        if (profileSnapshot.exists()) {
          console.log(`Profile already exists for ${userId}, skipping`);
          skippedCount++;
          continue;
        }
        
        // Create contractor profile from user data
        const profileData = {
          contractorId: userId,
          userId: userId,
          displayName: userData.name || `${userData.firstName} ${userData.lastName}`,
          email: userData.email,
          phoneNumber: userData.phoneNumber || '',
          companyName: userData.companyName || null,
          skills: userData.serviceTypes || [],
          serviceArea: userData.serviceArea || '',
          hourlyRate: userData.hourlyRate || null,
          yearsExperience: userData.yearsExperience || '0-2',
          availability: true,
          rating: 5,
          reviewCount: 0,
          jobsCompleted: 0,
          jobsInProgress: 0,
          jobsCancelled: 0,
          averageResponseTime: 0,
          averageCompletionTime: 0,
          preferredProperties: [],
          affiliatedLandlords: [],
          blockedLandlords: [],
          verificationStatus: {
            identity: 'pending',
            insurance: userData.insuranceInfo ? 'pending' : 'pending',
            license: 'pending',
            w9: userData.w9FormUrl ? 'verified' : 'pending',
            background: 'pending'
          },
          bankAccountStatus: userData.bankAccountVerified ? 'verified' : 'pending',
          taxDocuments: userData.w9FormUrl ? [userData.w9FormUrl] : [],
          preferredJobTypes: userData.serviceTypes || [],
          minimumNoticeHours: 2,
          maxJobsPerDay: 3,
          serviceZipCodes: [],
          createdAt: userData.createdAt || serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastActiveAt: serverTimestamp()
        };
        
        await setDoc(profileDoc, profileData);
        console.log(`✅ Migrated profile for ${userId}`);
        migratedCount++;
        
      } catch (error) {
        console.error(`❌ Error migrating ${userDoc.id}:`, error);
        errorCount++;
      }
    }
    
    console.log('\n📊 Migration Summary:');
    console.log(`✅ Migrated: ${migratedCount}`);
    console.log(`⏭️  Skipped: ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📊 Total: ${usersSnapshot.docs.length}`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run the migration
migrateContractorProfiles()
  .then(() => {
    console.log('Migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
```

### 4. Update Dashboard Components for Graceful Degradation

**File**: `src/components/contractor/ContractorDashboard.jsx`

Add error handling for missing profile data:

```javascript
// Add this helper function at the top of the component
const validateContractorProfile = async (userId) => {
  try {
    // Check if contractor profile exists
    const profileDoc = await getDoc(doc(db, 'contractorProfiles', userId));
    
    if (!profileDoc.exists()) {
      console.warn('Contractor profile not found, checking for migration...');
      
      // Try to get user data for migration
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (userDoc.exists() && userDoc.data().userType === 'contractor') {
        console.log('User data found, migrating to contractor profile...');
        // Trigger migration or show migration prompt
        return { needsMigration: true, userData: userDoc.data() };
      }
    }
    
    return { needsMigration: false, profileExists: profileDoc.exists() };
  } catch (error) {
    console.error('Error validating contractor profile:', error);
    return { needsMigration: false, profileExists: false, error };
  }
};

// Add this to the useEffect hook that loads data
useEffect(() => {
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  const initializeDashboard = async () => {
    try {
      // Validate contractor profile first
      const validation = await validateContractorProfile(currentUser.uid);
      
      if (validation.needsMigration) {
        // Show migration prompt or auto-migrate
        console.log('Profile migration needed');
        // You could trigger automatic migration here
      }
      
      // Continue with existing data loading logic...
      // ... rest of existing useEffect logic
      
    } catch (error) {
      console.error('Error initializing dashboard:', error);
      setError('Failed to initialize dashboard. Please refresh the page.');
    }
  };

  initializeDashboard();
}, []);
```

## Testing Plan

### 1. Unit Tests
Create tests for the new functionality:

**File**: `src/components/onboarding/__tests__/ContractorOnboarding.test.jsx`

```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ContractorOnboarding from '../ContractorOnboarding';
import { useAuth } from '../../../context/AuthContext';

// Mock Firebase
jest.mock('../../../firebase/config', () => ({
  db: {},
  writeBatch: jest.fn(() => ({
    update: jest.fn(),
    set: jest.fn(),
    commit: jest.fn()
  }))
}));

jest.mock('../../../context/AuthContext');

describe('ContractorOnboarding', () => {
  beforeEach(() => {
    useAuth.mockReturnValue({
      currentUser: { uid: 'test-uid', email: 'test@example.com' },
      fetchUserProfile: jest.fn()
    });
  });

  test('creates both user and contractor profile documents on completion', async () => {
    render(
      <BrowserRouter>
        <ContractorOnboarding />
      </BrowserRouter>
    );

    // Test form completion and submission
    // This test should verify that both documents are created
  });
});
```

### 2. Integration Tests
Test the complete onboarding → dashboard flow:

**File**: `src/__tests__/integration/contractorOnboardingFlow.test.js`

```javascript
describe('Contractor Onboarding Integration', () => {
  test('complete onboarding flow creates proper documents', async () => {
    // 1. Complete onboarding form
    // 2. Verify user document is updated
    // 3. Verify contractor profile is created
    // 4. Verify dashboard loads successfully
    // 5. Verify contractor can view jobs
  });
});
```

### 3. Manual Testing Checklist

**Pre-Migration Testing**:
- [ ] Create new contractor account
- [ ] Complete onboarding flow
- [ ] Verify both `users` and `contractorProfiles` documents are created
- [ ] Verify dashboard loads without errors
- [ ] Verify contractor can see job listings
- [ ] Verify profile data is consistent between collections

**Migration Testing**:
- [ ] Run migration script on test data
- [ ] Verify existing contractors can access dashboard
- [ ] Verify no data loss during migration
- [ ] Verify new contractors continue to work properly

## Monitoring & Rollback Plan

### 1. Monitoring Metrics
Track these metrics during rollout:
- Onboarding completion rate
- Dashboard load success rate
- Profile creation success rate
- Migration success rate
- Error rates by component

### 2. Feature Flags
Implement feature flags for controlled rollout:

```javascript
// Feature flag for new onboarding flow
const useEnhancedOnboarding = process.env.REACT_APP_ENHANCED_ONBOARDING === 'true';

if (useEnhancedOnboarding) {
  // Use new profile creation logic
} else {
  // Use legacy logic
}
```

### 3. Rollback Plan
If issues arise:
1. **Immediate**: Disable feature flag to revert to old flow
2. **Short-term**: Fix critical issues and re-enable gradually
3. **Data Recovery**: Use backup collections if data corruption occurs

## Deployment Steps

### 1. Pre-Deployment
- [ ] Run tests in staging environment
- [ ] Backup current Firestore data
- [ ] Create rollback scripts
- [ ] Set up monitoring alerts

### 2. Deployment
- [ ] Deploy with feature flag disabled
- [ ] Run migration script on subset of users
- [ ] Enable feature flag for 10% of new registrations
- [ ] Monitor metrics and error rates
- [ ] Gradually increase rollout percentage

### 3. Post-Deployment
- [ ] Monitor dashboard load rates
- [ ] Check for any error spikes
- [ ] Verify data consistency
- [ ] Complete migration for all existing contractors

## Success Criteria

### Week 1 (Phase 1)
- [ ] 100% of new contractors can access dashboard after onboarding
- [ ] 0% critical errors in onboarding flow
- [ ] Data consistency between `users` and `contractorProfiles` > 99%

### Week 2-3 (Phase 2)
- [ ] All existing contractors migrated successfully
- [ ] Enhanced availability features working
- [ ] Rating system properly initialized

### Week 4+ (Phase 3)
- [ ] Profile images implemented
- [ ] Landlord relationships functional
- [ ] Performance optimizations in place

---

**Last Updated**: January 2025
**Next Review**: After Phase 1 completion 