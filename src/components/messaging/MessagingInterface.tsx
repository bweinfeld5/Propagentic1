import React, { useState, useRef, useEffect } from 'react';
import {
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
  PaperAirplaneIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  VideoCameraIcon,
  EllipsisHorizontalIcon,
  BuildingOfficeIcon,
  WrenchScrewdriverIcon,
  XMarkIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { useMessages } from '../../hooks/useMessages';

interface MessagingInterfaceProps {
  className?: string;
  height?: string;
  showHeader?: boolean;
  showNewConversationButton?: boolean;
  fullWidth?: boolean;
}

const MessagingInterface: React.FC<MessagingInterfaceProps> = ({
  className = '',
  height = 'h-[600px]',
  showHeader = true,
  showNewConversationButton = true,
  fullWidth = false
}) => {
  const { currentUser } = useAuth();
  const {
    conversations,
    activeConversation,
    messages,
    loading,
    error,
    setActiveConversation,
    sendMessage,
    markAsRead,
    searchConversations
  } = useMessages();

  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState(conversations);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when conversation becomes active
  useEffect(() => {
    if (activeConversation && inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeConversation]);

  // Handle search
  useEffect(() => {
    const performSearch = async () => {
      if (searchTerm.trim()) {
        const results = await searchConversations(searchTerm);
        setSearchResults(results);
      } else {
        setSearchResults(conversations);
      }
    };

    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, conversations, searchConversations]);

  // Format timestamp
  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Handle send message
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !activeConversation) return;

    try {
      await sendMessage(messageInput.trim());
      setMessageInput('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Get role icon
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'landlord':
        return BuildingOfficeIcon;
      case 'contractor':
        return WrenchScrewdriverIcon;
      case 'tenant':
        return UserCircleIcon;
      default:
        return UserCircleIcon;
    }
  };

  // Get role color
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'landlord':
        return 'bg-blue-100 text-blue-800';
      case 'contractor':
        return 'bg-orange-100 text-orange-800';
      case 'tenant':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get total unread count
  const totalUnreadCount = currentUser 
    ? conversations.reduce((total, conv) => total + (conv.unreadCounts[currentUser.uid] || 0), 0)
    : 0;

  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-lg ${height} ${fullWidth ? 'w-full' : ''} ${className}`}>
      {showHeader && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <ChatBubbleLeftRightIcon className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
              {totalUnreadCount > 0 && (
                <span className="text-sm text-gray-500">
                  {totalUnreadCount} unread message{totalUnreadCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
          {showNewConversationButton && (
            <button
              onClick={() => setShowNewConversation(!showNewConversation)}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              title="Start new conversation"
            >
              {showNewConversation ? (
                <XMarkIcon className="w-5 h-5" />
              ) : (
                <PlusIcon className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
      )}

      <div className="flex h-full">
        {/* Conversations Sidebar */}
        <div className="w-80 border-r border-gray-200 flex flex-col">
          {/* Search */}
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* New Conversation Panel */}
          {showNewConversation && (
            <div className="p-4 bg-orange-50 border-b border-orange-200">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Start New Conversation</h3>
              <p className="text-xs text-gray-600 mb-3">
                Use the message button next to contractors or landlords to start a conversation.
              </p>
              <button
                onClick={() => setShowNewConversation(false)}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                Got it
              </button>
            </div>
          )}

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {loading && (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">Loading conversations...</p>
              </div>
            )}

            {error && (
              <div className="p-4 text-center">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}

            {!loading && !error && searchResults.length === 0 && (
              <div className="p-4 text-center">
                <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-500 font-medium mb-1">
                  {searchTerm ? 'No conversations found' : 'No conversations yet'}
                </p>
                <p className="text-xs text-gray-400">
                  {searchTerm 
                    ? 'Try a different search term' 
                    : 'Start a conversation with a landlord or contractor'
                  }
                </p>
              </div>
            )}

            {searchResults.map((conversation) => {
              const otherParticipant = conversation.participants.find(p => p.id !== currentUser?.uid);
              const unreadCount = currentUser ? conversation.unreadCounts[currentUser.uid] || 0 : 0;
              const RoleIcon = getRoleIcon(otherParticipant?.role || '');

              return (
                <button
                  key={conversation.id}
                  onClick={() => {
                    setActiveConversation(conversation);
                    if (currentUser && conversation.id) {
                      markAsRead();
                    }
                  }}
                  className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    activeConversation?.id === conversation.id ? 'bg-orange-50 border-r-2 border-orange-500' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <RoleIcon className="w-5 h-5 text-gray-600" />
                      </div>
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {otherParticipant?.name || 'Unknown User'}
                        </h3>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {conversation.lastMessage?.timestamp
                            ? formatTimestamp(conversation.lastMessage.timestamp)
                            : formatTimestamp(conversation.updatedAt)
                          }
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleColor(otherParticipant?.role || '')}`}>
                          {otherParticipant?.role}
                        </span>
                        {otherParticipant?.company && (
                          <span className="text-xs text-gray-500 truncate">
                            {otherParticipant.company}
                          </span>
                        )}
                      </div>
                      <p className={`text-sm truncate ${unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                        {conversation.lastMessage?.text || 'No messages yet'}
                      </p>
                      {conversation.metadata?.propertyName && (
                        <p className="text-xs text-gray-500 truncate mt-1">
                          📍 {conversation.metadata.propertyName}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {(() => {
                      const otherParticipant = activeConversation.participants.find(p => p.id !== currentUser?.uid);
                      const RoleIcon = getRoleIcon(otherParticipant?.role || '');
                      
                      return (
                        <>
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <RoleIcon className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-900">
                              {otherParticipant?.name || 'Unknown User'}
                            </h3>
                            <div className="flex items-center space-x-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleColor(otherParticipant?.role || '')}`}>
                                {otherParticipant?.role}
                              </span>
                              {otherParticipant?.company && (
                                <span className="text-xs text-gray-500">
                                  {otherParticipant.company}
                                </span>
                              )}
                            </div>
                            {activeConversation.metadata?.propertyName && (
                              <p className="text-xs text-gray-500 mt-1">
                                📍 {activeConversation.metadata.propertyName}
                              </p>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  <div className="flex space-x-2">
                    <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                      <PhoneIcon className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                      <VideoCameraIcon className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                      <EllipsisHorizontalIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-500">No messages yet</p>
                    <p className="text-sm text-gray-400">Start the conversation!</p>
                  </div>
                ) : (
                  <>
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.senderId === currentUser?.uid ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          message.senderId === currentUser?.uid
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          <p className="text-sm">{message.text}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className={`text-xs ${
                              message.senderId === currentUser?.uid ? 'text-orange-100' : 'text-gray-500'
                            }`}>
                              {formatTimestamp(message.timestamp)}
                            </span>
                            {message.senderId === currentUser?.uid && (
                              <span className={`text-xs ml-2 ${
                                Object.keys(message.readBy).length > 1 ? 'text-orange-200' : 'text-orange-300'
                              }`}>
                                {Object.keys(message.readBy).length > 1 ? '✓✓' : '✓'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white rounded-lg transition-colors"
                  >
                    <PaperAirplaneIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <ChatBubbleLeftRightIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a conversation
                </h3>
                <p className="text-gray-600 mb-4">
                  Choose a conversation from the list to start messaging
                </p>
                {conversations.length === 0 && (
                  <p className="text-sm text-gray-500">
                    Use the message button next to contractors or landlords to start your first conversation
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagingInterface; 