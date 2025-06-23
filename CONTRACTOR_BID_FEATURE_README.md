# Contractor Bid Acceptance/Rejection Feature

## Overview

This feature enables contractors to accept or reject work-order bids, updates Firestore status in real-time, and triggers notifications to landlords. The implementation provides a complete workflow for contractor job management with optimistic UI updates and comprehensive error handling.

## 🏗️ Architecture

### Backend Services

#### 1. Job Service (`src/services/firestore/jobService.ts`)
- **`acceptJobByContractor(contractorId, bidId, jobId)`**: Validates ownership, performs atomic transactions, rejects competing bids
- **`rejectJobByContractor(contractorId, bidId, jobId)`**: Validates ownership, updates bid status
- **Key Features**:
  - Ownership validation (contractor can only modify their own bids)
  - Atomic Firestore transactions for data consistency
  - Automatic rejection of competing bids when one is accepted
  - Comprehensive error handling and logging

#### 2. Cloud Functions (`functions/lib/contractorJobActions.js`)
- **`contractorAcceptJob`**: Handles bid acceptance via HTTP callable function
- **`contractorRejectJob`**: Handles bid rejection via HTTP callable function
- **`getContractorBidsForJob`**: Retrieves contractor's bids for a specific job
- **Security**: Firebase Auth validation, ownership checks, transaction safety

#### 3. Notification Service (`src/services/firestore/contractorJobNotificationService.ts`)
- **Real-time notifications** for bid acceptance/rejection
- **Email and push alerts** via integrated notification system
- **Notification preferences** management
- **Automatic cleanup** of expired notifications

### Frontend Components

#### 1. Contractor Job Board (`src/components/contractor/ContractorJobBoard.tsx`)
- **Accept/Reject UI**: Dual-button interface with loading states
- **Optimistic Updates**: Immediate UI feedback with rollback on errors
- **Reject Modal**: Reason input for bid rejection
- **Real-time Updates**: Live status changes via Firestore subscriptions

#### 2. Notification Center (`src/components/notifications/ContractorJobNotificationCenter.tsx`)
- **Real-time Notifications**: Live updates for job-related events
- **Filtering**: By type, priority, read status
- **Management**: Mark as read, delete, preferences

#### 3. React Hooks (`src/hooks/useContractorJobNotifications.ts`)
- **Real-time Subscription**: Live notification updates
- **Management Functions**: Mark read, delete, preferences
- **Error Handling**: Automatic retry and fallback

## 🔐 Security Implementation

### Firestore Security Rules

#### Enhanced Bid Operations
```javascript
// Contractors can only update their own pending bids
function isValidBidUpdate(bidId) {
  let bid = get(/databases/$(database)/documents/bids/$(bidId)).data;
  return isSignedIn() && 
         bid.contractorId == request.auth.uid &&
         bid.status == 'pending';
}

// Enhanced bid validation
function isValidBidCreate() {
  let data = request.resource.data;
  return isContractor() &&
         data.contractorId == request.auth.uid &&
         data.keys().hasAll(['jobId', 'contractorId', 'amount', 'description', 'estimatedDuration', 'proposedStartDate', 'laborCost', 'materialsCost', 'totalCost']) &&
         data.amount > 0 &&
         data.totalCost > 0;
}
```

#### Notification Security
```javascript
// Only Cloud Functions can create notifications
match /jobNotifications/{notificationId} {
  allow create: if false; // Only Cloud Functions
  allow read: if isSignedIn() && resource.data.userId == request.auth.uid;
  allow update: if isSignedIn() && resource.data.userId == request.auth.uid;
  allow delete: if isSignedIn() && resource.data.userId == request.auth.uid;
}
```

### Cloud Function Security
- **Authentication Required**: All functions validate Firebase Auth
- **Ownership Validation**: Contractors can only modify their own bids
- **Input Validation**: Comprehensive parameter validation
- **Transaction Safety**: Atomic operations prevent race conditions

## 🧪 Testing Strategy

### Unit Tests
- **`src/services/firestore/jobService.test.ts`**: Core service methods
- **`functions/lib/contractorJobActions.test.js`**: Cloud Function validation
- **`src/services/firestore/contractorJobNotificationService.test.ts`**: Notification service

### Integration Tests
- **`src/test/integration/jobService.integration.test.ts`**: End-to-end Firestore operations
- **`src/test/integration/contractorJobNotificationService.integration.test.ts`**: Notification flow testing

### Test Coverage Goals
- **>80% coverage** for new contractor bid functionality
- **Firebase Emulator** testing for realistic scenarios
- **Error handling** validation for edge cases

## 🚀 Deployment Guide

### 1. Deploy Cloud Functions
```bash
cd functions
npm run deploy
```

