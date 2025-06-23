import { z } from 'zod';

// Enum for issue types - using Zod enums for validation
export const MaintenanceIssueTypeEnum = z.enum([
  'plumbing',
  'electrical',
  'hvac',
  'appliance',
  'structural',
  'pest_control',
  'landscaping',
  'general',
  'other',
]);
export type MaintenanceIssueType = z.infer<typeof MaintenanceIssueTypeEnum>;

// Enum for urgency levels
export const UrgencyLevelEnum = z.enum([
  'low',
  'medium',
  'high',
  'emergency', // Added emergency based on prior code
]);
export type UrgencyLevel = z.infer<typeof UrgencyLevelEnum>;

// Schema for creating a new maintenance request (tenant-side)
export const CreateMaintenanceRequestSchema = z.object({
  propertyId: z.string().min(1, { message: "Property ID is required" }),
  description: z.string()
    .min(10, { message: "Description must be at least 10 characters long" })
    .max(1000, { message: "Description cannot exceed 1000 characters" }),
  issueType: MaintenanceIssueTypeEnum,
  urgencyLevel: UrgencyLevelEnum.default('medium'),
  // Photos are handled separately (file uploads), not directly in this schema for DB storage
  // photoURLs: z.array(z.string().url()).optional(), // URLs will be stored
});
export type CreateMaintenanceRequestInput = z.infer<typeof CreateMaintenanceRequestSchema>;

// Schema for the MaintenanceTicket document in Firestore (more comprehensive)
export const MaintenanceTicketSchema = z.object({
  id: z.string(), // Document ID from Firestore
  ticketId: z.string(), // Often same as id, but good to have explicit model field
  
  tenantId: z.string(),
  tenantName: z.string().optional(),
  tenantEmail: z.string().email().optional(),
  
  propertyId: z.string(),
  propertyName: z.string().optional(),
  unitNumber: z.string().optional(), // If applicable
  
  description: z.string(),
  issueType: MaintenanceIssueTypeEnum,
  urgencyLevel: UrgencyLevelEnum,
  
  status: z.enum([
    'new', // Default status when tenant submits
    'pending_classification', // After creation, before AI or manual classification
    'classified',
    'pending_assignment',
    'assigned',
    'in_progress',
    'on_hold',
    'completed',
    'cancelled',
    'rejected',
    'escalated', // if requires special attention
  ]).default('new'),
  
  photos: z.array(z.string().url()).optional().default([]),
  
  createdAt: z.instanceof(Date), // Will be Firestore Timestamp, converted by converter
  updatedAt: z.instanceof(Date), // Will be Firestore Timestamp, converted by converter
  submittedAt: z.instanceof(Date).optional(), // Could be same as createdAt initially
  assignedAt: z.instanceof(Date).optional(),
  completedAt: z.instanceof(Date).optional(),
  
  assignedTo: z.string().optional(), // Contractor ID
  contractorName: z.string().optional(),
  
  resolutionDetails: z.string().optional(),
  feedbackRating: z.number().min(1).max(5).optional(),
  feedbackComment: z.string().optional(),

  // Example of a nested object for updates/history
  history: z.array(z.object({
    timestamp: z.instanceof(Date),
    userId: z.string().optional(), // User who made the update
    action: z.string(), // e.g., 'status_changed', 'comment_added'
    oldValue: z.any().optional(),
    newValue: z.any().optional(),
    notes: z.string().optional(),
  })).optional().default([]),

  // createdBy: z.string().optional(), // For audit trail, linking to user who created it
});
export type MaintenanceTicket = z.infer<typeof MaintenanceTicketSchema>;

// Example: Schema for updating a ticket (more flexible)
export const UpdateMaintenanceRequestSchema = CreateMaintenanceRequestSchema.partial().extend({
  status: MaintenanceTicketSchema.shape.status.optional(),
  assignedTo: z.string().optional(),
  resolutionDetails: z.string().optional(),
});
export type UpdateMaintenanceRequestInput = z.infer<typeof UpdateMaintenanceRequestSchema>; 