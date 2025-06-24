/**
 * Maintenance Request Types and Interfaces
 */

import { Timestamp } from 'firebase/firestore';

export type MaintenanceStatus =
  | 'submitted'
  | 'pending'
  | 'assigned'
  | 'in-progress'
  | 'completed'
  | 'cancelled'
  | 'on-hold'
  | 'scheduled'
  | 'requires_parts'
  | 'pending_approval';

export type MaintenancePriority = 'low' | 'medium' | 'high' | 'urgent';

export type MaintenanceCategory = 
  | 'plumbing' 
  | 'electrical' 
  | 'hvac' 
  | 'appliance' 
  | 'structural' 
  | 'cosmetic' 
  | 'security' 
  | 'other';

export interface StatusChange {
  status: MaintenanceStatus;
  timestamp: Date;
  updatedBy: string;
  reason?: string;
  notes?: string;
}

export interface MaintenanceRequest {
  id: string;
  propertyId: string;
  propertyName: string;
  propertyAddress: string;
  tenantId: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone?: string;
  title: string;
  description: string;
  category: MaintenanceCategory;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  unitNumber?: string;
  specificLocation?: string;
  accessInstructions?: string;
  isEmergency: boolean;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  photos: string[];
  templateUsed?: string;
  contractorId?: string;
  contractorName?: string;
  estimatedCost?: number;
  actualCost?: number;
  estimatedDuration?: number; // in hours
  actualDuration?: number; // in hours
  scheduledDate?: Date;
  completedDate?: Date;
  rating?: number; // 1-5 stars
  tenantFeedback?: string;
  statusHistory: StatusChange[];
  communications?: any[]; // Will be defined in Communication model
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastStatusChange: Date;
  workOrderNumber?: string;
  internalNotes?: string;
  tags?: string[];
  recurringSchedule?: {
    frequency: 'weekly' | 'monthly' | 'quarterly' | 'annually';
    nextDue: Date;
  };
  assignedDate?: Timestamp;
} 