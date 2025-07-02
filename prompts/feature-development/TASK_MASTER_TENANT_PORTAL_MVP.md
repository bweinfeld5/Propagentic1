# 🏠 PropAgentic MVP Tenant Portal - Task Master

## 📋 **Overview**
Build a production-ready MVP tenant portal with invitation system, AI-enhanced maintenance requests, and real-time notifications.

---

## 🎯 **Core Features Required**

### ✅ **Feature 1: Property Invitation System**
**Status**: 🟢 **90% Complete** - Infrastructure exists, needs integration

**What exists:**
- ✅ Invitation system in `functions/src/userRelationships.ts`
- ✅ Firebase functions: `sendPropertyInvite`, `acceptPropertyInvite`  
- ✅ Firestore rules for `invites` collection
- ✅ Email notifications via Firebase Extension
- ✅ UI components: `InviteTenantModal.tsx`, `InviteUserModal.jsx`

**What needs work:**
1. **Frontend invite acceptance flow** - Create tenant onboarding page
2. **Unit-specific invitations** - Add unit number to invites
3. **Invite expiration handling** - Auto-expire after 7 days

### ✅ **Feature 2: Maintenance Request Creation**
**Status**: 🟡 **70% Complete** - Multiple implementations exist, needs consolidation

**What exists:**
- ✅ Multiple form components: `RequestForm.jsx`, `MaintenanceRequestForm.tsx`, `TenantRequestForm.jsx`
- ✅ Firebase collection: `tickets` with proper schema
- ✅ Photo upload to Firebase Storage
- ✅ Firestore rules for tenant access

**What needs work:**
1. **Consolidate to single component** - Too many similar forms
2. **Improve validation** - Better error handling
3. **Property association** - Link requests to tenant's property

### ✅ **Feature 3: OpenAI Follow-up Questions**
**Status**: 🟡 **60% Complete** - OpenAI integration exists, needs enhancement

**What exists:**
- ✅ OpenAI client in `src/services/modelContext/index.ts`
- ✅ Firebase function: `classifyMaintenanceRequest` with GPT-4
- ✅ AI configuration panel: `AIConfigurationPanel.jsx`
- ✅ Maintenance classification hook: `useMaintenanceAI.ts`

**What needs work:**
1. **Interactive follow-up flow** - Multi-turn conversation
2. **Context-aware questions** - Based on issue type
3. **Additional photo prompts** - AI-guided photo requests

### ✅ **Feature 4: Landlord Notifications**
**Status**: 🟢 **85% Complete** - Comprehensive system exists

**What exists:**
- ✅ Notification triggers in `functions/notificationTriggers.js`
- ✅ Real-time notifications via Firestore listeners
- ✅ Email notifications via Firebase Extension
- ✅ UI components: `NotificationPanel`, `NotificationBell`

**What needs work:**
1. **Push notifications** - Add FCM integration
2. **Notification preferences** - Landlord customization
3. **Escalation rules** - Urgent issue handling

---

## 🔧 **Current Infrastructure Assessment**

### **Firebase Architecture** ✅
```
Collections in use:
├── users/ (authentication & profiles)
├── properties/ (landlord properties)
├── invites/ (tenant invitations) 
├── tickets/ (maintenance requests)
├── mail/ (email queue)
├── notifications/ (real-time alerts)
└── tenantProfiles/ (tenant data)
```

### **Firestore Security Rules** ✅
- ✅ Tenant access to own tickets
- ✅ Landlord access to property tickets  
- ✅ Anonymous access for waitlist/emails
- ✅ Invite system permissions
- ⚠️ **Missing**: Unit-level permissions

### **Firebase Functions** ✅
- ✅ `classifyMaintenanceRequest` - OpenAI classification
- ✅ `sendPropertyInvite` - Invitation system
- ✅ `acceptPropertyInvite` - Accept invitations
- ✅ Notification triggers for all events
- ✅ Email processing via Extension

### **Frontend Components** ⚠️
- ✅ Multiple maintenance forms (needs consolidation)
- ✅ AI integration components
- ✅ Notification system
- ⚠️ **Missing**: Unified tenant dashboard
- ⚠️ **Missing**: Invite acceptance UI

---

## 🚀 **Implementation Plan**

## **Phase 1: Tenant Invitation Flow** (Priority: HIGH)
**Estimated time**: 2-3 days

### Task 1.1: Create Tenant Invite Acceptance Page
```typescript
// File: src/pages/tenant/AcceptInvitePage.tsx
```
- [ ] Parse invite ID from URL params
- [ ] Fetch invite details from Firestore
- [ ] Display property information
- [ ] Accept/decline buttons
- [ ] Redirect to tenant dashboard on accept

### Task 1.2: Update Invitation System for Units
```typescript
// Update: functions/src/userRelationships.ts
```
- [ ] Add `unitNumber` field to invites
- [ ] Validate unit availability
- [ ] Associate tenant with specific unit

