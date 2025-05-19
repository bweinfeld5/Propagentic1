/**
 * Type utility functions for safer type assertions and Firestore data conversion
 */
import { DocumentData, DocumentSnapshot, QueryDocumentSnapshot } from 'firebase/firestore';

/**
 * Safely cast a value to a specific type through an unknown intermediate step
 * This pattern is safer than direct `as T` casting
 * 
 * @param value - The value to cast
 * @returns The value cast to type T
 */
export function safeCast<T>(value: any): T {
  return value as unknown as T;
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
 * Helper to create a typed converter for Firestore
 * Use this instead of directly implementing FirestoreDataConverter
 * 
 * @param idField - The name of the ID field in the model
 * @returns A typed Firestore data converter
 */
export function createTypedConverter<T extends Record<string, any>>(idField: keyof T = 'id' as keyof T) {
  return {
    toFirestore(model: T): DocumentData {
      // Omit ID fields when saving to Firestore
      const { [idField]: id, id: docId, ...data } = model;
      
      // Filter out undefined fields
      return Object.entries(data).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);
    },
    
    fromFirestore(snapshot: QueryDocumentSnapshot): T {
      return convertSnapshot<T>(snapshot, idField as string) as T;
    }
  };
} 