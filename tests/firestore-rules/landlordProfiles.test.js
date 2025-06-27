/**
 * Unit Tests for Firestore Security Rules - LandlordProfiles Collection
 * 
 * Tests the enhanced security rules for the landlordProfiles collection to ensure:
 * 1. Proper access control based on ownership
 * 2. Restricted field updates (acceptedTenants, invitesSent, acceptedTenantDetails)
 * 3. Cloud Functions can bypass restrictions using admin SDK
 * 4. Unauthorized users are denied access
 */

const firebase = require('@firebase/testing');
const { readFileSync } = require('fs');
const { join } = require('path');

const PROJECT_ID = 'propagentic-test';
const LANDLORD_UID = 'test-landlord-123';
const OTHER_USER_UID = 'other-user-456';
const CONTRACTOR_UID = 'contractor-789';

// Read Firestore rules
const rules = readFileSync(join(__dirname, '../../firestore.rules'), 'utf8');

let testEnv;

describe('Firestore Rules - LandlordProfiles Collection', () => {
  beforeAll(async () => {
    testEnv = await firebase.initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: { rules },
    });
  });

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  beforeEach(async () => {
    if (testEnv) {
      await testEnv.clearFirestore();
    }
  });

  // Helper function to create test user document
  async function createTestUser(uid, userType = 'landlord') {
    const adminDb = testEnv.authenticatedContext('admin', { admin: true }).firestore();
    await adminDb.collection('users').doc(uid).set({
      uid,
      userType,
      role: userType,
      email: `${uid}@test.com`,
      firstName: 'Test',
      lastName: 'User',
    });
  }

  // Helper function to create test landlord profile
  async function createTestLandlordProfile(landlordId, data = {}) {
    const adminDb = testEnv.authenticatedContext('admin', { admin: true }).firestore();
    const defaultData = {
      uid: landlordId,
      landlordId,
      firstName: 'Test',
      lastName: 'Landlord',
      email: `${landlordId}@test.com`,
      acceptedTenants: [],
      invitesSent: [],
      acceptedTenantDetails: [],
      contractors: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await adminDb.collection('landlordProfiles').doc(landlordId).set({ ...defaultData, ...data });
  }

  describe('Profile Creation', () => {
    test('should allow landlord to create their own profile', async () => {
      await createTestUser(LANDLORD_UID, 'landlord');
      
      const landlordDb = testEnv.authenticatedContext(LANDLORD_UID).firestore();
      const profileData = {
        uid: LANDLORD_UID,
        landlordId: LANDLORD_UID,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
        acceptedTenants: [],
        invitesSent: [],
        acceptedTenantDetails: [],
        contractors: [],
      };

      await expect(
        landlordDb.collection('landlordProfiles').doc(LANDLORD_UID).set(profileData)
      ).resolves.not.toThrow();
    });

    test('should deny profile creation by other users', async () => {
      await createTestUser(OTHER_USER_UID, 'tenant');
      
      const otherUserDb = testEnv.authenticatedContext(OTHER_USER_UID).firestore();
      const profileData = {
        uid: LANDLORD_UID,
        landlordId: LANDLORD_UID,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
      };

      await expect(
        otherUserDb.collection('landlordProfiles').doc(LANDLORD_UID).set(profileData)
      ).rejects.toThrow();
    });

    test('should deny profile creation with mismatched uid', async () => {
      await createTestUser(LANDLORD_UID, 'landlord');
      
      const landlordDb = testEnv.authenticatedContext(LANDLORD_UID).firestore();
      const profileData = {
        uid: 'wrong-uid',
        landlordId: LANDLORD_UID,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
      };

      await expect(
        landlordDb.collection('landlordProfiles').doc(LANDLORD_UID).set(profileData)
      ).rejects.toThrow();
    });

    test('should deny profile creation with mismatched landlordId', async () => {
      await createTestUser(LANDLORD_UID, 'landlord');
      
      const landlordDb = testEnv.authenticatedContext(LANDLORD_UID).firestore();
      const profileData = {
        uid: LANDLORD_UID,
        landlordId: 'wrong-landlord-id',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
      };

      await expect(
        landlordDb.collection('landlordProfiles').doc(LANDLORD_UID).set(profileData)
      ).rejects.toThrow();
    });
  });

  describe('Profile Reading', () => {
    beforeEach(async () => {
      await createTestUser(LANDLORD_UID, 'landlord');
      await createTestUser(CONTRACTOR_UID, 'contractor');
      await createTestLandlordProfile(LANDLORD_UID, {
        contractors: [CONTRACTOR_UID],
      });
    });

    test('should allow landlord to read their own profile', async () => {
      const landlordDb = testEnv.authenticatedContext(LANDLORD_UID).firestore();
      
      await expect(
        landlordDb.collection('landlordProfiles').doc(LANDLORD_UID).get()
      ).resolves.not.toThrow();
    });

    test('should allow contractor to read landlord profile if in rolodex', async () => {
      const contractorDb = testEnv.authenticatedContext(CONTRACTOR_UID).firestore();
      
      await expect(
        contractorDb.collection('landlordProfiles').doc(LANDLORD_UID).get()
      ).resolves.not.toThrow();
    });

    test('should deny other users from reading landlord profile', async () => {
      await createTestUser(OTHER_USER_UID, 'tenant');
      const otherUserDb = testEnv.authenticatedContext(OTHER_USER_UID).firestore();
      
      await expect(
        otherUserDb.collection('landlordProfiles').doc(LANDLORD_UID).get()
      ).rejects.toThrow();
    });

    test('should deny unauthenticated access', async () => {
      const unauthDb = testEnv.unauthenticatedContext().firestore();
      
      await expect(
        unauthDb.collection('landlordProfiles').doc(LANDLORD_UID).get()
      ).rejects.toThrow();
    });
  });

  describe('Profile Updates - Allowed Fields', () => {
    beforeEach(async () => {
      await createTestUser(LANDLORD_UID, 'landlord');
      await createTestLandlordProfile(LANDLORD_UID);
    });

    test('should allow landlord to update basic profile fields', async () => {
      const landlordDb = testEnv.authenticatedContext(LANDLORD_UID).firestore();
      
      await expect(
        landlordDb.collection('landlordProfiles').doc(LANDLORD_UID).update({
          firstName: 'Updated',
          lastName: 'Name',
          phone: '+1234567890',
        })
      ).resolves.not.toThrow();
    });

    test('should allow landlord to update company information', async () => {
      const landlordDb = testEnv.authenticatedContext(LANDLORD_UID).firestore();
      
      await expect(
        landlordDb.collection('landlordProfiles').doc(LANDLORD_UID).update({
          companyName: 'Test Property Management',
          website: 'https://test.com',
          businessLicense: 'LICENSE123',
        })
      ).resolves.not.toThrow();
    });

    test('should deny update if uid or landlordId is changed', async () => {
      const landlordDb = testEnv.authenticatedContext(LANDLORD_UID).firestore();
      
      await expect(
        landlordDb.collection('landlordProfiles').doc(LANDLORD_UID).update({
          uid: 'different-uid',
          firstName: 'Updated',
        })
      ).rejects.toThrow();

      await expect(
        landlordDb.collection('landlordProfiles').doc(LANDLORD_UID).update({
          landlordId: 'different-landlord-id',
          firstName: 'Updated',
        })
      ).rejects.toThrow();
    });
  });

  describe('Profile Updates - Restricted Fields', () => {
    beforeEach(async () => {
      await createTestUser(LANDLORD_UID, 'landlord');
      await createTestLandlordProfile(LANDLORD_UID, {
        acceptedTenants: ['tenant1'],
        invitesSent: ['invite1'],
        acceptedTenantDetails: [{ id: 'tenant1', name: 'Test Tenant' }],
      });
    });

    test('should deny landlord from updating acceptedTenants array', async () => {
      const landlordDb = testEnv.authenticatedContext(LANDLORD_UID).firestore();
      
      await expect(
        landlordDb.collection('landlordProfiles').doc(LANDLORD_UID).update({
          acceptedTenants: ['tenant1', 'tenant2'],
        })
      ).rejects.toThrow();
    });

    test('should deny landlord from updating invitesSent array', async () => {
      const landlordDb = testEnv.authenticatedContext(LANDLORD_UID).firestore();
      
      await expect(
        landlordDb.collection('landlordProfiles').doc(LANDLORD_UID).update({
          invitesSent: ['invite1', 'invite2'],
        })
      ).rejects.toThrow();
    });

    test('should deny landlord from updating acceptedTenantDetails array', async () => {
      const landlordDb = testEnv.authenticatedContext(LANDLORD_UID).firestore();
      
      await expect(
        landlordDb.collection('landlordProfiles').doc(LANDLORD_UID).update({
          acceptedTenantDetails: [
            { id: 'tenant1', name: 'Test Tenant' },
            { id: 'tenant2', name: 'Another Tenant' }
          ],
        })
      ).rejects.toThrow();
    });

    test('should deny combined update with restricted and allowed fields', async () => {
      const landlordDb = testEnv.authenticatedContext(LANDLORD_UID).firestore();
      
      await expect(
        landlordDb.collection('landlordProfiles').doc(LANDLORD_UID).update({
          firstName: 'Updated Name', // allowed
          acceptedTenants: ['tenant1', 'tenant2'], // restricted
        })
      ).rejects.toThrow();
    });
  });

  describe('Cloud Functions Access (Admin SDK)', () => {
    beforeEach(async () => {
      await createTestUser(LANDLORD_UID, 'landlord');
      await createTestLandlordProfile(LANDLORD_UID);
    });

    test('should allow admin (Cloud Functions) to update restricted fields', async () => {
      // Simulate Cloud Functions using admin SDK
      const adminDb = testEnv.authenticatedContext('admin', { admin: true }).firestore();
      
      await expect(
        adminDb.collection('landlordProfiles').doc(LANDLORD_UID).update({
          acceptedTenants: ['tenant1', 'tenant2'],
          invitesSent: ['invite1', 'invite2'],
          acceptedTenantDetails: [
            { id: 'tenant1', name: 'Test Tenant 1' },
            { id: 'tenant2', name: 'Test Tenant 2' }
          ],
        })
      ).resolves.not.toThrow();
    });

    test('should allow admin to read any landlord profile', async () => {
      const adminDb = testEnv.authenticatedContext('admin', { admin: true }).firestore();
      
      await expect(
        adminDb.collection('landlordProfiles').doc(LANDLORD_UID).get()
      ).resolves.not.toThrow();
    });

    test('should allow admin to delete any landlord profile', async () => {
      const adminDb = testEnv.authenticatedContext('admin', { admin: true }).firestore();
      
      await expect(
        adminDb.collection('landlordProfiles').doc(LANDLORD_UID).delete()
      ).resolves.not.toThrow();
    });
  });

  describe('Profile Deletion', () => {
    beforeEach(async () => {
      await createTestUser(LANDLORD_UID, 'landlord');
      await createTestUser(OTHER_USER_UID, 'tenant');
      await createTestLandlordProfile(LANDLORD_UID);
    });

    test('should allow landlord to delete their own profile', async () => {
      const landlordDb = testEnv.authenticatedContext(LANDLORD_UID).firestore();
      
      await expect(
        landlordDb.collection('landlordProfiles').doc(LANDLORD_UID).delete()
      ).resolves.not.toThrow();
    });

    test('should deny other users from deleting landlord profile', async () => {
      const otherUserDb = testEnv.authenticatedContext(OTHER_USER_UID).firestore();
      
      await expect(
        otherUserDb.collection('landlordProfiles').doc(LANDLORD_UID).delete()
      ).rejects.toThrow();
    });
  });

  describe('Data Integrity Verification', () => {
    beforeEach(async () => {
      await createTestUser(LANDLORD_UID, 'landlord');
      await createTestLandlordProfile(LANDLORD_UID);
    });

    test('should maintain data integrity on valid updates', async () => {
      const landlordDb = testEnv.authenticatedContext(LANDLORD_UID).firestore();
      
      await landlordDb.collection('landlordProfiles').doc(LANDLORD_UID).update({
        firstName: 'UpdatedName',
        companyName: 'New Company',
      });

      const doc = await landlordDb.collection('landlordProfiles').doc(LANDLORD_UID).get();
      const data = doc.data();
      
      expect(data.firstName).toBe('UpdatedName');
      expect(data.companyName).toBe('New Company');
      expect(data.uid).toBe(LANDLORD_UID); // Should remain unchanged
      expect(data.landlordId).toBe(LANDLORD_UID); // Should remain unchanged
    });

    test('should preserve restricted arrays during allowed updates', async () => {
      // Setup with restricted data
      const adminDb = testEnv.authenticatedContext('admin', { admin: true }).firestore();
      await adminDb.collection('landlordProfiles').doc(LANDLORD_UID).update({
        acceptedTenants: ['existing-tenant'],
        invitesSent: ['existing-invite'],
      });

      // Update allowed fields as landlord
      const landlordDb = testEnv.authenticatedContext(LANDLORD_UID).firestore();
      await landlordDb.collection('landlordProfiles').doc(LANDLORD_UID).update({
        firstName: 'NewName',
      });

      // Verify restricted data is preserved
      const doc = await adminDb.collection('landlordProfiles').doc(LANDLORD_UID).get();
      const data = doc.data();
      
      expect(data.firstName).toBe('NewName');
      expect(data.acceptedTenants).toEqual(['existing-tenant']);
      expect(data.invitesSent).toEqual(['existing-invite']);
    });
  });
}); 