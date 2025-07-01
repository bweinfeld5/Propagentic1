# Firebase Functions Implementation Guide

## Table of Contents
- [Overview](#overview)
- [Function Architecture](#function-architecture)
- [Development Setup](#development-setup)
- [Function Categories](#function-categories)
- [Error Handling](#error-handling)
- [Testing](#testing)
- [Deployment](#deployment)
- [Monitoring](#monitoring)

## Overview

Propagentic uses Firebase Functions for serverless backend operations. Functions are organized by domain and functionality, providing a scalable architecture for property management operations.

### Function Types
- **Callable HTTPS Functions**: Direct client-to-function calls with automatic authentication
- **HTTP Functions**: RESTful endpoints with manual CORS handling
- **Firestore Triggers**: Automatic responses to database changes
- **Authentication Triggers**: User lifecycle event handlers

## Function Architecture

### Directory Structure
```
functions/
├── src/                    # TypeScript source files
│   ├── userRelationships.ts
│   ├── inviteCode.ts
│   ├── invites.ts
│   └── index.ts
├── lib/                    # Compiled JavaScript
├── index.js               # Main exports file
└── package.json           # Dependencies
```

### Core Dependencies
```json
{
  "firebase-admin": "^13.4.0",
  "firebase-functions": "^6.3.2",
  "@sendgrid/mail": "^8.1.5",
  "cors": "^2.8.5"
}
```

## Development Setup

### Prerequisites
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Set project
firebase use your-project-id
```

### Local Development
```bash
# Navigate to functions directory
cd functions

# Install dependencies
npm install

# Start emulator
firebase emulators:start --only functions,firestore,auth

# Test functions locally
firebase functions:shell
```

### Environment Variables
```bash
# functions/.env
SENDGRID_API_KEY=your_sendgrid_key
SENDGRID_VERIFIED_SENDER=your_verified_email
```

## Function Categories

### 1. User Relationships (`userRelationships.ts`)

#### sendPropertyInvite
**Purpose**: Send invitation to join a property
**Type**: Callable HTTPS Function
**Authentication**: Required

```typescript
interface SendPropertyInviteData {
  inviteeEmail: string;
  propertyId: string;
  role: 'tenant' | 'contractor';
  message?: string;
}

interface SendPropertyInviteResult {
  success: boolean;
  inviteId: string;
  message: string;
}
```

**Implementation Notes**:
- Validates inviter permissions
- Creates invite document in Firestore
- Sends email via SendGrid
- Sets expiration time (default: 7 days)

**Error Scenarios**:
- Invalid property ID
- User already invited
- Insufficient permissions
- Email sending failure

#### acceptPropertyInvite
**Purpose**: Accept a property invitation
**Type**: Callable HTTPS Function
**Authentication**: Required

```typescript
interface AcceptPropertyInviteData {
  inviteId: string;
}

interface AcceptPropertyInviteResult {
  success: boolean;
  propertyId: string;
  role: string;
}
```

**Implementation Flow**:
1. Validate invite exists and is pending
2. Check invite hasn't expired
3. Add user to property
4. Update invite status
5. Create notification

#### rejectPropertyInvite
**Purpose**: Reject a property invitation
**Type**: Callable HTTPS Function
**Authentication**: Required

```typescript
interface RejectPropertyInviteData {
  inviteId: string;
  reason?: string;
}
```

### 2. Invite Codes (`inviteCode.ts`)

#### generateInviteCode
**Purpose**: Generate unique invite code for property access
**Type**: Callable HTTPS Function
**Authentication**: Required

```typescript
interface GenerateInviteCodeData {
  propertyId: string;
  expiresIn?: number; // milliseconds
  maxUses?: number;
}

interface GenerateInviteCodeResult {
  success: boolean;
  inviteCode: string;
  expiresAt: Date;
}
```

**Code Generation Logic**:
- 8-character alphanumeric code
- Collision detection and retry
- Configurable expiration
- Usage tracking

### 3. Email Services (`invites.ts`)

#### sendInviteEmail
**Purpose**: Send invitation emails using SendGrid
**Type**: Callable HTTPS Function
**Authentication**: Required

```typescript
interface SendInviteEmailData {
  to: string;
  inviteType: 'property' | 'contractor';
  templateData: {
    propertyName: string;
    inviterName: string;
    inviteLink: string;
  };
}
```

**Email Templates**:
- Property tenant invitation
- Contractor rolodex invitation
- Invite reminder emails

### 4. Tenant Management (`index.ts`)

#### acceptTenantInvite
**Purpose**: Accept tenant invitation with profile creation
**Type**: HTTP Function with CORS
**Authentication**: Optional (creates account)

```typescript
interface AcceptTenantInviteData {
  inviteCode: string;
  tenantData: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
}
```

**CORS Configuration**:
```typescript
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://your-domain.com'
  ],
  credentials: true
};
```

### 5. Contractor Management

#### assignContractorToRequest
**Purpose**: Assign contractor to maintenance request
**Type**: Callable HTTPS Function
**Authentication**: Required (landlord only)

```typescript
interface AssignContractorData {
  requestId: string;
  contractorId: string;
  estimatedCost?: number;
  notes?: string;
}
```

#### updateContractorJobStatus
**Purpose**: Update job status and progress
**Type**: Callable HTTPS Function
**Authentication**: Required (contractor only)

```typescript
interface UpdateJobStatusData {
  jobId: string;
  status: 'assigned' | 'in-progress' | 'completed' | 'cancelled';
  notes?: string;
  completionImages?: string[];
}
```

### 6. Notification Triggers (`inviteTriggers.ts`)

#### createNotificationOnInvite
**Purpose**: Auto-create notifications when invites are created
**Type**: Firestore Trigger
**Trigger**: `invites/{inviteId}` onCreate

```typescript
// Triggered when new invite document is created
exports.createNotificationOnInvite = functions.firestore
  .document('invites/{inviteId}')
  .onCreate(async (snap, context) => {
    const invite = snap.data();
    // Create notification document
    // Send push notification if enabled
  });
```

### 7. User Management

#### setUserClaims
**Purpose**: Set custom user claims for Firestore rules
**Type**: Callable HTTPS Function
**Authentication**: Required (admin or self)

```typescript
interface SetUserClaimsData {
  uid: string;
  userType: 'landlord' | 'tenant' | 'contractor' | 'admin';
}
```

**Security Rules Integration**:
```javascript
// Firestore rules can check custom claims
allow read, write: if request.auth.token.userType == 'landlord';
```

## Error Handling

### Standard Error Response
```typescript
interface FunctionError {
  code: 'unauthenticated' | 'permission-denied' | 'invalid-argument' | 
        'not-found' | 'already-exists' | 'resource-exhausted' | 'internal';
  message: string;
  details?: any;
}
```

### Error Handling Pattern
```typescript
export const exampleFunction = functions.https.onCall(async (data, context) => {
  try {
    // Validate authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    // Validate input
    if (!data.requiredField) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing required field'
      );
    }

    // Business logic
    const result = await performOperation(data);
    
    return { success: true, data: result };
    
  } catch (error) {
    console.error('Function error:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error; // Re-throw known errors
    }
    
    // Handle unexpected errors
    throw new functions.https.HttpsError(
      'internal',
      'An unexpected error occurred'
    );
  }
});
```

### Logging Best Practices
```typescript
// Structured logging
console.log('Function started', {
  functionName: 'sendPropertyInvite',
  userId: context.auth?.uid,
  timestamp: new Date().toISOString()
});

// Error logging
console.error('Operation failed', {
  error: error.message,
  stack: error.stack,
  userId: context.auth?.uid,
  data: JSON.stringify(data)
});
```

## Testing

### Unit Testing Setup
```bash
# Install testing dependencies
npm install --save-dev @firebase/rules-unit-testing
npm install --save-dev jest
```

### Test Structure
```typescript
// functions/test/userRelationships.test.js
const test = require('firebase-functions-test')();

describe('sendPropertyInvite', () => {
  let wrapped;
  
  beforeAll(() => {
    wrapped = test.wrap(myFunctions.sendPropertyInvite);
  });
  
  afterAll(() => {
    test.cleanup();
  });
  
  it('should send invite email', async () => {
    const data = {
      inviteeEmail: 'test@example.com',
      propertyId: 'prop123',
      role: 'tenant'
    };
    
    const context = {
      auth: { uid: 'landlord123' }
    };
    
    const result = await wrapped(data, context);
    expect(result.success).toBe(true);
  });
});
```

### Integration Testing
```bash
# Start emulators
firebase emulators:start --only functions,firestore,auth

# Run tests against emulators
npm test
```

## Deployment

### Development Deployment
```bash
# Deploy all functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:sendPropertyInvite

# Deploy with environment variables
firebase functions:config:set sendgrid.api_key="your_key"
firebase deploy --only functions
```

### Production Deployment
```bash
# Set production environment
firebase use production

# Deploy with confirmation
firebase deploy --only functions --force

# Verify deployment
firebase functions:log
```

### Environment-Specific Configuration
```typescript
// Use different configs per environment
const config = functions.config();
const sendGridApiKey = config.sendgrid?.api_key || process.env.SENDGRID_API_KEY;
```

## Monitoring

### Cloud Logging
```bash
# View function logs
firebase functions:log

# View specific function logs
firebase functions:log --only sendPropertyInvite

# Real-time logs
firebase functions:log --follow
```

### Performance Monitoring
```typescript
// Add performance tracking
const { performance } = require('perf_hooks');

export const monitoredFunction = functions.https.onCall(async (data, context) => {
  const startTime = performance.now();
  
  try {
    const result = await performOperation(data);
    
    const duration = performance.now() - startTime;
    console.log('Function performance', {
      functionName: 'monitoredFunction',
      duration: `${duration}ms`,
      success: true
    });
    
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    console.error('Function performance', {
      functionName: 'monitoredFunction',
      duration: `${duration}ms`,
      success: false,
      error: error.message
    });
    throw error;
  }
});
```

### Alerts and Notifications
```bash
# Set up Cloud Monitoring alerts for:
# - Function execution errors
# - High latency (>5s)
# - Memory usage spikes
# - Cold start frequency
```

## Security Best Practices

### Authentication Validation
```typescript
// Always validate authentication
if (!context.auth) {
  throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
}

// Validate user permissions
const userDoc = await admin.firestore()
  .collection('users')
  .doc(context.auth.uid)
  .get();
  
if (!userDoc.exists) {
  throw new functions.https.HttpsError('not-found', 'User profile not found');
}
```

### Input Validation
```typescript
// Validate required fields
const requiredFields = ['propertyId', 'inviteeEmail'];
for (const field of requiredFields) {
  if (!data[field]) {
    throw new functions.https.HttpsError(
      'invalid-argument', 
      `Missing required field: ${field}`
    );
  }
}

// Sanitize email input
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(data.inviteeEmail)) {
  throw new functions.https.HttpsError('invalid-argument', 'Invalid email format');
}
```

### CORS Configuration
```typescript
// Strict CORS for production
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://your-production-domain.com',
      'https://your-staging-domain.com'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};
```

---

**Firebase Functions Guide Version**: 2.0  
**Last Updated**: January 2025  
**Maintainer**: Development Team

**Related Documentation**:
- [API Documentation](API_DOCUMENTATION.md)
- [Authentication Guide](AUTHENTICATION_GUIDE.md)
- [Error Handling Guide](ERROR_HANDLING.md) 