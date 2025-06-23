# 🚀 **Intern Project: Contractor Job Acceptance System**

## 📋 **Project Overview**

**Duration:** 3-4 weeks  
**Difficulty:** Intermediate  
**Tech Stack:** Firebase Functions (TypeScript), React TypeScript, Firestore  
**Mentorship:** Weekly 1:1s + daily standup check-ins

### **Business Context**
You're building a critical piece of PropAgentic's maintenance workflow - allowing contractors to accept or reject job assignments. Currently, contractors can view jobs but cannot respond to them, creating a bottleneck in our property management process.

---

## 🎯 **Learning Objectives**

By completing this project, you will learn:
- **Backend Development**: Firebase Functions, TypeScript, API design
- **Database Design**: Firestore transactions, data consistency
- **Frontend Integration**: React hooks, state management, API integration
- **Testing**: Unit tests, integration tests, error handling
- **Code Quality**: TypeScript best practices, code reviews

---

## 📊 **Current State Analysis**

### ✅ **What Already Exists**
```typescript
// In jobService.ts - Basic bid management
export const acceptBid = async (bidId: string, contractorId: string)
export const rejectBid = async (bidId: string, contractorId: string)

// In ContractorJobBoard.tsx - UI foundation
- Job listing component
- Basic contractor dashboard
- Job detail views
```

### ❌ **What's Missing (Your Tasks)**
- Enhanced backend API with proper validation
- Contractor-initiated acceptance workflow
- Real-time notifications
- Frontend acceptance/rejection UI
- Comprehensive error handling
- Unit & integration tests

---

## 🎯 **Project Requirements**

### **User Story**
*As a contractor, I want to accept or reject work orders assigned to me so that I can manage my workload and communicate my availability to landlords.*

### **Acceptance Criteria**
- ✅ Contractors can accept assigned maintenance requests
- ✅ Contractors can reject requests with optional reason
- ✅ Landlords receive real-time notifications of contractor responses
- ✅ System prevents double-acceptance of jobs
- ✅ All actions are logged and auditable
- ✅ 95%+ code coverage with tests

---

## 📝 **Technical Tasks Breakdown**

### **Week 1: Backend Foundation**

#### **Task 1.1: Enhance Job Service API** ⏱️ *2-3 days*
**File:** `src/services/firestore/jobService.ts`

```typescript
// Add these new functions to existing jobService.ts
export interface JobAcceptanceRequest {
  jobId: string;
  contractorId: string;
  acceptanceType: 'accept' | 'reject';
  rejectionReason?: string;
  estimatedStartDate?: Date;
  notes?: string;
}

export const processJobResponse = async (request: JobAcceptanceRequest): Promise<void>
export const getContractorAssignedJobs = async (contractorId: string): Promise<Job[]>
export const validateJobAcceptance = async (jobId: string, contractorId: string): Promise<boolean>
```

**Requirements:**
- Validate contractor is assigned to the job
- Check job status is 'assigned' (not already accepted/completed)
- Use Firestore transactions for data consistency
- Add proper error handling with descriptive messages
- Log all acceptance/rejection actions

#### **Task 1.2: Firebase Function Enhancement** ⏱️ *2-3 days*
**File:** `functions/src/jobAcceptance.ts` (NEW FILE)

```typescript
// Create new Firebase Function
export const processContractorJobResponse = functions.https.onCall(async (data, context) => {
  // Validate authentication
  // Process job acceptance/rejection
  // Trigger notifications
  // Return success/error response
});

export const onJobStatusChange = functions.firestore
  .document('jobs/{jobId}')
  .onUpdate(async (change, context) => {
    // Trigger notifications when job status changes
    // Update related maintenance request status
    // Log status change
  });
```

### **Week 2: Frontend Implementation**

#### **Task 2.1: Job Action Components** ⏱️ *3-4 days*
**Files:** 
- `src/components/contractor/JobActionPanel.tsx` (NEW)
- `src/components/contractor/JobAcceptanceModal.tsx` (NEW)

```typescript
// JobActionPanel.tsx - Main action buttons
interface JobActionPanelProps {
  job: Job;
  onAccept: (jobId: string, details: AcceptanceDetails) => Promise<void>;
  onReject: (jobId: string, reason: string) => Promise<void>;
  disabled?: boolean;
}

// JobAcceptanceModal.tsx - Detailed acceptance form
interface AcceptanceDetails {
  estimatedStartDate: Date;
  notes?: string;
  availabilityConfirmed: boolean;
}
```

**Requirements:**
- Responsive design (mobile-first)
- Form validation with error messaging
- Loading states during API calls
- Success/error toast notifications
- Accessibility compliance (ARIA labels, keyboard navigation)

#### **Task 2.2: Update Contractor Dashboard** ⏱️ *2 days*
**File:** `src/components/contractor/ContractorJobBoard.tsx`

**Integration Requirements:**
- Add JobActionPanel to existing job cards
- Update job filtering (show only assigned jobs)
- Add real-time updates with Firestore listeners
- Implement optimistic UI updates

### **Week 3: Integration & Polish**

#### **Task 3.1: Notification System** ⏱️ *3 days*
**File:** `src/services/firestore/notificationService.ts`

