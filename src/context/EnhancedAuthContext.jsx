/**
 * Enhanced AuthContext with comprehensive security features
 * Integrates rate limiting, input sanitization, audit logging, 2FA, and session management
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  onAuthStateChanged,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { toast } from 'react-hot-toast';

// Import security services
import { rateLimitService } from '../services/security/rateLimitService';
import { inputSanitizer } from '../services/security/inputSanitizer';
import { auditLogger } from '../services/security/auditLogger';
import { twoFactorAuth } from '../services/security/twoFactorAuth';
import { sessionManager } from '../services/security/sessionManager';

const EnhancedAuthContext = createContext();

export function useEnhancedAuth() {
  const context = useContext(EnhancedAuthContext);
  if (!context) {
    throw new Error('useEnhancedAuth must be used within an EnhancedAuthProvider');
  }
  return context;
}

export function EnhancedAuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [pendingCredentials, setPendingCredentials] = useState(null);
  const [sessionWarnings, setSessionWarnings] = useState([]);
  const [securityStatus, setSecurityStatus] = useState({
    rateLimited: false,
    suspiciousActivity: false,
    sessionValid: true,
    twoFactorEnabled: false
  });

  // Security event handlers
  useEffect(() => {
    // Listen for session events
    const handleSessionWarning = (event) => {
      const { minutesRemaining } = event.detail;
      toast.warn(`Your session will expire in ${minutesRemaining} minutes due to inactivity`);
      setSessionWarnings(prev => [...prev, `Session expiring in ${minutesRemaining}min`]);
    };

    const handleSessionLogout = (event) => {
      const { reason } = event.detail;
      toast.error(`Logged out: ${reason}`);
      handleSecureLogout();
    };

    window.addEventListener('sessionInactivityWarning', handleSessionWarning);
    window.addEventListener('sessionLogout', handleSessionLogout);

    return () => {
      window.removeEventListener('sessionInactivityWarning', handleSessionWarning);
      window.removeEventListener('sessionLogout', handleSessionLogout);
    };
  }, []);

  // Monitor authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Validate session when Firebase auth changes
        await validateUserSession(user);
      } else {
        setCurrentUser(null);
        setTwoFactorRequired(false);
        setPendingCredentials(null);
        setSecurityStatus(prev => ({ ...prev, sessionValid: false }));
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  /**
   * Validate user session with enhanced security
   */
  const validateUserSession = async (user) => {
    try {
      // Check if user has valid session
      const localSession = sessionManager.getLocalSession();
      
      if (localSession && localSession.userId === user.uid) {
        const validation = await sessionManager.validateSession(localSession.sessionId, user.uid);
        
        if (validation.valid) {
          setCurrentUser(user);
          setSessionWarnings(validation.warnings || []);
          setSecurityStatus(prev => ({ 
            ...prev, 
            sessionValid: true,
            suspiciousActivity: validation.warnings.length > 0
          }));
          
          // Check 2FA status
          const twoFactorStatus = await twoFactorAuth.get2FAStatus(user.uid);
          setSecurityStatus(prev => ({ 
            ...prev, 
            twoFactorEnabled: twoFactorStatus.enabled 
          }));
        } else {
          await handleSecureLogout();
        }
      } else {
        // No valid session, user needs to re-authenticate
        await handleSecureLogout();
      }
    } catch (error) {
      console.error('Error validating session:', error);
      await auditLogger.logSecurity('session_validation_error', {
        userId: user.uid,
        error: error.message
      });
    }
  };

  /**
   * Enhanced secure login with rate limiting and audit logging
   */
  const login = async (email, password, options = {}) => {
    try {
      // Sanitize inputs
      const sanitizedEmail = inputSanitizer.sanitizeEmail(email);
      const sanitizedPassword = inputSanitizer.sanitizePassword(password);

      // Validate inputs
      const emailValidation = inputSanitizer.validateEmail(sanitizedEmail);
      const passwordValidation = inputSanitizer.validatePassword(sanitizedPassword);

      if (!emailValidation.isValid) {
        throw new Error(`Invalid email: ${emailValidation.errors.join(', ')}`);
      }

      if (!passwordValidation.isValid) {
        throw new Error(`Invalid password: ${passwordValidation.errors.join(', ')}`);
      }

      // Check rate limiting
      const rateLimitCheck = await rateLimitService.checkLimit('login', sanitizedEmail);
      if (!rateLimitCheck.allowed) {
        setSecurityStatus(prev => ({ ...prev, rateLimited: true }));
        await auditLogger.logSecurity('rate_limit_hit', {
          operation: 'login',
          email: sanitizedEmail,
          attempts: rateLimitCheck.attempts
        });
        throw new Error('Too many login attempts. Please try again later.');
      }

      // Attempt Firebase authentication
      const userCredential = await signInWithEmailAndPassword(auth, sanitizedEmail, sanitizedPassword);
      const user = userCredential.user;

      // Check if 2FA is required
      const twoFactorStatus = await twoFactorAuth.get2FAStatus(user.uid);
      
      if (twoFactorStatus.enabled) {
        // 2FA is enabled, don't complete login yet
        setTwoFactorRequired(true);
        setPendingCredentials({
          user,
          email: sanitizedEmail,
          timestamp: Date.now()
        });
        
        await auditLogger.logAuth('login_2fa_required', user.uid, {
          email: sanitizedEmail,
          ip: options.ip
        });

        return {
          success: false,
          requiresTwoFactor: true,
          message: 'Please enter your 2FA code to complete login'
        };
      }

      // Complete login process
      return await completeLoginProcess(user, sanitizedEmail, options);

    } catch (error) {
      console.error('Login error:', error);
      
      // Record failed attempt for rate limiting
      await rateLimitService.recordAttempt('login', email);
      
      // Log failed login attempt
      await auditLogger.logAuth('login_failure', null, {
        email: inputSanitizer.sanitizeEmail(email),
        error: error.message,
        ip: options.ip
      });

      // Check for specific error types
      if (error.code === 'auth/too-many-requests') {
        await auditLogger.logSecurity('suspicious_activity', {
          operation: 'login',
          email: inputSanitizer.sanitizeEmail(email),
          reason: 'too_many_requests'
        });
      }

      throw error;
    }
  };

  /**
   * Verify 2FA code and complete login
   */
  const verify2FA = async (code) => {
    try {
      if (!pendingCredentials) {
        throw new Error('No pending authentication found');
      }

      const { user } = pendingCredentials;

      // Verify 2FA code
      const verification = await twoFactorAuth.verify2FA(user.uid, code, {
        ip: getClientIP()
      });

      if (!verification.verified) {
        throw new Error('Invalid 2FA code');
      }

      // Complete login process
      const result = await completeLoginProcess(user, user.email, {
        twoFactorVerified: true
      });

      // Clear 2FA state
      setTwoFactorRequired(false);
      setPendingCredentials(null);

      return result;

    } catch (error) {
      console.error('2FA verification error:', error);
      
      await auditLogger.logAuth('2fa_verification_failed', 
        pendingCredentials?.user?.uid, {
        error: error.message,
        ip: getClientIP()
      });

      throw error;
    }
  };

  /**
   * Complete the login process with session creation
   */
  const completeLoginProcess = async (user, email, options = {}) => {
    try {
      // Create secure session
      const sessionData = await sessionManager.createSession(
        user.uid, 
        email, 
        {
          ipAddress: options.ip || getClientIP(),
          rememberMe: options.rememberMe || false,
          twoFactorVerified: options.twoFactorVerified || false,
          location: options.location || null
        }
      );

      // Set user state
      setCurrentUser(user);
      setSecurityStatus(prev => ({ 
        ...prev, 
        sessionValid: true,
        rateLimited: false
      }));

      // Reset rate limiting on successful login
      await rateLimitService.resetAttempts('login', email);

      return {
        success: true,
        user,
        session: sessionData,
        message: 'Login successful'
      };

    } catch (error) {
      console.error('Error completing login:', error);
      throw error;
    }
  };

  /**
   * Enhanced secure signup with comprehensive validation
   */
  const signup = async (userData) => {
    try {
      // Sanitize all inputs
      const sanitizedData = inputSanitizer.sanitizeObject(userData);

      // Validate email and password
      const emailValidation = inputSanitizer.validateEmail(sanitizedData.email);
      const passwordValidation = inputSanitizer.validatePassword(sanitizedData.password);

      if (!emailValidation.isValid) {
        throw new Error(`Invalid email: ${emailValidation.errors.join(', ')}`);
      }

      if (!passwordValidation.isValid) {
        throw new Error(`Invalid password: ${passwordValidation.errors.join(', ')}`);
      }

      // Check rate limiting for signup
      const rateLimitCheck = await rateLimitService.checkLimit('signup', sanitizedData.email);
      if (!rateLimitCheck.allowed) {
        await auditLogger.logSecurity('rate_limit_hit', {
          operation: 'signup',
          email: sanitizedData.email,
          attempts: rateLimitCheck.attempts
        });
        throw new Error('Too many signup attempts. Please try again later.');
      }

      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        sanitizedData.email, 
        sanitizedData.password
      );
      
      const user = userCredential.user;

      // Complete signup process with session creation
      const sessionData = await sessionManager.createSession(
        user.uid, 
        sanitizedData.email, 
        {
          ipAddress: getClientIP(),
          rememberMe: false,
          twoFactorVerified: false
        }
      );

      setCurrentUser(user);
      setSecurityStatus(prev => ({ ...prev, sessionValid: true }));

      // Log successful signup
      await auditLogger.logAuth('signup', user.uid, {
        email: sanitizedData.email,
        ip: getClientIP()
      });

      return {
        success: true,
        user,
        session: sessionData,
        message: 'Account created successfully'
      };

    } catch (error) {
      console.error('Signup error:', error);
      
      // Record failed attempt
      await rateLimitService.recordAttempt('signup', userData.email);
      
      // Log failed signup
      await auditLogger.logAuth('signup_failure', null, {
        email: inputSanitizer.sanitizeEmail(userData.email),
        error: error.message,
        ip: getClientIP()
      });

      throw error;
    }
  };

  /**
   * Secure logout with session cleanup
   */
  const logout = async () => {
    return await handleSecureLogout();
  };

  const handleSecureLogout = async () => {
    try {
      const userId = currentUser?.uid;
      
      if (userId) {
        // Terminate current session
        await sessionManager.terminateSession(null, 'user_logout');
        
        // Log logout
        await auditLogger.logAuth('logout', userId, {
          reason: 'user_initiated',
          ip: getClientIP()
        });
      }

      // Sign out from Firebase
      await signOut(auth);
      
      // Clear all state
      setCurrentUser(null);
      setTwoFactorRequired(false);
      setPendingCredentials(null);
      setSessionWarnings([]);
      setSecurityStatus({
        rateLimited: false,
        suspiciousActivity: false,
        sessionValid: false,
        twoFactorEnabled: false
      });

    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  /**
   * Reset password with security measures
   */
  const resetPassword = async (email) => {
    try {
      const sanitizedEmail = inputSanitizer.sanitizeEmail(email);
      
      // Validate email
      const emailValidation = inputSanitizer.validateEmail(sanitizedEmail);
      if (!emailValidation.isValid) {
        throw new Error('Invalid email address');
      }

      // Check rate limiting
      const rateLimitCheck = await rateLimitService.checkLimit('passwordReset', sanitizedEmail);
      if (!rateLimitCheck.allowed) {
        await auditLogger.logSecurity('rate_limit_hit', {
          operation: 'password_reset',
          email: sanitizedEmail
        });
        throw new Error('Too many password reset attempts. Please try again later.');
      }

      // Send password reset email
      await sendPasswordResetEmail(auth, sanitizedEmail);

      // Log password reset request
      await auditLogger.logAuth('password_reset', null, {
        email: sanitizedEmail,
        ip: getClientIP()
      });

      return { success: true, message: 'Password reset email sent' };

    } catch (error) {
      console.error('Password reset error:', error);
      
      // Record attempt
      await rateLimitService.recordAttempt('passwordReset', email);
      
      throw error;
    }
  };

  /**
   * Change password with security validation
   */
  const changePassword = async (currentPassword, newPassword) => {
    try {
      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      // Validate new password
      const passwordValidation = inputSanitizer.validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        throw new Error(`Invalid password: ${passwordValidation.errors.join(', ')}`);
      }

      // Reauthenticate user
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);

      // Update password
      await updatePassword(currentUser, newPassword);

      // Log password change
      await auditLogger.logAuth('password_change', currentUser.uid, {
        ip: getClientIP()
      });

      // Terminate all other sessions for security
      await sessionManager.terminateAllSessions(currentUser.uid, sessionManager.sessionToken);

      return { success: true, message: 'Password changed successfully' };

    } catch (error) {
      console.error('Password change error:', error);
      
      await auditLogger.logAuth('password_change_failed', currentUser?.uid, {
        error: error.message,
        ip: getClientIP()
      });

      throw error;
    }
  };

  /**
   * Setup 2FA for current user
   */
  const setup2FA = async (options = {}) => {
    try {
      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      const result = await twoFactorAuth.setup2FA(
        currentUser.uid, 
        currentUser.email, 
        options
      );

      return result;

    } catch (error) {
      console.error('2FA setup error:', error);
      throw error;
    }
  };

  /**
   * Verify 2FA setup
   */
  const verify2FASetup = async (code) => {
    try {
      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      const result = await twoFactorAuth.verifySetup(currentUser.uid, code);
      
      if (result.enabled) {
        setSecurityStatus(prev => ({ ...prev, twoFactorEnabled: true }));
      }

      return result;

    } catch (error) {
      console.error('2FA setup verification error:', error);
      throw error;
    }
  };

  /**
   * Disable 2FA
   */
  const disable2FA = async (options = {}) => {
    try {
      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      const result = await twoFactorAuth.disable2FA(currentUser.uid, options);
      
      if (result.disabled) {
        setSecurityStatus(prev => ({ ...prev, twoFactorEnabled: false }));
      }

      return result;

    } catch (error) {
      console.error('2FA disable error:', error);
      throw error;
    }
  };

  /**
   * Get user's active sessions
   */
  const getActiveSessions = async () => {
    try {
      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      return await sessionManager.getActiveSessions(currentUser.uid);

    } catch (error) {
      console.error('Error getting active sessions:', error);
      throw error;
    }
  };

  /**
   * Terminate a specific session
   */
  const terminateSession = async (sessionId) => {
    try {
      await sessionManager.terminateSession(sessionId, 'user_terminated');
      return { success: true, message: 'Session terminated' };

    } catch (error) {
      console.error('Error terminating session:', error);
      throw error;
    }
  };

  /**
   * Get security status and statistics
   */
  const getSecurityStatus = () => {
    return {
      ...securityStatus,
      sessionWarnings,
      sessionStats: sessionManager.getSessionStats(),
      rateLimitStatus: rateLimitService.getStatus(currentUser?.email || ''),
    };
  };

  /**
   * Helper function to get client IP (in real app, this would come from server)
   */
  const getClientIP = () => {
    // In a real application, you'd get this from your server
    return 'client_ip_placeholder';
  };

  /**
   * Extend current session
   */
  const extendSession = async () => {
    try {
      if (sessionManager.sessionToken) {
        await sessionManager.extendSession(sessionManager.sessionToken);
        setSessionWarnings([]);
        return { success: true, message: 'Session extended' };
      }
    } catch (error) {
      console.error('Error extending session:', error);
      throw error;
    }
  };

  const value = {
    // Core auth state
    currentUser,
    loading,
    twoFactorRequired,
    
    // Security status
    securityStatus: getSecurityStatus(),
    
    // Auth methods
    login,
    signup,
    logout,
    verify2FA,
    resetPassword,
    changePassword,
    
    // 2FA methods
    setup2FA,
    verify2FASetup,
    disable2FA,
    
    // Session management
    getActiveSessions,
    terminateSession,
    extendSession,
    
    // Utility methods
    sanitizeInput: inputSanitizer.sanitizeInput.bind(inputSanitizer),
    validateInput: inputSanitizer.validateInput.bind(inputSanitizer)
  };

  return (
    <EnhancedAuthContext.Provider value={value}>
      {children}
    </EnhancedAuthContext.Provider>
  );
}

export default EnhancedAuthContext; 