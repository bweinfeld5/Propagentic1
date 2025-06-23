#!/bin/bash

# 🔧 Intern Git Setup Script - Contractor Job Acceptance Project
# Run this script to set up the proper Git workflow for your intern

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Not in a Git repository. Please run this script from the Propagentic1 root directory."
    exit 1
fi

print_status "Setting up Git workflow for Contractor Job Acceptance intern project..."

# Get intern details
echo
read -p "Enter intern's full name: " INTERN_NAME
read -p "Enter intern's email: " INTERN_EMAIL
read -p "Enter intern's GitHub username: " INTERN_USERNAME

# Validate inputs
if [[ -z "$INTERN_NAME" || -z "$INTERN_EMAIL" || -z "$INTERN_USERNAME" ]]; then
    print_error "All fields are required. Please run the script again."
    exit 1
fi

# Ensure we're on the main branch and up to date
print_status "Ensuring main branch is up to date..."
git checkout main
git pull origin main

# Create main feature branch
MAIN_BRANCH="feature/contractor-job-acceptance-intern"
print_status "Creating main feature branch: $MAIN_BRANCH"

if git show-ref --verify --quiet refs/heads/$MAIN_BRANCH; then
    print_warning "Branch $MAIN_BRANCH already exists. Switching to it..."
    git checkout $MAIN_BRANCH
else
    git checkout -b $MAIN_BRANCH
    git push -u origin $MAIN_BRANCH
    print_success "Created and pushed $MAIN_BRANCH"
fi

# Create Week 1 branch
WEEK1_BRANCH="feature/cja-week1-backend-foundation"
print_status "Creating Week 1 branch: $WEEK1_BRANCH"

if git show-ref --verify --quiet refs/heads/$WEEK1_BRANCH; then
    print_warning "Branch $WEEK1_BRANCH already exists."
else
    git checkout -b $WEEK1_BRANCH
    git push -u origin $WEEK1_BRANCH
    print_success "Created and pushed $WEEK1_BRANCH"
fi

# Create initial progress tracking file
print_status "Creating initial progress tracking file..."
cat > DAILY_PROGRESS.md << EOF
# 📊 **Daily Progress - Contractor Job Acceptance Project**

## 👤 **Intern Information**
- **Name:** $INTERN_NAME
- **Email:** $INTERN_EMAIL
- **GitHub:** @$INTERN_USERNAME
- **Start Date:** $(date +"%Y-%m-%d")

---

## 📅 **Daily Log**

### **Day 1 - $(date +"%Y-%m-%d")**
**Status:** ✅ Setup Complete

**Completed:**
- ✅ Git environment configured
- ✅ Feature branches created
- ✅ Development environment verified
- ✅ Project requirements reviewed

**Next Steps:**
- Begin jobService.ts enhancements
- Set up testing framework
- Implement basic validation logic

**Hours:** Setup
**Blockers:** None

---

*Update this file daily with your progress!*
EOF

# Create initial commit on week 1 branch
git add DAILY_PROGRESS.md
git commit -m "docs(setup): initialize intern project with progress tracking

- Created daily progress tracking file
- Set up Git workflow for contractor job acceptance project
- Intern: $INTERN_NAME (@$INTERN_USERNAME)

Project: Contractor Job Acceptance System
Duration: 4 weeks
Start Date: $(date +"%Y-%m-%d")"

git push origin $WEEK1_BRANCH

print_success "Created initial progress tracking file and committed to $WEEK1_BRANCH"

# Create .github PR template if it doesn't exist
if [ ! -d ".github" ]; then
    mkdir -p .github/pull_request_template
fi

if [ ! -f ".github/pull_request_template/intern_weekly_review.md" ]; then
    print_status "Creating PR template for weekly reviews..."
    cat > .github/pull_request_template/intern_weekly_review.md << EOF
## 📋 **Weekly Review - Contractor Job Acceptance Project**

### 📅 **Week Information**
- **Week:** [Week 1/2/3/4]
- **Focus:** [Backend Foundation/Frontend Implementation/Integration & Polish/Testing & Documentation]
- **Intern:** $INTERN_NAME (@$INTERN_USERNAME)

### 🎯 **Changes Made**
- [ ] [List major changes]
- [ ] [List major changes]
- [ ] [List major changes]

### 🧪 **Testing**
- [ ] All unit tests pass
- [ ] Code coverage ≥ 85% (≥90% for Week 4)
- [ ] TypeScript compilation passes
- [ ] ESLint passes with no warnings
- [ ] Manual testing completed

