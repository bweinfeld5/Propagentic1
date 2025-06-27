// Work Order Document Service Skeleton
import { db, storage } from '../../firebase/config';
import { collection, addDoc, query, where, getDocs, Timestamp, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { WorkOrderDocument } from '../../models/Document';

class WorkOrderDocumentService {
  /**
   * Upload a work order document to Firebase Storage and save metadata to Firestore
   * @param jobId - The work order/job ID
   * @param category - Document category (e.g., 'before-photos')
   * @param file - File object (from input)
   * @param uploadedBy - User ID of uploader
   * @param tags - Optional tags
   * @param notes - Optional notes
   * @returns The created WorkOrderDocument object
   */
  async uploadWorkOrderDocument({
    jobId,
    category,
    file,
    uploadedBy,
    tags = [],
    notes = ''
  }: {
    jobId: string;
    category: string;
    file: File;
    uploadedBy: string;
    tags?: string[];
    notes?: string;
  }): Promise<WorkOrderDocument> {
    // 1. Upload file to Storage
    const fileName = `${Date.now()}_${file.name}`;
    const storagePath = `work-orders/${jobId}/${category}/${fileName}`;
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    await new Promise<void>((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        () => {},
        (error) => reject(error),
        () => resolve()
      );
    });

    // 2. Get download URL
    const url = await getDownloadURL(storageRef);

    // 3. Prepare metadata
    const metadata = {
      size: file.size,
      contentType: file.type,
      lastModified: file.lastModified
    };

    // 4. Save document record to Firestore
    const docRef = await addDoc(collection(db, 'workOrderDocuments'), {
      jobId,
      uploadedBy,
      uploadedAt: Timestamp.now(),
      fileName,
      fileType: file.type,
      fileSize: file.size,
      category,
      url,
      storagePath,
      metadata,
      tags,
      notes,
      isArchived: false
    });

    // 5. Return the created document object
    return {
      id: docRef.id,
      jobId,
      uploadedBy,
      uploadedAt: Timestamp.now(),
      fileName,
      fileType: file.type,
      fileSize: file.size,
      category: category as import('../../types/document.types').DocumentCategory,
      url,
      metadata,
      tags,
      notes,
      isArchived: false
    };
  }

  /**
   * Get all documents for a given job ID
   */
  async getJobDocuments(jobId: string): Promise<WorkOrderDocument[]> {
    const q = query(collection(db, 'workOrderDocuments'), where('jobId', '==', jobId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        uploadedAt: data.uploadedAt?.toDate?.() || data.uploadedAt,
        category: data.category as import('../../types/document.types').DocumentCategory,
      } as WorkOrderDocument;
    });
  }

  async organizeDocumentsByJob(/* jobId: string */): Promise<any> {
    // TODO: Implement organization logic
  }

  /**
   * Delete a work order document from Firestore and Storage
   */
  async deleteWorkOrderDocument(docId: string, storagePath: string): Promise<void> {
    // Delete from Firestore
    await deleteDoc(doc(db, 'workOrderDocuments', docId));
    // Delete from Storage
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
  }

  /**
   * Update tags and notes for a work order document
   */
  async updateDocumentMetadata(docId: string, updates: { tags?: string[]; notes?: string }): Promise<void> {
    await updateDoc(doc(db, 'workOrderDocuments', docId), updates);
  }
}

export const workOrderDocumentService = new WorkOrderDocumentService(); 