import { format, isValid, parseISO, differenceInMonths, differenceInYears } from 'date-fns';

/**
 * Safely formats a date for "Member Since" display
 * Handles Firestore Timestamps, Date objects, and string dates
 */
export const formatMemberSince = (date: any): string => {
  if (!date) return 'Not available';
  
  let dateObj: Date;
  
  try {
    if (date.toDate && typeof date.toDate === 'function') {
      // Firestore Timestamp
      dateObj = date.toDate();
    } else if (typeof date === 'string') {
      dateObj = parseISO(date);
    } else if (date instanceof Date) {
      dateObj = date;
    } else if (date.seconds) {
      // Firestore Timestamp object with seconds
      dateObj = new Date(date.seconds * 1000);
    } else {
      console.warn('Unknown date format:', date);
      return 'Invalid date';
    }
    
    return isValid(dateObj) ? format(dateObj, 'MMMM yyyy') : 'Invalid date';
  } catch (error) {
    console.error('Error formatting date:', error, date);
    return 'Invalid date';
  }
};

/**
 * Calculate account age in a human-readable format
 */
export const calculateAccountAge = (createdAt: any): string => {
  if (!createdAt) return 'Not available';
  
  try {
    let dateObj: Date;
    
    if (createdAt.toDate && typeof createdAt.toDate === 'function') {
      dateObj = createdAt.toDate();
    } else if (typeof createdAt === 'string') {
      dateObj = parseISO(createdAt);
    } else if (createdAt instanceof Date) {
      dateObj = createdAt;
    } else if (createdAt.seconds) {
      dateObj = new Date(createdAt.seconds * 1000);
    } else {
      return 'Invalid date';
    }
    
    if (!isValid(dateObj)) return 'Invalid date';
    
    const now = new Date();
    const years = differenceInYears(now, dateObj);
    const months = differenceInMonths(now, dateObj) % 12;
    
    if (years === 0 && months === 0) {
      return 'Less than a month';
    } else if (years === 0) {
      return `${months} month${months > 1 ? 's' : ''}`;
    } else if (months === 0) {
      return `${years} year${years > 1 ? 's' : ''}`;
    } else {
      return `${years} year${years > 1 ? 's' : ''}, ${months} month${months > 1 ? 's' : ''}`;
    }
  } catch (error) {
    console.error('Error calculating account age:', error, createdAt);
    return 'Invalid date';
  }
};

/**
 * Format a date for display in forms
 */
export const formatDateForInput = (date: any): string => {
  if (!date) return '';
  
  try {
    let dateObj: Date;
    
    if (date.toDate && typeof date.toDate === 'function') {
      dateObj = date.toDate();
    } else if (typeof date === 'string') {
      dateObj = parseISO(date);
    } else if (date instanceof Date) {
      dateObj = date;
    } else if (date.seconds) {
      dateObj = new Date(date.seconds * 1000);
    } else {
      return '';
    }
    
    return isValid(dateObj) ? format(dateObj, 'yyyy-MM-dd') : '';
  } catch (error) {
    console.error('Error formatting date for input:', error, date);
    return '';
  }
};

/**
 * Get the current timestamp for Firestore
 */
export const getCurrentTimestamp = () => new Date();

/**
 * Check if a date is valid
 */
export const isValidDate = (date: any): boolean => {
  if (!date) return false;
  
  try {
    let dateObj: Date;
    
    if (date.toDate && typeof date.toDate === 'function') {
      dateObj = date.toDate();
    } else if (typeof date === 'string') {
      dateObj = parseISO(date);
    } else if (date instanceof Date) {
      dateObj = date;
    } else if (date.seconds) {
      dateObj = new Date(date.seconds * 1000);
    } else {
      return false;
    }
    
    return isValid(dateObj);
  } catch (error) {
    return false;
  }
}; 