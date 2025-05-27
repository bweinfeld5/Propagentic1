import { db, storage } from '../firebase/config';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs,
  Timestamp 
} from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';

export interface Document {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: Date;
  expirationDate?: Date;
  status: 'active' | 'expired' | 'pending';
  userId: string;
  documentType: 'license' | 'certification' | 'insurance' | 'other';
  metadata: {
    size: number;
    contentType: string;
    lastModified: number;
  };
}

export interface DocumentInput {
  name: string;
  type: string;
  url: string;
  expirationDate?: Date;
  documentType: Document['documentType'];
  metadata: {
    size: number;
    contentType: string;
    lastModified: number;
  };
}

class DocumentService {
  private readonly collectionName = 'contractor_documents';

  async addDocument(userId: string, documentData: DocumentInput): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.collectionName), {
        ...documentData,
        userId,
        uploadedAt: Timestamp.now(),
        status: 'pending',
        expirationDate: documentData.expirationDate ? Timestamp.fromDate(documentData.expirationDate) : null
      });

      return docRef.id;
    } catch (error) {
      console.error('Error adding document:', error);
      throw error;
    }
  }

  async updateDocument(documentId: string, updates: Partial<Document>): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, documentId);
      const updateData: any = { ...updates };
      
      // Convert Date objects to Timestamps
      if (updates.expirationDate) {
        updateData.expirationDate = Timestamp.fromDate(updates.expirationDate);
      }
      if (updates.uploadedAt) {
        updateData.uploadedAt = Timestamp.fromDate(updates.uploadedAt);
      }

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  }

  async deleteDocument(documentId: string, storageUrl: string): Promise<void> {
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, this.collectionName, documentId));
      
      // Delete from Storage
      const storageRef = ref(storage, storageUrl);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  async getUserDocuments(userId: string): Promise<Document[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      const documents: Document[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        documents.push({
          id: doc.id,
          ...data,
          uploadedAt: data.uploadedAt.toDate(),
          expirationDate: data.expirationDate ? data.expirationDate.toDate() : undefined
        } as Document);
      });

      return documents;
    } catch (error) {
      console.error('Error getting user documents:', error);
      throw error;
    }
  }

  async getExpiringDocuments(userId: string, daysThreshold: number = 30): Promise<Document[]> {
    try {
      const allDocs = await this.getUserDocuments(userId);
      const now = new Date();
      const threshold = new Date();
      threshold.setDate(now.getDate() + daysThreshold);

      return allDocs.filter(doc => {
        if (!doc.expirationDate) return false;
        return doc.expirationDate <= threshold;
      });
    } catch (error) {
      console.error('Error getting expiring documents:', error);
      throw error;
    }
  }

  async updateExpirationDate(documentId: string, newDate: Date): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, documentId);
      await updateDoc(docRef, {
        expirationDate: Timestamp.fromDate(newDate),
        status: newDate > new Date() ? 'active' : 'expired'
      });
    } catch (error) {
      console.error('Error updating expiration date:', error);
      throw error;
    }
  }

  async updateDocumentStatus(documentId: string, status: Document['status']): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, documentId);
      await updateDoc(docRef, { status });
    } catch (error) {
      console.error('Error updating document status:', error);
      throw error;
    }
  }
}

export const documentService = new DocumentService(); 