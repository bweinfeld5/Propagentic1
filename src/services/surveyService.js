import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit,
  doc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';

const COLLECTION_NAME = 'internSurveys';

/**
 * Submit intern survey data to Firestore
 * @param {Object} surveyData - The survey form data
 * @returns {Promise<string>} - Document ID of the created survey
 */
export const submitInternSurvey = async (surveyData) => {
  try {
    // Validate required fields
    const requiredFields = ['fullName', 'email', 'university', 'major', 'graduationYear', 'whyPropAgentic'];
    const missingFields = requiredFields.filter(field => !surveyData[field] || surveyData[field].trim() === '');
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Check if email already exists
    const existingSubmission = await checkExistingSubmission(surveyData.email);
    if (existingSubmission) {
      throw new Error('A survey has already been submitted with this email address.');
    }

    // Prepare data for submission
    const submissionData = {
      ...surveyData,
      submittedAt: serverTimestamp(),
      status: 'submitted',
      reviewStatus: 'pending',
      // Add metadata
      metadata: {
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        source: 'web-form'
      }
    };

    // Submit to Firestore
    const docRef = await addDoc(collection(db, COLLECTION_NAME), submissionData);
    
    console.log('Survey submitted successfully with ID:', docRef.id);
    return docRef.id;
    
  } catch (error) {
    console.error('Error submitting survey:', error);
    throw error;
  }
};

/**
 * Check if a survey has already been submitted with the given email
 * @param {string} email - Email address to check
 * @returns {Promise<boolean>} - True if submission exists
 */
export const checkExistingSubmission = async (email) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('email', '==', email.toLowerCase().trim()),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
    
  } catch (error) {
    console.error('Error checking existing submission:', error);
    return false; // Allow submission if check fails
  }
};

/**
 * Get all survey submissions (admin function)
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - Array of survey submissions
 */
export const getAllSurveySubmissions = async (options = {}) => {
  try {
    const {
      orderByField = 'submittedAt',
      orderDirection = 'desc',
      limitCount = 50,
      status = null
    } = options;

    let q = query(
      collection(db, COLLECTION_NAME),
      orderBy(orderByField, orderDirection),
      limit(limitCount)
    );

    // Add status filter if provided
    if (status) {
      q = query(
        collection(db, COLLECTION_NAME),
        where('reviewStatus', '==', status),
        orderBy(orderByField, orderDirection),
        limit(limitCount)
      );
    }

    const querySnapshot = await getDocs(q);
    const submissions = [];
    
    querySnapshot.forEach((doc) => {
      submissions.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return submissions;
    
  } catch (error) {
    console.error('Error fetching survey submissions:', error);
    throw error;
  }
};

/**
 * Update survey review status (admin function)
 * @param {string} surveyId - Document ID
 * @param {string} status - New status ('pending', 'reviewed', 'accepted', 'rejected')
 * @param {string} notes - Optional review notes
 * @returns {Promise<void>}
 */
export const updateSurveyStatus = async (surveyId, status, notes = '') => {
  try {
    const docRef = doc(db, COLLECTION_NAME, surveyId);
    await updateDoc(docRef, {
      reviewStatus: status,
      reviewNotes: notes,
      reviewedAt: serverTimestamp(),
      reviewedBy: 'admin' // You might want to get this from auth context
    });
    
    console.log('Survey status updated successfully');
    
  } catch (error) {
    console.error('Error updating survey status:', error);
    throw error;
  }
};

/**
 * Validate survey data before submission
 * @param {Object} surveyData - Survey form data
 * @returns {Object} - Validation result with isValid and errors
 */
export const validateSurveyData = (surveyData) => {
  const errors = [];
  
  // Required field validation
  const requiredFields = {
    fullName: 'Full Name',
    email: 'Email Address',
    university: 'University',
    major: 'Major/Field of Study',
    graduationYear: 'Graduation Year',
    whyPropAgentic: 'Why PropAgentic'
  };
  
  Object.entries(requiredFields).forEach(([field, label]) => {
    if (!surveyData[field] || surveyData[field].trim() === '') {
      errors.push(`${label} is required`);
    }
  });
  
  // Email validation
  if (surveyData.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(surveyData.email)) {
      errors.push('Please enter a valid email address');
    }
  }
  
  // Phone validation (if provided)
  if (surveyData.phone && surveyData.phone.trim() !== '') {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleanPhone = surveyData.phone.replace(/[\s\-\(\)]/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      errors.push('Please enter a valid phone number');
    }
  }
  
  // URL validation for portfolio, github, linkedin
  const urlFields = ['portfolio', 'github', 'linkedin'];
  urlFields.forEach(field => {
    if (surveyData[field] && surveyData[field].trim() !== '') {
      try {
        new URL(surveyData[field]);
      } catch {
        errors.push(`Please enter a valid URL for ${field}`);
      }
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export default {
  submitInternSurvey,
  checkExistingSubmission,
  getAllSurveySubmissions,
  updateSurveyStatus,
  validateSurveyData
}; 