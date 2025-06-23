import { useState, useEffect, useCallback } from 'react';
import { Unsubscribe } from 'firebase/firestore';
import messageService, { 
  Conversation, 
  Message, 
  MessageParticipant 
} from '../services/firestore/messageService';
import { useAuth } from '../context/AuthContext';

interface UseMessagesReturn {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  error: string | null;
  setActiveConversation: (conversation: Conversation | null) => void;
  sendMessage: (text: string, type?: Message['type']) => Promise<void>;
  markAsRead: () => Promise<void>;
  createConversation: (participants: MessageParticipant[], type: Conversation['type'], metadata?: Conversation['metadata']) => Promise<string>;
  searchConversations: (searchTerm: string) => Promise<Conversation[]>;
  refreshConversations: () => Promise<void>;
}

export const useMessages = (): UseMessagesReturn => {
  const { currentUser, userProfile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Unsubscribe functions
  const [conversationUnsubscribe, setConversationUnsubscribe] = useState<Unsubscribe | null>(null);
  const [messageUnsubscribe, setMessageUnsubscribe] = useState<Unsubscribe | null>(null);

  // Get user display name
  const getUserDisplayName = useCallback(() => {
    if (!userProfile) return 'Unknown User';
    
    if (userProfile.firstName && userProfile.lastName) {
      return `${userProfile.firstName} ${userProfile.lastName}`;
    }
    
    return userProfile.displayName || userProfile.name || userProfile.email || 'Unknown User';
  }, [userProfile]);

  // Load conversations when user changes
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    console.log('useMessages: Setting up subscription for user:', currentUser.uid);
    setLoading(true);
    setError(null);

    // Set a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      console.log('useMessages: Loading timeout reached, assuming no conversations');
      setLoading(false);
      setConversations([]);
    }, 5000); // 5 second timeout

    try {
      // Subscribe to conversations
      const unsubscribe = messageService.subscribeToUserConversations(
        currentUser.uid,
        (updatedConversations) => {
          console.log('useMessages: Received conversations:', updatedConversations);
          clearTimeout(loadingTimeout);
          setConversations(updatedConversations);
          setLoading(false);
          setError(null);
        }
      );

      setConversationUnsubscribe(unsubscribe);

      // Cleanup function
      return () => {
        clearTimeout(loadingTimeout);
        if (unsubscribe) {
          unsubscribe();
        }
      };
    } catch (err) {
      console.error('Error setting up conversation subscription:', err);
      clearTimeout(loadingTimeout);
      setError('Failed to connect to messaging service');
      setLoading(false);
    }
  }, [currentUser]);

  // Subscribe to messages when active conversation changes
  useEffect(() => {
    // Clean up previous message subscription
    if (messageUnsubscribe) {
      messageUnsubscribe();
      setMessageUnsubscribe(null);
    }

    if (!activeConversation?.id) {
      setMessages([]);
      return;
    }

    // Subscribe to messages for active conversation
    const unsubscribe = messageService.subscribeToConversationMessages(
      activeConversation.id,
      (updatedMessages) => {
        setMessages(updatedMessages);
      }
    );

    setMessageUnsubscribe(unsubscribe);

    // Mark messages as read when conversation becomes active
    if (currentUser) {
      messageService.markMessagesAsRead(activeConversation.id, currentUser.uid);
    }

    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [activeConversation, currentUser]);

  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      if (conversationUnsubscribe) {
        conversationUnsubscribe();
      }
      if (messageUnsubscribe) {
        messageUnsubscribe();
      }
    };
  }, [conversationUnsubscribe, messageUnsubscribe]);

  // Send a message
  const sendMessage = useCallback(async (text: string, type: Message['type'] = 'text') => {
    if (!currentUser || !userProfile || !activeConversation?.id || !text.trim()) {
      return;
    }

    try {
      setError(null);
      
      const senderName = getUserDisplayName();
      const senderRole = userProfile.userType || userProfile.role;

      await messageService.sendMessage(
        activeConversation.id,
        currentUser.uid,
        senderName,
        senderRole,
        text.trim(),
        type
      );
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    }
  }, [currentUser, userProfile, activeConversation, getUserDisplayName]);

  // Mark messages as read
  const markAsRead = useCallback(async () => {
    if (!currentUser || !activeConversation?.id) {
      return;
    }

    try {
      await messageService.markMessagesAsRead(activeConversation.id, currentUser.uid);
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  }, [currentUser, activeConversation]);

  // Create a new conversation
  const createConversation = useCallback(async (
    participants: MessageParticipant[],
    type: Conversation['type'],
    metadata?: Conversation['metadata']
  ): Promise<string> => {
    if (!currentUser || !userProfile) {
      throw new Error('User not authenticated');
    }

    try {
      setError(null);
      
      const conversationId = await messageService.createConversation(
        participants,
        type,
        metadata
      );
      
      // Refresh conversations to include the new one
      await refreshConversations();
      
      return conversationId;
    } catch (err) {
      console.error('Error creating conversation:', err);
      setError('Failed to create conversation. Please try again.');
      throw err;
    }
  }, [currentUser, userProfile]);

  // Search conversations
  const searchConversations = useCallback(async (searchTerm: string): Promise<Conversation[]> => {
    if (!currentUser || !searchTerm.trim()) {
      return conversations;
    }

    try {
      setError(null);
      return await messageService.searchConversations(currentUser.uid, searchTerm.trim());
    } catch (err) {
      console.error('Error searching conversations:', err);
      setError('Failed to search conversations.');
      return conversations;
    }
  }, [currentUser, conversations]);

  // Refresh conversations manually
  const refreshConversations = useCallback(async () => {
    if (!currentUser) {
      return;
    }

    try {
      setError(null);
      const updatedConversations = await messageService.getUserConversations(currentUser.uid);
      setConversations(updatedConversations);
    } catch (err) {
      console.error('Error refreshing conversations:', err);
      setError('Failed to refresh conversations.');
    }
  }, [currentUser]);

  return {
    conversations,
    activeConversation,
    messages,
    loading,
    error,
    setActiveConversation,
    sendMessage,
    markAsRead,
    createConversation,
    searchConversations,
    refreshConversations,
  };
};

export default useMessages; 