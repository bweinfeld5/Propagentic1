import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import NotificationCard from './NotificationCard';
import {
  BellIcon,
  ClockIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  ChevronRightIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

const NotificationCenter = () => {
  const { notifications, unreadCount, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);

  // Get only unread notifications or first 5 if showing all
  const displayedNotifications = showAll 
    ? notifications.slice(0, 5) 
    : notifications.filter(n => !n.read).slice(0, 3);
  
  // Calculate notification stats
  const stats = {
    urgent: notifications.filter(n => n.uiType === 'warning' || n.type === 'high_urgency').length,
    unread: unreadCount,
    total: notifications.length
  };

  // Count notifications by type
  const typeCounts = notifications.reduce((counts, notification) => {
    const type = notification.type;
    counts[type] = (counts[type] || 0) + 1;
    return counts;
  }, {});

  // Get the most common notification type
  const mostCommonType = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([type]) => type)[0];

  // Format notification type for display
  const formatNotificationType = (type) => {
    return type
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 bg-teal-700 text-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <BellIcon className="h-6 w-6 mr-2" />
            <h2 className="text-lg font-semibold">Recent Notifications</h2>
          </div>
          
          <button
            onClick={() => navigate('/notifications')}
            className="text-sm text-teal-100 hover:text-white"
          >
            View All
          </button>
        </div>
      </div>
      
      {/* Notification Stats */}
      <div className="grid grid-cols-3 gap-4 p-4 border-b border-gray-200">
        <div className="text-center">
          <div className="flex justify-center">
            <ClockIcon className="h-8 w-8 text-teal-500" />
          </div>
          <div className="mt-1">
            <div className="text-2xl font-semibold">{stats.unread}</div>
            <div className="text-xs text-gray-500">Unread</div>
          </div>
        </div>

        <div className="text-center">
          <div className="flex justify-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500" />
          </div>
          <div className="mt-1">
            <div className="text-2xl font-semibold">{stats.urgent}</div>
            <div className="text-xs text-gray-500">Urgent</div>
          </div>
        </div>

        <div className="text-center">
          <div className="flex justify-center">
            <UserGroupIcon className="h-8 w-8 text-indigo-500" />
          </div>
          <div className="mt-1">
            <div className="text-2xl font-semibold">{typeCounts[mostCommonType] || 0}</div>
            <div className="text-xs text-gray-500">{formatNotificationType(mostCommonType || 'None')}</div>
          </div>
        </div>
      </div>
      
      {/* Notification List */}
      <div className="overflow-y-auto max-h-96">
        {displayedNotifications.length > 0 ? (
          <ul className="divide-y divide-gray-100">
            {displayedNotifications.map(notification => (
              <li key={notification.id}>
                <NotificationCard notification={notification} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="py-6 px-4 text-center">
            <CheckIcon className="mx-auto h-10 w-10 text-green-300" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">All caught up!</h3>
            <p className="mt-1 text-sm text-gray-500">
              {showAll 
                ? "You don't have any notifications yet." 
                : "You don't have any unread notifications."}
            </p>
          </div>
        )}
      </div>
      
      {/* Footer Actions */}
      <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between">
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          {showAll ? 'Show unread only' : 'Show recent'}
        </button>
        
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-sm text-teal-600 hover:text-teal-700 font-medium"
          >
            Mark all as read
          </button>
        )}
      </div>
      
      {/* View All Link */}
      <div className="p-3 bg-gray-50 border-t border-gray-200">
        <button
          onClick={() => navigate('/notifications')}
          className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 
                   shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          View all notifications
          <ChevronRightIcon className="ml-1 h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default NotificationCenter; 