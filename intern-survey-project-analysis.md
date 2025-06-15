# Intern Survey → Project-Matcher Implementation Analysis

## Executive Summary

**Project:** Intern Survey → Project-Matcher Feature for PropAgentic
**Goal:** Self-service survey system that captures intern skills/interests and uses OpenAI to suggest aligned projects
**Timeline:** 10 days from PRD approval to production launch
**Tech Stack:** React 18, TypeScript, Firebase (Auth/Firestore), OpenAI GPT-4o-mini

## Technical Architecture Analysis

### Current PropAgentic Infrastructure
- ✅ React 18 + TypeScript + Tailwind CSS
- ✅ Firebase (Auth, Firestore, Storage, Functions)
- ✅ Role-based authentication system
- ✅ Existing UI components (`/src/components/ui/`)
- ✅ Service layer architecture (`/src/services/`)

### New Components Required
1. **Survey Page** (`/src/pages/InternSurvey.jsx`)
2. **Survey Form Components** (`/src/components/intern/`)
3. **Project Suggestions Modal** (`/src/components/intern/ProjectSuggestionsModal.jsx`)
4. **Admin Dashboard Extension** (`/src/components/admin/InternManagement.jsx`)
5. **OpenAI Integration Service** (`/src/services/openaiService.ts`)
6. **Survey Data Service** (`/src/services/internSurveyService.ts`)

## Detailed Task Breakdown

### Phase 1: Foundation & Data Models (Days 1-2)

#### Task 1: Create TypeScript Interfaces and Data Models
**Priority:** High | **Dependencies:** None
- Define `InternSurvey` interface with all 6 sections
- Create `ProjectMatch` interface for GPT responses
- Add Firestore converters for type safety
- Define form validation schemas

#### Task 2: Set up Firestore Collections and Security Rules
**Priority:** High | **Dependencies:** Task 1
- Create `internSurveys` collection structure
- Create `projectMatches` collection structure
- Implement security rules for role-based access
- Add indexes for efficient queries

#### Task 3: Implement Survey Data Service
**Priority:** High | **Dependencies:** Task 1, 2
- Create `internSurveyService.ts` with CRUD operations
- Implement data sanitization and validation
- Add error handling and retry logic
- Create batch operations for admin management

### Phase 2: Survey Interface (Days 3-4)

#### Task 4: Build Survey Page Route and Authentication
**Priority:** High | **Dependencies:** Task 2
- Create `/intern-survey` route with role-based guard
- Implement redirect logic for authenticated interns
- Add loading states and error boundaries
- Integrate with existing auth context

#### Task 5: Create Survey Form Components
**Priority:** High | **Dependencies:** Task 4
- Build 6-section survey form with proper validation
- Implement Likert scale components
- Add character limits and real-time validation
- Create progress indicator and section navigation

#### Task 6: Implement Form State Management
**Priority:** Medium | **Dependencies:** Task 5
- Add auto-save functionality to localStorage
- Implement form resume capability
- Create form state persistence across sessions
- Add form dirty state tracking

### Phase 3: OpenAI Integration (Days 5-6)

#### Task 7: Create OpenAI Service Integration
**Priority:** High | **Dependencies:** Task 3
- Implement OpenAI API client with proper error handling
- Create prompt template system with OKR weights
- Add token counting and cost tracking
- Implement retry logic with exponential backoff

#### Task 8: Build Project Generation API
**Priority:** High | **Dependencies:** Task 7
- Create `/api/generateProjects` endpoint
- Implement request validation and sanitization
- Add response caching to prevent duplicate calls
- Create comprehensive error handling

#### Task 9: Implement Suggestions Modal UI
**Priority:** Medium | **Dependencies:** Task 8
- Create project suggestions modal component
- Design project cards with title, rationale, deliverables
- Add loading states during API calls
- Implement modal state management

### Phase 4: Admin Dashboard (Days 7-8)

#### Task 10: Extend Admin Dashboard
**Priority:** Medium | **Dependencies:** Task 3
- Add intern management tab to existing admin
- Create table view of all intern surveys
- Implement approval/rejection workflow
- Add export functionality for manager review

#### Task 11: Create Intern Profile View
**Priority:** Low | **Dependencies:** Task 10
- Build detailed view of individual intern responses
- Display GPT suggestions with confidence scores
- Add edit/override capabilities for managers
- Implement audit trail for changes

### Phase 5: Testing & Polish (Days 9-10)

