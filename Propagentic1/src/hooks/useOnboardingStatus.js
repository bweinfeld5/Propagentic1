import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Custom hook to check and manage onboarding status for users
 */
const useOnboardingStatus = () => {
  const { currentUser, userProfile } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only proceed if we have authenticated user
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const checkOnboardingStatus = async () => {
      try {
        setLoading(true);
        
        // Get user document from Firestore
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          // Check if onboarding has been completed
          const onboardingComplete = userDoc.data()?.onboardingComplete || false;
          
          // If onboarding is not complete and user has a profile, show onboarding
          if (!onboardingComplete && userProfile?.userType) {
            setShowOnboarding(true);
          } else {
            setShowOnboarding(false);
          }
        } else {
          // If user document doesn't exist, assume onboarding needed
          setShowOnboarding(true);
        }
      } catch (err) {
        console.error('Error checking onboarding status:', err);
        setError(err.message);
        // Default to not showing onboarding if there's an error
        setShowOnboarding(false);
      } finally {
        setLoading(false);
      }
    };

    checkOnboardingStatus();
  }, [currentUser, userProfile]);

  // Function to manually close onboarding 
  const dismissOnboarding = () => {
    setShowOnboarding(false);
  };

  return {
    showOnboarding,
    loading,
    error,
    dismissOnboarding
  };
};

export default useOnboardingStatus; 