/**
 * Authentication helper utilities for PropAgentic
 * Provides robust user validation and safe routing logic
 */

export const VALID_ROLES = ['landlord', 'tenant', 'contractor'];

/**
 * Validates user profile data and role consistency
 * @param {Object} userProfile - User profile object from Firestore
 * @returns {Object} Validation result with role info and flags
 */
export const validateUserRole = (userProfile) => {
  if (!userProfile) {
    return {
      isValid: false,
      role: null,
      needsOnboarding: true,
      hasRequiredFields: false,
      error: 'No user profile provided'
    };
  }

  const userType = userProfile.userType || userProfile.role;
  
  // Check if role is valid
  const isValidRole = VALID_ROLES.includes(userType);
  
  // Check required fields based on role
  const hasRequiredFields = checkRequiredFields(userProfile, userType);
  
  // Check onboarding status
  const needsOnboarding = userProfile.onboardingComplete !== true;
  
  return {
    isValid: isValidRole,
    role: userType,
    needsOnboarding,
    hasRequiredFields,
    error: !isValidRole ? `Invalid role: ${userType}` : null,
    isProfileCorrupted: !isValidRole || !hasRequiredFields
  };
};

/**
 * Checks if user profile has required fields for their role
 * @param {Object} userProfile - User profile object
 * @param {string} userType - User role type
 * @returns {boolean} Whether profile has required fields
 */
export const checkRequiredFields = (userProfile, userType) => {
  if (!userProfile || !userType) return false;

  // Common required fields for all users
  const commonFields = ['email', 'userType'];
  const hasCommonFields = commonFields.every(field => userProfile[field]);
  
  if (!hasCommonFields) return false;

  // Role-specific required fields
  switch (userType) {
    case 'landlord':
      return userProfile.firstName && userProfile.lastName;
    case 'contractor':
      return userProfile.firstName && userProfile.lastName && userProfile.phoneNumber;
    case 'tenant':
      return userProfile.firstName && userProfile.lastName;
    default:
      return false;
  }
};

/**
 * Repairs inconsistent user profile data
 * @param {Object} userProfile - User profile object
 * @returns {Object} Repaired profile data and updates needed
 */
export const repairUserProfile = (userProfile) => {
  if (!userProfile) return { profile: null, updates: {}, needsUpdate: false };

  const updates = {};
  let needsUpdate = false;

  // Ensure both userType and role fields exist and match
  if (userProfile.userType && !userProfile.role) {
    updates.role = userProfile.userType;
    needsUpdate = true;
  } else if (userProfile.role && !userProfile.userType) {
    updates.userType = userProfile.role;
    needsUpdate = true;
  } else if (userProfile.userType !== userProfile.role && userProfile.userType) {
    // If both exist but don't match, use userType as source of truth
    updates.role = userProfile.userType;
    needsUpdate = true;
  }

  // Add missing onboardingComplete field
  if (userProfile.onboardingComplete === undefined) {
    updates.onboardingComplete = false; // Conservative default for new users
    needsUpdate = true;
  }

  // Add missing timestamps
  if (!userProfile.createdAt) {
    updates.createdAt = new Date().toISOString();
    needsUpdate = true;
  }

  return {
    profile: { ...userProfile, ...updates },
    updates,
    needsUpdate
  };
};

/**
 * Determines the correct route for a user based on their profile and auth state
 * @param {Object} currentUser - Firebase Auth user
 * @param {Object} userProfile - User profile from Firestore
 * @returns {Object} Route information and action needed
 */
export const determineUserRoute = (currentUser, userProfile) => {
  // Not authenticated
  if (!currentUser) {
    return {
      action: 'redirect',
      path: '/login',
      reason: 'not_authenticated'
    };
  }

  // No profile loaded
  if (!userProfile) {
    return {
      action: 'loading',
      reason: 'profile_loading'
    };
  }

  const validation = validateUserRole(userProfile);

  // Invalid or corrupted profile
  if (!validation.isValid) {
    return {
      action: 'redirect',
      path: '/profile-recovery',
      reason: 'invalid_profile',
      error: validation.error
    };
  }

  // Needs onboarding
  if (validation.needsOnboarding) {
    const onboardingRoutes = {
      landlord: '/landlord-onboarding',
      contractor: '/contractor-onboarding',
      tenant: '/onboarding'
    };
    
    return {
      action: 'redirect',
      path: onboardingRoutes[validation.role] || '/onboarding',
      reason: 'needs_onboarding'
    };
  }

  // Ready for dashboard
  const dashboardRoutes = {
    landlord: '/landlord/dashboard',
    contractor: '/contractor/dashboard',
    tenant: '/tenant/dashboard'
  };

  return {
    action: 'redirect',
    path: dashboardRoutes[validation.role] || '/dashboard',
    reason: 'authenticated'
  };
};

/**
 * Checks if a route is allowed for the current user
 * @param {string} path - Route path to check
 * @param {Object} userProfile - User profile
 * @returns {boolean} Whether route is allowed
 */
export const isRouteAllowed = (path, userProfile) => {
  if (!userProfile) return false;

  const validation = validateUserRole(userProfile);
  if (!validation.isValid) return false;

  const role = validation.role;

  // Public routes always allowed
  const publicRoutes = ['/', '/login', '/signup', '/about', '/pricing'];
  if (publicRoutes.includes(path)) return true;

  // Role-specific route checking
  if (path.startsWith('/landlord/') && role !== 'landlord') return false;
  if (path.startsWith('/contractor/') && role !== 'contractor') return false;
  if (path.startsWith('/tenant/') && role !== 'tenant') return false;

  // Onboarding routes
  if (path.includes('onboarding')) {
    return validation.needsOnboarding;
  }

  return true;
};

/**
 * Gets user-friendly error messages for auth issues
 * @param {string} errorCode - Error code or type
 * @returns {string} User-friendly error message
 */
export const getAuthErrorMessage = (errorCode) => {
  const errorMessages = {
    'auth/user-not-found': 'No account found with this email address.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password should be at least 6 characters long.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'permission-denied': 'You do not have permission to access this resource.',
    'unavailable': 'Service temporarily unavailable. Please try again.',
    'invalid_profile': 'Your profile data appears to be corrupted. Please contact support.',
    'profile_loading': 'Loading your profile information...',
    'not_authenticated': 'Please log in to access this feature.'
  };

  return errorMessages[errorCode] || 'An unexpected error occurred. Please try again.';
};

/**
 * Safely stores user data in localStorage with error handling
 * @param {Object} userData - User data to store
 */
export const safeStoreUserData = (userData) => {
  try {
    const safeData = {
      uid: userData.uid,
      email: userData.email,
      displayName: userData.displayName,
      userType: userData.userType,
      role: userData.role,
      onboardingComplete: userData.onboardingComplete,
      isPremium: userData.isPremium,
      subscriptionTier: userData.subscriptionTier,
      lastSync: new Date().toISOString()
    };
    
    localStorage.setItem('user', JSON.stringify(safeData));
    return true;
  } catch (error) {
    console.error('Error storing user data:', error);
    return false;
  }
};

/**
 * Safely retrieves user data from localStorage
 * @returns {Object|null} User data or null if not found/invalid
 */
export const safeGetUserData = () => {
  try {
    const userData = localStorage.getItem('user');
    if (!userData) return null;
    
    const parsed = JSON.parse(userData);
    
    // Validate stored data
    if (!parsed.uid || !parsed.email) {
      localStorage.removeItem('user');
      return null;
    }
    
    return parsed;
  } catch (error) {
    console.error('Error retrieving user data:', error);
    localStorage.removeItem('user');
    return null;
  }
}; 