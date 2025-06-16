#!/bin/bash

# PropAgentic Email Verification Troubleshooting Script
# This script sets up and starts the troubleshooting process for email verification

echo "🚀 Starting PropAgentic Email Verification Troubleshooting..."
echo "=================================================="

# Create results directory
mkdir -p troubleshooting-results
cd troubleshooting-results

# Initialize log file
LOG_FILE="email-verification-troubleshooting-$(date +%Y%m%d_%H%M%S).log"
echo "📝 Logging to: $LOG_FILE"
echo "Email Verification Troubleshooting Started: $(date)" > $LOG_FILE

# Function to log messages
log_message() {
    echo "$1" | tee -a $LOG_FILE
}

log_message "🔍 Phase 1: Environment Check"
log_message "=============================="

# Check if we're in the right directory
if [ ! -f "../package.json" ]; then
    log_message "❌ Error: Not in PropAgentic project root"
    exit 1
fi

log_message "✅ Project root confirmed"

# Check if email verification files exist
log_message "📁 Checking key files..."

FILES_TO_CHECK=(
    "../src/context/AuthContext.jsx"
    "../src/components/auth/SignupForm.jsx"
    "../src/pages/EmailVerificationPage.jsx"
    "../src/pages/LoginPage.jsx"
    "../src/firebase/config.js"
)

for file in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$file" ]; then
        log_message "✅ Found: $file"
    else
        log_message "❌ Missing: $file"
    fi
done

log_message ""
log_message "🔍 Phase 2: Current Issues Analysis"
log_message "=================================="

# Create issue tracking file
cat > current-issues.json << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "critical_issues": [
    {
      "id": "REG_001",
      "title": "Registration UID Error",
      "description": "Cannot read properties of undefined (reading 'uid')",
      "location": "Registration form",
      "priority": "CRITICAL",
      "status": "IDENTIFIED",
      "investigation_needed": true
    }
  ],
  "high_priority_issues": [
    {
      "id": "UX_001",
      "title": "Email Verification Flow",
      "description": "Flow doesn't match modern SaaS standards",
      "priority": "HIGH",
      "status": "NEEDS_ENHANCEMENT"
    },
    {
      "id": "UX_002",
      "title": "User Experience Gaps",
      "description": "Missing professional UX elements",
      "priority": "HIGH",
      "status": "NEEDS_IMPROVEMENT"
    }
  ],
  "investigation_areas": [
    "Firebase Auth integration",
    "SendEmailVerification implementation",
    "Error handling in registration",
    "Email delivery system",
    "Verification page functionality"
  ]
}
EOF

log_message "✅ Created issue tracking file: current-issues.json"

log_message ""
log_message "🔍 Phase 3: Code Analysis"
log_message "========================"

# Analyze AuthContext for potential issues
log_message "🔍 Analyzing AuthContext.jsx..."
if grep -n "sendEmailVerification" ../src/context/AuthContext.jsx > /dev/null; then
    log_message "✅ sendEmailVerification found in AuthContext"
else
    log_message "❌ sendEmailVerification not found in AuthContext"
fi

if grep -n "user.uid" ../src/context/AuthContext.jsx > /dev/null; then
    log_message "⚠️  Found user.uid references - potential source of error"
    grep -n "user.uid" ../src/context/AuthContext.jsx >> $LOG_FILE
fi

# Check for common error patterns
log_message "🔍 Checking for common error patterns..."
if grep -n "userCredential.user" ../src/components/auth/SignupForm.jsx > /dev/null; then
    log_message "⚠️  Found userCredential.user references in SignupForm"
    grep -n "userCredential.user" ../src/components/auth/SignupForm.jsx >> $LOG_FILE
fi

log_message ""
log_message "🔍 Phase 4: Testing Preparation"
log_message "==============================="

# Create testing checklist
cat > testing-checklist.md << EOF
# Email Verification Testing Checklist

## 🔴 Critical Tests (Fix First)
- [ ] Debug registration error with real email
- [ ] Check browser console for detailed errors
- [ ] Verify Firebase Auth configuration
- [ ] Test with different email addresses

## 🟡 High Priority Tests
- [ ] Complete registration flow
- [ ] Email delivery verification
- [ ] Verification link functionality
- [ ] Redirect behavior after verification
- [ ] Error handling scenarios

## 🟢 Enhancement Tests
- [ ] Mobile responsiveness
- [ ] Email template design
- [ ] Loading states
- [ ] User messaging clarity
- [ ] Cross-browser compatibility

## 📧 Email Providers to Test
- [ ] Gmail
- [ ] Outlook/Hotmail
- [ ] Yahoo
- [ ] Custom domain emails
- [ ] Corporate emails

## 🎯 Success Criteria
- [ ] No registration errors
- [ ] Email delivered within 5 seconds
- [ ] Verification link works on first click
- [ ] Professional email design
- [ ] Clear user instructions
- [ ] Mobile-optimized experience

## 📝 Test Results
Date: $(date)
Tester: Background Agent
Environment: Development

### Test 1: Registration Error Debug
Status: [ ] PASS [ ] FAIL
Notes: 

### Test 2: Email Delivery
Status: [ ] PASS [ ] FAIL
Email Provider: 
Delivery Time: 
Notes: 

### Test 3: Verification Link
Status: [ ] PASS [ ] FAIL
Notes: 

### Test 4: Mobile Experience
Status: [ ] PASS [ ] FAIL
Device: 
Notes: 

