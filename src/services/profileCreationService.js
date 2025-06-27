import { 
  writeBatch, 
  runTransaction,
  doc, 
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Profile Creation Service
 * Handles race condition-free profile creation across all user types
 * with transaction-based operations, retry logic, and validation
 */
class ProfileCreationService {
  constructor() {
    this.MAX_RETRIES = 3;
    this.RETRY_DELAY_BASE = 1000; // 1 second base delay
  }

  /**
   * Create user profile with race condition protection
   * @param {string} uid - User ID from Firebase Auth
   * @param {string} userType - Type of user (tenant, landlord, contractor)
   * @param {Object} profileData - Profile data specific to user type
   * @param {Object} options - Creation options
   * @returns {Promise<Object>} Creation result with status
   */
  async createUserProfile(uid, userType, profileData, options = {}) {
    const { 
      validateBeforeCreate = true,
      createAdditionalCollections = true,
      retryOnFailure = true 
    } = options;

    let attempt = 0;
    const maxAttempts = retryOnFailure ? this.MAX_RETRIES : 1;

    while (attempt < maxAttempts) {
      try {
        attempt++;
        
        console.log(`[ProfileCreationService] Attempt ${attempt}/${maxAttempts} for user ${uid}`);

        // Step 1: Validate that profile doesn't already exist
        if (validateBeforeCreate && attempt === 1) {
          const existingProfile = await this._checkExistingProfile(uid);
          if (existingProfile.exists) {
            console.log(`[ProfileCreationService] Profile already exists for ${uid}`);
            return {
              success: true,
              existed: true,
              profile: existingProfile.data,
              message: 'Profile already exists'
            };
          }
        }

        // Step 2: Create profile using transaction
        const result = await this._createProfileTransaction(uid, userType, profileData, createAdditionalCollections);
        
        console.log(`[ProfileCreationService] Successfully created profile for ${uid} on attempt ${attempt}`);
        return {
          success: true,
          existed: false,
          profile: result.userData,
          additionalData: result.additionalData,
          message: 'Profile created successfully'
        };

      } catch (error) {
        console.error(`[ProfileCreationService] Attempt ${attempt} failed:`, error);

        // Check if this is a retryable error
        const isRetryable = this._isRetryableError(error);
        
        if (!isRetryable || attempt >= maxAttempts) {
          // Final failure - log and throw
          console.error(`[ProfileCreationService] Final failure for user ${uid}:`, error);
          throw new Error(`Profile creation failed after ${attempt} attempts: ${error.message}`);
        }

        // Wait before retry with exponential backoff
        const delay = this.RETRY_DELAY_BASE * Math.pow(2, attempt - 1);
        console.log(`[ProfileCreationService] Retrying in ${delay}ms...`);
        await this._delay(delay);
      }
    }
  }

  /**
   * Check if user profile already exists
   * @param {string} uid - User ID
   * @returns {Promise<Object>} Existence check result
   */
  async _checkExistingProfile(uid) {
    try {
      const userDocRef = doc(db, 'users', uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        return {
          exists: true,
          data: userDocSnap.data()
        };
      }

      return { exists: false };
    } catch (error) {
      console.error('[ProfileCreationService] Error checking existing profile:', error);
      throw error;
    }
  }

  /**
   * Create profile using Firestore transaction for atomicity
   * @param {string} uid - User ID
   * @param {string} userType - User type
   * @param {Object} profileData - Profile data
   * @param {boolean} createAdditionalCollections - Whether to create additional collections
   * @returns {Promise<Object>} Transaction result
   */
  async _createProfileTransaction(uid, userType, profileData, createAdditionalCollections) {
    return await runTransaction(db, async (transaction) => {
      // References for all documents we'll create
      const userDocRef = doc(db, 'users', uid);
      
      // Check if user already exists within transaction
      const existingUserDoc = await transaction.get(userDocRef);
      if (existingUserDoc.exists()) {
        console.log(`[ProfileCreationService] User already exists, returning existing data`);
        return {
          userData: existingUserDoc.data(),
          additionalData: null
        };
      }

      // Prepare base user data
      const timestamp = serverTimestamp();
      const baseUserData = {
        uid,
        email: profileData.email,
        userType,
        role: userType, // For backward compatibility
        createdAt: timestamp,
        updatedAt: timestamp,
        onboardingComplete: false,
        emailVerified: profileData.emailVerified ?? true,
        ...profileData
      };

      // Create the main user document
      transaction.set(userDocRef, baseUserData);

      let additionalData = null;

      // Create additional collection documents based on user type
      if (createAdditionalCollections) {
        additionalData = await this._createAdditionalCollections(
          transaction, 
          uid, 
          userType, 
          profileData, 
          timestamp
        );
      }

      console.log(`[ProfileCreationService] Transaction completed for ${userType} user ${uid}`);
      
      return {
        userData: baseUserData,
        additionalData
      };
    });
  }

  /**
   * Create additional collection documents based on user type
   * @param {Transaction} transaction - Firestore transaction
   * @param {string} uid - User ID
   * @param {string} userType - User type
   * @param {Object} profileData - Profile data
   * @param {Object} timestamp - Server timestamp
   * @returns {Promise<Object>} Additional data created
   */
  async _createAdditionalCollections(transaction, uid, userType, profileData, timestamp) {
    const additionalData = {};

    switch (userType) {
      case 'contractor':
        // Create contractor profile
        const contractorProfileRef = doc(db, 'contractorProfiles', uid);
        const contractorProfileData = {
          contractorId: uid,
          userId: uid,
          skills: profileData.serviceTypes || profileData.skills || [],
          serviceArea: profileData.serviceArea || '',
          availability: true,
          preferredProperties: [],
          rating: 0,
          jobsCompleted: 0,
          companyName: profileData.companyName || null,
          yearsExperience: profileData.yearsExperience || '0-2',
          bio: profileData.bio || '',
          hourlyRate: profileData.hourlyRate ? parseFloat(profileData.hourlyRate) : null,
          phoneNumber: profileData.phoneNumber || '',
          preferredContactMethod: profileData.preferredContactMethod || 'email',
          availabilityNotes: profileData.availabilityNotes || '',
          // Verification and payment info
          taxId: profileData.taxId || '',
          insuranceInfo: profileData.insuranceInfo || '',
          website: profileData.website || '',
          w9FormUrl: profileData.w9FormUrl || '',
          stripeAccountSetup: profileData.stripeAccountSetup || false,
          bankAccountVerified: profileData.bankAccountVerified || false,
          paymentMethodsSetup: profileData.paymentMethodsSetup || false,
          createdAt: timestamp,
          updatedAt: timestamp
        };
        
        transaction.set(contractorProfileRef, contractorProfileData);
        additionalData.contractorProfile = contractorProfileData;
        break;

      case 'landlord':
        // Create landlord profile
        const landlordProfileRef = doc(db, 'landlordProfiles', uid);
        const landlordProfileData = {
          landlordId: uid,
          userId: uid,
          displayName: profileData.displayName || profileData.name || '',
          email: profileData.email,
          phoneNumber: profileData.phoneNumber || '',
          businessName: profileData.businessName || '',
          properties: [],
          tenants: [],
          contractors: [],
          invitesSent: [],
          createdAt: timestamp,
          updatedAt: timestamp
        };
        
        transaction.set(landlordProfileRef, landlordProfileData);
        additionalData.landlordProfile = landlordProfileData;
        break;

      case 'tenant':
        // Create tenant profile
        const tenantProfileRef = doc(db, 'tenantProfiles', uid);
        const tenantProfileData = {
          tenantId: uid,
          userId: uid,
          displayName: profileData.displayName || profileData.name || '',
          email: profileData.email,
          phoneNumber: profileData.phoneNumber || '',
          properties: [],
          leases: [],
          maintenanceRequests: [],
          createdAt: timestamp,
          updatedAt: timestamp
        };
        
        transaction.set(tenantProfileRef, tenantProfileData);
        additionalData.tenantProfile = tenantProfileData;
        break;

      default:
        console.warn(`[ProfileCreationService] Unknown user type: ${userType}`);
    }

    return additionalData;
  }

  /**
   * Validate profile data before creation
   * @param {string} userType - User type
   * @param {Object} profileData - Profile data to validate
   * @returns {Object} Validation result
   */
  validateProfileData(userType, profileData) {
    const errors = [];
    const warnings = [];

    // Common validation
    if (!profileData.email) {
      errors.push('Email is required');
    }

    if (!userType || !['tenant', 'landlord', 'contractor'].includes(userType)) {
      errors.push('Valid user type is required');
    }

    // User type specific validation
    switch (userType) {
      case 'contractor':
        if (!profileData.serviceTypes && !profileData.skills) {
          warnings.push('No skills/service types specified');
        }
        if (!profileData.serviceArea) {
          warnings.push('Service area not specified');
        }
        break;

      case 'landlord':
        // Landlord specific validation
        break;

      case 'tenant':
        // Tenant specific validation
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Determine if an error is retryable
   * @param {Error} error - Error object
   * @returns {boolean} Whether error is retryable
   */
  _isRetryableError(error) {
    const retryableErrors = [
      'cancelled',
      'deadline-exceeded',
      'internal',
      'resource-exhausted',
      'unavailable',
      'unknown',
      'aborted'
    ];

    // Check for Firestore error codes
    if (error.code && retryableErrors.includes(error.code)) {
      return true;
    }

    // Check for network errors
    if (error.message && (
      error.message.includes('network') ||
      error.message.includes('timeout') ||
      error.message.includes('connection')
    )) {
      return true;
    }

    return false;
  }

  /**
   * Add delay for retry backoff
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} Promise that resolves after delay
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Repair existing profile that may have incomplete data
   * @param {string} uid - User ID
   * @param {string} userType - User type
   * @returns {Promise<Object>} Repair result
   */
  async repairProfile(uid, userType) {
    try {
      console.log(`[ProfileCreationService] Repairing profile for ${uid}`);

      return await runTransaction(db, async (transaction) => {
        const userDocRef = doc(db, 'users', uid);
        const userDoc = await transaction.get(userDocRef);

        if (!userDoc.exists()) {
          throw new Error('User profile not found for repair');
        }

        const userData = userDoc.data();
        const updates = {};
        let needsUpdate = false;

        // Ensure userType and role consistency
        if (!userData.userType && userData.role) {
          updates.userType = userData.role;
          needsUpdate = true;
        } else if (!userData.role && userData.userType) {
          updates.role = userData.userType;
          needsUpdate = true;
        }

        // Add missing timestamps
        if (!userData.createdAt) {
          updates.createdAt = serverTimestamp();
          needsUpdate = true;
        }

        if (!userData.updatedAt) {
          updates.updatedAt = serverTimestamp();
          needsUpdate = true;
        }

        // Add missing onboardingComplete field
        if (userData.onboardingComplete === undefined) {
          updates.onboardingComplete = false;
          needsUpdate = true;
        }

        if (needsUpdate) {
          transaction.update(userDocRef, updates);
          console.log(`[ProfileCreationService] Applied repairs:`, updates);
        }

        return {
          success: true,
          repairsApplied: needsUpdate,
          repairs: updates
        };
      });

    } catch (error) {
      console.error('[ProfileCreationService] Error repairing profile:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const profileCreationService = new ProfileCreationService();
export default profileCreationService; 