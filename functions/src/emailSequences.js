const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Email service configuration (you can use SendGrid, Mailgun, or similar)
const EMAIL_SERVICE_CONFIG = {
  // Add your email service configuration here
  apiKey: functions.config().email?.api_key,
  fromEmail: 'welcome@propagentic.com',
  fromName: 'PropAgentic Team'
};

/**
 * Welcome email sequences for different user roles
 */
const EMAIL_SEQUENCES = {
  landlord: [
    {
      delay: 0, // Send immediately
      templateId: 'landlord_welcome',
      subject: 'Welcome to PropAgentic - Your Property Management Journey Starts Now!',
      type: 'welcome'
    },
    {
      delay: 24 * 60 * 60 * 1000, // 24 hours
      templateId: 'landlord_getting_started',
      subject: 'Quick Start Guide: Add Your First Property',
      type: 'onboarding'
    },
    {
      delay: 3 * 24 * 60 * 60 * 1000, // 3 days
      templateId: 'landlord_features_overview',
      subject: 'Maximize Your ROI with These PropAgentic Features',
      type: 'education'
    },
    {
      delay: 7 * 24 * 60 * 60 * 1000, // 7 days
      templateId: 'landlord_success_tips',
      subject: 'Pro Tips from Successful Property Managers',
      type: 'tips'
    },
    {
      delay: 14 * 24 * 60 * 60 * 1000, // 2 weeks
      templateId: 'landlord_feedback_request',
      subject: 'How's Your PropAgentic Experience So Far?',
      type: 'feedback'
    }
  ],
  contractor: [
    {
      delay: 0,
      templateId: 'contractor_welcome',
      subject: 'Welcome to PropAgentic - Start Earning with Quality Jobs!',
      type: 'welcome'
    },
    {
      delay: 4 * 60 * 60 * 1000, // 4 hours
      templateId: 'contractor_profile_setup',
      subject: 'Complete Your Profile to Get More Jobs',
      type: 'onboarding'
    },
    {
      delay: 24 * 60 * 60 * 1000, // 24 hours
      templateId: 'contractor_first_jobs',
      subject: 'Your First Jobs Are Waiting!',
      type: 'activation'
    },
    {
      delay: 3 * 24 * 60 * 60 * 1000, // 3 days
      templateId: 'contractor_success_guide',
      subject: 'How to Win More Jobs on PropAgentic',
      type: 'education'
    },
    {
      delay: 7 * 24 * 60 * 60 * 1000, // 7 days
      templateId: 'contractor_payment_info',
      subject: 'Get Paid Faster with These Tips',
      type: 'tips'
    }
  ],
  tenant: [
    {
      delay: 0,
      templateId: 'tenant_welcome',
      subject: 'Welcome to PropAgentic - Maintenance Made Simple!',
      type: 'welcome'
    },
    {
      delay: 2 * 60 * 60 * 1000, // 2 hours
      templateId: 'tenant_how_to_request',
      subject: 'How to Submit Your First Maintenance Request',
      type: 'onboarding'
    },
    {
      delay: 7 * 24 * 60 * 60 * 1000, // 7 days
      templateId: 'tenant_tips_tricks',
      subject: 'Maintenance Tips Every Tenant Should Know',
      type: 'education'
    }
  ]
};

/**
 * Email templates for different user roles and sequence steps
 */
