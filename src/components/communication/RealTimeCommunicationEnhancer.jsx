import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  BellIcon,
  ChatBubbleLeftRightIcon,
  WifiIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  UserGroupIcon,
  BoltIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { offlineManager, appBadgeUtils, hapticUtils } from '../../utils/pwaUtils';
import { toast } from 'react-hot-toast';

const RealTimeCommunicationEnhancer = ({ 
  children,
  enableNotifications = true,
  enableHaptics = true,
  enableBadges = true 
}) => {
  const { currentUser } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionQuality, setConnectionQuality] = useState('good');
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeConversations, setActiveConversations] = useState([]);
  const [realtimeStatus, setRealtimeStatus] = useState('connecting');
  const connectionRef = useRef(null);
  const heartbeatRef = useRef(null);

  // Enhanced connection monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setConnectionQuality('good');
      setRealtimeStatus('connected');
      
      if (enableNotifications) {
        toast.success('Connection restored! 🌐', {
          duration: 3000,
          icon: '✅',
        });
      }
      
      if (enableHaptics) {
        hapticUtils.success();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setConnectionQuality('offline');
      setRealtimeStatus('disconnected');
      
      if (enableNotifications) {
        toast.error('Connection lost. Working offline...', {
          duration: 5000,
          icon: '📡',
        });
      }
      
      if (enableHaptics) {
        hapticUtils.error();
      }
    };

    // Connection quality monitoring
    const monitorConnection = () => {
      if ('connection' in navigator) {
        const connection = navigator.connection;
        const updateConnectionQuality = () => {
          if (connection.effectiveType === '4g') {
            setConnectionQuality('excellent');
          } else if (connection.effectiveType === '3g') {
            setConnectionQuality('good');
          } else if (connection.effectiveType === '2g') {
            setConnectionQuality('poor');
          } else {
            setConnectionQuality('unknown');
          }
        };

        connection.addEventListener('change', updateConnectionQuality);
        updateConnectionQuality();

        return () => {
          connection.removeEventListener('change', updateConnectionQuality);
        };
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    const cleanupConnection = monitorConnection();

    // Initial status
    if (navigator.onLine) {
      setRealtimeStatus('connected');
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (cleanupConnection) cleanupConnection();
    };
  }, [enableNotifications, enableHaptics]);

  // Heartbeat for connection monitoring
  useEffect(() => {
    if (!isOnline) return;

    const startHeartbeat = () => {
      heartbeatRef.current = setInterval(async () => {
        try {
          const start = Date.now();
          const response = await fetch('/api/heartbeat', {
            method: 'HEAD',
            cache: 'no-cache'
          });
          const latency = Date.now() - start;

          if (response.ok) {
            setRealtimeStatus('connected');
            if (latency < 100) {
              setConnectionQuality('excellent');
            } else if (latency < 500) {
              setConnectionQuality('good');
            } else {
              setConnectionQuality('poor');
            }
          } else {
            setRealtimeStatus('degraded');
          }
        } catch (error) {
          setRealtimeStatus('reconnecting');
          setConnectionQuality('poor');
        }
      }, 30000); // Check every 30 seconds
    };

    startHeartbeat();

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
    };
  }, [isOnline]);

  // Real-time message listening
  useEffect(() => {
    if (!currentUser || !isOnline) return;

    // Mock real-time listener - replace with actual WebSocket/Firebase listener
    const messageListener = {
      onMessage: (message) => {
        setUnreadCount(prev => prev + 1);
        
        if (enableNotifications) {
          toast(`New message from ${message.senderName}`, {
            duration: 4000,
            icon: '💬',
            action: {
              label: 'View',
              onClick: () => window.location.href = `/messages/${message.conversationId}`
            }
          });
        }
        
        if (enableHaptics && document.hidden) {
          hapticUtils.medium();
        }
        
        if (enableBadges) {
          appBadgeUtils.setBadge(unreadCount + 1);
        }
      },

      onConversationUpdate: (conversation) => {
        setActiveConversations(prev => {
          const existing = prev.findIndex(c => c.id === conversation.id);
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = conversation;
            return updated;
          } else {
            return [...prev, conversation];
          }
        });
      },

      onTyping: (data) => {
        // Handle typing indicators
        if (enableHaptics) {
          hapticUtils.light();
        }
      }
    };

    // Set up listeners (mock implementation)
    console.log('Setting up real-time listeners for user:', currentUser.uid);
    
    return () => {
      console.log('Cleaning up real-time listeners');
    };
  }, [currentUser, isOnline, enableNotifications, enableHaptics, enableBadges, unreadCount]);

  // Enhanced message sending with retry logic
  const sendMessage = useCallback(async (conversationId, message, options = {}) => {
    if (!isOnline) {
      // Queue for later sending
      const queuedMessage = {
        conversationId,
        message,
        timestamp: Date.now(),
        status: 'queued'
      };
      
      localStorage.setItem('queued_messages', JSON.stringify([
        ...JSON.parse(localStorage.getItem('queued_messages') || '[]'),
        queuedMessage
      ]));
      
      toast('Message queued for sending when online', {
        icon: '⏳',
        duration: 3000
      });
      
      return;
    }

    try {
      // Optimistic update
      if (options.optimistic) {
        // Add message to UI immediately
      }

      // Send message with retry logic
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          const response = await fetch('/api/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              conversationId,
              message,
              userId: currentUser.uid
            })
          });

          if (response.ok) {
            if (enableHaptics) {
              hapticUtils.light();
            }
            break;
          } else {
            throw new Error(`HTTP ${response.status}`);
          }
        } catch (error) {
          attempts++;
          if (attempts === maxAttempts) {
            throw error;
          }
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      
      if (enableNotifications) {
        toast.error('Failed to send message. Please try again.', {
          duration: 5000
        });
      }
      
      if (enableHaptics) {
        hapticUtils.error();
      }
    }
  }, [isOnline, currentUser, enableHaptics, enableNotifications]);

  // Process queued messages when coming back online
  useEffect(() => {
    if (!isOnline) return;

    const processQueuedMessages = async () => {
      const queuedMessages = JSON.parse(localStorage.getItem('queued_messages') || '[]');
      
      if (queuedMessages.length > 0) {
        toast(`Sending ${queuedMessages.length} queued messages...`, {
          icon: '📤',
          duration: 2000
        });

        for (const msg of queuedMessages) {
          await sendMessage(msg.conversationId, msg.message);
        }

        localStorage.removeItem('queued_messages');
        
        toast.success('All queued messages sent!', {
          duration: 3000
        });
      }
    };

    processQueuedMessages();
  }, [isOnline, sendMessage]);

  const getConnectionIcon = () => {
    if (!isOnline) {
      return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
    }

    switch (realtimeStatus) {
      case 'connected':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'connecting':
      case 'reconnecting':
        return <ClockIcon className="w-5 h-5 text-yellow-500 animate-spin" />;
      case 'degraded':
        return <ExclamationTriangleIcon className="w-5 h-5 text-orange-500" />;
      default:
        return <WifiIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getConnectionStatus = () => {
    if (!isOnline) return 'Offline';
    
    switch (realtimeStatus) {
      case 'connected':
        return `Connected (${connectionQuality})`;
      case 'connecting':
        return 'Connecting...';
      case 'reconnecting':
        return 'Reconnecting...';
      case 'degraded':
        return 'Connection issues';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = () => {
    if (!isOnline) return 'text-red-600 bg-red-50';
    
    switch (realtimeStatus) {
      case 'connected':
        return 'text-green-600 bg-green-50';
      case 'connecting':
      case 'reconnecting':
        return 'text-yellow-600 bg-yellow-50';
      case 'degraded':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="relative">
      {/* Connection Status Bar */}
      <div className={`border-b border-gray-200 px-4 py-2 ${getStatusColor()}`}>
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            {getConnectionIcon()}
            <div className="flex items-center gap-4 text-sm">
              <span className="font-medium">
                {getConnectionStatus()}
              </span>
              
              {activeConversations.length > 0 && (
                <div className="flex items-center gap-1">
                  <UserGroupIcon className="w-4 h-4" />
                  <span>{activeConversations.length} active</span>
                </div>
              )}
              
              {unreadCount > 0 && (
                <div className="flex items-center gap-1">
                  <ChatBubbleLeftRightIcon className="w-4 h-4" />
                  <span>{unreadCount} unread</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            {realtimeStatus === 'degraded' && (
              <button
                onClick={() => window.location.reload()}
                className="text-xs px-2 py-1 bg-white border border-current rounded hover:bg-opacity-80 transition-colors"
              >
                Refresh
              </button>
            )}
            
            <div className="flex items-center gap-1">
              <BoltIcon className="w-4 h-4" />
              <span className="text-xs">Real-time</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced children with communication context */}
      <div className="communication-enhanced">
        {React.cloneElement(children, {
          ...children.props,
          communicationStatus: {
            isOnline,
            realtimeStatus,
            connectionQuality,
            unreadCount,
            activeConversations,
            sendMessage
          }
        })}
      </div>
    </div>
  );
};

export default RealTimeCommunicationEnhancer; 