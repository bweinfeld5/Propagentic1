import PersonalInfoStep from '../steps/PersonalInfoStep';
import EmergencyContactStep from '../steps/EmergencyContactStep';
import PreferencesStep from '../steps/PreferencesStep';

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

export const validateEmergencyContact = (formData) => {
  // Emergency contact is optional, so always valid
  return { isValid: true };
};

export const validatePreferences = (formData) => {
  // Preferences have defaults, so always valid
  return { isValid: true };
};

// Step configurations
export const tenantSteps = [
  {
    title: 'Personal Info',
    component: PersonalInfoStep,
    validation: validatePersonalInfo
  },
  {
    title: 'Emergency Contact',
    component: EmergencyContactStep,
    validation: validateEmergencyContact
  },
  {
    title: 'Preferences',
    component: PreferencesStep,
    validation: validatePreferences
  }
];

// Initial form data
export const initialTenantFormData = {
  firstName: '',
  lastName: '',
  phoneNumber: '',
  emergencyContact: {
    name: '',
    phone: '',
    relationship: ''
  },
  preferences: {
    communicationMethod: 'email',
    maintenanceNotifications: true,
    paymentReminders: true
  }
}; 