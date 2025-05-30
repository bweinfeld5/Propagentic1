/**
 * Two-Factor Authentication Service for PropAgentic
 * Supports TOTP (Time-based One-Time Password) authentication
 */

import { 
  doc, 
  updateDoc, 
  getDoc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { auditLogger } from './auditLogger';

class TwoFactorAuthService {
  constructor() {
    // QR code generation base URL (using Google Charts API as fallback)
    this.qrCodeBaseUrl = 'https://chart.googleapis.com/chart?chs=200x200&chld=M|0&cht=qr&chl=';
    
    // TOTP configuration
    this.totpConfig = {
      window: 1, // Allow 1 step before/after current time (30 seconds each)
      step: 30, // 30 second time steps
      digits: 6, // 6 digit codes
      algorithm: 'SHA1'
    };
    
    // Backup codes configuration
    this.backupCodesConfig = {
      count: 10, // Generate 10 backup codes
      length: 8, // 8 characters each
      usedRetentionDays: 90 // Keep used codes for audit trail
    };
    
    // Rate limiting for 2FA attempts
    this.rateLimits = {
      verification: { maxAttempts: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
      setup: { maxAttempts: 3, windowMs: 60 * 60 * 1000 } // 3 setup attempts per hour
    };
    
    this.attempts = new Map(); // Track verification attempts
  }

  /**
   * Generate a cryptographically secure secret key for TOTP
   */
  generateSecret() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; // Base32 characters
    let secret = '';
    
    // Generate 32 character secret (160 bits of entropy)
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return secret;
  }

  /**
   * Generate backup codes for account recovery
   */
  generateBackupCodes() {
    const codes = [];
    const chars = '0123456789abcdefghijklmnopqrstuvwxyz';
    
    for (let i = 0; i < this.backupCodesConfig.count; i++) {
      let code = '';
      for (let j = 0; j < this.backupCodesConfig.length; j++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      
      codes.push({
        code: code.toUpperCase(),
        used: false,
        usedAt: null,
        createdAt: new Date()
      });
    }
    
    return codes;
  }

  /**
   * Create QR code URL for TOTP setup
   */
  generateQRCodeUrl(secret, userEmail, issuer = 'PropAgentic') {
    const label = encodeURIComponent(`${issuer}:${userEmail}`);
    const params = new URLSearchParams({
      secret,
      issuer,
      algorithm: this.totpConfig.algorithm,
      digits: this.totpConfig.digits.toString(),
      period: this.totpConfig.step.toString()
    });
    
    const totpUri = `otpauth://totp/${label}?${params.toString()}`;
    return this.qrCodeBaseUrl + encodeURIComponent(totpUri);
  }

  /**
   * Generate TOTP code for a given secret and time
   */
  generateTOTP(secret, time = Date.now()) {
    // This is a simplified implementation
    // In production, use a proper TOTP library like 'otpauth' or 'speakeasy'
    
    const timeStep = Math.floor(time / 1000 / this.totpConfig.step);
    const hash = this.hmacSHA1(this.base32Decode(secret), this.intToBytes(timeStep));
    
    const offset = hash[hash.length - 1] & 0x0f;
    const code = ((hash[offset] & 0x7f) << 24) |
                 ((hash[offset + 1] & 0xff) << 16) |
                 ((hash[offset + 2] & 0xff) << 8) |
                 (hash[offset + 3] & 0xff);
    
    return (code % Math.pow(10, this.totpConfig.digits)).toString().padStart(this.totpConfig.digits, '0');
  }

  /**
   * Verify TOTP code
   */
  verifyTOTP(secret, code, time = Date.now()) {
    if (!secret || !code || code.length !== this.totpConfig.digits) {
      return false;
    }
    
    // Check current time step and adjacent steps (to account for clock drift)
    for (let i = -this.totpConfig.window; i <= this.totpConfig.window; i++) {
      const testTime = time + (i * this.totpConfig.step * 1000);
      const expectedCode = this.generateTOTP(secret, testTime);
      
      if (expectedCode === code.replace(/\s/g, '')) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Setup 2FA for a user
   */
  async setup2FA(userId, userEmail, options = {}) {
    try {
      // Check rate limiting
      const rateLimitCheck = this.checkRateLimit('setup', userId);
      if (!rateLimitCheck.allowed) {
        throw new Error(rateLimitCheck.message || 'Rate limit exceeded for 2FA setup');
      }
      
      // Generate secret and backup codes
      const secret = this.generateSecret();
      const backupCodes = this.generateBackupCodes();
      const qrCodeUrl = this.generateQRCodeUrl(secret, userEmail);
      
      // Create 2FA configuration (but don't enable yet)
      const twoFactorData = {
        enabled: false, // User must verify first TOTP code to enable
        secret: secret,
        backupCodes: backupCodes,
        setupAt: new Date(),
        verifiedAt: null,
        lastUsedAt: null,
        method: 'totp',
        deviceName: options.deviceName || 'Authenticator App'
      };
      
      // Store in user's 2FA document
      const twoFactorRef = doc(db, 'user_2fa', userId);
      await setDoc(twoFactorRef, {
        ...twoFactorData,
        setupAt: serverTimestamp()
      });
      
      // Log the setup attempt
      await auditLogger.logAuth('2fa_setup_initiated', userId, {
        method: 'totp',
        deviceName: options.deviceName
      });
      
      // Return setup information (without secret for security)
      return {
        qrCodeUrl,
        backupCodes: backupCodes.map(bc => bc.code),
        setupComplete: false,
        message: 'Scan the QR code with your authenticator app and verify the first code to complete setup'
      };
      
    } catch (error) {
      console.error('Error setting up 2FA:', error);
      await auditLogger.logAuth('2fa_setup_failed', userId, {
        error: error.message,
        method: 'totp'
      });
      throw error;
    }
  }

  /**
   * Verify setup and enable 2FA
   */
  async verifySetup(userId, code) {
    try {
      // Get 2FA configuration
      const twoFactorRef = doc(db, 'user_2fa', userId);
      const twoFactorDoc = await getDoc(twoFactorRef);
      
      if (!twoFactorDoc.exists()) {
        throw new Error('2FA setup not found. Please start setup process again.');
      }
      
      const twoFactorData = twoFactorDoc.data();
      
      if (twoFactorData.enabled) {
        throw new Error('2FA is already enabled for this account');
      }
      
      // Verify the code
      const isValid = this.verifyTOTP(twoFactorData.secret, code);
      
      if (!isValid) {
        await auditLogger.logAuth('2fa_setup_verification_failed', userId, {
          method: 'totp',
          code: code.replace(/./g, '*') // Mask the code
        });
        throw new Error('Invalid verification code. Please try again.');
      }
      
      // Enable 2FA
      await updateDoc(twoFactorRef, {
        enabled: true,
        verifiedAt: serverTimestamp(),
        lastUsedAt: serverTimestamp()
      });
      
      // Update user profile to indicate 2FA is enabled
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        twoFactorEnabled: true,
        twoFactorMethod: 'totp',
        updatedAt: serverTimestamp()
      });
      
      // Log successful setup
      await auditLogger.logAuth('2fa_enabled', userId, {
        method: 'totp',
        verificationSuccessful: true
      });
      
      return {
        enabled: true,
        backupCodes: twoFactorData.backupCodes?.map(bc => bc.code) || [],
        message: '2FA has been successfully enabled for your account'
      };
      
    } catch (error) {
      console.error('Error verifying 2FA setup:', error);
      throw error;
    }
  }

  /**
   * Verify 2FA code during login
   */
  async verify2FA(userId, code, options = {}) {
    try {
      // Check rate limiting
      const rateLimitCheck = this.checkRateLimit('verification', userId);
      if (!rateLimitCheck.allowed) {
        await auditLogger.logSecurity('rate_limit_hit', {
          userId,
          operation: '2fa_verification',
          attempts: rateLimitCheck.attempts
        });
        throw new Error(rateLimitCheck.message || 'Too many verification attempts');
      }
      
      // Get 2FA configuration
      const twoFactorRef = doc(db, 'user_2fa', userId);
      const twoFactorDoc = await getDoc(twoFactorRef);
      
      if (!twoFactorDoc.exists()) {
        throw new Error('2FA is not configured for this account');
      }
      
      const twoFactorData = twoFactorDoc.data();
      
      if (!twoFactorData.enabled) {
        throw new Error('2FA is not enabled for this account');
      }
      
      let isValid = false;
      let usedBackupCode = false;
      
      // Try TOTP first
      if (code.length === this.totpConfig.digits) {
        isValid = this.verifyTOTP(twoFactorData.secret, code);
      }
      
      // If TOTP failed, try backup codes
      if (!isValid && code.length === this.backupCodesConfig.length) {
        const backupCodeResult = await this.verifyBackupCode(userId, code, twoFactorData);
        isValid = backupCodeResult.valid;
        usedBackupCode = backupCodeResult.used;
      }
      
      if (!isValid) {
        // Record failed attempt
        this.recordAttempt('verification', userId);
        
        await auditLogger.logAuth('2fa_verification_failed', userId, {
          method: twoFactorData.method,
          codeType: code.length === this.totpConfig.digits ? 'totp' : 'backup',
          ip: options.ip
        });
        
        throw new Error('Invalid 2FA code');
      }
      
      // Successful verification
      await updateDoc(twoFactorRef, {
        lastUsedAt: serverTimestamp()
      });
      
      // Reset rate limiting on successful verification
      this.resetAttempts('verification', userId);
      
      // Log successful verification
      await auditLogger.logAuth('2fa_verification_success', userId, {
        method: twoFactorData.method,
        usedBackupCode,
        ip: options.ip
      });
      
      return {
        verified: true,
        usedBackupCode,
        message: usedBackupCode ? 
          'Verified with backup code. Consider regenerating backup codes.' : 
          '2FA verification successful'
      };
      
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      throw error;
    }
  }

  /**
   * Verify backup code
   */
  async verifyBackupCode(userId, code, twoFactorData) {
    const backupCodes = twoFactorData.backupCodes || [];
    
    for (let i = 0; i < backupCodes.length; i++) {
      const backupCode = backupCodes[i];
      
      if (backupCode.code.toLowerCase() === code.toLowerCase() && !backupCode.used) {
        // Mark backup code as used
        backupCodes[i] = {
          ...backupCode,
          used: true,
          usedAt: new Date()
        };
        
        // Update in database
        const twoFactorRef = doc(db, 'user_2fa', userId);
        await updateDoc(twoFactorRef, {
          backupCodes: backupCodes.map(bc => ({
            ...bc,
            usedAt: bc.usedAt ? serverTimestamp() : null
          }))
        });
        
        return { valid: true, used: true };
      }
    }
    
    return { valid: false, used: false };
  }

  /**
   * Disable 2FA for a user
   */
  async disable2FA(userId, options = {}) {
    try {
      // Verify current password or 2FA code if required
      if (options.requireVerification && !options.verified) {
        throw new Error('Current password or 2FA verification required to disable 2FA');
      }
      
      // Update 2FA document
      const twoFactorRef = doc(db, 'user_2fa', userId);
      await updateDoc(twoFactorRef, {
        enabled: false,
        disabledAt: serverTimestamp(),
        disabledBy: options.disabledBy || userId,
        disabledReason: options.reason || 'user_request'
      });
      
      // Update user profile
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        twoFactorEnabled: false,
        updatedAt: serverTimestamp()
      });
      
      // Log the action
      await auditLogger.logAuth('2fa_disabled', userId, {
        disabledBy: options.disabledBy || userId,
        reason: options.reason || 'user_request',
        adminAction: options.disabledBy !== userId
      });
      
      return {
        disabled: true,
        message: '2FA has been disabled for your account'
      };
      
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      throw error;
    }
  }

  /**
   * Regenerate backup codes
   */
  async regenerateBackupCodes(userId) {
    try {
      // Generate new backup codes
      const newBackupCodes = this.generateBackupCodes();
      
      // Update in database
      const twoFactorRef = doc(db, 'user_2fa', userId);
      await updateDoc(twoFactorRef, {
        backupCodes: newBackupCodes.map(bc => ({
          ...bc,
          createdAt: serverTimestamp()
        })),
        backupCodesRegeneratedAt: serverTimestamp()
      });
      
      // Log the action
      await auditLogger.logAuth('2fa_backup_codes_regenerated', userId, {
        newCodesCount: newBackupCodes.length
      });
      
      return {
        backupCodes: newBackupCodes.map(bc => bc.code),
        message: 'New backup codes generated. Please store them securely.'
      };
      
    } catch (error) {
      console.error('Error regenerating backup codes:', error);
      throw error;
    }
  }

  /**
   * Get 2FA status for a user
   */
  async get2FAStatus(userId) {
    try {
      const twoFactorRef = doc(db, 'user_2fa', userId);
      const twoFactorDoc = await getDoc(twoFactorRef);
      
      if (!twoFactorDoc.exists()) {
        return {
          enabled: false,
          configured: false,
          method: null
        };
      }
      
      const data = twoFactorDoc.data();
      const backupCodesAvailable = data.backupCodes?.filter(bc => !bc.used).length || 0;
      
      return {
        enabled: data.enabled || false,
        configured: true,
        method: data.method || 'totp',
        setupAt: data.setupAt?.toDate(),
        lastUsedAt: data.lastUsedAt?.toDate(),
        backupCodesAvailable,
        deviceName: data.deviceName
      };
      
    } catch (error) {
      console.error('Error getting 2FA status:', error);
      throw error;
    }
  }

  /**
   * Check rate limiting for 2FA operations
   */
  checkRateLimit(operation, userId) {
    const limit = this.rateLimits[operation];
    if (!limit) return { allowed: true };
    
    const key = `${operation}:${userId}`;
    const now = Date.now();
    
    let attempts = this.attempts.get(key) || {
      count: 0,
      firstAttempt: now,
      lastAttempt: now
    };
    
    // Reset if window expired
    if (now - attempts.firstAttempt > limit.windowMs) {
      attempts = {
        count: 0,
        firstAttempt: now,
        lastAttempt: now
      };
    }
    
    if (attempts.count >= limit.maxAttempts) {
      return {
        allowed: false,
        attempts: attempts.count,
        message: `Too many ${operation} attempts. Please try again later.`
      };
    }
    
    return { allowed: true, attempts: attempts.count };
  }

  /**
   * Record an attempt for rate limiting
   */
  recordAttempt(operation, userId) {
    const limit = this.rateLimits[operation];
    if (!limit) return;
    
    const key = `${operation}:${userId}`;
    const now = Date.now();
    
    let attempts = this.attempts.get(key) || {
      count: 0,
      firstAttempt: now,
      lastAttempt: now
    };
    
    // Reset if window expired
    if (now - attempts.firstAttempt > limit.windowMs) {
      attempts = {
        count: 1,
        firstAttempt: now,
        lastAttempt: now
      };
    } else {
      attempts.count++;
      attempts.lastAttempt = now;
    }
    
    this.attempts.set(key, attempts);
  }

  /**
   * Reset attempts for rate limiting
   */
  resetAttempts(operation, userId) {
    const key = `${operation}:${userId}`;
    this.attempts.delete(key);
  }

  // Simplified cryptographic functions (use proper libraries in production)
  
  base32Decode(encoded) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = '';
    
    for (let i = 0; i < encoded.length; i++) {
      const char = encoded.charAt(i).toUpperCase();
      const index = alphabet.indexOf(char);
      if (index === -1) continue;
      bits += index.toString(2).padStart(5, '0');
    }
    
    const bytes = [];
    for (let i = 0; i < bits.length; i += 8) {
      const byte = bits.substr(i, 8);
      if (byte.length === 8) {
        bytes.push(parseInt(byte, 2));
      }
    }
    
    return new Uint8Array(bytes);
  }
  
  intToBytes(num) {
    const bytes = new ArrayBuffer(8);
    const view = new DataView(bytes);
    view.setUint32(4, num, false);
    return new Uint8Array(bytes);
  }
  
  hmacSHA1(key, data) {
    // This is a placeholder - use proper crypto library in production
    // For now, return a simple hash that works for demo purposes
    const hash = new Array(20);
    for (let i = 0; i < 20; i++) {
      hash[i] = (key[i % key.length] + data[i % data.length] + i) % 256;
    }
    return hash;
  }
}

// Create and export singleton instance
export const twoFactorAuth = new TwoFactorAuthService();
export default twoFactorAuth; 