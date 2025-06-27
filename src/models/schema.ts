import { Timestamp } from 'firebase/firestore';

/**
 * User interface - base type for all users
 */
export interface User {
  uid: string;
  role: 'tenant' | 'landlord' | 'contractor';
  name: string;
  email: string;
  phone: string;
  linkedTo: string[]; // Linked accounts (family members, etc.)
  createdAt: Timestamp;
  profileComplete: boolean;
}

/**
 * Tenant user interface
 */
export interface TenantUser extends User {
  role: 'tenant';
  landlordId: string; // Reference to landlord
  propertyId: string; // Reference to property
  unitNumber: string; // Unit number within property
}

/**
 * Landlord user interface
 */
export interface LandlordUser extends User {
  role: 'landlord';
}

/**
 * Contractor user interface
 */
export interface ContractorUser extends User {
  role: 'contractor';
  contractorSkills: string[]; // List of skills/specialties
  companyId?: string; // Optional reference to company
}

/**
 * Property interface
 */
export interface Property {
  propertyId: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  propertyName: string;
  unitList: string[]; // Array of unit numbers/identifiers
  landlordId: string; // Reference to the owner/landlord
  tenantIds: string[]; // References to tenant users (legacy)
  tenants: string[]; // Array of tenant user IDs (primary field)
  activeRequests: string[]; // References to active maintenance tickets
  createdAt: Timestamp;
}

/**
 * Maintenance ticket interface
 */
export interface MaintenanceTicket {
  ticketId: string;
  description: string;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  category: string; // Type of maintenance issue
  photoUrl?: string; // Optional photo of the issue
  status: TicketStatus;
  submittedBy: string; // Reference to user who submitted
  propertyId: string; // Reference to property
  unitNumber: string; // Unit number within property
  assignedTo?: string; // Reference to contractor assigned (if any)
  timestamps: {
    createdAt: Timestamp;
    updatedAt: Timestamp;
    assignedAt?: Timestamp;
    completedAt?: Timestamp;
    classifiedAt?: Timestamp;
  };
}

/**
 * Ticket status types
 */
export type TicketStatus = 
  'pending_classification' | 
  'classified' | 
  'assigned' | 
  'in_progress' | 
  'completed' | 
  'canceled';

/**
 * Landlord profile interface
 */
export interface LandlordProfile {
  landlordId: string;
  userId: string; // Reference to user document
  properties: string[]; // References to property documents
  tenants: string[]; // References to tenant users
  contractors: string[]; // References to trusted contractors
  invitesSent: string[]; // References to invites sent
}

/**
 * Contractor profile interface
 */
export interface ContractorProfile {
  contractorId: string;
  userId: string; // Reference to user document
  skills: string[]; // List of skills/specialties
  serviceArea: string; // Geographic service area
  availability: boolean; // Whether contractor is available for new jobs
  preferredProperties: string[]; // Properties they prefer to work with
  rating: number; // Average rating (0-5)
  jobsCompleted: number; // Number of jobs completed
  companyName?: string; // Optional company name
}

/**
 * Invite interface
 */
export interface Invite {
  inviteId: string;
  email: string;
  role: 'tenant' | 'contractor';
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  landlordId?: string; // Reference to landlord who sent the invite
  propertyId?: string; // Property ID (for tenant invites)
  unitNumber?: string; // Unit number (for tenant invites)
  createdAt: Timestamp;
  expiresAt: Timestamp;
}

// ========================================
// ENHANCED PROPERTY DATA FOR CONTRACTOR ESTIMATES
// ========================================

/**
 * HVAC System Data for Contractor Estimates
 * Contains detailed information needed for accurate HVAC estimates
 */
export interface HVACData {
  // CRITICAL FIELDS - Cannot estimate without these
  currentSystems: string[]; // ['central_air', 'central_heating_gas', 'central_heating_electric', 'window_ac', 'space_heaters', 'none']
  climateZone: string; // Derived from ZIP code - '1A', '2A', '3A', etc.
  
  // IMPORTANT FIELDS - Significantly affects estimate accuracy
  buildingConstruction: 'frame' | 'masonry' | 'concrete' | 'mixed' | 'unknown';
  ceilingHeight: number; // in feet
  windowCount: number;
  windowType: 'single_pane' | 'double_pane' | 'energy_efficient' | 'unknown';
  insulationQuality: 'poor' | 'average' | 'good' | 'excellent' | 'unknown';
  ductworkAccess: 'basement' | 'crawl_space' | 'attic' | 'no_access' | 'unknown';
  
  // NICE-TO-HAVE FIELDS - Improves estimate precision
  currentUtilityCosts?: number; // monthly average in dollars
  hvacMaintenanceHistory?: string[]; // Array of maintenance records
  thermostatType?: 'manual' | 'programmable' | 'smart' | 'unknown';
  thermostatLocations?: string[]; // Array of thermostat locations
  
  // Metadata
  lastUpdated?: Timestamp;
  dataSource?: 'manual' | 'inspection' | 'utility_records' | 'property_manager';
}

/**
 * Plumbing System Data for Contractor Estimates
 * Contains detailed information needed for accurate plumbing estimates
 */
export interface PlumbingData {
  // CRITICAL FIELDS - Cannot estimate without these
  fullBathrooms: number;
  halfBathrooms: number;
  kitchens: number;
  kitchenettes: number;
  
