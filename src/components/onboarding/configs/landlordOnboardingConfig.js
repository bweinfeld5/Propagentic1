import LandlordPersonalInfoStep from '../steps/LandlordPersonalInfoStep';
import PropertyDetailsStep from '../steps/PropertyDetailsStep';
import BusinessDetailsStep from '../steps/BusinessDetailsStep';
import TenantInvitationStep from '../steps/TenantInvitationStep';
import ConfirmationStep from '../steps/ConfirmationStep';

// Validation functions
export const validatePersonalInfo = (formData) => {
  const required = ['firstName', 'lastName', 'phoneNumber'];
  
  for (const field of required) {
    if (!formData[field] || formData[field].trim() === '') {
      return {
        isValid: false,
        error: `${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required.`
      };
    }
  }
  
  // Phone number validation
  const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
  if (!phoneRegex.test(formData.phoneNumber)) {
    return {
      isValid: false,
      error: 'Please enter a valid phone number.'
    };
  }
  
  return { isValid: true };
};

export const validatePropertyDetails = (formData) => {
  const required = ['streetAddress', 'city', 'state', 'zipCode', 'propertyType'];
  
  for (const field of required) {
    if (!formData[field] || formData[field].trim() === '') {
      return {
        isValid: false,
        error: `${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required.`
      };
    }
  }
  
  // Multi-family building validation
  if (formData.propertyType === 'Multi-Family Building' && 
      (!formData.numberOfUnits || formData.numberOfUnits < 1)) {
    return {
      isValid: false,
      error: 'Number of units is required for Multi-Family buildings.'
    };
  }
  
  return { isValid: true };
};

export const validateBusinessDetails = (formData) => {
  // Business details are optional, so always valid
  return { isValid: true };
};

export const validateTenantInvitation = (formData) => {
  // Email validation if provided (optional step)
  if (formData.tenantEmail && !formData.tenantEmail.includes('@')) {
    return {
      isValid: false,
      error: 'Please enter a valid email address.'
    };
  }
  return { isValid: true };
};

export const validateConfirmation = (formData) => {
  // Just confirmation, no validation needed
  return { isValid: true };
};

// Step configurations
export const landlordSteps = [
  {
    title: 'Personal Info',
    component: LandlordPersonalInfoStep,
    validation: validatePersonalInfo
  },
  {
    title: 'Property Details',
    component: PropertyDetailsStep,
    validation: validatePropertyDetails
  },
  {
    title: 'Business Details',
    component: BusinessDetailsStep,
    validation: validateBusinessDetails
  },
  {
    title: 'Tenant Invitation',
    component: TenantInvitationStep,
    validation: validateTenantInvitation
  },
  {
    title: 'Confirmation',
    component: ConfirmationStep,
    validation: validateConfirmation
  }
];

// Initial form data
export const initialLandlordFormData = {
  // Personal Info
  firstName: '',
  lastName: '',
  phoneNumber: '',
  businessName: '',
  preferredContactMethod: 'email',
  
  // Property Details
  streetAddress: '',
  city: '',
  state: '',
  zipCode: '',
  propertyType: 'Single-Family Home',
  numberOfUnits: 1,
  propertyNickname: '',
  monthlyRent: '',
  
  // Business Details
  yearsInBusiness: '1-5',
  totalProperties: '1',
  managementSoftware: 'None',
  
  // Tenant Invitation
  tenantEmail: ''
}; 