import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

// Define the shape of a notification
interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'property_invite' | 'ticket_update';
  status: 'read' | 'unread';
  createdAt: Date; // Or use Firestore Timestamp if directly from Firestore
  relatedData?: Record<string, any>;
}

// Define the context type
interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'status'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  isLoading: boolean;
  error: Error | null;
}

// Create the context with a default value (or null)
export const NotificationContext = createContext<NotificationContextType | null>(null);

// Custom hook for easy consumption
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Provider component props
interface NotificationProviderProps {
  children: ReactNode;
}

// Provider component implementation (Basic Placeholder)
export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // TODO: Implement actual logic to fetch notifications (e.g., from Firebase)
  // useEffect(() => {
  //   setIsLoading(true);
  //   // Fetch notifications for the current user
  //   // Example: dataService.subscribeToNotifications(setNotifications, setError);
  //   setIsLoading(false);
  //   return () => { /* unsubscribe */ }; 
  // }, []);

  const addNotification = useCallback((notificationData: Omit<Notification, 'id' | 'createdAt' | 'status'>) => {
    const newNotification: Notification = {
      ...notificationData,
      id: `temp-${Date.now()}-${Math.random()}`,
      createdAt: new Date(),
      status: 'unread',
    };
    setNotifications(prev => [newNotification, ...prev]);
    // TODO: Add logic to persist the notification if needed
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => (n.id === id ? { ...n, status: 'read' } : n))
    );
    // TODO: Update notification status in the backend
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, status: 'read' }))
    );
    // TODO: Update all notification statuses in the backend
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    // TODO: Delete notification from the backend
  }, []);

  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  const value = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    isLoading,
    error,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}; 