### Overall Assessment
Registration Flow: [ ] WORKING [ ] BROKEN [ ] NEEDS_IMPROVEMENT
Email Verification: [ ] WORKING [ ] BROKEN [ ] NEEDS_IMPROVEMENT
User Experience: [ ] EXCELLENT [ ] GOOD [ ] NEEDS_IMPROVEMENT
Industry Standard: [ ] MATCHES [ ] CLOSE [ ] NEEDS_WORK
EOF

log_message "✅ Created testing checklist: testing-checklist.md"

log_message ""
log_message "🔍 Phase 5: Reference Standards"
log_message "==============================="

# Create reference standards document
cat > saas-email-verification-standards.md << EOF
# SaaS Email Verification Standards Reference

## 🏆 Industry Leaders Analysis

### Stripe
- **Registration**: Clean form, immediate feedback
- **Email**: Professional design, clear CTA button
- **Verification**: Instant redirect, success confirmation
- **Mobile**: Fully responsive, touch-friendly

### Notion
- **Registration**: Progressive disclosure, helpful hints
- **Email**: Branded template, personal tone
- **Verification**: Seamless flow, onboarding integration
- **Mobile**: Native app-like experience

### Slack
- **Registration**: Team-focused, clear messaging
- **Email**: Contextual information, team branding
- **Verification**: Workspace integration, role setup
- **Mobile**: Optimized for mobile-first users

### GitHub
- **Registration**: Developer-focused, security emphasis
- **Email**: Technical but friendly, clear instructions
- **Verification**: Repository access, security features
- **Mobile**: Code-friendly mobile interface

## 📋 Common Patterns

### Registration Flow
1. Form validation (real-time)
2. Clear error messages
3. Password strength indicator
4. Terms acceptance
5. Loading state during submission
6. Success message with next steps

### Email Template
1. Company branding/logo
2. Clear subject line
3. Personal greeting
4. Verification purpose explanation
5. Prominent CTA button
6. Alternative text link
7. Expiration notice
8. Support contact information

### Verification Page
1. Loading state while verifying
2. Success confirmation
3. Clear next steps
4. Error handling with retry option
5. Automatic redirect
6. Mobile-optimized design

### Error Handling
1. Specific error messages
2. Suggested solutions
3. Retry mechanisms
4. Support contact options
5. Fallback procedures

## 🎯 PropAgentic Target Standards

### Must Have
- [ ] Zero registration errors
- [ ] Professional email templates
- [ ] Mobile-responsive design
- [ ] Clear user messaging
- [ ] Proper error handling

### Should Have
- [ ] Real-time form validation
- [ ] Password strength indicator
- [ ] Email delivery confirmation
- [ ] Verification status tracking
- [ ] Resend email functionality

### Nice to Have
- [ ] Progressive web app features
- [ ] Social login integration
- [ ] Advanced security features
- [ ] Analytics and monitoring
- [ ] A/B testing capabilities
EOF

log_message "✅ Created standards reference: saas-email-verification-standards.md"

log_message ""
log_message "🔍 Phase 6: Action Plan"
log_message "======================"

# Create action plan
cat > action-plan.md << EOF
# Email Verification Troubleshooting Action Plan

## 🚨 Immediate Actions (Next 2 Hours)

### 1. Debug Registration Error
- [ ] Open browser dev tools
- [ ] Navigate to registration form
- [ ] Attempt registration with: benweinfeld@ecomap.tech
- [ ] Capture exact error message and stack trace
- [ ] Identify line of code causing "uid" undefined error

### 2. Code Investigation
- [ ] Review AuthContext.jsx register function
- [ ] Check SignupForm.jsx error handling
- [ ] Verify Firebase Auth import statements
- [ ] Look for async/await issues

### 3. Quick Fixes
- [ ] Add null checks for user object
- [ ] Improve error handling
- [ ] Add console logging for debugging
- [ ] Test with simplified registration flow

## 📅 Short-term Goals (This Week)

### Day 1: Critical Bug Fixes
- [ ] Fix registration error
- [ ] Test basic email verification flow
- [ ] Ensure emails are delivered

### Day 2-3: User Experience
- [ ] Improve error messaging
- [ ] Add loading states
- [ ] Polish verification page
- [ ] Test mobile experience

### Day 4-5: Professional Polish
- [ ] Design email templates
- [ ] Add proper branding
- [ ] Implement industry standards
- [ ] Comprehensive testing

## 🎯 Success Metrics

### Technical
- Registration success rate: 100%
- Email delivery time: <5 seconds
- Verification success rate: >95%
- Mobile compatibility: 100%

### User Experience
- Clear error messages: ✅
- Professional design: ✅
- Intuitive flow: ✅
- Helpful instructions: ✅

## 📞 Escalation

If critical issues cannot be resolved:
1. Document exact error details
2. Provide reproduction steps
3. Include browser/environment info
4. Contact main developer for guidance
EOF

log_message "✅ Created action plan: action-plan.md"

log_message ""
log_message "🎉 Setup Complete!"
log_message "=================="
log_message "📁 All files created in: troubleshooting-results/"
log_message "📝 Log file: $LOG_FILE"
log_message ""
log_message "🚀 Next Steps:"
log_message "1. Review current-issues.json"
log_message "2. Follow action-plan.md"
log_message "3. Use testing-checklist.md for validation"
log_message "4. Reference saas-email-verification-standards.md"
log_message ""
log_message "🔴 PRIORITY: Fix registration error first!"
log_message "Test with: benweinfeld@ecomap.tech"
log_message ""
log_message "Good luck! 🍀"

# Return to project root
cd ..

echo "✅ Email verification troubleshooting setup complete!"
echo "📁 Check troubleshooting-results/ directory for all files" 