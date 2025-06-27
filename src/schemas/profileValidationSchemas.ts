/**
 * Profile Validation Schemas
 * Standardized validation rules for all user types
 */

export interface ValidationResult {
  isValid: boolean;
  missingFields: string[];
  completionPercentage: number;
  errors: string[];
  warnings: string[];
}

export interface BaseProfile {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  onboardingComplete?: boolean;
}

export interface ContractorProfile extends BaseProfile {
  serviceTypes?: string[];
  serviceArea?: string;
  hourlyRate?: number;
  yearsExperience?: string;
  // Payment requirements
  w9FormUrl?: string;
  stripeAccountSetup?: boolean;
  bankAccountVerified?: boolean;
}

export interface LandlordProfile extends BaseProfile {
  businessName?: string;
  totalProperties?: number;
  yearsInBusiness?: string;
  managementSoftware?: string;
}

export interface TenantProfile extends BaseProfile {
  address?: string;
  propertyType?: string;
  preferredContactMethod?: string;
}

/**
 * Required fields for each user type
 */
export const REQUIRED_FIELDS = {
  contractor: {
    basic: ['firstName', 'lastName', 'phoneNumber', 'serviceTypes', 'serviceArea'],
    payment: ['w9FormUrl', 'stripeAccountSetup', 'bankAccountVerified'],
    optional: ['hourlyRate', 'yearsExperience', 'bio', 'companyName']
  },
  landlord: {
    basic: ['firstName', 'lastName', 'phoneNumber', 'totalProperties'],
    business: ['businessName', 'yearsInBusiness'],
    optional: ['managementSoftware']
  },
  tenant: {
    basic: ['firstName', 'lastName', 'phoneNumber', 'address'],
    optional: ['propertyType', 'preferredContactMethod']
  }
};

/**
 * Validate contractor profile completeness
 */
export function validateContractorProfile(profile: ContractorProfile): ValidationResult {
  const missingFields: string[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check basic required fields
  REQUIRED_FIELDS.contractor.basic.forEach(field => {
    if (!profile[field as keyof ContractorProfile]) {
      missingFields.push(field);
    }
  });

  // Special validation for serviceTypes (array)
  if (!profile.serviceTypes || profile.serviceTypes.length === 0) {
    missingFields.push('serviceTypes');
    errors.push('At least one service type must be selected');
  }

  // Check payment requirements for full access
  REQUIRED_FIELDS.contractor.payment.forEach(field => {
    if (!profile[field as keyof ContractorProfile]) {
      missingFields.push(field);
    }
  });

  // Validate data formats
  if (profile.hourlyRate && profile.hourlyRate < 0) {
    errors.push('Hourly rate must be a positive number');
  }

  if (profile.phoneNumber && !/^\(\d{3}\) \d{3}-\d{4}$|^\d{10}$/.test(profile.phoneNumber)) {
    warnings.push('Phone number format may not be valid');
  }

  const totalRequired = REQUIRED_FIELDS.contractor.basic.length + REQUIRED_FIELDS.contractor.payment.length;
  const completionPercentage = Math.round(((totalRequired - missingFields.length) / totalRequired) * 100);

  return {
    isValid: missingFields.length === 0 && errors.length === 0,
    missingFields,
    completionPercentage,
    errors,
    warnings
  };
}

/**
 * Validate landlord profile completeness
 */
export function validateLandlordProfile(profile: LandlordProfile): ValidationResult {
  const missingFields: string[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check basic required fields
  [...REQUIRED_FIELDS.landlord.basic, ...REQUIRED_FIELDS.landlord.business].forEach(field => {
    if (!profile[field as keyof LandlordProfile]) {
      missingFields.push(field);
    }
  });

  // Validate data formats
  if (profile.totalProperties && profile.totalProperties < 1) {
    errors.push('Total properties must be at least 1');
  }

  const totalRequired = REQUIRED_FIELDS.landlord.basic.length + REQUIRED_FIELDS.landlord.business.length;
  const completionPercentage = Math.round(((totalRequired - missingFields.length) / totalRequired) * 100);

  return {
    isValid: missingFields.length === 0 && errors.length === 0,
    missingFields,
    completionPercentage,
    errors,
    warnings
  };
}

/**
 * Validate tenant profile completeness
 */
export function validateTenantProfile(profile: TenantProfile): ValidationResult {
  const missingFields: string[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check basic required fields
  REQUIRED_FIELDS.tenant.basic.forEach(field => {
    if (!profile[field as keyof TenantProfile]) {
      missingFields.push(field);
    }
  });

  const totalRequired = REQUIRED_FIELDS.tenant.basic.length;
  const completionPercentage = Math.round(((totalRequired - missingFields.length) / totalRequired) * 100);

  return {
    isValid: missingFields.length === 0 && errors.length === 0,
    missingFields,
    completionPercentage,
    errors,
    warnings
  };
}

/**
 * Generic profile validator that routes to specific validators
 */
export function validateProfile(profile: any, userType: string): ValidationResult {
  switch (userType) {
    case 'contractor':
      return validateContractorProfile(profile);
    case 'landlord':
      return validateLandlordProfile(profile);
    case 'tenant':
      return validateTenantProfile(profile);
    default:
      return {
        isValid: false,
        missingFields: ['userType'],
        completionPercentage: 0,
        errors: [`Unknown user type: ${userType}`],
        warnings: []
      };
  }
}

/**
 * Helper function to get user-friendly field names
 */
export const FIELD_LABELS: Record<string, string> = {
  firstName: 'First Name',
  lastName: 'Last Name',
  phoneNumber: 'Phone Number',
  serviceTypes: 'Service Types',
  serviceArea: 'Service Area',
  hourlyRate: 'Hourly Rate',
  w9FormUrl: 'W-9 Tax Form',
  stripeAccountSetup: 'Payment Account Setup',
  bankAccountVerified: 'Bank Account Verification',
  businessName: 'Business Name',
  totalProperties: 'Total Properties',
  yearsInBusiness: 'Years in Business',
  address: 'Address',
  propertyType: 'Property Type'
}; 