/**
 * Enhanced Caching Service for PropAgentic
 * Provides intelligent caching for Firestore queries and API responses
 */

class CacheService {
  constructor() {
    this.memoryCache = new Map();
    this.cacheStats = {
      hits: 0,
      misses: 0,
      sets: 0,
      invalidations: 0,
      totalResponseTime: 0,
      queries: 0
    };
    
    // Default cache configurations
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes
    this.maxMemorySize = 100; // Maximum number of items in memory
    
    // Cache type configurations
    this.cacheConfigs = {
      'user-profile': { ttl: 30 * 60 * 1000, storage: 'localStorage' }, // 30 minutes
      'properties': { ttl: 10 * 60 * 1000, storage: 'memory' }, // 10 minutes
      'escrow-accounts': { ttl: 2 * 60 * 1000, storage: 'memory' }, // 2 minutes
      'payment-methods': { ttl: 15 * 60 * 1000, storage: 'localStorage' }, // 15 minutes
      'analytics-data': { ttl: 60 * 60 * 1000, storage: 'memory' }, // 1 hour
      'job-listings': { ttl: 5 * 60 * 1000, storage: 'memory' }, // 5 minutes
      'notifications': { ttl: 1 * 60 * 1000, storage: 'memory' }, // 1 minute
    };
    
    this.initializeEventListeners();
  }

  /**
   * Initialize cache event listeners for cleanup and monitoring
   */
  initializeEventListeners() {
    // Clean up expired items periodically
    setInterval(() => this.cleanupExpired(), 60 * 1000); // Every minute
    
    // Log cache statistics periodically
    setInterval(() => this.logCacheStats(), 5 * 60 * 1000); // Every 5 minutes
    
    // Clear cache on storage events (multi-tab sync)
    window.addEventListener('storage', (e) => {
      if (e.key && e.key.startsWith('propAgentic_cache_')) {
        this.handleStorageChange(e);
      }
    });
  }

  /**
   * Generate cache key from query parameters
   */
  generateCacheKey(type, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((obj, key) => {
        obj[key] = params[key];
        return obj;
      }, {});
    
    return `${type}_${JSON.stringify(sortedParams)}`;
  }

  /**
   * Get data from cache with performance tracking
   */
  async get(type, params = {}) {
    const startTime = performance.now();
    const cacheKey = this.generateCacheKey(type, params);
    const config = this.cacheConfigs[type] || { ttl: this.defaultTTL, storage: 'memory' };
    
    try {
      let cachedData = null;
      
      // Try memory cache first
      if (this.memoryCache.has(cacheKey)) {
        cachedData = this.memoryCache.get(cacheKey);
      } else if (config.storage === 'localStorage') {
        // Try localStorage for persistent cache
        const stored = localStorage.getItem(`propAgentic_cache_${cacheKey}`);
        if (stored) {
          cachedData = JSON.parse(stored);
          // Also store in memory for faster access
          this.memoryCache.set(cacheKey, cachedData);
        }
      }
      
      if (cachedData && this.isValidCache(cachedData, config.ttl)) {
        this.cacheStats.hits++;
        this.trackResponseTime(startTime);
        
        console.log(`[Cache] HIT for ${type}:`, cacheKey);
        return cachedData.data;
      } else {
        // Remove expired cache
        if (cachedData) {
          this.invalidate(type, params);
        }
        
        this.cacheStats.misses++;
        console.log(`[Cache] MISS for ${type}:`, cacheKey);
        return null;
      }
    } catch (error) {
      console.error(`[Cache] Error getting ${type}:`, error);
      this.cacheStats.misses++;
      return null;
    }
  }

  /**
   * Set data in cache with intelligent storage strategy
   */
  async set(type, params = {}, data) {
    const cacheKey = this.generateCacheKey(type, params);
    const config = this.cacheConfigs[type] || { ttl: this.defaultTTL, storage: 'memory' };
    
    const cacheEntry = {
      data,
      timestamp: Date.now(),
      type,
      params,
      accessCount: 0,
      size: this.estimateSize(data)
    };
    
    try {
      // Always store in memory for fastest access
      this.memoryCache.set(cacheKey, cacheEntry);
      
      // Store in localStorage if configured
      if (config.storage === 'localStorage') {
        localStorage.setItem(`propAgentic_cache_${cacheKey}`, JSON.stringify(cacheEntry));
      }
      
      this.cacheStats.sets++;
      this.enforceMemoryLimit();
      
      console.log(`[Cache] SET for ${type}:`, cacheKey, `(${cacheEntry.size} bytes)`);
    } catch (error) {
      console.error(`[Cache] Error setting ${type}:`, error);
    }
  }

  /**
   * Check if cached data is still valid
   */
  isValidCache(cacheEntry, ttl) {
    if (!cacheEntry || !cacheEntry.timestamp) return false;
    return (Date.now() - cacheEntry.timestamp) < ttl;
  }

  /**
   * Invalidate specific cache entries
   */
  invalidate(type, params = {}) {
    const cacheKey = this.generateCacheKey(type, params);
    
    // Remove from memory cache
    this.memoryCache.delete(cacheKey);
    
    // Remove from localStorage
    localStorage.removeItem(`propAgentic_cache_${cacheKey}`);
    
    this.cacheStats.invalidations++;
    console.log(`[Cache] INVALIDATED ${type}:`, cacheKey);
  }