  // IMPORTANT FIELDS - Significantly affects estimate accuracy
  waterPressureIssues: boolean;
  basementAccess: boolean;
  crawlSpaceAccess: boolean;
  existingPipeMaterial: 'copper' | 'pvc' | 'galvanized' | 'mixed' | 'unknown';
  waterHeaterType: 'gas' | 'electric' | 'tankless' | 'solar' | 'unknown';
  waterHeaterAge: number; // in years
  washerDryerHookups: boolean;
  
  // NICE-TO-HAVE FIELDS - Improves estimate precision
  plumbingIssueHistory?: string[]; // Array of previous plumbing issues
  waterQualityIssues?: string[]; // Array of water quality concerns
  fixtureQuality?: 'basic' | 'standard' | 'premium' | 'unknown';
  
  // Additional details
  sewerLineType?: 'city' | 'septic' | 'unknown';
  waterSupplyType?: 'city' | 'well' | 'unknown';
  
  // Metadata
  lastUpdated?: Timestamp;
  dataSource?: 'manual' | 'inspection' | 'maintenance_records' | 'property_manager';
}

/**
 * Electrical System Data for Contractor Estimates
 * Contains detailed information needed for accurate electrical estimates
 * Note: Square footage, year built, units, and property type come from base Property interface
 */
export interface ElectricalData {
  // IMPORTANT FIELDS - Significantly affects estimate accuracy
  electricalPanelCapacity: number; // in amps (60, 100, 150, 200, 400, etc.)
  electricalPanelAge: number; // in years
  majorAppliances: string[]; // From amenities + additional appliances
  outdoorElectricalNeeds: string[]; // ['parking_lighting', 'security_lights', 'outdoor_outlets', 'landscape_lighting']
  highDemandFacilities: string[]; // ['pool', 'gym', 'commercial_kitchen', 'workshop', 'server_room']
  
  // NICE-TO-HAVE FIELDS - Improves estimate precision
  smartHomeFeatures?: string[]; // Array of smart home integrations
  electricalIssueHistory?: string[]; // Array of previous electrical issues
  specialElectricalNeeds?: string[]; // ['ev_charging', 'workshop_220v', 'server_room', 'home_theater']
  
  // Panel and wiring details
  wiringType?: 'copper' | 'aluminum' | 'mixed' | 'unknown';
  groundingSystem?: 'modern' | 'upgraded' | 'outdated' | 'unknown';
  circuitBreakerType?: 'standard' | 'arc_fault' | 'gfci' | 'mixed' | 'unknown';
  
  // Code compliance
  lastElectricalInspection?: Timestamp;
  codeComplianceLevel?: 'current' | 'minor_updates_needed' | 'major_updates_needed' | 'unknown';
  
  // Metadata
  lastUpdated?: Timestamp;
  dataSource?: 'manual' | 'inspection' | 'permit_records' | 'property_manager';
}

/**
 * Contractor Estimate Readiness Status
 * Indicates how complete the property data is for each trade
 */
export interface ContractorEstimateReadiness {
  hvac: 'ready' | 'partial' | 'insufficient';
  plumbing: 'ready' | 'partial' | 'insufficient';
  electrical: 'ready' | 'partial' | 'insufficient';
  
  // Confidence scores (0-100)
  confidenceScores: {
    hvac: number;
    plumbing: number;
    electrical: number;
  };
  
  // Missing critical fields for each trade
  missingFields: {
    hvac: string[];
    plumbing: string[];
    electrical: string[];
  };
  
  // Last calculated
  lastCalculated: Timestamp;
}

/**
 * Enhanced Property Interface
 * Extends the base Property interface with detailed contractor estimation data
 */
export interface EnhancedProperty extends Property {
  // Enhanced data for contractor estimates
  hvacData?: HVACData;
  plumbingData?: PlumbingData;
  electricalData?: ElectricalData;
  contractorEstimateReadiness?: ContractorEstimateReadiness;
  
  // Additional property details for estimates
  squareFootage?: number; // Total square footage
  yearBuilt?: number; // Year property was built
  propertyType?: 'apartment' | 'house' | 'condo' | 'townhouse' | 'duplex' | 'studio' | 'loft' | 'commercial';
  
  // Enhanced address with coordinates for climate zone calculation
  enhancedAddress?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
    climateZone?: string;
  };
  
  // Data completeness tracking
  dataCompleteness?: {
    basic: number; // Percentage of basic property data completed
    hvac: number; // Percentage of HVAC data completed
    plumbing: number; // Percentage of plumbing data completed
    electrical: number; // Percentage of electrical data completed
    overall: number; // Overall data completeness percentage
  };
}

/**
 * Property Data Priority Levels
 * Helps determine which fields to collect first
 */
export type DataPriority = 'critical' | 'important' | 'nice_to_have';

/**
 * Field Metadata Interface
 * Provides additional context about each data field
 */
export interface FieldMetadata {
  field: string;
  label: string;
  priority: DataPriority;
  trade: 'hvac' | 'plumbing' | 'electrical' | 'general';
  helpText?: string;
  estimateImpact: 'high' | 'medium' | 'low'; // How much this field affects estimate accuracy
} 