# Intern Survey → Project-Matcher Implementation Plan

## Immediate Next Steps (Start Today)

### Step 1: Create Core TypeScript Types
Create the foundation types that everything else will depend on.

**Files to create:**
- `src/types/internSurvey.types.ts`
- `src/models/internSurvey.ts`

### Step 2: Set up Firestore Collections
Update Firestore rules and create the data structure.

**Files to modify:**
- `firestore.rules`
- `firestore.indexes.json`

### Step 3: Create Survey Service
Build the data layer following existing patterns from `surveyService.js`.

**Files to create:**
- `src/services/internSurveyService.ts`

## Phase 1: Foundation (Days 1-2)

### Task 1: TypeScript Interfaces and Models

```typescript
// src/types/internSurvey.types.ts
export interface InternBasics {
  name: string;
  pronouns?: string;
  email: string;
  startDate?: string;
}

export interface InternSkills {
  // Technical Skills (1-5 scale)
  spreadsheet: number;
  coldEmail: number;
  dataAnalysis: number;
  contentWriting: number;
  socialMedia: number;
  webDevelopment: number;
  mobileApps: number;
  customerService: number;
  projectManagement: number;
  designTools: number;
}

export interface InternInterests {
  // Interest Areas (1-5 scale)
  sales: number;
  productQA: number;
  contentMarketing: number;
  customerSuccess: number;
  businessDevelopment: number;
  operations: number;
  analytics: number;
  userExperience: number;
}

export interface InternSurvey {
  id?: string;
  internId: string;
  basics: InternBasics;
  skills: InternSkills;
  interests: InternInterests;
  goals: string;
  selfDirectedIdeas?: string;
  logisticsBlockers?: string;
  submittedAt?: any; // Firebase Timestamp
  status: 'draft' | 'submitted' | 'processed';
}

export interface ProjectSuggestion {
  title: string;
  why: string;
  first_deliverable: string;
  confidence_score?: number;
  okr_alignment: 'sales' | 'product_qa' | 'content';
}

export interface ProjectMatch {
  id?: string;
  internId: string;
  projects: ProjectSuggestion[];
  gptPromptTokens: number;
  gptCompletionTokens: number;
  totalCost: number;
  createdAt: any; // Firebase Timestamp
  managerApproved?: boolean;
  managerNotes?: string;
  assignedProject?: string;
}
```

### Task 2: Firestore Security Rules

```javascript
// Add to firestore.rules
match /internSurveys/{internId} {
  allow read, write: if request.auth != null && 
    request.auth.uid == internId && 
    resource.data.role == 'intern';
  allow read: if request.auth != null && 
    request.auth.token.role == 'manager';
}

match /projectMatches/{internId} {
  allow read: if request.auth != null && 
    (request.auth.uid == internId || request.auth.token.role == 'manager');
  allow write: if request.auth != null && 
    request.auth.token.role == 'manager';
}
```

### Task 3: Survey Service Implementation

```typescript
// src/services/internSurveyService.ts
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { InternSurvey, ProjectMatch } from '../types/internSurvey.types';

export class InternSurveyService {
  private static COLLECTION_NAME = 'internSurveys';
  private static MATCHES_COLLECTION = 'projectMatches';

  // Save survey (with auto-save support)
  static async saveSurvey(survey: InternSurvey): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, survey.internId);
      await setDoc(docRef, {
        ...survey,
        submittedAt: survey.submittedAt || Timestamp.now()
      }, { merge: true });
    } catch (error) {
      console.error('Error saving survey:', error);
      throw error;
    }
  }

  // Get survey by intern ID
  static async getSurvey(internId: string): Promise<InternSurvey | null> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, internId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as InternSurvey;
      }
      return null;
    } catch (error) {
      console.error('Error getting survey:', error);
      throw error;
    }
  }

  // Submit final survey
  static async submitSurvey(survey: InternSurvey): Promise<void> {
    try {
      const finalSurvey = {
        ...survey,
        status: 'submitted' as const,
        submittedAt: Timestamp.now()
      };
      
      await this.saveSurvey(finalSurvey);
    } catch (error) {
      console.error('Error submitting survey:', error);
      throw error;
    }
  }

  // Save project matches
  static async saveProjectMatches(matches: ProjectMatch): Promise<void> {
    try {
      const docRef = doc(db, this.MATCHES_COLLECTION, matches.internId);
      await setDoc(docRef, {
        ...matches,
        createdAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error saving project matches:', error);
      throw error;
    }
  }

  // Get all surveys (admin only)
  static async getAllSurveys(): Promise<InternSurvey[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        orderBy('submittedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as InternSurvey[];
    } catch (error) {
      console.error('Error getting all surveys:', error);
      throw error;
    }
  }
}
```

