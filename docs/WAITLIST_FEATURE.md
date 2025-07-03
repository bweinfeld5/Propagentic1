# Waitlist Feature Documentation

## Overview

The Waitlist feature allows potential users to sign up for early access to PropAgentic before the official launch. It includes automated priority scoring, analytics, and admin management tools.

## Collection Structure

### Firebase Collection: `waitlist`

The waitlist data is stored in a Firebase collection called `waitlist` with the following schema:

```typescript
interface WaitlistEntry {
  id?: string;
  name: string;
  email: string;
  phoneNumber: string;
  userType: 'landlord' | 'tenant' | 'contractor' | 'property_manager' | 'other';
  interests: string[];
  referralSource?: string;
  companyName?: string;
  propertyCount?: string;
  userId?: string | null;
  ipAddress?: string | null;
  userAgent?: string;
  timestamp: Timestamp;
  source: 'waitlist_form' | 'landing_page' | 'referral' | 'other';
  status: 'active' | 'contacted' | 'converted' | 'unsubscribed';
  priority?: 'high' | 'medium' | 'low';
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## Architecture

### Service Layer

**File**: `src/services/firestore/waitlistService.ts`

The WaitlistService extends BaseFirestoreService and provides:

- **CRUD Operations**: Create, read, update, delete waitlist entries
- **Advanced Queries**: Filter by user type, status, priority, date range
- **Search Functionality**: Full-text search across name, email, company fields
- **Analytics**: Calculate metrics like conversion rates and user type distribution
- **Bulk Operations**: Update status for multiple entries simultaneously
- **Caching**: 2-minute TTL for fresh data with 50-item cache limit
- **Retry Logic**: Automatic retry with exponential backoff

### Key Methods

```typescript
// Add new waitlist entry with duplicate checking
waitlistService.addWaitlistEntry(entryData)

// Get entries with advanced filtering
waitlistService.getWaitlistEntries(filters, pagination)

// Update entry status with notes
waitlistService.updateStatus(id, status, notes)

// Get analytics and metrics
waitlistService.getWaitlistMetrics()

// Search entries
waitlistService.searchWaitlist(searchTerm)

// Bulk status updates
waitlistService.bulkUpdateStatus(ids, status, notes)
```

## Priority System

The system automatically calculates priority based on multiple factors:

### Scoring Criteria

- **User Type**: Landlords/Property Managers (+2 points)
- **Property Count**: 
  - 26+ properties (+3 points)
  - 11-25 properties (+2 points)
  - 6-10 properties (+1 point)
- **Business Profile**: Has company name (+1 point)
- **Engagement**: 3+ interests selected (+1 point)

### Priority Levels

- **High Priority**: Score ≥ 4 points
- **Medium Priority**: Score 2-3 points  
- **Low Priority**: Score 0-1 points

## Components

### 1. WaitlistForm (`src/components/waitlist/WaitlistForm.jsx`)

**Features**:
- Multi-step form with validation
- Conditional fields based on user type
- Duplicate email detection
- Analytics tracking
- User profile integration

**Usage**:
```jsx
<WaitlistForm 
  onSuccess={handleSuccess} 
  currentUser={currentUser} 
/>
```

### 2. WaitlistManagement (`src/components/admin/WaitlistManagement.tsx`)

**Admin Features**:
- View all waitlist entries in paginated table
- Filter by user type, status, priority, date range
- Search functionality
- Bulk status updates
- Real-time metrics dashboard
- Export capabilities

**Access Control**: Requires admin privileges (`userType === 'admin'` or `isAdmin === true`)

## Analytics & Metrics

### Available Metrics

```typescript
interface WaitlistMetrics {
  totalSignups: number;
  byUserType: Record<string, number>;
  byReferralSource: Record<string, number>;
  conversionRate: number;
  recentSignups: number; // last 7 days
}
```

### Metrics Calculation

- **Conversion Rate**: (contacted + converted) / total entries × 100
- **Recent Signups**: Entries created in the last 7 days
- **User Type Distribution**: Count by landlord, tenant, contractor, etc.
- **Referral Sources**: Track which channels drive signups

## Status Management

### Status Flow

1. **Active**: Initial signup status
2. **Contacted**: Admin has reached out to the user
3. **Converted**: User has signed up for the full platform
4. **Unsubscribed**: User has opted out

### Status Updates

```typescript
// Single entry
await waitlistService.updateStatus(entryId, 'contacted', 'Called and left voicemail');

