import { db, storage } from '../firebase/config';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs,
  getDoc,
  query, 
  where, 
  orderBy,
  Timestamp,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { ref, getDownloadURL, getMetadata } from 'firebase/storage';

export interface DocumentVerificationResult {
  isValid: boolean;
  confidence: number;
  extractedData: Record<string, any>;
  issues: string[];
  recommendations: string[];
}

export interface ContractorDocument {
  id: string;
  contractorId: string;
  documentType: 'license' | 'insurance' | 'certification' | 'identification' | 'other';
  name: string;
  url: string;
  uploadedAt: Date;
  expirationDate?: Date;
  status: 'active' | 'expired' | 'pending';
  verificationStatus: 'pending' | 'approved' | 'rejected' | 'requires_review';
  verificationResult?: DocumentVerificationResult;
  rejectionReason?: string;
  verifiedBy?: string;
  verifiedAt?: Date;
  metadata: {
    size: number;
    contentType: string;
    extractedText?: string;
  };
}

export interface VerificationRequest {
  id: string;
  contractorId: string;
  documentId: string;
  documentType: string;
  documentUrl: string;
  requestedAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  priority: 'high' | 'medium' | 'low';
  assignedTo?: string;
  completedAt?: Date;
  automatedResult?: DocumentVerificationResult;
}

class DocumentVerificationService {
  private documentsCollection = 'contractorDocuments';
  private verificationsCollection = 'verificationRequests';
  private auditCollection = 'verificationAudit';

  // Document validation rules
  private validationRules: Record<string, {
    required: string[];
    maxAge: number;
    minConfidence: number;
  }> = {
    license: {
      required: ['licenseNumber', 'expirationDate', 'issuingAuthority'],
      maxAge: 365, // days
      minConfidence: 0.8
    },
    insurance: {
      required: ['policyNumber', 'coverageAmount', 'expirationDate', 'carrier'],
      maxAge: 30, // days
      minConfidence: 0.85
    },
    identification: {
      required: ['idNumber', 'expirationDate', 'fullName'],
      maxAge: 1825, // 5 years
      minConfidence: 0.9
    },
    certification: {
      required: ['certificationNumber', 'issuingOrganization'],
      maxAge: 1095, // 3 years
      minConfidence: 0.7
    }
  };

  /**
   * Store uploaded document and create verification request
   */
  async storeDocument(
    contractorId: string, 
    documentType: string, 
    name: string, 
    url: string, 
    metadata: any,
    expirationDate?: Date
  ): Promise<string> {
    try {
      // Create document record
      const docData: Omit<ContractorDocument, 'id'> = {
        contractorId,
        documentType: documentType as any,
        name,
        url,
        uploadedAt: new Date(),
        expirationDate,
        status: 'pending',
        verificationStatus: 'pending',
        metadata: {
          size: metadata.size,
          contentType: metadata.type
        }
      };

      const docRef = await addDoc(collection(db, this.documentsCollection), {
        ...docData,
        uploadedAt: serverTimestamp(),
        expirationDate: expirationDate ? Timestamp.fromDate(expirationDate) : null
      });

      // Create verification request
      await this.createVerificationRequest(contractorId, docRef.id, documentType, url);

      // Log audit trail
      await this.logAuditEvent(contractorId, 'document_uploaded', {
        documentId: docRef.id,
        documentType,
        name
      });

      return docRef.id;
    } catch (error) {
      console.error('Error storing document:', error);
      throw new Error('Failed to store document');
    }
  }

  /**
   * Create verification request with priority assignment
   */
  private async createVerificationRequest(
    contractorId: string,
    documentId: string,
    documentType: string,
    documentUrl: string
  ): Promise<void> {
    const priority = this.getDocumentPriority(documentType);
    
    const verificationRequest: Omit<VerificationRequest, 'id'> = {
      contractorId,
      documentId,
      documentType,
      documentUrl,
      requestedAt: new Date(),
      status: 'pending',
      priority
    };

    await addDoc(collection(db, this.verificationsCollection), {
      ...verificationRequest,
      requestedAt: serverTimestamp()
    });

    // Trigger automated verification for high-priority documents
    if (priority === 'high') {
      this.processAutomatedVerification(documentId, documentUrl, documentType);
    }
  }

