# AI Chat Maintenance Request Implementation

## Overview

This implementation restores the functionality to automatically create maintenance requests in the `maintenanceRequests` Firestore collection when a tenant opens an AI chat session and selects a maintenance category.

## ✅ Implementation Details

### **Where It's Implemented**
**File**: `src/components/tenant/AIMaintenanceChat.tsx`

**Trigger**: When tenant selects a maintenance category in the AI chat interface

### **Why AI Chat is the Right Place**
- Tenants use AI chat specifically for maintenance issues
- Category selection indicates clear intent to create a maintenance request
- This is the primary interface for tenant-initiated maintenance conversations
- Much more targeted than general messaging system

## 🎯 **Implementation Flow**

### 1. **Category Selection Triggers Request Creation**
When a tenant selects a maintenance category (plumbing, electrical, HVAC, etc.):

```typescript
const handleCategorySelect = async (categoryId: string) => {
  // Create maintenance request immediately when category is selected
  const requestId = await createMaintenanceRequest(category);
  
  if (requestId) {
    setMaintenanceRequestId(requestId);
    toast.success(`Maintenance request created for ${category.name}`);
  }
  
  // Continue with AI chat flow
};
```

### 2. **Maintenance Request Creation**
**Function**: `createMaintenanceRequest(category)`

**Data Created**:
```typescript
{
  tenantId: string;              // Current user's ID
  tenantName: string;            // Tenant display name
  tenantEmail: string;           // Tenant email
  chatSessionId: string;         // Unique session ID: "ai-chat-{userId}-{timestamp}"
  propertyId: string | null;     // Associated property (from tenantProfile)
  landlordId: string | null;     // Property owner
  timestamp: Timestamp;          // Creation time
  status: 'pending';             // Default status
  issueType: string;             // Category ID (e.g., 'plumbing')
  category: string;              // Category name (e.g., 'Plumbing')
  description: string;           // Auto-generated: "AI Chat initiated for {category}: {description}"
  images: [];                    // Empty array
  createdVia: 'ai_chat';         // Source identifier
  aiChatCategory: string;        // Category ID for AI chat tracking
  aiChatCategoryName: string;    // Category name for AI chat tracking
}
```

### 3. **Property Association**
- **Tenant Lookup**: Checks `tenantProfiles` collection first, then legacy `users` collection
- **Multi-Property Support**: Handles tenants with multiple properties
- **Property Linking**: Adds request ID to property's `maintenanceRequests` array
- **Error Handling**: Continues even if property association fails

### 4. **Idempotency Protection**
- **Time-based Check**: Prevents duplicate requests within 5 minutes
- **Source Filtering**: Only checks for requests created via AI chat (`createdVia: 'ai_chat'`)
- **Session Handling**: Uses unique session IDs for each chat session

## 🔐 **Security & Permissions**

### **Authentication Required**
```typescript
if (!currentUser) {
  toast.error('Please log in to submit a maintenance request');
  return;
}
```

### **Firestore Rules**
Uses existing rules in `firestore.rules`:
```javascript
match /maintenanceRequests/{requestId} {
  allow create: if isSignedIn();
  allow read, update: if resource.data.tenantId == request.auth.uid;
}

match /properties/{propertyId} {
  allow update: if isSignedIn(); // For maintenanceRequests array
}
```

## 🎨 **User Experience**

### **Visual Feedback**
1. **Toast Notifications**:
   - ✅ Success: "Maintenance request created for {category}"
   - 🔄 Existing: "Continuing with existing maintenance request"
   - ❌ Error: "Failed to create maintenance request, but you can continue chatting"

2. **Visual Indicator**:
   - Green "Request Created" badge appears next to category name
   - Shows user that request was successfully created

3. **Graceful Degradation**:
   - Chat continues working even if request creation fails
   - User can still interact with AI assistant

### **Chat Flow**
1. Tenant opens AI chat interface
2. Selects maintenance category → **Maintenance request created**
3. Chat begins with AI assistant
4. Conversation continues normally
5. AI provides assistance and guidance

## 🔍 **Monitoring & Debugging**

### **Console Logs**
```javascript
🔍 [AIChat] Creating maintenance request for category: Plumbing
🔍 [AIChat] Found property IDs in tenant profile: ['prop-123']
✅ [AIChat] Maintenance request created: req-456
✅ [AIChat] Request linked to property: prop-123
```

### **Error Scenarios**
- **No Authentication**: Toast error, prevents category selection
- **No Properties**: Warning logged, request created without property association
- **Firestore Errors**: Error logged, chat continues normally
- **Recent Request Exists**: Uses existing request, shows appropriate message

