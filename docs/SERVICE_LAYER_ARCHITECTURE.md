# Service Layer Architecture Documentation

## Overview
This document outlines the service layer architecture for the Propagentic application, focusing on data access patterns, error handling, and integration between Firebase services and React components.

## Architecture Principles

### 1. Separation of Concerns
- **Data Layer**: Direct Firebase operations
- **Service Layer**: Business logic and data transformation
- **Component Layer**: UI logic and state management

### 2. Consistent Error Handling
- Standardized error responses across all services
- Graceful degradation for network issues
- User-friendly error messages

### 3. Type Safety
- TypeScript interfaces for all data models
- Strict typing for service responses
- Runtime validation where needed

## Service Organization

```
src/services/
├── firestore/
│   ├── contractorService.ts
│   ├── maintenanceService.ts
│   ├── inviteService.ts
│   ├── communicationService.ts
│   └── propertyService.ts
├── auth/
│   ├── authService.ts
│   └── userService.ts
├── storage/
│   └── fileUploadService.ts
├── analytics/
│   └── analyticsService.ts
└── index.ts (barrel exports)
```

## Core Service Patterns

### 1. Standard Service Structure

```typescript
// Template for all services
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../firebase/config';

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface ListResponse<T> extends ServiceResponse<T[]> {
  hasMore?: boolean;
  lastDoc?: any;
  total?: number;
}

class BaseService {
  protected collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  protected async handleServiceCall<T>(
    operation: () => Promise<T>,
    errorContext: string
  ): Promise<ServiceResponse<T>> {
    try {
      const data = await operation();
      return { success: true, data };
    } catch (error) {
      console.error(`${errorContext}:`, error);
      return {
        success: false,
        error: this.getErrorMessage(error),
        code: this.getErrorCode(error)
      };
    }
  }

  protected getErrorMessage(error: any): string {
    if (error.code) {
      switch (error.code) {
        case 'permission-denied':
          return 'You do not have permission to perform this action';
        case 'not-found':
          return 'The requested resource was not found';
        case 'network-request-failed':
          return 'Network error. Please check your connection';
        default:
          return error.message || 'An unexpected error occurred';
      }
    }
    return error.message || 'An unexpected error occurred';
  }

  protected getErrorCode(error: any): string {
    return error.code || 'unknown-error';
  }
}
```

### 2. CRUD Operations Pattern

```typescript
export class ContractorService extends BaseService {
  constructor() {
    super('contractorProfiles');
  }

  // CREATE
  async createProfile(
    contractorId: string, 
    profileData: Partial<ContractorProfile>
  ): Promise<ServiceResponse<ContractorProfile>> {
    return this.handleServiceCall(async () => {
      const docRef = doc(db, this.collectionName, contractorId);
      const completeProfile: ContractorProfile = {
        contractorId,
        userId: contractorId,
        ...this.getDefaultProfileData(),
        ...profileData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(docRef, completeProfile);
      return completeProfile;
    }, 'Failed to create contractor profile');
  }

  // READ
  async getProfile(contractorId: string): Promise<ServiceResponse<ContractorProfile>> {
    return this.handleServiceCall(async () => {
      const docRef = doc(db, this.collectionName, contractorId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Contractor profile not found');
      }
      
      return docSnap.data() as ContractorProfile;
    }, 'Failed to get contractor profile');
  }

  // UPDATE
  async updateProfile(
    contractorId: string, 
    updates: Partial<ContractorProfile>
  ): Promise<ServiceResponse<void>> {
    return this.handleServiceCall(async () => {
      const docRef = doc(db, this.collectionName, contractorId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    }, 'Failed to update contractor profile');
  }

  // DELETE
  async deleteProfile(contractorId: string): Promise<ServiceResponse<void>> {
    return this.handleServiceCall(async () => {
      const docRef = doc(db, this.collectionName, contractorId);
      await deleteDoc(docRef);
    }, 'Failed to delete contractor profile');
  }

  // LIST with pagination
  async searchProfiles(
    searchParams: ContractorSearchParams,
    paginationParams?: PaginationParams
  ): Promise<ListResponse<ContractorProfile>> {
    return this.handleServiceCall(async () => {
      const q = this.buildSearchQuery(searchParams, paginationParams);
      const querySnapshot = await getDocs(q);
      
      const profiles = querySnapshot.docs.map(doc => ({
        contractorId: doc.id,
        ...doc.data()
      } as ContractorProfile));
      
      return {
        profiles,
        hasMore: querySnapshot.docs.length === (paginationParams?.limit || 25),
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
        total: profiles.length
      };
    }, 'Failed to search contractor profiles');
  }

  private buildSearchQuery(
    searchParams: ContractorSearchParams,
    paginationParams?: PaginationParams
  ) {
    const constraints = [];
    
    if (searchParams.skills?.length) {
      constraints.push(where('skills', 'array-contains-any', searchParams.skills));
    }
    
    if (searchParams.availability !== undefined) {
      constraints.push(where('availability', '==', searchParams.availability));
    }
    
    if (searchParams.minRating) {
      constraints.push(where('rating', '>=', searchParams.minRating));
    }
    
    // Add ordering
    constraints.push(orderBy('rating', 'desc'));
    constraints.push(orderBy('createdAt', 'desc'));
    
    // Add pagination
    if (paginationParams?.limit) {
      constraints.push(limit(paginationParams.limit));
    }
    
    if (paginationParams?.startAfter) {
      constraints.push(startAfter(paginationParams.startAfter));
    }
    
    return query(collection(db, this.collectionName), ...constraints);
  }

  private getDefaultProfileData(): Partial<ContractorProfile> {
    return {
      availability: true,
      rating: 5,
      reviewCount: 0,
      jobsCompleted: 0,
      jobsInProgress: 0,
      preferredProperties: [],
      affiliatedLandlords: [],
      verificationStatus: {
        identity: 'pending',
        insurance: 'pending',
        license: 'pending',
        w9: 'pending',
        background: 'pending'
      }
    };
  }
}
```

