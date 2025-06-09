import React, { createContext, useState, useEffect, useContext, useRef } from 'react';

// Create Connection Context
export const ConnectionContext = createContext({
  isOnline: true,
  isFirestoreAvailable: true,
  lastOnline: null,
  offlineDuration: 0
});

// Custom hook to use connection status
export const useConnection = () => useContext(ConnectionContext);

// Connection Provider Component
export const ConnectionProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isFirestoreAvailable, setIsFirestoreAvailable] = useState(true);
  const [lastOnline, setLastOnline] = useState(() => isOnline ? new Date() : null);
  const [offlineDuration, setOfflineDuration] = useState(0);
  const [pingIntervalId, setPingIntervalId] = useState(null);
  const previousIsOnline = useRef(isOnline);

  // Initialize Firestore availability checking
  const checkFirestoreAvailability = async () => {
    try {
      // Placeholder for an actual Firestore availability check
      // In a real implementation, you might try to fetch a small document
      // or perform a simple query to verify the service is responsive
      return true;
    } catch (error) {
      console.error('Firestore availability check failed:', error);
      return false;
    }
  };

  // Calculate time spent offline
  useEffect(() => {
    let interval = null;
    if (!isOnline && lastOnline) {
      interval = setInterval(() => {
        const now = new Date();
        const duration = Math.floor((now.getTime() - lastOnline.getTime()) / 1000);
        setOfflineDuration(duration);
      }, 1000);
    } else {
      setOfflineDuration(0);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isOnline, lastOnline]);

  // Effect specifically for handling online/offline state changes
  useEffect(() => {
    if (isOnline && !previousIsOnline.current) {
      console.log('Transitioned to online state.');
      setLastOnline(new Date());
      setOfflineDuration(0);
    }

    previousIsOnline.current = isOnline;
  }, [isOnline]);

  // Set up network status listeners and Firestore check interval
  useEffect(() => {
    const handleOnline = () => {
      console.log('Network connection restored');
      setIsOnline(true);

      checkFirestoreAvailability().then(available => {
        setIsFirestoreAvailable(available);
      });
    };

    const handleOffline = () => {
      console.log('Network connection lost');
      setIsOnline(false);
      setIsFirestoreAvailable(false);
    };

    if (pingIntervalId) {
      clearInterval(pingIntervalId);
      setPingIntervalId(null);
    }

    if (isOnline) {
      const intervalId = setInterval(async () => {
        const available = await checkFirestoreAvailability();
        setIsFirestoreAvailable(prevState => prevState === available ? prevState : available);
      }, 30000);
      setPingIntervalId(intervalId);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    checkFirestoreAvailability().then(available => {
      setIsFirestoreAvailable(prevState => prevState === available ? prevState : available);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (pingIntervalId) {
        clearInterval(pingIntervalId);
      }
    };
  }, [isOnline]);

  // Context value to be provided
  const value = {
    isOnline,
    isFirestoreAvailable,
    lastOnline,
    offlineDuration,
    getOfflineStatus: () => {
      if (isOnline && isFirestoreAvailable) return 'online';
      if (isOnline && !isFirestoreAvailable) return 'service-disruption';
      return 'offline';
    },
    getOfflineDurationText: () => {
      if (offlineDuration < 60) return `${offlineDuration} seconds`;
      if (offlineDuration < 3600) return `${Math.floor(offlineDuration / 60)} minutes`;
      return `${Math.floor(offlineDuration / 3600)} hours`;
    }
  };

  return (
    <ConnectionContext.Provider value={value}>
      {children}
    </ConnectionContext.Provider>
  );
};

export default ConnectionProvider; 