#### Task 12: Implement Comprehensive Testing
**Priority:** High | **Dependencies:** All previous
- Create unit tests for all services
- Add integration tests for survey flow
- Test OpenAI API integration with mocked responses
- Validate accessibility compliance (WCAG 2.1 AA)

#### Task 13: Performance Optimization
**Priority:** Medium | **Dependencies:** Task 12
- Implement code splitting for survey components
- Optimize Firestore queries and indexes
- Add performance monitoring for API calls
- Implement lazy loading for admin dashboard

#### Task 14: Security Audit and Deployment
**Priority:** High | **Dependencies:** Task 13
- Audit all security rules and API endpoints
- Test role-based access controls
- Validate data sanitization and validation
- Deploy to staging and conduct UAT

## Technical Implementation Details

### Data Schema Design
```typescript
interface InternSurvey {
  internId: string;
  basics: {
    name: string;
    pronouns?: string;
    email: string;
  };
  skills: Record<string, number>; // 1-5 scale
  interests: Record<string, number>; // 1-5 scale
  goals: string;
  selfDirectedIdeas?: string;
  logisticsBlockers?: string;
  submittedAt: Timestamp;
}

interface ProjectMatch {
  internId: string;
  projects: Array<{
    title: string;
    why: string;
    first_deliverable: string;
    confidence_score?: number;
  }>;
  gptPromptTokens: number;
  gptCompletionTokens: number;
  createdAt: Timestamp;
  managerApproved?: boolean;
  managerNotes?: string;
}
```

### API Design
```typescript
// POST /api/generateProjects
interface GenerateProjectsRequest {
  internId: string;
  survey: InternSurvey;
}

interface GenerateProjectsResponse {
  projects: ProjectMatch['projects'];
  tokenUsage: {
    prompt: number;
    completion: number;
    cost: number;
  };
}
```

### Component Architecture
```
src/
├── pages/
│   └── InternSurvey.jsx
├── components/
│   ├── intern/
│   │   ├── SurveyForm.jsx
│   │   ├── SurveySection.jsx
│   │   ├── LikertScale.jsx
│   │   └── ProjectSuggestionsModal.jsx
│   └── admin/
│       ├── InternManagement.jsx
│       └── InternProfileView.jsx
├── services/
│   ├── internSurveyService.ts
│   └── openaiService.ts
├── models/
│   └── internSurvey.ts
└── types/
    └── internSurvey.types.ts
```

## Risk Assessment & Mitigation

### High Risks
1. **OpenAI API Costs** - Implement strict rate limiting and caching
2. **Response Time > 10s** - Add timeout handling and retry logic
3. **Security Vulnerabilities** - Comprehensive input validation and sanitization

### Medium Risks
1. **Survey Abandonment** - Auto-save and progress indicators
2. **Poor GPT Suggestions** - Iterative prompt engineering and feedback loops
3. **Admin Workflow Complexity** - Intuitive UI and clear approval process

### Low Risks
1. **Mobile Responsiveness** - Existing Tailwind CSS framework
2. **Firebase Scaling** - Current infrastructure handles load
3. **TypeScript Integration** - Team familiar with existing patterns

## Success Metrics Tracking

### KPI Implementation
- **Survey Completion Rate**: Track via Firestore timestamps
- **API Response Time**: Monitor via performance hooks
- **Manager Approval Rate**: Track approval/rejection ratios
- **Active Project Assignment**: Manual tracking initially

### Analytics Integration
- Add Google Analytics events for survey progression
- Track drop-off points in survey flow
- Monitor API success/failure rates
- Measure time-to-completion metrics

## Next Steps

1. **Immediate**: Review and approve this analysis
2. **Day 1**: Begin Task 1-3 (Foundation & Data Models)
3. **Day 3**: Start Survey Interface development
4. **Day 5**: Begin OpenAI integration
5. **Day 7**: Implement admin dashboard features
6. **Day 9**: Comprehensive testing and polish
7. **Day 10**: Deploy to production

## Open Questions for Resolution

1. **GPT Result Caching**: Implement 24-hour cache to prevent duplicate calls?
2. **Suggestion Regeneration**: Allow interns to request new suggestions?
3. **Manager Editing**: Direct editing in dashboard vs. separate assignment tool?
4. **Notification System**: Email/Slack alerts for new survey submissions?
5. **Mobile-First Design**: Prioritize mobile experience given intern demographics?

---

**Estimated Total Development Time:** 80-100 hours across 10 days
**Team Size Required:** 2-3 developers (1 senior, 1-2 junior)
**External Dependencies:** OpenAI API access, staging environment setup