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
  arrayRemove
} from 'firebase/firestore';
import { db } from '../../firebase/config';

export interface NotificationRule {
  id?: string;
  name: string;
  description: string;
  isActive: boolean;
  createdBy: string;
  scope: 'global' | 'property' | 'user';
  scopeId?: string; // propertyId or userId for scoped rules
  trigger: {
    event: 'message_received' | 'maintenance_request' | 'payment_due' | 'lease_expiring' | 'job_assigned' | 'bid_received' | 'emergency_reported' | 'system_alert' | 'custom';
    conditions: {
      property?: string[];
      userRole?: ('landlord' | 'tenant' | 'contractor')[];
      priority?: ('low' | 'normal' | 'high' | 'urgent')[];
      timeConditions?: {
        afterHours?: boolean;
        weekendsOnly?: boolean;
        businessHours?: boolean;
        customTimeRange?: {
          start: string;
          end: string;
        };
      };
      customFilters?: Record<string, any>;
    };
  };
  actions: {
    channels: ('email' | 'sms' | 'push' | 'in_app')[];
    recipients: {
      type: 'specific_users' | 'role_based' | 'property_based' | 'custom';
      userIds?: string[];
      roles?: ('landlord' | 'tenant' | 'contractor')[];
      propertyIds?: string[];
      customQuery?: Record<string, any>;
    };
    message: {
      template: string;
      subject?: string;
      body: string;
      variables?: Record<string, string>;
    };
    escalation?: {
      enabled: boolean;
      timeouts: number[]; // minutes
      escalationLevels: {
        level: number;
        recipients: string[];
        channels: ('email' | 'sms' | 'push')[];
        message?: string;
      }[];
    };
  };
  analytics: {
    triggerCount: number;
    lastTriggered?: Date;
    successRate: number;
    avgResponseTime: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id?: string;
  ruleId?: string;
  type: 'message' | 'maintenance' | 'payment' | 'lease' | 'job' | 'system' | 'emergency' | 'custom';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  title: string;
  message: string;
  recipients: {
    userId: string;
    name: string;
    role: string;
    channels: ('email' | 'sms' | 'push' | 'in_app')[];
  }[];
  data?: Record<string, any>;
  propertyId?: string;
  jobId?: string;
  conversationId?: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'cancelled';
  delivery: {
    email?: {
      sent: boolean;
      deliveredAt?: Date;
      error?: string;
    };
    sms?: {
      sent: boolean;
      deliveredAt?: Date;
      error?: string;
    };
    push?: {
      sent: boolean;
      deliveredAt?: Date;
      error?: string;
    };
    inApp?: {
      sent: boolean;
      readAt?: Date;
      dismissed?: boolean;
    };
  };
  escalation?: {
    level: number;
    nextEscalationAt?: Date;
    escalationHistory: {
      level: number;
      triggeredAt: Date;
      recipients: string[];
      success: boolean;
    }[];
  };
  scheduledFor?: Date;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

export interface EscalationRule {
  id?: string;
  name: string;
  description: string;
  isActive: boolean;
  triggerEvent: string;
  conditions: {
    noResponseTime: number; // minutes
    priority?: ('high' | 'urgent')[];
    propertyIds?: string[];
    userRoles?: ('landlord' | 'tenant' | 'contractor')[];
  };
  escalationLevels: {
    level: number;
    delayMinutes: number;
    recipients: {
      type: 'users' | 'roles' | 'external';
      userIds?: string[];
      roles?: string[];
      externalContacts?: {
        name: string;
        email?: string;
        phone?: string;
      }[];
    };
    channels: ('email' | 'sms' | 'push' | 'external_api')[];
    message: {
      template: string;
      subject: string;
      body: string;
    };
    requiresAcknowledgment: boolean;
  }[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationTemplate {
  id?: string;
  name: string;
  type: 'email' | 'sms' | 'push' | 'in_app';
  category: 'maintenance' | 'payment' | 'lease' | 'communication' | 'emergency' | 'system';
  subject?: string;
  body: string;
  variables: {
    name: string;
    description: string;
    required: boolean;
    defaultValue?: string;
  }[];
  isDefault: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

class NotificationService {
  private notificationRulesRef = collection(db, 'notificationRules');
  private notificationsRef = collection(db, 'notifications');
  private escalationRulesRef = collection(db, 'escalationRules');
  private templatesRef = collection(db, 'notificationTemplates');
  private deliveryLogRef = collection(db, 'notificationDeliveryLog');

  // ========== NOTIFICATION RULES ==========

  async createNotificationRule(rule: Omit<NotificationRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const ruleData = {
        ...rule,
        analytics: {
          triggerCount: 0,
          successRate: 0,
          avgResponseTime: 0
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(this.notificationRulesRef, ruleData);
      console.log('Notification rule created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating notification rule:', error);
      throw error;
    }
  }

  async getNotificationRules(userId: string): Promise<NotificationRule[]> {
    try {
      const q = query(
        this.notificationRulesRef,
        where('createdBy', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        analytics: {
          ...doc.data().analytics,
          lastTriggered: doc.data().analytics?.lastTriggered?.toDate()
        }
      } as NotificationRule));
    } catch (error) {
      console.error('Error getting notification rules:', error);
      throw error;
    }
  }

  async updateNotificationRule(ruleId: string, updates: Partial<NotificationRule>): Promise<void> {
    try {
      const ruleRef = doc(this.notificationRulesRef, ruleId);
      await updateDoc(ruleRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating notification rule:', error);
      throw error;
    }
  }

  async toggleNotificationRule(ruleId: string, isActive: boolean): Promise<void> {
    try {
      await this.updateNotificationRule(ruleId, { isActive });
    } catch (error) {
      console.error('Error toggling notification rule:', error);
      throw error;
    }
  }

  async deleteNotificationRule(ruleId: string): Promise<void> {
    try {
      const ruleRef = doc(this.notificationRulesRef, ruleId);
      await deleteDoc(ruleRef);
    } catch (error) {
      console.error('Error deleting notification rule:', error);
      throw error;
    }
  }

  // ========== NOTIFICATION MANAGEMENT ==========

  async createNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt' | 'delivery'>): Promise<string> {
    try {
      const notificationData = {
        ...notification,
        delivery: {
          email: { sent: false },
          sms: { sent: false },
          push: { sent: false },
          inApp: { sent: false }
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(this.notificationsRef, notificationData);
      console.log('Notification created with ID:', docRef.id);

      // Trigger immediate delivery if not scheduled
      if (!notification.scheduledFor) {
        await this.deliverNotification(docRef.id);
      }

      return docRef.id;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  async getNotifications(userId: string, unreadOnly: boolean = false): Promise<Notification[]> {
    try {
      let q = query(
        this.notificationsRef,
        where('recipients', 'array-contains-any', [userId]),
        orderBy('createdAt', 'desc'),
        limit(100)
      );

      if (unreadOnly) {
        q = query(
          this.notificationsRef,
          where('recipients', 'array-contains-any', [userId]),
          where('delivery.inApp.readAt', '==', null),
          orderBy('createdAt', 'desc'),
          limit(100)
        );
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        scheduledFor: doc.data().scheduledFor?.toDate(),
        expiresAt: doc.data().expiresAt?.toDate(),
        delivery: {
          ...doc.data().delivery,
          email: {
            ...doc.data().delivery?.email,
            deliveredAt: doc.data().delivery?.email?.deliveredAt?.toDate()
          },
          sms: {
            ...doc.data().delivery?.sms,
            deliveredAt: doc.data().delivery?.sms?.deliveredAt?.toDate()
          },
          push: {
            ...doc.data().delivery?.push,
            deliveredAt: doc.data().delivery?.push?.deliveredAt?.toDate()
          },
          inApp: {
            ...doc.data().delivery?.inApp,
            readAt: doc.data().delivery?.inApp?.readAt?.toDate()
          }
        }
      } as Notification));
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  }

  subscribeToNotifications(userId: string, callback: (notifications: Notification[]) => void): () => void {
    const q = query(
      this.notificationsRef,
      where('recipients', 'array-contains-any', [userId]),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        scheduledFor: doc.data().scheduledFor?.toDate(),
        expiresAt: doc.data().expiresAt?.toDate(),
        delivery: {
          ...doc.data().delivery,
          email: {
            ...doc.data().delivery?.email,
            deliveredAt: doc.data().delivery?.email?.deliveredAt?.toDate()
          },
          sms: {
            ...doc.data().delivery?.sms,
            deliveredAt: doc.data().delivery?.sms?.deliveredAt?.toDate()
          },
          push: {
            ...doc.data().delivery?.push,
            deliveredAt: doc.data().delivery?.push?.deliveredAt?.toDate()
          },
          inApp: {
            ...doc.data().delivery?.inApp,
            readAt: doc.data().delivery?.inApp?.readAt?.toDate()
          }
        }
      } as Notification));
      callback(notifications);
    });
  }

  async markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      const notificationRef = doc(this.notificationsRef, notificationId);
      await updateDoc(notificationRef, {
        'delivery.inApp.readAt': serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async dismissNotification(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(this.notificationsRef, notificationId);
      await updateDoc(notificationRef, {
        'delivery.inApp.dismissed': true,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error dismissing notification:', error);
      throw error;
    }
  }

  // ========== NOTIFICATION DELIVERY ==========

  async deliverNotification(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(this.notificationsRef, notificationId);
      const notificationDoc = await getDoc(notificationRef);

      if (!notificationDoc.exists()) {
        throw new Error('Notification not found');
      }

      const notification = notificationDoc.data() as Notification;
      const deliveryPromises: Promise<void>[] = [];

      // Check each recipient's preferred channels
      for (const recipient of notification.recipients) {
        for (const channel of recipient.channels) {
          switch (channel) {
            case 'email':
              deliveryPromises.push(this.sendEmailNotification(notificationId, recipient.userId, notification));
              break;
            case 'sms':
              deliveryPromises.push(this.sendSMSNotification(notificationId, recipient.userId, notification));
              break;
            case 'push':
              deliveryPromises.push(this.sendPushNotification(notificationId, recipient.userId, notification));
              break;
            case 'in_app':
              deliveryPromises.push(this.sendInAppNotification(notificationId, recipient.userId, notification));
              break;
          }
        }
      }

      await Promise.allSettled(deliveryPromises);

      // Update notification status
      await updateDoc(notificationRef, {
        status: 'sent',
        updatedAt: serverTimestamp()
      });

    } catch (error) {
      console.error('Error delivering notification:', error);
      throw error;
    }
  }

  private async sendEmailNotification(notificationId: string, userId: string, notification: Notification): Promise<void> {
    try {
      // TODO: Implement actual email sending logic using Firebase Functions
      // For now, just update the delivery status
      const notificationRef = doc(this.notificationsRef, notificationId);
      await updateDoc(notificationRef, {
        'delivery.email.sent': true,
        'delivery.email.deliveredAt': serverTimestamp()
      });

      console.log(`Email notification sent to user ${userId}`);
    } catch (error) {
      console.error('Error sending email notification:', error);
      const notificationRef = doc(this.notificationsRef, notificationId);
      await updateDoc(notificationRef, {
        'delivery.email.sent': false,
        'delivery.email.error': error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private async sendSMSNotification(notificationId: string, userId: string, notification: Notification): Promise<void> {
    try {
      // TODO: Implement actual SMS sending logic using Firebase Functions
      const notificationRef = doc(this.notificationsRef, notificationId);
      await updateDoc(notificationRef, {
        'delivery.sms.sent': true,
        'delivery.sms.deliveredAt': serverTimestamp()
      });

      console.log(`SMS notification sent to user ${userId}`);
    } catch (error) {
      console.error('Error sending SMS notification:', error);
      const notificationRef = doc(this.notificationsRef, notificationId);
      await updateDoc(notificationRef, {
        'delivery.sms.sent': false,
        'delivery.sms.error': error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private async sendPushNotification(notificationId: string, userId: string, notification: Notification): Promise<void> {
    try {
      // TODO: Implement actual push notification logic using Firebase Cloud Messaging
      const notificationRef = doc(this.notificationsRef, notificationId);
      await updateDoc(notificationRef, {
        'delivery.push.sent': true,
        'delivery.push.deliveredAt': serverTimestamp()
      });

      console.log(`Push notification sent to user ${userId}`);
    } catch (error) {
      console.error('Error sending push notification:', error);
      const notificationRef = doc(this.notificationsRef, notificationId);
      await updateDoc(notificationRef, {
        'delivery.push.sent': false,
        'delivery.push.error': error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private async sendInAppNotification(notificationId: string, userId: string, notification: Notification): Promise<void> {
    try {
      // In-app notifications are handled by the real-time subscription
      const notificationRef = doc(this.notificationsRef, notificationId);
      await updateDoc(notificationRef, {
        'delivery.inApp.sent': true
      });

      console.log(`In-app notification sent to user ${userId}`);
    } catch (error) {
      console.error('Error sending in-app notification:', error);
      throw error;
    }
  }

  // ========== ESCALATION MANAGEMENT ==========

  async createEscalationRule(rule: Omit<EscalationRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const ruleData = {
        ...rule,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(this.escalationRulesRef, ruleData);
      console.log('Escalation rule created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating escalation rule:', error);
      throw error;
    }
  }

  async getEscalationRules(userId: string): Promise<EscalationRule[]> {
    try {
      const q = query(
        this.escalationRulesRef,
        where('createdBy', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      } as EscalationRule));
    } catch (error) {
      console.error('Error getting escalation rules:', error);
      throw error;
    }
  }

  async triggerEscalation(notificationId: string, escalationLevel: number): Promise<void> {
    try {
      // TODO: Implement escalation logic based on rules
      console.log(`Triggering escalation level ${escalationLevel} for notification ${notificationId}`);
      
      const notificationRef = doc(this.notificationsRef, notificationId);
      await updateDoc(notificationRef, {
        [`escalation.level`]: escalationLevel,
        [`escalation.escalationHistory`]: arrayUnion({
          level: escalationLevel,
          triggeredAt: serverTimestamp(),
          recipients: [], // TODO: Add actual recipients
          success: true
        }),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error triggering escalation:', error);
      throw error;
    }
  }

  // ========== TEMPLATES ==========

  async createNotificationTemplate(template: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const templateData = {
        ...template,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(this.templatesRef, templateData);
      console.log('Notification template created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating notification template:', error);
      throw error;
    }
  }

  async getNotificationTemplates(category?: string): Promise<NotificationTemplate[]> {
    try {
      let q = query(
        this.templatesRef,
        orderBy('name', 'asc')
      );

      if (category) {
        q = query(
          this.templatesRef,
          where('category', '==', category),
          orderBy('name', 'asc')
        );
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      } as NotificationTemplate));
    } catch (error) {
      console.error('Error getting notification templates:', error);
      throw error;
    }
  }

  // ========== ANALYTICS ==========

  async getNotificationAnalytics(userId: string, timeRange: { start: Date; end: Date }): Promise<{
    totalSent: number;
    deliveryRate: number;
    channelBreakdown: Record<string, number>;
    responseRate: number;
    avgResponseTime: number;
  }> {
    try {
      // TODO: Implement comprehensive analytics
      return {
        totalSent: 0,
        deliveryRate: 0,
        channelBreakdown: {},
        responseRate: 0,
        avgResponseTime: 0
      };
    } catch (error) {
      console.error('Error getting notification analytics:', error);
      throw error;
    }
  }

  // ========== UTILITY METHODS ==========

  async processVariables(template: string, variables: Record<string, string>): Promise<string> {
    let processedTemplate = template;
    
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      processedTemplate = processedTemplate.replace(new RegExp(placeholder, 'g'), value);
    });
    
    return processedTemplate;
  }

  async bulkCreateNotifications(notifications: Omit<Notification, 'id' | 'createdAt' | 'updatedAt' | 'delivery'>[]): Promise<string[]> {
    try {
      const batch = writeBatch(db);
      const notificationIds: string[] = [];

      notifications.forEach(notification => {
        const notificationRef = doc(this.notificationsRef);
        notificationIds.push(notificationRef.id);
        
        batch.set(notificationRef, {
          ...notification,
          delivery: {
            email: { sent: false },
            sms: { sent: false },
            push: { sent: false },
            inApp: { sent: false }
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });

      await batch.commit();
      console.log(`Bulk created ${notifications.length} notifications`);
      return notificationIds;
    } catch (error) {
      console.error('Error bulk creating notifications:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService; 