  /**
   * Invalidate all cache entries of a specific type
   */
  invalidateType(type) {
    // Memory cache
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.type === type) {
        this.memoryCache.delete(key);
        this.cacheStats.invalidations++;
      }
    }
    
    // localStorage
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`propAgentic_cache_${type}_`)) {
        localStorage.removeItem(key);
        this.cacheStats.invalidations++;
      }
    }
    
    console.log(`[Cache] INVALIDATED ALL for type: ${type}`);
  }

  /**
   * Clear all cache
   */
  clear() {
    this.memoryCache.clear();
    
    // Clear localStorage cache entries
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith('propAgentic_cache_')) {
        localStorage.removeItem(key);
      }
    }
    
    console.log('[Cache] CLEARED ALL');
  }

  /**
   * Cleanup expired cache entries
   */
  cleanupExpired() {
    let cleaned = 0;
    
    // Memory cache cleanup
    for (const [key, entry] of this.memoryCache.entries()) {
      const config = this.cacheConfigs[entry.type] || { ttl: this.defaultTTL };
      if (!this.isValidCache(entry, config.ttl)) {
        this.memoryCache.delete(key);
        cleaned++;
      }
    }
    
    // localStorage cleanup
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith('propAgentic_cache_')) {
        try {
          const entry = JSON.parse(localStorage.getItem(key));
          const config = this.cacheConfigs[entry.type] || { ttl: this.defaultTTL };
          if (!this.isValidCache(entry, config.ttl)) {
            localStorage.removeItem(key);
            cleaned++;
          }
        } catch (error) {
          // Remove invalid entries
          localStorage.removeItem(key);
          cleaned++;
        }
      }
    }
    
    if (cleaned > 0) {
      console.log(`[Cache] Cleaned up ${cleaned} expired entries`);
    }
  }

  /**
   * Enforce memory cache size limit
   */
  enforceMemoryLimit() {
    if (this.memoryCache.size <= this.maxMemorySize) return;
    
    // Sort by access count and age, remove least used/oldest
    const entries = Array.from(this.memoryCache.entries())
      .sort((a, b) => {
        const scoreA = a[1].accessCount / (Date.now() - a[1].timestamp);
        const scoreB = b[1].accessCount / (Date.now() - b[1].timestamp);
        return scoreA - scoreB;
      });
    
    // Remove oldest 20% of entries
    const toRemove = Math.ceil(this.memoryCache.size * 0.2);
    for (let i = 0; i < toRemove; i++) {
      this.memoryCache.delete(entries[i][0]);
    }
    
    console.log(`[Cache] Enforced memory limit, removed ${toRemove} entries`);
  }

  /**
   * Estimate data size in bytes
   */
  estimateSize(data) {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      return JSON.stringify(data).length * 2; // Rough estimate
    }
  }

  /**
   * Track response time for performance monitoring
   */
  trackResponseTime(startTime) {
    const responseTime = performance.now() - startTime;
    this.cacheStats.totalResponseTime += responseTime;
    this.cacheStats.queries++;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) * 100;
    const avgResponseTime = this.cacheStats.totalResponseTime / this.cacheStats.queries;
    
    return {
      ...this.cacheStats,
      hitRate: hitRate.toFixed(2),
      avgResponseTime: avgResponseTime.toFixed(2),
      memorySize: this.memoryCache.size,
      memoryLimit: this.maxMemorySize
    };
  }

  /**
   * Log cache statistics
   */
  logCacheStats() {
    const stats = this.getStats();
    console.log('[Cache] Statistics:', stats);
    
    // Send to analytics if available
    if (window.gtag) {
      window.gtag('event', 'cache_performance', {
        hit_rate: parseFloat(stats.hitRate),
        avg_response_time: parseFloat(stats.avgResponseTime),
        memory_usage: stats.memorySize
      });
    }
  }

  /**
   * Handle storage changes for multi-tab synchronization
   */
  handleStorageChange(event) {
    if (event.newValue === null) {
      // Item was removed, remove from memory cache too
      const cacheKey = event.key.replace('propAgentic_cache_', '');
      this.memoryCache.delete(cacheKey);
      console.log('[Cache] Synced removal from other tab:', cacheKey);
    }
  }

  /**
   * Preload cache with critical data
   */
  async preloadCriticalData(userId, userRole) {
    const preloadTasks = [];
    
    if (userRole === 'landlord') {
      preloadTasks.push(
        this.preloadUserData(userId),
        this.preloadProperties(userId),
        this.preloadEscrowAccounts(userId)
      );
    } else if (userRole === 'contractor') {
      preloadTasks.push(
        this.preloadUserData(userId),
        this.preloadJobListings(userId),
        this.preloadPaymentMethods(userId)
      );
    }
    
    try {
      await Promise.allSettled(preloadTasks);
      console.log('[Cache] Critical data preloaded');
    } catch (error) {
      console.error('[Cache] Error preloading data:', error);
    }
  }

  // Preload helper methods (to be implemented with actual service calls)
  async preloadUserData(userId) {
    // Implementation would call userService and cache results
  }

  async preloadProperties(userId) {
    // Implementation would call propertyService and cache results
  }

  async preloadEscrowAccounts(userId) {
    // Implementation would call escrowService and cache results
  }

  async preloadJobListings(userId) {
    // Implementation would call jobService and cache results
  }

  async preloadPaymentMethods(userId) {
    // Implementation would call paymentService and cache results
  }
}

// Create singleton instance
const cacheService = new CacheService();

export default cacheService; 