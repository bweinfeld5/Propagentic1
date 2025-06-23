import React, { useState, useEffect } from 'react';
import { Bell, Check, X, Clock, AlertTriangle, Info, CheckCircle, XCircle, Wrench, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ContractorJobNotificationService, { ContractorJobNotification } from '../../services/firestore/contractorJobNotificationService';
import { formatDistanceToNow } from 'date-fns';

const notificationService = new ContractorJobNotificationService();

interface ContractorJobNotificationCenterProps {
  className?: string;
  onUnreadCountChange?: (count: number) => void;
}

const ContractorJobNotificationCenter: React.FC<ContractorJobNotificationCenterProps> = ({ 
  className = '',
  onUnreadCountChange 
}) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<ContractorJobNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'bid_accepted' | 'bid_rejected' | 'job_assigned'>('all');

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!currentUser?.uid) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = notificationService.subscribeToJobNotifications(
      currentUser.uid,
      (newNotifications) => {
        setNotifications(newNotifications);
        const unreadCount = newNotifications.filter(n => !n.read).length;
        onUnreadCountChange?.(unreadCount);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid, onUnreadCountChange]);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      await notificationService.markJobNotificationAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!currentUser?.uid) return;
    
    try {
      await notificationService.markAllJobNotificationsAsRead(currentUser.uid);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    try {
      await notificationService.deleteJobNotification(notificationId);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Get filtered notifications
  const getFilteredNotifications = () => {
    let filtered = notifications;

    switch (filter) {
      case 'unread':
        filtered = notifications.filter(n => !n.read);
        break;
      case 'bid_accepted':
        filtered = notifications.filter(n => n.type === 'bid_accepted');
        break;
      case 'bid_rejected':
        filtered = notifications.filter(n => n.type === 'bid_rejected');
        break;
      case 'job_assigned':
        filtered = notifications.filter(n => n.type === 'job_assigned');
        break;
      default:
        filtered = notifications;
    }

    return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  };

  // Get notification icon
  const getNotificationIcon = (type: ContractorJobNotification['type'], priority: ContractorJobNotification['priority']) => {
    const iconClass = priority === 'urgent' ? 'text-red-500' : 
                     priority === 'high' ? 'text-orange-500' : 
                     priority === 'normal' ? 'text-blue-500' : 'text-gray-500';

    switch (type) {
      case 'bid_accepted':
        return <CheckCircle className={`h-5 w-5 ${iconClass}`} />;
      case 'bid_rejected':
        return <XCircle className={`h-5 w-5 ${iconClass}`} />;
      case 'job_assigned':
        return <UserCheck className={`h-5 w-5 ${iconClass}`} />;
      case 'job_completed':
        return <Check className={`h-5 w-5 ${iconClass}`} />;
      default:
        return <Info className={`h-5 w-5 ${iconClass}`} />;
    }
  };

  // Get notification priority color
  const getPriorityColor = (priority: ContractorJobNotification['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500 bg-red-50';
      case 'high':
        return 'border-l-orange-500 bg-orange-50';
      case 'normal':
        return 'border-l-blue-500 bg-blue-50';
      case 'low':
        return 'border-l-gray-500 bg-gray-50';
      default:
        return 'border-l-gray-300 bg-white';
    }
  };

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Job Notifications</h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex space-x-1 mt-3">
              {[
                { key: 'all', label: 'All' },
                { key: 'unread', label: 'Unread' },
                { key: 'bid_accepted', label: 'Accepted' },
                { key: 'bid_rejected', label: 'Rejected' },
                { key: 'job_assigned', label: 'Assigned' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key as any)}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    filter === tab.key
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2">Loading notifications...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No notifications found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors border-l-4 ${getPriorityColor(notification.priority)} ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type, notification.priority)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </p>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                            </span>
                            {!notification.read && (
                              <span className="h-2 w-2 bg-blue-500 rounded-full"></span>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>

                        {notification.data?.actionUrl && (
                          <a
                            href={notification.data.actionUrl}
                            className="text-sm text-blue-600 hover:text-blue-800 mt-2 inline-block"
                          >
                            {notification.data.actionText || 'View Details'}
                          </a>
                        )}

                        <div className="flex items-center space-x-2 mt-2">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id!)}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              Mark as read
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id!)}
                            className="text-xs text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractorJobNotificationCenter; 