### Task 1.3: Add Unit Support to Firestore Rules
```javascript
// Update: firestore.rules
```
- [ ] Add unit-level permissions
- [ ] Allow tenant access to specific unit data
- [ ] Validate unit associations

**Acceptance Criteria:**
- ✅ Tenant receives email with invite link
- ✅ Tenant can view property details
- ✅ Accept/decline flows work correctly
- ✅ Unit association is saved properly

## **Phase 2: Unified Maintenance Request System** (Priority: HIGH)
**Estimated time**: 3-4 days

### Task 2.1: Create Unified RequestForm Component
```typescript
// File: src/components/tenant/UnifiedRequestForm.tsx
```
- [ ] Consolidate existing form logic
- [ ] Property auto-detection from tenant profile
- [ ] Multi-photo upload with preview
- [ ] Issue type selection with icons
- [ ] Urgency level selection

### Task 2.2: Improve Form Validation & UX
```typescript
// Enhanced validation and user experience
```
- [ ] Real-time validation feedback
- [ ] Character counters for descriptions
- [ ] Image compression before upload
- [ ] Progress indicators during submission

### Task 2.3: Update Backend Integration
```typescript
// Update: Firebase functions and rules
```
- [ ] Ensure proper ticket association with property/unit
- [ ] Validate tenant permissions
- [ ] Auto-populate tenant information

**Acceptance Criteria:**
- ✅ Single, intuitive maintenance request form
- ✅ Automatic property/unit detection
- ✅ Multiple photo uploads work smoothly
- ✅ Form validation provides clear feedback

## **Phase 3: AI-Enhanced Follow-up Questions** (Priority: MEDIUM)
**Estimated time**: 4-5 days

### Task 3.1: Create AI Conversation Component
```typescript
// File: src/components/tenant/AIMaintenanceChat.tsx
```
- [ ] Multi-turn conversation interface
- [ ] Message history display
- [ ] Typing indicators
- [ ] Follow-up question suggestions

### Task 3.2: Enhance OpenAI Integration
```typescript
// Update: src/hooks/useMaintenanceAI.ts
```
- [ ] Context-aware question generation
- [ ] Issue-specific follow-up prompts
- [ ] Photo request suggestions
- [ ] Conversation memory management

### Task 3.3: Create AI Question Engine
```typescript
// File: src/services/ai/questionEngine.ts
```
- [ ] Issue type detection
- [ ] Dynamic question generation
- [ ] Photo requirement suggestions
- [ ] Completion assessment

### Task 3.4: Backend AI Enhancement
```typescript
// Update: functions/src/classifyMaintenanceRequest.ts
```
- [ ] Multi-turn conversation support
- [ ] Context preservation
- [ ] Question routing logic
- [ ] Enhanced classification with conversation data

**Acceptance Criteria:**
- ✅ AI asks relevant follow-up questions based on issue type
- ✅ Conversation flows naturally and helpfully
- ✅ AI suggests when additional photos would help
- ✅ Final request includes all gathered information

## **Phase 4: Enhanced Notification System** (Priority: MEDIUM)  
**Estimated time**: 2-3 days

### Task 4.1: Push Notification Setup
```typescript
// File: src/services/pushNotifications.ts
```
- [ ] Firebase Cloud Messaging (FCM) integration
- [ ] Service worker registration
- [ ] Notification permission handling
- [ ] Background notification processing

### Task 4.2: Landlord Notification Preferences
```typescript
// File: src/components/landlord/NotificationSettings.tsx
```
- [ ] Urgency-based notification rules
- [ ] Channel preferences (email/SMS/push)
- [ ] Quiet hours configuration
- [ ] Property-specific settings

### Task 4.3: Escalation Rules
```typescript
// Update: functions/escalationFunctions.js
```
- [ ] Time-based escalation triggers
- [ ] Multiple contact attempts
- [ ] Emergency contact fallbacks
- [ ] SLA violation tracking

**Acceptance Criteria:**
- ✅ Landlords receive immediate notifications for urgent issues
- ✅ Multiple notification channels work properly
- ✅ Escalation rules trigger when needed
- ✅ Notification preferences are respected

---

## 📁 **File Structure for New Components**

```
src/
├── components/tenant/
│   ├── UnifiedRequestForm.tsx        # Single maintenance form
│   ├── AIMaintenanceChat.tsx         # AI conversation interface
│   ├── TenantDashboard.tsx          # Main tenant view
│   └── PropertyInviteCard.tsx       # Invite display
├── pages/tenant/
│   ├── AcceptInvitePage.tsx         # Invite acceptance
│   ├── MaintenanceRequestPage.tsx   # Create requests
│   └── RequestHistoryPage.tsx       # View past requests
├── services/ai/
│   ├── questionEngine.ts            # AI question logic
│   └── conversationManager.ts       # Chat state management
├── hooks/
│   ├── usePropertyInvites.ts        # Invite management
│   ├── useMaintenanceAI.ts          # Enhanced AI hook
│   └── useTenantDashboard.ts        # Dashboard state
└── types/
    ├── maintenance.ts               # Type definitions
    └── invitations.ts               # Invite types
```

