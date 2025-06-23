import React from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon,
  XMarkIcon,
  ClockIcon,
  WrenchScrewdriverIcon,
  HomeIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';

const NotificationList = () => {
  const { notifications, markAsRead, removeNotification, markAllAsRead, isLoading, error } = useNotifications();

  // Get icon based on notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
      case 'request_completed':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />;
      case 'ticket_update':
      case 'status_change':
        return <WrenchScrewdriverIcon className="h-6 w-6 text-blue-500" />;
      case 'property_invite':
        return <HomeIcon className="h-6 w-6 text-purple-500" />;
      case 'assignment':
        return <UserPlusIcon className="h-6 w-6 text-indigo-500" />;
      default:
        return <InformationCircleIcon className="h-6 w-6 text-gray-500" />;
    }
  };

  // Get background color based on notification type and read status
  const getNotificationBg = (type, status) => {
    const isUnread = status === 'unread';
    const baseClasses = isUnread ? 'bg-blue-50 border-l-4 border-blue-400' : 'bg-white border-l-4 border-gray-200';
    return baseClasses;
  };

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    if (notification.status === 'unread') {
      await markAsRead(notification.id);
    }
    
    // Handle navigation based on notification type
    if (notification.relatedData?.ticketId) {
      // Could navigate to ticket details
      console.log('Navigate to ticket:', notification.relatedData.ticketId);
    }
  };

  // Handle remove notification
  const handleRemoveNotification = async (e, notificationId) => {
    e.stopPropagation();
    await removeNotification(notificationId);
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex space-x-3">
              <div className="rounded-full bg-gray-200 h-6 w-6"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error loading notifications
              </h3>
              <p className="mt-1 text-sm text-red-700">
                {error.message}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
          <InformationCircleIcon className="h-6 w-6 text-gray-400" />
        </div>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
        <p className="mt-1 text-sm text-gray-500">
          You're all caught up! New notifications will appear here.
        </p>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  return (
    <div className="divide-y divide-gray-200">
      {/* Header with mark all as read */}
      {unreadCount > 0 && (
        <div className="p-4 bg-gray-50 border-b">
          <button
            onClick={markAllAsRead}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Mark all as read ({unreadCount})
          </button>
        </div>
      )}

      {/* Notification list */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${getNotificationBg(notification.type, notification.status)}`}
            onClick={() => handleNotificationClick(notification)}
          >
            <div className="flex items-start space-x-3">
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {getNotificationIcon(notification.type)}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${notification.status === 'unread' ? 'text-gray-900' : 'text-gray-700'}`}>
                      {notification.title}
                    </p>
                    <p className={`mt-1 text-sm ${notification.status === 'unread' ? 'text-gray-700' : 'text-gray-500'}`}>
                      {notification.message}
                    </p>
                    
                    {/* Additional details for specific notification types */}
                    {notification.type === 'ticket_update' && notification.relatedData?.category && (
                      <div className="mt-2 flex items-center space-x-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {notification.relatedData.category}
                        </span>
                        {notification.relatedData.urgency && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            notification.relatedData.urgency >= 4 
                              ? 'bg-red-100 text-red-800' 
                              : notification.relatedData.urgency >= 3 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            Priority {notification.relatedData.urgency}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Remove button */}
                  <button
                    onClick={(e) => handleRemoveNotification(e, notification.id)}
                    className="ml-2 flex-shrink-0 text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
                
                {/* Timestamp */}
                <div className="mt-2 flex items-center text-xs text-gray-500">
                  <ClockIcon className="h-3 w-3 mr-1" />
                  {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationList; 