# Propagentic Notification System - Testing Guide

## Setup Prerequisites

1. **Install the Firebase Emulator Suite**:
   ```
   npm install -g firebase-tools
   firebase init emulators
   ```

2. **Configure Environment**:
   - Create `.env` file in functions directory with your OpenAI API key
   - Set up test users with different roles (tenant, landlord, contractor)

## Testing Locally

### Start Local Development Environment
```bash
# Start Firebase emulators
firebase emulators:start

# In another terminal, start React app
npm start
```

## Feature Testing Checklist

### 1. User Authentication
- [ ] Register new users with different roles (tenant, landlord, contractor)
- [ ] Verify login/logout functionality
- [ ] Test user profile management

### 2. Notification Generation Scenarios

#### Landlord Testing
- [ ] Create a new property and verify property creation notification
- [ ] Receive tenant application notification
- [ ] Receive maintenance request notification
- [ ] View contractor match suggestions
- [ ] Accept/reject contractor matches
- [ ] Test notification when contractor accepts a job

#### Tenant Testing
- [ ] Submit a new maintenance request
- [ ] Receive notification when request is classified
- [ ] Receive updates on request status
- [ ] Test notification when contractor is assigned
- [ ] Receive notification when request is completed
- [ ] Accept/decline invitations from landlord

#### Contractor Testing
- [ ] Receive job match notifications
- [ ] Accept/reject job offers
- [ ] Update job status and verify notifications trigger
- [ ] Mark job as complete
- [ ] Accept/decline invitations to rolodex

### 3. Notification UI/UX Testing

- [ ] NotificationBell: 
  - [ ] Badge counter updates correctly
  - [ ] Animation plays for new notifications
  - [ ] Clicking opens NotificationPanel

- [ ] NotificationPanel:
  - [ ] Slides in from right side of screen
  - [ ] Shows most recent notifications
  - [ ] Grouping works correctly
  - [ ] "See all" navigates to NotificationsPage

- [ ] NotificationsPage:
  - [ ] All filters work (by type, by date, read/unread)
  - [ ] Pagination works
  - [ ] Mark as read/unread functionality
  - [ ] Archiving/deleting works

- [ ] NotificationCard:
  - [ ] Displays correct information
  - [ ] Action buttons work (accept/reject/view)
  - [ ] Links to relevant pages

- [ ] NotificationPreferences:
  - [ ] Can toggle email notifications
  - [ ] Can toggle push notifications
  - [ ] Can set quiet hours
  - [ ] Category preferences save correctly

### 4. Real-time Updates

- [ ] Create events from one account and verify real-time notifications appear in another
- [ ] Test multiple users interacting simultaneously
- [ ] Verify notifications appear without page refresh

### 5. Testing Background Functions

- [ ] Test cleanupOldNotifications (Manually trigger to verify older notifications are removed)
- [ ] Test archiveReadNotifications (Verify read notifications are properly archived)

### 6. Missing Components to Implement

1. **Push Notification Support**: 
   - Implement Firebase Cloud Messaging integration
   - Add service worker for web push notifications
   - Create notification permission request flow

2. **Email Notification Fallback**:
   - Implement email templates
   - Set up email sending service (SendGrid/Mailgun)
   - Add triggers for email notifications

3. **Notification Analytics Dashboard**:
   - Track notification open rates
   - Measure action completion rates
   - Analyze user engagement via notifications

4. **Offline Support**:
   - Queue notifications when offline
   - Sync when connection is restored

5. **Deep Linking**:
   - Ensure notifications link directly to relevant content

## Troubleshooting

### Common Issues

1. **Notifications not appearing**:
   - Check Firestore security rules
   - Verify notification subscription
   - Check Firebase console for function errors

2. **AI classifications not working**:
   - Verify OpenAI API key is correctly set
   - Check function logs for rate limiting or errors

3. **Real-time updates failing**:
   - Check network connectivity
   - Verify Firestore listeners are properly set up

### Debug Tools

- Firebase Functions logs: `firebase functions:log`
- Firestore data viewer in Firebase console
- React DevTools for component debugging
- Browser console for frontend errors 