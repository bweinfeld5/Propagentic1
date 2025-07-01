# Fix Email Sending - Update to SendGrid

## Current Issue
Your Firebase Email Extension is configured with Gmail SMTP, but you need to use SendGrid.

## Solution: Update Email Extension Configuration

### Option 1: Firebase Console (Easiest)

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/project/propagentic/extensions
   
2. **Find the "Trigger Email" extension**
   - Click on "Manage" or "Reconfigure"
   
3. **Update SMTP Settings**:
   - **Authentication Type**: `Username & Password`
   - **SMTP connection URI**: `smtps://apikey@smtp.sendgrid.net:465`
   - **SMTP password**: `[Your SendGrid API Key]` (starts with `SG.`)
   - **Default FROM address**: `no-reply@propagentic.com`
   - **Email documents collection**: `mail`

4. **Save Changes**

### Option 2: Uninstall and Reinstall

If reconfiguration doesn't work:

```bash
# 1. Uninstall current extension
firebase ext:uninstall firestore-send-email --project propagentic

# 2. Reinstall with SendGrid config
firebase ext:install firebase/firestore-send-email --project propagentic
```

When prompted during installation, use these values:
- **Authentication Type**: Select `Username & Password`
- **SMTP connection URI**: `smtps://apikey@smtp.sendgrid.net:465`
- **SMTP password**: Your SendGrid API Key
- **Email documents collection**: `mail`

### Option 3: Test SendGrid Directly

Create a test to verify SendGrid credentials:

```javascript
// test-sendgrid.js
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey('YOUR_SENDGRID_API_KEY');

const msg = {
  to: 'test@example.com',
  from: 'no-reply@propagentic.com',
  subject: 'Test Email from PropAgentic',
  text: 'This is a test email',
  html: '<strong>This is a test email</strong>',
};

sgMail
  .send(msg)
  .then(() => console.log('Email sent successfully'))
  .catch((error) => console.error(error));
```

## Getting Your SendGrid API Key

1. Log in to SendGrid: https://app.sendgrid.com/
2. Navigate to **Settings** → **API Keys**
3. Click **Create API Key**
4. Give it a name (e.g., "PropAgentic Firebase")
5. Select **Full Access** or **Restricted Access** with "Mail Send" permissions
6. Copy the API key (starts with `SG.`)

## Important SendGrid Setup

1. **Verify Your Sender Domain**:
   - Go to **Settings** → **Sender Authentication**
   - Add and verify `propagentic.com` domain
   
2. **Set up DNS Records**:
   - SendGrid will provide DNS records
   - Add these to your domain provider

## Troubleshooting

If emails still don't send after configuration:

1. **Check SendGrid Activity**:
   - Visit: https://app.sendgrid.com/email_activity
   - Look for blocked or bounced emails

2. **Check Firebase Functions Logs**:
   ```bash
   firebase functions:log --project propagentic
   ```

3. **Check Firestore mail collection**:
   - Look for `delivery` field in documents
   - Check for error messages

4. **Verify Domain Authentication**:
   - Unauthenticated domains may have emails blocked
   - Complete domain verification in SendGrid

## Alternative: Direct SendGrid Integration

If the extension continues to have issues, you can send emails directly:

```javascript
// In your Cloud Functions
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(functions.config().sendgrid.key);

// Send email function
exports.sendWelcomeEmail = functions.firestore
  .document('waitlist/{docId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    
    const msg = {
      to: data.email,
      from: 'no-reply@propagentic.com',
      templateId: 'd-xxxxx', // SendGrid template ID
      dynamicTemplateData: {
        name: data.name,
        role: data.role
      }
    };
    
    try {
      await sgMail.send(msg);
      console.log('Email sent to:', data.email);
    } catch (error) {
      console.error('SendGrid error:', error);
    }
  });
``` 