const EMAIL_TEMPLATES = {
  // Landlord Templates
  landlord_welcome: {
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 32px;">Welcome to PropAgentic!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 18px;">Your property management just got smarter</p>
        </div>
        <div style="padding: 40px 20px;">
          <h2>Hi {{firstName}},</h2>
          <p>Welcome to PropAgentic! We're excited to help you streamline your property management and maximize your rental income.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">What's Next?</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li>Add your properties to get started</li>
              <li>Invite your tenants to the platform</li>
              <li>Connect with vetted contractors in your area</li>
              <li>Set up automated maintenance workflows</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{dashboardUrl}}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">Go to Dashboard</a>
          </div>
          
          <p>If you have any questions, just reply to this email or contact our support team.</p>
          <p>Best regards,<br>The PropAgentic Team</p>
        </div>
      </div>
    `,
    text: `
      Welcome to PropAgentic!
      
      Hi {{firstName}},
      
      Welcome to PropAgentic! We're excited to help you streamline your property management and maximize your rental income.
      
      What's Next?
      - Add your properties to get started
      - Invite your tenants to the platform
      - Connect with vetted contractors in your area
      - Set up automated maintenance workflows
      
      Go to your dashboard: {{dashboardUrl}}
      
      If you have any questions, just reply to this email or contact our support team.
      
      Best regards,
      The PropAgentic Team
    `
  },

  // Contractor Templates
  contractor_welcome: {
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 32px;">Welcome to PropAgentic!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 18px;">Start earning with quality maintenance jobs</p>
        </div>
        <div style="padding: 40px 20px;">
          <h2>Hi {{firstName}},</h2>
          <p>Welcome to PropAgentic! You're now part of our network of professional contractors serving property managers and landlords.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Getting Started:</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li>Complete your contractor profile</li>
              <li>Set your service areas and specialties</li>
              <li>Upload certifications and insurance</li>
              <li>Start receiving job requests</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{dashboardUrl}}" style="background: #f5576c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">Complete Profile</a>
          </div>
          
          <p>Ready to start earning? Complete your profile to receive your first job opportunities!</p>
          <p>Best regards,<br>The PropAgentic Team</p>
        </div>
      </div>
    `,
    text: `
      Welcome to PropAgentic!
      
      Hi {{firstName}},
      
      Welcome to PropAgentic! You're now part of our network of professional contractors serving property managers and landlords.
      
      Getting Started:
      - Complete your contractor profile
      - Set your service areas and specialties
      - Upload certifications and insurance
      - Start receiving job requests
      
      Complete your profile: {{dashboardUrl}}
      
      Ready to start earning? Complete your profile to receive your first job opportunities!
      
      Best regards,
      The PropAgentic Team
    `
  },

  // Tenant Templates
  tenant_welcome: {
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 32px;">Welcome to PropAgentic!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 18px;">Maintenance requests made simple</p>
        </div>
        <div style="padding: 40px 20px;">
          <h2>Hi {{firstName}},</h2>
          <p>Welcome to PropAgentic! Your landlord has set up this platform to make maintenance requests and communication easier for everyone.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">How It Works:</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li>Submit maintenance requests instantly</li>
              <li>Upload photos to help contractors understand the issue</li>
              <li>Track the status of your requests in real-time</li>
              <li>Rate and review completed work</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{dashboardUrl}}" style="background: #4facfe; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">Submit Request</a>
          </div>
          
          <p>Have a maintenance issue? Don't wait - submit your first request now!</p>
          <p>Best regards,<br>The PropAgentic Team</p>
        </div>
      </div>
    `,
    text: `
      Welcome to PropAgentic!
      
      Hi {{firstName}},
      
      Welcome to PropAgentic! Your landlord has set up this platform to make maintenance requests and communication easier for everyone.
      
      How It Works:
      - Submit maintenance requests instantly
      - Upload photos to help contractors understand the issue
      - Track the status of your requests in real-time
      - Rate and review completed work
      
      Submit your first request: {{dashboardUrl}}
      
      Have a maintenance issue? Don't wait - submit your first request now!
      
      Best regards,
      The PropAgentic Team
    `
  }
};

/**
 * Cloud Function: Trigger welcome email sequence when user completes registration
 */
exports.triggerWelcomeSequence = functions.firestore
  .document('users/{userId}')
  .onCreate(async (snap, context) => {
    const userData = snap.data();
    const userId = context.params.userId;
    
    try {
      // Get the appropriate email sequence for the user role
      const userRole = userData.userType || userData.role;
      const sequence = EMAIL_SEQUENCES[userRole];
      
      if (!sequence) {
        console.log(`No email sequence found for role: ${userRole}`);
        return null;
      }

      // Schedule all emails in the sequence
      const batch = db.batch();
      const now = admin.firestore.Timestamp.now();
      
      sequence.forEach((email, index) => {
        const scheduleTime = new admin.firestore.Timestamp(
          now.seconds + Math.floor(email.delay / 1000),
          now.nanoseconds
        );
        
        const emailDoc = db.collection('scheduled_emails').doc();
        batch.set(emailDoc, {
          userId,
          userEmail: userData.email,
          firstName: userData.firstName || 'there',
          userRole,
          templateId: email.templateId,
          subject: email.subject,
          type: email.type,
          sequenceIndex: index,
          scheduledFor: scheduleTime,
          status: 'scheduled',
          createdAt: now
        });
      });
      
      await batch.commit();
      
      console.log(`Scheduled ${sequence.length} emails for user ${userId} (${userRole})`);
      
      // Track the event
      await db.collection('analytics_events').add({
        event: 'welcome_sequence_triggered',
        userId,
        userRole,
        emailCount: sequence.length,
        timestamp: now
      });
      
      return null;
    } catch (error) {
      console.error('Error triggering welcome sequence:', error);
      throw error;
    }
  });

/**
 * Cloud Function: Process scheduled emails
 */
exports.processScheduledEmails = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();
    
    try {
      // Get emails that are ready to be sent
      const query = await db
        .collection('scheduled_emails')
        .where('status', '==', 'scheduled')
        .where('scheduledFor', '<=', now)
        .limit(50) // Process in batches
        .get();
      
      if (query.empty) {
        console.log('No emails to process');
        return null;
      }
      
      const emailPromises = query.docs.map(async (doc) => {
        const emailData = doc.data();
        
        try {
          // Send the email
          await sendEmail(emailData);
          
          // Update status to sent
          await doc.ref.update({
            status: 'sent',
            sentAt: now
          });
          
          console.log(`Email sent: ${emailData.templateId} to ${emailData.userEmail}`);
          
          // Track the event
          await db.collection('analytics_events').add({
            event: 'welcome_email_sent',
            userId: emailData.userId,
            templateId: emailData.templateId,
            userRole: emailData.userRole,
            timestamp: now
          });
          
        } catch (error) {
          console.error(`Error sending email ${doc.id}:`, error);
          
          // Update status to failed
          await doc.ref.update({
            status: 'failed',
            error: error.message,
            failedAt: now
          });
        }
      });
      
      await Promise.all(emailPromises);
      console.log(`Processed ${query.docs.length} emails`);
      
      return null;
    } catch (error) {
      console.error('Error processing scheduled emails:', error);
      throw error;
    }
  });

/**
 * Helper function to send email
 */
async function sendEmail(emailData) {
  const template = EMAIL_TEMPLATES[emailData.templateId];
  
  if (!template) {
    throw new Error(`Template not found: ${emailData.templateId}`);
  }
  
  // Replace template variables
  const variables = {
    firstName: emailData.firstName,
    dashboardUrl: `https://app.propagentic.com/${emailData.userRole}/dashboard`
  };
  
  let htmlContent = template.html;
  let textContent = template.text;
  
  Object.keys(variables).forEach(key => {
    const placeholder = `{{${key}}}`;
    htmlContent = htmlContent.replace(new RegExp(placeholder, 'g'), variables[key]);
    textContent = textContent.replace(new RegExp(placeholder, 'g'), variables[key]);
  });
  
  // Here you would integrate with your email service (SendGrid, Mailgun, etc.)
  // For example, using SendGrid:
  /*
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(EMAIL_SERVICE_CONFIG.apiKey);
  
  const msg = {
    to: emailData.userEmail,
    from: {
      email: EMAIL_SERVICE_CONFIG.fromEmail,
      name: EMAIL_SERVICE_CONFIG.fromName
    },
    subject: emailData.subject,
    text: textContent,
    html: htmlContent
  };
  
  await sgMail.send(msg);
  */
  
  // For now, just log the email (replace with actual email service)
  console.log(`Sending email to ${emailData.userEmail}:`);
  console.log(`Subject: ${emailData.subject}`);
  console.log(`Template: ${emailData.templateId}`);
  
  return true;
}

