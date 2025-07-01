# 🚀 **Intern Project: Work-Order Document Management System**

## 📋 **Project Overview**

**Duration:** 4-5 weeks  
**Difficulty:** Intermediate-Advanced  
**Tech Stack:** Firebase Functions (TypeScript), React TypeScript, Firestore, Firebase Storage  
**Mentorship:** Weekly 1:1s + daily standup check-ins

### **Business Context**
You're building PropAgentic's document management backbone - the system that handles all work order documents, photos, receipts, and completion certificates. Currently, documents are scattered and hard to track, creating inefficiencies for landlords and contractors.

---

## 🎯 **Learning Objectives**

By completing this project, you will learn:
- **File Upload Systems**: Firebase Storage, multi-file handling, image optimization
- **Document Management**: File organization, metadata tracking, version control
- **Backend Development**: Cloud Functions, TypeScript, complex data relationships
- **Frontend Development**: React file uploads, drag-and-drop, image galleries
- **Security**: File access control, secure URL generation, content validation

---

# 📋 **Epic 2: Work-Order Document Management System**

## 🎯 **Epic Overview**
**As a landlord and contractor**, I want to upload, organize, and access work order documents so that I can maintain proper records and track job progress with supporting documentation.

**Epic Points:** 21  
**Priority:** High ⭐⭐⭐⭐⭐  
**Sprint:** Sprint 2-3 (Week 3-6)  
**Assignee:** Full-Stack Developer Intern

---

## ✅ **Epic Acceptance Criteria**

### 1. Document Upload & Storage
- [ ] Multiple file upload (images, PDFs, documents)
- [ ] Automatic file organization by work order ID
- [ ] File validation and security scanning
- [ ] Progress tracking for large uploads

### 2. Document Categorization & Metadata
- [ ] Document type classification (before/after photos, receipts, contracts)
- [ ] Automatic metadata extraction (timestamp, location, file info)
- [ ] Custom tagging and notes system
- [ ] Version control for document updates

### 3. Access Control & Security
- [ ] Role-based document access (landlord, contractor, tenant)
- [ ] Secure URL generation with expiration
- [ ] Document download tracking and audit logs
- [ ] Privacy controls for sensitive documents

---

## 📋 **Story Breakdown**

### **Story 2.1: Document Upload Infrastructure** ⚙️
**Story Points:** 8  
**Duration:** Week 1-2

#### **Goal**
Create the foundational document upload system with Firebase Storage integration and basic file management.

#### **Scope of Work**

**Backend**
- Extend `documentService.ts` with `uploadWorkOrderDocument` & `organizeDocumentsByJob`
- Create Cloud Functions (`uploadDocument`, `processDocument`) in `documentManagement.ts`
- Implement file validation, virus scanning, and metadata extraction

**Storage Architecture**
```
/work-orders/{jobId}/
  ├── before-photos/
  ├── after-photos/
  ├── receipts/
  ├── contracts/
  └── miscellaneous/
```

**Security & Validation**
- File type validation (images, PDFs only)
- File size limits (10MB per file, 100MB per job)
- Malware scanning integration
- Automatic image compression and thumbnail generation

#### **Technical Tasks**

##### **Task 2.1.1: Document Service Foundation** ⚙️
**Estimated Time:** 6 hours  
**Files to Create/Modify:**
- `src/services/firestore/documentService.ts` (enhance existing)
- `src/models/Document.ts` (new)
- `src/types/document.types.ts` (new)

**Implementation Details:**
```typescript
interface WorkOrderDocument {
  id: string;
  jobId: string;
  uploadedBy: string;
  uploadedAt: Timestamp;
  fileName: string;
  fileType: string;
  fileSize: number;
  category: DocumentCategory;
  url: string;
  thumbnailUrl?: string;
  metadata: DocumentMetadata;
  tags: string[];
  notes?: string;
  isArchived: boolean;
}

enum DocumentCategory {
  BEFORE_PHOTO = 'before_photo',
  AFTER_PHOTO = 'after_photo',
  RECEIPT = 'receipt',
  CONTRACT = 'contract',
  PROGRESS_PHOTO = 'progress_photo',
  MISCELLANEOUS = 'miscellaneous'
}

class DocumentService {
  async uploadWorkOrderDocument(
    file: File, 
    jobId: string, 
    category: DocumentCategory,
    metadata?: Partial<DocumentMetadata>
  ): Promise<WorkOrderDocument> {
    // Validate file type and size
    // Generate unique filename
    // Upload to Firebase Storage
    // Create thumbnail for images
    // Save metadata to Firestore
    // Return document record
  }

  async getDocumentsByJob(jobId: string): Promise<WorkOrderDocument[]> {
    // Query documents by jobId
    // Apply user access permissions
    // Return sorted by category and date
  }

  async deleteDocument(documentId: string, userId: string): Promise<void> {
    // Validate user permissions
    // Delete from Storage
    // Remove from Firestore
    // Log deletion for audit
  }
}
```

