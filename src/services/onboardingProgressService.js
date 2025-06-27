import { formatDistanceToNow } from 'date-fns';

/**
 * Onboarding Progress Service
 * Handles step persistence, progress recovery, and visual progress indicators
 */
class OnboardingProgressService {
  constructor() {
    this.storagePrefix = 'onboarding_progress_';
    this.expiryDays = 7; // Progress expires after 7 days
  }

  /**
   * Get storage key for a user's onboarding type
   */
  getStorageKey(userId, onboardingType) {
    return `${this.storagePrefix}${userId}_${onboardingType}`;
  }

  /**
   * Save onboarding progress to localStorage
   */
  saveProgress(userId, onboardingType, progressData) {
    try {
      const storageKey = this.getStorageKey(userId, onboardingType);
      const data = {
        ...progressData,
        timestamp: Date.now(),
        expiresAt: Date.now() + (this.expiryDays * 24 * 60 * 60 * 1000),
        deviceInfo: this.getDeviceInfo(),
        userAgent: navigator.userAgent
      };

      localStorage.setItem(storageKey, JSON.stringify(data));
      
      // Also save to sessionStorage as backup
      sessionStorage.setItem(`session_${storageKey}`, JSON.stringify(data));
      
      console.log('Onboarding progress saved:', { userId, onboardingType, step: progressData.currentStep });
      return true;
    } catch (error) {
      console.error('Failed to save onboarding progress:', error);
      return false;
    }
  }

  /**
   * Load onboarding progress from storage
   */
  loadProgress(userId, onboardingType) {
    try {
      const storageKey = this.getStorageKey(userId, onboardingType);
      
      // Try localStorage first, then sessionStorage
      let data = localStorage.getItem(storageKey);
      if (!data) {
        data = sessionStorage.getItem(`session_${storageKey}`);
      }
      
      if (!data) {
        return null;
      }

      const progressData = JSON.parse(data);
      
      // Check if progress has expired
      if (progressData.expiresAt && Date.now() > progressData.expiresAt) {
        this.clearProgress(userId, onboardingType);
        return null;
      }

      return progressData;
    } catch (error) {
      console.error('Failed to load onboarding progress:', error);
      return null;
    }
  }

  /**
   * Clear onboarding progress
   */
  clearProgress(userId, onboardingType) {
    try {
      const storageKey = this.getStorageKey(userId, onboardingType);
      localStorage.removeItem(storageKey);
      sessionStorage.removeItem(`session_${storageKey}`);
      console.log('Onboarding progress cleared:', { userId, onboardingType });
      return true;
    } catch (error) {
      console.error('Failed to clear onboarding progress:', error);
      return false;
    }
  }

  /**
   * Check if there's recoverable progress
   */
  hasRecoverableProgress(userId, onboardingType) {
    const progress = this.loadProgress(userId, onboardingType);
    return progress && progress.currentStep > 1;
  }

  /**
   * Get progress summary for recovery banner
   */
  getProgressSummary(userId, onboardingType) {
    const progress = this.loadProgress(userId, onboardingType);
    
    if (!progress) {
      return null;
    }

    const totalSteps = progress.totalSteps || 6;
    const completionPercentage = Math.round(((progress.currentStep - 1) / totalSteps) * 100);
    
    return {
      step: progress.currentStep,
      totalSteps,
      completionPercentage,
      timeAgo: formatDistanceToNow(new Date(progress.timestamp), { addSuffix: true }),
      deviceInfo: progress.deviceInfo,
      formData: progress.formData,
      stepCompletion: progress.stepCompletion,
      timestamp: progress.timestamp
    };
  }

  /**
   * Calculate completion percentage
   */
  calculateCompletionPercentage(currentStep, totalSteps = 6, stepCompletion = {}) {
    // Base percentage from current step
    const basePercentage = ((currentStep - 1) / totalSteps) * 100;
    
    // Bonus percentage for completed steps
    const completedSteps = Object.values(stepCompletion).filter(Boolean).length;
    const bonusPercentage = (completedSteps / totalSteps) * 10; // Up to 10% bonus
    
    return Math.min(100, Math.round(basePercentage + bonusPercentage));
  }

  /**
   * Get device info for progress tracking
   */
  getDeviceInfo() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTablet = /iPad|Android(?=.*Mobile)/i.test(navigator.userAgent);
    
    if (isTablet) return 'Tablet';
    if (isMobile) return 'Mobile';
    return 'Desktop';
  }

  /**
   * Auto-save progress with debouncing
   */
  createAutoSaver(userId, onboardingType, debounceMs = 2000) {
    let timeoutId = null;
    
    return (progressData) => {
      // Clear previous timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Set new timeout
      timeoutId = setTimeout(() => {
        this.saveProgress(userId, onboardingType, progressData);
      }, debounceMs);
    };
  }

  /**
   * Validate progress data before saving
   */
  validateProgressData(progressData) {
    const required = ['currentStep', 'formData'];
    const missing = required.filter(field => !progressData.hasOwnProperty(field));
    
    if (missing.length > 0) {
      console.warn('Progress data missing required fields:', missing);
      return false;
    }
    
    if (progressData.currentStep < 1) {
      console.warn('Invalid current step:', progressData.currentStep);
      return false;
    }
    
    return true;
  }

  /**
   * Migrate old progress format to new format
   */
  migrateProgressFormat(progressData) {
    // Handle old format migrations here if needed
    if (!progressData.timestamp) {
      progressData.timestamp = Date.now();
    }
    
    if (!progressData.expiresAt) {
      progressData.expiresAt = Date.now() + (this.expiryDays * 24 * 60 * 60 * 1000);
    }
    
    return progressData;
  }

  /**
   * Get all saved progress for cleanup/debugging
   */
  getAllSavedProgress() {
    const progressItems = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.storagePrefix)) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          progressItems.push({ key, data });
        } catch (error) {
          console.warn('Failed to parse progress data for key:', key);
        }
      }
    }
    
    return progressItems;
  }

  /**
   * Cleanup expired progress data
   */
  cleanupExpiredProgress() {
    const progressItems = this.getAllSavedProgress();
    let cleanedCount = 0;
    
    progressItems.forEach(({ key, data }) => {
      if (data.expiresAt && Date.now() > data.expiresAt) {
        localStorage.removeItem(key);
        sessionStorage.removeItem(`session_${key}`);
        cleanedCount++;
      }
    });
    
    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired progress items`);
    }
    
    return cleanedCount;
  }

  /**
   * Get progress statistics for debugging
   */
  getProgressStats() {
    const progressItems = this.getAllSavedProgress();
    const now = Date.now();
    
    const stats = {
      total: progressItems.length,
      active: 0,
      expired: 0,
      byType: {},
      byDevice: {}
    };
    
    progressItems.forEach(({ data }) => {
      // Count active vs expired
      if (data.expiresAt && now > data.expiresAt) {
        stats.expired++;
      } else {
        stats.active++;
      }
      
      // Count by onboarding type (extracted from key)
      const typeMatch = data.onboardingType || 'unknown';
      stats.byType[typeMatch] = (stats.byType[typeMatch] || 0) + 1;
      
      // Count by device
      const device = data.deviceInfo || 'unknown';
      stats.byDevice[device] = (stats.byDevice[device] || 0) + 1;
    });
    
    return stats;
  }
}

// Create singleton instance
const onboardingProgressService = new OnboardingProgressService();

export default onboardingProgressService; 