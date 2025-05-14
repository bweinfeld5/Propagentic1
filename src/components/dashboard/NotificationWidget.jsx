import React from 'react';
import NotificationCenter from '../notifications/NotificationCenter';
import { useNotifications } from '../../context/NotificationContext';

/**
 * NotificationWidget displays the NotificationCenter as a dashboard widget
 * Includes a loading state and only shows if there are notifications
 */
const NotificationWidget = () => {
  const { notifications, loading } = useNotifications();

  // Don't render anything if there are no notifications or while loading
  if (loading || notifications.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <NotificationCenter />
    </div>
  );
};

export default NotificationWidget; 