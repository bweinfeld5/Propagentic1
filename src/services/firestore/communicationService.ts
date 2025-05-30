import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch,
  arrayUnion,
  arrayRemove,
  increment
} from 'firebase/firestore';
import { db } from '../../firebase/config';

export interface Participant {
  id: string;
  name: string;
  email: string;
  role: 'landlord' | 'tenant' | 'contractor';
  avatar?: string;
  property?: string;
  company?: string;
  isOnline?: boolean;
  lastSeen?: Date;
}

export interface Conversation {
  id?: string;
  type: 'tenant-landlord' | 'contractor-communication' | 'group' | 'support';
  participants: Participant[];
  title?: string;
  lastMessage?: {
    text: string;
    timestamp: Date;
    sender: string;
    type: 'text' | 'image' | 'file' | 'system';
  };
  unreadCounts: Record<string, number>;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  tags?: string[];
  propertyId?: string;
  jobId?: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface Message {
  id?: string;
  conversationId: string;
  sender: string;
  senderName: string;
  senderRole: string;
  text?: string;
  type: 'text' | 'image' | 'file' | 'system' | 'typing';
  fileName?: string;
  fileSize?: number;
  fileUrl?: string;
  fileMimeType?: string;
  replyTo?: string;
  reactions?: Record<string, string[]>; // emoji -> user IDs
  editedAt?: Date;
  isEdited: boolean;
  isDeleted: boolean;
  readBy: Record<string, Date>;
  deliveredTo: Record<string, Date>;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface NotificationPreference {
  userId: string;
  email: {
    enabled: boolean;
    events: {
      newMessage: boolean;
      maintenanceUpdates: boolean;
      paymentReminders: boolean;
      contractorBids: boolean;
      escalations: boolean;
      systemUpdates: boolean;
    };
    frequency: 'instant' | 'hourly' | 'daily' | 'weekly';
    quietHours: {
      enabled: boolean;
      start: string; // HH:mm format
      end: string;
    };
  };
  sms: {
    enabled: boolean;
    phoneNumber?: string;
    events: {
      urgentMessages: boolean;
      emergencyMaintenance: boolean;
      securityAlerts: boolean;
      paymentFailures: boolean;
    };
  };
  push: {
    enabled: boolean;
    events: {
      newMessage: boolean;
      mentions: boolean;
      directMessages: boolean;
      groupMessages: boolean;
      systemNotifications: boolean;
    };
  };
  inApp: {
    enabled: boolean;
    showPreview: boolean;
    playSound: boolean;
    showDesktopNotifications: boolean;
  };
  updatedAt: Date;
}

class CommunicationService {
  private conversationsRef = collection(db, 'conversations');
  private messagesRef = collection(db, 'messages');
  private notificationPrefsRef = collection(db, 'notificationPreferences');
  private onlineUsersRef = collection(db, 'onlineUsers');

  // ========== CONVERSATION MANAGEMENT ==========

  async createConversation(conversation: Omit<Conversation, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const unreadCounts: Record<string, number> = {};
      
      // Initialize unread counts for all participants
      conversation.participants.forEach(participant => {
        unreadCounts[participant.id] = 0;
      });

      const conversationData = {
        ...conversation,
        unreadCounts,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(this.conversationsRef, conversationData);
      console.log('Conversation created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  async getConversationsForUser(userId: string): Promise<Conversation[]> {
    try {
      const q = query(
        this.conversationsRef,
        where('participants', 'array-contains-any', [userId]),
        where('isArchived', '==', false),
        orderBy('updatedAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        lastMessage: doc.data().lastMessage ? {
          ...doc.data().lastMessage,
          timestamp: doc.data().lastMessage.timestamp?.toDate()
        } : undefined
      } as Conversation));
    } catch (error) {
      console.error('Error getting conversations:', error);
      throw error;
    }
  }

  subscribeToConversations(userId: string, callback: (conversations: Conversation[]) => void): () => void {
    const q = query(
      this.conversationsRef,
      where('participants', 'array-contains-any', [userId]),
      where('isArchived', '==', false),
      orderBy('updatedAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const conversations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        lastMessage: doc.data().lastMessage ? {
          ...doc.data().lastMessage,
          timestamp: doc.data().lastMessage.timestamp?.toDate()
        } : undefined
      } as Conversation));
      callback(conversations);
    });
  }

  async updateConversation(conversationId: string, updates: Partial<Conversation>): Promise<void> {
    try {
      const conversationRef = doc(this.conversationsRef, conversationId);
      await updateDoc(conversationRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating conversation:', error);
      throw error;
    }
  }

  // ========== MESSAGE MANAGEMENT ==========

  async sendMessage(message: Omit<Message, 'id' | 'timestamp' | 'readBy' | 'deliveredTo' | 'isEdited' | 'isDeleted'>): Promise<string> {
    try {
      const batch = writeBatch(db);

      // Create message
      const messageData = {
        ...message,
        timestamp: serverTimestamp(),
        readBy: { [message.sender]: serverTimestamp() },
        deliveredTo: {},
        isEdited: false,
        isDeleted: false,
        reactions: {}
      };

      const messageRef = doc(this.messagesRef);
      batch.set(messageRef, messageData);

      // Update conversation
      const conversationRef = doc(this.conversationsRef, message.conversationId);
      const conversationUpdate = {
        lastMessage: {
          text: message.text || `${message.type} message`,
          timestamp: serverTimestamp(),
          sender: message.sender,
          type: message.type
        },
        updatedAt: serverTimestamp()
      };

      // Update unread counts for other participants
      const conversationDoc = await getDoc(conversationRef);
      if (conversationDoc.exists()) {
        const conversation = conversationDoc.data() as Conversation;
        const updates: Record<string, any> = {};
        
        conversation.participants.forEach(participant => {
          if (participant.id !== message.sender) {
            updates[`unreadCounts.${participant.id}`] = increment(1);
          }
        });

        batch.update(conversationRef, { ...conversationUpdate, ...updates });
      }

      await batch.commit();
      console.log('Message sent with ID:', messageRef.id);
      return messageRef.id;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async getMessages(conversationId: string, limitCount: number = 50): Promise<Message[]> {
    try {
      const q = query(
        this.messagesRef,
        where('conversationId', '==', conversationId),
        where('isDeleted', '==', false),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate(),
        editedAt: doc.data().editedAt?.toDate(),
        readBy: Object.fromEntries(
          Object.entries(doc.data().readBy || {}).map(([key, value]) => [key, (value as Timestamp).toDate()])
        ),
        deliveredTo: Object.fromEntries(
          Object.entries(doc.data().deliveredTo || {}).map(([key, value]) => [key, (value as Timestamp).toDate()])
        )
      } as Message)).reverse();
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  }

  subscribeToMessages(conversationId: string, callback: (messages: Message[]) => void): () => void {
    const q = query(
      this.messagesRef,
      where('conversationId', '==', conversationId),
      where('isDeleted', '==', false),
      orderBy('timestamp', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate(),
        editedAt: doc.data().editedAt?.toDate(),
        readBy: Object.fromEntries(
          Object.entries(doc.data().readBy || {}).map(([key, value]) => [key, (value as Timestamp).toDate()])
        ),
        deliveredTo: Object.fromEntries(
          Object.entries(doc.data().deliveredTo || {}).map(([key, value]) => [key, (value as Timestamp).toDate()])
        )
      } as Message));
      callback(messages);
    });
  }

  async markAsRead(conversationId: string, messageId: string, userId: string): Promise<void> {
    try {
      const batch = writeBatch(db);

      // Mark message as read
      const messageRef = doc(this.messagesRef, messageId);
      batch.update(messageRef, {
        [`readBy.${userId}`]: serverTimestamp()
      });

      // Reset unread count for user in conversation
      const conversationRef = doc(this.conversationsRef, conversationId);
      batch.update(conversationRef, {
        [`unreadCounts.${userId}`]: 0
      });

      await batch.commit();
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }

  async editMessage(messageId: string, newText: string): Promise<void> {
    try {
      const messageRef = doc(this.messagesRef, messageId);
      await updateDoc(messageRef, {
        text: newText,
        isEdited: true,
        editedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error editing message:', error);
      throw error;
    }
  }

  async deleteMessage(messageId: string): Promise<void> {
    try {
      const messageRef = doc(this.messagesRef, messageId);
      await updateDoc(messageRef, {
        isDeleted: true,
        text: 'This message was deleted'
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  async addReaction(messageId: string, userId: string, emoji: string): Promise<void> {
    try {
      const messageRef = doc(this.messagesRef, messageId);
      await updateDoc(messageRef, {
        [`reactions.${emoji}`]: arrayUnion(userId)
      });
    } catch (error) {
      console.error('Error adding reaction:', error);
      throw error;
    }
  }

  async removeReaction(messageId: string, userId: string, emoji: string): Promise<void> {
    try {
      const messageRef = doc(this.messagesRef, messageId);
      await updateDoc(messageRef, {
        [`reactions.${emoji}`]: arrayRemove(userId)
      });
    } catch (error) {
      console.error('Error removing reaction:', error);
      throw error;
    }
  }

  // ========== NOTIFICATION PREFERENCES ==========

  async getNotificationPreferences(userId: string): Promise<NotificationPreference | null> {
    try {
      const docRef = doc(this.notificationPrefsRef, userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          ...docSnap.data(),
          updatedAt: docSnap.data().updatedAt?.toDate()
        } as NotificationPreference;
      }
      return null;
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      throw error;
    }
  }

  async updateNotificationPreferences(userId: string, preferences: Partial<NotificationPreference>): Promise<void> {
    try {
      const docRef = doc(this.notificationPrefsRef, userId);
      await updateDoc(docRef, {
        ...preferences,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  async createDefaultNotificationPreferences(userId: string): Promise<void> {
    try {
      const defaultPrefs: Omit<NotificationPreference, 'updatedAt'> = {
        userId,
        email: {
          enabled: true,
          events: {
            newMessage: true,
            maintenanceUpdates: true,
            paymentReminders: true,
            contractorBids: true,
            escalations: true,
            systemUpdates: false
          },
          frequency: 'instant',
          quietHours: {
            enabled: false,
            start: '22:00',
            end: '08:00'
          }
        },
        sms: {
          enabled: false,
          events: {
            urgentMessages: true,
            emergencyMaintenance: true,
            securityAlerts: true,
            paymentFailures: true
          }
        },
        push: {
          enabled: true,
          events: {
            newMessage: true,
            mentions: true,
            directMessages: true,
            groupMessages: true,
            systemNotifications: true
          }
        },
        inApp: {
          enabled: true,
          showPreview: true,
          playSound: true,
          showDesktopNotifications: true
        }
      };

      const docRef = doc(this.notificationPrefsRef, userId);
      await updateDoc(docRef, {
        ...defaultPrefs,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error creating default notification preferences:', error);
      throw error;
    }
  }

  // ========== PRESENCE MANAGEMENT ==========

  async updateUserPresence(userId: string, isOnline: boolean): Promise<void> {
    try {
      const userPresenceRef = doc(this.onlineUsersRef, userId);
      if (isOnline) {
        await updateDoc(userPresenceRef, {
          isOnline: true,
          lastSeen: serverTimestamp()
        });
      } else {
        await updateDoc(userPresenceRef, {
          isOnline: false,
          lastSeen: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error updating user presence:', error);
      throw error;
    }
  }

  subscribeToUserPresence(userIds: string[], callback: (presenceData: Record<string, { isOnline: boolean; lastSeen: Date }>) => void): () => void {
    const q = query(
      this.onlineUsersRef,
      where('__name__', 'in', userIds)
    );

    return onSnapshot(q, (snapshot) => {
      const presenceData: Record<string, { isOnline: boolean; lastSeen: Date }> = {};
      snapshot.docs.forEach(doc => {
        presenceData[doc.id] = {
          isOnline: doc.data().isOnline || false,
          lastSeen: doc.data().lastSeen?.toDate() || new Date()
        };
      });
      callback(presenceData);
    });
  }

  // ========== SEARCH AND UTILITY ==========

  async searchConversations(userId: string, searchTerm: string): Promise<Conversation[]> {
    try {
      // Note: Firestore doesn't support full-text search natively
      // For production, consider using Algolia or similar service
      const conversations = await this.getConversationsForUser(userId);
      
      return conversations.filter(conv => 
        conv.participants.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (conv.title && conv.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (conv.lastMessage && conv.lastMessage.text.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    } catch (error) {
      console.error('Error searching conversations:', error);
      throw error;
    }
  }

  async searchMessages(conversationId: string, searchTerm: string): Promise<Message[]> {
    try {
      const messages = await this.getMessages(conversationId, 1000); // Get more messages for search
      
      return messages.filter(msg => 
        msg.text && msg.text.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } catch (error) {
      console.error('Error searching messages:', error);
      throw error;
    }
  }

  async archiveConversation(conversationId: string): Promise<void> {
    try {
      await this.updateConversation(conversationId, { isArchived: true });
    } catch (error) {
      console.error('Error archiving conversation:', error);
      throw error;
    }
  }

  async unarchiveConversation(conversationId: string): Promise<void> {
    try {
      await this.updateConversation(conversationId, { isArchived: false });
    } catch (error) {
      console.error('Error unarchiving conversation:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const communicationService = new CommunicationService();
export default communicationService; 