## 🧪 **Testing**

### **Manual Testing Steps**
1. Log in as a tenant
2. Navigate to AI chat (`/maintenance/ai-chat`)
3. Select any maintenance category
4. Verify:
   - Toast message appears
   - "Request Created" badge shows
   - Console logs show successful creation
   - Check Firestore for new document in `maintenanceRequests`
   - Check property document for request ID in `maintenanceRequests` array

### **Test Scenarios**
- **First-time request**: Should create new request
- **Rapid category selection**: Should reuse recent request (within 5 minutes)
- **Multiple properties**: Should associate with first property
- **No properties**: Should create request without property association
- **Offline/error**: Should continue chat functionality

## 🔧 **Data Structure**

### **Firestore Collections Modified**

#### `maintenanceRequests/{requestId}`
```typescript
{
  // Core fields
  tenantId: "user-123",
  chatSessionId: "ai-chat-user-123-1672531200000",
  status: "pending",
  
  // AI Chat specific
  createdVia: "ai_chat",
  aiChatCategory: "plumbing",
  aiChatCategoryName: "Plumbing",
  issueType: "plumbing",
  category: "Plumbing",
  description: "AI Chat initiated for Plumbing: Leaks, clogs, water pressure issues",
  
  // Property association
  propertyId: "prop-123",
  landlordId: "landlord-456",
  
  // Timestamps
  timestamp: Timestamp,
  
  // Arrays
  images: [],
}
```

#### `properties/{propertyId}`
```typescript
{
  maintenanceRequests: ["req-456", "req-789"], // Updated with arrayUnion
  updatedAt: Timestamp,
  // Other property fields...
}
```

## 🚀 **Advantages of AI Chat Implementation**

1. **Targeted**: Only creates requests when user explicitly chooses maintenance
2. **Context-Rich**: Captures specific category and intent
3. **User-Friendly**: Clear visual feedback and error handling
4. **Integrated**: Seamlessly part of the maintenance workflow
5. **Robust**: Handles errors gracefully without breaking chat functionality

## 📊 **Dashboard Display Integration**

### **Fixed Issue: Requests Now Show in Dashboard**
**File**: `src/pages/tenant/EnhancedTenantDashboard.tsx`

**Problem Solved**: Originally, AI chat requests were created in the `maintenanceRequests` collection, but the dashboard only looked in the `tickets` collection, so requests weren't visible.

**Solution**: Enhanced dashboard to fetch from **both collections**:

#### **Dual Collection Monitoring**
```typescript
// 1. Listen to 'tickets' collection (legacy)
const ticketsQuery = query(
  collection(db, 'tickets'),
  where('submittedBy', '==', currentUser.uid)
);

// 2. Listen to 'maintenanceRequests' collection (AI chat)
const maintenanceQuery = query(
  collection(db, 'maintenanceRequests'),
  where('tenantId', '==', currentUser.uid)
);
```

#### **Data Normalization**
Converts `maintenanceRequests` format to `tickets` format for consistent display:
```typescript
{
  id: doc.id,
  issueTitle: data.title || data.issueType || 'Maintenance Request',
  description: data.description || 'No description provided',
  status: data.status || 'pending',
  createdAt: data.timestamp?.toDate(),
  source: 'maintenanceRequests', // Track origin
  urgency: data.priority || 'medium'
}
```

### **Visual Distinctions**
- **AI Chat Badge**: Requests from AI chat show "🌟 AI Chat" badge
- **Status Colors**: Enhanced color coding for different statuses
- **Urgency Indicators**: Shows priority levels with color-coded badges
- **Real-time Updates**: Both collections update live via Firestore listeners

### **Testing Dashboard Display**
1. Create request via AI chat
2. Check tenant dashboard "Recent Maintenance Requests" section
3. Verify AI chat requests show with sparkle badge
4. Confirm real-time updates when status changes

## 📝 **Future Enhancements**

- **AI Integration**: Use actual AI to analyze tenant descriptions
- **Photo Upload**: Allow tenants to upload photos during chat
- **Real-time Updates**: Update request status based on chat progress
- **Contractor Routing**: Automatically assign based on category and location
- **Status Tracking**: Show request status within the chat interface

---

## Summary

This implementation correctly places maintenance request creation in the AI chat interface where tenants specifically go to request maintenance help. **The key fix ensures these requests are now properly displayed in the tenant dashboard by monitoring both the `maintenanceRequests` and `tickets` collections.** Visual indicators help distinguish between different request sources, and real-time updates keep the dashboard current. 