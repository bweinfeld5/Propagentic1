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
        
        // If userType exists but role doesn't, add role
        if (profileData.userType && !profileData.role) {
          updates.role = profileData.userType;
          needsUpdate = true;
          console.log('Adding missing role field based on userType');
        }
        
        // If role exists but userType doesn't, add userType
        if (profileData.role && !profileData.userType) {
          updates.userType = profileData.role;
          needsUpdate = true;
          console.log('Adding missing userType field based on role');
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
          console.log('Updating user document with missing fields:', updates);
          await setDoc(userDocRef, updates, { merge: true });
          
          // Refresh profile data after update
          const updatedDoc = await getDoc(userDocRef);
          profileData = updatedDoc.data();
          console.log('Updated user profile data:', profileData);
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

  // Set up an auth state observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Get additional user data from Firestore
        const profile = await fetchUserProfile(user.uid);
        setUserProfile(profile);
        
        localStorage.setItem('user', JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          userType: profile?.userType,
          onboardingComplete: profile?.onboardingComplete,
          isPremium: profile?.isPremium,
          subscriptionTier: profile?.subscriptionTier
        }));
        
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
    isLandlord,
    isTenant,
    isContractor,
    isPremiumContractor
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