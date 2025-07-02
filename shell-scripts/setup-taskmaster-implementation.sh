#!/bin/bash

# Navigate to project root directory
cd "$(dirname "$0")/.."


# PropAgentic Data Flow Inconsistencies - Task Master Setup
# Run this script to add all implementation tasks to Task Master

echo "🚀 Setting up PropAgentic Data Flow Fix tasks in Task Master..."

# Check if task-master is available
if ! command -v task-master &> /dev/null && ! command -v npx &> /dev/null; then
    echo "❌ Neither task-master nor npx found. Please install Node.js and task-master-ai"
    exit 1
fi

# Use task-master if available, otherwise use npx
TASK_CMD="task-master"
if ! command -v task-master &> /dev/null; then
    TASK_CMD="npx task-master-ai"
    echo "Using npx task-master-ai..."
fi

echo "📋 Adding Critical Priority Tasks..."

# Task 11: Contractor Profile Creation Fix
echo "Adding Task 11: Contractor Profile Creation Fix..."
$TASK_CMD add-task \
  --prompt="Fix contractor profile creation to create both users/{uid} and contractorProfiles/{contractorId} documents during onboarding. Update ContractorOnboarding.jsx handleSubmit() to use batched writes. Add fallback logic to contractorService.ts for backward compatibility. Create migration script for existing contractors." \
  --priority=high \
  --dependencies=""

# Task 12: Email Verification Security
echo "Adding Task 12: Email Verification Security..."
$TASK_CMD add-task \
  --prompt="Implement mandatory email verification before onboarding access. Update AuthContext register function to send verification email and sign out user. Create EmailVerificationPage component. Update login to check emailVerified status. Add resend verification functionality." \
  --priority=high \
  --dependencies=""

# Task 13: Dashboard Route Standardization  
echo "Adding Task 13: Dashboard Route Standardization..."
$TASK_CMD add-task \
  --prompt="Standardize all dashboard routes to use role-specific patterns (/landlord/dashboard, /contractor/dashboard, /tenant/dashboard). Update App.jsx routing. Create RoleBasedRedirect component for /dashboard. Update all onboarding completion handlers to use role-specific routes." \
  --priority=high \
  --dependencies=""

echo "📋 Adding High Priority Tasks..."

# Task 14: Profile Creation Race Conditions
echo "Adding Task 14: Profile Creation Race Conditions..."
$TASK_CMD add-task \
  --prompt="Standardize profile creation across all signup methods (email, Google OAuth). Implement transaction-based profile creation to prevent partial states. Add profile creation validation with retry logic. Add loading states during profile creation to prevent multiple submissions." \
  --priority=medium \
  --dependencies="11,12"

# Task 15: Firestore Security Rules
echo "Adding Task 15: Firestore Security Rules..."
$TASK_CMD add-task \
  --prompt="Update Firestore security rules to align with new data model. Add rules for contractorProfiles collection. Ensure rules match both users and role-specific profile collections. Test rules with all user types to prevent unauthorized access." \
  --priority=medium \
  --dependencies="11"

# Task 16: Service Layer Standardization
echo "Adding Task 16: Service Layer Standardization..."
$TASK_CMD add-task \
  --prompt="Implement base service class with standardized error handling. Add caching layer for frequently accessed data. Implement batch operations for performance. Ensure all services follow consistent patterns for data access and transformation." \
  --priority=medium \
  --dependencies="11,15"

echo "📋 Adding Testing & Quality Tasks..."

# Task 17: Integration Testing
echo "Adding Task 17: Integration Testing..."
$TASK_CMD add-task \
  --prompt="Create comprehensive integration tests for critical user flows: email signup → verification → onboarding → dashboard for all user types. Include tests for both new data model and backward compatibility." \
  --priority=medium \
  --dependencies="11,12,13"

# Task 18: Firebase Emulator Tests
echo "Adding Task 18: Firebase Emulator Tests..."
$TASK_CMD add-task \
  --prompt="Implement Firebase emulator tests for data operations. Test Firestore security rules with all user types. Add performance benchmarks for profile creation and dashboard loading." \
  --priority=medium \
  --dependencies="15,16"

# Task 19: Data Model Validation
echo "Adding Task 19: Data Model Validation..."
$TASK_CMD add-task \
  --prompt="Implement Zod schemas for all data models. Add runtime validation in all services. Create data sanitization utilities. Add TypeScript type guards for data safety." \
  --priority=low \
  --dependencies="16"

# Task 20: Error Handling & Recovery
echo "Adding Task 20: Error Handling & Recovery..."
$TASK_CMD add-task \
  --prompt="Create error boundary components for critical user flows. Implement profile recovery mechanisms for failed states. Add graceful degradation for missing data. Improve user-friendly error messages throughout the app." \
  --priority=low \
  --dependencies="14,16"

echo "📋 Adding Infrastructure Tasks..."

# Task 21: Rollback Preparation  
echo "Adding Task 21: Rollback Preparation..."
$TASK_CMD add-task \
  --prompt="Create database backup scripts before implementing critical changes. Prepare rollback procedures for each major change. Set up monitoring alerts for data integrity issues. Document emergency recovery procedures." \
  --priority=high \
  --dependencies=""

# Task 22: Monitoring & Metrics
echo "Adding Task 22: Monitoring & Metrics..."
$TASK_CMD add-task \
  --prompt="Implement monitoring for signup success rates, dashboard load times, profile creation success rates, and authentication error rates. Set up alerts for metrics falling below thresholds. Create dashboard for tracking implementation success." \
  --priority=low \
  --dependencies="11,12,13"

echo ""
echo "✅ Task Master setup complete!"
echo ""
echo "📊 View all tasks:"
echo "  $TASK_CMD list"
echo ""
echo "🎯 Get next task to work on:"
echo "  $TASK_CMD next"
echo ""
echo "📝 View specific task details:"
echo "  $TASK_CMD show 11"
echo ""
echo "🔍 Start working on highest priority:"
echo "  $TASK_CMD set-status --id=11 --status=in-progress"
echo ""
echo "📚 For detailed implementation guide, see:"
echo "  TASKMASTER_IMPLEMENTATION_GUIDE.md"
echo "" 