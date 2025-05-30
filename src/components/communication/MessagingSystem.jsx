import React, { useState, useEffect, useRef } from 'react';
import { 
  ChatBubbleLeftRightIcon,
  PaperClipIcon,
  PaperAirplaneIcon,
  PhotoIcon,
  DocumentTextIcon,
  UserIcon,
  BuildingOfficeIcon,
  XMarkIcon,
  FaceSmileIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  VideoCameraIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';
import { useDropzone } from 'react-dropzone';
import { format, isToday, isYesterday } from 'date-fns';

const MessagingSystem = ({ userRole = 'landlord', currentUser = {} }) => {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Mock data for conversations
  useEffect(() => {
    const mockConversations = [
      {
        id: '1',
        type: 'tenant-landlord',
        participants: [
          { id: 'landlord1', name: 'John Smith', role: 'landlord', avatar: null },
          { id: 'tenant1', name: 'Sarah Johnson', role: 'tenant', avatar: null, property: 'Sunset Apartments - Unit 2A' }
        ],
        lastMessage: {
          text: 'The heating issue has been resolved. Thank you for the quick response!',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          sender: 'tenant1'
        },
        unread: userRole === 'landlord' ? 1 : 0,
        priority: 'normal'
      },
      {
        id: '2',
        type: 'contractor-communication',
        participants: [
          { id: 'landlord1', name: 'John Smith', role: 'landlord', avatar: null },
          { id: 'contractor1', name: 'Mike Wilson', role: 'contractor', avatar: null, company: 'Wilson Plumbing Co.' }
        ],
        lastMessage: {
          text: 'I can start the bathroom renovation next Tuesday. Attached the updated quote.',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          sender: 'contractor1'
        },
        unread: userRole === 'landlord' ? 2 : 0,
        priority: 'high',
        jobId: 'job_123'
      },
      {
        id: '3',
        type: 'tenant-landlord',
        participants: [
          { id: 'landlord1', name: 'John Smith', role: 'landlord', avatar: null },
          { id: 'tenant2', name: 'David Chen', role: 'tenant', avatar: null, property: 'Downtown Lofts - Unit 5B' }
        ],
        lastMessage: {
          text: 'Monthly rent payment completed. Receipt attached.',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
          sender: 'tenant2'
        },
        unread: 0,
        priority: 'normal'
      }
    ];
    setConversations(mockConversations);
  }, [userRole]);

  // Load messages for active conversation
  useEffect(() => {
    if (activeConversation) {
      const mockMessages = [
        {
          id: '1',
          sender: 'tenant1',
          text: 'Hi John, the heating in my unit isn\'t working properly. It\'s been cold for the past two days.',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
          type: 'text'
        },
        {
          id: '2',
          sender: 'landlord1',
          text: 'I\'m sorry to hear that, Sarah. I\'ll send our maintenance team to check it out today.',
          timestamp: new Date(Date.now() - 5.5 * 60 * 60 * 1000),
          type: 'text'
        },
        {
          id: '3',
          sender: 'landlord1',
          text: 'Our technician will be there between 2-4 PM today. Please let me know if that works for you.',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
          type: 'text'
        },
        {
          id: '4',
          sender: 'tenant1',
          text: 'Perfect! I\'ll be home during that time. Thank you for the quick response.',
          timestamp: new Date(Date.now() - 4.5 * 60 * 60 * 1000),
          type: 'text'
        },
        {
          id: '5',
          sender: 'tenant1',
          text: 'The heating issue has been resolved. Thank you for the quick response!',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          type: 'text'
        }
      ];
      setMessages(mockMessages);
    }
  }, [activeConversation]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // File upload handling
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      handleFileUpload(acceptedFiles);
    },
    multiple: true,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const handleFileUpload = (files) => {
    files.forEach(file => {
      const newMessage = {
        id: Date.now().toString(),
        sender: currentUser.id || 'current_user',
        type: file.type.startsWith('image/') ? 'image' : 'file',
        fileName: file.name,
        fileSize: file.size,
        fileUrl: URL.createObjectURL(file),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newMessage]);
    });
    setShowFileUpload(false);
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const messageObj = {
      id: Date.now().toString(),
      sender: currentUser.id || 'current_user',
      text: newMessage,
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, messageObj]);
    setNewMessage('');
    
    // Update conversation's last message
    setConversations(prev => 
      prev.map(conv => 
        conv.id === activeConversation?.id 
          ? { ...conv, lastMessage: { text: newMessage, timestamp: new Date(), sender: currentUser.id } }
          : conv
      )
    );
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessageTime = (timestamp) => {
    if (isToday(timestamp)) {
      return format(timestamp, 'h:mm a');
    } else if (isYesterday(timestamp)) {
      return 'Yesterday';
    } else {
      return format(timestamp, 'MMM d, yyyy');
    }
  };

  const filteredConversations = conversations.filter(conv => 
    conv.participants.some(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.property && p.property.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.company && p.company.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  );

  const renderConversationList = () => (
    <div className="w-80 bg-white border-r border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <ChatBubbleLeftRightIcon className="w-6 h-6 text-orange-600" />
          <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
        </div>
        
        {/* Search */}
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

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.map((conversation) => {
          const otherParticipant = conversation.participants.find(p => p.id !== currentUser.id);
          return (
            <div
              key={conversation.id}
              onClick={() => setActiveConversation(conversation)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                activeConversation?.id === conversation.id ? 'bg-orange-50 border-r-2 border-orange-500' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  {otherParticipant?.role === 'tenant' && <UserIcon className="w-5 h-5 text-gray-600" />}
                  {otherParticipant?.role === 'landlord' && <BuildingOfficeIcon className="w-5 h-5 text-gray-600" />}
                  {otherParticipant?.role === 'contractor' && <UserIcon className="w-5 h-5 text-gray-600" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-gray-900 truncate">
                      {otherParticipant?.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      {conversation.unread > 0 && (
                        <span className="bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {conversation.unread}
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {formatMessageTime(conversation.lastMessage.timestamp)}
                      </span>
                    </div>
                  </div>
                  
                  {otherParticipant?.property && (
                    <p className="text-xs text-gray-500 mb-1">{otherParticipant.property}</p>
                  )}
                  {otherParticipant?.company && (
                    <p className="text-xs text-gray-500 mb-1">{otherParticipant.company}</p>
                  )}
                  
                  <p className="text-sm text-gray-600 truncate">
                    {conversation.lastMessage.text}
                  </p>
                  
                  {conversation.priority === 'high' && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        High Priority
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderChatArea = () => {
    if (!activeConversation) {
      return (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <ChatBubbleLeftRightIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
            <p className="text-gray-600">Choose a conversation from the list to start messaging</p>
          </div>
        </div>
      );
    }

    const otherParticipant = activeConversation.participants.find(p => p.id !== currentUser.id);

    return (
      <div className="flex-1 flex flex-col bg-white">
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                {otherParticipant?.role === 'tenant' && <UserIcon className="w-5 h-5 text-gray-600" />}
                {otherParticipant?.role === 'landlord' && <BuildingOfficeIcon className="w-5 h-5 text-gray-600" />}
                {otherParticipant?.role === 'contractor' && <UserIcon className="w-5 h-5 text-gray-600" />}
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{otherParticipant?.name}</h3>
                {otherParticipant?.property && (
                  <p className="text-sm text-gray-600">{otherParticipant.property}</p>
                )}
                {otherParticipant?.company && (
                  <p className="text-sm text-gray-600">{otherParticipant.company}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <PhoneIcon className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <VideoCameraIcon className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <EllipsisVerticalIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {messages.map((message) => {
            const isCurrentUser = message.sender === currentUser.id || message.sender === 'current_user';
            
            return (
              <div
                key={message.id}
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  isCurrentUser 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  {message.type === 'text' && (
                    <p className="text-sm">{message.text}</p>
                  )}
                  
                  {message.type === 'image' && (
                    <div>
                      <img 
                        src={message.fileUrl} 
                        alt={message.fileName}
                        className="max-w-full h-auto rounded mb-2"
                      />
                      <p className="text-xs opacity-75">{message.fileName}</p>
                    </div>
                  )}
                  
                  {message.type === 'file' && (
                    <div className="flex items-center gap-2">
                      <DocumentTextIcon className="w-4 h-4" />
                      <div>
                        <p className="text-sm font-medium">{message.fileName}</p>
                        <p className="text-xs opacity-75">
                          {(message.fileSize / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <p className={`text-xs mt-1 ${isCurrentUser ? 'text-orange-100' : 'text-gray-500'}`}>
                    {formatMessageTime(message.timestamp)}
                  </p>
                </div>
              </div>
            );
          })}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-gray-200 bg-white">
          {showFileUpload && (
            <div className="mb-4">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                  isDragActive 
                    ? 'border-orange-400 bg-orange-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input {...getInputProps()} />
                <PhotoIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Drop files here or click to select
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Images, documents, up to 10MB each
                </p>
              </div>
            </div>
          )}
          
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                rows={1}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                style={{ minHeight: '40px', maxHeight: '120px' }}
              />
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowFileUpload(!showFileUpload)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <PaperClipIcon className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <FaceSmileIcon className="w-5 h-5" />
              </button>
              
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PaperAirplaneIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex bg-gray-50">
      {renderConversationList()}
      {renderChatArea()}
    </div>
  );
};

export default MessagingSystem; 