### 2. Update Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### 3. Verify Deployment
```bash
# Check function deployment
firebase functions:list

# Test function calls
firebase functions:shell
```

## 📱 User Workflow

### Contractor Flow
1. **View Available Jobs**: Contractor sees open jobs in their dashboard
2. **Submit Bid**: Contractor creates bid with pricing and timeline
3. **Accept/Reject**: Contractor can accept or reject their own bids
4. **Real-time Updates**: UI updates immediately with optimistic feedback
5. **Notifications**: Receive real-time notifications for job assignments

### Landlord Flow
1. **Job Creation**: Landlord creates maintenance job
2. **Bid Review**: Landlord reviews contractor bids
3. **Real-time Notifications**: Receive notifications when contractors accept/reject
4. **Job Assignment**: Job automatically assigned when bid is accepted

## 🔧 Configuration

### Environment Variables
```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
FIRESTORE_EMULATOR_HOST=localhost:8080

# Notification Settings
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_PUSH_NOTIFICATIONS=true
NOTIFICATION_QUIET_HOURS_START=22:00
NOTIFICATION_QUIET_HOURS_END=08:00
```

### Notification Preferences
Users can configure:
- **Email notifications**: On/off for different event types
- **Push notifications**: Mobile push alerts
- **In-app notifications**: Real-time UI updates
- **Quiet hours**: Do not disturb settings

## 🐛 Troubleshooting

### Common Issues

#### 1. Cloud Functions Not Deploying
```bash
# Check function logs
firebase functions:log

# Verify function exports
firebase functions:list
```

#### 2. Firestore Rules Errors
```bash
# Test rules locally
firebase emulators:start --only firestore

# Validate rules syntax
firebase deploy --only firestore:rules --dry-run
```

#### 3. Notification Delivery Issues
- Check Firebase project configuration
- Verify notification service initialization
- Review Cloud Function logs for errors

### Debug Mode
Enable debug logging:
```javascript
// In development
localStorage.setItem('debug', 'contractor-bids:*');
```

## 📊 Monitoring & Analytics

### Key Metrics
- **Bid acceptance rate**: Percentage of accepted vs rejected bids
- **Response time**: Time from bid submission to acceptance/rejection
- **Notification delivery**: Success rate of real-time notifications
- **Error rates**: Function failures and rollback frequency

### Logging
- **Structured logging** in Cloud Functions
- **Error tracking** with stack traces
- **Performance monitoring** for transaction times
- **User action tracking** for analytics

## 🔄 Future Enhancements

### Planned Features
1. **Bulk Operations**: Accept/reject multiple bids
2. **Advanced Filtering**: Job search and filtering
3. **Automated Matching**: AI-powered contractor-job matching
4. **Escrow Integration**: Payment processing for accepted jobs
5. **Mobile App**: Native mobile notifications

### Performance Optimizations
1. **Caching**: Redis cache for frequently accessed data
2. **Batch Operations**: Optimize Firestore batch writes
3. **Lazy Loading**: Progressive loading of job data
4. **Offline Support**: Offline-first architecture

## 📚 API Reference

### Job Service Methods
```typescript
// Accept a job bid
acceptJobByContractor(contractorId: string, bidId: string, jobId: string): Promise<void>

// Reject a job bid
rejectJobByContractor(contractorId: string, bidId: string, jobId: string): Promise<void>

// Get contractor's bids for a job
getBidsForContractor(contractorId: string): Promise<Bid[]>
```

### Cloud Functions
```typescript
// Accept job bid
contractorAcceptJob(data: { jobId: string, bidId: string, contractorId: string })

// Reject job bid
contractorRejectJob(data: { jobId: string, bidId: string, contractorId: string, reason?: string })

// Get contractor bids
getContractorBidsForJob(data: { jobId: string, contractorId: string })
```

### Notification Service
```typescript
// Create bid accepted notification
createBidAcceptedNotification(jobId: string, bidId: string, ...): Promise<void>

// Create bid rejected notification
createBidRejectedNotification(jobId: string, bidId: string, ...): Promise<void>

// Get user notifications
getJobNotifications(userId: string, unreadOnly?: boolean): Promise<ContractorJobNotification[]>
```

## 🤝 Contributing

### Development Setup
1. **Clone repository** and install dependencies
2. **Set up Firebase emulators** for local development
3. **Configure environment variables** for testing
4. **Run tests** to verify functionality

### Code Standards
- **TypeScript** for type safety
- **ESLint** for code quality
- **Prettier** for formatting
- **Jest/Vitest** for testing
- **Conventional commits** for version control

### Testing Checklist
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Firestore rules validated
- [ ] Cloud Functions deployed
- [ ] UI components tested
- [ ] Error handling verified
- [ ] Performance benchmarks met

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Status**: Production Ready ✅ 