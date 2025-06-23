/**
 * Validation Utilities - PropAgentic
 * 
 * Utility functions for validating form inputs
 */

/**
 * Validate an email address
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate a password
 * - At least 8 characters
 * - Contains at least one uppercase letter
 * - Contains at least one lowercase letter
 * - Contains at least one number
 */
export const validatePassword = (password: string): boolean => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
};

/**
 * Get password strength score (0-4)
 * 0 = Very weak, 1 = Weak, 2 = Medium, 3 = Strong, 4 = Very strong
 */
export const getPasswordStrength = (password: string): number => {
  let score = 0;
  
  // Length check
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  
  // Complexity checks
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  
  // Normalize to 0-4 scale
  return Math.min(4, Math.floor(score / 1.5));
};

/**
 * Validate a phone number (basic validation)
 */
export const validatePhone = (phone: string): boolean => {
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  // Check if it has at least 10 digits
  return digitsOnly.length >= 10;
};

/**
 * Format a phone number as (XXX) XXX-XXXX
 */
export const formatPhone = (phone: string): string => {
  const digitsOnly = phone.replace(/\D/g, '');
  
  if (digitsOnly.length < 10) return phone;
  
  const areaCode = digitsOnly.substring(0, 3);
  const prefix = digitsOnly.substring(3, 6);
  const lineNumber = digitsOnly.substring(6, 10);
  
  return `(${areaCode}) ${prefix}-${lineNumber}`;
};

/**
 * Validate a ZIP code (US)
 */
export const validateZipCode = (zipCode: string): boolean => {
  const zipRegex = /^\d{5}(-\d{4})?$/;
  return zipRegex.test(zipCode);
};

/**
 * Validate required field is not empty
 */
export const validateRequired = (value: string): boolean => {
  return value.trim().length > 0;
};

const validation = {
  validateEmail,
  validatePassword,
  getPasswordStrength,
  validatePhone,
  formatPhone,
  validateZipCode,
  validateRequired
};

export default validation; 