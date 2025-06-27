/**
 * Communication Types and Interfaces
 */

import { Timestamp } from 'firebase/firestore';

export type CommunicationRole = 'tenant' | 'landlord' | 'contractor' | 'admin' | 'system';

export type MessageType = 'message' | 'system' | 'status_change' | 'document' | 'note';

export interface CommunicationMessage {
  id: string;
  requestId: string;
  senderId: string;
  senderName: string;
  senderRole: CommunicationRole;
  content: string;
  timestamp: Timestamp;
  type: MessageType;
  isRead: boolean;
  attachments?: string[];
  isUrgent: boolean;
  metadata?: Record<string, any>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Participant {
  id: string;
  name: string;
  role: CommunicationRole;
  email?: string;
  phone?: string;
  avatar?: string;
  lastReadAt?: Timestamp;
}

export interface Conversation {
  id?: string;
  participants: Participant[];
  type: 'maintenance' | 'general' | 'announcement';
  propertyId?: string;
  requestId?: string;
  jobId?: string;
  title: string;
  lastMessage?: CommunicationMessage | null;
  unreadCounts: Record<string, number>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface Message {
  id?: string;
  conversationId: string;
  sender: string;
  senderName: string;
  senderRole: CommunicationRole;
  text: string;
  timestamp: Timestamp;
  attachments?: string[];
  readBy: string[];
  metadata?: Record<string, any>;
}

export interface NotificationPreference {
  userId: string;
  email: boolean;
  push: boolean;
  sms: boolean;
  types: {
    newMessage: boolean;
    statusChange: boolean;
    assignment: boolean;
    reminder: boolean;
  };
}

export interface Communication {
  id: string;
  requestId: string;
  participants: {
    userId: string;
    role: CommunicationRole;
    name: string;
    lastReadAt?: Date;
  }[];
  messages: CommunicationMessage[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date;
  unreadCount: Record<string, number>; // userId -> unread count
} 