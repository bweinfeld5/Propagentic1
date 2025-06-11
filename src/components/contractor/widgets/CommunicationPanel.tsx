import React, { useState } from 'react';
import {
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
  PaperAirplaneIcon,
  PhoneIcon,
  VideoCameraIcon,
  EllipsisHorizontalIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../../context/AuthContext';
import { useMessages } from '../../../hooks/useMessages';

const CommunicationPanel: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    conversations,
    activeConversation,
    messages,
    loading,
    error,
    setActiveConversation,
    sendMessage
  } = useMessages();
  
  const [messageInput, setMessageInput] = useState('');
  
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
  
  // Get role color
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'landlord':
        return 'bg-blue-100 text-blue-800';
      case 'tenant':
        return 'bg-green-100 text-green-800';
      case 'system':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-orange-200 p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
            <ChatBubbleLeftRightIcon className="w-5 h-5 text-orange-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-80">
        {/* Conversations List */}
        <div className="md:col-span-1 border-r border-gray-200 pr-4">
          <div className="space-y-2 h-full overflow-y-auto">
            {loading && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading conversations...</p>
              </div>
            )}
            {error && (
              <div className="text-center py-4">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}
            {!loading && !error && conversations.length === 0 && (
              <div className="text-center py-8">
                <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No conversations yet</p>
                <p className="text-xs text-gray-400 mt-1">Start a conversation with a landlord</p>
              </div>
            )}
            {conversations.map((conversation) => {
              // Get the other participant (not the current user)
              const otherParticipant = conversation.participants.find(p => p.id !== currentUser?.uid);
              const unreadCount = currentUser ? conversation.unreadCounts[currentUser.uid] || 0 : 0;
              
              return (
                <button
                  key={conversation.id}
                  onClick={() => setActiveConversation(conversation)}
                  className={`w-full text-left p-3 rounded-lg transition-colors duration-200 ${
                    activeConversation?.id === conversation.id
                      ? 'bg-orange-100'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="relative flex-shrink-0">
                      {otherParticipant?.avatar ? (
                        <img
                          src={otherParticipant.avatar}
                          alt={otherParticipant.name}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <UserCircleIcon className="w-6 h-6 text-gray-600" />
                        </div>
                      )}
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="ml-3 flex-1 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {otherParticipant?.name || 'Unknown User'}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {conversation.lastMessage?.timestamp ? 
                            formatTimestamp(conversation.lastMessage.timestamp) : 
                            formatTimestamp(conversation.updatedAt)
                          }
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {conversation.lastMessage?.text || 'No messages yet'}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Chat Area */}
        <div className="md:col-span-2 flex flex-col h-full">
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center mr-2">
                    <UserCircleIcon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    {(() => {
                      const otherParticipant = activeConversation.participants.find(p => p.id !== currentUser?.uid);
                      return (
                        <>
                          <h3 className="text-sm font-medium text-gray-900">
                            {otherParticipant?.name || 'Unknown User'}
                          </h3>
                          <div className="flex items-center">
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                              getRoleColor(otherParticipant?.role || '')
                            }`}>
                              {otherParticipant?.role}
                            </span>
                            {otherParticipant?.company && (
                              <span className="text-xs text-gray-500 ml-2">
                                {otherParticipant.company}
                              </span>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button className="p-1.5 rounded-full hover:bg-gray-100 text-gray-600">
                    <PhoneIcon className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 rounded-full hover:bg-gray-100 text-gray-600">
                    <VideoCameraIcon className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 rounded-full hover:bg-gray-100 text-gray-600">
                    <EllipsisHorizontalIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto py-3 space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === currentUser?.uid ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] rounded-lg p-3 ${
                      message.senderId === currentUser?.uid
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      <p className="text-sm">{message.text}</p>
                      <span className={`text-xs mt-1 block text-right ${
                        message.senderId === currentUser?.uid ? 'text-orange-100' : 'text-gray-500'
                      }`}>
                        {formatTimestamp(message.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Message Input */}
              <div className="pt-3 border-t border-gray-200">
                <div className="flex items-center">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-gray-100 rounded-l-lg px-4 py-2 text-sm focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSendMessage();
                      }
                    }}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                    className="bg-orange-500 hover:bg-orange-600 text-white rounded-r-lg px-4 py-2 disabled:opacity-50"
                  >
                    <PaperAirplaneIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <ChatBubbleLeftRightIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-gray-500 font-medium">No conversation selected</h3>
                <p className="text-gray-400 text-sm mt-1">
                  Select a conversation to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-orange-200">
        <button className="w-full text-sm text-orange-600 hover:text-orange-700 font-medium py-2 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors duration-200">
          View All Messages
        </button>
      </div>
    </div>
  );
};

export default CommunicationPanel; 