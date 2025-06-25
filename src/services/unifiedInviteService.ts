/**
 * Unified Invite Code Service - PropAgentic
 * 
 * This service consolidates all invite code functionality into a single, reliable service
 * that handles Firebase Functions, local fallback, and demo modes seamlessly.
 */

import { auth, db } from '../firebase/config';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  updateDoc,
  doc,
  Timestamp,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { User } from 'firebase/auth';

// Types and interfaces
export interface InviteCodeData {
  id?: string;
  code: string;
  propertyId: string;
  propertyName?: string;
  landlordId: string;
  unitId?: string | null;
  email?: string | null;
  status: 'active' | 'used' | 'expired' | 'revoked';
  createdAt: Timestamp | Date | number;
  expiresAt: Timestamp | Date | number;
  usedAt?: Timestamp | Date | number;
  usedBy?: string;
}

export interface ValidationResult {
  isValid: boolean;
  message: string;
  propertyId?: string;
  propertyName?: string;
  landlordId?: string;
  unitId?: string | null;
  email?: string | null;
  restrictedEmail?: string | null;
  data?: InviteCodeData;
}

export interface RedemptionResult {
  success: boolean;
  message: string;
  propertyId?: string;
  propertyName?: string;
  unitId?: string | null;
}

export interface GenerationResult {
  success: boolean;
  code: string;
  message?: string;
  data?: InviteCodeData;
  mode: 'firebase' | 'local' | 'demo';
}

interface CreateOptions {
  unitId?: string;
  email?: string;
  expirationDays?: number;
}

/**
 * Unified Invite Code Service Class
 */
class UnifiedInviteService {
  private localCodes: Map<string, InviteCodeData> = new Map();
  private readonly COLLECTION_NAME = 'inviteCodes';
  private readonly CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars

