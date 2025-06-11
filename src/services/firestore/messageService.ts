import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  increment,
  Timestamp,
  DocumentReference,
  QuerySnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '../../firebase/config';

export interface MessageParticipant {
  id: string;
  name: string;
  email: string;
  role: 'landlord' | 'contractor' | 'tenant' | 'system';
  avatar?: string;
  company?: string;
}

export interface MessageAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface Message {
  id?: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: 'landlord' | 'contractor' | 'tenant' | 'system';
  text: string;
  type: 'text' | 'image' | 'file' | 'system';
  attachments?: MessageAttachment[];
  timestamp: Date;
  readBy: Record<string, Date>;
  isEdited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
}

export interface Conversation {
  id?: string;
  type: 'landlord-contractor' | 'landlord-tenant' | 'contractor-tenant' | 'group';
  participants: MessageParticipant[];
  title?: string;
  lastMessage?: {
    text: string;
    timestamp: Date;
    senderId: string;
    senderName: string;
  };
  unreadCounts: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
  isArchived: boolean;
  metadata?: {
    propertyId?: string;
    propertyName?: string;
    jobId?: string;
    jobTitle?: string;
  };
}

class MessageService {
  private conversationsRef = collection(db, 'conversations');
  private messagesRef = collection(db, 'messages');

  // ========== CONVERSATION MANAGEMENT ==========

