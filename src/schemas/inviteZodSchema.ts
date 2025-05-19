import { z } from 'zod';

export const InviteStatus = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  EXPIRED: 'expired',
  DELETED: 'deleted',
} as const;

export const InviteSchema = z.object({
  tenantEmail: z.string().email(),
  propertyId: z.string(),
  landlordId: z.string(),
  status: z.enum(['pending', 'accepted', 'declined', 'expired', 'deleted']),
  emailSentStatus: z.enum(['pending', 'sent', 'failed']).default('pending'),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
  expiresAt: z.any().optional(),
  acceptedAt: z.any().optional(),
  declinedAt: z.any().optional(),
  deletedAt: z.any().optional(),
  propertyName: z.string().optional(),
  propertyAddress: z.string().optional(),
  propertyPhoto: z.string().url().optional(),
  landlordName: z.string().optional(),
  tenantId: z.string().optional(),
  unitId: z.string().optional(),
  unitNumber: z.string().optional(),
  unitDetails: z.object({
    unitNumber: z.string().optional(),
    floor: z.string().optional(),
    bedrooms: z.number().optional(),
    bathrooms: z.number().optional(),
  }).optional(),
});