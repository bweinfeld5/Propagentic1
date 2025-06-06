# Tenant Invitation System Documentation

## Overview

The PropAgentic tenant invitation system allows landlords to create unique invite codes that tenants can use to join properties. This system ensures secure tenant onboarding with optional unit assignment and email restrictions.

## System Architecture

The invitation system consists of three main components:

1. **Cloud Functions**: Backend Firebase functions that handle code generation, validation, and redemption
2. **Client Services**: Frontend services that interact with the Cloud Functions
3. **UI Components**: Forms and interfaces for landlords to create codes and tenants to redeem them

## Invitation Flow

1. Landlord generates an invite code for a property (optionally restricted to a specific unit or email)
2. System creates a unique code and stores it in the `inviteCodes` collection
3. Landlord shares the code with the tenant (via email, text, etc.)
4. Tenant enters the code during registration or in their dashboard
5. System validates the code and creates a tenant-property relationship
6. Tenant gains access to the property in the application

## Data Models

### Invite Code

```typescript
interface InviteCode {
  id: string;               // Unique identifier
  code: string;             // The actual code (alphanumeric)
  landlordId: string;       // Reference to landlord who created code
  propertyId: string;       // Property this code is for
  propertyName?: string;    // Property name for display purposes
  unitId?: string;          // Optional specific unit reference
  email?: string;           // Optional pre-assigned email
  status: 'active' | 'used' | 'expired' | 'revoked';
  createdAt: Timestamp;     // When code was created
  expiresAt: Timestamp;     // When code expires
  usedAt?: Timestamp;       // When code was used (if used)
  usedBy?: string;          // Tenant ID who used the code (if used)
}
```

### Property-Tenant Relationship

```typescript
interface PropertyTenantRelationship {
  id: string;
  propertyId: string;
  tenantId: string;
  unitId?: string;
  status: 'active' | 'pending' | 'archived';
  inviteCodeId: string;
  startDate: Timestamp;
  endDate?: Timestamp;
}
```

## Cloud Functions

### generateInviteCode

Allows landlords to create invite codes for their properties.

**Input Parameters**:
- `propertyId`: ID of the property
- `unitId` (optional): Specific unit in the property
- `email` (optional): Restrict code to a specific email
- `expirationDays` (optional): Days until code expires (default: 7)

**Response**:
- Success object with the generated invite code

### validateInviteCode

Validates an invite code without redeeming it.

**Input Parameters**:
- `code`: The invite code to validate

**Response**:
- Validation result with property information

### redeemInviteCode

Redeems an invite code and creates a tenant-property relationship.

**Input Parameters**:
- `code`: The invite code to redeem

**Response**:
- Redemption result with property information and relationship ID

## Client Services

The `inviteCodeService.ts` provides frontend methods to interact with these functions:

- `validateInviteCode(code)`: Validates a code
- `redeemInviteCode(code, tenantId)`: Redeems a code
- `createInviteCode(...)`: Creates a new code client-side (landlord-only)
- `getLandlordInviteCodes(landlordId)`: Gets all codes created by a landlord
- `getPropertyInviteCodes(propertyId)`: Gets all codes for a property
- `updateInviteCode(...)`: Updates a code's status or expiration
- `revokeInviteCode(inviteCodeId)`: Revokes a code
- `generateBulkInviteCodes(...)`: Creates multiple codes at once

## Testing

### Prerequisites

1. Firebase project with Cloud Functions deployed
2. Test tenant account
3. Valid invite code to test

### Testing with the Script

We've created a test script that allows you to verify the invite code redemption process:

```bash
node scripts/test-invite-code-redemption.js <email> <password> <inviteCode>
```

Where:
- `<email>` is the tenant's email address
- `<password>` is the tenant's password
- `<inviteCode>` is the invite code to redeem

### Manual Testing Steps

1. **Landlord creates an invite code**:
   - Log in as a landlord
   - Navigate to property management
   - Generate a new invite code for a property

2. **Tenant redeems the code**:
   - Log in as a tenant
   - Navigate to "Join Property" or similar section
   - Enter the invite code
   - Verify that tenant now has access to the property

3. **Verify database records**:
   - Check the invite code status is updated to 'used'
   - Confirm a property-tenant relationship was created
   - Verify tenant profile shows the new property
   - Verify property record includes the tenant

## Security Rules

Ensure your Firestore security rules properly protect these collections:

```
// Allow landlords to read/write invite codes they created
match /inviteCodes/{codeId} {
  allow read: if request.auth != null && (
    resource.data.landlordId == request.auth.uid ||
    resource.data.usedBy == request.auth.uid
  );
  allow create: if request.auth != null && 
    request.resource.data.landlordId == request.auth.uid;
  allow update: if request.auth != null && (
    resource.data.landlordId == request.auth.uid ||
    // Only allow tenants to update a code if they're the assigned user and only updating status to 'used'
    (resource.data.email == request.auth.token.email && 
     request.resource.data.status == 'used')
  );
}

// Allow tenants to read their relationships, landlords to read/write for their properties
match /propertyTenantRelationships/{relationshipId} {
  allow read: if request.auth != null && (
    resource.data.tenantId == request.auth.uid ||
    exists(/databases/$(database)/documents/properties/$(resource.data.propertyId)) &&
    get(/databases/$(database)/documents/properties/$(resource.data.propertyId)).data.ownerId == request.auth.uid
  );
}
```

## Common Issues and Troubleshooting

1. **Code already used**: Check if the code has already been redeemed
2. **Code expired**: Verify the code's expiration date
3. **Email restriction mismatch**: Ensure the tenant is using the same email the code is restricted to
4. **Property not found**: Confirm the property still exists in the system
5. **Permission denied**: Verify the user has the right role/permissions

## Future Enhancements

1. Bulk code generation for multiple units
2. QR code generation for physical distribution
3. Automatic email delivery of invite codes
4. Custom branding/messaging for invite emails
5. Analytics on code usage and conversion rates 