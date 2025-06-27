# Task Master Implementation Guide
## PropAgentic Data Flow Inconsistencies Fix

This guide provides a Task Master-compatible breakdown of the MASTER_IMPLEMENTATION_PLAN.md for systematic implementation.

## **Task Master Setup Commands**

```bash
# If you have task-master installed globally:
task-master init --name="PropAgentic Signup Flow Fixes" --description="Fix critical data flow inconsistencies"

# Or use npx:
npx task-master-ai init --name="PropAgentic Signup Flow Fixes" --description="Fix critical data flow inconsistencies"
```

## **Add Critical Priority Tasks**

### **Task 11: Fix Contractor Profile Creation Mismatch**
```bash
task-master add-task --prompt="Fix contractor profile creation to create both users/{uid} and contractorProfiles/{contractorId} documents during onboarding. Update ContractorOnboarding.jsx handleSubmit() to use batched writes. Add fallback logic to contractorService.ts for backward compatibility. Create migration script for existing contractors." --priority=high --dependencies=""
```

**Implementation Details**:
- **Files**: `src/components/onboarding/ContractorOnboarding.jsx`, `src/services/firestore/contractorService.ts`
- **Estimated Time**: 4-6 hours
- **Test Strategy**: New contractor signup → onboarding → dashboard access works. Existing contractors can still access dashboard.

### **Task 12: Implement Email Verification Security**
```bash
task-master add-task --prompt="Implement mandatory email verification before onboarding access. Update AuthContext register function to send verification email and sign out user. Create EmailVerificationPage component. Update login to check emailVerified status. Add resend verification functionality." --priority=high --dependencies=""
```

**Implementation Details**:
- **Files**: `src/context/AuthContext.jsx`, `src/pages/EmailVerificationPage.jsx`, `src/components/auth/SignupForm.jsx`
- **Estimated Time**: 6-8 hours
- **Test Strategy**: Signup → verification required → onboarding blocked until verified. Login blocked for unverified users.

### **Task 13: Standardize Dashboard Routes**
```bash
task-master add-task --prompt="Standardize all dashboard routes to use role-specific patterns (/landlord/dashboard, /contractor/dashboard, /tenant/dashboard). Update App.jsx routing. Create RoleBasedRedirect component for /dashboard. Update all onboarding completion handlers to use role-specific routes." --priority=high --dependencies=""
```

**Implementation Details**:
- **Files**: `src/App.jsx`, `src/utils/authHelpers.js`, all onboarding components
- **Estimated Time**: 2-3 hours  
- **Test Strategy**: All onboarding flows redirect to correct role-specific dashboard. Generic /dashboard redirects properly.

## **Add High Priority Tasks**

### **Task 14: Fix Profile Creation Race Conditions** 
```bash
task-master add-task --prompt="Standardize profile creation across all signup methods (email, Google OAuth). Implement transaction-based profile creation to prevent partial states. Add profile creation validation with retry logic. Add loading states during profile creation to prevent multiple submissions." --priority=medium --dependencies="11,12"
```

### **Task 15: Update Firestore Security Rules**
```bash
task-master add-task --prompt="Update Firestore security rules to align with new data model. Add rules for contractorProfiles collection. Ensure rules match both users and role-specific profile collections. Test rules with all user types to prevent unauthorized access." --priority=medium --dependencies="11"
```

### **Task 16: Standardize Service Layer**
```bash
task-master add-task --prompt="Implement base service class with standardized error handling. Add caching layer for frequently accessed data. Implement batch operations for performance. Ensure all services follow consistent patterns for data access and transformation." --priority=medium --dependencies="11,15"
```

## **Task Master Workflow Commands**

### **View Next Task**
```bash
task-master next
# Shows the next task to work on based on dependencies and priority
```

### **Start Working on a Task** 
```bash
task-master show 11
# View detailed information about task 11 (contractor profile fix)

task-master set-status --id=11 --status=in-progress
# Mark task as started
```

### **Update Task Progress**
```bash
task-master update-subtask --id=11 --prompt="Updated ContractorOnboarding.jsx to use writeBatch for creating both documents. Testing shows both users/{uid} and contractorProfiles/{contractorId} are now created successfully."
```

### **Break Down Complex Tasks**
```bash
task-master expand --id=11 --num=5 --research
# Break down the contractor profile fix into 5 subtasks with research
```

### **Complete Tasks**
```bash
task-master set-status --id=11 --status=done
# Mark task as complete after testing
```

## **Subtask Structure Example**

For **Task 11: Contractor Profile Creation Fix**, you might expand it into:

```bash
task-master expand --id=11 --prompt="Break this down into specific implementation steps: 1) Update onboarding form submission, 2) Add batch write logic, 3) Update service fallback logic, 4) Create migration script, 5) Add comprehensive testing"
```

