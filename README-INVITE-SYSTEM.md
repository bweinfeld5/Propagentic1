# PropAgentic Tenant Invitation System

This document provides a comprehensive guide to the tenant invitation system in PropAgentic. For detailed technical documentation, see [docs/invitation-system.md](docs/invitation-system.md) and [docs/testing-invite-codes.md](docs/testing-invite-codes.md).

## Overview

The tenant invitation system allows property managers and landlords to securely onboard tenants to their properties through unique invitation codes. This system ensures only authorized tenants gain access to properties and enables efficient tenant management.

### Key Features

- **Secure Invitation Codes**: Generate unique, time-limited codes for property access
- **Email Restrictions**: Optionally restrict codes to specific tenant email addresses
- **Unit Assignment**: Associate tenants with specific units within properties
- **Auto-Expiration**: Codes automatically expire after a configurable period
- **Validation Flow**: Multi-step validation process to ensure security
- **Relationship Management**: Creates tenant-property relationships in the database

## System Architecture

The invitation system consists of three main components:

1. **Backend (Firebase Cloud Functions)**:
   - `generateInviteCode`: Creates new invite codes with security parameters
   - `validateInviteCode`: Verifies code validity without redeeming it
   - `redeemInviteCode`: Processes code redemption and creates tenant-property relationships

2. **Frontend Services**:
   - `inviteCodeService.ts`: Client-side service that interfaces with the Cloud Functions
   - Handles validation, redemption, and management of invite codes

3. **UI Components**:
   - `TenantInviteForm.tsx`: Form for tenants to enter and validate codes
   - `TenantInviteModal.tsx`: Modal interface for the invite code workflow
   - Landlord interfaces for generating and managing codes

## Implementation Details

### Data Model

- **InviteCode**: Stores code details, restrictions, and status
- **PropertyTenantRelationship**: Links tenants to properties with access information
- **User Profile**: Contains arrays of associated properties
- **Property**: Contains arrays of associated tenants or unit assignments

### Security

- **Firestore Rules**: Ensures only authorized users can create or redeem codes
- **Email Verification**: Validates tenant email against code restrictions
- **Expiration Controls**: Automatically invalidates unused codes
- **Status Tracking**: Prevents code reuse or redemption after revocation

## Email Configuration

### Required Firebase Function Configurations

To enable the email invitation functionality, you must configure the following Firebase Function environment variables:

1. **SMTP Configuration**:
   ```bash
   firebase functions:config:set smtp.host="YOUR_SMTP_HOST" \
                          smtp.port="587" \
                          smtp.secure="false" \
                          smtp.user="YOUR_SMTP_USER" \
                          smtp.pass="YOUR_SMTP_PASSWORD"
   ```

2. **App Domain Configuration** (for proper links in emails):
   ```bash
   firebase functions:config:set app.domain="https://your-propagentic-domain.com"
   ```

3. **Email Sender Configuration**:
   ```bash
   firebase functions:config:set email.from="noreply@propagentic.com"
   ```

4. **Testing Configuration** (optional, for development only):
   ```bash
   # For using Mailtrap in development
   firebase functions:config:set smtp.host="smtp.mailtrap.io" \
                          smtp.port="2525" \
                          smtp.secure="false" \
                          smtp.user="YOUR_MAILTRAP_USERNAME" \
                          smtp.pass="YOUR_MAILTRAP_PASSWORD"
   ```

5. **To view current configuration**:
   ```bash
   firebase functions:config:get
   ```

6. After setting configuration, redeploy Firebase Functions:
   ```bash
   firebase deploy --only functions
   ```

### Email Templates

The system sends an HTML email with:
- Tenant's name and property information
- A unique 8-character invite code in the same format as manually generated codes
- A direct link to accept the invitation
- Styling that matches the PropAgentic brand

### How Email Invites Work

1. When a landlord creates an invite via the `InviteTenantModal`, it creates an entry in the `invites` collection
2. The `sendInviteEmail` function triggers on creation of that document
3. The function generates a unique 8-character code and stores it in the `inviteCodes` collection
4. It sends an email to the tenant with the code and direct link
5. It updates the invite document with the email sending status and code reference

### Monitoring Email Delivery

