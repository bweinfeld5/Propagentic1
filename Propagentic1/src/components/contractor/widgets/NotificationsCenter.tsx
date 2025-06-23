import React, { useState } from 'react';
import {
  BellIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ClockIcon,
  TrashIcon,
  EnvelopeIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

interface Notification {
  id: string;
  type: 'alert' | 'info' | 'success';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  actionLabel?: string;
  actionUrl?: string;
}

const NotificationsCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'alerts'>('all');
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'alert',
      title: 'Urgent Job Request',
      message: 'Emergency plumbing repair needed at 123 Main St. Respond within 1 hour for priority assignment.',
      time: '10 minutes ago',
      isRead: false,
      actionLabel: 'View Details',
      actionUrl: '/jobs/emergency/1'
    },
    {
      id: '2',
      type: 'success',
      title: 'Payment Received',
      message: 'Payment of $350 for job #1234 has been processed and will be deposited within 24 hours.',
      time: '2 hours ago',
      isRead: false
    },
    {
      id: '3',
      type: 'info',
      title: 'Document Verification',
      message: 'Your insurance certificate is set to expire in 15 days. Please upload a renewed certificate.',
      time: '1 day ago',
      isRead: true,
      actionLabel: 'Upload Document',
      actionUrl: '/verification/documents'
    },
    {
      id: '4',
      type: 'info',
      title: 'New Feature Available',
      message: 'You can now track your job locations and optimize routes with our new map feature.',
      time: '2 days ago',
      isRead: true
    },
    {
      id: '5',
      type: 'success',
      title: 'Rating Received',
      message: 'You received a 5-star rating for job #5678. Great work!',
      time: '3 days ago',
      isRead: true
    }
  ]);

  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'unread') return !notification.isRead;
    if (activeTab === 'alerts') return notification.type === 'alert';
    return true;
  });

  // Mark notification as read
  const markAsRead = (id: string) => {
    setNotifications(notifications.map(notification => 
      notification.id === id ? { ...notification, isRead: true } : notification
    ));
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => ({ ...notification, isRead: true })));
  };

  // Delete notification
  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(notification => notification.id !== id));
  };

  // Get icon based on notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return <ExclamationCircleIcon className="w-5 h-5 text-red-500" />;
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'info':
        return <InformationCircleIcon className="w-5 h-5 text-blue-500" />;
      default:
        return <BellIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  // Get background color based on notification type
  const getNotificationBgColor = (type: string, isRead: boolean) => {
    if (isRead) return 'bg-gray-50';
    
    switch (type) {
      case 'alert':
        return 'bg-red-50';
      case 'success':
        return 'bg-green-50';
      case 'info':
        return 'bg-blue-50';
      default:
        return 'bg-gray-50';
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-orange-200 p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
            <BellIcon className="w-5 h-5 text-orange-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
          {notifications.filter(n => !n.isRead).length > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {notifications.filter(n => !n.isRead).length}
            </span>
          )}
        </div>
        
        <button 
          onClick={markAllAsRead}
          className="text-sm text-orange-600 hover:text-orange-700 font-medium"
        >
          Mark all as read
        </button>
      </div>
      
      {/* Tabs */}
      <div className="flex bg-orange-100 rounded-lg p-1 mb-6">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
            activeTab === 'all'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setActiveTab('unread')}
          className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
            activeTab === 'unread'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Unread
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
            activeTab === 'alerts'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Alerts
        </button>
      </div>
      
      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <BellIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-gray-500 font-medium">No notifications</h3>
            <p className="text-gray-400 text-sm mt-1">
              {activeTab === 'unread' 
                ? "You've read all notifications" 
                : activeTab === 'alerts' 
                  ? "No alerts at this time" 
                  : "You don't have any notifications yet"}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div 
              key={notification.id}
              className={`${getNotificationBgColor(notification.type, notification.isRead)} rounded-lg p-4 border border-gray-100 transition-all duration-200 hover:shadow-md ${!notification.isRead ? 'border-l-4 border-l-orange-500' : ''}`}
            >
              <div className="flex">
                <div className="flex-shrink-0 mr-3">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <h3 className={`text-sm font-semibold ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                      {notification.title}
                    </h3>
                    <div className="flex items-center space-x-2 ml-2">
                      {!notification.isRead && (
                        <button 
                          onClick={() => markAsRead(notification.id)}
                          className="text-gray-400 hover:text-gray-600"
                          aria-label="Mark as read"
                        >
                          <EnvelopeIcon className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => deleteNotification(notification.id)}
                        className="text-gray-400 hover:text-red-600"
                        aria-label="Delete notification"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className={`text-sm mt-1 ${!notification.isRead ? 'text-gray-800' : 'text-gray-600'}`}>
                    {notification.message}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center text-xs text-gray-500">
                      <ClockIcon className="w-3 h-3 mr-1" />
                      <span>{notification.time}</span>
                    </div>
                    {notification.actionLabel && (
                      <a 
                        href={notification.actionUrl || '#'}
                        className="text-xs font-medium text-orange-600 hover:text-orange-700"
                      >
                        {notification.actionLabel}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-orange-200">
        <button className="w-full text-sm text-orange-600 hover:text-orange-700 font-medium py-2 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors duration-200">
          View All Notifications
        </button>
      </div>
    </div>
  );
};

export default NotificationsCenter; 