/**
 * TypeScript interfaces for Intern Survey → Project-Matcher feature
 * Defines all data structures for survey collection, project matching, and admin management
 */

export interface InternBasics {
  name: string;
  pronouns?: string;
  email: string;
  startDate?: string;
  phoneNumber?: string;
}

export interface InternSkills {
  // Technical Skills (1-5 scale: 1=No experience, 5=Expert)
  spreadsheet: number;           // Excel, Google Sheets, data manipulation
  coldEmail: number;             // Outreach, email campaigns, lead generation
  dataAnalysis: number;          // Analytics, reporting, insights
  contentWriting: number;        // Blog posts, copy, documentation
  socialMedia: number;           // Social media management, content creation
  webDevelopment: number;        // HTML, CSS, JavaScript, web technologies
  mobileApps: number;           // Mobile app development, testing
  customerService: number;       // Support, communication, problem-solving
  projectManagement: number;     // Planning, coordination, delivery
  designTools: number;          // Figma, Photoshop, UI/UX design
}

export interface InternInterests {
  // Interest Areas (1-5 scale: 1=Not interested, 5=Very interested)
  sales: number;                // Lead generation, outreach, conversion
  productQA: number;            // Testing, quality assurance, user experience
  contentMarketing: number;     // Blog posts, social media, SEO
  customerSuccess: number;      // Support, onboarding, retention
  businessDevelopment: number;  // Partnerships, strategy, growth
  operations: number;           // Process improvement, efficiency
  analytics: number;            // Data analysis, reporting, insights
  userExperience: number;       // UX research, design, usability
}

export interface InternSurvey {
  id?: string;
  internId: string;
  basics: InternBasics;
  skills: InternSkills;
  interests: InternInterests;
  goals: string;                    // Career goals and learning objectives (max 300 chars)
  selfDirectedIdeas?: string;       // Self-directed project ideas (max 300 chars)
  logisticsBlockers?: string;       // Any blockers or constraints (max 300 chars)
  submittedAt?: any;               // Firebase Timestamp
  status: 'draft' | 'submitted' | 'processed' | 'assigned';
  createdAt?: any;                 // Firebase Timestamp
  updatedAt?: any;                 // Firebase Timestamp
}

export interface ProjectSuggestion {
  title: string;
  why: string;                     // Brief rationale based on skills/interests
  first_deliverable: string;       // Specific first deliverable or milestone
  confidence_score?: number;       // AI confidence in match (0-1)
  okr_alignment: 'sales' | 'product_qa' | 'content'; // Primary OKR alignment
  estimated_duration?: string;     // e.g., "2-3 weeks", "1 month"
  required_skills?: string[];      // Key skills needed for success
  learning_opportunities?: string[]; // What the intern will learn
}

export interface ProjectMatch {
  id?: string;
  internId: string;
  surveyId?: string;              // Reference to the survey
  projects: ProjectSuggestion[];
  gptPromptTokens: number;
  gptCompletionTokens: number;
  totalCost: number;              // Cost in USD
  model: string;                  // AI model used (e.g., "gpt-4o-mini")
  createdAt: any;                 // Firebase Timestamp
  
  // Manager workflow fields
  managerReviewed: boolean;
  managerApproved?: boolean;
  managerNotes?: string;
  assignedProject?: string;       // Title of the assigned project
  assignedAt?: any;              // Firebase Timestamp
  assignedBy?: string;           // Manager user ID
  
  // Status tracking
  status: 'pending' | 'reviewed' | 'approved' | 'assigned' | 'rejected';
}

// Form validation interfaces
export interface SurveyValidationError {
  field: string;
  message: string;
}

export interface SurveyFormState {
  currentSection: number;
  isValid: boolean;
  errors: SurveyValidationError[];
  isDirty: boolean;
  autoSaveEnabled: boolean;
  lastSaved?: Date;
}

// API request/response interfaces
export interface GenerateProjectsRequest {
  internId: string;
  survey: InternSurvey;
  options?: {
    numProjects?: number;        // Number of projects to generate (default: 3)
    includeConfidence?: boolean; // Include confidence scores
    model?: string;             // AI model to use
  };
}

export interface GenerateProjectsResponse {
  success: boolean;
  projects?: ProjectSuggestion[];
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
  cost?: number;
  error?: string;
  requestId?: string;
}

// Admin dashboard interfaces
export interface InternSummary {
  internId: string;
  name: string;
  email: string;
  submittedAt: any;
  status: InternSurvey['status'];
  hasProjectMatches: boolean;
  matchStatus?: ProjectMatch['status'];
  assignedProject?: string;
}

export interface AdminDashboardData {
  totalInterns: number;
  pendingReview: number;
  approved: number;
  assigned: number;
  interns: InternSummary[];
  recentActivity: AdminActivity[];
}

export interface AdminActivity {
  id: string;
  type: 'survey_submitted' | 'projects_generated' | 'manager_reviewed' | 'project_assigned';
  internId: string;
  internName: string;
  timestamp: any;
  details?: string;
}

// Utility types for form handling
export type SkillKey = keyof InternSkills;
export type InterestKey = keyof InternInterests;
export type SurveySection = 'basics' | 'skills' | 'interests' | 'goals' | 'ideas' | 'blockers';

// Constants for validation
export const SKILL_LABELS: Record<SkillKey, string> = {
  spreadsheet: 'Spreadsheets & Data',
  coldEmail: 'Cold Email & Outreach',
  dataAnalysis: 'Data Analysis',
  contentWriting: 'Content Writing',
  socialMedia: 'Social Media',
  webDevelopment: 'Web Development',
  mobileApps: 'Mobile Apps',
  customerService: 'Customer Service',
  projectManagement: 'Project Management',
  designTools: 'Design Tools'
};

export const INTEREST_LABELS: Record<InterestKey, string> = {
  sales: 'Sales & Lead Generation',
  productQA: 'Product QA & Testing',
  contentMarketing: 'Content Marketing',
  customerSuccess: 'Customer Success',
  businessDevelopment: 'Business Development',
  operations: 'Operations',
  analytics: 'Analytics & Insights',
  userExperience: 'User Experience'
};

export const OKR_WEIGHTS = {
  sales: 0.4,
  product_qa: 0.35,
  content: 0.25
} as const;

export const VALIDATION_RULES = {
  MAX_TEXT_LENGTH: 300,
  MIN_SKILL_RATING: 1,
  MAX_SKILL_RATING: 5,
  MIN_INTEREST_RATING: 1,
  MAX_INTEREST_RATING: 5,
  REQUIRED_FIELDS: ['name', 'email', 'goals'] as const
} as const;