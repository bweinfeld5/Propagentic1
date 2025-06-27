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
  increment,
  setDoc,
  runTransaction,
  FirestoreError,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import {
  Communication,
  CommunicationMessage,
  CommunicationRole,
  Conversation,
  Participant,
  Message,
  NotificationPreference,
} from '../../models';
import {
  communicationConverter,
  conversationConverter,
  messageConverter,
  notificationPreferenceConverter,
} from '../../models/converters';


class CommunicationService {
  private communicationsCollection = collection(db, 'communications').withConverter(communicationConverter);
  private conversationsRef = collection(db, 'conversations').withConverter(conversationConverter);
  private messagesRef = collection(db, 'messages').withConverter(messageConverter);
  private notificationPrefsRef = collection(db, 'notificationPreferences').withConverter(notificationPreferenceConverter);
  private onlineUsersRef = collection(db, 'onlineUsers');

  // ========== CONVERSATION MANAGEMENT ==========

  async createConversation(conversationData: Omit<Conversation, 'id' | 'createdAt' | 'updatedAt' | 'lastMessage' | 'unreadCounts'>): Promise<string> {
    try {
      const fullConversation: Omit<Conversation, 'id'> = {
        ...conversationData,
        lastMessage: null,
        unreadCounts: Object.fromEntries(
          conversationData.participants.map(p => [p.id, 0])
        ),
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
      };

      const docRef = await addDoc(this.conversationsRef, fullConversation);
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
        where('participants.id', '==', userId),
        where('isArchived', '==', false),
        orderBy('updatedAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as Conversation);
    } catch (error) {
      console.error(`Error fetching conversations for user ${userId}:`, error);
      throw error;
    }
  }

  subscribeToConversations(userId: string, callback: (conversations: Conversation[]) => void): () => void {
    const q = query(
      this.conversationsRef,
      where('participants.id', '==', userId),
      where('isArchived', '==', false),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const conversations = snapshot.docs.map(doc => doc.data() as Conversation);
      callback(conversations);
    }, (error) => {
      console.error('Error in conversations subscription:', error);
    });

    return unsubscribe;
  }

  async updateConversation(conversationId: string, updates: Partial<Conversation>): Promise<void> {
    try {
      const conversationRef = doc(this.conversationsRef, conversationId);
      await updateDoc(conversationRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      console.log(`Conversation ${conversationId} updated.`);
    } catch (error) {
      console.error(`Error updating conversation ${conversationId}:`, error);
      throw error;
    }
  }

  // ========== MESSAGE MANAGEMENT ==========

  async sendMessage(messageData: Omit<Message, 'id' | 'timestamp' | 'readBy' | 'deliveredTo' | 'isEdited' | 'isDeleted'>): Promise<string> {
    const conversationRef = doc(this.conversationsRef, messageData.conversationId);

    try {
      let messageId = '';
      await runTransaction(db, async (transaction) => {
        const conversationDoc = await transaction.get(conversationRef);
        if (!conversationDoc.exists()) {
          throw new Error('Conversation does not exist!');
        }
        
        const conversation = conversationDoc.data() as Conversation;

        // Add message
        const newMessageRef = doc(collection(db, `conversations/${messageData.conversationId}/messages`)).withConverter(messageConverter);
        const newMessage: Omit<Message, 'id'> = {
          ...messageData,
          timestamp: serverTimestamp() as Timestamp,
          readBy: [],
        };
        transaction.set(newMessageRef, newMessage);
        messageId = newMessageRef.id;

        // Update conversation
        const unreadCounts = { ...conversation.unreadCounts };
        conversation.participants.forEach(p => {
          if (p.id !== messageData.sender) {
            unreadCounts[p.id] = (unreadCounts[p.id] || 0) + 1;
          }
        });

        transaction.update(conversationRef, {
          lastMessage: {
            text: messageData.text,
            timestamp: serverTimestamp(),
            sender: messageData.sender,
          },
          unreadCounts,
          updatedAt: serverTimestamp(),
        });
      });

      console.log(`Message sent in conversation ${messageData.conversationId}`);
      return messageId;
    } catch (error) {
      console.error(`Error sending message in conversation ${messageData.conversationId}:`, error);
      throw error;
    }
  }

  async getMessages(conversationId: string, limitCount: number = 50): Promise<Message[]> {
    try {
      const messagesCollectionRef = collection(db, `conversations/${conversationId}/messages`).withConverter(messageConverter);
      const q = query(messagesCollectionRef, orderBy('timestamp', 'desc'), limit(limitCount));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as Message).reverse();
    } catch (error) {
      console.error(`Error fetching messages for conversation ${conversationId}:`, error);
      throw error;
    }
  }

