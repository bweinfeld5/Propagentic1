// PWA Utilities for Mobile App Foundation
import { toast } from 'react-hot-toast';

/**
 * Check if the app is running as a PWA
 */
export const isPWA = () => {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://')
  );
};

/**
 * Check if the app is running on mobile
 */
export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

/**
 * Check if the device supports PWA installation
 */
export const canInstallPWA = () => {
  // Check for beforeinstallprompt event support
  return 'onbeforeinstallprompt' in window;
};

/**
 * PWA Installation Manager
 */
class PWAInstallManager {
  constructor() {
    this.deferredPrompt = null;
    this.isInstallable = false;
    this.listeners = [];
    
    this.init();
  }

  init() {
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      
      // Store the event for later use
      this.deferredPrompt = e;
      this.isInstallable = true;
      
      // Notify listeners
      this.notifyListeners('installable', true);
    });

    // Listen for app installation
    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.isInstallable = false;
      
      // Show success message
      toast.success('PropAgentic installed successfully!', {
        duration: 4000,
        icon: '📱',
      });
      
      // Notify listeners
      this.notifyListeners('installed', true);
    });

    // Check if already installed
    if (isPWA()) {
      this.notifyListeners('running-as-pwa', true);
    }
  }

  // Add listener for PWA events
  addListener(callback) {
    this.listeners.push(callback);
  }

  // Remove listener
  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  // Notify all listeners
  notifyListeners(event, data) {
    this.listeners.forEach(listener => listener(event, data));
  }

  // Show install prompt
  async showInstallPrompt() {
    if (!this.deferredPrompt) {
      throw new Error('Install prompt not available');
    }

    try {
      // Show the install prompt
      this.deferredPrompt.prompt();
      
      // Wait for the user to respond
      const result = await this.deferredPrompt.userChoice;
      
      if (result.outcome === 'accepted') {
        console.log('User accepted the install prompt');
        this.notifyListeners('install-accepted', true);
      } else {
        console.log('User dismissed the install prompt');
        this.notifyListeners('install-dismissed', true);
      }
      
      // Clear the prompt
      this.deferredPrompt = null;
      this.isInstallable = false;
      
      return result.outcome;
    } catch (error) {
      console.error('Error showing install prompt:', error);
      throw error;
    }
  }

  // Check if app can be installed
  canInstall() {
    return this.isInstallable && this.deferredPrompt !== null;
  }

  // Get installation instructions for different platforms
  getInstallInstructions() {
    const userAgent = navigator.userAgent;
    
    if (/iPhone|iPad|iPod/.test(userAgent)) {
      return {
        platform: 'iOS',
        steps: [
          'Tap the Share button in Safari',
          'Scroll down and tap "Add to Home Screen"',
          'Tap "Add" to install PropAgentic'
        ],
        icon: '🍎'
      };
    } else if (/Android/.test(userAgent)) {
      return {
        platform: 'Android',
        steps: [
          'Tap the menu button (three dots)',
          'Select "Add to Home screen"',
          'Tap "Add" to install PropAgentic'
        ],
        icon: '🤖'
      };
    } else {
      return {
        platform: 'Desktop',
        steps: [
          'Click the install icon in the address bar',
          'Or use the browser menu to install',
          'PropAgentic will open as a desktop app'
        ],
        icon: '💻'
      };
    }
  }
}

// Create singleton instance
export const pwaInstallManager = new PWAInstallManager();

/**
 * Service Worker Utilities
 */
export const serviceWorkerUtils = {
  // Register service worker
  async register() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('SW registered: ', registration);
        return registration;
      } catch (registrationError) {
        console.log('SW registration failed: ', registrationError);
        throw registrationError;
      }
    }
  },

  // Update service worker
  async update() {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
      }
    }
  },

  // Check for updates
  async checkForUpdates() {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New update available
              toast('App update available! Refresh to get the latest version.', {
                duration: 8000,
                icon: '🔄',
              });
            }
          });
        });
      }
    }
  }
};

/**
 * Offline Detection
 */
export class OfflineManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.listeners = [];
    
    this.init();
  }

  init() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners('online', true);
      
      toast.success('Back online! 🌐', {
        duration: 3000,
      });
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners('offline', true);
      
      toast.error('You\'re offline. Some features may be limited.', {
        duration: 5000,
        icon: '📡',
      });
    });
  }

  addListener(callback) {
    this.listeners.push(callback);
  }

  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  notifyListeners(event, data) {
    this.listeners.forEach(listener => listener(event, data));
  }

  getStatus() {
    return {
      isOnline: this.isOnline,
      isOffline: !this.isOnline
    };
  }
}

