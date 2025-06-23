/**
 * Type utility functions for safer type assertions and Firestore data conversion
 */
import { DocumentData, DocumentSnapshot, QueryDocumentSnapshot, FirestoreDataConverter } from 'firebase/firestore';

/**
 * TypeScript utility functions for safer type conversion and validation
 * Used in Firestore converters and service operations
 */

/**
 * Safely cast unknown data to a specific type with runtime validation
 * This helps prevent runtime errors from invalid Firestore data
 */
export function safeCast<T>(data: any): T {
  try {
    // Basic validation - ensure data is an object
    if (data === null || data === undefined) {
      throw new Error('Data is null or undefined');
    }

    if (typeof data !== 'object') {
      throw new Error('Data is not an object');
    }

    // Return the data as the target type
    // In a production app, you might want more sophisticated validation here
    return data as T;
  } catch (error) {
    console.error('Safe cast error:', error);
    throw new Error(`Failed to cast data to target type: ${error}`);
  }
}

/**
 * Convert Firestore document data to a typed model with proper ID fields
 * 
 * @param data - The document data from Firestore
 * @param docId - The document ID
 * @param idField - The name of the ID field in the model (defaults to 'id')
 * @returns The document data with ID fields properly set
 */
export function convertDocumentData<T extends Record<string, any>>(
  data: DocumentData,
  docId: string,
  idField: string = 'id'
): T {
  // Create a new object with the document data and ID fields
  const result = {
    ...data,
    [idField]: docId,
    id: docId
  };
  
  // Use the safe cast pattern
  return safeCast<T>(result);
}

/**
 * Convert a Firestore document snapshot to a typed model
 * 
 * @param snapshot - The document snapshot
 * @param idField - The name of the ID field in the model (defaults to 'id')
 * @returns The typed model or null if the document doesn't exist
 */
export function convertSnapshot<T extends Record<string, any>>(
  snapshot: DocumentSnapshot | QueryDocumentSnapshot,
  idField: string = 'id'
): T | null {
  if (!snapshot.exists()) {
    return null;
  }
  
  return convertDocumentData<T>(snapshot.data(), snapshot.id, idField);
}

/**
 * Type guard to check if a value exists (not null or undefined)
 * 
 * @param value - The value to check
 * @returns True if the value exists
 */
export function exists<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type guard to check if an array has items
 * 
 * @param arr - The array to check
 * @returns True if the array exists and has at least one item
 */
export function hasItems<T>(arr: T[] | null | undefined): arr is T[] {
  return Boolean(arr && arr.length > 0);
}

/**
 * Create a typed Firestore converter with better error handling
 */
export function createTypedConverter<T>(
  toFirestore: (data: T) => DocumentData,
  fromFirestore: (data: DocumentData, id: string) => T
): FirestoreDataConverter<T> {
  return {
    toFirestore: (data: T): DocumentData => {
      try {
        return toFirestore(data);
      } catch (error) {
        console.error('Error in toFirestore conversion:', error);
        throw new Error(`Failed to convert to Firestore: ${error}`);
      }
    },
    fromFirestore: (snapshot: any, options?: any): T => {
      try {
        const data = snapshot.data(options);
        return fromFirestore(data, snapshot.id);
      } catch (error) {
        console.error('Error in fromFirestore conversion:', error);
        throw new Error(`Failed to convert from Firestore: ${error}`);
      }
    }
  };
}

/**
 * Validate that an object has required properties
 */
export function validateRequiredProperties<T>(
  obj: any, 
  requiredProps: (keyof T)[]
): { isValid: boolean; missingProps: string[] } {
  const missingProps: string[] = [];
  
  for (const prop of requiredProps) {
    if (!(prop in obj) || obj[prop] === undefined || obj[prop] === null) {
      missingProps.push(prop as string);
    }
  }
  
  return {
    isValid: missingProps.length === 0,
    missingProps
  };
}

/**
 * Safely get a nested property from an object
 */