**Acceptance Criteria:**
- [ ] Single and multiple file upload support
- [ ] Automatic file organization by category
- [ ] Proper error handling for failed uploads
- [ ] File validation and security checks
- [ ] Metadata extraction and storage

##### **Task 2.1.2: Firebase Storage Integration** 🔌
**Estimated Time:** 4 hours  
**Files to Create/Modify:**
- `functions/src/documentManagement.ts` (new)
- `functions/src/imageProcessing.ts` (new)
- `functions/src/index.ts`

**Implementation Details:**
```typescript
// Cloud Function for document processing
export const processUploadedDocument = functions.storage.object().onFinalize(async (object) => {
  const { name, bucket, contentType, size } = object;
  
  // Extract jobId and category from file path
  // Generate thumbnail for images
  // Extract metadata (EXIF data, etc.)
  // Run security scanning
  // Update Firestore with processed info
  // Send notification to relevant users
});

export const generateSecureDocumentUrl = functions.https.onCall(async (data, context) => {
  const { documentId } = data;
  
  // Validate user access permissions
  // Generate signed URL with expiration
  // Log access for audit trail
  // Return secure URL
});
```

**Acceptance Criteria:**
- [ ] Automatic thumbnail generation for images
- [ ] Metadata extraction from uploaded files
- [ ] Secure URL generation with access control
- [ ] File processing status tracking
- [ ] Error handling for processing failures

---

### **Story 2.2: Document Organization & Categorization** 📂
**Story Points:** 5  
**Duration:** Week 2

#### **Goal**
Implement smart document categorization, tagging system, and advanced organization features.

#### **Scope of Work**

**Smart Categorization**
- AI-powered document type detection
- Automatic before/after photo sequencing
- Receipt OCR and data extraction
- Custom category creation

**Tagging & Search**
- Manual and automatic tagging
- Full-text search across documents
- Filter by date range, category, uploader
- Advanced search with metadata

#### **Technical Tasks**

##### **Task 2.2.1: AI Document Classification** 🤖
**Estimated Time:** 4 hours  
**Files to Create/Modify:**
- `src/services/ai/documentClassifier.ts` (new)
- `functions/src/documentAI.ts` (new)

**Implementation Details:**
```typescript
class DocumentClassifier {
  async classifyDocument(imageUrl: string): Promise<{
    category: DocumentCategory;
    confidence: number;
    detectedObjects: string[];
    suggestedTags: string[];
  }> {
    // Use Google Vision API or custom ML model
    // Detect if image shows damage, repair work, receipts, etc.
    // Return classification with confidence score
  }

  async extractReceiptData(imageUrl: string): Promise<{
    total: number;
    vendor: string;
    date: Date;
    items: ReceiptItem[];
  }> {
    // OCR processing for receipts
    // Extract structured data
    // Return parsed receipt information
  }
}
```

**Acceptance Criteria:**
- [ ] Automatic document type detection
- [ ] Receipt data extraction with OCR
- [ ] Confidence scoring for classifications
- [ ] Manual override for incorrect classifications
- [ ] Suggested tags based on content analysis

##### **Task 2.2.2: Advanced Search & Filtering** 🔍
**Estimated Time:** 3 hours  
**Files to Create/Modify:**
- `src/components/documents/DocumentSearch.tsx` (new)
- `src/hooks/useDocumentSearch.ts` (new)

**Implementation Details:**
```typescript
interface SearchFilters {
  jobId?: string;
  category?: DocumentCategory[];
  dateRange?: { start: Date; end: Date };
  uploadedBy?: string[];
  tags?: string[];
  searchText?: string;
}

const useDocumentSearch = () => {
  const [documents, setDocuments] = useState<WorkOrderDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});

  const searchDocuments = useCallback(async (newFilters: SearchFilters) => {
    setLoading(true);
    try {
      // Build Firestore query with filters
      // Execute search with pagination
      // Apply client-side text search if needed
      // Update results
    } catch (error) {
      // Handle search errors
    } finally {
      setLoading(false);
    }
  }, []);

  return { documents, loading, searchDocuments, filters, setFilters };
};
```

