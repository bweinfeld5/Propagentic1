import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  getDocs, 
  onSnapshot,
  getCountFromServer,
  enableNetwork,
  disableNetwork
} from 'firebase/firestore';
import { db } from '../firebase/config';
import cacheService from '../services/cacheService';

/**
 * Enhanced Firestore hook with caching and optimization
 */
export const useOptimizedFirestore = (
  collectionName,
  queryOptions = {},
  options = {}
) => {
  const {
    cacheKey,
    enableCache = true,
    enableRealtime = false,
    pageSize = 25,
    enablePagination = false,
    dependencies = []
  } = options;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [queryStats, setQueryStats] = useState({
    queryTime: 0,
    cacheHits: 0,
    documentsRead: 0
  });

  const unsubscribeRef = useRef(null);
  const queryRef = useRef(null);

  /**
   * Build Firestore query from options
   */
  const buildQuery = useCallback((startAfterDoc = null) => {
    let q = collection(db, collectionName);

    // Apply where clauses
    if (queryOptions.where) {
      queryOptions.where.forEach(([field, operator, value]) => {
        q = query(q, where(field, operator, value));
      });
    }

    // Apply ordering
    if (queryOptions.orderBy) {
      queryOptions.orderBy.forEach(([field, direction = 'asc']) => {
        q = query(q, orderBy(field, direction));
      });
    }

    // Apply pagination
    if (enablePagination) {
      if (startAfterDoc) {
        q = query(q, startAfter(startAfterDoc));
      }
      q = query(q, limit(pageSize));
    } else if (queryOptions.limit) {
      q = query(q, limit(queryOptions.limit));
    }

    return q;
  }, [collectionName, queryOptions, enablePagination, pageSize]);

  /**
   * Generate cache key for the query
   */
  const generateCacheKey = useCallback(() => {
    if (cacheKey) return cacheKey;
    
    return `${collectionName}_${JSON.stringify({
      where: queryOptions.where,
      orderBy: queryOptions.orderBy,
      limit: queryOptions.limit || pageSize
    })}`;
  }, [collectionName, queryOptions, cacheKey, pageSize]);

  /**
   * Execute query with performance monitoring
   */
  const executeQuery = useCallback(async (isLoadMore = false) => {
    const startTime = performance.now();
    const cacheKeyStr = generateCacheKey();

    try {
      // Try cache first if enabled
      if (enableCache && !isLoadMore) {
        const cachedData = await cacheService.get('firestore-query', { key: cacheKeyStr });
        if (cachedData) {
          setData(cachedData.documents);
          setTotalCount(cachedData.totalCount || cachedData.documents.length);
          setHasMore(cachedData.hasMore !== undefined ? cachedData.hasMore : true);
          setLoading(false);
          
          setQueryStats(prev => ({
            ...prev,
            cacheHits: prev.cacheHits + 1,
            queryTime: performance.now() - startTime
          }));
          
          console.log(`[Firestore] Cache hit for ${collectionName}`);
          return;
        }
      }

      // Build and execute query
      const queryToExecute = buildQuery(isLoadMore ? lastDoc : null);
      queryRef.current = queryToExecute;

      const snapshot = await getDocs(queryToExecute);
      const documents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Get total count if not paginating or is first page
      let totalCountResult = totalCount;
      if (!enablePagination || !isLoadMore) {
        try {
          const countQuery = buildQuery();
          const countSnapshot = await getCountFromServer(countQuery);
          totalCountResult = countSnapshot.data().count;
          setTotalCount(totalCountResult);
        } catch (countError) {
          console.warn('[Firestore] Could not get count:', countError);
        }
      }

      // Update state
      if (isLoadMore) {
        setData(prev => [...prev, ...documents]);
      } else {
        setData(documents);
      }

      // Update pagination state
      if (enablePagination) {
        setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
        setHasMore(documents.length === pageSize);
      }

      // Cache the results
      if (enableCache && !isLoadMore) {
        await cacheService.set('firestore-query', { key: cacheKeyStr }, {
          documents,
          totalCount: totalCountResult,
          hasMore: documents.length === pageSize,
          timestamp: Date.now()
        });
      }

      // Update query stats
      setQueryStats(prev => ({
        ...prev,
        queryTime: performance.now() - startTime,
        documentsRead: prev.documentsRead + documents.length
      }));

      console.log(`[Firestore] Query executed for ${collectionName} in ${(performance.now() - startTime).toFixed(2)}ms`);

    } catch (err) {
      console.error(`[Firestore] Query error for ${collectionName}:`, err);
      setError(err);
      
      // Track error in analytics
      if (window.gtag) {
        window.gtag('event', 'firestore_query_error', {
          collection: collectionName,
          error_message: err.message
        });
      }
    } finally {
      setLoading(false);
    }
  }, [
    buildQuery, 
    generateCacheKey, 
    enableCache, 
    collectionName, 
    lastDoc, 
    enablePagination, 
    pageSize,
    totalCount
  ]);

  /**
   * Setup realtime listener
   */
  const setupRealtimeListener = useCallback(() => {
    if (!enableRealtime) return;

    const queryToListen = buildQuery();
    
    const unsubscribe = onSnapshot(
      queryToListen,
      (snapshot) => {
        const documents = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setData(documents);
        setLoading(false);

        // Invalidate cache on realtime updates
        if (enableCache) {
          const cacheKeyStr = generateCacheKey();
          cacheService.invalidate('firestore-query', { key: cacheKeyStr });
        }

        console.log(`[Firestore] Realtime update for ${collectionName}`);
      },
      (err) => {
        console.error(`[Firestore] Realtime error for ${collectionName}:`, err);
        setError(err);
      }
    );

    unsubscribeRef.current = unsubscribe;
    return unsubscribe;
  }, [buildQuery, enableRealtime, collectionName, enableCache, generateCacheKey]);

  /**
   * Load more data for pagination
   */
  const loadMore = useCallback(async () => {
    if (!enablePagination || !hasMore || loading) return;
    
    setLoading(true);
    await executeQuery(true);
  }, [enablePagination, hasMore, loading, executeQuery]);

  /**
   * Refresh data and clear cache
   */
  const refresh = useCallback(async () => {
    if (enableCache) {
      const cacheKeyStr = generateCacheKey();
      cacheService.invalidate('firestore-query', { key: cacheKeyStr });
    }
    
    setLastDoc(null);
    setHasMore(true);
    setLoading(true);
    await executeQuery(false);
  }, [enableCache, generateCacheKey, executeQuery]);

  /**
   * Add item optimistically to cache and state
   */
  const addOptimisticItem = useCallback((item) => {
    setData(prev => [item, ...prev]);
    
    // Update cache
    if (enableCache) {
      const cacheKeyStr = generateCacheKey();
      cacheService.invalidate('firestore-query', { key: cacheKeyStr });
    }
  }, [enableCache, generateCacheKey]);

  /**
   * Update item optimistically in cache and state
   */
  const updateOptimisticItem = useCallback((id, updates) => {
    setData(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
    
    // Update cache
    if (enableCache) {
      const cacheKeyStr = generateCacheKey();
      cacheService.invalidate('firestore-query', { key: cacheKeyStr });
    }
  }, [enableCache, generateCacheKey]);

  /**
   * Remove item optimistically from cache and state
   */
  const removeOptimisticItem = useCallback((id) => {
    setData(prev => prev.filter(item => item.id !== id));
    
    // Update cache
    if (enableCache) {
      const cacheKeyStr = generateCacheKey();
      cacheService.invalidate('firestore-query', { key: cacheKeyStr });
    }
  }, [enableCache, generateCacheKey]);

  // Initialize query
  useEffect(() => {
    if (enableRealtime) {
      setupRealtimeListener();
    } else {
      executeQuery(false);
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [executeQuery, setupRealtimeListener, enableRealtime, ...dependencies]);

  return {
    data,
    loading,
    error,
    hasMore,
    totalCount,
    queryStats,
    
    // Actions
    loadMore,
    refresh,
    addOptimisticItem,
    updateOptimisticItem,
    removeOptimisticItem,
    
    // Utils
    isFirstPage: !lastDoc,
    isEmpty: !loading && data.length === 0
  };
};

/**
 * Hook for optimized document fetching with caching
 */
export const useOptimizedDocument = (collectionName, documentId, options = {}) => {
  const { enableCache = true, enableRealtime = false } = options;
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    if (!documentId) {
      setData(null);
      setLoading(false);
      return;
    }

    const fetchDocument = async () => {
      const startTime = performance.now();
      const cacheKey = `${collectionName}_${documentId}`;

      try {
        // Try cache first
        if (enableCache) {
          const cachedData = await cacheService.get('firestore-document', { key: cacheKey });
          if (cachedData) {
            setData(cachedData);
            setLoading(false);
            console.log(`[Firestore] Document cache hit for ${collectionName}/${documentId}`);
            return;
          }
        }

        // Fetch from Firestore
        const docRef = doc(db, collectionName, documentId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const documentData = { id: docSnap.id, ...docSnap.data() };
          setData(documentData);

          // Cache the result
          if (enableCache) {
            await cacheService.set('firestore-document', { key: cacheKey }, documentData);
          }
        } else {
          setData(null);
        }

        console.log(`[Firestore] Document fetched for ${collectionName}/${documentId} in ${(performance.now() - startTime).toFixed(2)}ms`);

      } catch (err) {
        console.error(`[Firestore] Document error for ${collectionName}/${documentId}:`, err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    const setupRealtimeListener = () => {
      const docRef = doc(db, collectionName, documentId);
      
      const unsubscribe = onSnapshot(
        docRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const documentData = { id: docSnap.id, ...docSnap.data() };
            setData(documentData);

            // Invalidate cache on updates
            if (enableCache) {
              const cacheKey = `${collectionName}_${documentId}`;
              cacheService.invalidate('firestore-document', { key: cacheKey });
            }
          } else {
            setData(null);
          }
          setLoading(false);
        },
        (err) => {
          console.error(`[Firestore] Document realtime error for ${collectionName}/${documentId}:`, err);
          setError(err);
        }
      );

      unsubscribeRef.current = unsubscribe;
    };

    if (enableRealtime) {
      setupRealtimeListener();
    } else {
      fetchDocument();
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [collectionName, documentId, enableCache, enableRealtime]);

  return { data, loading, error };
};

/**
 * Hook for connection status monitoring
 */
export const useFirestoreConnection = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [firestoreConnected, setFirestoreConnected] = useState(true);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      enableNetwork(db).catch(console.error);
    };

    const handleOffline = () => {
      setIsOnline(false);
      disableNetwork(db).catch(console.error);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, firestoreConnected };
}; 