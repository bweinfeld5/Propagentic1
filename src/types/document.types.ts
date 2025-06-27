// Work Order Document Types Skeleton

export type DocumentCategory =
  | 'before-photos'
  | 'after-photos'
  | 'receipts'
  | 'contracts'
  | 'miscellaneous';

export interface DocumentMetadata {
  [key: string]: any;
}

export interface WorkOrderDocument {
  id: string;
  jobId: string;
  uploadedBy: string;
  uploadedAt: any; // Need to replace with Firestore Timestamp
  fileName: string;
  fileType: string;
  fileSize: number;
  category: DocumentCategory;
  url: string;
  storagePath: string;
  thumbnailUrl?: string;
  metadata: DocumentMetadata;
  tags: string[];
  notes?: string;
  isArchived: boolean;
} 