**Acceptance Criteria:**
- [ ] Multi-criteria search and filtering
- [ ] Real-time search results
- [ ] Pagination for large result sets
- [ ] Search result highlighting
- [ ] Saved search preferences

---

### **Story 2.3: Frontend Document Management UI** 🖥️
**Story Points:** 8  
**Duration:** Week 3-4

#### **Goal**
Create intuitive document management interface with drag-and-drop uploads, gallery views, and mobile-responsive design.

#### **Scope of Work**

**Upload Interface**
- Drag-and-drop file upload zone
- Progress tracking for multiple uploads
- Preview thumbnails before upload
- Batch category assignment

**Document Gallery**
- Grid and list view options
- Lightbox for image viewing
- Document preview for PDFs
- Sorting and filtering controls

#### **Technical Tasks**

##### **Task 2.3.1: File Upload Component** 📤
**Estimated Time:** 6 hours  
**Files to Create/Modify:**
- `src/components/documents/DocumentUploader.tsx` (new)
- `src/components/documents/FileDropZone.tsx` (new)
- `src/hooks/useFileUpload.ts` (new)

**Implementation Details:**
```typescript
interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}

const DocumentUploader: React.FC<{
  jobId: string;
  onUploadComplete: (documents: WorkOrderDocument[]) => void;
}> = ({ jobId, onUploadComplete }) => {
  const [uploadQueue, setUploadQueue] = useState<UploadProgress[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleFilesDrop = useCallback((files: FileList) => {
    // Validate files
    // Add to upload queue
    // Start batch upload process
  }, []);

  const uploadFiles = useCallback(async (files: File[]) => {
    // Process files one by one or in parallel
    // Update progress for each file
    // Handle errors gracefully
    // Notify on completion
  }, []);

  return (
    <div className="document-uploader">
      <FileDropZone
        onFilesDrop={handleFilesDrop}
        isDragging={isDragging}
        setIsDragging={setIsDragging}
      />
      <UploadProgressList uploads={uploadQueue} />
      <CategorySelector />
      <TagsInput />
    </div>
  );
};
```

**Acceptance Criteria:**
- [ ] Drag-and-drop file upload
- [ ] Multiple file selection
- [ ] Upload progress tracking
- [ ] Error handling with retry options
- [ ] Mobile-responsive design

##### **Task 2.3.2: Document Gallery Component** 🖼️
**Estimated Time:** 5 hours  
**Files to Create/Modify:**
- `src/components/documents/DocumentGallery.tsx` (new)
- `src/components/documents/DocumentCard.tsx` (new)
- `src/components/documents/DocumentLightbox.tsx` (new)

**Implementation Details:**
```typescript
const DocumentGallery: React.FC<{
  jobId: string;
  initialCategory?: DocumentCategory;
}> = ({ jobId, initialCategory }) => {
  const { documents, loading, searchDocuments } = useDocumentSearch();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedDocument, setSelectedDocument] = useState<WorkOrderDocument | null>(null);

  return (
    <div className="document-gallery">
      <DocumentToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onSearch={searchDocuments}
      />
      
      <DocumentGrid
        documents={documents}
        viewMode={viewMode}
        onDocumentClick={setSelectedDocument}
      />

      {selectedDocument && (
        <DocumentLightbox
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
          onNext={() => {/* Navigate to next document */}}
          onPrevious={() => {/* Navigate to previous document */}}
        />
      )}
    </div>
  );
};
```

**Acceptance Criteria:**
- [ ] Grid and list view modes
- [ ] Document preview and lightbox
- [ ] Smooth animations and transitions
- [ ] Keyboard navigation support
- [ ] Context menus for document actions

---

## 🧪 **Testing Requirements**

### **Unit Tests**
**Files to Create:**
- `__tests__/services/documentService.test.ts`
- `__tests__/components/DocumentUploader.test.tsx`
- `__tests__/hooks/useFileUpload.test.ts`

**Test Cases:**
```typescript
describe('Document Management System', () => {
  describe('Document Upload', () => {
    test('should upload single file successfully', async () => {
      // Mock file upload
      // Verify file is stored in correct location
      // Check metadata is saved correctly
    });

    test('should handle upload failures gracefully', async () => {
      // Mock upload failure
      // Verify error handling
      // Check retry mechanism
    });

    test('should validate file types and sizes', async () => {
      // Test file validation
      // Verify rejected files
      // Check error messages
    });
  });

  describe('Document Organization', () => {
    test('should categorize documents correctly', async () => {
      // Test automatic categorization
      // Verify manual category assignment
      // Check category changes
    });

    test('should search documents by filters', async () => {
      // Test various search filters
      // Verify result accuracy
      // Check pagination
    });
  });
});
```