  /**
   * Automated document verification using AI/OCR
   */
  async processAutomatedVerification(
    documentId: string,
    documentUrl: string,
    documentType: string
  ): Promise<DocumentVerificationResult> {
    try {
      // Update status to processing
      await updateDoc(doc(db, this.documentsCollection, documentId), {
        verificationStatus: 'processing'
      });

      // Extract text from document (would integrate with OCR service)
      const extractedText = await this.extractTextFromDocument(documentUrl);
      
      // Validate document content
      const verificationResult = await this.validateDocumentContent(
        extractedText,
        documentType
      );

      // Update document with verification result
      await updateDoc(doc(db, this.documentsCollection, documentId), {
        verificationResult,
        verificationStatus: verificationResult.confidence >= this.validationRules[documentType]?.minConfidence 
          ? 'approved' 
          : 'requires_review',
        'metadata.extractedText': extractedText
      });

      return verificationResult;
    } catch (error) {
      console.error('Error in automated verification:', error);
      
      // Mark as requiring manual review
      await updateDoc(doc(db, this.documentsCollection, documentId), {
        verificationStatus: 'requires_review'
      });

      throw error;
    }
  }

  /**
   * Extract text from document using OCR (placeholder for actual implementation)
   */
  private async extractTextFromDocument(documentUrl: string): Promise<string> {
    // This would integrate with services like:
    // - Google Cloud Vision API
    // - AWS Textract
    // - Azure Computer Vision
    // - Tesseract.js for client-side processing
    
    // For now, return mock extracted text
    return "Mock extracted text from document";
  }

  /**
   * Validate document content against business rules
   */
  private async validateDocumentContent(
    extractedText: string,
    documentType: string
  ): Promise<DocumentVerificationResult> {
    const rules = this.validationRules[documentType];
    const issues: string[] = [];
    const extractedData: Record<string, any> = {};
    
    try {
      // Simulate content validation logic
      switch (documentType) {
        case 'license':
          extractedData.licenseNumber = this.extractLicenseNumber(extractedText);
          extractedData.expirationDate = this.extractExpirationDate(extractedText);
          extractedData.issuingAuthority = this.extractIssuingAuthority(extractedText);
          break;
          
        case 'insurance':
          extractedData.policyNumber = this.extractPolicyNumber(extractedText);
          extractedData.coverageAmount = this.extractCoverageAmount(extractedText);
          extractedData.carrier = this.extractInsuranceCarrier(extractedText);
          extractedData.expirationDate = this.extractExpirationDate(extractedText);
          break;
          
        case 'identification':
          extractedData.idNumber = this.extractIdNumber(extractedText);
          extractedData.fullName = this.extractFullName(extractedText);
          extractedData.expirationDate = this.extractExpirationDate(extractedText);
          break;
      }

      // Check for required fields
      if (rules) {
        for (const field of rules.required) {
          if (!extractedData[field]) {
            issues.push(`Missing required field: ${field}`);
          }
        }
      }

      // Check expiration date
      if (extractedData.expirationDate) {
        const expDate = new Date(extractedData.expirationDate);
        const now = new Date();
        
        if (expDate <= now) {
          issues.push('Document has expired');
        } else if (expDate.getTime() - now.getTime() < 30 * 24 * 60 * 60 * 1000) {
          issues.push('Document expires within 30 days');
        }
      }

      // Calculate confidence score
      const confidence = this.calculateConfidenceScore(extractedData, issues);

      return {
        isValid: issues.length === 0 && confidence >= (rules?.minConfidence || 0.7),
        confidence,
        extractedData,
        issues,
        recommendations: this.generateRecommendations(issues, extractedData)
      };
      
    } catch (error) {
      console.error('Error validating document content:', error);
      return {
        isValid: false,
        confidence: 0,
        extractedData: {},
        issues: ['Failed to process document content'],
        recommendations: ['Please ensure document is clear and legible']
      };
    }
  }

  /**
   * Manual verification by admin
   */
  async manualVerification(
    documentId: string,
    approved: boolean,
    verifiedBy: string,
    notes?: string
  ): Promise<void> {
    const updateData: any = {
      verificationStatus: approved ? 'approved' : 'rejected',
      verifiedBy,
      verifiedAt: serverTimestamp()
    };

    if (!approved && notes) {
      updateData.rejectionReason = notes;
    }

    await updateDoc(doc(db, this.documentsCollection, documentId), updateData);

    // Log audit event
    const document = await this.getDocument(documentId);
    if (document) {
      await this.logAuditEvent(document.contractorId, 'manual_verification', {
        documentId,
        approved,
        verifiedBy,
        notes
      });
    }
  }

