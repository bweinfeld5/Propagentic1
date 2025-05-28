import { 
  collection, 
  doc, 
  updateDoc, 
  addDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';

export interface DocumentValidationResult {
  isValid: boolean;
  confidence: number;
  extractedData: Record<string, any>;
  validationErrors: string[];
  warnings: string[];
  requiresManualReview: boolean;
}

export interface VerificationRule {
  field: string;
  required: boolean;
  pattern?: RegExp;
  validator?: (value: any) => boolean;
  errorMessage: string;
}

class DocumentVerificationService {
  private readonly API_BASE_URL = process.env.REACT_APP_VERIFICATION_API_URL || '';
  private readonly API_KEY = process.env.REACT_APP_VERIFICATION_API_KEY || '';

  // Document type validation rules
  private readonly validationRules: Record<string, VerificationRule[]> = {
    business_license: [
      {
        field: 'licenseNumber',
        required: true,
        pattern: /^[A-Z0-9]{6,20}$/,
        errorMessage: 'Invalid license number format'
      },
      {
        field: 'expirationDate',
        required: true,
        validator: (date: string) => new Date(date) > new Date(),
        errorMessage: 'License is expired or expiration date is invalid'
      },
      {
        field: 'businessName',
        required: true,
        errorMessage: 'Business name is required'
      },
      {
        field: 'issuingAuthority',
        required: true,
        errorMessage: 'Issuing authority information is required'
      }
    ],
    liability_insurance: [
      {
        field: 'policyNumber',
        required: true,
        pattern: /^[A-Z0-9\-]{8,25}$/,
        errorMessage: 'Invalid policy number format'
      },
      {
        field: 'coverageAmount',
        required: true,
        validator: (amount: number) => amount >= 100000, // Minimum $100k coverage
        errorMessage: 'Minimum coverage amount of $100,000 required'
      },
      {
        field: 'effectiveDate',
        required: true,
        validator: (date: string) => new Date(date) <= new Date(),
        errorMessage: 'Policy effective date cannot be in the future'
      },
      {
        field: 'expirationDate',
        required: true,
        validator: (date: string) => new Date(date) > new Date(),
        errorMessage: 'Insurance policy is expired'
      }
    ],
    government_id: [
      {
        field: 'idNumber',
        required: true,
        pattern: /^[A-Z0-9]{6,20}$/,
        errorMessage: 'Invalid ID number format'
      },
      {
        field: 'expirationDate',
        required: true,
        validator: (date: string) => new Date(date) > new Date(),
        errorMessage: 'ID is expired'
      },
      {
        field: 'fullName',
        required: true,
        errorMessage: 'Full name is required'
      },
      {
        field: 'dateOfBirth',
        required: true,
        validator: (date: string) => {
          const age = (new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24 * 365);
          return age >= 18;
        },
        errorMessage: 'Must be 18 years or older'
      }
    ],
    trade_certification: [
      {
        field: 'certificationNumber',
        required: true,
        errorMessage: 'Certification number is required'
      },
      {
        field: 'issuingOrganization',
        required: true,
        errorMessage: 'Issuing organization is required'
      },
      {
        field: 'expirationDate',
        required: false,
        validator: (date: string) => !date || new Date(date) > new Date(),
        errorMessage: 'Certification is expired'
      }
    ]
  };

  /**
   * Process document using OCR and extract text/data
   */
  async processDocumentOCR(documentUrl: string, documentType: string): Promise<Record<string, any>> {
    try {
      // In a real implementation, you would use services like:
      // - Google Cloud Vision API
      // - AWS Textract
      // - Azure Computer Vision
      // - Tesseract.js for client-side OCR
      
      const response = await fetch(`${this.API_BASE_URL}/ocr/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.API_KEY}`
        },
        body: JSON.stringify({
          documentUrl,
          documentType,
          extractionMode: 'structured'
        })
      });

      if (!response.ok) {
        throw new Error(`OCR processing failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.extractedData || {};
    } catch (error) {
      console.error('OCR processing error:', error);
      
      // Fallback: Return mock data for development
      return this.getMockExtractedData(documentType);
    }
  }

  /**
   * Validate extracted document data against rules
   */
  validateDocument(extractedData: Record<string, any>, documentType: string): DocumentValidationResult {
    const rules = this.validationRules[documentType] || [];
    const validationErrors: string[] = [];
    const warnings: string[] = [];
    let confidence = 1.0;
    let requiresManualReview = false;

    // Check each validation rule
    for (const rule of rules) {
      const value = extractedData[rule.field];

      // Check if required field is missing
      if (rule.required && (!value || value === '')) {
        validationErrors.push(rule.errorMessage);
        confidence -= 0.2;
        continue;
      }

      // Skip validation if field is not required and empty
      if (!rule.required && (!value || value === '')) {
        continue;
      }

      // Pattern validation
      if (rule.pattern && !rule.pattern.test(String(value))) {
        validationErrors.push(rule.errorMessage);
        confidence -= 0.15;
      }

      // Custom validator
      if (rule.validator && !rule.validator(value)) {
        validationErrors.push(rule.errorMessage);
        confidence -= 0.15;
      }
    }

    // Additional document-specific validations
    const additionalValidation = this.performAdditionalValidation(extractedData, documentType);
    validationErrors.push(...additionalValidation.errors);
    warnings.push(...additionalValidation.warnings);
    confidence *= additionalValidation.confidenceMultiplier;

    // Determine if manual review is required
    requiresManualReview = confidence < 0.8 || validationErrors.length > 0 || warnings.length > 2;

    return {
      isValid: validationErrors.length === 0,
      confidence: Math.max(0, Math.min(1, confidence)),
      extractedData,
      validationErrors,
      warnings,
      requiresManualReview
    };
  }

  /**
   * Perform additional document-specific validations
   */
  private performAdditionalValidation(data: Record<string, any>, documentType: string): {
    errors: string[];
    warnings: string[];
    confidenceMultiplier: number;
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    let confidenceMultiplier = 1.0;

    switch (documentType) {
      case 'business_license':
        // Check if license is from a recognized authority
        if (data.issuingAuthority && !this.isRecognizedAuthority(data.issuingAuthority)) {
          warnings.push('Issuing authority may need verification');
          confidenceMultiplier *= 0.9;
        }
        
        // Check license status with external API (mock)
        if (data.licenseNumber && !this.verifyLicenseStatus(data.licenseNumber)) {
          errors.push('License status could not be verified');
          confidenceMultiplier *= 0.7;
        }
        break;

      case 'liability_insurance':
        // Verify insurance company
        if (data.insuranceCompany && !this.isRecognizedInsurer(data.insuranceCompany)) {
          warnings.push('Insurance company may need verification');
          confidenceMultiplier *= 0.9;
        }
        
        // Check coverage adequacy
        if (data.coverageAmount && data.coverageAmount < 500000) {
          warnings.push('Consider higher coverage amount for better protection');
        }
        break;

      case 'government_id':
        // Verify ID format matches issuing state/country
        if (data.issuingState && data.idNumber && !this.verifyIdFormat(data.idNumber, data.issuingState)) {
          errors.push('ID number format does not match issuing state');
          confidenceMultiplier *= 0.6;
        }
        break;
    }

    return { errors, warnings, confidenceMultiplier };
  }

  /**
   * Automatically verify a document
   */
  async verifyDocument(documentId: string, contractorId: string): Promise<DocumentValidationResult> {
    try {
      // Get document from Firestore
      const documentsQuery = query(
        collection(db, 'contractorDocuments'),
        where('id', '==', documentId)
      );
      
      const snapshot = await getDocs(documentsQuery);
      if (snapshot.empty) {
        throw new Error('Document not found');
      }

      const documentData = snapshot.docs[0].data();
      
      // Process document with OCR
      const extractedData = await this.processDocumentOCR(documentData.url, documentData.type);
      
      // Validate extracted data
      const validationResult = this.validateDocument(extractedData, documentData.type);
      
      // Update document with validation results
      await updateDoc(doc(db, 'contractorDocuments', documentId), {
        extractedData,
        validationResult,
        autoVerificationComplete: true,
        autoVerificationAt: serverTimestamp(),
        verificationStatus: validationResult.requiresManualReview ? 'pending' : 
                           validationResult.isValid ? 'approved' : 'rejected'
      });

      // Create verification audit log
      await addDoc(collection(db, 'verificationAuditLog'), {
        documentId,
        contractorId,
        action: 'auto_verification',
        result: validationResult,
        performedAt: serverTimestamp(),
        confidence: validationResult.confidence
      });

      // If auto-approval is possible, update verification request
      if (!validationResult.requiresManualReview && validationResult.isValid) {
        const verificationQuery = query(
          collection(db, 'verificationRequests'),
          where('contractorId', '==', contractorId),
          where('documentType', '==', documentData.type),
          where('status', '==', 'pending')
        );
        
        const verificationSnapshot = await getDocs(verificationQuery);
        if (!verificationSnapshot.empty) {
          const requestId = verificationSnapshot.docs[0].id;
          await updateDoc(doc(db, 'verificationRequests', requestId), {
            status: 'approved',
            verifiedBy: 'system',
            verifiedAt: serverTimestamp(),
            autoApproved: true
          });
        }
      }

      return validationResult;
    } catch (error) {
      console.error('Document verification error:', error);
      throw error;
    }
  }

  /**
   * Batch verify multiple documents for a contractor
   */
  async batchVerifyDocuments(contractorId: string): Promise<Record<string, DocumentValidationResult>> {
    const documentsQuery = query(
      collection(db, 'contractorDocuments'),
      where('contractorId', '==', contractorId),
      where('status', '==', 'active')
    );
    
    const snapshot = await getDocs(documentsQuery);
    const results: Record<string, DocumentValidationResult> = {};
    
    for (const docSnapshot of snapshot.docs) {
      try {
        const result = await this.verifyDocument(docSnapshot.id, contractorId);
        results[docSnapshot.id] = result;
      } catch (error) {
        console.error(`Error verifying document ${docSnapshot.id}:`, error);
        results[docSnapshot.id] = {
          isValid: false,
          confidence: 0,
          extractedData: {},
          validationErrors: ['Verification failed'],
          warnings: [],
          requiresManualReview: true
        };
      }
    }
    
    return results;
  }

  // Helper methods (these would integrate with real services in production)
  private isRecognizedAuthority(authority: string): boolean {
    const recognizedAuthorities = [
      'Department of Consumer Affairs',
      'State Licensing Board',
      'City Business License Department',
      'County Clerk Office'
    ];
    return recognizedAuthorities.some(auth => 
      authority.toLowerCase().includes(auth.toLowerCase())
    );
  }

  private verifyLicenseStatus(licenseNumber: string): boolean {
    // In production, this would call a real license verification API
    return Math.random() > 0.1; // 90% success rate for demo
  }

  private isRecognizedInsurer(company: string): boolean {
    const majorInsurers = [
      'State Farm', 'Allstate', 'Progressive', 'GEICO', 'Liberty Mutual',
      'Travelers', 'Nationwide', 'USAA', 'Farmers', 'American Family'
    ];
    return majorInsurers.some(insurer => 
      company.toLowerCase().includes(insurer.toLowerCase())
    );
  }

  private verifyIdFormat(idNumber: string, state: string): boolean {
    // Simplified state ID format validation
    const stateFormats: Record<string, RegExp> = {
      'CA': /^[A-Z]\d{7}$/,
      'NY': /^\d{9}$/,
      'TX': /^\d{8}$/,
      'FL': /^[A-Z]\d{12}$/
    };
    
    const format = stateFormats[state.toUpperCase()];
    return format ? format.test(idNumber) : true; // Default to true for unknown states
  }

  private getMockExtractedData(documentType: string): Record<string, any> {
    // Mock data for development/testing
    const mockData: Record<string, Record<string, any>> = {
      business_license: {
        licenseNumber: 'BL123456789',
        businessName: 'ABC Contracting LLC',
        issuingAuthority: 'State Licensing Board',
        expirationDate: '2025-12-31',
        issueDate: '2023-01-15'
      },
      liability_insurance: {
        policyNumber: 'POL-2024-001234',
        insuranceCompany: 'State Farm',
        coverageAmount: 1000000,
        effectiveDate: '2024-01-01',
        expirationDate: '2025-01-01'
      },
      government_id: {
        idNumber: 'D1234567',
        fullName: 'John Smith',
        dateOfBirth: '1985-06-15',
        expirationDate: '2028-06-15',
        issuingState: 'CA'
      },
      trade_certification: {
        certificationNumber: 'CERT-2024-5678',
        issuingOrganization: 'National Electrical Contractors Association',
        certificationName: 'Electrical Contractor Certification',
        issueDate: '2023-03-01',
        expirationDate: '2026-03-01'
      }
    };

    return mockData[documentType] || {};
  }
}

export const documentVerificationService = new DocumentVerificationService(); 