The system logs the delivery status of each email in the Firebase Functions logs and updates the `emailSentStatus` field of the invite document with one of these values:
- `pending`: Initial state when invite is created
- `processing`: Email is being prepared and sent
- `sent`: Email was successfully sent
- `failed`: Email failed to send (with error details in `emailError` field)

## Usage

### For Landlords

#### Creating an Invite Code (UI)

1. Navigate to your property management dashboard
2. Select a property
3. Click "Tenant Management" 
4. Click "Create Invite Code"
5. Configure options:
   - Restrict to specific email (optional)
   - Assign to specific unit (optional)
   - Set expiration period
6. Share the generated code with your tenant

#### Managing Invite Codes

- View all active codes for your properties
- Revoke codes that should no longer be valid
- Track which codes have been used and by whom
- Extend expiration dates when needed

### For Tenants

#### Joining a Property

1. Log in to your tenant account
2. On the dashboard, click "I have an invite code"
3. Enter the code provided by your landlord
4. System validates the code and displays property details
5. Click "Join Property" to complete the process

## Testing

For comprehensive testing instructions, see [docs/testing-invite-codes.md](docs/testing-invite-codes.md).

Quick test commands:

```bash
# Test invite code creation
node scripts/test-invite-code-creation.js

# Test invite code redemption
node scripts/test-invite-code-redemption.js
```

### Testing Email Delivery

To verify that emails are being sent properly:

1. **Use Mailtrap for Development**:
   - Create a free [Mailtrap](https://mailtrap.io) account
   - Configure Firebase Functions with your Mailtrap credentials as shown above
   - Mailtrap captures all emails without sending them to actual recipients

2. **Email Delivery Test**:
   ```bash
   # Test function that creates an invite and sends email
   node scripts/test-email-invite.js
   ```

3. **Check Firestore Documents**:
   - Verify that documents in the `invites` collection have `emailSentStatus: 'sent'`
   - Confirm that related documents in the `inviteCodes` collection are created

4. **Monitoring Logs**:
   ```bash
   # Stream logs to check email delivery in real-time
   firebase functions:log --only sendInviteEmail
   ```

## Development

### Adding New Features

The invitation system is designed to be extensible. Common enhancements include:

- **Bulk Code Generation**: For multi-unit properties
- **QR Code Integration**: Generate QR codes for invite codes
- **Template Messages**: Custom email templates for sending invites
- **Usage Analytics**: Track invitation conversion rates

### Troubleshooting

For common issues and solutions, see [docs/testing-invite-codes.md#troubleshooting](docs/testing-invite-codes.md#troubleshooting).

## Invite Code Restrictions

- Codes are case-insensitive
- Codes expire after the specified time (default: 7 days)
- If a code is restricted to an email, it will only work for that email address
- Codes can only be used once

## Troubleshooting

Common issues:

1. **"Code not found" or "Invalid invite code"**: Check the code for typos, codes are case-insensitive but must match exactly
2. **"Code has expired"**: Ask the landlord to generate a new code
3. **"Code is restricted to [email]"**: The code can only be used with the specified email address
4. **"You are already associated with this property"**: You're already a tenant of this property
5. **"This invite code has already been used"**: The code has been previously redeemed
6. **Email not sending**: Check Firebase Functions logs and verify SMTP configuration is correct
7. **"Incomplete SMTP configuration"**: Make sure all SMTP settings are properly configured as shown above

## For Developers

To implement the invitation system in new components:

1. Import the invite code service:
```typescript
import { validateInviteCode, redeemInviteCode } from '../services/inviteCodeService';
```

2. Validate a code without redeeming it:
```typescript
const validationResult = await validateInviteCode(code);
if (validationResult.isValid) {
  // Show property information
} else {
  // Show error
}
```

3. Redeem a code:
```typescript
const result = await redeemInviteCode(code, userId);
if (result.success) {
  // Show success message, update UI
} else {
  // Show error message
}
```

## Security Considerations

- Invite codes are stored securely in Firebase Firestore
- Only landlords can generate codes for properties they own
- Email restrictions provide an additional layer of security
- All code validation and redemption is performed server-side
- Proper Firestore security rules prevent unauthorized access

## Testing

Run the full test suite with:

```bash
npm run test:invite
```

This will test both creation and redemption of invite codes.

## Further Documentation

For complete technical documentation, see [docs/invitation-system.md](docs/invitation-system.md). 