  /**
   * Check contractor verification status
   */
  async checkContractorVerificationStatus(contractorId: string): Promise<{
    isFullyVerified: boolean;
    completionPercentage: number;
    pendingDocuments: string[];
    expiringSoon: string[];
  }> {
    const q = query(
      collection(db, this.documentsCollection),
      where('contractorId', '==', contractorId),
      where('status', '==', 'active')
    );

    const snapshot = await getDocs(q);
    const documents = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ContractorDocument[];

    const requiredTypes = ['license', 'insurance', 'identification'];
    const approvedRequired = documents.filter(doc => 
      requiredTypes.includes(doc.documentType) && 
      doc.verificationStatus === 'approved'
    );

    const pendingDocuments = documents.filter(doc => 
      doc.verificationStatus === 'pending' || doc.verificationStatus === 'requires_review'
    ).map(doc => doc.documentType);

         const expiringSoon = documents.filter(doc => {
       if (!doc.expirationDate) return false;
       const expDate = doc.expirationDate instanceof Date ? doc.expirationDate : (doc.expirationDate as any).toDate();
       const daysUntilExpiry = (expDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
       return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
     }).map(doc => doc.documentType);

    return {
      isFullyVerified: approvedRequired.length === requiredTypes.length,
      completionPercentage: Math.round((approvedRequired.length / requiredTypes.length) * 100),
      pendingDocuments,
      expiringSoon
    };
  }

  /**
   * Get document by ID
   */
  async getDocument(documentId: string): Promise<ContractorDocument | null> {
    try {
      const docRef = doc(db, this.documentsCollection, documentId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          uploadedAt: data.uploadedAt?.toDate(),
          expirationDate: data.expirationDate?.toDate(),
          verifiedAt: data.verifiedAt?.toDate()
        } as ContractorDocument;
      }
      return null;
    } catch (error) {
      console.error('Error getting document:', error);
      return null;
    }
  }

  /**
   * Listen to contractor documents
   */
  subscribeToContractorDocuments(
    contractorId: string,
    callback: (documents: ContractorDocument[]) => void
  ): () => void {
    const q = query(
      collection(db, this.documentsCollection),
      where('contractorId', '==', contractorId),
      orderBy('uploadedAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const documents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        uploadedAt: doc.data().uploadedAt?.toDate(),
        expirationDate: doc.data().expirationDate?.toDate(),
        verifiedAt: doc.data().verifiedAt?.toDate()
      })) as ContractorDocument[];

      callback(documents);
    });
  }

  // Helper methods for text extraction (would be more sophisticated in real implementation)
  private extractLicenseNumber(text: string): string | null {
    const match = text.match(/license[#\s]*:?\s*([A-Z0-9-]+)/i);
    return match ? match[1] : null;
  }

  private extractPolicyNumber(text: string): string | null {
    const match = text.match(/policy[#\s]*:?\s*([A-Z0-9-]+)/i);
    return match ? match[1] : null;
  }

  private extractIdNumber(text: string): string | null {
    const match = text.match(/(?:license|id)[#\s]*:?\s*([A-Z0-9-]+)/i);
    return match ? match[1] : null;
  }

  private extractFullName(text: string): string | null {
    const match = text.match(/name[:\s]*([A-Za-z\s]+)/i);
    return match ? match[1].trim() : null;
  }

  private extractExpirationDate(text: string): string | null {
    const match = text.match(/(?:exp|expires?)[:\s]*(\d{1,2}\/\d{1,2}\/\d{4})/i);
    return match ? match[1] : null;
  }

  private extractIssuingAuthority(text: string): string | null {
    const match = text.match(/issued by[:\s]*([A-Za-z\s]+)/i);
    return match ? match[1].trim() : null;
  }

  private extractCoverageAmount(text: string): string | null {
    const match = text.match(/coverage[:\s]*\$?([\d,]+)/i);
    return match ? match[1] : null;
  }

  private extractInsuranceCarrier(text: string): string | null {
    const match = text.match(/carrier[:\s]*([A-Za-z\s]+)/i);
    return match ? match[1].trim() : null;
  }

  private calculateConfidenceScore(extractedData: Record<string, any>, issues: string[]): number {
    const dataPoints = Object.keys(extractedData).length;
    const maxPoints = 5; // Expected data points
    const dataScore = Math.min(dataPoints / maxPoints, 1);
    const issuesPenalty = issues.length * 0.2;
    
    return Math.max(0, dataScore - issuesPenalty);
  }

  private generateRecommendations(issues: string[], extractedData: Record<string, any>): string[] {
    const recommendations: string[] = [];
    
    if (issues.some(issue => issue.includes('Missing required field'))) {
      recommendations.push('Ensure all required information is clearly visible in the document');
    }
    
    if (issues.some(issue => issue.includes('expired'))) {
      recommendations.push('Please provide an updated, non-expired document');
    }
    
    if (Object.keys(extractedData).length < 3) {
      recommendations.push('Document may be unclear - consider uploading a higher quality image');
    }
    
    return recommendations;
  }

  private getDocumentPriority(documentType: string): 'high' | 'medium' | 'low' {
    const highPriority = ['license', 'insurance', 'identification'];
    return highPriority.includes(documentType) ? 'high' : 'medium';
  }

  private async logAuditEvent(
    contractorId: string,
    action: string,
    details: Record<string, any>
  ): Promise<void> {
    try {
      await addDoc(collection(db, this.auditCollection), {
        contractorId,
        action,
        details,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error logging audit event:', error);
    }
  }
}

export const documentVerificationService = new DocumentVerificationService(); 