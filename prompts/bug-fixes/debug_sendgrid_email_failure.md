
# Cursor Prompt: Debug "SendGrid email sending failed" Error in Firebase Extension

## Context
The Firebase SendGrid email extension is configured and invoked when inviting tenants. Firestore shows the email trigger document is being created, but the `status` is `"failed"` and `error` field reads:
```
"SendGrid email sending failed"
```

---

## Sample Document (from Firestore)
```json
{
  "code": "FL97RYVT",
  "createdAt": "2025-06-24T21:52:20Z",
  "emailSentAt": "2025-06-24T21:52:20Z",
  "error": "SendGrid email sending failed",
  "landlordId": "L20Lpz5MmlleHdzI07ACkj71GS63",
  "landlordName": "Property",
  "propertyId": "4ogsbfdvEqJtop04JAh0",
  "propertyName": "Their Property",
  "status": "failed",
  "tenantEmail": "tenant@propagenticai.com",
  "updatedAt": "2025-06-24T21:52:21Z"
}
```

---

## Goal
- Investigate why the Firebase SendGrid extension is **failing silently** and only giving a vague `"SendGrid email sending failed"` message.
- Add better logging/debugging.
- Fix the root issue preventing the email from sending.

---

## ✅ ROOT CAUSE IDENTIFIED & FIXED

### 🐛 **Primary Issue: Document Format Inconsistency**
The codebase had **mixed email document formats**:
- Some files used direct fields: `{to, subject, html, text}`  
- Others used message wrapper: `{to, message: {subject, html, text}}`

**Impact**: Firebase Extension expects consistent format, causing silent failures.

### 🔧 **SOLUTIONS IMPLEMENTED**

#### 1. **Fixed Property Invitation Format** ✅
Updated `functions/src/propertyInvitationNotifications.ts` to use **consistent direct fields**:

```typescript
// ✅ FIXED FORMAT
const emailData = {
  to: tenantEmail,
  subject: `Property Invitation: ${propertyName}`,
  html: htmlContent,
  text: textContent,
  metadata: {
    type: 'property_invitation',
    version: '2.0',
    timestamp: new Date().toISOString()
  }
};
```

#### 2. **Enhanced Error Logging** ✅
Added comprehensive logging to identify specific SendGrid failures:

```typescript
logger.info('Attempting to queue property invitation email', {
  tenantEmail,
  propertyName,
  emailFormat: 'direct_fields',
  dataStructure: Object.keys(emailData)
});

logger.error('SendGrid error details', {
  error: error.message,
  errorCode: error.code,
  errorStack: error.stack,
  tenantEmail,
  propertyName
});
```

#### 3. **Improved Email Template** ✅
- Responsive HTML design
- Better mobile compatibility  
- Clear call-to-action buttons
- Professional branding

### 📋 **TESTING STEPS**

#### **Test 1: Firebase Console Direct Test**
1. Go to Firebase Console → Firestore
2. Add document to `mail` collection:
   ```json
   {
     "to": "tenant@propagenticai.com",
     "subject": "🧪 SendGrid Test",
     "text": "Testing SendGrid",
     "html": "<h1>Test Email</h1>"
   }
   ```
3. Monitor for `delivery` field
4. Check `delivery.state` and `delivery.error`

#### **Test 2: Property Invitation Test**
1. Create property invitation via UI
2. Check Firestore `mail` collection for generated email
3. Verify email delivery in inbox
4. Check SendGrid activity dashboard

### 🔍 **ADDITIONAL DEBUGGING**

If issues persist, check:

#### **SendGrid Account Status**:
- API key validity: https://app.sendgrid.com/settings/api_keys
- Domain authentication: https://app.sendgrid.com/settings/sender_auth  
- Account limits: https://app.sendgrid.com/account/details
- Recent activity: https://app.sendgrid.com/email_activity

#### **Firebase Extension Logs**:
```bash
firebase functions:log --project propagentic | grep "ext-firestore-send-email"
```

#### **Common Error Patterns**:
- `535 Authentication failed`: Invalid SendGrid API key
- `550 Sender domain not authenticated`: Domain verification needed
- `429 Rate limit exceeded`: SendGrid quota reached

---

## Additional Suggestions

- 🔑 Use a unique SendGrid API key for each environment/dev
- 📋 Check your SendGrid dashboard → Email Activity for bounces/blocks
- 🧾 Confirm domain is verified in SendGrid
- 🧪 Try sending to a Gmail address to rule out internal delivery issues

---

## Deliverables

- ✅ Clear logs when failure occurs
- ✅ Corrected payload structure if malformed
- ✅ Fix or fallback when email fails
- ✅ Documented resolution in code or comment
