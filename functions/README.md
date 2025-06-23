# Propagentic Firebase Cloud Functions

This directory contains all the Cloud Functions used by the Propagentic Property Management app.

## Best Practices Implementation Guide

### Performance Optimization

#### 1. Cold Start Optimization

```javascript
// Reuse expensive objects in global scope to avoid recreating on each invocation
const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");

// Initialize once in global scope
if (!admin.apps.length) {
  admin.initializeApp();
}

// Reuse DB references for common collections
const db = admin.firestore();
const usersCollection = db.collection("users");
const ticketsCollection = db.collection("tickets");

// Cache expensive operations
let expensiveCache;

exports.myFunction = functions.https.onCall((data, context) => {
  // Use the cached global variables inside function
  expensiveCache = expensiveCache || initializeExpensiveOperation();
  return doSomethingWithCache();
});
```

#### 2. Set Minimum Instances for Critical Functions

For latency-sensitive functions:

```javascript
exports.criticalFunction = functions.runWith({
  minInstances: 1,  // Keeps at least one instance warm
  maxInstances: 10, // Sets maximum scaling
  memory: '256MB'   // Allocate appropriate memory
}).https.onCall((data, context) => {
  // Function logic
});
```

#### 3. Lazy Initialization

```javascript
// Defer expensive operations until first usage
let expensiveModel;

function getExpensiveModel() {
  if (!expensiveModel) {
    expensiveModel = initializeExpensiveModel();
  }
  return expensiveModel;
}

exports.processData = functions.https.onCall((data, context) => {
  const model = getExpensiveModel();
  return model.process(data);
});
```

#### 4. Use onInit() for Expensive Initializations

```javascript
const { onInit } = require('firebase-functions/v2/core');
const { onRequest } = require('firebase-functions/v2/https');

// Expensive initialization code
let modelCache;

onInit(async () => {
  // This runs during cold start, not during deployment
  modelCache = await loadLargeModel();
  console.log("Initialization complete");
});

exports.processRequest = onRequest((req, res) => {
  res.send(modelCache.process(req.body));
});
```

### Code Correctness

#### 1. Ensure Idempotent Functions

```javascript
// Good - Idempotent function that won't create duplicate records
exports.createUser = functions.auth.user().onCreate(async (user) => {
  const userRef = db.collection('users').doc(user.uid);
  
  // Check if user document already exists
  const doc = await userRef.get();
  
  if (doc.exists) {
    console.log(`User ${user.uid} already exists, skipping creation`);
    return null;
  }
  
  // Create user document safely
  return userRef.set({
    email: user.email,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
});
```

#### 2. Clean Up Resources

```javascript
exports.processImage = functions.storage.object().onFinalize(async (object) => {
  // Create temp directory with unique name
  const tempDir = path.join(os.tmpdir(), uuid.v4());
  const tempFilePath = path.join(tempDir, 'image.jpg');
  
  try {
    // Process file
    await fs.promises.mkdir(tempDir, { recursive: true });
    await bucket.file(object.name).download({ destination: tempFilePath });
    
    // Do processing...
    
    return result;
  } finally {
    // Always clean up temp files
    try {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    } catch (err) {
      console.error('Error removing temp directory:', err);
    }
  }
});
```

#### 3. Avoid Background Activities After Function Returns

```javascript
// Bad
exports.badFunction = functions.https.onCall(async (data, context) => {
  const result = await doSomething();
  
  // Don't do this! This continues after function returns
  doSomethingElse().then(() => console.log('Done')); 
  
  return result;
});

// Good
exports.goodFunction = functions.https.onCall(async (data, context) => {
  const result = await doSomething();
  
  // Complete all work before returning
  await doSomethingElse();
  console.log('Done');
  
  return result;
});
```

### Error Handling & Reliability

