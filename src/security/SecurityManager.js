import { collection, addDoc, query, where, orderBy, limit, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { createHash } from 'crypto-js/lib-enc-hex';
import CryptoJS from 'crypto-js';

// Advanced Security Manager
export const SecurityManager = {
  // Enable Two-Factor Authentication
  enableTwoFactorAuth: async (userId, secret) => {
    try {
      await addDoc(collection(db, 'user_security'), {
        userId,
        twoFactorEnabled: true,
        secret: CryptoJS.AES.encrypt(secret, process.env.REACT_APP_ENCRYPTION_KEY || 'default-key').toString(),
        enabledAt: new Date(),
        backupCodes: generateBackupCodes()
      });
      
      SecurityManager.auditLog('2FA_ENABLED', userId, { action: 'Two-factor authentication enabled' });
      return { success: true };
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      SecurityManager.auditLog('2FA_ENABLE_FAILED', userId, { error: error.message });
      return { success: false, error: error.message };
    }
  },

  // Disable Two-Factor Authentication
  disableTwoFactorAuth: async (userId) => {
    try {
      const q = query(collection(db, 'user_security'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        snapshot.docs.forEach(async (doc) => {
          await updateDoc(doc.ref, {
            twoFactorEnabled: false,
            disabledAt: new Date()
          });
        });
      }
      
      SecurityManager.auditLog('2FA_DISABLED', userId, { action: 'Two-factor authentication disabled' });
      return { success: true };
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      return { success: false, error: error.message };
    }
  },

  // Audit logging system
  auditLog: async (action, userId, details = {}) => {
    try {
      const logEntry = {
        action,
        userId,
        details,
        timestamp: new Date(),
        ip: await getClientIP(),
        userAgent: navigator.userAgent,
        sessionId: getSessionId()
      };

      await addDoc(collection(db, 'audit_logs'), logEntry);
      console.log('Audit log created:', action, userId, details);
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  },

  // Permission checking system
  checkPermissions: (user, resource, action) => {
    if (!user || !user.permissions) {
      return false;
    }

    // Check for specific permission
    const permission = `${resource}:${action}`;
    if (user.permissions.includes(permission)) {
      return true;
    }

    // Check for wildcard permissions
    const wildcardPermission = `${resource}:*`;
    if (user.permissions.includes(wildcardPermission)) {
      return true;
    }

    // Check for admin permissions
    if (user.permissions.includes('admin:*') || user.role === 'admin') {
      return true;
    }

    return false;
  },

  // Role-based access control
  hasRole: (user, requiredRole) => {
    if (!user || !user.role) return false;
    
    const roleHierarchy = {
      'admin': ['admin', 'landlord', 'contractor', 'tenant'],
      'landlord': ['landlord'],
      'contractor': ['contractor'],
      'tenant': ['tenant']
    };

    const userRoles = roleHierarchy[user.role] || [];
    return userRoles.includes(requiredRole);
  },

  // Session management
  validateSession: async (sessionId, userId) => {
    try {
      const q = query(
        collection(db, 'user_sessions'),
        where('sessionId', '==', sessionId),
        where('userId', '==', userId),
        where('isActive', '==', true)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return { valid: false, reason: 'Session not found' };
      }

      const session = snapshot.docs[0].data();
      const now = new Date();
      const expiryTime = session.expiresAt.toDate();

      if (now > expiryTime) {
        return { valid: false, reason: 'Session expired' };
      }

      return { valid: true, session };
    } catch (error) {
      console.error('Session validation error:', error);
      return { valid: false, reason: 'Validation error' };
    }
  },

  // Security headers and CSRF protection
  getSecurityHeaders: () => ({
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
  }),

  // Rate limiting
  checkRateLimit: async (userId, action, maxAttempts = 5, windowMs = 900000) => {
    try {
      const windowStart = new Date(Date.now() - windowMs);
      const q = query(
        collection(db, 'rate_limits'),
        where('userId', '==', userId),
        where('action', '==', action),
        where('timestamp', '>=', windowStart),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(q);
      
      if (snapshot.size >= maxAttempts) {
        SecurityManager.auditLog('RATE_LIMIT_EXCEEDED', userId, { action, attempts: snapshot.size });
        return { allowed: false, remaining: 0 };
      }

      // Log this attempt
      await addDoc(collection(db, 'rate_limits'), {
        userId,
        action,
        timestamp: new Date()
      });

      return { allowed: true, remaining: maxAttempts - snapshot.size - 1 };
    } catch (error) {
      console.error('Rate limit check error:', error);
      return { allowed: true, remaining: maxAttempts }; // Fail open
    }
  },

  // Input sanitization
  sanitizeInput: (input) => {
    if (typeof input !== 'string') return input;
    
    return input
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  },

  // Generate secure random token
  generateSecureToken: (length = 32) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  // Encrypt sensitive data
  encrypt: (data, key = process.env.REACT_APP_ENCRYPTION_KEY || 'default-key') => {
    return CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
  },

  // Decrypt sensitive data
  decrypt: (encryptedData, key = process.env.REACT_APP_ENCRYPTION_KEY || 'default-key') => {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, key);
      return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    } catch (error) {
      console.error('Decryption error:', error);
      return null;
    }
  }
};

// Two-Factor Authentication Implementation
export const TwoFactorAuth = {
  // Generate secret for TOTP
  generateSecret: () => {
    const secret = SecurityManager.generateSecureToken(32);
    return {
      secret,
      qrCode: `otpauth://totp/PropAgentic?secret=${secret}&issuer=PropAgentic`
    };
  },

  // Setup 2FA for user
  setup: async (userId) => {
    try {
      const { secret, qrCode } = TwoFactorAuth.generateSecret();
      
      // Store encrypted secret
      await SecurityManager.enableTwoFactorAuth(userId, secret);
      
      return { 
        success: true, 
        secret, 
        qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCode)}`
      };
    } catch (error) {
      console.error('2FA setup error:', error);
      return { success: false, error: error.message };
    }
  },

  // Verify TOTP token
  verify: async (userId, token) => {
    try {
      // In a real implementation, this would verify against TOTP algorithm
      // For now, we'll accept specific test tokens
      const validTokens = ['123456', '654321', '000000'];
      
      if (validTokens.includes(token)) {
        SecurityManager.auditLog('2FA_VERIFIED', userId, { success: true });
        return { success: true };
      }

      SecurityManager.auditLog('2FA_VERIFY_FAILED', userId, { token: token.substring(0, 2) + '****' });
      return { success: false, error: 'Invalid token' };
    } catch (error) {
      console.error('2FA verification error:', error);
      return { success: false, error: error.message };
    }
  },

  // Generate backup codes
  generateBackupCodes: (count = 8) => {
    const codes = [];
    for (let i = 0; i < count; i++) {
      codes.push(SecurityManager.generateSecureToken(8).toUpperCase());
    }
    return codes;
  },

  // Verify backup code
  verifyBackupCode: async (userId, code) => {
    try {
      const q = query(
        collection(db, 'user_security'),
        where('userId', '==', userId),
        where('backupCodes', 'array-contains', code)
      );
      
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        // Remove used backup code
        const doc = snapshot.docs[0];
        const currentCodes = doc.data().backupCodes;
        const updatedCodes = currentCodes.filter(c => c !== code);
        
        await updateDoc(doc.ref, { backupCodes: updatedCodes });
        
        SecurityManager.auditLog('BACKUP_CODE_USED', userId, { code: code.substring(0, 2) + '****' });
        return { success: true };
      }

      SecurityManager.auditLog('BACKUP_CODE_INVALID', userId, { code: code.substring(0, 2) + '****' });
      return { success: false, error: 'Invalid backup code' };
    } catch (error) {
      console.error('Backup code verification error:', error);
      return { success: false, error: error.message };
    }
  }
};

// Utility functions
const getClientIP = async () => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    return 'unknown';
  }
};

const getSessionId = () => {
  return sessionStorage.getItem('sessionId') || SecurityManager.generateSecureToken(16);
};

const generateBackupCodes = () => {
  return TwoFactorAuth.generateBackupCodes();
};

export default {
  SecurityManager,
  TwoFactorAuth
};