### 📊 **Metrics**
- **Lines of Code Added:** ___
- **Functions Created:** ___
- **Test Coverage:** ___%
- **Hours Worked:** ___

### 🔍 **Review Focus Areas**
- [Area 1 - e.g., API design]
- [Area 2 - e.g., Error handling]
- [Area 3 - e.g., TypeScript types]

### 📸 **Screenshots/Demo**
_Add screenshots or demo links if applicable_

### ⏭️ **Next Week Focus**
- [Goal 1]
- [Goal 2]
- [Goal 3]

### 💬 **Questions for Mentor**
- [Question 1]
- [Question 2]

---

**Checklist for Mentor Review:**
- [ ] Code quality meets standards
- [ ] Commit messages follow format
- [ ] Tests are comprehensive
- [ ] Documentation is complete
- [ ] No security issues identified
- [ ] Performance considerations addressed
EOF
    print_success "Created PR template for weekly reviews"
fi

# Create development guidelines file
print_status "Creating development guidelines..."
cat > INTERN_DEVELOPMENT_GUIDELINES.md << EOF
# 🛠️ **Development Guidelines - Contractor Job Acceptance Project**

## 🎯 **Quick Start Checklist**

### **Daily Routine**
1. \`git checkout feature/cja-week1-backend-foundation\`
2. \`git pull origin feature/cja-week1-backend-foundation\`
3. Work on assigned tasks
4. Commit frequently with good messages
5. Push at least twice per day
6. Update DAILY_PROGRESS.md at end of day

### **Commit Message Format**
\`\`\`
<type>(scope): <subject>

<body>

<footer>
\`\`\`

**Examples:**
- \`feat(jobService): add processJobResponse function\`
- \`test(jobService): add unit tests for validation\`
- \`fix(jobService): handle edge case in acceptance logic\`

### **Key Commands**
\`\`\`bash
# Daily start
git checkout feature/cja-week1-backend-foundation
git pull origin feature/cja-week1-backend-foundation

# Frequent commits
git add .
git commit -m "feat(jobService): implement validation logic"
git push origin feature/cja-week1-backend-foundation

# End of day
# Update DAILY_PROGRESS.md
git add DAILY_PROGRESS.md
git commit -m "docs(progress): day X progress update"
git push origin feature/cja-week1-backend-foundation
\`\`\`

### **Testing Commands**
\`\`\`bash
npm test                    # Run all tests
npm run test:coverage      # Check coverage
npm run lint               # Check code style
npm run typecheck         # Check TypeScript
\`\`\`

### **Getting Help**
- Daily standup: Ask about blockers
- Slack: Quick questions
- Code review: Weekly PR feedback
- Pair programming: Complex problems

---

**Remember:** 
- Commit early, commit often
- Write descriptive commit messages
- Ask questions when stuck
- Update progress daily
- Test your code before pushing

**You've got this! 🚀**
EOF

git add INTERN_DEVELOPMENT_GUIDELINES.md
git commit -m "docs(setup): add development guidelines for intern

- Quick start checklist for daily workflow
- Commit message standards and examples
- Key commands reference
- Testing and help resources"
git push origin $WEEK1_BRANCH

print_success "Created development guidelines"

# Summary
echo
echo "=================================================="
print_success "🎉 Intern Git Setup Complete!"
echo "=================================================="
echo
print_status "Created branches:"
echo "  • $MAIN_BRANCH (main feature branch)"
echo "  • $WEEK1_BRANCH (current working branch)"
echo
print_status "Created files:"
echo "  • DAILY_PROGRESS.md (progress tracking)"
echo "  • INTERN_DEVELOPMENT_GUIDELINES.md (quick reference)"
echo "  • .github/pull_request_template/intern_weekly_review.md (PR template)"
echo
print_status "Next steps for intern:"
echo "  1. Clone/pull the repository"
echo "  2. Checkout $WEEK1_BRANCH"
echo "  3. Review INTERN_DEVELOPMENT_GUIDELINES.md"
echo "  4. Begin Week 1 tasks"
echo
print_status "Next steps for mentor:"
echo "  1. Add $INTERN_USERNAME as collaborator on GitHub"
echo "  2. Set up branch protection for main branch"
echo "  3. Review MENTOR_CHECKLIST.md"
echo "  4. Schedule first mentorship meeting"
echo
print_warning "Don't forget to:"
echo "  • Add the intern as a GitHub collaborator"
echo "  • Set up branch protection rules"
echo "  • Share the INTERN_PROJECT_CONTRACTOR_JOB_ACCEPTANCE.md document"
echo "  • Schedule the first mentorship session"
echo
print_success "Happy mentoring! 🚀" 