export const offlineManager = new OfflineManager();

/**
 * App Badges (for supported browsers)
 */
export const appBadgeUtils = {
  // Set app badge with count
  setBadge(count = 0) {
    if ('setAppBadge' in navigator) {
      navigator.setAppBadge(count).catch(err => {
        console.log('Error setting app badge:', err);
      });
    }
  },

  // Clear app badge
  clearBadge() {
    if ('clearAppBadge' in navigator) {
      navigator.clearAppBadge().catch(err => {
        console.log('Error clearing app badge:', err);
      });
    }
  }
};

/**
 * Screen Wake Lock (prevent screen from turning off)
 */
export const wakeLockUtils = {
  wakeLock: null,

  // Request wake lock
  async request() {
    if ('wakeLock' in navigator) {
      try {
        this.wakeLock = await navigator.wakeLock.request('screen');
        console.log('Screen wake lock acquired');
        
        this.wakeLock.addEventListener('release', () => {
          console.log('Screen wake lock released');
        });
        
        return this.wakeLock;
      } catch (err) {
        console.log('Error requesting wake lock:', err);
        throw err;
      }
    }
  },

  // Release wake lock
  async release() {
    if (this.wakeLock) {
      await this.wakeLock.release();
      this.wakeLock = null;
    }
  }
};

/**
 * Share API utilities
 */
export const shareUtils = {
  // Check if Web Share API is supported
  canShare() {
    return 'share' in navigator;
  },

  // Share content
  async share(data) {
    if (this.canShare()) {
      try {
        await navigator.share(data);
        return true;
      } catch (err) {
        console.log('Error sharing:', err);
        return false;
      }
    }
    return false;
  },

  // Share property
  async shareProperty(property) {
    const shareData = {
      title: `PropAgentic - ${property.name}`,
      text: `Check out this property: ${property.description}`,
      url: `${window.location.origin}/properties/${property.id}`
    };

    return this.share(shareData);
  },

  // Share maintenance request
  async shareMaintenanceRequest(request) {
    const shareData = {
      title: 'PropAgentic - Maintenance Request',
      text: `Maintenance request: ${request.title}`,
      url: `${window.location.origin}/maintenance/${request.id}`
    };

    return this.share(shareData);
  }
};

/**
 * Haptic Feedback (for supported devices)
 */
export const hapticUtils = {
  // Light haptic feedback
  light() {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },

  // Medium haptic feedback
  medium() {
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  },

  // Heavy haptic feedback
  heavy() {
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
  },

  // Success pattern
  success() {
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100, 50, 300]);
    }
  },

  // Error pattern
  error() {
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }
  }
};

/**
 * Device Orientation utilities
 */
export const orientationUtils = {
  // Lock orientation (if supported)
  async lockPortrait() {
    if ('orientation' in screen && 'lock' in screen.orientation) {
      try {
        await screen.orientation.lock('portrait');
        return true;
      } catch (err) {
        console.log('Error locking orientation:', err);
        return false;
      }
    }
    return false;
  },

  // Unlock orientation
  unlock() {
    if ('orientation' in screen && 'unlock' in screen.orientation) {
      screen.orientation.unlock();
    }
  },

  // Get current orientation
  getOrientation() {
    if ('orientation' in screen) {
      return screen.orientation.angle;
    }
    return window.orientation || 0;
  }
};

/**
 * Performance monitoring for PWA
 */
export const performanceUtils = {
  // Measure page load time
  getPageLoadTime() {
    if ('performance' in window) {
      const perfData = performance.getEntriesByType('navigation')[0];
      return perfData ? perfData.loadEventEnd - perfData.fetchStart : 0;
    }
    return 0;
  },

  // Measure time to interactive
  getTimeToInteractive() {
    if ('performance' in window) {
      const perfData = performance.getEntriesByType('navigation')[0];
      return perfData ? perfData.domInteractive - perfData.fetchStart : 0;
    }
    return 0;
  },

  // Log performance metrics
  logPerformanceMetrics() {
    console.log('Performance Metrics:', {
      pageLoadTime: this.getPageLoadTime(),
      timeToInteractive: this.getTimeToInteractive(),
      isPWA: isPWA(),
      isOnline: navigator.onLine
    });
  }
};

// Export all utilities as default
export default {
  isPWA,
  isMobile,
  canInstallPWA,
  pwaInstallManager,
  serviceWorkerUtils,
  offlineManager,
  appBadgeUtils,
  wakeLockUtils,
  shareUtils,
  hapticUtils,
  orientationUtils,
  performanceUtils
}; 