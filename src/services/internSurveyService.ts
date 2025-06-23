/**
 * Intern Survey Service
 * Handles all data operations for the intern survey and project matching feature
 */

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc,
  deleteDoc,
  query, 
  where, 
  orderBy,
  Timestamp,
  writeBatch,
  onSnapshot,
  Unsubscribe,
  QueryDocumentSnapshot,
  DocumentSnapshot
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { 
  InternSurvey, 
  ProjectMatch, 
  InternSummary,
  AdminDashboardData,
  AdminActivity,
  SurveyValidationError,
  VALIDATION_RULES
} from '../types/internSurvey.types';

export class InternSurveyService {
  private static SURVEYS_COLLECTION = 'internSurveys';
  private static MATCHES_COLLECTION = 'projectMatches';
  private static ACTIVITIES_COLLECTION = 'adminActivities';

  // ==================== SURVEY OPERATIONS ====================

  /**
   * Save or update a survey (supports auto-save)
   */
  static async saveSurvey(survey: InternSurvey): Promise<void> {
    try {
      const docRef = doc(db, this.SURVEYS_COLLECTION, survey.internId);
      const timestamp = Timestamp.now();
      
      const surveyData = {
        ...survey,
        updatedAt: timestamp,
        createdAt: survey.createdAt || timestamp
      };

      await setDoc(docRef, surveyData, { merge: true });
    } catch (error) {
      console.error('Error saving survey:', error);
      throw new Error('Failed to save survey. Please try again.');
    }
  }

  /**
   * Get survey by intern ID
   */
  static async getSurvey(internId: string): Promise<InternSurvey | null> {
    try {
      const docRef = doc(db, this.SURVEYS_COLLECTION, internId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as InternSurvey;
      }
      return null;
    } catch (error) {
      console.error('Error getting survey:', error);
      throw new Error('Failed to load survey. Please refresh the page.');
    }
  }

