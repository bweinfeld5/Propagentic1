/**
 * API Abstraction Layer for Firebase Firestore interactions
 *
 * This service provides a centralized and type-safe way to interact with Firestore,
 * abstracting the direct Firebase SDK calls and integrating our TypeUtils for
 * robust data handling.
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit, // Renamed to avoid conflict with QueryOptions.limit
  startAfter,
  getCountFromServer,
  writeBatch,
  runTransaction as firebaseRunTransaction, // Renamed to avoid shadowing
  serverTimestamp,
  CollectionReference,
  DocumentReference,
  FirestoreErrorCode,
  QueryConstraint,
  WhereFilterOp,
  OrderByDirection,
  Transaction as FirebaseTransaction, // Import Firebase Transaction type
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import {
  exists,
} from '../utils/TypeUtils';
import { z, ZodSchema, ZodObject, ZodRawShape } from 'zod'; // Import ZodObject and ZodRawShape for finer control if needed

// Define a generic error type for API operations
export interface ApiError {
  code: FirestoreErrorCode | 'custom';
  message: string;
  originalError?: unknown;
}

// Generic type for Firestore document with an ID
// T here represents the data part of the document, excluding id.
export type FirestoreDocument<T> = T & { id: string };

// Options for querying collections
export interface QueryOptions {
  filters?: QueryFilter[];
  sort?: QuerySort;
  limit?: number; // Positive number
  startAfter?: unknown; // Should be a DocumentSnapshot or field value
}

export interface QueryFilter {
  field: string;
  operator: WhereFilterOp;
  value: unknown;
}

export interface QuerySort {
  field: string;
  direction?: OrderByDirection;
}

/**
 * Standardized error handling for API operations.
 * This is a standalone function to avoid `this` context issues.
 */
function handleApiError(error: unknown, defaultMessage: string): ApiError {
  const err = error as any; // Temporary cast to access potential FirebaseError properties
  if (err.code && typeof err.code === 'string' && err.message) {
    return {
      code: err.code as FirestoreErrorCode,
      message: err.message,
      originalError: error,
    };
  }
  return {
    code: 'custom',
    message: defaultMessage,
    originalError: error,
  };
}

/**
 * Main API service object
 */
