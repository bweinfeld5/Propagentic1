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
  startAfter,
  Timestamp,
  addDoc,
  onSnapshot,
  writeBatch,
  runTransaction,
  DocumentSnapshot,
  QuerySnapshot,
  FirestoreError,
  QueryConstraint,
  DocumentData,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
  or,
  and,
  CollectionReference,
  DocumentReference,
  WithFieldValue,
  UpdateData,
  PartialWithFieldValue
} from 'firebase/firestore';
import { db } from '../../firebase/config';

/**
 * Cache configuration interface
 */
interface CacheConfig {
  enabled: boolean;
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of cached items
}

/**
 * Retry configuration interface
 */
interface RetryConfig {
  enabled: boolean;
  maxAttempts: number;
  baseDelay: number; // Base delay in milliseconds
  maxDelay: number; // Maximum delay in milliseconds
  backoffFactor: number; // Exponential backoff factor
}

/**
 * Service operation result interface
 */
interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
  cached?: boolean;
}

/**
 * Pagination interface
 */
interface PaginationOptions {
  limit?: number;
  startAfter?: DocumentSnapshot;
  orderBy?: { field: string; direction: 'asc' | 'desc' }[];
}

/**
 * Pagination result interface
 */
interface PaginatedResult<T> {
  items: T[];
  hasMore: boolean;
  totalCount?: number;
  lastDocument?: DocumentSnapshot;
  nextCursor?: string;
}

/**
 * Cache entry interface
 */
interface CacheEntry<T> {
  data: T;
  timestamp: Date;
  expiresAt: Date;
}

/**
 * Base Firestore Service Class
 * Provides standardized operations, error handling, caching, and retry logic
 */
export abstract class BaseFirestoreService<T extends DocumentData> {
  protected collectionName: string;
  protected collectionRef: CollectionReference<T>;
  protected cache: Map<string, CacheEntry<any>> = new Map();
  
  // Configuration
  protected cacheConfig: CacheConfig = {
    enabled: true,
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 100
  };
  
  protected retryConfig: RetryConfig = {
    enabled: true,
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2
  };

  constructor(collectionName: string, converter?: any) {
    this.collectionName = collectionName;
    this.collectionRef = converter 
      ? (collection(db, collectionName).withConverter(converter) as CollectionReference<T>)
      : (collection(db, collectionName) as CollectionReference<T>);
  }

  // =============================================
  // CORE CRUD OPERATIONS
  // =============================================

