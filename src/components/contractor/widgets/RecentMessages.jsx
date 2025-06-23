import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useMessages } from '../../../hooks/useMessages';
import {
  ChatBubbleLeftRightIcon,
  UserIcon,
  BuildingOfficeIcon,
  ExclamationCircleIcon,
  PhoneIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';

const RecentMessages = () => {
  const { currentUser } = useAuth();
  const { conversations, loading, error } = useMessages();
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'urgent'

  // Transform conversations into message format for display
  const getMessageData = () => {
    if (!conversations || conversations.length === 0) return [];
    
    return conversations.map(conversation => {
      const otherParticipant = conversation.participants.find(p => p.id !== currentUser?.uid);
      const unreadCount = currentUser ? conversation.unreadCounts[currentUser.uid] || 0 : 0;
      
      return {
        id: conversation.id,
        from: otherParticipant?.name || 'Unknown User',
        fromType: otherParticipant?.role || 'unknown',
        property: conversation.metadata?.propertyName || 'No property specified',
        message: conversation.lastMessage?.text || 'No messages yet',
        timestamp: conversation.lastMessage?.timestamp || conversation.updatedAt,
        isRead: unreadCount === 0,
        isUrgent: conversation.metadata?.priority === 'urgent' || false,
        avatar: null,
        company: otherParticipant?.company || null,
        conversationId: conversation.id
      };
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const messages = getMessageData();

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
    switch (fromType) {
      case 'landlord':
        return BuildingOfficeIcon;
      case 'contractor':
        return WrenchScrewdriverIcon;
      case 'tenant':
        return UserIcon;
      default:
        return UserIcon;
    }
  };

  const truncateMessage = (message, maxLength = 60) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-100 via-orange-50 to-gray-200 rounded-2xl border border-orange-200 p-6">
        <div className="animate-pulse">
          <div className="h-5 bg-gray-300 rounded w-32 mb-6"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex space-x-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-gray-100 via-orange-50 to-gray-200 rounded-2xl border border-orange-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-md">
            <ChatBubbleLeftRightIcon className="w-5 h-5 text-orange-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Messages</h3>
        </div>
        <div className="text-center py-8">
          <ExclamationCircleIcon className="w-12 h-12 mx-auto text-red-400 mb-4" />
          <p className="text-red-600 font-medium mb-2">Unable to load messages</p>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  const filteredMessages = getFilteredMessages();
  const unreadCount = messages.filter(msg => !msg.isRead).length;
  const urgentCount = messages.filter(msg => msg.isUrgent).length;

  return (
    <div className="bg-gradient-to-br from-gray-100 via-orange-50 to-gray-200 rounded-2xl border border-orange-200 p-6 hover:shadow-lg transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-md">
            <ChatBubbleLeftRightIcon className="w-5 h-5 text-orange-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">
            Messages
          </h3>
        </div>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="bg-orange-600 text-white text-xs font-medium px-2 py-1 rounded-full">
            {unreadCount}
          </span>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 mb-6 bg-white rounded-lg p-1 shadow-sm">
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
            <p className="text-xs text-gray-400 mt-2">
              Start a conversation with a landlord to see messages here
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
                      ? 'bg-orange-100' 
                      : 'bg-orange-100'
                  }`}>
                    <ContactIcon className={`w-5 h-5 ${
                      message.fromType === 'landlord' 
                        ? 'text-orange-600' 
                        : 'text-orange-600'
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
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-orange-100 text-orange-700'
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
                        <button className="text-orange-600 hover:text-orange-800 text-xs font-medium">
                          Reply
                        </button>
                        <button className="text-gray-500 hover:text-gray-700 text-xs font-medium">
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
          <button 
            onClick={() => window.location.href = '/contractor/messages'}
            className="text-orange-600 hover:text-orange-800 text-sm font-medium"
          >
            View All Messages ({filteredMessages.length})
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-orange-200">
        <button 
          onClick={() => window.location.href = '/contractor/messages'}
          className="w-full text-sm text-orange-600 hover:text-orange-700 font-medium py-2 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors duration-200"
        >
          Open Full Messaging Interface
        </button>
      </div>
    </div>
  );
};

export default RecentMessages; 