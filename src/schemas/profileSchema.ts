import { z } from 'zod';
import { isValidPhoneNumber } from 'libphonenumber-js';

// Base profile schema that applies to all user types
export const baseProfileSchema = z.object({
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes'),
  
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes'),
  
  email: z.string()
    .email('Invalid email address')
    .max(100, 'Email must be less than 100 characters'),
  
  phone: z.string()
    .optional()
    .refine(
      (val: string | undefined) => !val || isValidPhoneNumber(val, 'US'),
      { message: 'Invalid phone number format' }
    ),
  
  displayName: z.string().optional(),
});

// Landlord-specific profile schema
export const landlordProfileSchema = baseProfileSchema.extend({
  businessName: z.string()
    .min(1, 'Business name is required')
    .max(100, 'Business name must be less than 100 characters'),
  
  licenseNumber: z.string()
    .max(50, 'License number must be less than 50 characters')
    .optional(),
  
  yearsInBusiness: z.number()
    .min(0, 'Years in business cannot be negative')
    .max(100, 'Years in business must be realistic')
    .optional(),
});

// Function to get the appropriate schema based on user role
export const getSchemaForRole = (role: string) => {
  switch (role) {
    case 'landlord':
      return landlordProfileSchema;
    default:
      return baseProfileSchema;
  }
};

// Type definitions for TypeScript
export type BaseProfileData = z.infer<typeof baseProfileSchema>;
export type LandlordProfileData = z.infer<typeof landlordProfileSchema>;

// Utility function to validate profile data
export const validateProfileData = (data: any, role: string) => {
  const schema = getSchemaForRole(role);
  return schema.safeParse(data);
};

// Password change schema
export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  confirmPassword: z.string(),
}).refine((data: { newPassword: string; confirmPassword: string }) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type PasswordChangeData = z.infer<typeof passwordChangeSchema>;
