# Validation Helper Functions Documentation

## Overview

This document provides a comprehensive guide to the data validation helper functions used in PropAgentic's Firestore security rules. These functions ensure data integrity, enforce business rules, and maintain a consistent data model throughout the application.

## Importance of Validation Helper Functions

Data validation functions serve several critical purposes in our security architecture:

1. **Data Integrity**: They ensure all required fields are present and properly formatted
2. **Security Enforcement**: They prevent unauthorized operations or state transitions
3. **Business Logic**: They enforce business rules at the database level
4. **Consistency**: They maintain a consistent data model by validating fields and values
5. **Defensive Coding**: They provide defense in depth against client-side validation bypasses

By centralizing validation logic in helper functions, we achieve:
- Consistent validation across similar operations
- Improved code readability and maintainability
- Easier updates when business rules change
- Clear documentation of data requirements

## Core Validation Functions

### Basic Data Validation

#### `isValidEmail(email)`

Validates that a string is a properly formatted email address.

```javascript
function isValidEmail(email) {
  return email is string && email.matches('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,4}$');
}
```

- **Purpose**: Ensures email addresses conform to a standard format
- **Fields Validated**: Any email field (tenant emails, user emails, newsletter subscriptions)
- **Security Importance**: Prevents malformed data and potential injection attacks
- **Pattern Components**:
  - Local part: Letters, numbers, and common special characters
  - Domain: Letters, numbers, hyphens, and periods
  - TLD: 2-4 letter top-level domain

### Property Management Validation

#### `isValidPropertyCreate()`

Validates that a property creation request contains all required fields and is made by an authorized landlord.

```javascript
function isValidPropertyCreate() {
  let data = request.resource.data;
  return isLandlord() &&
         data.landlordId == request.auth.uid &&
         data.keys().hasAll(['landlordId', 'streetAddress', 'city', 'state', 'zipCode', 'propertyType']);
}
```

- **Purpose**: Ensures properties are created with complete and accurate information
- **Required Fields**:
  - `landlordId`: Must match the authenticated user's ID
  - `streetAddress`: Street address of the property
  - `city`: City where the property is located
  - `state`: State/province where the property is located
  - `zipCode`: Postal/ZIP code of the property
  - `propertyType`: Type of property (e.g., 'apartment', 'house', 'condo')
- **Security Checks**:
  - Verifies the user has a landlord role
  - Ensures the landlordId matches the authenticated user
- **Business Logic**: Properties must have a valid address and type

### Tenant Invitation System Validation

#### `isValidInviteCreate()`

Validates that an invite creation request contains all required fields and is made by an authorized landlord.

```javascript
function isValidInviteCreate() {
  let data = request.resource.data;
  return isLandlord() &&
         data.landlordId == request.auth.uid &&
         isPropertyOwner(data.propertyId) &&
         isValidEmail(data.tenantEmail) &&
         data.status == 'pending' &&
         data.createdAt == request.time &&
         data.keys().hasAll(['landlordId', 'propertyId', 'tenantEmail', 'status', 'createdAt']);
}
```

- **Purpose**: Ensures tenant invitations are created with proper authorization and data
- **Required Fields**:
  - `landlordId`: Must match the authenticated user's ID
  - `propertyId`: Must be a property owned by the landlord
  - `tenantEmail`: Must be a valid email format
  - `status`: Must be 'pending' for new invites
  - `createdAt`: Must be the current server timestamp
- **Security Checks**:
  - Verifies the user has a landlord role
  - Ensures the landlordId matches the authenticated user
  - Confirms the landlord owns the specified property
  - Validates the tenant email format
- **State Machine**: Enforces the initial 'pending' state for the invite lifecycle

#### `isValidInviteUpdate()`

Validates that an invite update operation is authorized and contains valid changes based on the user's role.

```javascript
function isValidInviteUpdate() {
  let data = request.resource.data;
  let existingData = resource.data;
  // Tenant accepting the invite
  return (isTenant() && 
          data.status == 'accepted' && 
          data.tenantId == request.auth.uid &&
          existingData.tenantEmail == getUserData().email) ||
         // Landlord revoking the invite
         (isLandlord() &&
          isPropertyOwner(existingData.propertyId) &&
          data.status == 'revoked');
}
```

- **Purpose**: Enforces the invite lifecycle state transitions and authorization
- **State Transitions**:
  1. Tenant acceptance: 'pending' → 'accepted'
  2. Landlord revocation: 'pending' → 'revoked'
- **Role-Based Validations**:
  - **Tenant acceptance**:
    - Requires tenant role
    - Status must change to 'accepted'
    - Tenant ID must match authenticated user
    - Invite's email must match tenant's email
  - **Landlord revocation**:
    - Requires landlord role
    - Landlord must own the property in the invite
    - Status must change to 'revoked'
