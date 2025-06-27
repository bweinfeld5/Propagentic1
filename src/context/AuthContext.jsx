import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider
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
import profileCreationService from '../services/profileCreationService';
import { getFunctions, httpsCallable } from 'firebase/functions';

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

  // Register a new user with user type using ProfileCreationService
  const register = async (email, password, userType, isPremium = false) => {
    try {
      clearErrors();
      
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Prepare user data object for ProfileCreationService
      const profileData = {
        email,
        emailVerified: true // Set as verified since we're not requiring verification
      };

      // Only add premium fields for contractor accounts when applicable
      if (userType === 'contractor' && isPremium) {
        profileData.isPremium = true;
        profileData.subscriptionTier = 'premium';
      }

      // Use ProfileCreationService for race condition-free creation
      const profileResult = await profileCreationService.createUserProfile(
        user.uid, 
        userType, 
        profileData,
        {
          validateBeforeCreate: true,
          createAdditionalCollections: true,
          retryOnFailure: true
        }
      );

      console.log('[AuthContext] Profile creation result:', profileResult);
      
      console.log('User registered successfully.');
      
      // Return userCredential for compatibility with registration forms
      return userCredential;
    } catch (error) {
      console.error('Registration error:', error);
      
      // Clean up auth user if profile creation failed
      if (auth.currentUser) {
        try {
          await auth.currentUser.delete();
          console.log('Cleaned up auth user after profile creation failure');
        } catch (cleanupError) {
          console.error('Failed to cleanup auth user:', cleanupError);
        }
      }
      
      setAuthError(getAuthErrorMessage(error.code));
      throw error;
    }
  };

  // Login an existing user
  const login = async (email, password) => {
    try {
      clearErrors();
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update user profile to reflect login
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        emailVerified: true,
        lastLogin: serverTimestamp()
      }, { merge: true });
      
      return userCredential;
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
      if (currentStoredData?.uid === userId) {
        safeStoreUserData({ ...currentStoredData, ...data });
      }
      
      console.log('User profile updated successfully in Firestore and localStorage');
    } catch (error) {
      console.error("Error updating user profile:", error);
      setProfileError(getAuthErrorMessage(error.code));
      throw error;
    }
  };

  // Refresh user data from Firestore
  const refreshUserData = async () => {
    if (currentUser?.uid) {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const updatedProfile = userDoc.data();
          setUserProfile(updatedProfile);
          console.log('User data refreshed successfully:', updatedProfile);
          return updatedProfile;
        }
      } catch (error) {
        console.error('Error refreshing user data:', error);
        setProfileError(getAuthErrorMessage(error.code));
        throw error;
      }
    } else {
      console.log('No current user available for refresh');
    }
  };

  // Recover profile from localStorage
  const recoverProfile = async () => {
    try {
      const storedUser = safeGetUserData();
      if (storedUser) {
        console.log('Recovering user from localStorage:', storedUser);
        const freshProfile = await fetchUserProfile(storedUser.uid);
        if (freshProfile) {
          console.log('Successfully refreshed profile from localStorage data');
        } else {
          console.warn('Failed to refresh profile from localStorage data');
        }
      } else {
        console.log('No user data in localStorage to recover');
      }
    } catch (error) {
      console.error('Error during profile recovery:', error);
    }
  };

  // Google OAuth sign-in/sign-up
  const signInWithGoogle = async (userType = 'tenant', isPremium = false) => {
    try {
      clearErrors();
      
      const provider = new GoogleAuthProvider();
      // Add additional scopes if needed
      provider.addScope('email');
      provider.addScope('profile');
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if this is a new user by looking for existing profile
      let existingProfile = null;
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          existingProfile = userDoc.data();
        }
      } catch (error) {
        console.log('No existing profile found, creating new one');
      }
      
      // If no existing profile, create one using ProfileCreationService
      if (!existingProfile) {
        const profileData = {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          emailVerified: true, // Google OAuth users have verified emails
          provider: 'google'
        };

        // Only add premium fields for contractor accounts when applicable
        if (userType === 'contractor' && isPremium) {
          profileData.isPremium = true;
          profileData.subscriptionTier = 'premium';
        }
        
        // Use ProfileCreationService for race condition-free creation
        const profileResult = await profileCreationService.createUserProfile(
          user.uid, 
          userType, 
          profileData,
          {
            validateBeforeCreate: true,
            createAdditionalCollections: true,
            retryOnFailure: true
          }
        );
        
        console.log('[AuthContext] Google OAuth profile creation result:', profileResult);
      }
      
      return result;
    } catch (error) {
      console.error('Google sign-in error:', error);
      
      // Handle specific Google OAuth errors
      if (error.code === 'auth/popup-closed-by-user') {
        setAuthError('Sign-in was cancelled. Please try again.');
      } else if (error.code === 'auth/popup-blocked') {
        setAuthError('Pop-up was blocked by your browser. Please allow pop-ups and try again.');
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        setAuthError('An account already exists with this email using a different sign-in method.');
      } else {
        setAuthError(getAuthErrorMessage(error.code));
      }
      throw error;
    }
  };

  // Monitor auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      clearErrors();
      
      if (user) {
        console.log('Auth state changed: user is logged in', user.uid);
        setCurrentUser(user);
        await fetchUserProfile(user.uid);
      } else {
        console.log('Auth state changed: user is logged out');
        setCurrentUser(null);
        setUserProfile(null);
        localStorage.removeItem('user');
      }
      
      setLoading(false);
    });
    
    // Attempt to recover profile on initial load
    recoverProfile();

    return unsubscribe;
  }, []);

  // Set the last valid route for a user
  const updateLastValidRoute = (route) => {
    if (route) {
      setLastValidRoute(route);
    }
  };
  
  // Value provided to the context
  const value = {
    currentUser,
    userProfile,
    loading,
    authError,
    profileError,
    isProfileCorrupted,
    lastValidRoute,
    register,
    login,
    logout,
    resetPassword,
    fetchUserProfile,
    isLandlord,
    isTenant,
    isContractor,
    isPremiumContractor,
    completeOnboarding,
    updateUserProfile,
    refreshUserData,
    updateLastValidRoute,
    signInWithGoogle
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 