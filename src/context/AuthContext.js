import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  sendPasswordResetEmail 
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { 
  validateUserRole, 
  repairUserProfile, 
  safeStoreUserData, 
  safeGetUserData,
  getAuthErrorMessage 
} from '../utils/authHelpers';

// Create Auth context
const AuthContext = createContext();

// User roles
export const ROLES = {
  LANDLORD: 'landlord',
  TENANT: 'tenant',
  CONTRACTOR: 'contractor'
};

// Hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Enhanced auth context provider component
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [profileError, setProfileError] = useState(null);
  const [isProfileCorrupted, setIsProfileCorrupted] = useState(false);
  const [lastValidRoute, setLastValidRoute] = useState(null);

  // Clear errors
  const clearErrors = () => {
    setAuthError(null);
    setProfileError(null);
    setIsProfileCorrupted(false);
  };

  // Register a new user with user type
  const register = async (email, password, userType, isPremium = false) => {
    try {
      clearErrors();
      
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Prepare user data object
      const userData = {
        email,
        userType,
        role: userType, // Add role field to match userType for backwards compatibility
        createdAt: serverTimestamp(),
        uid: user.uid,
        onboardingComplete: false // Set default onboarding state
      };
      
      // Add premium flag for contractor accounts
      if (userType === 'contractor' && isPremium) {
        userData.isPremium = true;
        userData.subscriptionTier = 'premium';
      }
      
      // Store user data in Firestore
      await setDoc(doc(db, 'users', user.uid), userData);
      
      return userCredential;
    } catch (error) {
      console.error('Registration error:', error);
      setAuthError(getAuthErrorMessage(error.code));
      throw error;
    }
  };

  // Login an existing user
  const login = async (email, password) => {
    try {
      clearErrors();
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Login error:', error);
      setAuthError(getAuthErrorMessage(error.code));
      throw error;
    }
  };

  // Logout the current user
  const logout = async () => {
    try {
      clearErrors();
      localStorage.removeItem('user');
      setUserProfile(null);
      setCurrentUser(null);
      await signOut(auth);
      // After logout, redirect to the beautiful landing page instead of login
      window.location.href = '/propagentic/new';
    } catch (error) {
      console.error('Logout error:', error);
      setAuthError(getAuthErrorMessage(error.code));
      throw error;
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    try {
      clearErrors();
      return await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Password reset error:', error);
      setAuthError(getAuthErrorMessage(error.code));
      throw error;
    }
  };

  // Fetch user profile data from Firestore with automatic repair
  const fetchUserProfile = async (uid) => {
    try {
      console.log('Fetching user profile for uid:', uid);
      setProfileError(null);
      
      const userDocRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        let profileData = userDoc.data();
        console.log('Original user profile data:', profileData);
        
        // Validate and repair profile data
        const validation = validateUserRole(profileData);
        const repair = repairUserProfile(profileData);
        
        // Update document if repairs are needed
        if (repair.needsUpdate) {
          console.log('Repairing user document with updates:', repair.updates);
          try {
            await setDoc(userDocRef, repair.updates, { merge: true });
            profileData = repair.profile;
            console.log('Profile repaired successfully:', profileData);
          } catch (repairError) {
            console.error('Error repairing profile:', repairError);
            setProfileError('Unable to repair profile data');
          }
        }
        
        // Check if profile is still corrupted after repair
        const finalValidation = validateUserRole(profileData);
        setIsProfileCorrupted(!finalValidation.isValid);
        
        if (!finalValidation.isValid) {
          setProfileError(finalValidation.error);
          console.error('Profile validation failed:', finalValidation.error);
        }
        
        // Update the user profile state
        setUserProfile(profileData);
        
        // Safely store in localStorage
        safeStoreUserData({
          uid: uid,
          email: profileData.email,
          displayName: profileData.firstName && profileData.lastName 
            ? `${profileData.firstName} ${profileData.lastName}` 
            : profileData.name,
          userType: profileData.userType,
          role: profileData.role,
          onboardingComplete: profileData.onboardingComplete,
          isPremium: profileData.isPremium,
          subscriptionTier: profileData.subscriptionTier
        });
        
        return profileData;
      } else {
        console.log('No user profile document found for uid:', uid);
        setProfileError('User profile not found');
        return null;
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setProfileError(getAuthErrorMessage(error.code));
      return null;
    }
  };

  // Helper functions to check user type with validation
  const isLandlord = () => {
    if (!userProfile || isProfileCorrupted) return false;
    return userProfile?.userType === 'landlord' || userProfile?.role === 'landlord';
  };

  const isTenant = () => {
    if (!userProfile || isProfileCorrupted) return false;
    return userProfile?.userType === 'tenant' || userProfile?.role === 'tenant';
  };

  const isContractor = () => {
    if (!userProfile || isProfileCorrupted) return false;
    return userProfile?.userType === 'contractor' || userProfile?.role === 'contractor';
  };
  
  const isPremiumContractor = () => {
    return isContractor() && (userProfile?.isPremium === true || userProfile?.subscriptionTier === 'premium');
  };

  // Complete onboarding for a user
  const completeOnboarding = async (userId, onboardingData) => {
    try {
      clearErrors();
      
      const data = {
        ...onboardingData,
        onboardingComplete: true,
        updatedAt: new Date().toISOString()
      };
      
      await updateUserProfile(userId, data);
      return true;
    } catch (error) {
      console.error("Error completing onboarding:", error);
      setProfileError(getAuthErrorMessage(error.code));
      throw error;
    }
  };

  // Update user profile
  const updateUserProfile = async (userId, data) => {
    try {
      clearErrors();
      
      await setDoc(doc(db, 'users', userId), data, { merge: true });
      setUserProfile(prev => ({ ...prev, ...data }));
      
      // Update localStorage safely
      const currentStoredData = safeGetUserData();
      if (currentStoredData) {
        safeStoreUserData({
          ...currentStoredData,
          ...data
        });
      }
      
      return true;
    } catch (error) {
      console.error("Error updating user profile:", error);
      setProfileError(getAuthErrorMessage(error.code));
      throw error;
    }
  };

  // Recover from profile corruption
  const recoverProfile = async () => {
    if (!currentUser) return false;
    
    try {
      clearErrors();
      setLoading(true);
      
      // Try to fetch and repair profile again
      const profile = await fetchUserProfile(currentUser.uid);
      
      if (profile) {
        const validation = validateUserRole(profile);
        if (validation.isValid) {
          setIsProfileCorrupted(false);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Profile recovery failed:', error);
      setProfileError('Unable to recover profile');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Set up an auth state observer with enhanced error handling
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setCurrentUser(user);
        
        if (user) {
          console.log('Auth state changed - user logged in:', user.uid);
          
          // Get additional user data from Firestore
          const profile = await fetchUserProfile(user.uid);
          
          if (profile) {
            console.log('User profile loaded:', profile);
          } else {
            console.warn('No profile found for authenticated user');
          }
        } else {
          console.log('Auth state changed - user logged out');
          setUserProfile(null);
          setIsProfileCorrupted(false);
          clearErrors();
          localStorage.removeItem('user');
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setAuthError('Authentication error occurred');
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // Context value
  const value = {
    // State
    currentUser,
    userProfile,
    loading,
    authError,
    profileError,
    isProfileCorrupted,
    lastValidRoute,
    
    // Auth methods
    register,
    login,
    logout,
    resetPassword,
    
    // Profile methods
    fetchUserProfile,
    updateUserProfile,
    completeOnboarding,
    recoverProfile,
    
    // Helper methods
    isLandlord,
    isTenant,
    isContractor,
    isPremiumContractor,
    hasRole: (role) => userProfile?.role === role || userProfile?.userType === role,
    
    // Error handling
    clearErrors,
    setLastValidRoute
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 