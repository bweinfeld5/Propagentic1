import { Timestamp } from 'firebase/firestore';

export enum UserRole {
  TENANT = 'tenant',
  LANDLORD = 'landlord',
  CONTRACTOR = 'contractor',
  ADMIN = 'admin'
}

export interface MaintenanceFormData {
  issueTitle: string;
  description: string;
  issueType: string;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  photos: File[];
  contactPreference: 'email' | 'phone' | 'text';
  availableTimes: string[];
  unitNumber: string;
}

export interface TenantOnboardingData {
  firstName: string;
  lastName: string;
  phone: string;
  preferredContactMethod: string;
  address: string;
  propertyType: string;
}

export interface Tenant {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  status?: string;
}

export interface Contractor {
  id: string;
  name?: string;
  businessName?: string;
  serviceCategories?: string[];
  serviceArea?: string;
  rating?: number;
  status?: string;
}

export const dataModels = {
  createMaintenanceFormData: (): MaintenanceFormData => ({
    issueTitle: '',
    description: '',
    issueType: '',
    urgency: 'medium',
    photos: [],
    contactPreference: 'email',
    availableTimes: [],
    unitNumber: ''
  }),
  
  serviceCategories: [
    { id: 'plumbing', label: 'Plumbing', icon: 'fa-wrench' },
    { id: 'electrical', label: 'Electrical', icon: 'fa-bolt' },
    { id: 'hvac', label: 'HVAC/Heating/Cooling', icon: 'fa-temperature-high' },
    { id: 'structural', label: 'Structural/Building', icon: 'fa-hammer' },
    { id: 'painting', label: 'Painting', icon: 'fa-paint-roller' },
    { id: 'other', label: 'Other', icon: 'fa-question-circle' }
  ]
};