```javascript
exports.robustFunction = functions.firestore
  .document('orders/{orderId}')
  .onCreate(async (snap, context) => {
    try {
      // Function implementation
      const order = snap.data();
      
      // Validate data
      if (!order.userId || !order.items) {
        throw new Error('Invalid order data');
      }
      
      // Process order
      return processOrder(order);
    } catch (error) {
      // Log detailed error for debugging
      console.error('Order processing failed:', error);
      
      // Store error for monitoring
      await admin.firestore().collection('errors').add({
        function: 'robustFunction',
        orderId: context.params.orderId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        error: error.message,
        stack: error.stack
      });
      
      // Re-throw to mark function as failed
      throw error;
    }
  });
```

### Dependency Management

Our current setup:
- Node.js 18
- Explicit version pinning in package.json

## Specific Implementation Notes

1. All notification functions include proper error handling
2. Use the SendGrid library for email delivery instead of nodemailer
3. User preferences are checked before sending notifications
4. We use `Promise.allSettled()` to handle multiple notification channels in parallel
5. FCM tokens are properly managed and invalid tokens are removed

## Local Development & Testing

1. Use Firebase Emulator for local testing
```
npm run serve
```

2. Test functions with the shell
```
npm run shell
```

3. Deploy only specific functions
```
firebase deploy --only functions:functionName
```

## Functions

### 1. classifyMaintenanceRequest

This function automatically classifies maintenance requests using OpenAI's GPT-4 model. When a new maintenance ticket is created with status `pending_classification`, this function:

- Analyzes the ticket description
- Determines the appropriate category (plumbing, electrical, HVAC, etc.)
- Assigns an urgency level (1-5)
- Updates the ticket with this information and changes status to `ready_to_dispatch`

### 2. matchContractorToTicket

This function finds suitable contractors for a classified maintenance ticket. When a ticket status changes to `ready_to_dispatch`, this function:

- Identifies the ticket's property and landlord
- Searches for contractors with matching skills
- Prioritizes contractors from the landlord's preferred list
- Considers contractor ratings and experience
- Recommends up to three contractors for the job
- Updates the ticket with recommended contractors and changes status to `ready_to_assign`

### 3. notifyAssignedContractor

This function sends notifications when a contractor is assigned to a ticket. When a ticket status changes to `assigned`, this function:

- Stores the assignment in the contractor's notification collection
- Sends an email notification to the contractor (if configured)
- Sends a push notification to the contractor's registered devices (if available)

### 4. Real-time Notification Triggers

The application includes a comprehensive real-time notification system that keeps all users informed about important events:

#### Ticket Classification Notifications
- **notifyTicketClassified**: Sends notifications when a maintenance request is classified by AI
  - Notifies both tenant and landlord about category and urgency
  - Creates special high-urgency notifications for tickets with urgency levels 4-5

#### Contractor Matching Notifications
- **notifyContractorsMatched**: Notifies landlords when contractors have been matched to a ticket
  - Includes information about how many contractors were matched
  - Provides quick access to the ticket for assignment

#### Status Change Notifications
- **notifyTicketStatusChange**: Notifies relevant parties when ticket status changes
  - Tenant notifications for all status changes on their tickets
  - Landlord notifications for property status updates
  - Contractor notifications when their assigned tickets change status

#### Completion Notifications
- **notifyRequestCompleted**: Sends notifications when a maintenance request is completed
  - Notifies both tenant and landlord about completion
  - Includes property and unit information

#### New Request Notifications
- **notifyNewMaintenanceRequest**: Notifies landlords about new maintenance requests
  - Includes tenant name, unit number, and issue summary
  - Provides direct link to the new ticket

### 5. User Relationship API Endpoints

#### Tenant Invitation Endpoints

1. **sendTenantInvitation**
   - Sends an invitation to a tenant to join a property
   - Required data: `email`, `propertyId`, `unitNumber`
   - Returns: `{ success: true, invitationId: string }`

2. **acceptTenantInvitation**
   - Accepts a tenant invitation (called by the tenant)
   - Required data: `invitationId`
   - Returns: `{ success: true, propertyId: string, unitNumber: string }`

3. **revokeTenantInvitation**
   - Revokes a pending tenant invitation (called by the landlord)
   - Required data: `invitationId`
   - Returns: `{ success: true }`

4. **getTenantInvitations**
   - Gets all tenant invitations sent by a landlord
   - Returns: `{ invitations: Array<Invitation> }`