  subscribeToMessages(conversationId: string, callback: (messages: Message[]) => void): () => void {
    const messagesCollectionRef = collection(db, `conversations/${conversationId}/messages`).withConverter(messageConverter);
    const q = query(messagesCollectionRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => doc.data() as Message);
      callback(messages);
    }, (error) => {
      console.error('Error in messages subscription:', error);
    });
    
    return unsubscribe;
  }

  async markAsRead(conversationId: string, messageId: string, userId: string): Promise<void> {
    const conversationRef = doc(this.conversationsRef, conversationId);
    const messageRef = doc(db, `conversations/${conversationId}/messages/${messageId}`).withConverter(messageConverter);

    try {
      await runTransaction(db, async (transaction) => {
        const conversationDoc = await transaction.get(conversationRef);
        const messageDoc = await transaction.get(messageRef);

        if (!conversationDoc.exists() || !messageDoc.exists()) {
          throw new Error("Conversation or message not found");
        }

        // Update message read status
        transaction.update(messageRef, {
          [`readBy.${userId}`]: serverTimestamp()
        });
        
        // Update conversation unread count
        const conversation = conversationDoc.data() as Conversation;
        if ((conversation.unreadCounts[userId] || 0) > 0) {
          transaction.update(conversationRef, {
            [`unreadCounts.${userId}`]: 0
          });
        }
      });
    } catch (error) {
      console.error(`Error marking message as read for user ${userId}:`, error);
    }
  }

  // ... other methods like editMessage, deleteMessage, addReaction, removeReaction ...

  // ========== NOTIFICATION PREFERENCES ==========

  async getNotificationPreferences(userId: string): Promise<NotificationPreference | null> {
    try {
      const docRef = doc(this.notificationPrefsRef, userId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() as NotificationPreference : null;
    } catch (error) {
      console.error(`Error getting notification preferences for user ${userId}:`, error);
      return null;
    }
  }

  async updateNotificationPreferences(userId: string, preferences: Partial<NotificationPreference>): Promise<void> {
    try {
      const docRef = doc(this.notificationPrefsRef, userId);
      await setDoc(docRef, { ...preferences }, { merge: true });
    } catch (error) {
      console.error(`Error updating notification preferences for user ${userId}:`, error);
    }
  }

  // ... other methods for presence, search, etc. ...

  // ========== LEGACY Communication Methods for Maintenance Requests ==========
  // These methods operate on the `communications` collection tied to a specific maintenance request
  
  async getRequestCommunications(requestId: string, limitCount: number = 50): Promise<CommunicationMessage[]> {
    const commsQuery = query(
      collection(db, 'communications'),
      where('requestId', '==', requestId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(commsQuery);
    return snapshot.docs.map(doc => doc.data() as CommunicationMessage).reverse();
  }

  subscribeToRequestCommunications(
    requestId: string,
    callback: (messages: CommunicationMessage[]) => void,
    onError: (error: FirestoreError) => void
  ): () => void {
    const commsQuery = query(
      collection(db, 'communications'),
      where('requestId', '==', requestId),
      orderBy('createdAt', 'asc')
    );

    return onSnapshot(commsQuery, 
      (snapshot) => {
        const messages = snapshot.docs.map(doc => doc.data() as CommunicationMessage);
        callback(messages);
      },
      (error) => {
        console.error(`Error subscribing to communications for request ${requestId}:`, error);
        onError(error);
      }
    );
  }

  async addMessage(
    requestId: string,
    messageData: {
      senderId: string;
      senderName: string;
      senderRole: CommunicationRole;
      content: string;
      attachments?: string[];
      isUrgent?: boolean;
    }
  ): Promise<void> {
    const commsCollRef = collection(db, 'communications');
    const requestRef = doc(db, 'maintenanceRequests', requestId);

    try {
      await runTransaction(db, async (transaction) => {
        const requestDoc = await transaction.get(requestRef);
        if (!requestDoc.exists()) {
          throw new Error(`Maintenance request with ID ${requestId} not found.`);
        }
        
        // Add the new message to the communications collection
        const newMessageRef = doc(commsCollRef);
        const newMessage: CommunicationMessage = {
          id: newMessageRef.id,
          requestId: requestId,
          senderId: messageData.senderId,
          senderName: messageData.senderName,
          senderRole: messageData.senderRole,
          content: messageData.content,
          attachments: messageData.attachments,
          isUrgent: messageData.isUrgent ?? false,
          type: 'message',
          timestamp: serverTimestamp() as Timestamp,
          isRead: false,
          createdAt: serverTimestamp() as Timestamp,
          updatedAt: serverTimestamp() as Timestamp,
        };
        transaction.set(newMessageRef, newMessage);

        // Update the last message preview on the maintenance request
        transaction.update(requestRef, {
          lastMessage: messageData.content.substring(0, 50),
          updatedAt: serverTimestamp()
        });
      });
    } catch (error) {
      console.error(`Error adding message to request ${requestId}:`, error);
      throw error;
    }
  }
}

export const communicationService = new CommunicationService();

export default communicationService; 