### 3. Real-time Data Pattern

```typescript
export class MaintenanceService extends BaseService {
  private listeners: Map<string, () => void> = new Map();

  // Real-time subscription with cleanup
  async subscribeToContractorJobs(
    contractorId: string,
    onUpdate: (assignedJobs: MaintenanceRequest[], availableJobs: MaintenanceRequest[]) => void,
    onError: (error: Error) => void
  ): Promise<() => void> {
    try {
      // Query for assigned jobs
      const assignedQuery = query(
        collection(db, 'tickets'),
        where('contractorId', '==', contractorId),
        where('status', 'in', ['assigned', 'accepted', 'in_progress']),
        orderBy('updatedAt', 'desc')
      );

      // Query for available jobs
      const availableQuery = query(
        collection(db, 'tickets'),
        where('status', '==', 'pending_assignment'),
        where('category', 'in', await this.getContractorSkills(contractorId)),
        orderBy('priority', 'desc'),
        limit(10)
      );

      // Set up listeners
      const unsubscribeAssigned = onSnapshot(assignedQuery, 
        (snapshot) => {
          const assignedJobs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as MaintenanceRequest));

          // Get available jobs and call update
          this.getAvailableJobs(availableQuery).then(availableJobs => {
            onUpdate(assignedJobs, availableJobs);
          });
        },
        (error) => onError(error)
      );

      const unsubscribeAvailable = onSnapshot(availableQuery,
        (snapshot) => {
          const availableJobs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as MaintenanceRequest));

          // Get assigned jobs and call update
          this.getAssignedJobs(assignedQuery).then(assignedJobs => {
            onUpdate(assignedJobs, availableJobs);
          });
        },
        (error) => onError(error)
      );

      // Combined unsubscribe function
      const combinedUnsubscribe = () => {
        unsubscribeAssigned();
        unsubscribeAvailable();
        this.listeners.delete(contractorId);
      };

      this.listeners.set(contractorId, combinedUnsubscribe);
      return combinedUnsubscribe;

    } catch (error) {
      onError(error as Error);
      return () => {}; // Return empty cleanup function
    }
  }

  // Cleanup all listeners
  cleanupAllListeners(): void {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
  }
}
```

### 4. Data Transformation Pattern

```typescript
export class PropertyService extends BaseService {
  // Transform between internal and external data formats
  async getPropertyWithEnrichedData(propertyId: string): Promise<ServiceResponse<EnrichedProperty>> {
    return this.handleServiceCall(async () => {
      // Get base property data
      const property = await this.getProperty(propertyId);
      
      // Enrich with related data
      const [maintenanceHistory, currentTenants, preferredContractors] = await Promise.all([
        this.getMaintenanceHistory(propertyId),
        this.getCurrentTenants(propertyId),
        this.getPreferredContractors(property.preferredContractors)
      ]);

      return {
        ...property,
        maintenanceHistory: maintenanceHistory.data || [],
        currentTenants: currentTenants.data || [],
        preferredContractors: preferredContractors.data || [],
        stats: this.calculatePropertyStats(maintenanceHistory.data || [])
      };
    }, 'Failed to get enriched property data');
  }

  private calculatePropertyStats(maintenanceHistory: MaintenanceRequest[]) {
    return {
      totalRequests: maintenanceHistory.length,
      averageCompletionTime: this.calculateAverageCompletionTime(maintenanceHistory),
      mostCommonIssue: this.getMostCommonIssue(maintenanceHistory),
      totalMaintenanceCost: this.calculateTotalCost(maintenanceHistory)
    };
  }
}
```

## Error Handling Strategies

### 1. Component-Level Error Handling