- **Security Importance**: Prevents unauthorized status changes and enforces proper state transitions

### Maintenance System Validation

#### `isValidTicketCreate()`

Validates that a maintenance ticket creation request contains all required fields and is made by a tenant associated with the specified property.

```javascript
function isValidTicketCreate() {
  let data = request.resource.data;
  return isTenant() &&
         data.submittedBy == request.auth.uid &&
         isPropertyTenant(data.propertyId) &&
         data.keys().hasAll(['submittedBy', 'propertyId', 'category', 'description', 'priority']);
}
```

- **Purpose**: Ensures maintenance tickets are created with complete information and proper authorization
- **Required Fields**:
  - `submittedBy`: User ID of the tenant (must match authenticated user)
  - `propertyId`: ID of the property (tenant must be associated with it)
  - `category`: Type of maintenance issue (e.g., 'plumbing', 'electrical')
  - `description`: Detailed description of the maintenance issue
  - `priority`: Urgency level (e.g., 'low', 'medium', 'high', 'emergency')
- **Security Checks**:
  - Verifies the user has a tenant role
  - Ensures the submittedBy field matches the authenticated user
  - Confirms the tenant is associated with the property
- **Business Logic**: Maintenance tickets must have a category, description, and priority level

### Pre-Launch Features Validation

#### `isValidWaitlistEntry()`

Validates that a waitlist entry contains all required fields with appropriate values.

```javascript
function isValidWaitlistEntry() {
  let data = request.resource.data;
  return data.keys().hasAll(['email', 'role', 'timestamp']) &&
         isValidEmail(data.email) &&
         data.role in ['landlord', 'tenant', 'contractor', 'propertyManager'];
}
```

- **Purpose**: Ensures waitlist entries contain valid and complete information
- **Required Fields**:
  - `email`: User's email address (must be valid format)
  - `role`: User's intended role in the system
  - `timestamp`: When the waitlist entry was created
- **Allowed Role Values**:
  - 'landlord': Property owner
  - 'tenant': Property renter
  - 'contractor': Maintenance service provider
  - 'propertyManager': Manager of properties on behalf of landlords
- **Security Importance**: Prevents creation of waitlist entries with invalid roles or missing data

#### `isValidNewsletterEntry()`

Validates that a newsletter subscription entry contains all required fields with appropriate values.

```javascript
function isValidNewsletterEntry() {
  let data = request.resource.data;
  return data.keys().hasAll(['email', 'status']) &&
         isValidEmail(data.email) &&
         data.status in ['active', 'unsubscribed', 'bounced'];
}
```

- **Purpose**: Ensures newsletter subscriptions contain valid and complete information
- **Required Fields**:
  - `email`: Subscriber's email address (must be valid format)
  - `status`: Current subscription status
- **Allowed Status Values**:
  - 'active': Currently subscribed and receiving newsletters
  - 'unsubscribed': Opted out of receiving newsletters
  - 'bounced': Email address has bounced and is no longer receiving newsletters
- **Security Importance**: Prevents creation of newsletter entries with invalid status or missing data

## Best Practices for Using Validation Helpers

1. **Combine with Role Checks**: Pair validation helpers with role-based helpers for defense in depth
2. **Validate at Both Client and Server**: Use these server-side validations as a backup to client-side validation
3. **Keep Validation Rules Current**: Update validation helpers when data models or business rules change
4. **Handle Edge Cases**: Explicitly document and handle edge cases in validation logic
5. **Test Thoroughly**: Create comprehensive test cases for validation functions

## Validation Strategy

### Multi-Layer Approach

Our validation strategy employs multiple layers of checks:

1. **Role Verification**: Ensures the user has the appropriate role for the operation
2. **Ownership Verification**: Confirms the user owns or is associated with the relevant resources
3. **Field Presence**: Checks that all required fields are present
4. **Field Format**: Validates that field values meet format requirements
5. **Field Values**: Ensures values are within allowed sets or ranges
6. **State Transitions**: Enforces proper state machine transitions

### Field-Level vs. Operation-Level Validation

We use two complementary approaches:

- **Field-Level Validation**: Functions like `isValidEmail()` that validate individual fields
- **Operation-Level Validation**: Functions like `isValidInviteCreate()` that validate entire operations

## Conclusion

Data validation helper functions form a critical part of PropAgentic's security and data integrity model. They ensure that all data stored in Firestore adheres to our application's business rules, security requirements, and data model specifications. By centralizing validation logic in helper functions, we make our codebase more maintainable, our security rules more consistent, and our data model more robust. 