// Bulk updates
await waitlistService.bulkUpdateStatus(['id1', 'id2'], 'contacted');
```

## Integration Points

### 1. Coming Soon Page

The waitlist form is integrated into the coming soon page (`src/pages/ComingSoonPage.jsx`) with:
- Hero section with call-to-action
- Feature highlights
- Social proof elements

### 2. User Profile Updates

When logged-in users sign up for the waitlist:
- `onWaitlist: true` flag added to user profile
- `waitlistSignupDate` timestamp recorded
- Phone number and interests updated

### 3. Analytics Tracking

Google Analytics events are fired for:
- Waitlist signups
- User type categorization
- Conversion tracking

## Security & Privacy

### Data Protection

- Email addresses stored in lowercase for consistency
- Personal information access restricted to admins
- User consent tracked for communications
- GDPR-compliant data handling

### Firebase Security Rules

```javascript
// Example security rule for waitlist collection
match /waitlist/{document} {
  allow read, write: if isAdmin(request.auth);
  allow create: if request.auth != null; // Authenticated users can create entries
}
```

## Error Handling

### Service Layer Error Handling

```typescript
interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
  cached?: boolean;
}
```

### Common Error Scenarios

- **Duplicate Email**: Service prevents duplicate email entries
- **Validation Errors**: Client-side validation with server-side backup
- **Rate Limiting**: Firestore limits handled with retry logic
- **Network Issues**: Automatic retry with exponential backoff

## Performance Considerations

### Caching Strategy

- **Metrics Cache**: 5-minute TTL for analytics data
- **Entry Cache**: 2-minute TTL for individual entries
- **Search Cache**: Cached search results for repeated queries

### Query Optimization

- Compound indexes for filtered queries
- Pagination for large result sets
- Efficient search using Firestore limitations

### Recommended Indexes

```javascript
// Firestore composite indexes needed:
// 1. (userType, status, timestamp)
// 2. (priority, status, timestamp)  
// 3. (status, timestamp)
// 4. (timestamp, status)
```

## Deployment & Monitoring

### Environment Variables

No additional environment variables required - uses existing Firebase configuration.

### Monitoring

- Track signup conversion rates
- Monitor for spam or abuse
- Alert on unusual signup patterns
- Performance metrics for service response times

## Future Enhancements

### Planned Features

1. **Email Campaigns**: Integration with email service providers
2. **Referral Tracking**: Track viral coefficient and referral success
3. **A/B Testing**: Test different waitlist forms and messaging
4. **Advanced Segmentation**: More sophisticated user categorization
5. **Automated Workflows**: Trigger actions based on user behavior
6. **Export/Import**: CSV export for external tools integration

### Technical Improvements

1. **Real-time Updates**: WebSocket integration for live admin dashboard
2. **Advanced Search**: Elasticsearch integration for better search
3. **Machine Learning**: Predictive scoring for conversion likelihood
4. **API Endpoints**: REST API for external integrations

## Troubleshooting

### Common Issues

1. **Form Submission Failures**
   - Check Firebase connection
   - Verify user authentication state
   - Check for validation errors

2. **Admin Dashboard Access**
   - Verify user has admin privileges
   - Check Firebase security rules
   - Confirm authentication state

3. **Missing Data**
   - Check Firestore console for entries
   - Verify service layer error handling
   - Check browser console for errors

### Debug Mode

Enable debug logging by setting:
```javascript
// In development
localStorage.setItem('waitlist-debug', 'true');
```

## API Reference

### WaitlistService Methods

See the full TypeScript definitions in `src/services/firestore/waitlistService.ts` for complete method signatures and parameters. 