**Expected Subtasks**:
1. **11.1**: Modify `ContractorOnboarding.jsx` handleSubmit() to use `writeBatch`
2. **11.2**: Create `contractorProfiles` document structure in batch write
3. **11.3**: Add fallback logic to `contractorService.ts` for backward compatibility  
4. **11.4**: Create `scripts/migrate-contractor-profiles.js` migration script
5. **11.5**: Add integration tests for both new and existing contractor flows

## **Progress Tracking**

### **View Overall Progress**
```bash
task-master list --status=done
task-master list --status=in-progress  
task-master list --status=pending
```

### **Generate Progress Report**
```bash
task-master generate
# Creates individual task files in tasks/ directory
```

## **Testing Integration with Task Master**

### **Add Testing Tasks**
```bash
task-master add-task --prompt="Create comprehensive integration tests for critical user flows: email signup → verification → onboarding → dashboard for all user types. Include tests for both new data model and backward compatibility." --priority=medium --dependencies="11,12,13"

task-master add-task --prompt="Implement Firebase emulator tests for data operations. Test Firestore security rules with all user types. Add performance benchmarks for profile creation and dashboard loading." --priority=medium --dependencies="15,16"
```

## **Quality Assurance Tasks**

### **Add Code Quality Tasks**
```bash
task-master add-task --prompt="Implement Zod schemas for all data models. Add runtime validation in all services. Create data sanitization utilities. Add TypeScript type guards for data safety." --priority=low --dependencies="16"

task-master add-task --prompt="Create error boundary components for critical user flows. Implement profile recovery mechanisms for failed states. Add graceful degradation for missing data. Improve user-friendly error messages throughout the app." --priority=low --dependencies="14,16"
```

## **Implementation Workflow**

### **Daily Workflow**
1. **Start each session**:
   ```bash
   task-master next
   ```

2. **Work on the task** and **log progress**:
   ```bash
   task-master update-subtask --id=<current-task> --prompt="Progress update: what you completed, what worked, what didn't work, next steps"
   ```

3. **Test thoroughly** before marking complete:
   ```bash
   task-master set-status --id=<task-id> --status=done
   ```

4. **Move to next task**:
   ```bash
   task-master next
   ```

### **Weekly Review**
```bash
task-master list --with-subtasks
# Review all tasks and their detailed progress
```

## **Emergency Rollback Tasks**

### **Add Rollback Preparation**
```bash
task-master add-task --prompt="Create database backup scripts before implementing critical changes. Prepare rollback procedures for each major change. Set up monitoring alerts for data integrity issues. Document emergency recovery procedures." --priority=high --dependencies=""
```

## **Monitoring & Success Metrics Tasks**

### **Add Monitoring Tasks**  
```bash
task-master add-task --prompt="Implement monitoring for signup success rates, dashboard load times, profile creation success rates, and authentication error rates. Set up alerts for metrics falling below thresholds. Create dashboard for tracking implementation success." --priority=low --dependencies="11,12,13"
```

## **Task Dependencies Visualization**

The dependency structure should be:
```
Critical Priority (Sprint 1):
├── Task 11: Contractor Profile Fix (no dependencies)
├── Task 12: Email Verification (no dependencies)  
└── Task 13: Dashboard Routes (no dependencies)

High Priority (Sprint 2):
├── Task 14: Race Conditions (depends: 11, 12)
├── Task 15: Security Rules (depends: 11)
└── Task 16: Service Layer (depends: 11, 15)

Medium/Low Priority (Sprint 3+):
├── Data Validation (depends: 16)
├── Testing Infrastructure (depends: 15, 16)
└── Error Handling (depends: 14, 16)
```

## **Success Criteria Per Task**

Each task should include specific success criteria:

**Task 11 Success Criteria**:
- ✅ New contractors can complete onboarding and access dashboard
- ✅ Existing contractors continue to work without issues  
- ✅ Both `users/{uid}` and `contractorProfiles/{contractorId}` documents created
- ✅ Services work with both old and new data structures
- ✅ Migration script successfully processes existing contractors

**Task 12 Success Criteria**:
- ✅ Email verification required before onboarding access
- ✅ Unverified users cannot log in
- ✅ Resend verification functionality works
- ✅ Verification flow is user-friendly with clear instructions

**Task 13 Success Criteria**:
- ✅ All user types redirect to role-specific dashboards
- ✅ No broken redirect loops
- ✅ Generic `/dashboard` route handles all user types correctly
- ✅ Onboarding completion consistently uses role-specific routes

This Task Master approach gives you:
- **Clear task breakdown** with dependencies
- **Progress tracking** with detailed logging
- **Iterative implementation** with feedback loops
- **Comprehensive testing** integration
- **Risk mitigation** with rollback planning

Start with `task-master next` to get the highest priority task and begin systematic implementation! 