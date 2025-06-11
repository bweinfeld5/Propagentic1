# Real Messaging Implementation Guide

## Overview

The messaging system now uses real Firebase data instead of mock data. Messages are stored in Firestore and update in real-time across all connected clients.

## Key Components

### 1. MessageService (`src/services/firestore/messageService.ts`)
- Handles all Firebase operations for conversations and messages
- Provides real-time subscriptions for live updates
- Manages conversation creation, message sending, and read status

### 2. useMessages Hook (`src/hooks/useMessages.ts`)
- React hook that provides messaging functionality to components
- Manages real-time subscriptions and cleanup
- Provides convenient methods for sending messages and managing conversations

### 3. StartConversationButton (`src/components/messaging/StartConversationButton.tsx`)
- Reusable component for starting conversations between users
- Can be used in contractor lists, property listings, etc.
- Supports different variants (button, icon, link)

### 4. Updated CommunicationPanel (`src/components/contractor/widgets/CommunicationPanel.tsx`)
- Now uses real data from useMessages hook
- Shows loading states and error handling
- Displays actual conversations and messages

## Usage Examples

### 1. Adding Message Button to Contractor List

```tsx
import StartConversationButton from '../messaging/StartConversationButton';

// In your contractor list component
const ContractorCard = ({ contractor }) => {
  return (
    <div className="contractor-card">
      <h3>{contractor.name}</h3>
      <p>{contractor.company}</p>
      
      {/* Add message button */}
      <StartConversationButton
        targetUserId={contractor.uid}
        targetUserName={contractor.name}
        targetUserRole="contractor"
        targetUserEmail={contractor.email}
        targetUserCompany={contractor.company}
        variant="button"
        size="sm"
        initialMessage="Hi! I'd like to discuss a potential job opportunity."
      />
    </div>
  );
};
```

### 2. Using in Property Management

```tsx
// When a landlord wants to message a contractor about a specific property
<StartConversationButton
  targetUserId={contractor.id}
  targetUserName={contractor.name}
  targetUserRole="contractor"
  metadata={{
    propertyId: property.id,
    propertyName: property.address,
    jobId: job.id,
    jobTitle: job.title
  }}
  initialMessage={`Hi ${contractor.name}, I have a ${job.category} job at ${property.address}. Are you available?`}
  variant="link"
>
  Contact Contractor
</StartConversationButton>
```

### 3. Icon Button Version

```tsx
// For compact interfaces
<StartConversationButton
  targetUserId={user.id}
  targetUserName={user.name}
  targetUserRole={user.role}
  variant="icon"
  size="sm"
  className="ml-2"
/>
```

## Implementation Steps

### 1. Update Firestore Rules
The Firestore rules have been updated to allow messaging between authenticated users. Deploy these rules:

```bash
firebase deploy --only firestore:rules
```

### 2. Add to Existing Components

To add messaging to existing contractor or user lists:

```tsx
// 1. Import the component
import StartConversationButton from '../messaging/StartConversationButton';

// 2. Add to your JSX where you display users
{contractors.map(contractor => (
  <div key={contractor.id} className="contractor-item">
    {/* Existing contractor info */}
    <StartConversationButton
      targetUserId={contractor.uid}
      targetUserName={contractor.name}
      targetUserRole="contractor"
      targetUserEmail={contractor.email}
      targetUserCompany={contractor.company}
    />
  </div>
))}
```

### 3. Access Messages in Components

Use the `useMessages` hook to access conversations and messages:

```tsx
import useMessages from '../hooks/useMessages';

const MessagingComponent = () => {
  const {
    conversations,
    activeConversation,
    messages,
    loading,
    error,
    setActiveConversation,
    sendMessage,
    markAsRead
  } = useMessages();

  // Component logic here
};
```

## Data Structure

### Conversation Document
```typescript
{
  id: string;
  type: 'landlord-contractor' | 'landlord-tenant' | 'contractor-tenant';
  participants: [
    {
      id: string;
      name: string;
      email: string;
      role: 'landlord' | 'contractor' | 'tenant';
      company?: string;
    }
  ];
  lastMessage: {
    text: string;
    timestamp: Date;
    senderId: string;
    senderName: string;
  };
  unreadCounts: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    propertyId?: string;
    propertyName?: string;
    jobId?: string;
    jobTitle?: string;
  };
}
```

### Message Document
```typescript
{
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: 'landlord' | 'contractor' | 'tenant';
  text: string;
  timestamp: Date;
  readBy: Record<string, Date>;
  type: 'text' | 'image' | 'file' | 'system';
}
```

## Security

- All messaging operations require authentication
- Users can only access conversations they participate in
- Users can only send messages as themselves
- Firestore security rules enforce these constraints

## Real-time Updates

The system uses Firestore's real-time listeners to provide instant updates:
- New messages appear immediately
- Conversation list updates when new messages arrive
- Read status updates in real-time
- Automatic cleanup of listeners when components unmount

## Next Steps

1. Deploy the updated Firestore rules
2. Test messaging between different user types
3. Add the StartConversationButton to relevant components
4. Consider adding push notifications for new messages
5. Add file/image sharing capabilities if needed 