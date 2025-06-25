import { 
  mockInviteCode, mockUsedInviteCode, 
  mockTenant, mockProperty,
  firestoreInviteCode, firestoreUsedInviteCode, firestoreProperty
} from '../fixtures';
import { vi, describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';

vi.mock('../../src/firebase/config', () => ({
  auth: {
    currentUser: {
      uid: 'test-tenant-id',
      email: 'test@example.com',
      getIdToken: async () => 'test-token'
    }
  },
  db: {}
}));

// Mock firebase functions
const mockHttpsCallable = vi.fn();
vi.mock('firebase/functions', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    getFunctions: vi.fn(() => ({})),
    httpsCallable: vi.fn(() => mockHttpsCallable) // Return the hoisted mock
  };
});

// Mock firebase/firestore for the validateInviteCode test
const mockGetDocs = vi.fn();
vi.mock('firebase/firestore', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    getDocs: mockGetDocs,
    // Ensure other necessary exports like collection, query, where are mocked if used by inviteCodeService directly
    collection: vi.fn().mockReturnThis(),
    query: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    doc: vi.fn().mockReturnThis(), // Added for completeness, if service uses doc()
  };
});

describe('redeemInviteCode Cloud Function Tests', () => {
  // let httpCallableMock: vi.Mock; // Type assertion if needed
  let functionsEmulator: any;
  
  beforeAll(() => {
    if (global.testEnv) {
      functionsEmulator = global.testEnv.functions;
    }
  });
  
  beforeEach(async () => {
    mockHttpsCallable.mockReset();
    mockGetDocs.mockReset();

    const firestoreEmulator = global.testEnv?.firestore();
    
    if (firestoreEmulator) {
      await firestoreEmulator.collection('inviteCodes').doc(mockInviteCode.id).set(firestoreInviteCode);
      await firestoreEmulator.collection('inviteCodes').doc(mockUsedInviteCode.id).set(firestoreUsedInviteCode);
      await firestoreEmulator.collection('properties').doc(mockProperty.id).set(firestoreProperty);
      await firestoreEmulator.collection('users').doc(mockTenant.id).set(mockTenant);
    }
  });
  
  afterEach(async () => {
    const firestoreEmulator = global.testEnv?.firestore();
    
    if (firestoreEmulator) {
      await firestoreEmulator.collection('inviteCodes').doc(mockInviteCode.id).delete();
      await firestoreEmulator.collection('inviteCodes').doc(mockUsedInviteCode.id).delete();
      await firestoreEmulator.collection('properties').doc(mockProperty.id).delete();
      await firestoreEmulator.collection('users').doc(mockTenant.id).delete();
    }
    
    vi.clearAllMocks(); // Use Vitest's clearAllMocks
  });
  
  describe('redeemInviteCode', () => {
    it('successfully redeems a valid invite code', async () => {
      mockHttpsCallable.mockResolvedValue({
        data: {
          success: true,
          message: 'Invite code redeemed successfully',
          property: {
            id: mockProperty.id,
            name: mockProperty.name,
            formattedAddress: '123 Main St, San Francisco, CA 94105',
            unitId: mockInviteCode.unitId
          }
        }
      });
      
      const { unifiedInviteCodeService } = await import('../../src/services/unifiedInviteCodeService');
      const result = await unifiedInviteCodeService.redeemInviteCode(mockInviteCode.code);
      
      expect(result).toBeTruthy();
      expect(result.success).toBe(true);
      expect(result.propertyId).toBe(mockProperty.id);
      expect(result.propertyName).toBe(mockProperty.name);
      expect(mockHttpsCallable).toHaveBeenCalledWith({ code: mockInviteCode.code });
    });
    
    it('throws an error for invalid invite code format', async () => {
      const { unifiedInviteCodeService } = await import('../../src/services/unifiedInviteCodeService');
      // The unified service returns a result object, not throws an error for format
      const result = await unifiedInviteCodeService.validateInviteCode('');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('Invalid code format');
    });
    
    it('returns an error when redeeming already used code', async () => {
      mockHttpsCallable.mockResolvedValue({
        data: { success: false, message: 'This invite code has already been used.' }
      });
      
      const { unifiedInviteCodeService } = await import('../../src/services/unifiedInviteCodeService');
      const result = await unifiedInviteCodeService.redeemInviteCode(mockUsedInviteCode.code);
      expect(result.success).toBe(false);
      expect(result.message).toBe('This invite code has already been used.');
      expect(mockHttpsCallable).toHaveBeenCalledWith({ code: mockUsedInviteCode.code });
    });
    
    it('returns an error when redeeming non-existent code', async () => {
      mockHttpsCallable.mockResolvedValue({
        data: { success: false, message: 'Invalid invite code. Please check the code and try again.' }
      });
      
      const { unifiedInviteCodeService } = await import('../../src/services/unifiedInviteCodeService');
      const result = await unifiedInviteCodeService.redeemInviteCode('NON-EXISTENT');
      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid invite code');
      expect(mockHttpsCallable).toHaveBeenCalledWith({ code: 'NON-EXISTENT' });
    });
    
    it('validates an invite code without redeeming it', async () => {
      const { unifiedInviteCodeService } = await import('../../src/services/unifiedInviteCodeService');
      
      mockGetDocs.mockResolvedValue({
        empty: false,
        docs: [{
          data: () => ({
            ...mockInviteCode,
            used: false,
            expiresAt: {
              toMillis: () => Date.now() + 1000 * 60 * 60 * 24 // Add a day
            }
          })
        }]
      });
      
      const result = await unifiedInviteCodeService.validateInviteCode(mockInviteCode.code);
      
      expect(result.isValid).toBe(true);
      expect(result.propertyId).toBe(mockProperty.id);
    });
  });
}); 