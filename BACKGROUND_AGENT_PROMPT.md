# Background Agent Prompt: PropAgentic SendGrid Integration

## 🤖 Agent Instructions

You are a specialized background agent for PropAgentic. Your mission is to **audit and integrate ALL email functionality** with the working SendGrid system.

## 📋 Quick Context
- ✅ **SendGrid is WORKING**: Successfully tested with 410haulers@gmail.com
- ✅ **Firebase Extension**: `firestore-send-email` configured correctly
- ✅ **Some functions updated**: Invitations, contractor notifications, sequences, general notifications
- ❌ **Many functions still need audit**: Authentication, maintenance, marketing, etc.

## 🎯 Your Task
1. **AUDIT**: Find ALL email-related code in the codebase
2. **IDENTIFY**: Functions NOT using Firebase Extension (still using nodemailer, direct SMTP, etc.)
3. **MIGRATE**: Update them to use the working Firebase Extension pattern
4. **TEST**: Verify each function sends emails successfully
5. **DOCUMENT**: Create comprehensive audit report

## 🔍 Search Patterns
Look for these in ALL files:
```bash
# Search commands to run:
grep -r "nodemailer" --include="*.js" --include="*.ts" .
grep -r "transporter" --include="*.js" --include="*.ts" .
grep -r "sendMail" --include="*.js" --include="*.ts" .
grep -r "smtp://" --include="*.js" --include="*.ts" .
grep -r "createTransport" --include="*.js" --include="*.ts" .
```

## ✅ Correct Pattern (Use This)
```javascript
// Firebase Extension Pattern (WORKING)
const emailData = {
  to: recipientEmail,
  message: {
    subject: "Subject Here",
    html: htmlContent,
    text: textContent
  }
};
await db.collection('mail').add(emailData);
```

## ❌ Incorrect Patterns (Replace These)
```javascript
// Nodemailer (REPLACE)
const transporter = nodemailer.createTransporter({...});
await transporter.sendMail({...});

// Direct SMTP (REPLACE)
const transport = createTransport({...});
```

## 📁 Priority Directories
1. `/functions/src/` - Cloud Functions (HIGH PRIORITY)
2. `/src/services/` - Client services
3. `/src/components/` - React components
4. `/src/pages/` - Page components

## 🚨 Critical Rules
- **DO NOT BREAK** existing functionality
- **TEST EVERY CHANGE** with real emails
- **FOLLOW** the working pattern from `functions/src/invites.ts`
- **DOCUMENT** everything you find and change
- **USE** the existing SendGrid configuration (already working)

## 📊 Expected Deliverables
1. **SENDGRID_AUDIT_REPORT.md** - Complete inventory
2. **Updated functions** - All using Firebase Extension
3. **EMAIL_TESTING_RESULTS.md** - Test confirmations
4. **Clean codebase** - No nodemailer dependencies

## 🚀 Start Command
```bash
git checkout feature/sendgrid-integration-audit
npm install
cd functions && npm install
# Begin audit with: grep -r "nodemailer" .
```

## 📞 Reference Files
- `SENDGRID_INTEGRATION_TASK.md` - Full detailed instructions
- `EMAIL_SYSTEM_STATUS.md` - Current system status
- `functions/src/invites.ts` - Working example to follow

**GO!** Start with the audit phase and work systematically through each function. 