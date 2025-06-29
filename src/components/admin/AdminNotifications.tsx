import React, { useState, useEffect } from 'react';
import {
  ExclamationTriangleIcon,
  UserIcon,
  ShieldCheckIcon,
  Cog6ToothIcon,
  CheckIcon,
  XMarkIcon,
  BellIcon
} from '@heroicons/react/24/outline';

interface AdminNotification {
  id: string;
  type: 'alert' | 'user_action' | 'system' | 'security';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  actionUrl?: string;
}

interface AdminNotificationsProps {
  onClose: () => void;
}

const AdminNotifications: React.FC<AdminNotificationsProps> = ({ onClose }) => {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);

  useEffect(() => {
    // Generate sample notifications
    const sampleNotifications: AdminNotification[] = [
      {
        id: '1',
        type: 'security',
        title: 'Security Alert',
        message: 'Multiple failed login attempts detected from suspicious IP',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        read: false,
        priority: 'critical'
      },
      {
        id: '2',
        type: 'user_action',
        title: 'New User Registration',
        message: 'john.doe@example.com has registered as a landlord',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        read: false,
        priority: 'medium'
      },
      {
        id: '3',
        type: 'system',
        title: 'System Update',
        message: 'Scheduled maintenance completed successfully',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        read: true,
        priority: 'low'
      },
      {
        id: '4',
        type: 'alert',
        title: 'High Usage Alert',
        message: 'API usage has exceeded 80% of daily limit',
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
        read: false,
        priority: 'high'
      }
    ];

    setNotifications(sampleNotifications);
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'security':
        return <ShieldCheckIcon className="w-5 h-5 text-red-600" />;
      case 'user_action':
        return <UserIcon className="w-5 h-5 text-blue-600" />;
      case 'system':
        return <Cog6ToothIcon className="w-5 h-5 text-green-600" />;
      case 'alert':
        return <ExclamationTriangleIcon className="w-5 h-5 text-orange-600" />;
      default:
        return <BellIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'border-l-red-500 bg-red-50';
      case 'high':
        return 'border-l-orange-500 bg-orange-50';
      case 'medium':
        return 'border-l-blue-500 bg-blue-50';
      case 'low':
        return 'border-l-gray-500 bg-gray-50';
      default:
        return 'border-l-gray-300 bg-white';
    }
  };

  const getTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <BellIcon className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-medium px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border-l-4 ${getPriorityColor(notification.priority)} ${
                  !notification.read ? 'bg-opacity-80' : 'bg-opacity-40'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className={`text-sm font-medium ${
                        !notification.read ? 'text-gray-900' : 'text-gray-600'
                      }`}>
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {getTimeAgo(notification.timestamp)}
                      </span>
                      
                      <div className="flex items-center gap-1">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                            title="Mark as read"
                          >
                            <CheckIcon className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => removeNotification(notification.id)}
                          className="text-xs text-gray-400 hover:text-gray-600"
                          title="Remove"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <BellIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-600">You're all caught up!</p>
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View All Notifications
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminNotifications; 