#### Contractor Rolodex Endpoints

1. **addContractorToRolodex**
   - Adds a contractor to a landlord's rolodex (sends invitation)
   - Required data: `email`, optional: `message`
   - Returns: `{ success: true, invitationId: string }`

2. **acceptContractorInvitation**
   - Accepts a contractor invitation (called by the contractor)
   - Required data: `invitationId`
   - Returns: `{ success: true, landlordId: string }`

3. **removeContractorFromRolodex**
   - Removes a contractor from a landlord's rolodex
   - Required data: `contractorId`
   - Returns: `{ success: true }`

4. **getContractorRolodex**
   - Gets all contractors in a landlord's rolodex and pending invitations
   - Returns: `{ contractors: Array<Contractor>, pendingInvitations: Array<Invitation> }`

## Setup

1. Make sure you have the Firebase CLI installed:
   ```
   npm install -g firebase-tools
   ```

2. Log in to Firebase:
   ```
   firebase login
   ```

3. Install dependencies:
   ```
   cd functions
   npm install
   ```

4. Create a `.env` file in the functions directory with your API keys:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

## Local Development

To test functions locally:

```
firebase emulators:start --only functions
```

## Deployment

To deploy all functions:

```
firebase deploy --only functions
```

To deploy a specific function:

```
firebase deploy --only functions:classifyMaintenanceRequest
firebase deploy --only functions:matchContractorToTicket
firebase deploy --only functions:notifyAssignedContractor
firebase deploy --only functions:sendTenantInvitation
firebase deploy --only functions:acceptTenantInvitation
```

## Environment Variables

The following environment variables must be set in the Firebase Functions environment:

- `OPENAI_API_KEY`: Your OpenAI API key for the ticket classification

To set environment variables for deployed functions:

```
firebase functions:config:set openai.apikey="your_openai_api_key_here"
```

## Function Execution Flow

### Maintenance Ticket Flow
1. User creates a maintenance ticket → Status: `pending_classification`
   - **notifyNewMaintenanceRequest** sends notification to landlord
2. `classifyMaintenanceRequest` function triggers → Status: `ready_to_dispatch`
   - **notifyTicketClassified** sends notifications to tenant and landlord
3. `matchContractorToTicket` function triggers → Status: `ready_to_assign`
   - **notifyContractorsMatched** sends notification to landlord
4. Landlord assigns a contractor → Status: `assigned`
   - **notifyAssignedContractor** sends notification to assigned contractor
5. Contractor updates ticket status (in progress, scheduled, etc.)
   - **notifyTicketStatusChange** sends notifications to relevant parties
6. Contractor marks request as completed → Status: `completed`
   - **notifyRequestCompleted** sends notifications to tenant and landlord

### Tenant Invitation Flow
1. Landlord sends invitation using `sendTenantInvitation`
2. Tenant receives email with invitation link
3. Tenant creates account or logs in, then accepts invitation using `acceptTenantInvitation`
4. Tenant is associated with property and can submit maintenance requests

### Contractor Invitation Flow
1. Landlord adds contractor using `addContractorToRolodex`
2. Contractor receives email/notification with invitation link
3. Contractor accepts using `acceptContractorInvitation`
4. Contractor is added to landlord's rolodex and can be assigned to maintenance tasks

## Notification System

The Propagentic notification system provides real-time updates to all users through:

1. **In-app notifications** - Stored in the `notifications` collection
2. **Email notifications** - Sent via Firebase Extensions or custom email provider
3. **Push notifications** - Sent via Firebase Cloud Messaging (FCM)

### Notification Types

The system supports various notification types:

| Type | Description | Recipients |
|------|-------------|------------|
| `classified` | Ticket classified by AI | Tenant, Landlord |
| `high_urgency` | Urgent ticket | Landlord |
| `contractors_matched` | Contractors matched to ticket | Landlord |
| `assignment` | Contractor assigned to ticket | Contractor |
| `status_change` | Ticket status updated | Tenant, Landlord, Contractor |
| `request_completed` | Maintenance request completed | Tenant, Landlord |
| `new_request` | New maintenance request submitted | Landlord |
| `invitation` | User invitation | Tenant, Contractor |