```typescript
export const createJobResponseNotification = async (
  landlordId: string,
  contractorName: string,
  jobId: string,
  action: 'accepted' | 'rejected',
  reason?: string
): Promise<void>
```

**Features:**
- Email notifications to landlords
- In-app notification badges
- Push notifications (bonus)

#### **Task 3.2: Error Handling & Edge Cases** ⏱️ *2 days*

**Scenarios to Handle:**
- Contractor loses internet during acceptance
- Job gets cancelled while contractor is responding
- Multiple contractors assigned to same job
- Invalid job states
- Network timeouts

### **Week 4: Testing & Documentation**

#### **Task 4.1: Comprehensive Testing** ⏱️ *3-4 days*
**Files:**
- `__tests__/services/jobAcceptance.test.ts`
- `__tests__/components/JobActionPanel.test.tsx`
- `__tests__/integration/contractorJobFlow.test.ts`

**Test Coverage Requirements:**
- Unit tests for all new functions (>90% coverage)
- Component testing with React Testing Library
- Integration tests for complete workflow
- Error scenario testing
- Firebase emulator testing

#### **Task 4.2: Documentation** ⏱️ *1 day*
- Code documentation (JSDoc comments)
- API documentation
- User flow documentation
- Deployment guide

---

## 🔧 **Development Setup**

### **Prerequisites**
```bash
# Install dependencies
npm install

# Start Firebase emulators
firebase emulators:start

# Start development server
npm run start:fix
```

### **Key Files to Study First**
1. `src/services/firestore/jobService.ts` - Understand existing job management
2. `src/components/contractor/ContractorJobBoard.tsx` - See current contractor UI
3. `functions/src/index.ts` - Understand Firebase Functions structure
4. `src/models/Job.ts` - Review job data structure

---

## 📊 **Success Metrics**

### **Code Quality**
- [ ] TypeScript strict mode compliance
- [ ] ESLint/Prettier formatting
- [ ] 90%+ test coverage
- [ ] 0 console errors/warnings
- [ ] All PropTypes defined

### **Functionality**
- [ ] Contractors can accept jobs in <3 clicks
- [ ] Landlords receive notifications within 30 seconds
- [ ] System handles 100+ concurrent acceptances
- [ ] Error recovery works in offline scenarios
- [ ] Mobile responsive on iOS/Android

### **Performance**
- [ ] Job acceptance API responds in <2 seconds
- [ ] UI updates in <500ms
- [ ] No memory leaks in component tests

---

## 🎯 **Bonus Challenges** *(If time permits)*

1. **Real-time Dashboard Updates** - Use Firestore realtime listeners
2. **Batch Job Operations** - Accept/reject multiple jobs at once
3. **Contractor Scheduling** - Calendar integration for job scheduling
4. **Smart Notifications** - ML-based notification preferences
5. **Mobile App API** - Prepare APIs for future mobile app

---

## 🤝 **Mentorship & Support**

### **Weekly Check-ins**
- **Monday**: Goal setting and roadblock discussion
- **Wednesday**: Code review and technical guidance
- **Friday**: Progress review and next week planning

### **Daily Support**
- Slack #intern-support channel for quick questions
- Code review requests via GitHub PRs
- Pair programming sessions for complex problems

### **Resources**
- [Firebase Functions TypeScript Guide](https://firebase.google.com/docs/functions/typescript)
- [React Testing Library Best Practices](https://testing-library.com/docs/react-testing-library/intro/)
- [PropAgentic Code Style Guide](docs/CODE_STYLE.md)

---

## 🚀 **Getting Started Checklist**

### **Day 1: Environment Setup**
- [ ] Clone repository and run setup
- [ ] Access Firebase console (request permissions)
- [ ] Run existing tests to verify setup
- [ ] Create feature branch: `feature/contractor-job-acceptance-intern`

### **Day 2: Code Discovery**
- [ ] Study existing job service implementation
- [ ] Trace through contractor dashboard components  
- [ ] Review Firestore data models
- [ ] Set up development workflow

### **Day 3: Technical Design**
- [ ] Create technical design document
- [ ] Get mentor approval on approach
- [ ] Set up testing framework
- [ ] Begin implementation

---

## 📈 **Career Growth Opportunities**

This project will give you experience with:
- **Full-stack development** (Frontend + Backend + Database)
- **Production-ready code** (Testing, Error handling, Performance)
- **Real user impact** (Critical business functionality)
- **Modern tech stack** (React, TypeScript, Firebase, Cloud Functions)
- **Agile development** (Sprints, code reviews, CI/CD)

**Success in this project can lead to:**
- Full-time offer consideration
- Technical leadership opportunities
- Mentoring future interns
- Open source contributions

---

## 📞 **Contact & Questions**

**Primary Mentor:** [Your Name]  
**Slack:** @mentor-handle  
**Email:** mentor@propagentic.com  
**Office Hours:** Mon/Wed/Fri 2-4 PM PST

**Questions to Ask During Development:**
- "Does this approach align with PropAgentic's architecture?"
- "How should I handle this edge case?"
- "Is my test coverage sufficient for this component?"
- "Should I optimize this for performance now or later?"

---

*Ready to build something that real contractors will use every day? Let's ship it! 🚀* 