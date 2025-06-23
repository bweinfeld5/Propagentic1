import { doc, setDoc, collection, addDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';
import { notificationService } from '../services/firestore/notificationService';

// Default notification templates
const defaultNotificationTemplates = [
  // Maintenance Templates
  {
    name: 'Maintenance Request Created',
    type: 'email',
    category: 'maintenance',
    subject: 'New Maintenance Request - {{propertyName}}',
    body: 'Dear {{landlordName}},\n\nA new maintenance request has been submitted for {{propertyName}}.\n\nDetails:\n- Issue: {{issueDescription}}\n- Priority: {{priority}}\n- Location: {{location}}\n- Submitted by: {{tenantName}}\n- Date: {{submissionDate}}\n\nPlease log into your PropAgentic dashboard to review and assign this request.\n\nBest regards,\nPropAgentic Team',
    variables: [
      { name: 'landlordName', description: 'Landlord full name', required: true },
      { name: 'propertyName', description: 'Property name or address', required: true },
      { name: 'issueDescription', description: 'Description of the issue', required: true },
      { name: 'priority', description: 'Priority level', required: true },
      { name: 'location', description: 'Specific location in property', required: false },
      { name: 'tenantName', description: 'Tenant full name', required: true },
      { name: 'submissionDate', description: 'Date request was submitted', required: true }
    ],
    isDefault: true,
    createdBy: 'system'
  },
  {
    name: 'Maintenance Request Assigned',
    type: 'sms',
    category: 'maintenance',
    body: 'Your maintenance request for {{propertyName}} has been assigned to {{contractorName}}. Expected completion: {{expectedDate}}',
    variables: [
      { name: 'propertyName', description: 'Property name', required: true },
      { name: 'contractorName', description: 'Assigned contractor name', required: true },
      { name: 'expectedDate', description: 'Expected completion date', required: false }
    ],
    isDefault: true,
    createdBy: 'system'
  },

  // Payment Templates
  {
    name: 'Rent Reminder',
    type: 'email',
    category: 'payment',
    subject: 'Rent Payment Reminder - {{propertyName}}',
    body: 'Dear {{tenantName}},\n\nThis is a friendly reminder that your rent payment for {{propertyName}} is due on {{dueDate}}.\n\nAmount Due: ${{amount}}\nDue Date: {{dueDate}}\n\nPlease make your payment through the PropAgentic tenant portal or contact us if you have any questions.\n\nThank you,\n{{landlordName}}',
    variables: [
      { name: 'tenantName', description: 'Tenant full name', required: true },
      { name: 'propertyName', description: 'Property name', required: true },
      { name: 'dueDate', description: 'Payment due date', required: true },
      { name: 'amount', description: 'Payment amount', required: true },
      { name: 'landlordName', description: 'Landlord name', required: true }
    ],
    isDefault: true,
    createdBy: 'system'
  },
  {
    name: 'Payment Overdue',
    type: 'sms',
    category: 'payment',
    body: 'URGENT: Your rent payment for {{propertyName}} is {{daysOverdue}} days overdue. Please contact us immediately.',
    variables: [
      { name: 'propertyName', description: 'Property name', required: true },
      { name: 'daysOverdue', description: 'Number of days overdue', required: true }
    ],
    isDefault: true,
    createdBy: 'system'
  },

  // Lease Templates
  {
    name: 'Lease Expiration Notice',
    type: 'email',
    category: 'lease',
    subject: 'Lease Expiration Notice - {{propertyName}}',
    body: 'Dear {{tenantName}},\n\nWe want to inform you that your lease for {{propertyName}} will expire on {{expirationDate}}.\n\nLease Details:\n- Property: {{propertyName}}\n- Current Lease End: {{expirationDate}}\n- Days Until Expiration: {{daysUntilExpiration}}\n\nPlease contact us to discuss renewal options or move-out procedures.\n\nBest regards,\n{{landlordName}}',
    variables: [
      { name: 'tenantName', description: 'Tenant full name', required: true },
      { name: 'propertyName', description: 'Property name', required: true },
      { name: 'expirationDate', description: 'Lease expiration date', required: true },
      { name: 'daysUntilExpiration', description: 'Days until lease expires', required: true },
      { name: 'landlordName', description: 'Landlord name', required: true }
    ],
    isDefault: true,
    createdBy: 'system'
  },

  // Communication Templates
  {
    name: 'New Message Notification',
    type: 'push',
    category: 'communication',
    body: 'New message from {{senderName}}: {{messagePreview}}',
    variables: [
      { name: 'senderName', description: 'Message sender name', required: true },
      { name: 'messagePreview', description: 'Preview of message content', required: true }
    ],
    isDefault: true,
    createdBy: 'system'
  },

  // Emergency Templates
  {
    name: 'Emergency Alert',
    type: 'sms',
    category: 'emergency',
    body: 'EMERGENCY at {{propertyName}}: {{emergencyDescription}}. Please respond immediately. Contact: {{contactNumber}}',
    variables: [
      { name: 'propertyName', description: 'Property name', required: true },
      { name: 'emergencyDescription', description: 'Description of emergency', required: true },
      { name: 'contactNumber', description: 'Emergency contact number', required: true }
    ],
    isDefault: true,
    createdBy: 'system'
  },

  // System Templates
  {
    name: 'Account Created',
    type: 'email',
    category: 'system',
    subject: 'Welcome to PropAgentic - Account Created',
    body: 'Dear {{userName}},\n\nWelcome to PropAgentic! Your account has been successfully created.\n\nAccount Details:\n- Email: {{userEmail}}\n- Role: {{userRole}}\n- Created: {{creationDate}}\n\nYou can now log in and start managing your properties and communications.\n\nIf you have any questions, please don\'t hesitate to contact our support team.\n\nBest regards,\nPropAgentic Team',
    variables: [
      { name: 'userName', description: 'User full name', required: true },
      { name: 'userEmail', description: 'User email address', required: true },
      { name: 'userRole', description: 'User role (landlord/tenant/contractor)', required: true },
      { name: 'creationDate', description: 'Account creation date', required: true }
    ],
    isDefault: true,
    createdBy: 'system'
  }
];

// Default escalation rules
const defaultEscalationRules = [
  {
    name: 'Emergency Maintenance Escalation',
    description: 'Escalate emergency maintenance requests if no response within specified timeframes',
    isActive: true,
    triggerEvent: 'maintenance_request_created',
    conditions: {
      noResponseTime: 30, // 30 minutes
      priority: ['urgent'],
      propertyIds: [],
      userRoles: ['landlord']
    },
    escalationLevels: [
      {
        level: 1,
        delayMinutes: 30,
        recipients: {
          type: 'roles',
          roles: ['landlord']
        },
        channels: ['sms', 'push'],
        message: {
          template: 'emergency_escalation_level_1',
          subject: 'URGENT: Emergency Maintenance - No Response',
          body: 'Emergency maintenance request {{requestId}} at {{propertyName}} requires immediate attention. No response received for 30 minutes.'
        },
        requiresAcknowledgment: true
      },
      {
        level: 2,
        delayMinutes: 60,
        recipients: {
          type: 'external',
          externalContacts: [
            { name: 'Emergency Coordinator', email: 'emergency@propagentic.com', phone: '+1-555-0911' }
          ]
        },
        channels: ['sms', 'email', 'external_api'],
        message: {
          template: 'emergency_escalation_level_2',
          subject: 'CRITICAL: Emergency Maintenance - Escalation Level 2',
          body: 'CRITICAL: Emergency maintenance request {{requestId}} at {{propertyName}} has been escalated due to no response for 1 hour.'
        },
        requiresAcknowledgment: true
      }
    ],
    createdBy: 'system'
  },
  {
    name: 'High Priority Message Escalation',
    description: 'Escalate high priority messages if not read within timeframe',
    isActive: true,
    triggerEvent: 'message_sent',
    conditions: {
      noResponseTime: 120, // 2 hours
      priority: ['high'],
      propertyIds: [],
      userRoles: ['landlord', 'tenant']
    },
    escalationLevels: [
      {
        level: 1,
        delayMinutes: 120,
        recipients: {
          type: 'users',
          userIds: [] // Will be populated with relevant users
        },
        channels: ['email'],
        message: {
          template: 'message_escalation_level_1',
          subject: 'Unread High Priority Message',
          body: 'You have an unread high priority message from {{senderName}} regarding {{conversationTitle}}.'
        },
        requiresAcknowledgment: false
      }
    ],
    createdBy: 'system'
  }
];

// Default notification rules
const defaultNotificationRules = [
  {
    name: 'New Message Notifications',
    description: 'Send notifications when new messages are received',
    isActive: true,
    scope: 'global',
    trigger: {
      event: 'message_received',
      conditions: {
        userRole: ['landlord', 'tenant', 'contractor'],
        priority: ['low', 'normal', 'high', 'urgent']
      }
    },
    actions: {
      channels: ['in_app', 'push'],
      recipients: {
        type: 'custom',
        customQuery: { participantsExceptSender: true }
      },
      message: {
        template: 'new_message_notification',
        subject: 'New Message',
        body: 'You have received a new message from {{senderName}}'
      }
    },
    analytics: {
      triggerCount: 0,
      successRate: 100,
      avgResponseTime: 0
    },
    createdBy: 'system'
  },
  {
    name: 'Maintenance Request Notifications',
    description: 'Notify landlords of new maintenance requests',
    isActive: true,
    scope: 'global',
    trigger: {
      event: 'maintenance_request',
      conditions: {
        userRole: ['tenant'],
        priority: ['low', 'normal', 'high', 'urgent']
      }
    },
    actions: {
      channels: ['in_app', 'email', 'sms'],
      recipients: {
        type: 'property_based',
        roles: ['landlord']
      },
      message: {
        template: 'maintenance_request_created',
        subject: 'New Maintenance Request - {{propertyName}}',
        body: 'A new maintenance request has been submitted for {{propertyName}}'
      },
      escalation: {
        enabled: true,
        timeouts: [30, 60, 120], // minutes
        escalationLevels: [
          {
            level: 1,
            recipients: ['landlord_id'],
            channels: ['sms'],
            message: 'Urgent: Maintenance request requires attention'
          }
        ]
      }
    },
    analytics: {
      triggerCount: 0,
      successRate: 100,
      avgResponseTime: 0
    },
    createdBy: 'system'
  },
  {
    name: 'Job Assignment Notifications',
    description: 'Notify contractors when jobs are assigned to them',
    isActive: true,
    scope: 'global',
    trigger: {
      event: 'job_assigned',
      conditions: {
        userRole: ['landlord'],
        priority: ['low', 'normal', 'high', 'urgent']
      }
    },
    actions: {
      channels: ['in_app', 'email', 'sms'],
      recipients: {
        type: 'specific_users',
        customQuery: { assignedContractor: true }
      },
      message: {
        template: 'job_assignment_notification',
        subject: 'New Job Assignment - {{jobTitle}}',
        body: 'You have been assigned to a new job: {{jobTitle}}'
      }
    },
    analytics: {
      triggerCount: 0,
      successRate: 100,
      avgResponseTime: 0
    },
    createdBy: 'system'
  }
];

export async function initializeCommunicationDatabase(): Promise<void> {
  try {
    console.log('Initializing PropAgentic Communication Database...');

    const batch = writeBatch(db);

    // Initialize notification templates
    console.log('Creating default notification templates...');
    for (const template of defaultNotificationTemplates) {
      const templateRef = doc(collection(db, 'notificationTemplates'));
      batch.set(templateRef, {
        ...template,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Initialize escalation rules
    console.log('Creating default escalation rules...');
    for (const rule of defaultEscalationRules) {
      const ruleRef = doc(collection(db, 'escalationRules'));
      batch.set(ruleRef, {
        ...rule,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Initialize notification rules
    console.log('Creating default notification rules...');
    for (const rule of defaultNotificationRules) {
      const ruleRef = doc(collection(db, 'notificationRules'));
      batch.set(ruleRef, {
        ...rule,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    await batch.commit();

    console.log('✅ Communication database initialized successfully!');
    console.log(`✅ Created ${defaultNotificationTemplates.length} notification templates`);
    console.log(`✅ Created ${defaultEscalationRules.length} escalation rules`);
    console.log(`✅ Created ${defaultNotificationRules.length} notification rules`);

  } catch (error) {
    console.error('❌ Error initializing communication database:', error);
    throw error;
  }
}

export async function createSampleData(userId: string, userRole: 'landlord' | 'tenant' | 'contractor'): Promise<void> {
  try {
    console.log(`Creating sample communication data for ${userRole}...`);

    if (userRole === 'landlord') {
      // Create sample notification preferences
      await setDoc(doc(db, 'notificationPreferences', userId), {
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
            enabled: true,
            start: '22:00',
            end: '08:00'
          }
        },
        sms: {
          enabled: true,
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
        },
        updatedAt: new Date()
      });

      // Create sample notification for onboarding
      await notificationService.createNotification({
        type: 'system',
        priority: 'normal',
        title: 'Welcome to PropAgentic Communications!',
        message: 'Your communication system is now set up. You can manage all tenant and contractor communications from here.',
        recipients: [{
          userId,
          name: 'Landlord',
          role: 'landlord',
          channels: ['in_app']
        }],
        status: 'pending'
      });

      console.log('✅ Sample landlord communication data created');
    }

    if (userRole === 'tenant') {
      // Create tenant notification preferences
      await setDoc(doc(db, 'notificationPreferences', userId), {
        userId,
        email: {
          enabled: true,
          events: {
            newMessage: true,
            maintenanceUpdates: true,
            paymentReminders: true,
            contractorBids: false,
            escalations: false,
            systemUpdates: true
          },
          frequency: 'instant',
          quietHours: {
            enabled: true,
            start: '21:00',
            end: '09:00'
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
            groupMessages: false,
            systemNotifications: true
          }
        },
        inApp: {
          enabled: true,
          showPreview: true,
          playSound: true,
          showDesktopNotifications: false
        },
        updatedAt: new Date()
      });

      console.log('✅ Sample tenant communication data created');
    }

    if (userRole === 'contractor') {
      // Create contractor notification preferences
      await setDoc(doc(db, 'notificationPreferences', userId), {
        userId,
        email: {
          enabled: true,
          events: {
            newMessage: true,
            maintenanceUpdates: false,
            paymentReminders: false,
            contractorBids: true,
            escalations: false,
            systemUpdates: true
          },
          frequency: 'instant',
          quietHours: {
            enabled: false,
            start: '22:00',
            end: '08:00'
          }
        },
        sms: {
          enabled: true,
          events: {
            urgentMessages: true,
            emergencyMaintenance: true,
            securityAlerts: false,
            paymentFailures: false
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
        },
        updatedAt: new Date()
      });

      console.log('✅ Sample contractor communication data created');
    }

  } catch (error) {
    console.error('❌ Error creating sample data:', error);
    throw error;
  }
}

// Export the initialization function for use in the app
export { defaultNotificationTemplates, defaultEscalationRules, defaultNotificationRules }; 