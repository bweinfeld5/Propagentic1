import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { debounce } from 'lodash';

/**
 * Custom hook for managing onboarding progress with auto-save functionality
 * Supports localStorage fallback and Firestore sync for cross-device compatibility
 */
export const useOnboardingProgress = (userType) => {
  const { currentUser } = useAuth();
  const [progress, setProgress] = useState(null);
  const [saveStatus, setSaveStatus] = useState('saved'); // saved, saving, error
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Ref to prevent multiple saves
  const savingRef = useRef(false);
  
  // Storage keys
  const getStorageKey = useCallback(() => {
    return `onboarding_${userType}_${currentUser?.uid || 'anonymous'}`;
  }, [userType, currentUser?.uid]);

  const getFirestoreKey = useCallback(() => {
    if (!currentUser?.uid) return null;
    return `onboarding_progress_${userType}_${currentUser.uid}`;
  }, [userType, currentUser?.uid]);

  // Load progress from localStorage
  const loadFromLocalStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem(getStorageKey());
      if (!stored) return null;

      const parsed = JSON.parse(stored);
      
      // Validate stored data
      if (!parsed.timestamp || !parsed.userType || parsed.userType !== userType) {
        localStorage.removeItem(getStorageKey());
        return null;
      }

      // Check if expired (7 days)
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      if (parsed.timestamp < sevenDaysAgo) {
        localStorage.removeItem(getStorageKey());
        return null;
      }

      return parsed;
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      localStorage.removeItem(getStorageKey());
      return null;
    }
  }, [getStorageKey, userType]);

  // Load progress from Firestore
  const loadFromFirestore = useCallback(async () => {
    if (!currentUser?.uid) return null;

    try {
      const docRef = doc(db, 'user_onboarding_progress', getFirestoreKey());
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Validate Firestore data
        if (!data.timestamp || !data.userType || data.userType !== userType) {
          await deleteDoc(docRef);
          return null;
        }

        // Check if expired (7 days)
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        if (data.timestamp < sevenDaysAgo) {
          await deleteDoc(docRef);
          return null;
        }

        return data;
      }
      
      return null;
    } catch (error) {
      console.error('Error loading from Firestore:', error);
      return null;
    }
  }, [currentUser?.uid, getFirestoreKey, userType]);

  // Save to localStorage
  const saveToLocalStorage = useCallback((progressData) => {
    try {
      localStorage.setItem(getStorageKey(), JSON.stringify(progressData));
      return true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return false;
    }
  }, [getStorageKey]);

  // Save to Firestore
  const saveToFirestore = useCallback(async (progressData) => {
    if (!currentUser?.uid) return false;

    try {
      const docRef = doc(db, 'user_onboarding_progress', getFirestoreKey());
      await setDoc(docRef, progressData);
      return true;
    } catch (error) {
      console.error('Error saving to Firestore:', error);
      return false;
    }
  }, [currentUser?.uid, getFirestoreKey]);

  // Debounced save function
  const debouncedSave = useCallback(
    debounce(async (progressData) => {
      if (savingRef.current) return;
      
      savingRef.current = true;
      setSaveStatus('saving');
      setError(null);

      try {
        // Save to localStorage first (faster)
        const localSaved = saveToLocalStorage(progressData);
        
        // Then save to Firestore if user is authenticated
        let firestoreSaved = true;
        if (currentUser?.uid) {
          firestoreSaved = await saveToFirestore(progressData);
        }

        if (localSaved && firestoreSaved) {
          setSaveStatus('saved');
        } else {
          setSaveStatus('error');
          setError('Failed to save progress');
        }
      } catch (error) {
        console.error('Error in debounced save:', error);
        setSaveStatus('error');
        setError(error.message);
      } finally {
        savingRef.current = false;
      }
    }, 2000), // 2 second debounce
    [saveToLocalStorage, saveToFirestore, currentUser?.uid]
  );

  // Load initial progress
  useEffect(() => {
    const loadProgress = async () => {
      setIsLoading(true);
      
      try {
        // Try Firestore first for authenticated users
        let loadedProgress = null;
        if (currentUser?.uid) {
          loadedProgress = await loadFromFirestore();
        }
        
        // Fallback to localStorage
        if (!loadedProgress) {
          loadedProgress = loadFromLocalStorage();
        }

        setProgress(loadedProgress);
      } catch (error) {
        console.error('Error loading progress:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (userType) {
      loadProgress();
    }
  }, [userType, currentUser?.uid, loadFromFirestore, loadFromLocalStorage]);

  // Save progress
  const saveProgress = useCallback((step, formData, metadata = {}) => {
    const progressData = {
      userType,
      currentStep: step,
      formData: { ...formData },
      metadata: {
        ...metadata,
        lastSaved: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      },
      timestamp: Date.now(),
      version: '1.0'
    };

    setProgress(progressData);
    debouncedSave(progressData);
  }, [userType, debouncedSave]);

  // Clear progress
  const clearProgress = useCallback(async () => {
    try {
      // Clear localStorage
      localStorage.removeItem(getStorageKey());
      
      // Clear Firestore
      if (currentUser?.uid) {
        const docRef = doc(db, 'user_onboarding_progress', getFirestoreKey());
        await deleteDoc(docRef);
      }
      
      setProgress(null);
      setSaveStatus('saved');
      setError(null);
    } catch (error) {
      console.error('Error clearing progress:', error);
      setError(error.message);
    }
  }, [getStorageKey, getFirestoreKey, currentUser?.uid]);

  // Check if progress exists and is valid
  const hasValidProgress = useCallback(() => {
    if (!progress) return false;
    
    // Check if progress is not too old
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    if (progress.timestamp < sevenDaysAgo) {
      return false;
    }
    
    // Check if progress has required fields
    return progress.userType === userType && 
           progress.currentStep && 
           progress.formData;
  }, [progress, userType]);

  // Get progress summary
  const getProgressSummary = useCallback(() => {
    if (!hasValidProgress()) return null;

    const now = Date.now();
    const elapsed = now - progress.timestamp;
    const hoursAgo = Math.floor(elapsed / (1000 * 60 * 60));
    const daysAgo = Math.floor(hoursAgo / 24);

    let timeAgo = '';
    if (daysAgo > 0) {
      timeAgo = `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`;
    } else if (hoursAgo > 0) {
      timeAgo = `${hoursAgo} hour${hoursAgo > 1 ? 's' : ''} ago`;
    } else {
      timeAgo = 'less than an hour ago';
    }

    return {
      step: progress.currentStep,
      timeAgo,
      completionPercentage: calculateCompletionPercentage(progress.currentStep, userType),
      lastSaved: progress.metadata?.lastSaved,
      deviceInfo: progress.metadata?.userAgent ? 'Different device' : 'This device'
    };
  }, [hasValidProgress, progress]);

  // Calculate completion percentage based on user type
  const calculateCompletionPercentage = (currentStep, userType) => {
    const totalSteps = {
      landlord: 4,
      contractor: 5,
      tenant: 3
    };

    const total = totalSteps[userType] || 3;
    return Math.round((currentStep / total) * 100);
  };

  // Force sync with Firestore
  const syncWithFirestore = useCallback(async () => {
    if (!currentUser?.uid || !progress) return false;

    setSaveStatus('saving');
    try {
      const success = await saveToFirestore(progress);
      if (success) {
        setSaveStatus('saved');
        return true;
      } else {
        setSaveStatus('error');
        setError('Failed to sync with cloud storage');
        return false;
      }
    } catch (error) {
      setSaveStatus('error');
      setError(error.message);
      return false;
    }
  }, [currentUser?.uid, progress, saveToFirestore]);

  return {
    // State
    progress,
    saveStatus,
    error,
    isLoading,
    
    // Methods
    saveProgress,
    clearProgress,
    hasValidProgress,
    getProgressSummary,
    syncWithFirestore,
    
    // Computed values
    canResume: hasValidProgress(),
    completionPercentage: progress ? calculateCompletionPercentage(progress.currentStep, userType) : 0
  };
}; 