  /**
   * Get a document by ID with caching and error handling
   */
  async getById(id: string, useCache: boolean = true): Promise<ServiceResult<T | null>> {
    const cacheKey = `get_${id}`;
    
    try {
      // Check cache first
      if (useCache && this.cacheConfig.enabled) {
        const cached = this.getFromCache<T>(cacheKey);
        if (cached) {
          return {
            success: true,
            data: cached,
            timestamp: new Date(),
            cached: true
          };
        }
      }

      // Execute with retry logic
      const docSnapshot = await this.executeWithRetry(async () => {
        const docRef = doc(this.collectionRef, id);
        return await getDoc(docRef);
      });

      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        
        // Cache the result
        if (useCache && this.cacheConfig.enabled) {
          this.setCache(cacheKey, data);
        }
        
        return {
          success: true,
          data,
          timestamp: new Date()
        };
      }

      return {
        success: true,
        data: null,
        timestamp: new Date()
      };
    } catch (error) {
      return this.handleError('getById', error);
    }
  }

  /**
   * Create a new document
   */
  async create(data: WithFieldValue<T>, customId?: string): Promise<ServiceResult<T>> {
    try {
      const docRef = customId 
        ? doc(this.collectionRef, customId)
        : doc(this.collectionRef);
        
      const docData = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      } as WithFieldValue<T>;

      await this.executeWithRetry(async () => {
        await setDoc(docRef, docData);
      });

      // Clear related cache entries
      this.invalidateCache(`get_${docRef.id}`);
      this.invalidateCachePattern('list_');
      this.invalidateCachePattern('search_');

      return {
        success: true,
        data: { id: docRef.id, ...data } as T,
        timestamp: new Date()
      };
    } catch (error) {
      return this.handleError('create', error);
    }
  }

  /**
   * Update a document
   */
  async update(id: string, data: UpdateData<T>): Promise<ServiceResult<T>> {
    try {
      const docRef = doc(this.collectionRef, id);
      const updateData = {
        ...data,
        updatedAt: serverTimestamp()
      } as UpdateData<T>;

      await this.executeWithRetry(async () => {
        await updateDoc(docRef, updateData);
      });

      // Get updated document
      const result = await this.getById(id, false);
      if (!result.success || !result.data) {
        throw new Error('Failed to retrieve updated document');
      }

      // Clear related cache entries
      this.invalidateCache(`get_${id}`);
      this.invalidateCachePattern('list_');
      this.invalidateCachePattern('search_');

      return {
        success: true,
        data: result.data,
        timestamp: new Date()
      };
    } catch (error) {
      return this.handleError('update', error);
    }
  }

  /**
   * Delete a document
   */
  async delete(id: string): Promise<ServiceResult<void>> {
    try {
      const docRef = doc(this.collectionRef, id);

      await this.executeWithRetry(async () => {
        await deleteDoc(docRef);
      });

      // Clear related cache entries
      this.invalidateCache(`get_${id}`);
      this.invalidateCachePattern('list_');
      this.invalidateCachePattern('search_');

      return {
        success: true,
        timestamp: new Date()
      };
    } catch (error) {
      return this.handleError('delete', error);
    }
  }

  // =============================================
  // QUERY OPERATIONS
  // =============================================

  /**
   * List documents with filtering and pagination
   */
  async list(
    filters: QueryConstraint[] = [],
    pagination?: PaginationOptions,
    useCache: boolean = true
  ): Promise<ServiceResult<PaginatedResult<T>>> {
    const cacheKey = `list_${JSON.stringify(filters)}_${JSON.stringify(pagination)}`;
    
    try {
      // Check cache first
      if (useCache && this.cacheConfig.enabled) {
        const cached = this.getFromCache<PaginatedResult<T>>(cacheKey);
        if (cached) {
          return {
            success: true,
            data: cached,
            timestamp: new Date(),
            cached: true
          };
        }
      }

      // Build query
      let q = query(this.collectionRef, ...filters);
      
      // Add ordering
      if (pagination?.orderBy) {
        for (const order of pagination.orderBy) {
          q = query(q, orderBy(order.field, order.direction));
        }
      }
      
      // Add pagination
      if (pagination?.startAfter) {
        q = query(q, startAfter(pagination.startAfter));
      }
      
      if (pagination?.limit) {
        q = query(q, limit(pagination.limit));
      }

      // Execute query
      const querySnapshot = await this.executeWithRetry(async () => {
        return await getDocs(q);
      });

      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as T));

      const result: PaginatedResult<T> = {
        items,
        hasMore: pagination?.limit ? items.length >= pagination.limit : false,
        lastDocument: querySnapshot.docs[querySnapshot.docs.length - 1]
      };

      // Cache the result
      if (useCache && this.cacheConfig.enabled) {
        this.setCache(cacheKey, result);
      }

      return {
        success: true,
        data: result,
        timestamp: new Date()
      };
    } catch (error) {
      return this.handleError('list', error);
    }
  }

  /**
   * Search documents with text and filters
   */
  async search(
    searchTerm: string,
    searchFields: string[],
    filters: QueryConstraint[] = [],
    pagination?: PaginationOptions,
    useCache: boolean = true
  ): Promise<ServiceResult<PaginatedResult<T>>> {
    const cacheKey = `search_${searchTerm}_${JSON.stringify(searchFields)}_${JSON.stringify(filters)}_${JSON.stringify(pagination)}`;
    
    try {
      // Check cache first
      if (useCache && this.cacheConfig.enabled) {
        const cached = this.getFromCache<PaginatedResult<T>>(cacheKey);
        if (cached) {
          return {
            success: true,
            data: cached,
            timestamp: new Date(),
            cached: true
          };
        }
      }

      // Get all documents first (Firestore doesn't have full-text search)
      const listResult = await this.list(filters, pagination, false);
      
      if (!listResult.success || !listResult.data) {
        throw new Error('Failed to get documents for search');
      }

      // Filter results based on search term
      const searchTermLower = searchTerm.toLowerCase();
      const filteredItems = listResult.data.items.filter(item => {
        return searchFields.some(field => {
          const fieldValue = this.getNestedValue(item, field);
          return fieldValue && 
                 typeof fieldValue === 'string' && 
                 fieldValue.toLowerCase().includes(searchTermLower);
        });
      });

      const result: PaginatedResult<T> = {
        items: filteredItems,
        hasMore: false, // Search doesn't support pagination currently
        totalCount: filteredItems.length
      };

      // Cache the result
      if (useCache && this.cacheConfig.enabled) {
        this.setCache(cacheKey, result);
      }

      return {
        success: true,
        data: result,
        timestamp: new Date()
      };
    } catch (error) {
      return this.handleError('search', error);
    }
  }

  // =============================================
  // REAL-TIME OPERATIONS
  // =============================================

  /**
   * Subscribe to real-time updates
   */
  subscribe(
    filters: QueryConstraint[],
    callback: (items: T[]) => void,
    onError?: (error: FirestoreError) => void
  ): () => void {
    try {
      const q = query(this.collectionRef, ...filters);
      
      return onSnapshot(q, (querySnapshot) => {
        const items = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as T));
        
        callback(items);
      }, (error) => {
        console.error(`Subscription error in ${this.collectionName}:`, error);
        if (onError) {
          onError(error);
        }
      });
    } catch (error) {
      console.error(`Failed to set up subscription for ${this.collectionName}:`, error);
      if (onError) {
        onError(error as FirestoreError);
      }
      return () => {}; // Return empty unsubscribe function
    }
  }

  // =============================================
  // BATCH OPERATIONS
  // =============================================

  /**
   * Batch create multiple documents
   */
  async batchCreate(items: WithFieldValue<T>[]): Promise<ServiceResult<T[]>> {
    try {
      const batch = writeBatch(db);
      const results: T[] = [];

      for (const item of items) {
        const docRef = doc(this.collectionRef);
        const docData = {
          ...item,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        } as WithFieldValue<T>;
        
        batch.set(docRef, docData);
        results.push({ id: docRef.id, ...item } as T);
      }

      await this.executeWithRetry(async () => {
        await batch.commit();
      });

      // Clear cache
      this.invalidateCachePattern('list_');
      this.invalidateCachePattern('search_');

      return {
        success: true,
        data: results,
        timestamp: new Date()
      };
    } catch (error) {
      return this.handleError('batchCreate', error);
    }
  }

  /**
   * Batch update multiple documents
   */
  async batchUpdate(updates: { id: string; data: UpdateData<T> }[]): Promise<ServiceResult<void>> {
    try {
      const batch = writeBatch(db);

      for (const update of updates) {
        const docRef = doc(this.collectionRef, update.id);
        const updateData = {
          ...update.data,
          updatedAt: serverTimestamp()
        } as UpdateData<T>;
        
        batch.update(docRef, updateData);
      }

      await this.executeWithRetry(async () => {
        await batch.commit();
      });

      // Clear cache
      for (const update of updates) {
        this.invalidateCache(`get_${update.id}`);
      }
      this.invalidateCachePattern('list_');
      this.invalidateCachePattern('search_');

      return {
        success: true,
        timestamp: new Date()
      };
    } catch (error) {
      return this.handleError('batchUpdate', error);
    }
  }

  // =============================================
  // CACHE MANAGEMENT
  // =============================================

  /**
   * Get item from cache
   */
  protected getFromCache<K>(key: string): K | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if expired
    if (entry.expiresAt < new Date()) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as K;
  }

  /**
   * Set item in cache
   */
  protected setCache<K>(key: string, data: K): void {
    // Check cache size limit
    if (this.cache.size >= this.cacheConfig.maxSize) {
      // Remove oldest entries
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp.getTime() - b[1].timestamp.getTime());
      
      // Remove oldest 25%
      const toRemove = Math.floor(this.cacheConfig.maxSize * 0.25);
      for (let i = 0; i < toRemove; i++) {
        this.cache.delete(entries[i][0]);
      }
    }
    
    const entry: CacheEntry<K> = {
      data,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + this.cacheConfig.ttl)
    };
    
    this.cache.set(key, entry);
  }

  /**
   * Invalidate specific cache entry
   */
  protected invalidateCache(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate cache entries matching pattern
   */
  protected invalidateCachePattern(pattern: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => 
      key.includes(pattern)
    );
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear all cache
   */
  protected clearCache(): void {
    this.cache.clear();
  }

  // =============================================
  // ERROR HANDLING & RETRY LOGIC
  // =============================================

  /**
   * Execute operation with retry logic
   */
  protected async executeWithRetry<K>(operation: () => Promise<K>): Promise<K> {
    if (!this.retryConfig.enabled) {
      return await operation();
    }

    let lastError: Error;
    let delay = this.retryConfig.baseDelay;

    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry certain types of errors
        if (this.isNonRetryableError(error)) {
          throw error;
        }
        
        // If this was the last attempt, throw the error
        if (attempt === this.retryConfig.maxAttempts) {
          throw error;
        }
        
        // Wait before retrying
        await this.sleep(delay);
        
        // Exponential backoff
        delay = Math.min(
          delay * this.retryConfig.backoffFactor,
          this.retryConfig.maxDelay
        );
      }
    }

    throw lastError!;
  }

  /**
   * Check if error should not be retried
   */
  protected isNonRetryableError(error: any): boolean {
    if (error?.code) {
      // Firestore error codes that shouldn't be retried
      const nonRetryableCodes = [
        'permission-denied',
        'not-found',
        'already-exists',
        'failed-precondition',
        'out-of-range',
        'unauthenticated',
        'invalid-argument'
      ];
      
      return nonRetryableCodes.includes(error.code);
    }
    
    return false;
  }

  /**
   * Handle and format errors
   */
  protected handleError<K>(operation: string, error: any): ServiceResult<K> {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorCode = error?.code || 'unknown';
    
    console.error(`Error in ${this.collectionName}.${operation}:`, {
      code: errorCode,
      message: errorMessage,
      originalError: error
    });

    return {
      success: false,
      error: `${operation} failed: ${errorMessage}`,
      timestamp: new Date()
    };
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  /**
   * Get nested value from object
   */
  protected getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Sleep utility for retry delays
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Configure cache settings
   */
  protected configureCaching(config: Partial<CacheConfig>): void {
    this.cacheConfig = { ...this.cacheConfig, ...config };
  }

  /**
   * Configure retry settings
   */
  protected configureRetry(config: Partial<RetryConfig>): void {
    this.retryConfig = { ...this.retryConfig, ...config };
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; maxSize: number; hitRate?: number } {
    return {
      size: this.cache.size,
      maxSize: this.cacheConfig.maxSize
    };
  }

  /**
   * Health check for the service
   */
  async healthCheck(): Promise<ServiceResult<{ status: string; latency: number }>> {
    const startTime = Date.now();
    
    try {
      // Try to read from the collection
      const q = query(this.collectionRef, limit(1));
      await getDocs(q);
      
      const latency = Date.now() - startTime;
      
      return {
        success: true,
        data: {
          status: 'healthy',
          latency
        },
        timestamp: new Date()
      };
    } catch (error) {
      return this.handleError('healthCheck', error);
    }
  }
}

export type { ServiceResult, PaginatedResult, CacheConfig, RetryConfig }; 