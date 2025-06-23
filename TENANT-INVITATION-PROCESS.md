# Tenant Invitation Process in PropAgentic

This document provides a comprehensive guide to the tenant invitation process in PropAgentic, covering the end-to-end flow from landlord sending an invitation to tenant acceptance.

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Landlord Flow: Inviting Tenants](#landlord-flow-inviting-tenants)
4. [Email Delivery System](#email-delivery-system)
5. [Tenant Flow: Accepting Invitations](#tenant-flow-accepting-invitations)
6. [Data Model](#data-model)
7. [Troubleshooting](#troubleshooting)
8. [Technical Implementation Details](#technical-implementation-details)

## Overview

The PropAgentic tenant invitation system allows landlords to invite tenants to join their properties. The process works as follows:

1. Landlord sends an invitation to a tenant's email address
2. System creates an invitation record in Firestore
3. Firebase sends an email to the tenant
4. Tenant receives the email and clicks the invitation link
5. Tenant creates an account or logs in if they already have one
6. Tenant accepts the invitation and gains access to the property

## Prerequisites

### Landlord Requirements
- Active PropAgentic account with landlord role
- At least one property added to their account
- Valid tenant email address

### System Requirements
- Firebase Authentication enabled
- Firestore database with proper security rules
- Firebase Extension for sending emails installed and configured
- Proper Firestore rules allowing write access to the `mail` collection

## Landlord Flow: Inviting Tenants

### Step 1: Navigate to Tenants Page
1. Log in to your PropAgentic landlord account
2. Navigate to "Tenants" section from the main dashboard 
3. Click the "Invite Tenant" button

### Step 2: Fill Out Invitation Form
1. Select the property to invite the tenant to (if you have multiple properties)
2. Enter the tenant's email address
3. Click "Send Invitation"

### Step 3: Invitation Confirmation
1. System validates the form data
2. Creates an invitation record in Firestore
3. Triggers the email sending process
4. Displays confirmation message to landlord

## Email Delivery System

PropAgentic uses Firebase's `firestore-send-email` extension to handle email delivery. When an invitation is created:

1. A document is added to the `invites` collection with status `pending`
2. A document is added to the `mail` collection which triggers the email extension
3. The extension sends an email to the tenant with invitation details
4. When email is sent successfully, the invite document is updated with `emailSentStatus: 'sent'`

### Email Configuration
- Sender: `no-reply@propagentic.com` or your configured sender email
- Subject: "You've been invited to PropAgentic"
- Content: Includes property details and an acceptance link

## Tenant Flow: Accepting Invitations

### Step 1: Receive Invitation Email
1. Tenant receives email with invitation details
2. Email contains a unique link to accept the invitation

### Step 2: Click Invitation Link
1. Link redirects to PropAgentic web application
2. System validates the invitation token/ID

### Step 3: Create Account or Log In
1. If not logged in, tenant is prompted to create an account or log in
2. For new users:
   - Enter name, email, password
   - Verify email (if required)
   - Complete basic profile

### Step 4: Accept Invitation
1. After authentication, tenant sees invitation details
2. Tenant clicks "Accept Invitation" button
3. System updates invitation status to `accepted`
4. Tenant profile is updated with property association

### Step 5: Access Property Dashboard
1. Tenant is redirected to their dashboard
2. They can now access property-specific features:
   - Submit maintenance requests
   - View property details
   - Communicate with landlord
   - Access documents

## Data Model

### Invite Document Structure
```javascript
{
  id: "auto-generated-id",
  tenantEmail: "tenant@example.com",
  propertyId: "property-id-123",
  landlordId: "landlord-id-456",
  status: "pending", // pending, accepted, declined, expired, deleted
  emailSentStatus: "pending", // pending, sent, failed
  createdAt: Timestamp,
  expiresAt: Timestamp,
  propertyName: "Maple Gardens",
  landlordName: "John Smith",
  // Optional fields
  acceptedAt: Timestamp,
  declinedAt: Timestamp,
  tenantId: "tenant-id-789" // Added when accepted
}
```

### User Profile Updates
When a tenant accepts an invitation, their user profile document is updated:
```javascript
{
  userType: "tenant",
  propertyId: "property-id-123",
  landlordId: "landlord-id-456",
  joinDate: Timestamp
}
```

## Troubleshooting

### Common Issues for Landlords

#### Invitation Not Sending
1. **Check Firestore Rules**: Ensure the account has permission to write to `invites` and `mail` collections
2. **Verify Email Configuration**: Check Firebase console for email extension configuration
3. **Check Logs**: View Firebase Functions logs for any errors in the email sending process

#### Tenant Reports Not Receiving Invitation
1. **Check Spam Folder**: Ask tenant to check spam/junk folders
2. **Verify Email Address**: Confirm the correct email was entered
3. **Resend Invitation**: Delete old invitation and create a new one
4. **Check Invitation Status**: View invitation status in Firestore to confirm it was sent

### Common Issues for Tenants

#### Invitation Link Not Working
1. **Check Expiration**: Invitations expire after 7 days
2. **Verify Account Email**: Ensure tenant is signing up/logging in with the same email the invitation was sent to
3. **Link Format**: Ensure the link wasn't broken in the email client

#### Can't Access Property After Accepting
1. **Verify Invitation Status**: Check Firestore to ensure invitation status is `accepted`
2. **Check User Profile**: Ensure tenant profile has been properly updated with property association
3. **Clear Cache/Cookies**: Have tenant try clearing browser cache and logging in again

## Technical Implementation Details

### Key Components

#### Frontend
- `InviteTenantModal.tsx`: Modal component for landlords to send invitations
- `inviteService.ts`: Service for creating and managing invitations
- `InvitationBanner.tsx`: Component for displaying pending invitations to tenants

#### Backend
- Firebase Firestore for storing invitation data
- Firebase Authentication for user management
- Firebase Functions for processing invitations
- Firebase Extension for email sending

### Security Rules
The following Firestore security rules are required:

```
match /invites/{inviteId} {
  // Allow landlords to create invites
  allow create: if request.auth != null && 
                  request.auth.uid == request.resource.data.landlordId &&
                  get(/databases/$(database)/documents/users/$(request.auth.uid)).data.userType == 'landlord';
  
  // Allow tenants to read and update their own invites
  allow read: if request.auth != null && 
               (resource.data.tenantEmail == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.email ||
                resource.data.landlordId == request.auth.uid);
                
  allow update: if request.auth != null && 
                 (resource.data.tenantEmail == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.email ||
                  resource.data.landlordId == request.auth.uid) &&
                 request.resource.data.propertyId == resource.data.propertyId &&
                 request.resource.data.landlordId == resource.data.landlordId &&
                 request.resource.data.tenantEmail == resource.data.tenantEmail;
}

match /mail/{document} {
  // Allow authenticated users to create mail documents
  allow create: if request.auth != null;
  // Only allow system/admin to read mail documents
  allow read, update, delete: if false;
}
```

### Email Sending Logic
1. When invitation is created, `inviteService.createInvite()` adds a document to the `invites` collection
2. A Cloud Function or client-side code adds a document to the `mail` collection:
   ```javascript
   await addDoc(collection(db, 'mail'), {
     to: inviteData.tenantEmail,
     message: {
       subject: 'You\'ve been invited to PropAgentic',
       html: `<p>Hello,</p>
              <p>You've been invited to join ${inviteData.propertyName} on PropAgentic by ${inviteData.landlordName}.</p>
              <p><a href="https://propagentic.com/invite/${inviteId}">Click here to accept the invitation</a></p>
              <p>This invitation will expire in 7 days.</p>`
     }
   });
   ```
3. The Firebase Extension processes the document and sends the email
4. On success or failure, the extension updates the `invites` document with the appropriate `emailSentStatus`

### Invitation Acceptance Logic
1. Tenant clicks the link in the email
2. PropAgentic app validates the invitation ID
3. After authentication, `inviteService.updateInviteStatus()` is called with `status: 'accepted'`
4. User profile is updated with property association

## Conclusion

The tenant invitation system provides a streamlined way for landlords to bring tenants onto the PropAgentic platform. Follow this guide to ensure successful tenant onboarding, and refer to the troubleshooting section if you encounter any issues. 