/**
 * Rate Limiting Service for PropAgentic
 * Prevents API abuse, brute force attacks, and ensures fair usage
 */

class RateLimitService {
  constructor() {
    this.attempts = new Map(); // userId -> attempts data
    this.globalAttempts = new Map(); // IP -> attempts data
    this.blockedUsers = new Map(); // userId -> block expiry
    this.blockedIPs = new Map(); // IP -> block expiry
    
    // Rate limit configurations
    this.limits = {
      // Authentication limits
      login: { maxAttempts: 5, windowMs: 15 * 60 * 1000, blockDurationMs: 30 * 60 * 1000 }, // 5 attempts per 15min, block for 30min
      signup: { maxAttempts: 3, windowMs: 60 * 60 * 1000, blockDurationMs: 60 * 60 * 1000 }, // 3 attempts per hour, block for 1hr
      passwordReset: { maxAttempts: 3, windowMs: 60 * 60 * 1000, blockDurationMs: 60 * 60 * 1000 },
      
      // API operation limits
      propertyCreate: { maxAttempts: 10, windowMs: 60 * 60 * 1000, blockDurationMs: 10 * 60 * 1000 }, // 10 per hour
      propertyUpdate: { maxAttempts: 50, windowMs: 60 * 60 * 1000, blockDurationMs: 5 * 60 * 1000 }, // 50 per hour
      
      // Payment operations (more restrictive)
      paymentCreate: { maxAttempts: 5, windowMs: 60 * 60 * 1000, blockDurationMs: 60 * 60 * 1000 }, // 5 per hour
      escrowCreate: { maxAttempts: 3, windowMs: 60 * 60 * 1000, blockDurationMs: 60 * 60 * 1000 }, // 3 per hour
      
      // Communication limits
      messageCreate: { maxAttempts: 100, windowMs: 60 * 60 * 1000, blockDurationMs: 10 * 60 * 1000 }, // 100 per hour
      fileUpload: { maxAttempts: 20, windowMs: 60 * 60 * 1000, blockDurationMs: 30 * 60 * 1000 }, // 20 per hour
      
      // Global limits per IP
      globalAPI: { maxAttempts: 1000, windowMs: 60 * 60 * 1000, blockDurationMs: 60 * 60 * 1000 }, // 1000 per hour
      
      // Admin operations
      adminAction: { maxAttempts: 100, windowMs: 60 * 60 * 1000, blockDurationMs: 10 * 60 * 1000 }
    };
    
    // Cleanup expired entries every 10 minutes
    setInterval(() => this.cleanup(), 10 * 60 * 1000);
  }

  /**
   * Get client IP address from request or browser
   */
  getClientIP() {
    // In a browser environment, we'll use a combination of approaches
    if (typeof window !== 'undefined') {
      // Try to get IP from various headers if available (when behind proxy)
      return localStorage.getItem('clientIP') || 'browser-client';
    }
    return 'unknown';
  }

  /**
   * Check if a user or IP is currently blocked
   */
  isBlocked(identifier, type = 'user') {
    const blockedMap = type === 'user' ? this.blockedUsers : this.blockedIPs;
    const blockExpiry = blockedMap.get(identifier);
    
    if (blockExpiry && Date.now() < blockExpiry) {
      return {
        blocked: true,
        expiresAt: blockExpiry,
        remainingTime: Math.ceil((blockExpiry - Date.now()) / 1000)
      };
    }
    
    // Clean up expired blocks
    if (blockExpiry) {
      blockedMap.delete(identifier);
    }
    
    return { blocked: false };
  }

  /**
   * Record an attempt for rate limiting
   */
  recordAttempt(operation, identifier, type = 'user') {
    const now = Date.now();
    const limit = this.limits[operation];
    
    if (!limit) {
      console.warn(`No rate limit configured for operation: ${operation}`);
      return { allowed: true };
    }
    
    const attemptsMap = type === 'user' ? this.attempts : this.globalAttempts;
    const key = `${operation}:${identifier}`;
    
    // Get or create attempts data
    let attemptData = attemptsMap.get(key) || {
      count: 0,
      firstAttempt: now,
      lastAttempt: now
    };
    
    // Reset if window has expired
    if (now - attemptData.firstAttempt > limit.windowMs) {
      attemptData = {
        count: 0,
        firstAttempt: now,
        lastAttempt: now
      };
    }
    
    // Increment attempt count
    attemptData.count++;
    attemptData.lastAttempt = now;
    attemptsMap.set(key, attemptData);
    
    // Check if limit exceeded
    if (attemptData.count > limit.maxAttempts) {
      // Block the user/IP
      const blockedMap = type === 'user' ? this.blockedUsers : this.blockedIPs;
      const blockExpiry = now + limit.blockDurationMs;
      blockedMap.set(identifier, blockExpiry);
      
      console.warn(`Rate limit exceeded for ${operation} by ${type}:${identifier}. Blocked until ${new Date(blockExpiry)}`);
      
      return {
        allowed: false,
        blocked: true,
        expiresAt: blockExpiry,
        remainingTime: Math.ceil(limit.blockDurationMs / 1000),
        message: `Too many attempts. Please try again in ${Math.ceil(limit.blockDurationMs / 60000)} minutes.`
      };
    }
    
    return {
      allowed: true,
      remainingAttempts: limit.maxAttempts - attemptData.count,
      windowExpiresAt: attemptData.firstAttempt + limit.windowMs
    };
  }

