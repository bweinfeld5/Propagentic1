import { writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db } from '../firebase/config';
import toast from 'react-hot-toast';

/**
 * Standardized Onboarding Service
 * Provides atomic operations, error handling, and consistent patterns for all user types
 */
class StandardizedOnboardingService {
  constructor() {
    this.userTypes = {
      TENANT: 'tenant',
      LANDLORD: 'landlord', 
      CONTRACTOR: 'contractor'
    };
  }

  /**
   * Complete onboarding for any user type using atomic batch operations
   * @param {Object} config - Onboarding configuration
   * @param {string} config.userType - Type of user (tenant, landlord, contractor)
   * @param {Object} config.currentUser - Firebase Auth user object
   * @param {Object} config.formData - Form data collected during onboarding
   * @param {Function} config.fetchUserProfile - Function to refresh user profile
   * @param {Function} config.navigate - Navigation function
   * @param {Function} config.setLoading - Loading state setter
   * @param {Function} config.setError - Error state setter
   * @returns {Promise<boolean>} Success status
   */
  async completeOnboarding({
    userType,
    currentUser,
    formData,
    fetchUserProfile,
    navigate,
    setLoading,
    setError
  }) {
    if (!currentUser) {
      setError('Authentication error. Please log in again.');
      return false;
    }

    setLoading(true);
    setError('');

    try {
      // Validate inputs
      const validation = this.validateOnboardingData(userType, formData);
      if (!validation.isValid) {
        setError(validation.error);
        return false;
      }

      // Create atomic batch operation
      const batch = writeBatch(db);

      // Process based on user type
      switch (userType) {
        case this.userTypes.TENANT:
          await this.processTenantOnboarding(batch, currentUser, formData);
          break;
        case this.userTypes.LANDLORD:
          await this.processLandlordOnboarding(batch, currentUser, formData);
          break;
        case this.userTypes.CONTRACTOR:
          await this.processContractorOnboarding(batch, currentUser, formData);
          break;
        default:
          throw new Error(`Unsupported user type: ${userType}`);
      }

      // Execute all operations atomically
      console.log(`🔥 [${userType}] Executing batch commit with atomic operations...`);
      await batch.commit();
      console.log(`✅ [${userType}] Batch commit successful! Data saved to Firebase.`);

      // Update Firebase Auth profile if needed
      if (formData.firstName && formData.lastName) {
        const displayName = `${formData.firstName} ${formData.lastName}`.trim();
        await updateProfile(currentUser, { displayName });
      }

      // Refresh user profile to update context
      if (fetchUserProfile) {
        await fetchUserProfile(currentUser.uid);
        // Wait a bit longer to ensure auth context has updated
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Show success message
      toast.success(this.getSuccessMessage(userType));

      // Navigate to appropriate dashboard
      const dashboardRoute = this.getDashboardRoute(userType);
      setTimeout(() => navigate(dashboardRoute), 800); // Increased timeout

      console.log(`🎉 [${userType.toUpperCase()}] Onboarding completed successfully!`);
      console.log(`👤 User ID: ${currentUser.uid}`);
      console.log(`📧 Email: ${currentUser.email}`);
      console.log(`📋 Final form data:`, formData);
      return true;

    } catch (error) {
      console.error(`Error completing ${userType} onboarding:`, error);
      const errorMessage = this.getErrorMessage(error);
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Process tenant onboarding documents
   */
  async processTenantOnboarding(batch, currentUser, formData) {
    const displayName = `${formData.firstName} ${formData.lastName}`.trim();

    // 1. Update users document
    const userDocRef = doc(db, 'users', currentUser.uid);
    const userData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      displayName,
      phoneNumber: formData.phoneNumber,
      userType: 'tenant',
      onboardingComplete: true,
      profileComplete: true,
      updatedAt: serverTimestamp()
    };
    batch.set(userDocRef, userData, { merge: true });

    // 2. Create tenant profile document
    const tenantProfileRef = doc(db, 'tenantProfiles', currentUser.uid);
    const tenantProfileData = {
      tenantId: currentUser.uid,
      userId: currentUser.uid,
      email: currentUser.email,
      fullName: displayName,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phoneNumber: formData.phoneNumber,
      emergencyContact: formData.emergencyContact || {},
      preferences: formData.preferences || {},
      properties: [],
      maintenanceRequests: [],
      profileCompletionPercentage: 100,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    batch.set(tenantProfileRef, tenantProfileData);

    console.log('🏠 [TENANT] Documents prepared for batch commit:');
    console.log('📄 users document data:', userData);
    console.log('👤 tenantProfiles document data:', tenantProfileData);
  }

  /**
   * Process landlord onboarding documents (3-document creation strategy)
   */
  async processLandlordOnboarding(batch, currentUser, formData) {
    const displayName = `${formData.firstName} ${formData.lastName}`.trim();

    // 1. Create Property Document (generate unique ID)
    const propertyRef = doc(db, 'properties', `property_${currentUser.uid}_${Date.now()}`);
    const propertyData = {
      nickname: formData.propertyNickname || formData.streetAddress,
      streetAddress: formData.streetAddress,
      city: formData.city,
      state: formData.state,
      zipCode: formData.zipCode,
      propertyType: formData.propertyType,
      numberOfUnits: formData.propertyType === 'Multi-Family Building' ? parseInt(formData.numberOfUnits, 10) : 1,
      monthlyRent: formData.monthlyRent ? parseFloat(formData.monthlyRent) : 0,
      landlordId: currentUser.uid,
      createdAt: serverTimestamp(),
      status: 'active',
      // Add invited tenant email if provided
      ...(formData.tenantEmail && { invitedTenantEmail: formData.tenantEmail })
    };
    batch.set(propertyRef, propertyData);

    // 2. Update Users Document
    const userDocRef = doc(db, 'users', currentUser.uid);
    const userData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      name: displayName,
      phoneNumber: formData.phoneNumber,
      businessName: formData.businessName || 'Individual Owner', // Provide default instead of empty string
      preferredContactMethod: formData.preferredContactMethod,
      yearsInBusiness: formData.yearsInBusiness,
      totalProperties: parseInt(formData.totalProperties, 10) || 1, // Convert to number
      managementSoftware: formData.managementSoftware,
      userType: 'landlord',
      onboardingComplete: true,
      profileComplete: true,
      updatedAt: serverTimestamp(),
      properties: [propertyRef.id], // Note: Firebase will generate the actual ID
    };
    batch.set(userDocRef, userData, { merge: true });

    // 3. Create Landlord Profile Document
    const landlordProfileRef = doc(db, 'landlordProfiles', currentUser.uid);
    const landlordProfileData = {
      uid: currentUser.uid,
      landlordId: currentUser.uid,
      userId: currentUser.uid,
      displayName: displayName,
      email: currentUser.email,
      phoneNumber: formData.phoneNumber || '',
      businessName: formData.businessName || '',
      
      // Core arrays as per specification
      acceptedTenants: [],
      properties: [propertyRef.id],
      invitesSent: [],
      contractors: [],
      
      // Enhanced tracking
      acceptedTenantDetails: [],
      
      // Statistics
      totalInvitesSent: 0,
      totalInvitesAccepted: 0,
      inviteAcceptanceRate: 0,
      
      // Business details
      yearsInBusiness: formData.yearsInBusiness,
      totalPropertiesManaged: formData.totalProperties,
      managementSoftware: formData.managementSoftware,
      
      // Timestamps
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    batch.set(landlordProfileRef, landlordProfileData);

          console.log('🏠 [LANDLORD] Documents prepared for batch commit:');
      console.log('📄 users document data:', userData);
      console.log('🏢 properties document data:', propertyData);
      console.log('👤 landlordProfiles document data:', landlordProfileData);
      
      // Debug validation data
      console.log('🔍 [LANDLORD] Profile validation data check:', {
        totalProperties: userData.totalProperties,
        totalPropertiesType: typeof userData.totalProperties,
        businessName: userData.businessName,
        businessNameLength: userData.businessName?.length
      });
    
    // TODO: Handle tenant invitation logic after batch commit if tenantEmail provided
    if (formData.tenantEmail) {
      console.log(`📧 [LANDLORD] Tenant invitation will be sent to: ${formData.tenantEmail} for property ${propertyRef.id}`);
    }
  }

  /**
   * Process contractor onboarding documents (already standardized)
   */
  async processContractorOnboarding(batch, currentUser, formData) {
    // This implementation already exists and is the reference
    throw new Error('Contractor onboarding already standardized');
  }

  /**
   * Validate onboarding data based on user type
   */
  validateOnboardingData(userType, formData) {
    const commonRequired = ['firstName', 'lastName', 'phoneNumber'];
    
    // Check common required fields
    for (const field of commonRequired) {
      if (!formData[field] || formData[field].trim() === '') {
        return {
          isValid: false,
          error: `${this.formatFieldName(field)} is required.`
        };
      }
    }

    // Type-specific validation
    switch (userType) {
      case this.userTypes.TENANT:
        return this.validateTenantData(formData);
      case this.userTypes.LANDLORD:
        return this.validateLandlordData(formData);
      case this.userTypes.CONTRACTOR:
        return this.validateContractorData(formData);
      default:
        return { isValid: false, error: 'Invalid user type' };
    }
  }

  /**
   * Validate tenant-specific data
   */
  validateTenantData(formData) {
    // Add tenant-specific validation rules
    if (formData.phoneNumber && !this.isValidPhoneNumber(formData.phoneNumber)) {
      return { isValid: false, error: 'Please enter a valid phone number.' };
    }

    return { isValid: true };
  }

  /**
   * Validate landlord-specific data
   */
  validateLandlordData(formData) {
    const required = ['streetAddress', 'city', 'state', 'zipCode', 'propertyType'];
    
    for (const field of required) {
      if (!formData[field] || formData[field].trim() === '') {
        return {
          isValid: false,
          error: `${this.formatFieldName(field)} is required.`
        };
      }
    }

    if (formData.propertyType === 'Multi-Family Building' && 
        (!formData.numberOfUnits || formData.numberOfUnits < 1)) {
      return {
        isValid: false,
        error: 'Number of units is required for Multi-Family buildings.'
      };
    }

    return { isValid: true };
  }

  /**
   * Validate contractor-specific data
   */
  validateContractorData(formData) {
    if (!formData.serviceTypes || formData.serviceTypes.length === 0) {
      return {
        isValid: false,
        error: 'Please select at least one service type.'
      };
    }

    if (!formData.serviceArea || formData.serviceArea.trim() === '') {
      return {
        isValid: false,
        error: 'Please specify your service area.'
      };
    }

    return { isValid: true };
  }

  /**
   * Helper methods
   */
  formatFieldName(field) {
    return field.replace(/([A-Z])/g, ' $1')
               .replace(/^./, str => str.toUpperCase())
               .trim();
  }

  isValidPhoneNumber(phone) {
    const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
    return phoneRegex.test(phone);
  }

  getSuccessMessage(userType) {
    const messages = {
      [this.userTypes.TENANT]: 'Welcome to PropAgentic! Your tenant profile is complete.',
      [this.userTypes.LANDLORD]: 'Welcome to PropAgentic! Your landlord profile is complete.',
      [this.userTypes.CONTRACTOR]: 'Welcome to PropAgentic! Your contractor profile is complete.'
    };
    return messages[userType] || 'Profile setup complete!';
  }

  getDashboardRoute(userType) {
    const routes = {
      [this.userTypes.TENANT]: '/tenant/dashboard',
      [this.userTypes.LANDLORD]: '/landlord/dashboard', 
      [this.userTypes.CONTRACTOR]: '/contractor/dashboard'
    };
    return routes[userType] || '/dashboard';
  }

  getErrorMessage(error) {
    if (error.code) {
      switch (error.code) {
        case 'permission-denied':
          return 'You do not have permission to complete this action.';
        case 'network-request-failed':
          return 'Network error. Please check your connection and try again.';
        case 'unavailable':
          return 'Service temporarily unavailable. Please try again in a moment.';
        default:
          return `Setup failed: ${error.message || 'Unknown error'}`;
      }
    }
    return error.message || 'An unexpected error occurred. Please try again.';
  }
}

// Create singleton instance
const standardizedOnboardingService = new StandardizedOnboardingService();

export default standardizedOnboardingService; 