---

## 🔥 **Firebase Functions to Update**

### **New Functions Needed:**
```typescript
// functions/src/aiConversation.ts
export const generateFollowUpQuestions = onCall(...)

// functions/src/maintenanceEnhanced.ts  
export const processAIConversation = onCall(...)
export const finalizeMaintenanceRequest = onCall(...)

// functions/src/pushNotifications.ts
export const sendPushNotification = onCall(...)
```

### **Functions to Enhance:**
```typescript
// functions/src/userRelationships.ts
- Add unit number support to invites
- Improve error handling

// functions/src/classifyMaintenanceRequest.ts  
- Add conversation context
- Multi-turn support

// functions/notificationTriggers.js
- Add push notification triggers
- Enhance escalation logic
```

---

## 🔒 **Firestore Rules Updates Needed**

```javascript
// Add to firestore.rules

// Unit-level permissions
match /properties/{propertyId}/units/{unitId} {
  allow read, write: if isTenantOfUnit(unitId);
}

// Enhanced ticket rules
match /tickets/{ticketId} {
  allow create: if isTenant() && isValidTicketForTenant();
  allow read: if isTicketParticipant(ticketId);
}

// AI conversation rules
match /aiConversations/{conversationId} {
  allow read, write: if isConversationOwner(conversationId);
}
```

---

## 🧪 **Testing Strategy**

### **Unit Tests Required:**
- [ ] Invitation flow (send → receive → accept)
- [ ] Maintenance request creation
- [ ] AI conversation logic
- [ ] Notification delivery

### **Integration Tests:**
- [ ] End-to-end tenant onboarding
- [ ] Full maintenance request workflow
- [ ] Real-time notification flow
- [ ] AI conversation completion

### **User Acceptance Tests:**
- [ ] Tenant can join property via invite
- [ ] Maintenance requests are intuitive to create
- [ ] AI questions improve request quality
- [ ] Landlords receive timely notifications

---

## 📈 **Success Metrics**

### **Primary KPIs:**
- ✅ **Invite Acceptance Rate**: >80%
- ✅ **Request Completion Time**: <2 minutes average
- ✅ **AI Engagement Rate**: >60% complete conversations
- ✅ **Notification Response Time**: <5 minutes for urgent issues

### **Secondary KPIs:**
- ✅ **User Satisfaction**: >4.5/5 rating
- ✅ **Request Quality Score**: AI assessment >8/10
- ✅ **Support Ticket Reduction**: <5% of requests need clarification
- ✅ **Landlord Response Rate**: >95% within SLA

---

## 🚦 **Risk Assessment & Mitigation**

### **High Risk:**
- ⚠️ **OpenAI API costs** → Implement rate limiting and conversation caps
- ⚠️ **Email delivery issues** → Already fixed with corrected SMTP config
- ⚠️ **Notification spam** → Smart batching and user preferences

### **Medium Risk:**  
- ⚠️ **Mobile responsiveness** → Test on all device sizes
- ⚠️ **Photo upload performance** → Implement compression and CDN
- ⚠️ **AI conversation quality** → Extensive prompt engineering and testing

### **Low Risk:**
- ⚠️ **Firebase quota limits** → Monitor usage and plan upgrades
- ⚠️ **Security vulnerabilities** → Regular security audits

---

## 🎯 **Next Immediate Actions**

### **Day 1-2: Critical Path**
1. ✅ **Fix email SMTP configuration** (COMPLETED)
2. 🔄 **Create unified RequestForm component** (START HERE)
3. 🔄 **Build invite acceptance page**

### **Day 3-4: Core Features**  
4. 🔄 **Implement AI follow-up questions**
5. 🔄 **Add unit number support to invitations**
6. 🔄 **Test end-to-end flows**

### **Day 5-7: Polish & Launch**
7. 🔄 **Add push notifications**
8. 🔄 **Performance optimization**
9. 🔄 **User acceptance testing**
10. 🔄 **Production deployment**

---

## 📞 **Dependencies & Blockers**

### **External Dependencies:**
- ✅ **OpenAI API access** - Already configured
- ✅ **Firebase project setup** - Complete
- ✅ **Email service** - Fixed and working

### **Internal Dependencies:**
- 🔄 **Design system consistency** - Use existing Tailwind classes
- 🔄 **Mobile testing** - Ensure responsive design
- 🔄 **Performance testing** - Load testing with realistic data

### **No Blockers Identified** 🎉
Your infrastructure is solid and ready for MVP development!

---

## 🎉 **Summary**

**Good News**: You're 75% of the way there! The hardest infrastructure work is done.

**Focus Areas**: 
1. **Consolidate** existing maintenance request forms
2. **Enhance** AI conversation flow  
3. **Polish** user experience and notifications

**Timeline**: MVP ready in **7-10 days** with focused development.

**Next Step**: Start with Task 2.1 (Unified RequestForm) as it's the foundation for everything else. 