import React, { useState } from 'react';
import {
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
  PaperAirplaneIcon,
  PhoneIcon,
  VideoCameraIcon,
  EllipsisHorizontalIcon
} from '@heroicons/react/24/outline';

interface Message {
  id: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
    role: 'landlord' | 'tenant' | 'contractor' | 'system';
  };
  content: string;
  timestamp: Date;
  isRead: boolean;
}

const CommunicationPanel: React.FC = () => {
  const [activeChat, setActiveChat] = useState<string | null>('chat1');
  const [messageInput, setMessageInput] = useState('');
  
  // Mock conversations data
  const conversations = [
    {
      id: 'chat1',
      contact: {
        id: 'user1',
        name: 'Sarah Johnson',
        role: 'landlord',
        avatar: undefined
      },
      lastMessage: 'Can you provide an update on the kitchen repair?',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      unread: 2
    },
    {
      id: 'chat2',
      contact: {
        id: 'user2',
        name: 'Michael Chen',
        role: 'tenant',
        avatar: undefined
      },
      lastMessage: 'What time will you arrive tomorrow?',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
      unread: 0
    },
    {
      id: 'chat3',
      contact: {
        id: 'user3',
        name: 'PropAgentic Support',
        role: 'system',
        avatar: undefined
      },
      lastMessage: 'Your document verification is complete.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      unread: 0
    }
  ];
  
  // Mock messages for active chat
  const messages: Record<string, Message[]> = {
    chat1: [
      {
        id: 'msg1',
        sender: {
          id: 'user1',
          name: 'Sarah Johnson',
          role: 'landlord'
        },
        content: 'Hi there! I wanted to check on the status of the kitchen repair at 123 Main St.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        isRead: true
      },
      {
        id: 'msg2',
        sender: {
          id: 'currentUser',
          name: 'You',
          role: 'contractor'
        },
        content: 'Hello Sarah! I\'ve ordered the parts and they should arrive tomorrow. I\'ll be able to complete the repair on Thursday.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.5), // 1.5 hours ago
        isRead: true
      },
      {
        id: 'msg3',
        sender: {
          id: 'user1',
          name: 'Sarah Johnson',
          role: 'landlord'
        },
        content: 'That sounds great. The tenant will be home after 3pm on Thursday.',
        timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
        isRead: true
      },
      {
        id: 'msg4',
        sender: {
          id: 'user1',
          name: 'Sarah Johnson',
          role: 'landlord'
        },
        content: 'Can you provide an update on the kitchen repair?',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        isRead: false
      }
    ],
    chat2: [
      {
        id: 'msg1',
        sender: {
          id: 'user2',
          name: 'Michael Chen',
          role: 'tenant'
        },
        content: 'Hello, I was told you\'ll be fixing our bathroom sink tomorrow.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
        isRead: true
      },
      {
        id: 'msg2',
        sender: {
          id: 'currentUser',
          name: 'You',
          role: 'contractor'
        },
        content: 'Hi Michael, that\'s correct. I have you scheduled for tomorrow.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3.5), // 3.5 hours ago
        isRead: true
      },
      {
        id: 'msg3',
        sender: {
          id: 'user2',
          name: 'Michael Chen',
          role: 'tenant'
        },
        content: 'What time will you arrive tomorrow?',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
        isRead: true
      }
    ],
    chat3: [
      {
        id: 'msg1',
        sender: {
          id: 'user3',
          name: 'PropAgentic Support',
          role: 'system'
        },
        content: 'Your document verification is complete. You are now eligible to receive job assignments.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        isRead: true
      }
    ]
  };
  
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
  const handleSendMessage = () => {
    if (!messageInput.trim() || !activeChat) return;
    
    // In a real app, this would send the message to the backend
    console.log(`Sending message to ${activeChat}: ${messageInput}`);
    
    // Clear input
    setMessageInput('');
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
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => setActiveChat(conversation.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors duration-200 ${
                  activeChat === conversation.id
                    ? 'bg-orange-100'
                    : 'hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center">
                  <div className="relative flex-shrink-0">
                    {conversation.contact.avatar ? (
                      <img
                        src={conversation.contact.avatar}
                        alt={conversation.contact.name}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <UserCircleIcon className="w-6 h-6 text-gray-600" />
                      </div>
                    )}
                    {conversation.unread > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                        {conversation.unread}
                      </span>
                    )}
                  </div>
                  <div className="ml-3 flex-1 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {conversation.contact.name}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(conversation.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {conversation.lastMessage}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Chat Area */}
        <div className="md:col-span-2 flex flex-col h-full">
          {activeChat ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center mr-2">
                    <UserCircleIcon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      {conversations.find(c => c.id === activeChat)?.contact.name}
                    </h3>
                    <div className="flex items-center">
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        getRoleColor(conversations.find(c => c.id === activeChat)?.contact.role || '')
                      }`}>
                        {conversations.find(c => c.id === activeChat)?.contact.role}
                      </span>
                    </div>
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
                {messages[activeChat]?.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender.id === 'currentUser' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] rounded-lg p-3 ${
                      message.sender.id === 'currentUser'
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      <span className={`text-xs mt-1 block text-right ${
                        message.sender.id === 'currentUser' ? 'text-orange-100' : 'text-gray-500'
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