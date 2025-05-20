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

// Create Auth context
const AuthContext = createContext();

// User roles
export const ROLES = {
  LANDLORD: 'landlord',
  TENANT: 'tenant',
  CONTRACTOR: 'contractor'
};

// Auth context provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Register a new user with user type
  const register = async (email, password, userType, isPremium = false) => {
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
  };

  // Login an existing user
  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Logout the current user
  const logout = () => {
    localStorage.removeItem('user');
    setUserProfile(null);
    return signOut(auth);
  };

  // Reset password
  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  // Fetch user profile data from Firestore
  const fetchUserProfile = async (uid) => {
    try {
      console.log('Fetching user profile for uid:', uid);
      const userDocRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        let profileData = userDoc.data();
        console.log('Original user profile data:', profileData);
        
        // Check for and repair missing fields
        let needsUpdate = false;
        const updates = {};
        
        // Ensure both userType and role fields exist and match
        // If one exists but not the other, copy the value
        if (profileData.userType && !profileData.role) {
          updates.role = profileData.userType;
          needsUpdate = true;
          console.log('Adding missing role field based on userType');
        } else if (profileData.role && !profileData.userType) {
          updates.userType = profileData.role;
          needsUpdate = true;
          console.log('Adding missing userType field based on role');
        } else if (!profileData.userType && !profileData.role) {
          // Default to tenant if neither exists (should be very rare)
          updates.userType = 'tenant';
          updates.role = 'tenant';
          needsUpdate = true;
          console.log('WARNING: User has no role or userType. Defaulting to tenant.');
        } else if (profileData.userType !== profileData.role) {
          // If both exist but don't match, use userType as source of truth
          updates.role = profileData.userType;
          needsUpdate = true;
          console.log('Fixing mismatch between userType and role fields');
        }
        
        // If onboardingComplete is missing, add it with reasonable default
        if (profileData.onboardingComplete === undefined) {
          // For existing users, assume onboarding is complete 
          updates.onboardingComplete = true;
          needsUpdate = true;
          console.log('Adding missing onboardingComplete field');
        }
        
        // Update document if needed
        if (needsUpdate) {
          console.log('Updating user document with missing/fixed fields:', updates);
          await setDoc(userDocRef, updates, { merge: true });
          
          // Refresh profile data after update
          const updatedDoc = await getDoc(userDocRef);
          profileData = updatedDoc.data();
          console.log('Updated user profile data:', profileData);
        }
        
        // Validate that we now have required fields
        if (!profileData.userType || !profileData.role) {
          console.error('Critical error: User still missing required fields after attempted repair');
          // You might want to log this to a monitoring service
        }
        
        // Update the user profile state
        setUserProfile(profileData);
        
        // Also update localStorage
        localStorage.setItem('user', JSON.stringify({
          uid: uid,
          email: profileData.email,
          displayName: profileData.name,
          userType: profileData.userType,
          role: profileData.role,
          onboardingComplete: profileData.onboardingComplete,
          isPremium: profileData.isPremium,
          subscriptionTier: profileData.subscriptionTier
        }));
        
        return profileData;
      }
      console.log('No user profile document found for uid:', uid);
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  // Helper functions to check user type
  const isLandlord = () => {
    return userProfile?.userType === 'landlord' || userProfile?.role === 'landlord';
  };

  const isTenant = () => {
    return userProfile?.userType === 'tenant' || userProfile?.role === 'tenant';
  };

  const isContractor = () => {
    return userProfile?.userType === 'contractor' || userProfile?.role === 'contractor';
  };
  
  const isPremiumContractor = () => {
    return isContractor() && (userProfile?.isPremium === true || userProfile?.subscriptionTier === 'premium');
  };

  // Complete onboarding for a user
  const completeOnboarding = async (userId, onboardingData) => {
    try {
      const data = {
        ...onboardingData,
        onboardingComplete: true,
        updatedAt: new Date().toISOString()
      };
      
      await updateUserProfile(userId, data);
      return true;
    } catch (error) {
      console.error("Error completing onboarding:", error);
      throw error;
    }
  };

  // Update user profile
  const updateUserProfile = async (userId, data) => {
    try {
      await setDoc(doc(db, 'users', userId), data, { merge: true });
      setUserProfile(prev => ({ ...prev, ...data }));
      
      // Update localStorage if needed
      if (data) {
        const userFromStorage = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({
          ...userFromStorage,
          ...data
        }));
      }
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  };

  // Set up an auth state observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Get additional user data from Firestore
        const profile = await fetchUserProfile(user.uid);
        setUserProfile(profile);
        
        if (profile) {
          localStorage.setItem('user', JSON.stringify({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            userType: profile.userType,
            role: profile.role,
            onboardingComplete: profile.onboardingComplete,
            isPremium: profile.isPremium,
            subscriptionTier: profile.subscriptionTier
          }));
        }
        
        console.log('Auth state changed, user logged in with profile:', profile);
      } else {
        setUserProfile(null);
        localStorage.removeItem('user');
        console.log('Auth state changed, user logged out');
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Context value
  const value = {
    currentUser,
    userProfile,
    loading,
    register,
    login,
    logout,
    resetPassword,
    fetchUserProfile,
    updateUserProfile,
    completeOnboarding,
    isLandlord,
    isTenant,
    isContractor,
    isPremiumContractor,
    hasRole: (role) => userProfile?.role === role || userProfile?.userType === role
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
}; 