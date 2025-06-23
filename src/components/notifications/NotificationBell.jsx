import React, { useState, useEffect } from 'react';
import { BellIcon, BellAlertIcon } from '@heroicons/react/24/outline';
import { useNotifications } from '../../context/NotificationContext';

/**
 * NotificationBell component that shows unread notification count
 * and animates when new notifications arrive
 */
const NotificationBell = ({ onClick }) => {
  const { notifications, unreadCount } = useNotifications();
  const [animate, setAnimate] = useState(false);
  const [prevCount, setPrevCount] = useState(unreadCount);

  // Trigger animation when new notifications arrive
  useEffect(() => {
    if (unreadCount > prevCount) {
      setAnimate(true);
      const timer = setTimeout(() => setAnimate(false), 2000);
      return () => clearTimeout(timer);
    }
    setPrevCount(unreadCount);
  }, [unreadCount, prevCount]);

  // Check if there are high urgency notifications
  const hasUrgentNotifications = notifications.some(
    notification => notification.type === 'high_urgency' && !notification.read
  );

  return (
    <button
      aria-label="Notifications"
      className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
      onClick={onClick}
    >
      <div className={`transition-transform ${animate ? 'animate-wiggle' : ''}`}>
        {hasUrgentNotifications ? (
          <BellAlertIcon className="h-6 w-6 text-red-500" />
        ) : (
          <BellIcon className="h-6 w-6" />
        )}
      </div>
      
      {unreadCount > 0 && (
        <span className={`
          absolute -top-1 -right-1 flex items-center justify-center
          h-5 w-5 text-xs font-bold text-white rounded-full
          ${hasUrgentNotifications ? 'bg-red-500' : 'bg-teal-500'}
          ${animate ? 'animate-pulse' : ''}
        `}>
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
};

export default NotificationBell; 