export const api = {
  /**
   * Get a document by its ID from a specified collection.
   */
  async getById<T extends Record<string, unknown>>(
    collectionPath: string,
    id: string,
    schema?: ZodSchema<T> // Schema for T (data part of the document)
  ): Promise<FirestoreDocument<T> | null> {
    try {
      const docRef = doc(db, collectionPath, id) as DocumentReference<T>;
      const snapshot = await getDoc(docRef);
      
      if (!snapshot.exists()) {
        return null;
      }
      
      const docData = snapshot.data() as T; // Data from Firestore

      if (schema) {
        const validationResult = schema.safeParse(docData);
        if (!validationResult.success) {
          console.warn(`Zod validation failed for document ${id} in ${collectionPath}:`, validationResult.error.issues);
          return null; 
        }
        // Combine validated data with the document ID
        return { id: snapshot.id, ...validationResult.data } as FirestoreDocument<T>;
      }
      // If no schema, combine raw data with ID
      return { id: snapshot.id, ...docData } as FirestoreDocument<T>;
    } catch (error: unknown) {
      console.error(`Error getting document ${id} from ${collectionPath}:`, error);
      throw handleApiError(error, `Failed to get document ${id} from ${collectionPath}.`);
    }
  },

  /**
   * Get all documents from a collection, with optional query parameters.
   */
  async getAll<T extends Record<string, unknown>>(
    collectionPath: string,
    queryOptions?: QueryOptions,
    schema?: ZodSchema<T> // Schema for T (data part of each document)
  ): Promise<FirestoreDocument<T>[]> {
    try {
      const collRef = collection(db, collectionPath) as CollectionReference<T>;
      const constraints: QueryConstraint[] = [];

      if (queryOptions?.filters) {
        queryOptions.filters.forEach(f => constraints.push(where(f.field, f.operator, f.value)));
      }
      if (queryOptions?.sort) {
        constraints.push(orderBy(queryOptions.sort.field, queryOptions.sort.direction));
      }
      if (queryOptions?.limit && queryOptions.limit > 0) {
        constraints.push(firestoreLimit(queryOptions.limit));
      }
      if (queryOptions?.startAfter) {
        constraints.push(startAfter(queryOptions.startAfter));
      }

      const q = query(collRef, ...constraints);
      const snapshot = await getDocs(q);
      
      const results = snapshot.docs
        .map(docSnap => {
          if (!docSnap.exists()) {
            return null;
          }
          const docData = docSnap.data() as T; // Data from Firestore

          if (schema) {
            const validationResult = schema.safeParse(docData);
            if (!validationResult.success) {
              console.warn(`Zod validation failed for a document in ${collectionPath} (id: ${docSnap.id}):`, validationResult.error.issues);
              return null; 
            }
            // Combine validated data with the document ID
            return { id: docSnap.id, ...validationResult.data } as FirestoreDocument<T>;
          }
          // If no schema, combine raw data with ID
          return { id: docSnap.id, ...docData } as FirestoreDocument<T>;
        })
        .filter(exists);
      return results;
    } catch (error: unknown) {
      console.error(`Error getting documents from ${collectionPath}:`, error);
      throw handleApiError(error, `Failed to get documents from ${collectionPath}.`);
    }
  },

  /**
   * Create a new document in a specified collection.
   */
  async create<S extends ZodSchema<any>>(
    collectionPath: string,
    data: z.infer<S>,
    schema: S,
    createdByUid?: string | null
  ): Promise<string> {
    try {
      const validationResult = schema.safeParse(data);
      if (!validationResult.success) {
        console.error('Zod validation failed on create:', validationResult.error.issues);
        throw handleApiError(validationResult.error, 'Invalid data provided for creation.');
      }

      const collRef = collection(db, collectionPath);
      const docDataForCreate = {
        ...validationResult.data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: createdByUid === undefined ? (auth.currentUser?.uid || null) : createdByUid,
      };
      
      const docRef = await addDoc(collRef, docDataForCreate);
      return docRef.id;
    } catch (error: unknown) {
      if ((error as ApiError).code) throw error;
      console.error(`Error creating document in ${collectionPath}:`, error);
      throw handleApiError(error, `Failed to create document in ${collectionPath}.`);
    }
  },

  /**
   * Create a new document with a specific ID or update if it exists (set operation).
   */
  async set<T extends Record<string, unknown>, S extends ZodSchema<T>>(
    collectionPath: string,
    id: string,
    data: z.infer<S>,
    schema: S,
    merge: boolean = false,
    updatedByUid?: string | null
  ): Promise<void> {
    try {
      const validationResult = schema.safeParse(data);
      if (!validationResult.success) {
        console.error('Zod validation failed on set:', validationResult.error.issues);
        throw handleApiError(validationResult.error, 'Invalid data provided for set operation.');
      }

      const docRef = doc(db, collectionPath, id);
      const dataToSet = {
        ...validationResult.data,
        updatedAt: serverTimestamp(),
      };
      await setDoc(docRef, dataToSet, { merge });
    } catch (error: unknown) {
      if ((error as ApiError).code) throw error;
      console.error(`Error setting document ${id} in ${collectionPath}:`, error);
      throw handleApiError(error, `Failed to set document ${id} in ${collectionPath}.`);
    }
  },

  /**
   * Update an existing document in a specified collection.
   */
  async update<S extends ZodSchema<any>>(
    collectionPath: string,
    id: string,
    data: Partial<z.infer<S>>, // Make data parameter Partial
    schema: S, // The schema for the full document type
    updatedByUid?: string | null
  ): Promise<void> {
    try {
      let effectiveSchema: ZodSchema<any> = schema;
      // If the schema is a ZodObject, use its partial version for validation
      if (schema instanceof ZodObject) {
        effectiveSchema = schema.partial();
      }

      // Validate the incoming partial data against the (potentially partial) schema
      const validationResult = effectiveSchema.safeParse(data);
      if (!validationResult.success) {
        console.error('Zod validation failed on update:', validationResult.error.issues);
        throw handleApiError(validationResult.error, 'Invalid data provided for update.');
      }
      // Ensure there's actually data to update after validation
      if (Object.keys(validationResult.data).length === 0) {
        console.warn(`Update called for ${collectionPath}/${id} with no valid fields after Zod parsing. Skipping Firestore update.`);
        return;
      }

      const docRef = doc(db, collectionPath, id);
      const dataToUpdate = {
        ...validationResult.data, // Use the validated (and potentially transformed) data
        updatedAt: serverTimestamp(),
        // updatedBy: updatedByUid === undefined ? (auth.currentUser?.uid || null) : updatedByUid, // Add if audit field is desired
      };
      await updateDoc(docRef, dataToUpdate);
    } catch (error: unknown) {
      if ((error as ApiError).code) throw error;
      console.error(`Error updating document ${id} in ${collectionPath}:`, error);
      throw handleApiError(error, `Failed to update document ${id} in ${collectionPath}.`);
    }
  },

  /**
   * Delete a document from a specified collection.
   */
  async delete(collectionPath: string, id: string): Promise<void> {
    try {
      const docRef = doc(db, collectionPath, id);
      await deleteDoc(docRef);
    } catch (error: unknown) {
      console.error(`Error deleting document ${id} from ${collectionPath}:`, error);
      throw handleApiError(error, `Failed to delete document ${id} from ${collectionPath}.`);
    }
  },

  /**
   * Get the count of documents in a collection, with optional filters.
   */
  async getCount(
    collectionPath: string,
    queryOptions?: Pick<QueryOptions, 'filters'>
  ): Promise<number> {
    try {
      const collRef = collection(db, collectionPath);
      const constraints: QueryConstraint[] = [];
      if (queryOptions?.filters) {
        queryOptions.filters.forEach(f => constraints.push(where(f.field, f.operator, f.value)));
      }
      const q = query(collRef, ...constraints);
      const snapshot = await getCountFromServer(q);
      return snapshot.data().count;
    } catch (error: unknown) {
      console.error(`Error getting count from ${collectionPath}:`, error);
      throw handleApiError(error, `Failed to get count from ${collectionPath}.`);
    }
  },

  /**
   * Execute a batch write operation.
   */
  async batchWrite(operations: (batch: ReturnType<typeof writeBatch>) => void): Promise<void> {
    const batch = writeBatch(db);
    try {
      operations(batch);
      await batch.commit();
    } catch (error: unknown) {
      console.error('Error performing batch write:', error);
      throw handleApiError(error, 'Batch write operation failed.');
    }
  },

  /**
   * Run a Firestore transaction.
   */
  async runTransaction<TResult>(
    updateFunction: (transaction: FirebaseTransaction) => Promise<TResult>
  ): Promise<TResult> {
    try {
      return await firebaseRunTransaction(db, updateFunction);
    } catch (error: unknown) {
      console.error('Error performing transaction:', error);
      throw handleApiError(error, 'Transaction failed.');
    }
  },
  
  /**
   * Create a DocumentReference and ensure its ID is available.
   * If an ID is provided, it's used. Otherwise, a new ID is generated.
   * Always returns an object: { id: string; ref: DocumentReference }.
   */
  createDocRef(collectionPath: string, id?: string): { id: string; ref: DocumentReference } {
    let docId: string;
    let docRef: DocumentReference;

    if (typeof id === 'string') {
      docId = id;
      docRef = doc(db, collectionPath, docId);
    } else {
      // Create a new ref with an auto-generated ID
      const newDocRef = doc(collection(db, collectionPath)); 
      docId = newDocRef.id;
      docRef = newDocRef;
    }
    return { id: docId, ref: docRef };
  },
};

export default api;