  /**
   * Check rate limit before performing an operation
   */
  checkRateLimit(operation, userId = null, options = {}) {
    const ip = this.getClientIP();
    const identifier = userId || ip;
    const checkIP = options.checkIP !== false; // Default to true
    
    // Check if user is blocked
    if (userId) {
      const userBlocked = this.isBlocked(userId, 'user');
      if (userBlocked.blocked) {
        return {
          allowed: false,
          reason: 'user_blocked',
          ...userBlocked,
          message: `Account temporarily blocked. Try again in ${Math.ceil(userBlocked.remainingTime / 60)} minutes.`
        };
      }
    }
    
    // Check if IP is blocked
    if (checkIP) {
      const ipBlocked = this.isBlocked(ip, 'ip');
      if (ipBlocked.blocked) {
        return {
          allowed: false,
          reason: 'ip_blocked',
          ...ipBlocked,
          message: `IP address temporarily blocked. Try again in ${Math.ceil(ipBlocked.remainingTime / 60)} minutes.`
        };
      }
    }
    
    // Check user-specific rate limit
    let userResult = { allowed: true };
    if (userId) {
      userResult = this.recordAttempt(operation, userId, 'user');
      if (!userResult.allowed) {
        return { ...userResult, reason: 'user_rate_limit' };
      }
    }
    
    // Check global IP rate limit
    if (checkIP) {
      const globalResult = this.recordAttempt('globalAPI', ip, 'ip');
      if (!globalResult.allowed) {
        return { ...globalResult, reason: 'global_rate_limit' };
      }
    }
    
    return {
      allowed: true,
      userAttempts: userResult,
      message: 'Request allowed'
    };
  }

  /**
   * Record successful operation (can be used to reset certain counters)
   */
  recordSuccess(operation, identifier, type = 'user') {
    // For certain operations like login, we might want to reset the counter on success
    const successResetOperations = ['login', 'passwordReset'];
    
    if (successResetOperations.includes(operation)) {
      const attemptsMap = type === 'user' ? this.attempts : this.globalAttempts;
      const key = `${operation}:${identifier}`;
      attemptsMap.delete(key);
    }
  }

  /**
   * Manually block a user (for admin actions)
   */
  blockUser(userId, durationMs = 60 * 60 * 1000, reason = 'manual') {
    const blockExpiry = Date.now() + durationMs;
    this.blockedUsers.set(userId, blockExpiry);
    
    console.log(`User ${userId} manually blocked until ${new Date(blockExpiry)} for reason: ${reason}`);
    
    return {
      blocked: true,
      expiresAt: blockExpiry,
      reason
    };
  }

  /**
   * Manually unblock a user
   */
  unblockUser(userId) {
    const wasBlocked = this.blockedUsers.has(userId);
    this.blockedUsers.delete(userId);
    
    // Also clear their attempt history
    const userAttemptKeys = Array.from(this.attempts.keys()).filter(key => key.endsWith(`:${userId}`));
    userAttemptKeys.forEach(key => this.attempts.delete(key));
    
    console.log(`User ${userId} unblocked. Was previously blocked: ${wasBlocked}`);
    
    return { unblocked: true, wasBlocked };
  }

  /**
   * Get rate limit status for a user
   */
  getStatus(userId = null) {
    const ip = this.getClientIP();
    const identifier = userId || ip;
    
    const status = {
      userId,
      ip,
      blocked: {
        user: userId ? this.isBlocked(userId, 'user') : null,
        ip: this.isBlocked(ip, 'ip')
      },
      attempts: {}
    };
    
    // Get attempt counts for various operations
    Object.keys(this.limits).forEach(operation => {
      const userKey = `${operation}:${userId}`;
      const ipKey = `${operation}:${ip}`;
      
      status.attempts[operation] = {
        user: userId ? this.attempts.get(userKey) : null,
        ip: this.globalAttempts.get(ipKey)
      };
    });
    
    return status;
  }

  /**
   * Cleanup expired entries
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;
    
    // Clean up expired blocks
    for (const [key, expiry] of this.blockedUsers.entries()) {
      if (now >= expiry) {
        this.blockedUsers.delete(key);
        cleaned++;
      }
    }
    
    for (const [key, expiry] of this.blockedIPs.entries()) {
      if (now >= expiry) {
        this.blockedIPs.delete(key);
        cleaned++;
      }
    }
    
    // Clean up expired attempts
    for (const [key, data] of this.attempts.entries()) {
      const operation = key.split(':')[0];
      const limit = this.limits[operation];
      if (limit && now - data.firstAttempt > limit.windowMs) {
        this.attempts.delete(key);
        cleaned++;
      }
    }
    
    for (const [key, data] of this.globalAttempts.entries()) {
      const operation = key.split(':')[0];
      const limit = this.limits[operation];
      if (limit && now - data.firstAttempt > limit.windowMs) {
        this.globalAttempts.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`Rate limit cleanup: removed ${cleaned} expired entries`);
    }
  }

  /**
   * Get rate limit statistics
   */
  getStats() {
    return {
      blockedUsers: this.blockedUsers.size,
      blockedIPs: this.blockedIPs.size,
      activeUserAttempts: this.attempts.size,
      activeIPAttempts: this.globalAttempts.size,
      limits: Object.keys(this.limits).length,
      lastCleanup: Date.now()
    };
  }
}

// Create and export singleton instance
export const rateLimitService = new RateLimitService();
export default rateLimitService; 