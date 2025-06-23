import { z } from 'zod';

export const CreateInviteSchema = z.object({
  // Required fields with validation
  tenantEmail: z.string().email({
    message: 'Invalid email address for tenant.'
  }),
  propertyId: z.string().min(1, { 
    message: 'Property ID is required.' 
  }),
  landlordId: z.string().min(1, { 
    message: 'Landlord ID is required.' 
  }),

  // Property related fields
  propertyName: z.string().optional(),
  propertyAddress: z.string().optional(),
  propertyPhoto: z.string().url().optional(),

  // Unit related fields
  unitId: z.string().optional(),
  unitDetails: z.object({
    unitNumber: z.string().optional(),
    floor: z.string().optional(),
    bedrooms: z.number().optional(),
    bathrooms: z.number().optional(),
  }).optional(),
  unitNumber: z.string().optional(),

  // Manager related fields
  managerName: z.string().optional(),
  managerEmail: z.string().email().optional(),
  managerPhone: z.string().optional(),

  // Additional fields
  landlordName: z.string().optional(),
  role: z.string().optional(),
  status: z.enum(['pending', 'accepted', 'declined'])
    .default('pending'),
  
  // Timestamp fields
  createdAt: z.date().default(() => new Date()),
  expiresAt: z.date().optional()
});

export type CreateInviteData = z.infer<typeof CreateInviteSchema>; 