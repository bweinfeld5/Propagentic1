import { Timestamp } from 'firebase/firestore';

/**
 * Maintenance-related supplemental Types and Interfaces
 */

export interface MaintenanceStatusChange {
  status: string;
  changedAt: Timestamp;
  changedBy: string; // userId
  notes?: string;
}

export interface BulkOperation {
  id: string;
  operationType: 'assign_contractor' | 'change_priority' | 'change_status' | 'archive' | 'mark_completed';
  parameters: {
    contractorId?: string;
    priority?: string;
    status?: string;
    notes?: string;
  };
  initiatedBy: string;
  timestamp: Timestamp;
  targetRequestIds: string[];
  status: 'completed' | 'in-progress' | 'pending' | 'failed';
  results: {
    successful: string[];
    failed: { requestId: string; error: string }[];
  };
}

export interface RequestTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
}

export interface ContractorRating {
  id: string;
  requestId: string;
  contractorId: string;
  tenantId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  createdAt: Timestamp;
}

export interface PhotoDocumentation {
  id: string;
  url: string;
  uploadedBy: string;
  uploadedAt: Timestamp;
  caption?: string;
}

export interface TimeTracking {
  sessionId: string;
  startTime: Timestamp;
  endTime?: Timestamp;
  durationMinutes?: number;
  notes?: string;
}

export interface ContractorMaintenanceProfile {
  contractorId: string;
  userId: string;
  skills: string[];
  certifications: string[];
  availability: {
    isAvailable: boolean;
    maxConcurrentJobs: number;
    workingHours: {
      [key: string]: {
        start: string;
        end: string;
        available: boolean;
      };
    };
    emergencyAvailable: boolean;
    serviceRadius: number;
    baseLocation: {
      latitude: number;
      longitude: number;
    };
  };
  pricing: {
    hourlyRate: number;
    emergencyRate: number;
    minimumCharge: number;
    mileageRate: number;
  };
  equipment: string[];
  serviceAreas: string[];
  ratings: {
    averageRating: number;
    totalRatings: number;
    categories: {
      [category: string]: number;
    };
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface MaintenanceMetrics {
  averageResolutionTime: number; // in hours
  requestsCompleted: number;
  requestsPending: number;
  satisfactionScore?: number; // average rating
} 