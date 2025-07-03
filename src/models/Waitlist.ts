import { Timestamp } from 'firebase/firestore';

export interface WaitlistEntry {
  id?: string;
  name: string;
  email: string;
  phoneNumber: string;
  userType: 'landlord' | 'tenant' | 'contractor' | 'property_manager' | 'other';
  interests: string[];
  referralSource?: string;
  companyName?: string;
  propertyCount?: string;
  userId?: string | null;
  ipAddress?: string | null;
  userAgent?: string;
  timestamp: Timestamp;
  source: 'waitlist_form' | 'landing_page' | 'referral' | 'other';
  status: 'active' | 'contacted' | 'converted' | 'unsubscribed';
  priority?: 'high' | 'medium' | 'low';
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface WaitlistMetrics {
  totalSignups: number;
  byUserType: Record<string, number>;
  byReferralSource: Record<string, number>;
  conversionRate: number;
  recentSignups: number; // last 7 days
}

export interface WaitlistFilters {
  userType?: string;
  status?: string;
  priority?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  interests?: string[];
}

export type WaitlistStatus = 'active' | 'contacted' | 'converted' | 'unsubscribed';
export type WaitlistPriority = 'high' | 'medium' | 'low';
export type WaitlistUserType = 'landlord' | 'tenant' | 'contractor' | 'property_manager' | 'other';
export type WaitlistSource = 'waitlist_form' | 'landing_page' | 'referral' | 'other'; 