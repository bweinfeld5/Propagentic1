import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import {
  ChatBubbleLeftRightIcon,
  UserIcon,
  BuildingOfficeIcon,
  ExclamationCircleIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';

const RecentMessages = () => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'urgent'

  useEffect(() => {
    if (currentUser) {
      fetchRecentMessages();
    }
  }, [currentUser]);

  const fetchRecentMessages = async () => {
    try {
      setLoading(true);
      
      // In a real implementation, you would fetch messages from Firebase
      // For now, using mock data
      const mockMessages = [
        {
          id: '1',
          from: 'Sarah Johnson',
          fromType: 'landlord',
          property: '456 Oak Ave',
          message: 'Hi! The HVAC repair is scheduled for tomorrow at 2 PM. Please confirm.',
          timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          isRead: false,
          isUrgent: false,
          avatar: null
        },
        {
          id: '2',
          from: 'Mike Davis',
          fromType: 'tenant',
          property: '789 Pine St',
          message: 'Thank you for fixing the electrical outlet so quickly!',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          isRead: true,
          isUrgent: false,
          avatar: null
        },
        {
          id: '3',
          from: 'John Smith',
          fromType: 'landlord',
          property: '123 Main St',
          message: 'URGENT: Water leak in apartment 4B. Can you come ASAP?',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
          isRead: false,
          isUrgent: true,
          avatar: null
        }
      ];

      setMessages(mockMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredMessages = () => {
    switch (filter) {
      case 'unread':
        return messages.filter(msg => !msg.isRead);
      case 'urgent':
        return messages.filter(msg => msg.isUrgent);
      default:
        return messages;
    }
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return `${days}d ago`;
    }
  };

  const getContactIcon = (fromType) => {
    return fromType === 'landlord' ? BuildingOfficeIcon : UserIcon;
  };

  const truncateMessage = (message, maxLength = 60) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-6"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex space-x-3">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const filteredMessages = getFilteredMessages();
  const unreadCount = messages.filter(msg => !msg.isRead).length;
  const urgentCount = messages.filter(msg => msg.isUrgent).length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
            <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Messages
          </h3>
        </div>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="bg-red-500 text-white text-xs font-medium px-2 py-1 rounded-full">
            {unreadCount}
          </span>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
        {[
          { key: 'all', label: 'All', count: messages.length },
          { key: 'unread', label: 'Unread', count: unreadCount },
          { key: 'urgent', label: 'Urgent', count: urgentCount }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              filter === tab.key
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span className={`ml-1 text-xs ${
                filter === tab.key 
                  ? 'text-gray-500 dark:text-gray-400' 
                  : 'text-gray-400 dark:text-gray-500'
              }`}>
                ({tab.count})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Messages List */}
      <div className="space-y-3">
        {filteredMessages.length === 0 ? (
          <div className="text-center py-8">
            <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              No {filter !== 'all' ? filter : ''} messages
            </p>
          </div>
        ) : (
          filteredMessages.slice(0, 4).map((message) => {
            const ContactIcon = getContactIcon(message.fromType);
            return (
              <div
                key={message.id}
                className={`p-3 rounded-xl transition-colors duration-200 cursor-pointer ${
                  message.isRead 
                    ? 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700' 
                    : 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                }`}
              >
                <div className="flex space-x-3">
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    message.fromType === 'landlord' 
                      ? 'bg-purple-100 dark:bg-purple-900/30' 
                      : 'bg-emerald-100 dark:bg-emerald-900/30'
                  }`}>
                    <ContactIcon className={`w-5 h-5 ${
                      message.fromType === 'landlord' 
                        ? 'text-purple-600 dark:text-purple-400' 
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`} />
                  </div>

                  {/* Message Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <h4 className={`text-sm font-medium ${
                          message.isRead 
                            ? 'text-gray-900 dark:text-white' 
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {message.from}
                        </h4>
                        {message.isUrgent && (
                          <ExclamationCircleIcon className="w-4 h-4 text-red-500" />
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          message.fromType === 'landlord'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                        }`}>
                          {message.fromType}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTimestamp(message.timestamp)}
                      </span>
                    </div>
                    
                    <p className={`text-sm ${
                      message.isRead 
                        ? 'text-gray-600 dark:text-gray-300' 
                        : 'text-gray-700 dark:text-gray-200'
                    }`}>
                      {truncateMessage(message.message)}
                    </p>
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {message.property}
                      </span>
                      <div className="flex space-x-2">
                        <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs font-medium">
                          Reply
                        </button>
                        <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-xs font-medium">
                          Call
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Show More */}
      {filteredMessages.length > 4 && (
        <div className="mt-4 text-center">
          <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium">
            View All Messages ({filteredMessages.length})
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentMessages; 