import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import ContractorJobNotificationService, { 
  ContractorJobNotification, 
  JobNotificationPreferences 
} from '../services/firestore/contractorJobNotificationService';

const notificationService = new ContractorJobNotificationService();

export const useContractorJobNotifications = (unreadOnly: boolean = false) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<ContractorJobNotification[]>([]);
  const [preferences, setPreferences] = useState<JobNotificationPreferences | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!currentUser?.uid) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Subscribe to job notifications
      const unsubscribe = notificationService.subscribeToJobNotifications(
        currentUser.uid,
        (newNotifications) => {
          setNotifications(newNotifications);
          const count = newNotifications.filter(n => !n.read).length;
          setUnreadCount(count);
          setLoading(false);
        },
        unreadOnly
      );

      // Get initial unread count
      notificationService.getUnreadCount(currentUser.uid)
        .then(count => setUnreadCount(count))
        .catch(err => console.error('Error getting unread count:', err));

      // Get notification preferences
      notificationService.getNotificationPreferences(currentUser.uid)
        .then(prefs => {
          setPreferences(prefs);
          if (!prefs) {
            // Create default preferences if none exist
            notificationService.createDefaultPreferences(currentUser.uid)
              .then(() => {
                return notificationService.getNotificationPreferences(currentUser.uid);
              })
              .then(defaultPrefs => setPreferences(defaultPrefs))
              .catch(err => console.error('Error creating default preferences:', err));
          }
        })
        .catch(err => console.error('Error getting preferences:', err));

      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up notifications listener:', err);
      setError(err as Error);
      setLoading(false);
    }
  }, [currentUser?.uid, unreadOnly]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationService.markJobNotificationAsRead(notificationId);
      
      // Update local state immediately for better UX
      setNotifications((prev: ContractorJobNotification[]) => 
        prev.map((n: ContractorJobNotification) => n.id === notificationId ? { ...n, read: true, readAt: new Date() } : n)
      );
      setUnreadCount((prev: number) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError(err as Error);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!currentUser?.uid) return;

    try {
      await notificationService.markAllJobNotificationsAsRead(currentUser.uid);
      
      // Update local state immediately
      setNotifications((prev: ContractorJobNotification[]) => 
        prev.map((n: ContractorJobNotification) => ({ ...n, read: true, readAt: new Date() }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      setError(err as Error);
    }
  }, [currentUser?.uid]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await notificationService.deleteJobNotification(notificationId);
      
      // Update local state immediately
      setNotifications((prev: ContractorJobNotification[]) => prev.filter((n: ContractorJobNotification) => n.id !== notificationId));
      setUnreadCount((prev: number) => {
        const notification = notifications.find((n: ContractorJobNotification) => n.id === notificationId);
        return notification && !notification.read ? Math.max(0, prev - 1) : prev;
      });
    } catch (err) {
      console.error('Error deleting notification:', err);
      setError(err as Error);
    }
  }, [notifications]);

  // Update notification preferences
  const updatePreferences = useCallback(async (newPreferences: Partial<JobNotificationPreferences>) => {
    if (!currentUser?.uid) return;

    try {
      await notificationService.updateNotificationPreferences(currentUser.uid, newPreferences);
      setPreferences((prev: JobNotificationPreferences | null) => prev ? { ...prev, ...newPreferences } : null);
    } catch (err) {
      console.error('Error updating preferences:', err);
      setError(err as Error);
    }
  }, [currentUser?.uid]);

  // Get notifications by type
  const getNotificationsByType = useCallback((type: ContractorJobNotification['type']) => {
    return notifications.filter((n: ContractorJobNotification) => n.type === type);
  }, [notifications]);

  // Get high priority notifications
  const getHighPriorityNotifications = useCallback(() => {
    return notifications.filter((n: ContractorJobNotification) => n.priority === 'high' || n.priority === 'urgent');
  }, [notifications]);

  // Check if user should receive notifications
  const shouldReceiveNotifications = useCallback(async () => {
    if (!currentUser?.uid) return false;
    return await notificationService.shouldReceiveNotification(currentUser.uid);
  }, [currentUser?.uid]);

  return {
    notifications,
    preferences,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updatePreferences,
    getNotificationsByType,
    getHighPriorityNotifications,
    shouldReceiveNotifications,
    // Utility functions
    hasUnreadNotifications: unreadCount > 0,
    hasHighPriorityNotifications: getHighPriorityNotifications().length > 0,
    bidAcceptedNotifications: getNotificationsByType('bid_accepted'),
    bidRejectedNotifications: getNotificationsByType('bid_rejected'),
    jobAssignedNotifications: getNotificationsByType('job_assigned'),
    jobCompletedNotifications: getNotificationsByType('job_completed'),
  };
}; 