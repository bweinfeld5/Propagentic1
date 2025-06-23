import { 
  mockProperty, mockTenant, mockLandlord,
  firestoreProperty, createTimestamp 
} from '../fixtures';
import dataService from '../../src/services/dataService';
import { vi, describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';

// Hoist mockDbInstance
const { mockDbInstance } = vi.hoisted(() => {
  return {
    mockDbInstance: {
      collection: vi.fn().mockReturnThis(),
      doc: vi.fn().mockReturnThis(),
    }
  };
});

// Mock Firebase config
vi.mock('../../src/firebase/config', () => ({
  db: mockDbInstance
}));

// Mock resilienceUtils to bypass retry logic
vi.mock('../../src/utils/retryUtils', () => ({
  resilientFirestoreOperation: vi.fn((fn) => fn())
}));

// Use vi.hoisted for mocks used inside vi.mock factory
const { mockGetDoc, mockGetDocs, mockDoc, mockCollection, mockWhere, mockQuery } = vi.hoisted(() => {
  // These functions will be returned by the 'firebase/firestore' mock
  // and need to be mockable themselves.
  const _mockDoc = vi.fn();
  const _mockCollection = vi.fn();
  const _mockWhere = vi.fn();
  const _mockQuery = vi.fn();
  return {
    mockGetDoc: vi.fn(),
    mockGetDocs: vi.fn(),
    mockDoc: _mockDoc.mockImplementation((db, path, ...pathSegments) => {
      // Return a mock doc reference structure, can be simple if not deeply inspected
      return { path: `${path}/${pathSegments.join('/')}`, id: pathSegments[pathSegments.length-1] }; 
    }),
    mockCollection: _mockCollection.mockImplementation((db, path) => {
      // Return a mock collection reference structure
      return { path, where: _mockWhere, get: vi.fn() }; // Ensure `where` is available for chaining
    }),
    mockWhere: _mockWhere.mockReturnThis(), // For chaining: collection().where().where()...
    mockQuery: _mockQuery.mockReturnThis(), // For query(collectionRef, where(...))
  };
});

// Mock firebase/firestore itself
vi.mock('firebase/firestore', async (importOriginal) => {
  const original = await importOriginal(); // Import original to spread non-mocked parts
  return {
    ...original, // Spread original to keep non-mocked parts (like Timestamp, serverTimestamp etc.)
    getDoc: mockGetDoc,
    getDocs: mockGetDocs,
    doc: mockDoc, 
    collection: mockCollection,
    query: mockQuery, // Mock query as well
    where: mockWhere, // Mock where as well
    // Add other exports if dataService uses them directly and they need mocking, e.g.:
    // serverTimestamp: vi.fn(() => ({ type: 'serverTimestamp' })), // Example mock
  };
});

describe('DataService - Property Methods', () => {
  let testDb: any; // This seems related to a test environment, might not be needed with full mocks
  
  beforeAll(() => {
    // @ts-ignore
    // testDb = global.testEnv?.firestore(); // Comment out if using full mocks
  });
  
  beforeEach(async () => {
    // Reset mocks before each test
    mockGetDoc.mockReset();
    mockGetDocs.mockReset();
    mockDoc.mockReset();
    mockCollection.mockReset();
    mockWhere.mockReset();
    mockQuery.mockReset();
    mockDbInstance.collection.mockClear(); // Clear calls to the db mock itself
    mockDbInstance.doc.mockClear();

    // if (testDb) { // Comment out if using full mocks
    //   await testDb.collection('properties').doc(mockProperty.id).set(firestoreProperty);
    //   await testDb.collection('users').doc(mockLandlord.id).set(mockLandlord);
    //   await testDb.collection('users').doc(mockTenant.id).set(mockTenant);
    // }
    
    dataService.configure({
      isDemoMode: false,
      // @ts-ignore
      currentUser: { uid: mockTenant.id }
    });
  });
  
  afterEach(async () => {
    vi.restoreAllMocks();
    // if (testDb) { // Comment out if using full mocks
    //   await testDb.collection('properties').doc(mockProperty.id).delete();
    //   await testDb.collection('users').doc(mockLandlord.id).delete();
    //   await testDb.collection('users').doc(mockTenant.id).delete();
    // }
  });
  
  describe('getPropertyById', () => {
    it('returns a property with full details when found', async () => {
      const mockPropertyDocData = { ...firestoreProperty };
      const mockManagerData = { ...mockLandlord };
      
      mockGetDoc
        .mockResolvedValueOnce({ exists: () => true, data: () => mockPropertyDocData, id: mockProperty.id })  // For property
        .mockResolvedValueOnce({ exists: () => true, data: () => mockManagerData, id: mockLandlord.id }); // For manager
      
      const result = await dataService.getPropertyById(mockProperty.id);
      
      expect(mockDoc).toHaveBeenCalledWith(mockDbInstance, 'properties', mockProperty.id);
      expect(mockDoc).toHaveBeenCalledWith(mockDbInstance, 'users', firestoreProperty.managerId); 
      expect(result).toBeTruthy();
      expect(result?.id).toBe(mockProperty.id);
      expect(result?.name).toBe(mockProperty.name);
      
      // Check for the formatted address
      expect(result?.formattedAddress).toBe("123 Main St San Francisco,  CA 94105");
      
      // Check for the photo URL
      expect(result?.photoUrl).toBe(mockProperty.photos[0]);
      
      // Check for manager info
      expect(result?.managerInfo).toBeTruthy();
      expect(result?.managerInfo?.name).toBe(mockLandlord.displayName);
      expect(result?.managerInfo?.email).toBe(mockLandlord.email);
      
      // Check for unit info for the current tenant
      expect(result?.unitInfo).toBeTruthy();
      expect(result?.unitInfo?.unitNumber).toBe("101");
    });
    
    it('returns null when the property is not found', async () => {
      mockGetDoc.mockResolvedValueOnce({ exists: () => false, data: () => undefined, id: 'nonexistent-property' });
      const result = await dataService.getPropertyById('nonexistent-property');
      expect(mockDoc).toHaveBeenCalledWith(mockDbInstance, 'properties', 'nonexistent-property');
      expect(result).toBeNull();
    });
    
    it('throws an error when propertyId is not provided', async () => {
      await expect(dataService.getPropertyById('')).rejects.toThrow('Property ID is required');
    });
  });
  
  describe('getPropertiesForTenant', () => {
    it('returns properties associated with the tenant from user profile with direct propertyId', async () => {
      const mockTenantWithPropertyId = { ...mockTenant, propertyId: mockProperty.id, properties: null };
      const mockPropertyDocData = { ...firestoreProperty };

      mockGetDoc
        .mockResolvedValueOnce({ exists: () => true, data: () => mockTenantWithPropertyId, id: mockTenant.id }) // For user profile
        .mockResolvedValueOnce({ exists: () => true, data: () => mockPropertyDocData, id: mockProperty.id });   // For property

      const result = await dataService.getPropertiesForTenant(mockTenant.id);
      expect(result).toHaveLength(1);
      // @ts-ignore
      expect(result[0].id).toBe(mockProperty.id);
    });
    
    it('returns properties associated with the tenant from user profile with properties array', async () => {
      const mockTenantWithPropertiesArray = { ...mockTenant, propertyId: null, properties: [mockProperty.id] };
      const mockPropertyDocData = { ...firestoreProperty };

      mockGetDoc
        .mockResolvedValueOnce({ exists: () => true, data: () => mockTenantWithPropertiesArray, id: mockTenant.id }) // For user profile
        .mockResolvedValueOnce({ exists: () => true, data: () => mockPropertyDocData, id: mockProperty.id });   // For property from array

      const result = await dataService.getPropertiesForTenant(mockTenant.id);
      expect(result).toHaveLength(1);
       // @ts-ignore
      expect(result[0].id).toBe(mockProperty.id);
    });
    
    it('returns properties with tenant in units array if not in profile', async () => {
      const mockTenantNoDirectProperties = { ...mockTenant, propertyId: null, properties: null }; 
      const mockPropertyWithTenantInUnit = {
        ...firestoreProperty,
        units: [{ unitNumber: '101', tenantId: mockTenant.id }]
      };
      const mockQuerySnapshot = {
        empty: false,
        docs: [{ id: mockProperty.id, data: () => mockPropertyWithTenantInUnit }],
      };
      
      mockGetDoc.mockResolvedValueOnce({ exists: () => true, data: () => mockTenantNoDirectProperties, id: mockTenant.id }); // User profile
      // This setup assumes getDocs is called on a collection of all properties
      mockGetDocs.mockResolvedValueOnce(mockQuerySnapshot); // For properties query

      const result = await dataService.getPropertiesForTenant(mockTenant.id);
      expect(result).toHaveLength(1);
      // @ts-ignore
      expect(result[0].id).toBe(mockProperty.id);
    });
    
    it('returns empty array when tenant has no properties', async () => {
      const mockTenantWithoutProperties = { ...mockTenant, propertyId: null, properties: null };
      mockGetDoc.mockResolvedValueOnce({ exists: () => true, data: () => mockTenantWithoutProperties, id: mockTenant.id });
      // Mock for the subsequent property query attempts if they happen
      mockGetDocs.mockResolvedValueOnce({ empty: true, docs: [] }); 
      // If it tries tenantProperties collection
      mockGetDocs.mockResolvedValueOnce({ empty: true, docs: [] }); 
      
      const result = await dataService.getPropertiesForTenant(mockTenant.id);
      expect(result).toEqual([]);
    });
    
    it('throws an error when tenantId is not provided', async () => {
      await expect(dataService.getPropertiesForTenant('')).rejects.toThrow('Tenant ID is required');
    });
  });
}); 