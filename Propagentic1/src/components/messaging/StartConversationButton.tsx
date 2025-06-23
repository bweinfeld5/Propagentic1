import React, { useState } from 'react';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import useMessages from '../../hooks/useMessages';
import { MessageParticipant } from '../../services/firestore/messageService';
import toast from 'react-hot-toast';

interface StartConversationButtonProps {
  targetUserId: string;
  targetUserName: string;
  targetUserRole: 'landlord' | 'contractor' | 'tenant';
  targetUserEmail?: string;
  targetUserCompany?: string;
  metadata?: {
    propertyId?: string;
    propertyName?: string;
    jobId?: string;
    jobTitle?: string;
  };
  initialMessage?: string;
  className?: string;
  variant?: 'button' | 'icon' | 'link';
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
}

const StartConversationButton: React.FC<StartConversationButtonProps> = ({
  targetUserId,
  targetUserName,
  targetUserRole,
  targetUserEmail = '',
  targetUserCompany,
  metadata,
  initialMessage,
  className = '',
  variant = 'button',
  size = 'md',
  children
}) => {
  const { currentUser, userProfile } = useAuth();
  const { createConversation } = useMessages();
  const [isLoading, setIsLoading] = useState(false);

  const getUserDisplayName = () => {
    if (!userProfile) return 'Unknown User';
    
    if (userProfile.firstName && userProfile.lastName) {
      return `${userProfile.firstName} ${userProfile.lastName}`;
    }
    
    return userProfile.displayName || userProfile.name || userProfile.email || 'Unknown User';
  };

  const handleStartConversation = async () => {
    if (!currentUser || !userProfile) {
      toast.error('Please log in to start a conversation');
      return;
    }

    if (currentUser.uid === targetUserId) {
      toast.error('You cannot start a conversation with yourself');
      return;
    }

    setIsLoading(true);

    try {
      // Create participants array
      const currentUserParticipant: MessageParticipant = {
        id: currentUser.uid,
        name: getUserDisplayName(),
        email: userProfile.email || currentUser.email || '',
        role: userProfile.userType || userProfile.role,
        company: userProfile.businessName || userProfile.company
      };

      const targetUserParticipant: MessageParticipant = {
        id: targetUserId,
        name: targetUserName,
        email: targetUserEmail,
        role: targetUserRole,
        company: targetUserCompany
      };

      // Determine conversation type
      const userRole = currentUserParticipant.role;
      let conversationType: 'landlord-contractor' | 'landlord-tenant' | 'contractor-tenant';

      if (
        (userRole === 'landlord' && targetUserRole === 'contractor') ||
        (userRole === 'contractor' && targetUserRole === 'landlord')
      ) {
        conversationType = 'landlord-contractor';
      } else if (
        (userRole === 'landlord' && targetUserRole === 'tenant') ||
        (userRole === 'tenant' && targetUserRole === 'landlord')
      ) {
        conversationType = 'landlord-tenant';
      } else if (
        (userRole === 'contractor' && targetUserRole === 'tenant') ||
        (userRole === 'tenant' && targetUserRole === 'contractor')
      ) {
        conversationType = 'contractor-tenant';
      } else {
        conversationType = 'landlord-contractor'; // Default fallback
      }

      // Create or get existing conversation
      const conversationId = await createConversation(
        [currentUserParticipant, targetUserParticipant],
        conversationType,
        metadata
      );

      // Send initial message if provided
      if (initialMessage && initialMessage.trim()) {
        const messageService = await import('../../services/firestore/messageService');
        await messageService.default.sendMessage(
          conversationId,
          currentUser.uid,
          getUserDisplayName(),
          userRole,
          initialMessage.trim()
        );
      }

      toast.success(`Conversation started with ${targetUserName}`);
      
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error('Failed to start conversation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Size classes
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  // Render based on variant
  if (variant === 'icon') {
    return (
      <button
        onClick={handleStartConversation}
        disabled={isLoading}
        className={`
          inline-flex items-center justify-center rounded-full
          text-gray-600 hover:text-gray-800 hover:bg-gray-100
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors duration-200
          ${sizeClasses[size]}
          ${className}
        `}
        title={`Message ${targetUserName}`}
      >
        {isLoading ? (
          <div className={`animate-spin rounded-full border-b-2 border-current ${iconSizes[size]}`} />
        ) : (
          <ChatBubbleLeftRightIcon className={iconSizes[size]} />
        )}
      </button>
    );
  }

  if (variant === 'link') {
    return (
      <button
        onClick={handleStartConversation}
        disabled={isLoading}
        className={`
          inline-flex items-center gap-2
          text-orange-600 hover:text-orange-700
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors duration-200
          ${sizeClasses[size]}
          ${className}
        `}
      >
        {isLoading ? (
          <div className={`animate-spin rounded-full border-b-2 border-current ${iconSizes[size]}`} />
        ) : (
          <ChatBubbleLeftRightIcon className={iconSizes[size]} />
        )}
        {children || `Message ${targetUserName}`}
      </button>
    );
  }

  // Default button variant
  return (
    <button
      onClick={handleStartConversation}
      disabled={isLoading}
      className={`
        inline-flex items-center gap-2
        bg-orange-500 hover:bg-orange-600 text-white
        rounded-lg font-medium
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-200
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {isLoading ? (
        <div className={`animate-spin rounded-full border-b-2 border-white ${iconSizes[size]}`} />
      ) : (
        <ChatBubbleLeftRightIcon className={iconSizes[size]} />
      )}
      {children || (isLoading ? 'Starting...' : 'Message')}
    </button>
  );
};

export default StartConversationButton; 