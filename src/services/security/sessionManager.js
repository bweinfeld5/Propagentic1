/**
 * Session Management Service for PropAgentic
 * Handles secure token management, automatic logout, and session security
 */

import { 
  doc, 
  updateDoc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  collection,
  query,
  where,
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../firebase/config';
import { auditLogger } from './auditLogger';

class SessionManager {
  constructor() {
    this.sessionsCollection = collection(db, 'user_sessions');
    
    // Session configuration
    this.sessionConfig = {
      maxInactiveMinutes: 30, // Auto-logout after 30 minutes of inactivity
      maxSessionMinutes: 480, // Force logout after 8 hours regardless of activity
      extendThresholdMinutes: 5, // Extend session if activity within 5 minutes of expiry
      maxConcurrentSessions: 5, // Maximum concurrent sessions per user
      rememberMeDays: 30, // Remember me duration
      securityCheckInterval: 60000, // Check for suspicious activity every minute
      heartbeatInterval: 300000 // Send heartbeat every 5 minutes
    };
    
    // Current session data
    this.currentSession = null;
    this.sessionToken = null;
    this.activityTimer = null;
    this.heartbeatTimer = null;
    this.securityTimer = null;
    
    // Activity tracking
    this.lastActivity = Date.now();
    this.activityEvents = [
      'mousedown', 'mousemove', 'keypress', 'scroll', 
      'touchstart', 'click', 'focus', 'blur'
    ];
    
    // Security flags
    this.securityWarnings = new Set();
    this.suspiciousActivityDetected = false;
    
    // Initialize if in browser environment
    if (typeof window !== 'undefined') {
      this.initializeSessionTracking();
    }
  }

  /**
   * Initialize session tracking and security monitoring
   */
  initializeSessionTracking() {
    // Track user activity
    this.activityEvents.forEach(event => {
      document.addEventListener(event, this.updateActivity.bind(this), true);
    });
    
    // Handle page visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    
    // Handle beforeunload for cleanup
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    
    // Start security monitoring
    this.startSecurityMonitoring();
    
    // Check for existing session on load
    this.checkExistingSession();
  }

  /**
   * Create a new session for a user
   */
  async createSession(userId, userEmail, options = {}) {
    try {
      const now = new Date();
      const deviceInfo = this.getDeviceInfo();
      const sessionId = this.generateSessionId();
      
      // Calculate session expiry
      const inactivityExpiry = new Date(now.getTime() + (this.sessionConfig.maxInactiveMinutes * 60 * 1000));
      const absoluteExpiry = new Date(now.getTime() + (this.sessionConfig.maxSessionMinutes * 60 * 1000));
      
      // If "remember me" is enabled, extend expiry
      if (options.rememberMe) {
        const rememberMeExpiry = new Date(now.getTime() + (this.sessionConfig.rememberMeDays * 24 * 60 * 60 * 1000));
        inactivityExpiry.setTime(rememberMeExpiry.getTime());
        absoluteExpiry.setTime(rememberMeExpiry.getTime());
      }
      
      // Check concurrent session limits
      await this.enforceSessionLimits(userId);
      
      // Create session document
      const sessionData = {
        sessionId,
        userId,
        userEmail,
        deviceInfo,
        ipAddress: options.ipAddress || 'unknown',
        userAgent: navigator.userAgent,
        createdAt: now,
        lastActivity: now,
        inactivityExpiry,
        absoluteExpiry,
        isActive: true,
        rememberMe: options.rememberMe || false,
        twoFactorVerified: options.twoFactorVerified || false,
        securityFlags: [],
        location: options.location || null
      };
      
      // Store in Firestore
      const sessionRef = doc(this.sessionsCollection, sessionId);
      await setDoc(sessionRef, {
        ...sessionData,
        createdAt: serverTimestamp(),
        lastActivity: serverTimestamp(),
        inactivityExpiry: inactivityExpiry,
        absoluteExpiry: absoluteExpiry
      });
      
      // Store session info locally
      this.currentSession = sessionData;
      this.sessionToken = sessionId;
      
      // Store in localStorage for persistence
      this.storeSessionLocally(sessionData);
      
      // Start session monitoring
      this.startSessionMonitoring();
      
      // Log session creation
      await auditLogger.logAuth('login_success', userId, {
        sessionId,
        deviceInfo: deviceInfo.summary,
        ipAddress: options.ipAddress,
        rememberMe: options.rememberMe,
        twoFactorUsed: options.twoFactorVerified
      });
      
      console.log('Session created successfully:', sessionId);
      return sessionData;
      
    } catch (error) {
      console.error('Error creating session:', error);
      await auditLogger.logAuth('session_creation_failed', userId, {
        error: error.message,
        deviceInfo: this.getDeviceInfo().summary
      });
      throw error;
    }
  }

  /**
   * Validate and refresh an existing session
   */
  async validateSession(sessionId, userId) {
    try {
      if (!sessionId || !userId) {
        return { valid: false, reason: 'Missing session credentials' };
      }
      
      // Get session from Firestore
      const sessionRef = doc(this.sessionsCollection, sessionId);
      const sessionDoc = await getDoc(sessionRef);
      
      if (!sessionDoc.exists()) {
        return { valid: false, reason: 'Session not found' };
      }
      
      const sessionData = sessionDoc.data();
      
      // Check if session belongs to user
      if (sessionData.userId !== userId) {
        await auditLogger.logSecurity('suspicious_activity', {
          sessionId,
          userId,
          reason: 'Session user mismatch',
          storedUserId: sessionData.userId
        });
        return { valid: false, reason: 'Session user mismatch' };
      }
      
      // Check if session is active
      if (!sessionData.isActive) {
        return { valid: false, reason: 'Session inactive' };
      }
      
      const now = new Date();
      
      // Check absolute expiry
      if (sessionData.absoluteExpiry?.toDate && now > sessionData.absoluteExpiry.toDate()) {
        await this.terminateSession(sessionId, 'expired');
        return { valid: false, reason: 'Session expired' };
      }
      
      // Check inactivity expiry
      if (sessionData.inactivityExpiry?.toDate && now > sessionData.inactivityExpiry.toDate()) {
        await this.terminateSession(sessionId, 'inactive');
        return { valid: false, reason: 'Session inactive timeout' };
      }
      
      // Validate device fingerprint for security
      const currentDevice = this.getDeviceInfo();
      if (!this.validateDeviceFingerprint(sessionData.deviceInfo, currentDevice)) {
        await auditLogger.logSecurity('suspicious_activity', {
          sessionId,
          userId,
          reason: 'Device fingerprint mismatch',
          originalDevice: sessionData.deviceInfo?.summary,
          currentDevice: currentDevice.summary
        });
        
        // Don't auto-terminate, but flag for review
        this.addSecurityWarning('device_fingerprint_changed');
      }
      
      // Session is valid - extend if needed
      const shouldExtend = this.shouldExtendSession(sessionData);
      if (shouldExtend) {
        await this.extendSession(sessionId);
      }
      
      // Update last activity
      await this.updateSessionActivity(sessionId);
      
      // Update local session data
      this.currentSession = {
        ...sessionData,
        lastActivity: now,
        inactivityExpiry: sessionData.inactivityExpiry?.toDate(),
        absoluteExpiry: sessionData.absoluteExpiry?.toDate()
      };
      
      return { 
        valid: true, 
        session: this.currentSession,
        warnings: Array.from(this.securityWarnings)
      };
      
    } catch (error) {
      console.error('Error validating session:', error);
      return { valid: false, reason: 'Validation error', error: error.message };
    }
  }

  /**
   * Extend session expiry times
   */
  async extendSession(sessionId) {
    try {
      const now = new Date();
      const newInactivityExpiry = new Date(now.getTime() + (this.sessionConfig.maxInactiveMinutes * 60 * 1000));
      
      const sessionRef = doc(this.sessionsCollection, sessionId);
      await updateDoc(sessionRef, {
        inactivityExpiry: newInactivityExpiry,
        lastExtended: serverTimestamp()
      });
      
      // Update local session
      if (this.currentSession) {
        this.currentSession.inactivityExpiry = newInactivityExpiry;
      }
      
      console.log('Session extended:', sessionId);
      
    } catch (error) {
      console.error('Error extending session:', error);
    }
  }

  /**
   * Update session activity timestamp
   */
  async updateSessionActivity(sessionId) {
    try {
      const sessionRef = doc(this.sessionsCollection, sessionId);
      await updateDoc(sessionRef, {
        lastActivity: serverTimestamp()
      });
      
      this.lastActivity = Date.now();
      
    } catch (error) {
      console.error('Error updating session activity:', error);
    }
  }

  /**
   * Terminate a session
   */
  async terminateSession(sessionId, reason = 'logout', options = {}) {
    try {
      if (!sessionId) {
        sessionId = this.sessionToken;
      }
      
      if (!sessionId) {
        console.warn('No session to terminate');
        return;
      }
      
      // Update session in Firestore
      const sessionRef = doc(this.sessionsCollection, sessionId);
      await updateDoc(sessionRef, {
        isActive: false,
        terminatedAt: serverTimestamp(),
        terminationReason: reason,
        terminatedBy: options.terminatedBy || 'user'
      });
      
      // Log session termination
      if (this.currentSession) {
        await auditLogger.logAuth('logout', this.currentSession.userId, {
          sessionId,
          reason,
          duration: Date.now() - this.currentSession.createdAt.getTime(),
          terminatedBy: options.terminatedBy
        });
      }
      
      // Clean up local data
      this.cleanupLocalSession();
      
      // Sign out from Firebase Auth if current session
      if (sessionId === this.sessionToken && !options.keepAuth) {
        await signOut(auth);
      }
      
      console.log('Session terminated:', sessionId, 'Reason:', reason);
      
    } catch (error) {
      console.error('Error terminating session:', error);
    }
  }

  /**
   * Terminate all sessions for a user
   */
  async terminateAllSessions(userId, except = null) {
    try {
      const q = query(
        this.sessionsCollection,
        where('userId', '==', userId),
        where('isActive', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      const terminationPromises = [];
      
      querySnapshot.docs.forEach(doc => {
        if (doc.id !== except) {
          terminationPromises.push(
            this.terminateSession(doc.id, 'admin_logout', { terminatedBy: 'admin' })
          );
        }
      });
      
      await Promise.all(terminationPromises);
      
      await auditLogger.logAuth('all_sessions_terminated', userId, {
        terminatedCount: querySnapshot.docs.length,
        exceptSession: except
      });
      
      console.log(`Terminated ${querySnapshot.docs.length} sessions for user:`, userId);
      
    } catch (error) {
      console.error('Error terminating all sessions:', error);
      throw error;
    }
  }

  /**
   * Get active sessions for a user
   */
  async getActiveSessions(userId) {
    try {
      const q = query(
        this.sessionsCollection,
        where('userId', '==', userId),
        where('isActive', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          sessionId: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          lastActivity: data.lastActivity?.toDate(),
          inactivityExpiry: data.inactivityExpiry?.toDate(),
          absoluteExpiry: data.absoluteExpiry?.toDate()
        };
      });
      
    } catch (error) {
      console.error('Error getting active sessions:', error);
      throw error;
    }
  }

  /**
   * Enforce concurrent session limits
   */
  async enforceSessionLimits(userId) {
    try {
      const activeSessions = await this.getActiveSessions(userId);
      
      if (activeSessions.length >= this.sessionConfig.maxConcurrentSessions) {
        // Terminate oldest sessions
        const sessionsToTerminate = activeSessions
          .sort((a, b) => a.lastActivity - b.lastActivity)
          .slice(0, activeSessions.length - this.sessionConfig.maxConcurrentSessions + 1);
        
        for (const session of sessionsToTerminate) {
          await this.terminateSession(session.sessionId, 'session_limit_exceeded');
        }
        
        await auditLogger.logAuth('session_limit_enforced', userId, {
          terminatedSessions: sessionsToTerminate.length,
          maxAllowed: this.sessionConfig.maxConcurrentSessions
        });
      }
      
    } catch (error) {
      console.error('Error enforcing session limits:', error);
    }
  }

  /**
   * Start session monitoring (heartbeat, inactivity, security)
   */
  startSessionMonitoring() {
    // Clear existing timers
    this.stopSessionMonitoring();
    
    // Start heartbeat
    this.heartbeatTimer = setInterval(() => {
      if (this.sessionToken && this.currentSession) {
        this.sendHeartbeat();
      }
    }, this.sessionConfig.heartbeatInterval);
    
    // Start inactivity check
    this.activityTimer = setInterval(() => {
      this.checkInactivity();
    }, 60000); // Check every minute
    
    console.log('Session monitoring started');
  }

  /**
   * Stop session monitoring
   */
  stopSessionMonitoring() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    
    if (this.activityTimer) {
      clearInterval(this.activityTimer);
      this.activityTimer = null;
    }
    
    if (this.securityTimer) {
      clearInterval(this.securityTimer);
      this.securityTimer = null;
    }
    
    console.log('Session monitoring stopped');
  }

  /**
   * Send heartbeat to server
   */
  async sendHeartbeat() {
    if (!this.sessionToken || !this.currentSession) return;
    
    try {
      await this.updateSessionActivity(this.sessionToken);
    } catch (error) {
      console.error('Heartbeat failed:', error);
      
      // If heartbeat fails multiple times, session might be invalid
      if (error.code === 'not-found') {
        await this.handleInvalidSession();
      }
    }
  }

  /**
   * Check for inactivity and auto-logout
   */
  checkInactivity() {
    if (!this.currentSession) return;
    
    const now = Date.now();
    const timeSinceActivity = now - this.lastActivity;
    const inactivityLimit = this.sessionConfig.maxInactiveMinutes * 60 * 1000;
    
    if (timeSinceActivity >= inactivityLimit) {
      console.log('Session inactive, auto-logout triggered');
      this.terminateSession(this.sessionToken, 'inactivity_timeout');
      this.triggerLogout('Session expired due to inactivity');
    } else if (timeSinceActivity >= (inactivityLimit - 5 * 60 * 1000)) {
      // Warn user 5 minutes before timeout
      this.showInactivityWarning(Math.ceil((inactivityLimit - timeSinceActivity) / 60000));
    }
  }

  /**
   * Update activity timestamp
   */
  updateActivity() {
    this.lastActivity = Date.now();
    
    // Debounce session activity updates
    if (this.activityUpdateTimeout) {
      clearTimeout(this.activityUpdateTimeout);
    }
    
    this.activityUpdateTimeout = setTimeout(() => {
      if (this.sessionToken) {
        this.updateSessionActivity(this.sessionToken);
      }
    }, 10000); // Update every 10 seconds max
  }

  /**
   * Handle page visibility changes
   */
  handleVisibilityChange() {
    if (document.hidden) {
      // Page is hidden, reduce heartbeat frequency
      if (this.heartbeatTimer) {
        clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = setInterval(() => {
          if (this.sessionToken && this.currentSession) {
            this.sendHeartbeat();
          }
        }, this.sessionConfig.heartbeatInterval * 2); // Half frequency when hidden
      }
    } else {
      // Page is visible, restore normal heartbeat
      this.updateActivity();
      this.startSessionMonitoring();
    }
  }

  /**
   * Handle before page unload
   */
  handleBeforeUnload() {
    // Cleanup timers
    this.stopSessionMonitoring();
    
    // Store session state
    if (this.currentSession) {
      this.storeSessionLocally(this.currentSession);
    }
  }

  /**
   * Get device information for fingerprinting
   */
  getDeviceInfo() {
    if (typeof window === 'undefined') {
      return { summary: 'server', platform: 'server' };
    }
    
    const info = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screenResolution: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      touchSupport: 'ontouchstart' in window,
      webglSupport: this.checkWebGLSupport()
    };
    
    // Create a summary for easier comparison
    info.summary = `${info.platform}_${info.screenResolution}_${info.timezone}_${info.language}`;
    
    return info;
  }

  /**
   * Check WebGL support for device fingerprinting
   */
  checkWebGLSupport() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!gl;
    } catch (e) {
      return false;
    }
  }

  /**
   * Validate device fingerprint
   */
  validateDeviceFingerprint(original, current) {
    if (!original || !current) return true; // Skip validation if data missing
    
    // Check critical fields that shouldn't change
    const criticalFields = ['platform', 'screenResolution', 'timezone'];
    
    for (const field of criticalFields) {
      if (original[field] !== current[field]) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Generate secure session ID
   */
  generateSessionId() {
    // Use crypto.getRandomValues if available, fallback to Math.random
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    } else {
      // Fallback for environments without crypto
      return 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
    }
  }

  /**
   * Store session data locally
   */
  storeSessionLocally(sessionData) {
    try {
      const sessionInfo = {
        sessionId: sessionData.sessionId,
        userId: sessionData.userId,
        expiresAt: sessionData.inactivityExpiry,
        rememberMe: sessionData.rememberMe
      };
      
      localStorage.setItem('session_info', JSON.stringify(sessionInfo));
    } catch (error) {
      console.error('Error storing session locally:', error);
    }
  }

  /**
   * Get locally stored session
   */
  getLocalSession() {
    try {
      const sessionInfo = localStorage.getItem('session_info');
      return sessionInfo ? JSON.parse(sessionInfo) : null;
    } catch (error) {
      console.error('Error getting local session:', error);
      return null;
    }
  }

  /**
   * Clean up local session data
   */
  cleanupLocalSession() {
    this.currentSession = null;
    this.sessionToken = null;
    this.securityWarnings.clear();
    this.stopSessionMonitoring();
    
    try {
      localStorage.removeItem('session_info');
    } catch (error) {
      console.error('Error cleaning local session:', error);
    }
  }

  /**
   * Check for existing session on app start
   */
  async checkExistingSession() {
    const localSession = this.getLocalSession();
    
    if (localSession && localSession.sessionId) {
      const validation = await this.validateSession(localSession.sessionId, localSession.userId);
      
      if (validation.valid) {
        this.sessionToken = localSession.sessionId;
        this.startSessionMonitoring();
        console.log('Restored existing session:', localSession.sessionId);
      } else {
        this.cleanupLocalSession();
        console.log('Existing session invalid:', validation.reason);
      }
    }
  }

  /**
   * Determine if session should be extended
   */
  shouldExtendSession(sessionData) {
    if (!sessionData.inactivityExpiry) return false;
    
    const now = new Date();
    const expiryTime = sessionData.inactivityExpiry.toDate ? sessionData.inactivityExpiry.toDate() : sessionData.inactivityExpiry;
    const timeUntilExpiry = expiryTime.getTime() - now.getTime();
    const extendThreshold = this.sessionConfig.extendThresholdMinutes * 60 * 1000;
    
    return timeUntilExpiry <= extendThreshold && timeUntilExpiry > 0;
  }

  /**
   * Start security monitoring
   */
  startSecurityMonitoring() {
    this.securityTimer = setInterval(() => {
      this.performSecurityChecks();
    }, this.sessionConfig.securityCheckInterval);
  }

  /**
   * Perform security checks
   */
  performSecurityChecks() {
    // Check for multiple tabs/windows
    if (this.detectMultipleTabs()) {
      this.addSecurityWarning('multiple_tabs_detected');
    }
    
    // Check for unusual activity patterns
    if (this.detectUnusualActivity()) {
      this.addSecurityWarning('unusual_activity_pattern');
    }
  }

  /**
   * Detect multiple tabs/windows
   */
  detectMultipleTabs() {
    try {
      // Use localStorage to detect multiple tabs
      const tabId = sessionStorage.getItem('tab_id') || this.generateSessionId();
      sessionStorage.setItem('tab_id', tabId);
      
      const allTabs = JSON.parse(localStorage.getItem('active_tabs') || '[]');
      const now = Date.now();
      
      // Clean old tabs (older than 30 seconds)
      const activeTabs = allTabs.filter(tab => now - tab.lastSeen < 30000);
      
      // Add current tab
      const existingTab = activeTabs.find(tab => tab.id === tabId);
      if (existingTab) {
        existingTab.lastSeen = now;
      } else {
        activeTabs.push({ id: tabId, lastSeen: now });
      }
      
      localStorage.setItem('active_tabs', JSON.stringify(activeTabs));
      
      return activeTabs.length > 1;
    } catch (error) {
      return false;
    }
  }

  /**
   * Detect unusual activity patterns
   */
  detectUnusualActivity() {
    // This is a simplified implementation
    // In production, you might track mouse movements, typing patterns, etc.
    return false;
  }

  /**
   * Add security warning
   */
  addSecurityWarning(warning) {
    this.securityWarnings.add(warning);
    console.warn('Security warning:', warning);
  }

  /**
   * Handle invalid session
   */
  async handleInvalidSession() {
    console.warn('Invalid session detected, logging out');
    await this.terminateSession(this.sessionToken, 'invalid_session');
    this.triggerLogout('Your session is no longer valid. Please log in again.');
  }

  /**
   * Show inactivity warning to user
   */
  showInactivityWarning(minutesRemaining) {
    // Dispatch custom event for UI to handle
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sessionInactivityWarning', {
        detail: { minutesRemaining }
      }));
    }
  }

  /**
   * Trigger logout
   */
  triggerLogout(reason) {
    // Dispatch custom event for UI to handle
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sessionLogout', {
        detail: { reason }
      }));
    }
  }

  /**
   * Get session statistics
   */
  getSessionStats() {
    if (!this.currentSession) {
      return null;
    }
    
    const now = Date.now();
    const sessionDuration = now - this.currentSession.createdAt.getTime();
    const timeSinceActivity = now - this.lastActivity;
    
    return {
      sessionId: this.sessionToken,
      duration: sessionDuration,
      timeSinceActivity,
      warnings: Array.from(this.securityWarnings),
      expiresAt: this.currentSession.inactivityExpiry,
      absoluteExpiresAt: this.currentSession.absoluteExpiry
    };
  }
}

// Create and export singleton instance
export const sessionManager = new SessionManager();
export default sessionManager; 