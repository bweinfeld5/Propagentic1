# Propagentic API Documentation

## Table of Contents
- [Authentication](#authentication)
- [Firebase Functions API](#firebase-functions-api)
- [Client Services API](#client-services-api)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

## Authentication

Propagentic uses Firebase Authentication for secure API access. All API calls require a valid Firebase ID token.

### Authentication Headers
```
Authorization: Bearer <firebase-id-token>
```

### User Types
- `landlord` - Property owners and managers
- `tenant` - Property renters  
- `contractor` - Service providers
- `admin` - System administrators

## Firebase Functions API

### User Relationships & Invitations

#### Send Property Invite
**Function**: `sendPropertyInvite`
**Type**: Callable HTTPS Function
**Description**: Sends an invitation to a user to join a property

```javascript
const sendPropertyInvite = httpsCallable(functions, 'sendPropertyInvite');
const result = await sendPropertyInvite({
  inviteeEmail: 'tenant@example.com',
  propertyId: 'property123',
  role: 'tenant',
  message: 'Welcome to your new rental!'
});
```

#### Accept Property Invite
**Function**: `acceptPropertyInvite`
**Type**: Callable HTTPS Function
**Description**: Accepts a property invitation

```javascript
const acceptPropertyInvite = httpsCallable(functions, 'acceptPropertyInvite');
const result = await acceptPropertyInvite({
  inviteId: 'invite123'
});
```

#### Reject Property Invite
**Function**: `rejectPropertyInvite`
**Type**: Callable HTTPS Function
**Description**: Rejects a property invitation

```javascript
const rejectPropertyInvite = httpsCallable(functions, 'rejectPropertyInvite');
const result = await rejectPropertyInvite({
  inviteId: 'invite123',
  reason: 'Not interested'
});
```

### Contractor Management

#### Add Contractor to Rolodex
**Function**: `addContractorToRolodex`
**Type**: Callable HTTPS Function
**Description**: Adds a contractor to a landlord's rolodex

```javascript
const addContractorToRolodex = httpsCallable(functions, 'addContractorToRolodex');
const result = await addContractorToRolodex({
  contractorId: 'contractor123',
  landlordId: 'landlord456'
});
```

#### Assign Contractor to Request
**Function**: `assignContractorToRequest`
**Type**: Callable HTTPS Function
**Description**: Assigns a contractor to a maintenance request

```javascript
const assignContractorToRequest = httpsCallable(functions, 'assignContractorToRequest');
const result = await assignContractorToRequest({
  requestId: 'request123',
  contractorId: 'contractor456'
});
```

#### Update Contractor Job Status
**Function**: `updateContractorJobStatus`
**Type**: Callable HTTPS Function
**Description**: Updates the status of a contractor's job

```javascript
const updateContractorJobStatus = httpsCallable(functions, 'updateContractorJobStatus');
const result = await updateContractorJobStatus({
  jobId: 'job123',
  status: 'completed',
  notes: 'All work completed successfully'
});
```

### Email & Communication

#### Send Invite Email
**Function**: `sendInviteEmail`
**Type**: Callable HTTPS Function  
**Description**: Sends an invitation email using SendGrid

```javascript
const sendInviteEmail = httpsCallable(functions, 'sendInviteEmail');
const result = await sendInviteEmail({
  to: 'user@example.com',
  inviteType: 'property',
  templateData: {
    propertyName: 'Sunset Apartments',
    inviterName: 'John Doe'
  }
});
```

### Invite Codes

#### Generate Invite Code
**Function**: `generateInviteCode`
**Type**: Callable HTTPS Function
**Description**: Generates a unique invite code for property access

```javascript
const generateInviteCode = httpsCallable(functions, 'generateInviteCode');
const result = await generateInviteCode({
  propertyId: 'property123',
  expiresIn: 86400000 // 24 hours in milliseconds
});
```

### Tenant Management

#### Accept Tenant Invite
**Function**: `acceptTenantInvite`
**Type**: HTTP Function with CORS
**Description**: Accepts a tenant invitation (supports both callable and HTTP requests)

```javascript
// As callable function
const acceptTenantInvite = httpsCallable(functions, 'acceptTenantInvite');
const result = await acceptTenantInvite({
  inviteCode: 'abc123',
  tenantData: {
    firstName: 'Jane',
    lastName: 'Doe',
    phone: '+1234567890'
  }
});

// As HTTP request
const response = await fetch('https://us-central1-project.cloudfunctions.net/acceptTenantInvite', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + idToken
  },
  body: JSON.stringify({
    inviteCode: 'abc123',
    tenantData: { ... }
  })
});
```

### Notifications

#### Create Notification on Invite
**Function**: `createNotificationOnInvite`
**Type**: Firestore Trigger
**Description**: Automatically creates notifications when invites are created

### User Management

#### Set User Claims
**Function**: `setUserClaims`
**Type**: Callable HTTPS Function
**Description**: Sets custom user claims for Firestore security rules

```javascript
const setUserClaims = httpsCallable(functions, 'setUserClaims');
const result = await setUserClaims({
  uid: 'user123',
  userType: 'landlord'
});
```

### Utility Functions

#### Ping
**Function**: `ping`
**Type**: Callable HTTPS Function
**Description**: Health check function

```javascript
const ping = httpsCallable(functions, 'ping');
const result = await ping();
// Returns: { message: "pong", timestamp: 1234567890 }
```

#### Test SendGrid
**Function**: `testSendGrid`
**Type**: Callable HTTPS Function
**Description**: Tests SendGrid email functionality

```javascript
const testSendGrid = httpsCallable(functions, 'testSendGrid');
const result = await testSendGrid();
```

## Client Services API

### Core Services

#### Data Service (`dataService.js`)
**File**: `src/services/dataService.js`
**Description**: Core data operations for all entities

**Key Methods**:
- `fetchUserProfile(uid)` - Get user profile data
- `updateUserProfile(uid, data)` - Update user profile  
- `fetchProperties(userId)` - Get user's properties
- `createProperty(propertyData)` - Create new property
- `updateProperty(propertyId, data)` - Update property
- `deleteProperty(propertyId)` - Delete property

#### Property Service (`propertyService.js`)
**File**: `src/services/propertyService.js`
**Description**: Property-specific operations

**Key Methods**:
- `getPropertyDetails(propertyId)` - Get detailed property info
- `getPropertiesByLandlord(landlordId)` - Get landlord's properties
- `addTenantToProperty(propertyId, tenantData)` - Add tenant
- `removeTenantFromProperty(propertyId, tenantId)` - Remove tenant

#### Tenant Service (`tenantService.ts`)
**File**: `src/services/tenantService.ts`
**Description**: Tenant-specific operations and dashboard data

**Key Methods**:
- `getTenantDashboardData(tenantId)` - Get dashboard info
- `submitMaintenanceRequest(requestData)` - Submit request
- `getMaintenanceRequests(tenantId)` - Get tenant's requests
- `payRent(paymentData)` - Process rent payment

#### Contractor Service (`contractorService.js`)
**File**: `src/services/contractorService.js`
**Description**: Contractor operations and job management

**Key Methods**:
- `getAssignedJobs(contractorId)` - Get contractor's jobs
- `updateJobStatus(jobId, status)` - Update job status
- `submitJobEstimate(jobId, estimate)` - Submit estimate
- `uploadJobDocuments(jobId, files)` - Upload documents

### Specialized Services

#### Payment Service (`paymentService.ts`)
**File**: `src/services/paymentService.ts`
**Description**: Stripe payment integration

**Key Methods**:
- `createPaymentIntent(amount, currency)` - Create payment
- `confirmPayment(paymentIntentId)` - Confirm payment
- `createSubscription(customerId, priceId)` - Create subscription
- `createEscrowAccount(jobId, amount)` - Create escrow

#### Invite Code Service (`inviteCodeService.ts`)
**File**: `src/services/inviteCodeService.ts`
**Description**: Invite code management

**Key Methods**:
- `generateInviteCode(propertyId, options)` - Generate code
- `validateInviteCode(code)` - Validate code
- `redeemInviteCode(code, userData)` - Redeem code

#### Email Verification Service (`emailVerificationService.js`)
**File**: `src/services/emailVerificationService.js`
**Description**: Email verification workflows

**Key Methods**:
- `sendVerificationEmail(email)` - Send verification
- `verifyEmail(token)` - Verify email token
- `resendVerification(email)` - Resend verification

## Data Models

### User Model
```typescript
interface User {
  uid: string;
  email: string;
  userType: 'landlord' | 'tenant' | 'contractor' | 'admin';
  firstName: string;
  lastName: string;
  phone?: string;
  profileComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Property Model
```typescript
interface Property {
  id: string;
  landlordId: string;
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  units: PropertyUnit[];
  tenants: string[]; // tenant UIDs
  createdAt: Date;
  updatedAt: Date;
}
```

### Maintenance Request Model
```typescript
interface MaintenanceRequest {
  id: string;
  tenantId: string;
  propertyId: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'emergency';
  status: 'pending' | 'assigned' | 'in-progress' | 'completed' | 'cancelled';
  assignedContractorId?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Invite Model
```typescript
interface PropertyInvite {
  id: string;
  inviterId: string;
  inviteeEmail: string;
  propertyId: string;
  role: 'tenant' | 'contractor';
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  inviteCode?: string;
  message?: string;
  expiresAt: Date;
  createdAt: Date;
}
```

## Error Handling

### Standard Error Response
```typescript
interface APIError {
  code: string;
  message: string;
  details?: any;
}
```

### Common Error Codes
- `UNAUTHENTICATED` - User not authenticated
- `PERMISSION_DENIED` - Insufficient permissions
- `NOT_FOUND` - Resource not found  
- `INVALID_ARGUMENT` - Invalid request parameters
- `ALREADY_EXISTS` - Resource already exists
- `RESOURCE_EXHAUSTED` - Rate limit exceeded
- `INTERNAL` - Internal server error

### Error Handling Example
```javascript
try {
  const result = await apiFunction(data);
} catch (error) {
  switch (error.code) {
    case 'UNAUTHENTICATED':
      // Redirect to login
      break;
    case 'PERMISSION_DENIED':
      // Show permission error
      break;
    case 'NOT_FOUND':
      // Show not found message
      break;
    default:
      // Show generic error
      console.error('API Error:', error);
  }
}
```

## Rate Limiting

### Firebase Functions
- **Callable Functions**: Default Firebase quotas apply
- **HTTP Functions**: No built-in rate limiting
- **Trigger Functions**: Automatic scaling with Firebase quotas

### Recommended Client-Side Rate Limiting
```javascript
// Implement exponential backoff for retries
const retryWithBackoff = async (fn, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.code === 'RESOURCE_EXHAUSTED' && i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        continue;
      }
      throw error;
    }
  }
};
```

## Security Best Practices

### Authentication
- Always include Firebase ID token in requests
- Verify token server-side for sensitive operations
- Use custom claims for role-based access control

### Data Validation
- Validate all input parameters
- Sanitize user-provided content
- Use TypeScript for type safety

### Firestore Security
- Use security rules for data access control
- Implement field-level security where needed
- Audit security rules regularly

---

**API Documentation Version**: 2.0  
**Last Updated**: January 2025  
**Maintainer**: Development Team

For detailed implementation examples, see:
- [Firebase Functions Guide](FIREBASE_FUNCTIONS.md)
- [Authentication Guide](AUTHENTICATION_GUIDE.md)
- [Error Handling Guide](ERROR_HANDLING.md)
