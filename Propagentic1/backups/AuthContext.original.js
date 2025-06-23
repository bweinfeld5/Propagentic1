import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

// Create the authentication context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// User roles
export const ROLES = {
  LANDLORD: 'landlord',
  TENANT: 'tenant',
  CONTRACTOR: 'contractor'
};

// Provider component for wrapping your app
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign up function
  const signup = async (email, password, role, userData = {}) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Create user profile in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: email,
        role: role,
        createdAt: new Date().toISOString(),
        ...userData
      });
      
      return userCredential;
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  };

  // Login function
  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Logout function
  const logout = () => {
    return signOut(auth);
  };

  // Reset password function
  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  // Fetch user profile data from Firestore
  const fetchUserProfile = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const profileData = userDoc.data();
        setUserProfile(profileData);
        return profileData;
      } else {
        console.warn("No user profile found for:", userId);
        setUserProfile(null);
        return null;
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setUserProfile(null);
      return null;
    }
  };

  // Update user profile
  const updateUserProfile = async (userId, data) => {
    try {
      await setDoc(doc(db, 'users', userId), data, { merge: true });
      setUserProfile(prev => ({ ...prev, ...data }));
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
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

  // Check if user has a specific role
  const hasRole = (role) => {
    return userProfile?.role === role;
  };

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        await fetchUserProfile(user.uid);
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Context value with auth functions and state
  const value = {
    currentUser,
    userProfile,
    loading,
    signup,
    login,
    logout,
    resetPassword,
    fetchUserProfile,
    updateUserProfile,
    completeOnboarding,
    hasRole,
    isLandlord: () => hasRole(ROLES.LANDLORD),
    isTenant: () => hasRole(ROLES.TENANT),
    isContractor: () => hasRole(ROLES.CONTRACTOR),
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 