  /**
   * Generate a random invite code
   */
  private generateRandomCode(length = 8): string {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += this.CHARS.charAt(Math.floor(Math.random() * this.CHARS.length));
    }
    return result;
  }

  /**
   * Ensure user is authenticated with proper token refresh and retry logic
   */
  private async ensureAuthenticated(): Promise<User> {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('Authentication required: Please log in to continue');
    }

    // Enhanced token refresh with retry logic
    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔐 Authentication attempt ${attempt}/${maxRetries} for user ${currentUser.uid}`);
        
        // Force token refresh to ensure valid authentication
        const token = await currentUser.getIdToken(true);
        
        if (!token) {
          throw new Error('Failed to obtain authentication token');
        }

        console.log('✅ Authentication token refreshed successfully');
        
        // Verify token is valid by checking claims
        const tokenResult = await currentUser.getIdTokenResult();
        
        if (!tokenResult.claims) {
          throw new Error('Invalid token: Missing claims');
        }

        console.log('✅ Token validation successful');
        return currentUser;
        
      } catch (error: any) {
        lastError = error;
        console.warn(`⚠️ Authentication attempt ${attempt} failed:`, error.message);
        
        // If this is not the last attempt, wait before retrying
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff, max 5s
          console.log(`⏳ Retrying authentication in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    console.error('❌ All authentication attempts failed:', lastError);
    
    // Provide specific error messages based on the type of failure
    if (lastError?.code === 'auth/network-request-failed') {
      throw new Error('Network error: Please check your internet connection and try again');
    } else if (lastError?.code === 'auth/id-token-expired') {
      throw new Error('Session expired: Please log out and log back in');
    } else if (lastError?.code === 'auth/user-token-expired') {
      throw new Error('Authentication expired: Please log out and log back in');
    } else if (lastError?.code === 'auth/too-many-requests') {
      throw new Error('Too many requests: Please wait a moment and try again');
    } else {
      throw new Error(`Authentication failed: ${lastError?.message || 'Unknown error'}. Please log out and log back in.`);
    }
  }

  /**
   * Generate invite code with intelligent fallback strategy
   */
  async generateInviteCode(
    propertyId: string, 
    options: CreateOptions = {}
  ): Promise<GenerationResult> {
    console.log('🔧 UnifiedInviteService: Starting invite code generation');
    
    const { unitId, email, expirationDays = 7 } = options;
    
    if (!propertyId) {
      throw new Error('Property ID is required');
    }

    // Ensure user is authenticated
    const currentUser = await this.ensureAuthenticated();
    console.log('✅ User authenticated:', currentUser.uid);

    // Strategy 1: Try Firebase Functions (production)
    try {
      console.log('📡 Attempting Firebase Functions approach...');
      
      const functions = getFunctions();
      const generateFunction = httpsCallable(functions, 'generateInviteCode');
      
      const requestPayload = {
        propertyId,
        unitId,
        email,
        expirationDays
      };
      
      console.log('📤 Firebase Functions request:', requestPayload);
      const result = await generateFunction(requestPayload);
      const data = result.data as any;
      
      if (data.success && data.inviteCode) {
        console.log('✅ Firebase Functions successful');
        return {
          success: true,
          code: data.inviteCode.code,
          data: {
            id: data.inviteCode.id,
            code: data.inviteCode.code,
            propertyId: data.inviteCode.propertyId,
            landlordId: data.inviteCode.landlordId,
            unitId: data.inviteCode.unitId,
            email: data.inviteCode.email,
            status: data.inviteCode.status,
            createdAt: new Date(data.inviteCode.createdAt),
            expiresAt: new Date(data.inviteCode.expiresAt)
          },
          mode: 'firebase'
        };
      } else {
        throw new Error(data.message || 'Firebase Functions returned unsuccessful result');
      }
    } catch (firebaseError) {
      console.warn('⚠️ Firebase Functions failed:', firebaseError);
      
      // Strategy 2: Try direct Firestore (development/fallback)
      try {
        console.log('🔧 Attempting direct Firestore approach...');
        
        const result = await this.createInviteCodeDirect(propertyId, currentUser.uid, options);
        
        console.log('✅ Direct Firestore successful');
        return {
          success: true,
          code: result.code,
          data: result,
          mode: 'firebase',
          message: 'Generated via direct Firestore (fallback mode)'
        };
      } catch (firestoreError) {
        console.warn('⚠️ Direct Firestore failed:', firestoreError);
        
        // Strategy 3: Local memory (development/testing)
        console.log('🔧 Using local memory fallback...');
        
        const result = await this.createInviteCodeLocal(propertyId, currentUser.uid, options);
        
        console.log('✅ Local memory successful');
        return {
          success: true,
          code: result.code,
          data: result,
          mode: 'local',
          message: 'Generated via local service (session only)'
        };
      }
    }
  }

  /**
   * Create invite code directly via Firestore
   */
  private async createInviteCodeDirect(
    propertyId: string,
    landlordId: string,
    options: CreateOptions = {}
  ): Promise<InviteCodeData> {
    const { unitId, email, expirationDays = 7 } = options;
    
    // Generate unique code
    let code: string;
    let isUnique = false;
    
    do {
      code = this.generateRandomCode();
      const codesRef = collection(db, this.COLLECTION_NAME);
      const q = query(codesRef, where('code', '==', code));
      const querySnapshot = await getDocs(q);
      isUnique = querySnapshot.empty;
    } while (!isUnique);
    
    const now = Timestamp.now();
    const expiresAt = new Timestamp(
      now.seconds + (expirationDays * 24 * 60 * 60),
      now.nanoseconds
    );
    
    const inviteCodeData: InviteCodeData = {
      code,
      propertyId,
      landlordId,
      unitId: unitId || null,
      email: email || null,
      status: 'active',
      createdAt: now,
      expiresAt
    };
    
    const docRef = await addDoc(collection(db, this.COLLECTION_NAME), inviteCodeData);
    
    return {
      ...inviteCodeData,
      id: docRef.id
    };
  }

  /**
   * Create invite code in local memory
   */
  private async createInviteCodeLocal(
    propertyId: string,
    landlordId: string,
    options: CreateOptions = {}
  ): Promise<InviteCodeData> {
    const { unitId, email, expirationDays = 7 } = options;
    
    // Generate unique code within local storage
    let code: string;
    do {
      code = this.generateRandomCode();
    } while (this.localCodes.has(code));
    
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (expirationDays * 24 * 60 * 60 * 1000));
    
    const inviteCodeData: InviteCodeData = {
      code,
      propertyId,
      landlordId,
      unitId: unitId || null,
      email: email || null,
      status: 'active',
      createdAt: now,
      expiresAt
    };
    
    this.localCodes.set(code, inviteCodeData);
    
    return inviteCodeData;
  }

  /**
   * Validate invite code with comprehensive fallback
   */
  async validateInviteCode(code: string): Promise<ValidationResult> {
    console.log('🔍 UnifiedInviteService: Validating code:', code);
    
    if (!code || typeof code !== 'string' || code.length < 6) {
      return {
        isValid: false,
        message: 'Invalid code format. Codes must be at least 6 characters.'
      };
    }

    const normalizedCode = code.toUpperCase();
    
    // Check test codes first
    if (normalizedCode === 'TEST1234') {
      return {
        isValid: true,
        message: 'Valid test invite code (development)',
        propertyId: 'test-property-123',
        propertyName: 'Test Property'
      };
    }

    // Strategy 1: Firebase Functions validation
    try {
      console.log('📡 Attempting Firebase Functions validation...');
      
      const functions = getFunctions();
      const validateFunction = httpsCallable(functions, 'validateInviteCode');
      
      const result = await validateFunction({ code: normalizedCode });
      const data = result.data as any;
      
      if (data.isValid) {
        console.log('✅ Firebase Functions validation successful');
        return {
          isValid: true,
          message: data.message,
          propertyId: data.propertyId,
          propertyName: data.propertyName,
          unitId: data.unitId,
          restrictedEmail: data.restrictedEmail
        };
      } else {
        return {
          isValid: false,
          message: data.message
        };
      }
    } catch (error) {
      console.warn('⚠️ Firebase Functions validation failed:', error);
    }

    // Strategy 2: Direct Firestore validation
    try {
      console.log('🔧 Attempting direct Firestore validation...');
      
      const codesRef = collection(db, this.COLLECTION_NAME);
      const q = query(codesRef, where('code', '==', normalizedCode));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const docSnapshot = querySnapshot.docs[0];
        const data = docSnapshot.data();
        
        const result = this.validateCodeData(data);
        if (result.isValid) {
          console.log('✅ Direct Firestore validation successful');
        }
        return result;
      }
    } catch (error) {
      console.warn('⚠️ Direct Firestore validation failed:', error);
    }

    // Strategy 3: Local memory validation
    const localData = this.localCodes.get(normalizedCode);
    if (localData) {
      console.log('🔧 Using local memory validation');
      return this.validateCodeData(localData);
    }

    // No valid code found
    return {
      isValid: false,
      message: 'Invalid invite code. Please check the code and try again.'
    };
  }

  /**
   * Validate code data consistency
   */
  private validateCodeData(data: any): ValidationResult {
    // Handle status checking
    const status = data.status || (data.used ? 'used' : 'active');
    
    if (status === 'used' || data.used === true) {
      return {
        isValid: false,
        message: 'This invite code has already been used.'
      };
    }
    
    if (status === 'revoked') {
      return {
        isValid: false,
        message: 'This invite code has been revoked.'
      };
    }
    
    // Check expiration
    const isExpired = status === 'expired' || 
                     (data.expiresAt && this.isTimestampExpired(data.expiresAt));
    
    if (isExpired) {
      return {
        isValid: false,
        message: 'This invite code has expired.'
      };
    }
    
    return {
      isValid: true,
      message: 'Valid invite code',
      propertyId: data.propertyId,
      propertyName: data.propertyName || '',
      landlordId: data.landlordId,
      unitId: data.unitId,
      restrictedEmail: data.email
    };
  }

  /**
   * Check if timestamp is expired
   */
  private isTimestampExpired(timestamp: any): boolean {
    if (!timestamp) return false;
    
    let timeMs: number;
    
    if (timestamp.toMillis) {
      timeMs = timestamp.toMillis();
    } else if (timestamp instanceof Date) {
      timeMs = timestamp.getTime();
    } else if (typeof timestamp === 'number') {
      timeMs = timestamp;
    } else {
      return false;
    }
    
    return timeMs < Date.now();
  }

  /**
   * Redeem invite code
   */
  async redeemInviteCode(code: string): Promise<RedemptionResult> {
    const currentUser = await this.ensureAuthenticated();
    
    // First validate the code
    const validation = await this.validateInviteCode(code);
    if (!validation.isValid) {
      return {
        success: false,
        message: validation.message
      };
    }

    // Try Firebase Functions redemption
    try {
      const functions = getFunctions();
      const redeemFunction = httpsCallable(functions, 'redeemInviteCode');
      
      const result = await redeemFunction({ code });
      const data = result.data as any;
      
      return {
        success: data.success,
        message: data.message,
        propertyId: data.propertyId,
        propertyName: data.propertyName,
        unitId: data.unitId
      };
    } catch (error) {
      console.warn('⚠️ Firebase Functions redemption failed:', error);
      
      // For local/demo codes, mark as used
      const normalizedCode = code.toUpperCase();
      const localData = this.localCodes.get(normalizedCode);
      if (localData) {
        localData.status = 'used';
        localData.usedAt = new Date();
        localData.usedBy = currentUser.uid;
        
        return {
          success: true,
          message: 'Invite code redeemed successfully (local mode)',
          propertyId: localData.propertyId,
          unitId: localData.unitId
        };
      }
      
      throw new Error('Failed to redeem invite code');
    }
  }

  /**
   * Get all invite codes for a landlord
   */
  async getLandlordInviteCodes(landlordId?: string): Promise<InviteCodeData[]> {
    const currentUser = await this.ensureAuthenticated();
    const targetLandlordId = landlordId || currentUser.uid;
    
    try {
      // Try Firestore first
      const codesRef = collection(db, this.COLLECTION_NAME);
      const q = query(codesRef, where('landlordId', '==', targetLandlordId));
      const querySnapshot = await getDocs(q);
      
      const firestoreCodes = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as InviteCodeData[];
      
      // Add local codes
      const localCodes = Array.from(this.localCodes.values()).filter(
        code => code.landlordId === targetLandlordId
      );
      
      return [...firestoreCodes, ...localCodes];
    } catch (error) {
      console.warn('⚠️ Failed to get Firestore codes, returning local only:', error);
      
      // Return only local codes if Firestore fails
      return Array.from(this.localCodes.values()).filter(
        code => code.landlordId === targetLandlordId
      );
    }
  }

  /**
   * Clear local codes (for testing)
   */
  clearLocalCodes(): void {
    this.localCodes.clear();
    console.log('🔧 Local invite codes cleared');
  }

  /**
   * Get debug information
   */
  getDebugInfo() {
    return {
      localCodesCount: this.localCodes.size,
      localCodes: Array.from(this.localCodes.keys()),
      authUser: auth.currentUser ? {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email
      } : null
    };
  }
}

// Export singleton instance
export const unifiedInviteService = new UnifiedInviteService();
export default unifiedInviteService; 