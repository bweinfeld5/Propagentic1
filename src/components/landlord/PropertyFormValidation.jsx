import React from 'react';
import { 
  ExclamationTriangleIcon, 
  CheckCircleIcon,
  InformationCircleIcon 
} from '@heroicons/react/24/outline';

/**
 * Property Form Validation Utilities
 * 
 * Provides comprehensive validation for property forms with:
 * - Field-level validation
 * - Step-level validation
 * - Real-time feedback
 * - Enhanced error messages
 * - Visual validation states
 */

// Validation rules
export const VALIDATION_RULES = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: null,
    errorMessages: {
      required: 'Property name is required',
      minLength: 'Property name must be at least 2 characters',
      maxLength: 'Property name cannot exceed 100 characters'
    }
  },
  
  propertyType: {
    required: true,
    options: ['apartment', 'house', 'condo', 'townhouse', 'duplex', 'commercial', 'other'],
    errorMessages: {
      required: 'Property type is required',
      invalid: 'Please select a valid property type'
    }
  },
  
  street: {
    required: true,
    minLength: 5,
    maxLength: 200,
    errorMessages: {
      required: 'Street address is required',
      minLength: 'Street address must be at least 5 characters',
      maxLength: 'Street address cannot exceed 200 characters'
    }
  },
  
  city: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z\s\-\.\']+$/,
    errorMessages: {
      required: 'City is required',
      minLength: 'City must be at least 2 characters',
      maxLength: 'City cannot exceed 100 characters',
      pattern: 'City can only contain letters, spaces, hyphens, periods, and apostrophes'
    }
  },
  
  state: {
    required: true,
    pattern: /^[A-Z]{2}$/,
    errorMessages: {
      required: 'State is required',
      pattern: 'State must be a valid 2-letter code (e.g., CA, NY, TX)'
    }
  },
  
  zipCode: {
    required: true,
    pattern: /^\d{5}(-\d{4})?$/,
    errorMessages: {
      required: 'ZIP code is required',
      pattern: 'ZIP code must be in format 12345 or 12345-6789'
    }
  },
  
  monthlyRent: {
    required: true,
    min: 1,
    max: 50000,
    type: 'number',
    errorMessages: {
      required: 'Monthly rent is required',
      min: 'Monthly rent must be at least $1',
      max: 'Monthly rent cannot exceed $50,000',
      type: 'Monthly rent must be a valid number'
    }
  },
  
  units: {
    required: true,
    min: 1,
    max: 1000,
    type: 'integer',
    errorMessages: {
      required: 'Number of units is required',
      min: 'Must have at least 1 unit',
      max: 'Cannot exceed 1,000 units',
      type: 'Units must be a whole number'
    }
  },
  
  bedrooms: {
    required: false,
    min: 0,
    max: 20,
    type: 'integer',
    errorMessages: {
      min: 'Bedrooms cannot be negative',
      max: 'Cannot exceed 20 bedrooms',
      type: 'Bedrooms must be a whole number'
    }
  },
  
  bathrooms: {
    required: false,
    min: 0,
    max: 20,
    step: 0.5,
    type: 'number',
    errorMessages: {
      min: 'Bathrooms cannot be negative',
      max: 'Cannot exceed 20 bathrooms',
      type: 'Bathrooms must be a valid number'
    }
  },
  
  squareFootage: {
    required: false,
    min: 1,
    max: 50000,
    type: 'integer',
    errorMessages: {
      min: 'Square footage must be at least 1',
      max: 'Square footage cannot exceed 50,000',
      type: 'Square footage must be a whole number'
    }
  },
  
  yearBuilt: {
    required: false,
    min: 1800,
    max: new Date().getFullYear() + 1,
    type: 'integer',
    errorMessages: {
      min: 'Year built cannot be before 1800',
      max: `Year built cannot be after ${new Date().getFullYear() + 1}`,
      type: 'Year built must be a valid year'
    }
  }
};

// Enhanced field validation function
export const validateField = (fieldName, value, rules = VALIDATION_RULES) => {
  const rule = rules[fieldName];
  if (!rule) return null;
  
  const errors = [];
  
  // Required validation
  if (rule.required && (!value || value.toString().trim() === '')) {
    return rule.errorMessages.required;
  }
  
  // Skip other validations if field is empty and not required
  if (!rule.required && (!value || value.toString().trim() === '')) {
    return null;
  }
  
  const stringValue = value.toString().trim();
  
  // Length validations
  if (rule.minLength && stringValue.length < rule.minLength) {
    return rule.errorMessages.minLength;
  }
  
  if (rule.maxLength && stringValue.length > rule.maxLength) {
    return rule.errorMessages.maxLength;
  }
  
  // Pattern validation
  if (rule.pattern && !rule.pattern.test(stringValue)) {
    return rule.errorMessages.pattern;
  }
  
  // Options validation
  if (rule.options && !rule.options.includes(value)) {
    return rule.errorMessages.invalid;
  }
  
  // Numeric validations
  if (rule.type === 'number' || rule.type === 'integer') {
    const numValue = parseFloat(value);
    
    if (isNaN(numValue)) {
      return rule.errorMessages.type;
    }
    
    if (rule.type === 'integer' && !Number.isInteger(numValue)) {
      return rule.errorMessages.type;
    }
    
    if (rule.min !== undefined && numValue < rule.min) {
      return rule.errorMessages.min;
    }
    
    if (rule.max !== undefined && numValue > rule.max) {
      return rule.errorMessages.max;
    }
  }
  
  return null;
};

// Validate multiple fields
export const validateFields = (data, fieldNames, rules = VALIDATION_RULES) => {
  const errors = {};
  
  fieldNames.forEach(fieldName => {
    const error = validateField(fieldName, data[fieldName], rules);
    if (error) {
      errors[fieldName] = error;
    }
  });
  
  return errors;
};