```typescript
// Custom hook for service calls with loading and error states
export const useServiceCall = <T>() => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  const execute = async (serviceCall: () => Promise<ServiceResponse<T>>) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await serviceCall();
      
      if (response.success) {
        setData(response.data || null);
      } else {
        setError(response.error || 'Unknown error occurred');
      }
    } catch (error) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, data, execute, setError };
};

// Usage in components
const ContractorProfile = ({ contractorId }: { contractorId: string }) => {
  const { loading, error, data: profile, execute } = useServiceCall<ContractorProfile>();

  useEffect(() => {
    execute(() => contractorService.getProfile(contractorId));
  }, [contractorId]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!profile) return <NotFound />;

  return <ProfileDisplay profile={profile} />;
};
```

### 2. Global Error Boundary

```typescript
// Error boundary for unhandled service errors
export class ServiceErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to analytics service
    analyticsService.logError({
      error: error.message,
      stack: error.stack,
      errorInfo: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}
```

## Performance Optimization

### 1. Caching Strategy

```typescript
export class CacheManager {
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();

  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data as T;
  }

  invalidate(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }
}

// Usage in services
const cache = new CacheManager();

export class ContractorService extends BaseService {
  async getProfile(contractorId: string): Promise<ServiceResponse<ContractorProfile>> {
    const cacheKey = `contractor_profile_${contractorId}`;
    const cached = cache.get<ContractorProfile>(cacheKey);
    
    if (cached) {
      return { success: true, data: cached };
    }

    const result = await this.handleServiceCall(async () => {
      // ... fetch from Firestore
    }, 'Failed to get contractor profile');

    if (result.success && result.data) {
      cache.set(cacheKey, result.data, 2 * 60 * 1000); // 2 minutes TTL
    }

    return result;
  }
}
```

### 2. Batch Operations

```typescript
export class BatchOperationService {
  private pendingWrites: any[] = [];
  private batchTimer: NodeJS.Timeout | null = null;

  // Queue writes and batch them
  queueWrite(operation: any): void {
    this.pendingWrites.push(operation);
    
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }
    
    this.batchTimer = setTimeout(() => {
      this.executeBatch();
    }, 100); // Batch writes every 100ms
  }

  private async executeBatch(): Promise<void> {
    if (this.pendingWrites.length === 0) return;

    const batch = writeBatch(db);
    const operations = [...this.pendingWrites];
    this.pendingWrites = [];

    try {
      operations.forEach(operation => {
        switch (operation.type) {
          case 'set':
            batch.set(operation.ref, operation.data);
            break;
          case 'update':
            batch.update(operation.ref, operation.data);
            break;
          case 'delete':
            batch.delete(operation.ref);
            break;
        }
      });

      await batch.commit();
      console.log(`Executed batch with ${operations.length} operations`);
    } catch (error) {
      console.error('Batch operation failed:', error);
      // Re-queue failed operations or handle individually
    }
  }
}
```

## Testing Strategy

### 1. Service Unit Tests

```typescript
// Mock Firebase for testing
jest.mock('../../firebase/config', () => ({
  db: {},
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn()
}));

describe('ContractorService', () => {
  let contractorService: ContractorService;

  beforeEach(() => {
    contractorService = new ContractorService();
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return profile when found', async () => {
      const mockProfile = { contractorId: 'test-id', skills: ['plumbing'] };
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => mockProfile
      });

      const result = await contractorService.getProfile('test-id');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockProfile);
    });

    it('should return error when profile not found', async () => {
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => false
      });

      const result = await contractorService.getProfile('test-id');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });
});
```

### 2. Integration Tests

```typescript
describe('Contractor Service Integration', () => {
  beforeEach(async () => {
    // Set up test database
    await setupTestDatabase();
  });

  afterEach(async () => {
    // Clean up test data
    await cleanupTestDatabase();
  });

  it('should create and retrieve contractor profile', async () => {
    const profileData = {
      skills: ['plumbing', 'electrical'],
      serviceArea: 'Test City',
      availability: true
    };

    // Create profile
    const createResult = await contractorService.createProfile('test-id', profileData);
    expect(createResult.success).toBe(true);

    // Retrieve profile
    const getResult = await contractorService.getProfile('test-id');
    expect(getResult.success).toBe(true);
    expect(getResult.data?.skills).toEqual(profileData.skills);
  });
});
```

## Service Registry

### 1. Centralized Service Access

```typescript
// services/index.ts
export class ServiceRegistry {
  private static instance: ServiceRegistry;
  private services: Map<string, any> = new Map();

  static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry();
    }
    return ServiceRegistry.instance;
  }

  register<T>(name: string, service: T): void {
    this.services.set(name, service);
  }

  get<T>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service ${name} not found`);
    }
    return service as T;
  }
}

// Initialize services
const registry = ServiceRegistry.getInstance();
registry.register('contractor', new ContractorService());
registry.register('maintenance', new MaintenanceService());
registry.register('property', new PropertyService());

export const services = {
  contractor: registry.get<ContractorService>('contractor'),
  maintenance: registry.get<MaintenanceService>('maintenance'),
  property: registry.get<PropertyService>('property')
};
```

---

**Last Updated**: January 2025
**Next Review**: After service layer refactoring 