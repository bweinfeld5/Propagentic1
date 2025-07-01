import { Timestamp } from 'firebase/firestore';

// Keep the existing interface for backward compatibility
export interface ContractorRegistration {
  id: string; // Firestore document ID
  name: string;
  phoneNumber: string;
  createdAt: Timestamp;
  status: 'pending' | 'verified' | 'rejected';
}

export interface ContractorRegistrationFormData {
  name: string;
  phoneNumber: string;
}

export interface ContractorRegistrationErrors {
  name?: string;
  phoneNumber?: string;
  general?: string;
}

// New interface for the enhanced contractor waitlist
export interface ContractorWaitlistEntry {
  id?: string; // Optional: Firestore document ID
  name: string;
  phoneNumber: string;
  email?: string;
  trades: string[];
  experience: 'under-1-year' | '1-3-years' | '3-5-years' | '5-10-years' | '10-plus-years';
  serviceArea?: string;
  // Business information from Google Places API
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessWebsite?: string;
  businessPlaceId?: string;
  businessTypes?: string[];
  businessVerified?: boolean;
  createdAt: Timestamp;
  status: 'pending' | 'contacted' | 'onboarded' | 'rejected';
  source: 'website-registration';
}