  /**
   * Submit final survey and trigger project generation
   */
  static async submitSurvey(survey: InternSurvey): Promise<void> {
    try {
      // Validate survey before submission
      const validationErrors = this.validateSurvey(survey);
      if (validationErrors.length > 0) {
        throw new Error(`Survey validation failed: ${validationErrors.map(e => e.message).join(', ')}`);
      }

      const finalSurvey: InternSurvey = {
        ...survey,
        status: 'submitted',
        submittedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      // Use batch write for atomicity
      const batch = writeBatch(db);
      
      // Update survey
      const surveyRef = doc(db, this.SURVEYS_COLLECTION, survey.internId);
      batch.set(surveyRef, finalSurvey);
      
      // Add activity log
      const activityRef = doc(collection(db, this.ACTIVITIES_COLLECTION));
      const activity: AdminActivity = {
        id: activityRef.id,
        type: 'survey_submitted',
        internId: survey.internId,
        internName: survey.basics.name,
        timestamp: Timestamp.now(),
        details: `Survey submitted for ${survey.basics.name}`
      };
      batch.set(activityRef, activity);
      
      await batch.commit();
    } catch (error) {
      console.error('Error submitting survey:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to submit survey. Please try again.');
    }
  }

  /**
   * Delete a survey (admin only)
   */
  static async deleteSurvey(internId: string): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      // Delete survey
      const surveyRef = doc(db, this.SURVEYS_COLLECTION, internId);
      batch.delete(surveyRef);
      
      // Delete associated project matches
      const matchRef = doc(db, this.MATCHES_COLLECTION, internId);
      batch.delete(matchRef);
      
      await batch.commit();
    } catch (error) {
      console.error('Error deleting survey:', error);
      throw new Error('Failed to delete survey.');
    }
  }

  // ==================== PROJECT MATCH OPERATIONS ====================

  /**
   * Save project matches from AI generation
   */
  static async saveProjectMatches(matches: ProjectMatch): Promise<void> {
    try {
      const docRef = doc(db, this.MATCHES_COLLECTION, matches.internId);
      const matchData = {
        ...matches,
        createdAt: Timestamp.now(),
        managerReviewed: false,
        status: 'pending' as const
      };

      // Use batch for atomicity
      const batch = writeBatch(db);
      
      // Save project matches
      batch.set(docRef, matchData);
      
      // Update survey status
      const surveyRef = doc(db, this.SURVEYS_COLLECTION, matches.internId);
      batch.update(surveyRef, { 
        status: 'processed',
        updatedAt: Timestamp.now()
      });
      
      // Add activity log
      const activityRef = doc(collection(db, this.ACTIVITIES_COLLECTION));
      const activity: AdminActivity = {
        id: activityRef.id,
        type: 'projects_generated',
        internId: matches.internId,
        internName: '', // Will be filled by the calling function
        timestamp: Timestamp.now(),
        details: `Generated ${matches.projects.length} project suggestions`
      };
      batch.set(activityRef, activity);
      
      await batch.commit();
    } catch (error) {
      console.error('Error saving project matches:', error);
      throw new Error('Failed to save project suggestions.');
    }
  }

  /**
   * Get project matches by intern ID
   */
  static async getProjectMatches(internId: string): Promise<ProjectMatch | null> {
    try {
      const docRef = doc(db, this.MATCHES_COLLECTION, internId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as ProjectMatch;
      }
      return null;
    } catch (error) {
      console.error('Error getting project matches:', error);
      throw new Error('Failed to load project suggestions.');
    }
  }

  /**
   * Update project match status (manager workflow)
   */
  static async updateProjectMatchStatus(
    internId: string, 
    status: ProjectMatch['status'],
    managerNotes?: string,
    assignedProject?: string,
    managerId?: string
  ): Promise<void> {
    try {
      const docRef = doc(db, this.MATCHES_COLLECTION, internId);
      const updateData: Partial<ProjectMatch> = {
        status,
        managerReviewed: true,
        managerApproved: status === 'approved' || status === 'assigned',
        ...(managerNotes && { managerNotes }),
        ...(assignedProject && { assignedProject }),
        ...(status === 'assigned' && { 
          assignedAt: Timestamp.now(),
          assignedBy: managerId 
        })
      };

      await updateDoc(docRef, updateData);

      // Update survey status if project is assigned
      if (status === 'assigned') {
        const surveyRef = doc(db, this.SURVEYS_COLLECTION, internId);
        await updateDoc(surveyRef, { 
          status: 'assigned',
          updatedAt: Timestamp.now()
        });
      }
    } catch (error) {
      console.error('Error updating project match status:', error);
      throw new Error('Failed to update project status.');
    }
  }

  // ==================== ADMIN OPERATIONS ====================

  /**
   * Get all surveys for admin dashboard
   */
  static async getAllSurveys(): Promise<InternSurvey[]> {
    try {
      const q = query(
        collection(db, this.SURVEYS_COLLECTION),
        orderBy('submittedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc: QueryDocumentSnapshot) => ({
        id: doc.id,
        ...doc.data()
      })) as InternSurvey[];
    } catch (error) {
      console.error('Error getting all surveys:', error);
      throw new Error('Failed to load surveys.');
    }
  }

  /**
   * Get all project matches for admin dashboard
   */
  static async getAllProjectMatches(): Promise<ProjectMatch[]> {
    try {
      const q = query(
        collection(db, this.MATCHES_COLLECTION),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc: QueryDocumentSnapshot) => ({
        id: doc.id,
        ...doc.data()
      })) as ProjectMatch[];
    } catch (error) {
      console.error('Error getting all project matches:', error);
      throw new Error('Failed to load project matches.');
    }
  }

  /**
   * Get admin dashboard data (combined view)
   */
  static async getAdminDashboardData(): Promise<AdminDashboardData> {
    try {
      const [surveys, matches, activities] = await Promise.all([
        this.getAllSurveys(),
        this.getAllProjectMatches(),
        this.getRecentActivities(10)
      ]);

      // Create intern summaries
      const internSummaries: InternSummary[] = surveys.map(survey => {
        const match = matches.find(m => m.internId === survey.internId);
        return {
          internId: survey.internId,
          name: survey.basics.name,
          email: survey.basics.email,
          submittedAt: survey.submittedAt,
          status: survey.status,
          hasProjectMatches: !!match,
          matchStatus: match?.status,
          assignedProject: match?.assignedProject
        };
      });

      // Calculate statistics
      const totalInterns = surveys.length;
      const pendingReview = matches.filter(m => m.status === 'pending').length;
      const approved = matches.filter(m => m.status === 'approved').length;
      const assigned = matches.filter(m => m.status === 'assigned').length;

      return {
        totalInterns,
        pendingReview,
        approved,
        assigned,
        interns: internSummaries,
        recentActivity: activities
      };
    } catch (error) {
      console.error('Error getting admin dashboard data:', error);
      throw new Error('Failed to load dashboard data.');
    }
  }

  /**
   * Get recent activities for admin dashboard
   */
  static async getRecentActivities(limit: number = 10): Promise<AdminActivity[]> {
    try {
      const q = query(
        collection(db, this.ACTIVITIES_COLLECTION),
        orderBy('timestamp', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs
        .slice(0, limit)
        .map((doc: QueryDocumentSnapshot) => ({
          id: doc.id,
          ...doc.data()
        })) as AdminActivity[];
    } catch (error) {
      console.error('Error getting recent activities:', error);
      return []; // Return empty array instead of throwing to avoid breaking dashboard
    }
  }

  // ==================== REAL-TIME SUBSCRIPTIONS ====================

  /**
   * Subscribe to survey changes (for real-time updates)
   */
  static subscribeToSurveyChanges(
    internId: string,
    callback: (survey: InternSurvey | null) => void
  ): Unsubscribe {
    const docRef = doc(db, this.SURVEYS_COLLECTION, internId);
    
    return onSnapshot(
      docRef,
      (doc: DocumentSnapshot) => {
        if (doc.exists()) {
          callback({ id: doc.id, ...doc.data() } as InternSurvey);
        } else {
          callback(null);
        }
      },
      (error: Error) => {
        console.error('Error in survey subscription:', error);
        callback(null);
      }
    );
  }

  /**
   * Subscribe to admin dashboard changes
   */
  static subscribeToAdminDashboard(
    callback: (data: AdminDashboardData) => void
  ): Unsubscribe {
    const surveysQuery = query(
      collection(db, this.SURVEYS_COLLECTION),
      orderBy('submittedAt', 'desc')
    );
    
    return onSnapshot(
      surveysQuery,
      async () => {
        try {
          const dashboardData = await this.getAdminDashboardData();
          callback(dashboardData);
        } catch (error) {
          console.error('Error updating admin dashboard:', error);
        }
      },
      (error: Error) => {
        console.error('Error in admin dashboard subscription:', error);
      }
    );
  }

  // ==================== VALIDATION ====================

  /**
   * Validate survey data before submission
   */
  static validateSurvey(survey: InternSurvey): SurveyValidationError[] {
    const errors: SurveyValidationError[] = [];

    // Validate required fields
    if (!survey.basics.name?.trim()) {
      errors.push({ field: 'basics.name', message: 'Name is required' });
    }

    if (!survey.basics.email?.trim()) {
      errors.push({ field: 'basics.email', message: 'Email is required' });
    } else if (!this.isValidEmail(survey.basics.email)) {
      errors.push({ field: 'basics.email', message: 'Please enter a valid email address' });
    }

    if (!survey.goals?.trim()) {
      errors.push({ field: 'goals', message: 'Career goals are required' });
    } else if (survey.goals.length > VALIDATION_RULES.MAX_TEXT_LENGTH) {
      errors.push({ 
        field: 'goals', 
        message: `Goals must be ${VALIDATION_RULES.MAX_TEXT_LENGTH} characters or less` 
      });
    }

    // Validate skill ratings
    Object.entries(survey.skills).forEach(([skill, rating]) => {
      if (rating < VALIDATION_RULES.MIN_SKILL_RATING || rating > VALIDATION_RULES.MAX_SKILL_RATING) {
        errors.push({ 
          field: `skills.${skill}`, 
          message: `Skill rating must be between ${VALIDATION_RULES.MIN_SKILL_RATING} and ${VALIDATION_RULES.MAX_SKILL_RATING}` 
        });
      }
    });

    // Validate interest ratings
    Object.entries(survey.interests).forEach(([interest, rating]) => {
      if (rating < VALIDATION_RULES.MIN_INTEREST_RATING || rating > VALIDATION_RULES.MAX_INTEREST_RATING) {
        errors.push({ 
          field: `interests.${interest}`, 
          message: `Interest rating must be between ${VALIDATION_RULES.MIN_INTEREST_RATING} and ${VALIDATION_RULES.MAX_INTEREST_RATING}` 
        });
      }
    });

    // Validate optional text fields length
    if (survey.selfDirectedIdeas && survey.selfDirectedIdeas.length > VALIDATION_RULES.MAX_TEXT_LENGTH) {
      errors.push({ 
        field: 'selfDirectedIdeas', 
        message: `Self-directed ideas must be ${VALIDATION_RULES.MAX_TEXT_LENGTH} characters or less` 
      });
    }

    if (survey.logisticsBlockers && survey.logisticsBlockers.length > VALIDATION_RULES.MAX_TEXT_LENGTH) {
      errors.push({ 
        field: 'logisticsBlockers', 
        message: `Logistics blockers must be ${VALIDATION_RULES.MAX_TEXT_LENGTH} characters or less` 
      });
    }

    return errors;
  }

  /**
   * Validate email format
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Generate default survey structure for new interns
   */
  static createDefaultSurvey(internId: string, email?: string): InternSurvey {
    return {
      internId,
      basics: {
        name: '',
        email: email || '',
        pronouns: '',
        startDate: '',
        phoneNumber: ''
      },
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
      selfDirectedIdeas: '',
      logisticsBlockers: '',
      status: 'draft',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
  }

  /**
   * Calculate survey completion percentage
   */
  static calculateCompletionPercentage(survey: InternSurvey): number {
    let completed = 0;
    let total = 0;

    // Basic information (4 fields, 2 required)
    total += 2;
    if (survey.basics.name?.trim()) completed++;
    if (survey.basics.email?.trim()) completed++;

    // Skills (10 fields, all should be > 1 for meaningful completion)
    total += 10;
    Object.values(survey.skills).forEach(rating => {
      if (rating > 1) completed++;
    });

    // Interests (8 fields, all should be > 1 for meaningful completion)
    total += 8;
    Object.values(survey.interests).forEach(rating => {
      if (rating > 1) completed++;
    });

    // Text fields (1 required)
    total += 1;
    if (survey.goals?.trim()) completed++;

    return Math.round((completed / total) * 100);
  }
}

export default InternSurveyService;