### **Integration Tests**
**Files to Create:**
- `__tests__/integration/documentWorkflow.test.ts`

**Test Scenarios:**
```typescript
describe('End-to-End Document Workflow', () => {
  test('complete document lifecycle', async () => {
    // Upload document
    // Verify processing
    // Test categorization
    // Check search functionality
    // Verify access controls
    // Test deletion
  });
});
```

---

## 📊 **Definition of Done Checklist**

### ✅ **Functionality**
- [ ] Multiple file upload working
- [ ] Document categorization implemented
- [ ] Search and filtering functional
- [ ] Gallery view responsive
- [ ] Access controls enforced

### ✅ **Performance**
- [ ] Upload progress tracking
- [ ] Image optimization and thumbnails
- [ ] Lazy loading for large galleries
- [ ] Efficient search queries

### ✅ **Security**
- [ ] File validation and scanning
- [ ] Access control by user role
- [ ] Secure URL generation
- [ ] Audit logging implemented

### ✅ **Testing**
- [ ] Unit tests >85% coverage
- [ ] Integration tests passing
- [ ] Manual testing completed
- [ ] Performance testing done

---

## 🔄 **Dependencies & Blockers**

### **Prerequisites:**
- [x] Firebase Storage configured
- [x] Job/Work Order system existing
- [x] User authentication working
- [x] Basic file upload infrastructure

### **Potential Blockers:**
- [ ] **Risk**: Large file upload timeouts
  - **Mitigation**: Implement chunked uploads
- [ ] **Risk**: Storage costs for large files
  - **Mitigation**: Implement compression and cleanup policies
- [ ] **Risk**: AI classification accuracy
  - **Mitigation**: Provide manual override options

---

## 📈 **Success Metrics**

### **Functional Metrics:**
- [ ] Documents upload successfully >98% of time
- [ ] Search results returned within 2 seconds
- [ ] File processing completed within 30 seconds
- [ ] Zero unauthorized document access

### **Performance Metrics:**
- [ ] Upload speed >1MB/second
- [ ] Gallery loads within 3 seconds
- [ ] Thumbnail generation <10 seconds
- [ ] Search response time <500ms

### **Quality Metrics:**
- [ ] Zero data loss incidents
- [ ] AI classification accuracy >80%
- [ ] User satisfaction score >4.5/5
- [ ] Support tickets <1% of uploads

---

## 🚀 **Implementation Notes**

### **Key Considerations:**
1. **Storage Optimization**: Implement automatic image compression and cleanup policies
2. **Scalability**: Design for thousands of documents per job
3. **Mobile Support**: Ensure upload works on mobile devices
4. **Offline Capability**: Consider offline upload queue for poor connections

### **Future Enhancements:**
- OCR text extraction for searchability
- Document version control and history
- Automated document expiration policies
- Integration with third-party document services
- Advanced AI features (damage assessment, cost estimation)

---

## 🎯 **Deliverables**

### **Code Deliverables:**
- [ ] Complete document management service
- [ ] Cloud Functions for processing
- [ ] React components for UI
- [ ] Comprehensive test suite
- [ ] Updated security rules

### **Documentation:**
- [ ] API documentation
- [ ] User guide for document management
- [ ] Deployment instructions
- [ ] Performance optimization guide

### **Demo Requirements:**
- [ ] Live demo of upload workflow
- [ ] Document search and filtering demo
- [ ] Mobile responsiveness showcase
- [ ] Security features demonstration

---

## 📚 **Required Reading**
Before starting this project, review these files to understand the current architecture:

**Essential Files:**
- `src/services/firestore/documentService.ts` - Current document handling
- `src/components/maintenance/EnhancedMaintenanceForm.tsx` - File upload patterns
- `functions/src/classifyMaintenanceRequest.ts` - AI integration examples
- `firestore.rules` - Current security implementation

**Architecture Documents:**
- `SECURITY_RULES_IMPLEMENTATION.md` - Security patterns
- `PHASE2_MAINTENANCE_IMPLEMENTATION_SUMMARY.md` - Current system overview

---

This comprehensive project will give your intern hands-on experience with file management, cloud storage, AI integration, and complex frontend development while delivering real business value to PropAgentic's work order system.