/**
 * Cloud Function: Manual email sequence management
 */
exports.manageEmailSequence = functions.https.onCall(async (data, context) => {
  // Verify the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const { action, userId, templateId } = data;
  
  try {
    switch (action) {
      case 'pause':
        // Pause remaining emails for a user
        await db.collection('scheduled_emails')
          .where('userId', '==', userId)
          .where('status', '==', 'scheduled')
          .get()
          .then(snapshot => {
            const batch = db.batch();
            snapshot.docs.forEach(doc => {
              batch.update(doc.ref, { status: 'paused' });
            });
            return batch.commit();
          });
        break;
        
      case 'resume':
        // Resume paused emails for a user
        await db.collection('scheduled_emails')
          .where('userId', '==', userId)
          .where('status', '==', 'paused')
          .get()
          .then(snapshot => {
            const batch = db.batch();
            snapshot.docs.forEach(doc => {
              batch.update(doc.ref, { status: 'scheduled' });
            });
            return batch.commit();
          });
        break;
        
      case 'skip':
        // Skip a specific email
        if (templateId) {
          await db.collection('scheduled_emails')
            .where('userId', '==', userId)
            .where('templateId', '==', templateId)
            .where('status', '==', 'scheduled')
            .get()
            .then(snapshot => {
              const batch = db.batch();
              snapshot.docs.forEach(doc => {
                batch.update(doc.ref, { status: 'skipped' });
              });
              return batch.commit();
            });
        }
        break;
        
      default:
        throw new functions.https.HttpsError('invalid-argument', 'Invalid action');
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error managing email sequence:', error);
    throw new functions.https.HttpsError('internal', 'Failed to manage email sequence');
  }
});

/**
 * Cloud Function: Get email sequence status for a user
 */
exports.getEmailSequenceStatus = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const { userId } = data;
  
  try {
    const snapshot = await db.collection('scheduled_emails')
      .where('userId', '==', userId)
      .orderBy('scheduledFor')
      .get();
    
    const emails = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      scheduledFor: doc.data().scheduledFor.toDate(),
      sentAt: doc.data().sentAt?.toDate(),
      failedAt: doc.data().failedAt?.toDate()
    }));
    
    return { emails };
  } catch (error) {
    console.error('Error getting email sequence status:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get email sequence status');
  }
}); 