### Notification Data Structure

```javascript
{
  id: "notification-id",             // Auto-generated
  userId: "user-id",                 // User receiving the notification
  userRole: "tenant",                // Role of the user (tenant, landlord, contractor)
  type: "status_change",             // Type of notification
  data: {                            // Notification-specific data
    ticketId: "ticket-id",           // Related ticket ID
    propertyId: "property-id",       // Related property ID
    // Other relevant data
    message: "Your status changed"   // Human-readable message
  },
  read: false,                       // Whether notification has been read
  createdAt: Timestamp,              // When notification was created
  readAt: Timestamp,                 // When notification was read
  deleted: false                     // Soft deletion flag
}
```

## Testing

Basic testing can be performed by creating new maintenance tickets in Firestore with status `pending_classification` and observing the function execution flow.

For API endpoints, you can test using the Firebase shell or client applications that authenticate with Firebase Authentication.

## Data Structure

### Invitation Object
```javascript
{
  type: "tenant" | "contractor",
  email: string,
  landlordId: string,
  propertyId?: string, // Only for tenant invitations
  unitNumber?: string, // Only for tenant invitations
  status: "pending" | "accepted" | "revoked" | "expired",
  message?: string,    // Optional message for contractor invitations
  createdAt: Timestamp,
  expiresAt: Timestamp,
  acceptedAt?: Timestamp,
  revokedAt?: Timestamp,
  tenantId?: string,   // Set when a tenant accepts
  contractorId?: string // Set when a contractor accepts or when inviting existing contractor
}
```

## Maintenance Request Classification

The `classifyMaintenanceRequest` function automatically categorizes maintenance requests using OpenAI's GPT-4 model. It analyzes the description and determines:

1. The appropriate category (plumbing, electrical, HVAC, etc.)
2. The urgency level (1-5)

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Add your OpenAI API key

3. Deploy the function:
   ```bash
   npm run deploy
   ```

### How It Works

1. When a new document is added to the `maintenanceRequests` collection with `status: 'pending_classification'`, the function triggers.
2. It extracts the description and sends it to OpenAI.
3. The AI analyzes the description and returns a category and urgency level.
4. The function updates the document with:
   - `category`: The determined category (plumbing, electrical, etc.)
   - `urgency`: A number from 1 (low) to 5 (emergency)
   - `status`: Changed to `ready_to_dispatch`
   - `classifiedAt`: Server timestamp

### Example Request Document

```javascript
{
  "description": "The bathroom sink faucet is constantly dripping, wasting water and making noise at night.",
  "photoUrl": "https://example.com/photo.jpg",
  "submittedBy": "user123",
  "unitNumber": "101",
  "status": "pending_classification",
  "timestamp": "2023-11-10T12:34:56Z"
}
```

### Example Classified Document

After processing:

```javascript
{
  "description": "The bathroom sink faucet is constantly dripping, wasting water and making noise at night.",
  "photoUrl": "https://example.com/photo.jpg",
  "submittedBy": "user123",
  "unitNumber": "101",
  "status": "ready_to_dispatch",
  "timestamp": "2023-11-10T12:34:56Z",
  "category": "plumbing",
  "urgency": 3,
  "classifiedAt": "2023-11-10T12:35:30Z"
}
```

### OpenAI Prompt

The prompt used for classification is designed to guide the AI to accurately determine the appropriate category and urgency:

```
You are a building maintenance expert. Analyze the following maintenance request description:

"[DESCRIPTION]"

Based on the description, determine:
1. The most appropriate category: plumbing, electrical, HVAC, structural, appliance, or general
2. The urgency level (1-5) where:
   1 = Low priority (can be scheduled anytime)
   2 = Minor issue (should be addressed within 2 weeks)
   3 = Normal priority (should be addressed within a week)
   4 = Important (should be addressed within 48 hours)
   5 = Emergency (requires immediate attention)

Respond with JSON in the following format only, no other text:
{
  "category": "category_name",
  "urgency": urgency_number
}
``` 