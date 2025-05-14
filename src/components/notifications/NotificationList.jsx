import React, { useState, useMemo } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import NotificationCard from './NotificationCard';
import { 
  BellAlertIcon, 
  ClockIcon, 
  CheckIcon, 
  FunnelIcon,
  ChevronDownIcon 
} from '@heroicons/react/24/outline';

const NotificationList = () => {
  const { notifications, markAllAsRead } = useNotifications();
  const [filter, setFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [sortOrder, setSortOrder] = useState('newest');

  // Group notifications by date
  const groupedNotifications = useMemo(() => {
    // Apply filters
    const filteredNotifications = notifications.filter(notification => {
      if (filter === 'all') return true;
      if (filter === 'unread') return !notification.read;
      if (filter === 'urgent') return notification.uiType === 'warning' || notification.type === 'high_urgency';
      return notification.type === filter;
    });

    // Sort notifications
    const sortedNotifications = [...filteredNotifications].sort((a, b) => {
      if (sortOrder === 'newest') {
        return b.createdAtDate - a.createdAtDate;
      } else {
        return a.createdAtDate - b.createdAtDate;
      }
    });

    // Group by date
    const grouped = sortedNotifications.reduce((groups, notification) => {
      const date = new Date(notification.createdAtDate).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(notification);
      return groups;
    }, {});

    return grouped;
  }, [notifications, filter, sortOrder]);

  // Get dates in order
  const orderedDates = useMemo(() => {
    return Object.keys(groupedNotifications).sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
  }, [groupedNotifications, sortOrder]);

  const filterOptions = [
    { id: 'all', label: 'All Notifications' },
    { id: 'unread', label: 'Unread' },
    { id: 'urgent', label: 'Urgent' },
    { id: 'classified', label: 'Classifications' },
    { id: 'status_change', label: 'Status Updates' },
    { id: 'invitation', label: 'Invitations' },
    { id: 'assignment', label: 'Assignments' },
    { id: 'request_completed', label: 'Completed Requests' }
  ];

  // Check if we have any notifications after filtering
  const hasNotifications = orderedDates.length > 0;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-800">Notifications</h2>
          
          <div className="flex space-x-2">
            <button 
              onClick={() => setShowFilters(!showFilters)} 
              className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
            >
              <FunnelIcon className="h-5 w-5" />
            </button>
            
            <button
              onClick={markAllAsRead}
              className="px-3 py-1 text-sm text-teal-600 border border-teal-600 rounded-full hover:bg-teal-50"
            >
              Mark all as read
            </button>
          </div>
        </div>
        
        {showFilters && (
          <div className="pt-2 pb-1">
            <div className="flex flex-wrap gap-2">
              {filterOptions.map(option => (
                <button
                  key={option.id}
                  onClick={() => setFilter(option.id)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    filter === option.id 
                      ? 'bg-teal-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            
            <div className="flex justify-end mt-2">
              <div className="relative inline-block text-left">
                <button 
                  type="button" 
                  className="inline-flex items-center px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none"
                  onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
                >
                  <ClockIcon className="h-4 w-4 mr-1" />
                  {sortOrder === 'newest' ? 'Newest first' : 'Oldest first'}
                  <ChevronDownIcon className="ml-1 h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="overflow-y-auto max-h-96">
        {hasNotifications ? (
          <div>
            {orderedDates.map(date => (
              <div key={date} className="border-b border-gray-100 last:border-b-0">
                <div className="px-4 py-2 bg-gray-50 sticky top-0 z-10">
                  <h3 className="text-xs font-medium text-gray-500">{date}</h3>
                </div>
                <ul className="divide-y divide-gray-100">
                  {groupedNotifications[date].map(notification => (
                    <li key={notification.id}>
                      <NotificationCard notification={notification} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 px-4 text-center">
            <BellAlertIcon className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'all' 
                ? 'You don\'t have any notifications yet.'
                : 'No notifications match your current filter.'}
            </p>
            {filter !== 'all' && (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-teal-700 bg-teal-100 hover:bg-teal-200"
                >
                  View all notifications
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationList; 