import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext.jsx';
import { db } from '../firebase/config';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc, limit } from 'firebase/firestore';

// Define the shape of a notification
interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'property_invite' | 'ticket_update' | 'assignment' | 'status_change' | 'request_completed';
  status: 'read' | 'unread';
  createdAt: Date;
  relatedData?: Record<string, any>;
  userId?: string;
  userRole?: string;
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

// Provider component implementation
export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Subscribe to user's notifications from Firestore
  useEffect(() => {
    if (!currentUser?.uid) {
      setNotifications([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Query notifications for the current user
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const notificationData: Notification[] = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              title: data.title || 'Notification',
              message: data.message || '',
              type: data.type || 'info',
              status: data.read ? 'read' : 'unread',
              createdAt: data.createdAt?.toDate() || new Date(),
              relatedData: data.data || data.relatedData || {},
              userId: data.userId,
              userRole: data.userRole
            };
          });
          
          setNotifications(notificationData);
          setIsLoading(false);
        },
        (err) => {
          console.error('Error fetching notifications:', err);
          setError(err as Error);
          setIsLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up notifications listener:', err);
      setError(err as Error);
      setIsLoading(false);
    }
  }, [currentUser?.uid]);

  const addNotification = useCallback((notificationData: Omit<Notification, 'id' | 'createdAt' | 'status'>) => {
    // For local notifications only - real notifications come from Firestore
    const newNotification: Notification = {
      ...notificationData,
      id: `temp-${Date.now()}-${Math.random()}`,
      createdAt: new Date(),
      status: 'unread',
    };
    setNotifications(prev => [newNotification, ...prev]);
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      // Update in Firestore
      const notificationRef = doc(db, 'notifications', id);
      await updateDoc(notificationRef, { read: true });
      
      // Update local state immediately for better UX
      setNotifications(prev => 
        prev.map(n => (n.id === id ? { ...n, status: 'read' } : n))
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError(err as Error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      // Update all unread notifications in Firestore
      const unreadNotifications = notifications.filter(n => n.status === 'unread');
      const updatePromises = unreadNotifications.map(notification => {
        const notificationRef = doc(db, 'notifications', notification.id);
        return updateDoc(notificationRef, { read: true });
      });
      
      await Promise.all(updatePromises);
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, status: 'read' }))
      );
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      setError(err as Error);
    }
  }, [notifications]);

  const removeNotification = useCallback(async (id: string) => {
    try {
      // Delete from Firestore
      const notificationRef = doc(db, 'notifications', id);
      await deleteDoc(notificationRef);
      
      // Update local state immediately
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Error removing notification:', err);
      setError(err as Error);
    }
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