// Step validation configurations
export const STEP_VALIDATIONS = {
  1: ['name', 'propertyType'], // Basic Information
  2: ['street', 'city', 'state', 'zipCode'], // Location Details
  3: ['units', 'bedrooms', 'bathrooms'], // Property Details
  4: ['monthlyRent'], // Financial Information
  5: [], // Additional Details (all optional)
  6: [], // HVAC Details (optional)
  7: [], // Plumbing Details (optional)
  8: [], // Electrical Details (optional)
  9: [] // Tenant Invites (optional)
};

// Enhanced Input Field Component with validation state
export const ValidatedInput = ({
  label,
  name,
  value,
  onChange,
  error,
  type = 'text',
  placeholder,
  required = false,
  icon: Icon,
  className = '',
  disabled = false,
  showValidation = true,
  ...props
}) => {
  const hasError = error && error.length > 0;
  const hasValue = value && value.toString().trim().length > 0;
  const isValid = !hasError && hasValue && required;
  
  const inputClasses = `
    block w-full px-4 py-3 text-base border rounded-lg
    focus:ring-2 focus:ring-orange-500 focus:border-orange-500
    transition-all duration-200
    ${Icon ? 'pl-12' : 'pl-4'}
    ${hasError 
      ? 'border-red-300 bg-red-50 text-red-900 placeholder-red-400 focus:ring-red-500 focus:border-red-500' 
      : isValid && showValidation
      ? 'border-green-300 bg-green-50 focus:ring-green-500 focus:border-green-500'
      : 'border-gray-300 bg-white focus:ring-orange-500 focus:border-orange-500'
    }
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${className}
  `;
  
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className={`h-5 w-5 ${hasError ? 'text-red-400' : 'text-gray-400'}`} />
          </div>
        )}
        
        <input
          type={type}
          name={name}
          value={value || ''}
          onChange={(e) => onChange(name, e.target.value)}
          placeholder={placeholder}
          className={inputClasses}
          disabled={disabled}
          {...props}
        />
        
        {showValidation && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {hasError ? (
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
            ) : isValid ? (
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
            ) : null}
          </div>
        )}
      </div>
      
      {hasError && (
        <div className="flex items-center space-x-1">
          <ExclamationTriangleIcon className="h-4 w-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
};

// Enhanced Select Field Component
export const ValidatedSelect = ({
  label,
  name,
  value,
  onChange,
  options,
  error,
  placeholder = 'Select an option',
  required = false,
  icon: Icon,
  className = '',
  disabled = false,
  showValidation = true,
  ...props
}) => {
  const hasError = error && error.length > 0;
  const hasValue = value && value.toString().trim().length > 0;
  const isValid = !hasError && hasValue && required;
  
  const selectClasses = `
    block w-full px-4 py-3 text-base border rounded-lg
    focus:ring-2 focus:ring-orange-500 focus:border-orange-500
    transition-all duration-200 appearance-none bg-white
    ${Icon ? 'pl-12' : 'pl-4'}
    ${hasError 
      ? 'border-red-300 bg-red-50 text-red-900 focus:ring-red-500 focus:border-red-500' 
      : isValid && showValidation
      ? 'border-green-300 bg-green-50 focus:ring-green-500 focus:border-green-500'
      : 'border-gray-300 bg-white focus:ring-orange-500 focus:border-orange-500'
    }
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${className}
  `;
  
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className={`h-5 w-5 ${hasError ? 'text-red-400' : 'text-gray-400'}`} />
          </div>
        )}
        
        <select
          name={name}
          value={value || ''}
          onChange={(e) => onChange(name, e.target.value)}
          className={selectClasses}
          disabled={disabled}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
        {showValidation && (
          <div className="absolute inset-y-0 right-8 pr-3 flex items-center">
            {hasError ? (
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
            ) : isValid ? (
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
            ) : null}
          </div>
        )}
      </div>
      
      {hasError && (
        <div className="flex items-center space-x-1">
          <ExclamationTriangleIcon className="h-4 w-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
};

// Loading Spinner Component
export const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };
  
  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-orange-600 ${sizeClasses[size]} ${className}`} />
  );
};

// Form Step Progress Indicator
export const StepProgressIndicator = ({ currentStep, totalSteps, stepNames = [] }) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const stepName = stepNames[index] || `Step ${stepNumber}`;
          
          return (
            <div key={stepNumber} className="flex flex-col items-center flex-1">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2
                ${isCompleted 
                  ? 'bg-green-600 border-green-600 text-white' 
                  : isCurrent 
                  ? 'bg-orange-600 border-orange-600 text-white'
                  : 'bg-white border-gray-300 text-gray-500'
                }
              `}>
                {isCompleted ? (
                  <CheckCircleIcon className="h-5 w-5" />
                ) : (
                  stepNumber
                )}
              </div>
              
              <span className={`
                text-xs mt-1 text-center max-w-20 truncate
                ${isCurrent ? 'text-orange-600 font-medium' : 'text-gray-500'}
              `}>
                {stepName}
              </span>
              
              {stepNumber < totalSteps && (
                <div className={`
                  absolute top-4 left-1/2 w-full h-0.5 -z-10
                  ${isCompleted ? 'bg-green-600' : 'bg-gray-300'}
                `} style={{ transform: 'translateX(50%)' }} />
              )}
            </div>
          );
        })}
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-orange-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default {
  VALIDATION_RULES,
  validateField,
  validateFields,
  STEP_VALIDATIONS,
  ValidatedInput,
  ValidatedSelect,
  LoadingSpinner,
  StepProgressIndicator
}; 