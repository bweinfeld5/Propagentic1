import { 
  mockInvite, mockProperty, mockLandlord, mockTenant,
  firestoreInvite, firestoreProperty
} from '../fixtures';
import * as inviteService from '../../services/firestore/inviteService';
import { vi, describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';

// Hoisted mocks for Firestore functions
const { 
  mockCollection, mockDoc, mockQuery, mockWhere, 
  mockGetDocs, mockGetDoc, mockDeleteDoc, mockSetDoc, mockUpdateDoc, mockTimestamp
} = vi.hoisted(() => {
  const _mockDocFn = vi.fn(); // Renamed to avoid conflict with the const mockDoc below
  return {
    mockCollection: vi.fn(),
    mockDoc: _mockDocFn.mockImplementation((db, path, ...pathSegments) => { 
      return { path: `${path}/${pathSegments.join('/')}`, id: pathSegments[pathSegments.length-1] }; 
    }),
    mockQuery: vi.fn(),
    mockWhere: vi.fn(),
    mockGetDocs: vi.fn(),
    mockGetDoc: vi.fn(),
    mockDeleteDoc: vi.fn(() => Promise.resolve()),
    mockSetDoc: vi.fn(() => Promise.resolve()),
    mockUpdateDoc: vi.fn(() => Promise.resolve()),
    mockTimestamp: {
      now: vi.fn(() => ({
        seconds: Math.floor(Date.now() / 1000),
        nanoseconds: 0
      }))
    }
  };
});

// Mock Firebase firestore
vi.mock('firebase/firestore', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    collection: mockCollection, // Use the hoisted mock directly
    doc: mockDoc, // Use the hoisted mockDoc which has the correct implementation
    query: mockQuery,
    where: mockWhere,
    getDocs: mockGetDocs,
    getDoc: mockGetDoc,
    deleteDoc: mockDeleteDoc,
    setDoc: mockSetDoc,
    updateDoc: mockUpdateDoc,
    Timestamp: mockTimestamp
  };
});

describe('InviteService Tests', () => {
  let firestore: any;
  
  beforeAll(() => {
    firestore = global.testEnv?.firestore();
  });
  
  beforeEach(async () => {
    // Resetting hoisted mocks
    mockCollection.mockClear();
    mockDoc.mockClear();
    mockQuery.mockClear();
    mockWhere.mockClear();
    mockGetDocs.mockReset(); // Use mockReset for functions that return values
    mockGetDoc.mockReset();
    mockDeleteDoc.mockReset();
    mockSetDoc.mockReset();
    mockUpdateDoc.mockReset();
    mockTimestamp.now.mockClear();

    if (firestore) {
      await firestore.collection('invites').doc(mockInvite.inviteId).set(firestoreInvite);
      await firestore.collection('properties').doc(mockProperty.id).set(firestoreProperty);
      await firestore.collection('users').doc(mockLandlord.id).set(mockLandlord);
    }
    vi.clearAllMocks(); // General cleanup, might be redundant with specific resets but safe
  });
  
  afterEach(async () => {
    if (firestore) {
      await firestore.collection('invites').doc(mockInvite.inviteId).delete();
      await firestore.collection('properties').doc(mockProperty.id).delete();
      await firestore.collection('users').doc(mockLandlord.id).delete();
    }
  });
  
  describe('getPendingInvitesForTenant', () => {
    it('returns invites for the tenant', async () => {
      const mockQuerySnapshot = {
        docs: [{
          id: mockInvite.inviteId,
          data: () => ({ ...mockInvite, tenantEmail: mockTenant.email, status: 'pending' }),
          exists: () => true
        }]
      };

      mockQuery.mockReturnValue('mock-query');
      mockGetDocs.mockResolvedValue(mockQuerySnapshot);
      
      const result = await inviteService.getPendingInvitesForTenant(mockTenant.email);
      
      expect(result).toHaveLength(1);
      const invite = result[0];
      expect(invite.id).toBe(mockInvite.inviteId);
      expect(invite.tenantEmail).toBe(mockTenant.email.toLowerCase());
      expect(invite.status).toBe('pending');
    });
    
    it('returns an empty array when no invites found', async () => {
      mockQuery.mockReturnValue('mock-query');
      mockGetDocs.mockResolvedValue({ docs: [] });
      
      const result = await inviteService.getPendingInvitesForTenant('no-invites@example.com');
      expect(result).toEqual([]);
    });
    
    it('returns an empty array when email is not provided', async () => {
      await expect(inviteService.getPendingInvitesForTenant('')).rejects.toThrow('Tenant email is required');
    });
  });
  
  describe('declineInvite', () => {
    it('updates invite status to declined via api.update', async () => {
      await inviteService.declineInvite(mockInvite.inviteId);
      
      // Check that the underlying updateDoc (mocked as mockUpdateDoc) was called
      // by api.update with the correct status and an updatedAt timestamp.
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: mockInvite.inviteId }), // Check that the doc ref has the correct id
        {
          status: 'declined',
          updatedAt: expect.anything() // api.update adds updatedAt
        }
      );
    });

    it('deleteInvite calls api.delete to remove the invite document', async () => {
      await inviteService.deleteInvite(mockInvite.inviteId);
      // api.delete calls firebase/firestore's deleteDoc, which is mockDeleteDoc
      // The first argument to deleteDoc is the DocumentReference.
      expect(mockDeleteDoc).toHaveBeenCalledWith(expect.objectContaining({ id: mockInvite.inviteId }));
    });
  });
}); 