  /**
   * Create a new conversation between users
   */
  async createConversation(
    participants: MessageParticipant[],
    type: Conversation['type'],
    metadata?: Conversation['metadata']
  ): Promise<string> {
    try {
      // Check if conversation already exists between these participants
      const existingConversation = await this.findConversationByParticipants(
        participants.map(p => p.id)
      );

      if (existingConversation) {
        return existingConversation.id!;
      }

      // Create title based on participants
      const title = participants
        .filter(p => p.role !== 'system')
        .map(p => p.name)
        .join(', ');

      const conversationData: Omit<Conversation, 'id'> = {
        type,
        participants,
        title,
        unreadCounts: participants.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {}),
        createdAt: new Date(),
        updatedAt: new Date(),
        isArchived: false,
        metadata
      };

      const docRef = await addDoc(this.conversationsRef, {
        ...conversationData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log('Conversation created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  /**
   * Find conversation between specific participants
   */
  async findConversationByParticipants(participantIds: string[]): Promise<Conversation | null> {
    try {
      const q = query(
        this.conversationsRef,
        where('isArchived', '==', false)
      );

      const querySnapshot = await getDocs(q);
      
      for (const doc of querySnapshot.docs) {
        const conversation = { id: doc.id, ...doc.data() } as Conversation;
        const conversationParticipantIds = conversation.participants.map(p => p.id);
        
        // Check if all participant IDs match (regardless of order)
        if (
          participantIds.length === conversationParticipantIds.length &&
          participantIds.every(id => conversationParticipantIds.includes(id))
        ) {
          return conversation;
        }
      }

      return null;
    } catch (error) {
      console.error('Error finding conversation:', error);
      throw error;
    }
  }

  /**
   * Get conversations for a specific user
   */
  async getUserConversations(userId: string): Promise<Conversation[]> {
    try {
      const q = query(
        this.conversationsRef,
        where('isArchived', '==', false),
        orderBy('updatedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const conversations: Conversation[] = [];

      querySnapshot.forEach(doc => {
        const conversation = { id: doc.id, ...doc.data() } as Conversation;
        
        // Check if user is a participant
        if (conversation.participants.some(p => p.id === userId)) {
          conversations.push(conversation);
        }
      });

      return conversations;
    } catch (error) {
      console.error('Error getting user conversations:', error);
      throw error;
    }
  }

  /**
   * Listen to real-time updates for user conversations
   */
  subscribeToUserConversations(
    userId: string,
    callback: (conversations: Conversation[]) => void
  ): Unsubscribe {
    const q = query(
      this.conversationsRef,
      where('isArchived', '==', false),
      orderBy('updatedAt', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const conversations: Conversation[] = [];

      querySnapshot.forEach(doc => {
        const conversation = { id: doc.id, ...doc.data() } as Conversation;
        
        // Check if user is a participant
        if (conversation.participants.some(p => p.id === userId)) {
          // Convert Firestore timestamps to Date objects
          if (conversation.createdAt && typeof conversation.createdAt !== 'object') {
            conversation.createdAt = (conversation.createdAt as any).toDate();
          }
          if (conversation.updatedAt && typeof conversation.updatedAt !== 'object') {
            conversation.updatedAt = (conversation.updatedAt as any).toDate();
          }
          if (conversation.lastMessage?.timestamp && typeof conversation.lastMessage.timestamp !== 'object') {
            conversation.lastMessage.timestamp = (conversation.lastMessage.timestamp as any).toDate();
          }
          
          conversations.push(conversation);
        }
      });

      callback(conversations);
    }, (error) => {
      console.error('Error in conversation subscription:', error);
    });
  }

  // ========== MESSAGE MANAGEMENT ==========

  /**
   * Send a new message
   */
  async sendMessage(
    conversationId: string,
    senderId: string,
    senderName: string,
    senderRole: 'landlord' | 'contractor' | 'tenant' | 'system',
    text: string,
    type: Message['type'] = 'text',
    attachments?: MessageAttachment[]
  ): Promise<string> {
    try {
      const batch = writeBatch(db);

      // Create message
      const messageData: Omit<Message, 'id'> = {
        conversationId,
        senderId,
        senderName,
        senderRole,
        text,
        type,
        attachments,
        timestamp: new Date(),
        readBy: { [senderId]: new Date() },
        isEdited: false,
        isDeleted: false
      };

      const messageRef = doc(this.messagesRef);
      batch.set(messageRef, {
        ...messageData,
        timestamp: serverTimestamp(),
        readBy: { [senderId]: serverTimestamp() }
      });

      // Update conversation
      const conversationRef = doc(this.conversationsRef, conversationId);
      const conversationUpdate: any = {
        lastMessage: {
          text: text || `Sent a ${type}`,
          timestamp: serverTimestamp(),
          senderId,
          senderName
        },
        updatedAt: serverTimestamp()
      };

      // Update unread counts for other participants
      const conversationDoc = await getDoc(conversationRef);
      if (conversationDoc.exists()) {
        const conversation = conversationDoc.data() as Conversation;
        
        conversation.participants.forEach(participant => {
          if (participant.id !== senderId) {
            conversationUpdate[`unreadCounts.${participant.id}`] = increment(1);
          }
        });
      }

      batch.update(conversationRef, conversationUpdate);

      await batch.commit();
      console.log('Message sent with ID:', messageRef.id);
      return messageRef.id;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Get messages for a conversation
   */
  async getConversationMessages(conversationId: string, limit = 50): Promise<Message[]> {
    try {
      const q = query(
        this.messagesRef,
        where('conversationId', '==', conversationId),
        where('isDeleted', '==', false),
        orderBy('timestamp', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const messages: Message[] = [];

      querySnapshot.forEach(doc => {
        const message = { id: doc.id, ...doc.data() } as Message;
        
        // Convert Firestore timestamp to Date
        if (message.timestamp && typeof message.timestamp !== 'object') {
          message.timestamp = (message.timestamp as any).toDate();
        }
        
        // Convert readBy timestamps
        if (message.readBy) {
          Object.keys(message.readBy).forEach(userId => {
            if (typeof message.readBy[userId] !== 'object') {
              message.readBy[userId] = (message.readBy[userId] as any).toDate();
            }
          });
        }

        messages.push(message);
      });

      return messages.reverse(); // Return in chronological order
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  }

  /**
   * Listen to real-time updates for conversation messages
   */
  subscribeToConversationMessages(
    conversationId: string,
    callback: (messages: Message[]) => void
  ): Unsubscribe {
    const q = query(
      this.messagesRef,
      where('conversationId', '==', conversationId),
      where('isDeleted', '==', false),
      orderBy('timestamp', 'asc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const messages: Message[] = [];

      querySnapshot.forEach(doc => {
        const message = { id: doc.id, ...doc.data() } as Message;
        
        // Convert Firestore timestamp to Date
        if (message.timestamp && typeof message.timestamp !== 'object') {
          message.timestamp = (message.timestamp as any).toDate();
        }
        
        // Convert readBy timestamps
        if (message.readBy) {
          Object.keys(message.readBy).forEach(userId => {
            if (typeof message.readBy[userId] !== 'object') {
              message.readBy[userId] = (message.readBy[userId] as any).toDate();
            }
          });
        }

        messages.push(message);
      });

      callback(messages);
    }, (error) => {
      console.error('Error in message subscription:', error);
    });
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    try {
      const batch = writeBatch(db);

      // Get unread messages
      const q = query(
        this.messagesRef,
        where('conversationId', '==', conversationId),
        where('isDeleted', '==', false)
      );

      const querySnapshot = await getDocs(q);
      
      querySnapshot.forEach(doc => {
        const message = doc.data() as Message;
        
        // Mark as read if not already read by this user
        if (!message.readBy || !message.readBy[userId]) {
          batch.update(doc.ref, {
            [`readBy.${userId}`]: serverTimestamp()
          });
        }
      });

      // Reset unread count for this user in conversation
      const conversationRef = doc(this.conversationsRef, conversationId);
      batch.update(conversationRef, {
        [`unreadCounts.${userId}`]: 0
      });

      await batch.commit();
      console.log('Messages marked as read for user:', userId);
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  // ========== HELPER METHODS ==========

  /**
   * Get or create conversation between landlord and contractor
   */
  async getOrCreateLandlordContractorConversation(
    landlordId: string,
    landlordName: string,
    contractorId: string,
    contractorName: string,
    contractorCompany?: string,
    metadata?: Conversation['metadata']
  ): Promise<string> {
    try {
      // Check if conversation exists
      const existingConversation = await this.findConversationByParticipants([
        landlordId,
        contractorId
      ]);

      if (existingConversation) {
        return existingConversation.id!;
      }

      // Create new conversation
      const participants: MessageParticipant[] = [
        {
          id: landlordId,
          name: landlordName,
          email: '', // Will be filled from user profile if needed
          role: 'landlord'
        },
        {
          id: contractorId,
          name: contractorName,
          email: '', // Will be filled from user profile if needed
          role: 'contractor',
          company: contractorCompany
        }
      ];

      return await this.createConversation(participants, 'landlord-contractor', metadata);
    } catch (error) {
      console.error('Error getting/creating landlord-contractor conversation:', error);
      throw error;
    }
  }

  /**
   * Search conversations by text
   */
  async searchConversations(userId: string, searchTerm: string): Promise<Conversation[]> {
    try {
      const conversations = await this.getUserConversations(userId);
      
      return conversations.filter(conversation => {
        const searchLower = searchTerm.toLowerCase();
        
        // Search in participant names
        const participantMatch = conversation.participants.some(p => 
          p.name.toLowerCase().includes(searchLower) ||
          (p.company && p.company.toLowerCase().includes(searchLower))
        );
        
        // Search in last message
        const messageMatch = conversation.lastMessage?.text.toLowerCase().includes(searchLower);
        
        // Search in metadata
        const metadataMatch = 
          (conversation.metadata?.propertyName?.toLowerCase().includes(searchLower)) ||
          (conversation.metadata?.jobTitle?.toLowerCase().includes(searchLower));
        
        return participantMatch || messageMatch || metadataMatch;
      });
    } catch (error) {
      console.error('Error searching conversations:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const messageService = new MessageService();
export default messageService; 