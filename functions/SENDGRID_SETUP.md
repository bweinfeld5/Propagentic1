# SendGrid Integration Setup Guide

## 🚀 Overview

Your PropAgentic app now uses SendGrid for reliable email delivery instead of the Firebase mail extension. This provides better deliverability, detailed analytics, and professional email sending capabilities.

## 📋 Prerequisites

1. **SendGrid Account**: Sign up at [https://sendgrid.com](https://sendgrid.com)
2. **Domain Verification**: Verify your sending domain for better deliverability
3. **Firebase CLI**: Ensure you have Firebase CLI installed

## 🔧 Setup Steps

### Step 1: Get SendGrid API Key

1. Log into your SendGrid dashboard
2. Go to **Settings** → **API Keys**
3. Click **Create API Key**
4. Choose **Restricted Access** and enable:
   - `Mail Send` (full access)
   - `Mail Settings` (read access)
   - `Tracking` (read access)
5. Copy the generated API key (starts with `SG.`)

### Step 2: Configure Domain Authentication (Recommended)

1. In SendGrid, go to **Settings** → **Sender Authentication**
2. Click **Authenticate Your Domain**
3. Follow the steps to add DNS records for your domain
4. Use `noreply@yourdomain.com` as your sender email

### Step 3: Set Environment Variables

Choose one of these methods:

#### Option A: Firebase Functions Config (Recommended)
```bash
cd functions
firebase functions:config:set sendgrid.api_key="YOUR_SENDGRID_API_KEY"
firebase functions:config:set app.domain="https://yourdomain.com"
```

#### Option B: Local .env File (for development)
```bash
cd functions
cp .env.example .env
# Edit .env and add your SendGrid API key
```

### Step 4: Update Sender Email

In `functions/src/sendgridEmailService.ts`, update the default sender:
```typescript
from: emailData.from || 'noreply@yourdomain.com', // Replace with your domain
```

### Step 5: Deploy Functions

```bash
cd functions
npm run build
firebase deploy --only functions
```

## 🧪 Testing the Integration

### Test 1: Basic Ping Test
```bash
# Test if functions are deployed
curl -X POST https://your-region-your-project.cloudfunctions.net/testPing \
  -H "Content-Type: application/json"
```

### Test 2: SendGrid Email Test (Requires Authentication)

You can test SendGrid from your app by calling the test function:

```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const testSendGrid = httpsCallable(functions, 'testSendGrid');

// Test with your email
const result = await testSendGrid({ email: 'your-email@example.com' });
console.log('SendGrid test result:', result.data);
```

### Test 3: Full Invite Flow Test

1. Create a property in your app
2. Try to invite a tenant using the enhanced property creation flow
3. Check that the email arrives in the tenant's inbox
4. Verify the invite code works for property joining

## 📊 Monitoring & Troubleshooting

### Check Firebase Logs
```bash
firebase functions:log --only sendInviteEmail,testSendGrid
```

### SendGrid Dashboard
- Monitor email delivery in SendGrid's **Activity** tab
- Check for bounces, blocks, or delivery issues
- View email engagement metrics

### Common Issues & Solutions

#### Issue: "SendGrid API key not configured"
**Solution**: Ensure the API key is properly set in Firebase functions config

#### Issue: "Sender email not verified"  
**Solution**: Verify your sender domain in SendGrid or use a verified single sender

#### Issue: Emails going to spam
**Solutions**:
- Complete domain authentication
- Add SPF/DKIM records
- Monitor sender reputation
- Use professional email templates

#### Issue: Functions deployment fails
**Solution**: 
```bash
cd functions
npm install
npm run build
firebase deploy --only functions --force
```

## 🎯 Production Checklist

- [ ] SendGrid API key configured
- [ ] Domain authentication completed
- [ ] Sender email updated to your domain
- [ ] Functions deployed successfully
- [ ] Test emails received successfully
- [ ] Invite flow tested end-to-end
- [ ] Email templates look professional
- [ ] Monitoring set up for email delivery

## 📧 Email Templates

The system includes two email types:

1. **Basic Test Email**: Simple confirmation that SendGrid is working
2. **Property Invite Email**: Rich HTML template with:
   - Professional PropAgentic branding
   - Clear invitation code display
   - Direct accept button
   - Instructions for manual code entry
   - Landlord contact information
   - Mobile-responsive design

## 🔄 Migration from Firebase Mail Extension

The new system automatically replaces the old Firebase mail extension:

- ✅ **Before**: Added documents to `mail` collection → Gmail SMTP
- ✅ **After**: Direct SendGrid API calls → Professional email delivery

**Benefits of the new system:**
- Better deliverability rates
- Detailed sending analytics
- Professional sender reputation
- Faster email processing
- No dependency on Gmail SMTP limits

## 🛠️ Development vs Production

### Development
- Use `.env` file for API keys
- Test with personal email addresses
- Use localhost domain for testing

### Production  
- Use Firebase functions config for API keys
- Verify your production domain
- Monitor delivery rates and engagement

---

**Need Help?** Check Firebase functions logs and SendGrid activity dashboard for detailed error information.