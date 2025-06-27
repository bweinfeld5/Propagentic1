import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

const ConnectionContext = createContext();

export const useConnection = () => {
  const context = useContext(ConnectionContext);
  if (!context) {
    throw new Error('useConnection must be used within a ConnectionProvider');
  }
  return context;
};

export const ConnectionProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionQuality, setConnectionQuality] = useState('good'); // good, slow, poor
  const [lastConnectionCheck, setLastConnectionCheck] = useState(Date.now());
  const [connectionSpeed, setConnectionSpeed] = useState(null);
  const [retryAttempts, setRetryAttempts] = useState(0);
  
  const connectionCheckRef = useRef();
  const speedTestRef = useRef();

  // Monitor online/offline events
  useEffect(() => {
    const handleOnline = () => {
      console.log('Connection restored');
      setIsOnline(true);
      setRetryAttempts(0);
      checkConnectionQuality();
    };

    const handleOffline = () => {
      console.log('Connection lost');
      setIsOnline(false);
      setConnectionQuality('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial connection quality check
    checkConnectionQuality();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Periodic connection quality monitoring
  useEffect(() => {
    if (isOnline) {
      const interval = setInterval(() => {
        checkConnectionQuality();
      }, 30000); // Check every 30 seconds when online

      return () => clearInterval(interval);
    }
  }, [isOnline]);

  const checkConnectionQuality = async () => {
    if (!isOnline) return;

    try {
      const startTime = Date.now();
      
      // Use a simple HEAD request to your own domain or a reliable CDN
      const response = await fetch('https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js', {
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      setConnectionSpeed(duration);
      setLastConnectionCheck(Date.now());
      
      // Determine connection quality based on response time
      if (duration < 200) {
        setConnectionQuality('excellent');
      } else if (duration < 500) {
        setConnectionQuality('good');
      } else if (duration < 1000) {
        setConnectionQuality('fair');
      } else {
        setConnectionQuality('poor');
      }
      
      console.log(`Connection check: ${duration}ms - ${connectionQuality}`);
      
    } catch (error) {
      console.warn('Connection quality check failed:', error);
      
      // Fallback: Try a simpler connection test
      try {
        const img = new Image();
        const startTime = Date.now();
        
        img.onload = () => {
          const duration = Date.now() - startTime;
          setConnectionSpeed(duration);
          setConnectionQuality(duration < 1000 ? 'fair' : 'poor');
          setLastConnectionCheck(Date.now());
        };
        
        img.onerror = () => {
          setConnectionQuality('poor');
          setLastConnectionCheck(Date.now());
        };
        
        // Use a small image from a CDN
        img.src = `https://www.google.com/favicon.ico?_=${Date.now()}`;
        
      } catch (fallbackError) {
        console.error('Fallback connection test failed:', fallbackError);
        setConnectionQuality('unknown');
      }
    }
  };

  const forceConnectionCheck = async () => {
    await checkConnectionQuality();
  };

  const incrementRetryAttempts = () => {
    setRetryAttempts(prev => prev + 1);
  };

  const resetRetryAttempts = () => {
    setRetryAttempts(0);
  };

  // Provide connection recommendations
  const getConnectionRecommendation = () => {
    if (!isOnline) {
      return {
        message: 'You are currently offline. Please check your internet connection.',
        action: 'retry',
        severity: 'error'
      };
    }

    switch (connectionQuality) {
      case 'poor':
        return {
          message: 'Your connection is slow. Some features may take longer to load.',
          action: 'wait',
          severity: 'warning'
        };
      case 'fair':
        return {
          message: 'Your connection is slower than usual.',
          action: 'continue',
          severity: 'info'
        };
      case 'good':
      case 'excellent':
      default:
        return {
          message: 'Connection is stable.',
          action: 'continue',
          severity: 'success'
        };
    }
  };

  // Get retry delay based on connection quality and retry attempts
  const getRetryDelay = () => {
    const baseDelay = 1000; // 1 second
    const qualityMultiplier = {
      'excellent': 1,
      'good': 1.5,
      'fair': 2,
      'poor': 3,
      'offline': 5
    };
    
    const multiplier = qualityMultiplier[connectionQuality] || 2;
    const exponentialDelay = Math.min(
      30000, // Max 30 seconds
      baseDelay * Math.pow(2, retryAttempts) * multiplier
    );
    
    return exponentialDelay;
  };

  const value = {
    // Connection state
    isOnline,
    connectionQuality,
    connectionSpeed,
    lastConnectionCheck,
    retryAttempts,
    
    // Connection actions
    checkConnectionQuality: forceConnectionCheck,
    incrementRetryAttempts,
    resetRetryAttempts,
    
    // Helper functions
    getConnectionRecommendation,
    getRetryDelay,
    
    // Connection state checks
    isConnected: isOnline,
    isSlowConnection: connectionQuality === 'poor' || connectionQuality === 'fair',
    isOffline: !isOnline,
    shouldReduceRequests: connectionQuality === 'poor' || !isOnline,
    
    // Quality indicators
    qualityScore: {
      'excellent': 4,
      'good': 3,
      'fair': 2,
      'poor': 1,
      'offline': 0,
      'unknown': 1
    }[connectionQuality] || 1
  };

  return (
    <ConnectionContext.Provider value={value}>
      {children}
    </ConnectionContext.Provider>
  );
};

export default ConnectionContext; 