## Phase 2: Survey UI Components (Days 3-4)

### Task 4: Create Survey Route
Add to your existing routing structure:

```tsx
// Add to your main router
<Route 
  path="/intern-survey" 
  element={
    <RequireAuth role="intern">
      <InternSurvey />
    </RequireAuth>
  } 
/>
```

### Task 5: Build Survey Components

```tsx
// src/components/intern/SurveyForm.tsx
import React, { useState, useEffect } from 'react';
import { InternSurvey } from '../../types/internSurvey.types';
import { InternSurveyService } from '../../services/internSurveyService';
import { useAuth } from '../../context/AuthContext';

export const SurveyForm: React.FC = () => {
  const { user } = useAuth();
  const [survey, setSurvey] = useState<InternSurvey>({
    internId: user?.uid || '',
    basics: { name: '', email: user?.email || '' },
    skills: {
      spreadsheet: 1,
      coldEmail: 1,
      dataAnalysis: 1,
      contentWriting: 1,
      socialMedia: 1,
      webDevelopment: 1,
      mobileApps: 1,
      customerService: 1,
      projectManagement: 1,
      designTools: 1
    },
    interests: {
      sales: 1,
      productQA: 1,
      contentMarketing: 1,
      customerSuccess: 1,
      businessDevelopment: 1,
      operations: 1,
      analytics: 1,
      userExperience: 1
    },
    goals: '',
    status: 'draft'
  });

  // Auto-save functionality
  useEffect(() => {
    const autoSave = setTimeout(() => {
      if (survey.internId) {
        InternSurveyService.saveSurvey(survey);
      }
    }, 2000);

    return () => clearTimeout(autoSave);
  }, [survey]);

  // Load existing survey on mount
  useEffect(() => {
    const loadExistingSurvey = async () => {
      if (user?.uid) {
        const existingSurvey = await InternSurveyService.getSurvey(user.uid);
        if (existingSurvey) {
          setSurvey(existingSurvey);
        }
      }
    };
    loadExistingSurvey();
  }, [user]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Survey sections will go here */}
    </div>
  );
};
```

## Phase 3: OpenAI Integration (Days 5-6)

### Task 6: OpenAI Service

```typescript
// src/services/openaiService.ts
interface OpenAIResponse {
  projects: Array<{
    title: string;
    why: string;
    first_deliverable: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenAIService {
  private static API_KEY = process.env.REACT_APP_OPENAI_API_KEY;
  private static API_URL = 'https://api.openai.com/v1/chat/completions';

  static async generateProjectSuggestions(survey: InternSurvey): Promise<OpenAIResponse> {
    const prompt = this.buildPrompt(survey);
    
    const response = await fetch(this.API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are PropAgentic\'s project allocator. Company OKRs: Sales 40%, Product QA 35%, Content 25%.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 300
      })
    });

    const data = await response.json();
    return {
      projects: JSON.parse(data.choices[0].message.content),
      usage: data.usage
    };
  }

  private static buildPrompt(survey: InternSurvey): string {
    return `
      Analyze this intern survey and return exactly 3 project suggestions as JSON.
      
      Skills (1-5 scale): ${JSON.stringify(survey.skills)}
      Interests (1-5 scale): ${JSON.stringify(survey.interests)}
      Goals: ${survey.goals}
      
      Return JSON with format:
      [
        {
          "title": "Project title",
          "why": "Brief rationale based on skills/interests",
          "first_deliverable": "Specific first deliverable"
        }
      ]
    `;
  }
}
```

## Recommended Development Sequence

1. **Start with Task 1-3** (Foundation) - Get the data layer working
2. **Build a simple survey form** - Test the data flow
3. **Add OpenAI integration** - Test the API calls
4. **Polish the UI** - Make it production-ready
5. **Add admin dashboard** - Complete the workflow

## Tools and Commands to Get Started

```bash
# Install OpenAI SDK
npm install openai

# Create the directory structure
mkdir -p src/components/intern
mkdir -p src/services
mkdir -p src/types

# Start development server
npm run start:fix
```

## Key Implementation Notes

1. **Follow existing patterns** - Your codebase already has great service patterns
2. **Use existing UI components** - Leverage your `/src/components/ui/` folder
3. **Security first** - Firestore rules are critical for this feature
4. **Mobile responsive** - Use your existing Tailwind CSS patterns
5. **Error handling** - Follow the patterns in your existing services

## Next Actions Required

1. Review and approve this implementation plan
2. Set up OpenAI API access and add API key to environment
3. Begin with the TypeScript types (Task 1)
4. Test the data flow with a simple form
5. Iterate on the OpenAI prompt engineering

Would you like me to start implementing any of these components, or do you have questions about the approach?