export function safeGet<T>(obj: any, path: string, defaultValue?: T): T | undefined {
  try {
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current === null || current === undefined || !(key in current)) {
        return defaultValue;
      }
      current = current[key];
    }
    
    return current as T;
  } catch (error) {
    console.error('Safe get error:', error);
    return defaultValue;
  }
}

/**
 * Type guard to check if a value is a valid string
 */
export function isValidString(value: any): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Type guard to check if a value is a valid number
 */
export function isValidNumber(value: any): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Type guard to check if a value is a valid boolean
 */
export function isValidBoolean(value: any): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Type guard to check if a value is a valid array
 */
export function isValidArray<T>(value: any): value is T[] {
  return Array.isArray(value);
}

/**
 * Type guard to check if a value is a valid object (not null, not array)
 */
export function isValidObject(value: any): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Convert unknown value to string with fallback
 */
export function toString(value: any, fallback: string = ''): string {
  if (isValidString(value)) {
    return value;
  }
  
  if (value === null || value === undefined) {
    return fallback;
  }
  
  try {
    return String(value);
  } catch (error) {
    console.error('Error converting to string:', error);
    return fallback;
  }
}

/**
 * Convert unknown value to number with fallback
 */
export function toNumber(value: any, fallback: number = 0): number {
  if (isValidNumber(value)) {
    return value;
  }
  
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && isFinite(parsed)) {
      return parsed;
    }
  }
  
  return fallback;
}

/**
 * Convert unknown value to boolean with fallback
 */
export function toBoolean(value: any, fallback: boolean = false): boolean {
  if (isValidBoolean(value)) {
    return value;
  }
  
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    if (lower === 'true' || lower === '1' || lower === 'yes') {
      return true;
    }
    if (lower === 'false' || lower === '0' || lower === 'no') {
      return false;
    }
  }
  
  if (typeof value === 'number') {
    return value !== 0;
  }
  
  return fallback;
}

/**
 * Convert unknown value to array with fallback
 */
export function toArray<T>(value: any, fallback: T[] = []): T[] {
  if (isValidArray<T>(value)) {
    return value;
  }
  
  if (value === null || value === undefined) {
    return fallback;
  }
  
  // If it's a single value, wrap it in an array
  try {
    return [value as T];
  } catch (error) {
    console.error('Error converting to array:', error);
    return fallback;
  }
}

/**
 * Sanitize user input to prevent XSS and other attacks
 */
export function sanitizeInput(input: any): string {
  if (!isValidString(input)) {
    return '';
  }
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

/**
 * Validate email format
 */
export function isValidEmail(email: any): email is string {
  if (!isValidString(email)) {
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format (basic)
 */
export function isValidPhone(phone: any): phone is string {
  if (!isValidString(phone)) {
    return false;
  }
  
  // Remove all non-digit characters for validation
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

/**
 * Deep clone an object (simple implementation)
 */
export function deepClone<T>(obj: T): T {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (error) {
    console.error('Deep clone error:', error);
    throw new Error('Failed to deep clone object');
  }
}

/**
 * Merge objects safely
 */
export function safeMerge<T extends Record<string, any>>(
  target: T, 
  source: Partial<T>
): T {
  try {
    const result = { ...target };
    
    for (const key in source) {
      if (source.hasOwnProperty(key) && source[key] !== undefined) {
        result[key] = source[key]!;
      }
    }
    
    return result;
  } catch (error) {
    console.error('Safe merge error:', error);
    return target;
  }
}

/**
 * Format timestamp to readable string
 */
export function formatTimestamp(timestamp: any): string {
  try {
    let date: Date;
    
    if (timestamp && typeof timestamp.toDate === 'function') {
      // Firestore Timestamp
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else if (typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else {
      return 'Invalid date';
    }
    
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    return date.toLocaleString();
  } catch (error) {
    console.error('Format timestamp error:', error);
    return 'Invalid date';
  }
}

/**
 * Generate a random ID (simple implementation)
 */
export function generateId(prefix?: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2);
  const id = `${timestamp}${random}`;
  
  return prefix ? `${prefix}_${id}` : id;
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
} 