# PropAgentic Tenant Portal - Product Requirements Document

## Overview
PropAgentic's Tenant Portal empowers renters with a single, secure place to manage their tenancy. It provides easy property onboarding via invitations, simple maintenance request submission, real‑time notifications, and access to relevant documents. The portal bridges communication between tenants, landlords, and property managers while integrating AI to improve maintenance reporting quality.

## Core Features

### 1. Property Invitation Flow
- **What**: Tenants receive email invitations or invite codes to join a property.
- **Why**: Ensures only authorized tenants access specific properties and automates onboarding.
- **How**: Firestore `invites` collection with Cloud Functions to send/accept invites and update tenant profiles.

### 2. Tenant Dashboard
- **What**: Central hub showing property details, pending invites, and maintenance history.
- **Why**: Gives tenants a clear overview of their residence and open issues.
- **How**: React page pulling data from `properties`, `tickets`, and `tenantProfiles` collections.

### 3. Maintenance Request System
- **What**: Form to submit issues with photo uploads and AI‑powered classification.
- **Why**: Streamlines reporting and ensures landlords receive quality information.
- **How**: Frontend form posts to `tickets` collection; Cloud Function `classifyMaintenanceRequest` enriches data with GPT‑4.

### 4. Communication & Notifications
- **What**: In‑app and email notifications for invite status, ticket updates, and landlord messages.
- **Why**: Keeps tenants informed of property activities and responses.
- **How**: Firestore triggers create notifications documents and send emails via the notifications system.

### 5. Document Access & Rent Payments (Future)
- **What**: View lease documents and pay rent online.
- **Why**: Centralizes all tenant interactions within PropAgentic.
- **How**: Documents stored in Firestore/Storage; payments processed via Stripe (planned).

## User Experience

### Tenant Persona: Taylor
- Receives an invitation email from their landlord.
- Creates an account, accepts the invite, and lands on the dashboard.
- Submits a maintenance request with photos; AI asks follow‑up questions.
- Gets notified when the landlord responds or marks the request complete.
- Later accesses lease documents and payment options from the same portal.

### UI/UX Considerations
- Clear pending invite banner with Accept/Decline actions.
- Simple maintenance form with drag‑and‑drop photo upload.
- Mobile‑first design with Tailwind components.

## Technical Architecture

### System Components
- **Frontend**: React (TypeScript) pages in `src/pages/tenant/` and components in `src/components/tenant/`.
- **Backend**: Firebase Authentication, Firestore, Cloud Functions, and Storage.
- **AI Integration**: OpenAI GPT‑4 via `classifyMaintenanceRequest` function and future conversation engine.
- **Notifications**: Firestore triggers (`notificationTriggers.js`) and email extension for alerts.

### Data Models

#### 1. Invite – `invites/{inviteId}`
```typescript
interface Invite {
  propertyId: string;
  landlordId: string;
  tenantEmail: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  unitNumber?: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
}
```

#### 2. Ticket – `tickets/{ticketId}`
```typescript
interface Ticket {
  propertyId: string;
  tenantId: string;
  description: string;
  status: 'new' | 'inProgress' | 'resolved';
  photos: string[];
  createdAt: Timestamp;
}
```

#### 3. TenantProfile – `tenantProfiles/{tenantId}`
Links tenants to properties and units.

### APIs and Integrations
- `sendPropertyInvite` & `acceptPropertyInvite` callable functions.
- `classifyMaintenanceRequest` callable function for AI enrichment.
- Planned functions for push notifications and rent payments.
- Firestore security rules enforcing tenant access to their invites, tickets, and property data.

## Development Roadmap

### Phase 1 – Invitation & Dashboard MVP
- Invitation acceptance page (`pages/tenant/AcceptInvitePage.tsx`).
- Tenant dashboard showing pending invites and property info.
- Basic maintenance request form with photo upload.
- Security rules for invites and tickets.

### Phase 2 – AI Maintenance Assistance
- Integrate OpenAI follow‑up chat (`components/tenant/AIMaintenanceChat.tsx`).
- Store conversation history in `aiConversations` collection.
- Enhanced classification logic in backend functions.

### Phase 3 – Notifications & Documents
- Real‑time notifications via FCM and email.
- Document center for lease files in Storage.
- Future Stripe integration for rent payments.

## Logical Dependency Chain
1. Firestore schemas and security rules.
2. Invitation flow (send → accept → property association).
3. Tenant dashboard and maintenance request submission.
4. AI enhancements and conversation storage.
5. Notifications, documents, and payments.

## Risks and Mitigations
- **Security**: Incorrect rules could expose data → thorough rules unit tests.
- **AI Costs**: GPT‑4 usage may be expensive → implement rate limiting.
- **User Adoption**: Tenants may ignore invites → reminder emails and clear onboarding.
- **Scalability**: High photo upload volume → leverage Firebase Storage with compression.

## Appendix
- Reference docs: `TASK_MASTER_TENANT_PORTAL_MVP.md`, `TENANT-INVITATION-PROCESS.md`, backend implementation notes. 