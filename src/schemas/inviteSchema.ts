import { z } from 'zod';

export const CreateInviteSchema = z.object({
  tenantEmail: z.string().email({
    message: 'Invalid email address for tenant.'
  }),
  propertyId: z.string().min(1, { message: 'Property ID is required.' }),
  landlordId: z.string().min(1, { message: 'Landlord ID is required.' }),
  propertyName: z.string().optional(), // For enriched data, not strictly for creation logic
  landlordName: z.string().optional(), // For enriched data
  unitNumber: z.string().optional(),
  // Note: 'status', 'createdAt', 'expiresAt' are handled by the backend/API
});

export type CreateInviteData = z.infer<typeof CreateInviteSchema>;

// Potentially other schemas like a full InviteSchema for validation if needed elsewhere
export const InviteSchema = z.object({
  // id: z.string(), // ID is handled by the API service, not part of the document data itself for validation here
  inviteId: z.string().optional(),
  tenantId: z.string().optional(),
  tenantEmail: z.string().email().optional(),
  email: z.string().email().optional(),
  propertyId: z.string(),
  status: z.enum(['pending', 'accepted', 'declined']).optional(),
  createdAt: z.any().optional(), // Consider z.date() or custom timestamp validator
  expiresAt: z.any().optional(), // Consider z.date() or custom timestamp validator
  propertyName: z.string().optional(),
  propertyAddress: z.string().optional(),
  propertyPhoto: z.string().url().optional(),
  managerName: z.string().optional(),
  managerEmail: z.string().email().optional(),
  managerPhone: z.string().optional(),
  unitId: z.string().optional(),
  unitDetails: z.object({
    unitNumber: z.string().optional(),
    floor: z.string().optional(),
    bedrooms: z.number().optional(),
    bathrooms: z.number().optional(),
  }).optional(),
  landlordName: z.string().optional(),
  landlordId: z.string().optional(),
  role: z.string().optional(),
  unitNumber: z.string().optional(),
  // If we want to allow any other keys that Firestore might add:
  // ...z.record(z.any()),
}); 