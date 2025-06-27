/**
 * Utility functions for generating and validating invite codes
 */

/**
 * Generate a random 8-character alphanumeric invite code
 * @returns {string} 8-character uppercase code
 */
export const generateInviteCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  // Ensure first character is a letter for better readability
  result += chars.charAt(Math.floor(Math.random() * 26));
  
  // Generate remaining 7 characters
  for (let i = 1; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};

/**
 * Generate a unique invite code that doesn't exist in the database
 * @param {Function} checkExistence - Function that checks if code exists in DB
 * @param {number} maxAttempts - Maximum attempts to generate unique code
 * @returns {Promise<string>} Unique 8-character code
 */
export const generateUniqueInviteCode = async (checkExistence, maxAttempts = 10) => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateInviteCode();
    const exists = await checkExistence(code);
    
    if (!exists) {
      return code;
    }
  }
  
  throw new Error(`Failed to generate unique invite code after ${maxAttempts} attempts`);
};

/**
 * Validate invite code format
 * @param {string} code - Code to validate
 * @returns {boolean} True if valid format
 */
export const isValidInviteCodeFormat = (code) => {
  if (!code || typeof code !== 'string') return false;
  
  // Must be exactly 8 characters, alphanumeric, uppercase
  const codeRegex = /^[A-Z0-9]{8}$/;
  return codeRegex.test(code.trim().toUpperCase());
};

/**
 * Normalize invite code (trim, uppercase)
 * @param {string} code - Raw code input
 * @returns {string} Normalized code
 */
export const normalizeInviteCode = (code) => {
  if (!code || typeof code !== 'string') return '';
  return code.trim().toUpperCase();
}; 