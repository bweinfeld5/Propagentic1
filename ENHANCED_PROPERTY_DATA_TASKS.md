# Enhanced Property Data Collection for Contractor Estimates - Implementation Tasks

## Overview
This document outlines the implementation plan for enhancing PropAgentic's property data collection to support accurate HVAC, Plumbing, and Electrical contractor estimates. The enhancement extends the existing property creation system with detailed technical specifications.

## Current State Analysis
Based on the existing codebase:
- ✅ Basic property form exists (`AddPropertyModal.jsx`) with 6-step wizard
- ✅ Current data includes: name, type, address, units, bedrooms, bathrooms, square footage, year built, amenities
- ✅ Firebase integration via `propertyService.ts` and `dataService.js`
- ✅ Property editing capabilities via `EditPropertyModal.jsx`

## Implementation Tasks

### Phase 1: Backend Data Model Extensions

#### Task 1.1: Extend Property Schema
**File:** `src/models/schema.ts` (or create if doesn't exist)
**Priority:** High
**Estimated Time:** 4 hours

```typescript
// Add new interfaces for detailed property data
interface HVACData {
  // CRITICAL
  currentSystems: string[]; // ['central_air', 'heating', 'none']
  climateZone: string; // derived from zip code
  
  // IMPORTANT
  buildingConstruction: string; // 'frame', 'masonry', 'concrete', 'mixed'
  ceilingHeight: number; // in feet
  windowCount: number;
  windowType: string; // 'single_pane', 'double_pane', 'energy_efficient'
  insulationQuality: string; // 'poor', 'average', 'good', 'excellent'
  ductworkAccess: string; // 'basement', 'crawl_space', 'attic', 'no_access'
  
  // NICE-TO-HAVE
  currentUtilityCosts: number; // monthly average
  hvacMaintenanceHistory: string[];
  thermostatType: string; // 'manual', 'programmable', 'smart'
  thermostatLocations: string[];
}

interface PlumbingData {
  // CRITICAL
  fullBathrooms: number;
  halfBathrooms: number;
  kitchens: number;
  kitchenettes: number;
  
  // IMPORTANT
  waterPressureIssues: boolean;
  basementAccess: boolean;
  crawlSpaceAccess: boolean;
  existingPipeMaterial: string; // 'copper', 'pvc', 'galvanized', 'mixed', 'unknown'
  waterHeaterType: string; // 'gas', 'electric', 'tankless', 'solar'
  waterHeaterAge: number; // years
  washerDryerHookups: boolean;
  
  // NICE-TO-HAVE
  plumbingIssueHistory: string[];
  waterQualityIssues: string[];
  fixtureQuality: string; // 'basic', 'standard', 'premium'
}

interface ElectricalData {
  // CRITICAL - uses existing square footage, year built, units, property type
  
  // IMPORTANT
  electricalPanelCapacity: number; // amps (100, 200, etc.)
  electricalPanelAge: number; // years
  majorAppliances: string[]; // from existing amenities + additions
  outdoorElectricalNeeds: string[]; // 'parking_lighting', 'security_lights', 'outlets'
  highDemandFacilities: string[]; // 'pool', 'gym', 'commercial_kitchen'
  
  // NICE-TO-HAVE
  smartHomeFeatures: string[];
  electricalIssueHistory: string[];
  specialElectricalNeeds: string[]; // 'ev_charging', 'workshop', 'server_room'
}

// Extend existing Property interface
interface EnhancedProperty extends Property {
  hvacData?: HVACData;
  plumbingData?: PlumbingData;
  electricalData?: ElectricalData;
  contractorEstimateReadiness?: {
    hvac: 'ready' | 'partial' | 'insufficient';
    plumbing: 'ready' | 'partial' | 'insufficient';
    electrical: 'ready' | 'partial' | 'insufficient';
  };
}
```

#### Task 1.2: Create Climate Zone Lookup Service
**File:** `src/services/climateZoneService.ts`
**Priority:** Medium
**Estimated Time:** 3 hours

```typescript
// Service to determine climate zone based on ZIP code
interface ClimateZone {
  zone: string; // '1A', '2A', '3A', etc.
  description: string;
  heatingDegreeDays: number;
  coolingDegreeDays: number;
}

export async function getClimateZoneByZip(zipCode: string): Promise<ClimateZone>
export function getClimateZoneRecommendations(zone: string): string[]
```

#### Task 1.3: Update Firebase Property Service
**File:** `src/services/firestore/propertyService.ts`
**Priority:** High
**Estimated Time:** 2 hours

```typescript
// Add functions for enhanced property data
export async function updatePropertyHVACData(propertyId: string, hvacData: HVACData): Promise<void>
export async function updatePropertyPlumbingData(propertyId: string, plumbingData: PlumbingData): Promise<void>
export async function updatePropertyElectricalData(propertyId: string, electricalData: ElectricalData): Promise<void>
export async function calculateEstimateReadiness(propertyId: string): Promise<ContractorEstimateReadiness>
```

### Phase 2: Frontend UI Enhancements

#### Task 2.1: Create Enhanced Property Data Collection Steps
**File:** `src/components/landlord/AddPropertyModalEnhanced.jsx`
**Priority:** High
**Estimated Time:** 8 hours

Extend the existing 6-step wizard with 3 additional steps:
- Step 7: HVAC System Details
- Step 8: Plumbing Information  
- Step 9: Electrical Specifications

```jsx
// Additional step components
const renderHVACDetails = () => (
  <div className="space-y-6">
    <h3 className="text-xl font-semibold text-gray-900 mb-6">
      HVAC System Information
      <span className="text-sm font-normal text-gray-500 ml-2">
        (Helps contractors provide accurate heating/cooling estimates)
      </span>
    </h3>
    
    {/* Current Systems - CRITICAL */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Current Heating/Cooling Systems *
      </label>
      <CheckboxGroup
        options={[
          'Central Air Conditioning',
          'Central Heating (Gas)',
          'Central Heating (Electric)',
          'Window AC Units',
          'Space Heaters',
          'No Current Systems'
        ]}
        selected={formData.hvacData?.currentSystems || []}
        onChange={(systems) => updateFormData('hvacData.currentSystems', systems)}
      />
    </div>

    {/* Building Construction - IMPORTANT */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Building Construction Type
      </label>
      <select
        value={formData.hvacData?.buildingConstruction || ''}
        onChange={(e) => updateFormData('hvacData.buildingConstruction', e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg"
      >
        <option value="">Select construction type</option>
        <option value="frame">Wood Frame</option>
        <option value="masonry">Masonry/Brick</option>
        <option value="concrete">Concrete</option>
        <option value="mixed">Mixed Construction</option>
      </select>
    </div>

    {/* Additional fields... */}
  </div>
);

const renderPlumbingDetails = () => (
  <div className="space-y-6">
    <h3 className="text-xl font-semibold text-gray-900 mb-6">
      Plumbing System Information
    </h3>
    
    {/* Bathroom Details - CRITICAL */}
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Full Bathrooms *
        </label>
        <input
          type="number"
          min="0"
          value={formData.plumbingData?.fullBathrooms || ''}
          onChange={(e) => updateFormData('plumbingData.fullBathrooms', parseInt(e.target.value))}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Half Bathrooms
        </label>
        <input
          type="number"
          min="0"
          value={formData.plumbingData?.halfBathrooms || ''}
          onChange={(e) => updateFormData('plumbingData.halfBathrooms', parseInt(e.target.value))}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg"
        />
      </div>
    </div>

    {/* Additional plumbing fields... */}
  </div>
);

const renderElectricalDetails = () => (
  <div className="space-y-6">
    <h3 className="text-xl font-semibold text-gray-900 mb-6">
      Electrical System Information
    </h3>
    
    {/* Electrical Panel - IMPORTANT */}
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Electrical Panel Capacity (Amps)
        </label>
        <select
          value={formData.electricalData?.electricalPanelCapacity || ''}
          onChange={(e) => updateFormData('electricalData.electricalPanelCapacity', parseInt(e.target.value))}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg"
        >
          <option value="">Select capacity</option>
          <option value="60">60 Amps</option>
          <option value="100">100 Amps</option>
          <option value="150">150 Amps</option>
          <option value="200">200 Amps</option>
          <option value="400">400 Amps</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Panel Age (Years)
        </label>
        <input
          type="number"
          min="0"
          value={formData.electricalData?.electricalPanelAge || ''}
          onChange={(e) => updateFormData('electricalData.electricalPanelAge', parseInt(e.target.value))}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg"
        />
      </div>
    </div>

    {/* Additional electrical fields... */}
  </div>
);
```

#### Task 2.2: Create Estimate Readiness Indicator Component ✅ COMPLETED
**File:** `src/components/landlord/ContractorEstimateReadinessIndicator.jsx`
**Priority:** Medium
**Estimated Time:** 3 hours
**Demo URL:** http://localhost:3000/demo/contractor-readiness

```jsx
const EstimateReadinessIndicator = ({ property }) => {
  const readiness = calculateReadiness(property);
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h4 className="text-lg font-medium text-gray-900 mb-3">
        Contractor Estimate Readiness
      </h4>
      
      <div className="space-y-2">
        <ReadinessItem
          trade="HVAC"
          status={readiness.hvac}
          missingFields={readiness.hvacMissing}
        />
        <ReadinessItem
          trade="Plumbing"
          status={readiness.plumbing}
          missingFields={readiness.plumbingMissing}
        />
        <ReadinessItem
          trade="Electrical"
          status={readiness.electrical}
          missingFields={readiness.electricalMissing}
        />
      </div>
    </div>
  );
};
```

#### Task 2.3: Update Property Dashboard Cards
**File:** `src/components/landlord/PropertyCard.jsx`
**Priority:** Medium
**Estimated Time:** 2 hours

Add estimate readiness badges to property cards:
```jsx
{/* Add estimate readiness indicators */}
<div className="flex space-x-1 mt-2">
  <ReadinessBadge trade="HVAC" status={property.contractorEstimateReadiness?.hvac} />
  <ReadinessBadge trade="Plumbing" status={property.contractorEstimateReadiness?.plumbing} />
  <ReadinessBadge trade="Electrical" status={property.contractorEstimateReadiness?.electrical} />
</div>
```

### Phase 3: Business Logic & Validation

#### Task 3.1: Create Estimate Readiness Calculator
**File:** `src/utils/estimateReadinessCalculator.ts`
**Priority:** High
**Estimated Time:** 4 hours

```typescript
interface ReadinessResult {
  hvac: 'ready' | 'partial' | 'insufficient';
  plumbing: 'ready' | 'partial' | 'insufficient';
  electrical: 'ready' | 'partial' | 'insufficient';
  hvacMissing: string[];
  plumbingMissing: string[];
  electricalMissing: string[];
  confidenceScores: {
    hvac: number; // 0-100
    plumbing: number;
    electrical: number;
  };
}

export function calculateEstimateReadiness(property: EnhancedProperty): ReadinessResult
export function getRecommendedDataCollection(property: EnhancedProperty): string[]
export function getConfidenceScore(trade: string, property: EnhancedProperty): number
```

#### Task 3.2: Add Form Validation Rules
**File:** `src/utils/propertyValidation.ts`
**Priority:** Medium
**Estimated Time:** 2 hours

```typescript
// Validation rules for enhanced property data
export function validateHVACData(hvacData: Partial<HVACData>): ValidationResult
export function validatePlumbingData(plumbingData: Partial<PlumbingData>): ValidationResult
export function validateElectricalData(electricalData: Partial<ElectricalData>): ValidationResult
```

### Phase 4: Database Migration & Setup

#### Task 4.1: Create Firestore Migration Script
**File:** `scripts/migratePropertyData.js`
**Priority:** Medium
**Estimated Time:** 3 hours

```javascript
// Script to add new fields to existing properties
// and calculate estimate readiness for existing data
const migrateExistingProperties = async () => {
  // Add default values for new fields
  // Calculate climate zones based on existing addresses
  // Set initial estimate readiness based on existing data
};
```

#### Task 4.2: Update Firestore Security Rules
**File:** `firestore.rules`
**Priority:** High
**Estimated Time:** 1 hour

```javascript
// Add rules for new property data fields
match /properties/{propertyId} {
  allow read, write: if request.auth != null 
    && request.auth.uid == resource.data.landlordId;
  
  // Allow contractors to read estimate-relevant data
  allow read: if request.auth != null 
    && request.auth.token.role == 'contractor'
    && 'hvacData' in resource.data
    && 'plumbingData' in resource.data
    && 'electricalData' in resource.data;
}
```

### Phase 5: Enhanced User Experience

#### Task 5.1: Create Property Data Import Helper
**File:** `src/components/landlord/PropertyDataImportHelper.jsx`
**Priority:** Low
**Estimated Time:** 4 hours

```jsx
// Component to help landlords gather data from existing documents
const PropertyDataImportHelper = () => {
  return (
    <div className="bg-blue-50 rounded-lg p-6 mb-6">
      <h4 className="text-lg font-medium text-blue-900 mb-3">
        📋 Data Collection Helper
      </h4>
      <p className="text-blue-800 mb-4">
        To get the most accurate contractor estimates, gather these documents:
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DataSourceCard
          title="HVAC Information"
          sources={[
            "Previous HVAC service records",
            "Utility bills (12 months)",
            "Property inspection reports",
            "Building blueprints"
          ]}
        />
        <DataSourceCard
          title="Plumbing Details"
          sources={[
            "Water quality reports",
            "Previous plumbing repairs",
            "Water heater documentation",
            "Property disclosure forms"
          ]}
        />
        <DataSourceCard
          title="Electrical Specs"
          sources={[
            "Electrical panel labels",
            "Recent electrical work permits",
            "Property inspection reports",
            "Appliance specifications"
          ]}
        />
      </div>
    </div>
  );
};
```

#### Task 5.2: Progressive Data Collection
**File:** `src/components/landlord/ProgressivePropertyEnhancement.jsx`
**Priority:** Medium
**Estimated Time:** 3 hours

```jsx
// Component to gradually collect missing data over time
const ProgressivePropertyEnhancement = ({ property }) => {
  const missingData = getMissingEstimateData(property);
  
  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
      <h4 className="text-lg font-medium text-orange-800 mb-2">
        🎯 Improve Estimate Accuracy
      </h4>
      <p className="text-orange-700 mb-3">
        Add {missingData.length} more details to get better contractor estimates:
      </p>
      <div className="space-y-2">
        {missingData.slice(0, 3).map((item, index) => (
          <QuickAddField
            key={index}
            field={item.field}
            label={item.label}
            priority={item.priority}
            onAdd={(value) => updatePropertyField(property.id, item.field, value)}
          />
        ))}
      </div>
    </div>
  );
};
```

### Phase 6: Integration with Contractor Workflow

#### Task 6.1: Create Contractor Estimate Request Form
**File:** `src/components/contractor/EnhancedEstimateRequest.jsx`
**Priority:** Medium
**Estimated Time:** 4 hours

```jsx
// Form for contractors to request estimates with enhanced property data
const EnhancedEstimateRequest = ({ property, estimateType }) => {
  const readiness = calculateEstimateReadiness(property);
  const confidence = getConfidenceScore(estimateType, property);
  
  return (
    <div className="space-y-6">
      <EstimateReadinessOverview
        property={property}
        trade={estimateType}
        confidence={confidence}
      />
      
      <PropertyDataSummary
        property={property}
        trade={estimateType}
        highlightMissing={true}
      />
      
      <EstimateRequestForm
        property={property}
        trade={estimateType}
        readinessLevel={readiness[estimateType]}
      />
    </div>
  );
};
```

#### Task 6.2: Update Contractor Dashboard
**File:** `src/pages/contractor/ContractorDashboard.jsx`
**Priority:** Low
**Estimated Time:** 2 hours

Add estimate readiness filters and indicators to job listings.

### Phase 7: Testing & Quality Assurance

#### Task 7.1: Create Test Suite for Enhanced Property Data
**File:** `src/__tests__/enhancedPropertyData.test.js`
**Priority:** High
**Estimated Time:** 4 hours

```javascript
describe('Enhanced Property Data', () => {
  test('calculates HVAC estimate readiness correctly', () => {
    // Test readiness calculation logic
  });
  
  test('validates property data input', () => {
    // Test validation rules
  });
  
  test('saves enhanced property data to Firestore', () => {
    // Test database operations
  });
});
```

#### Task 7.2: Integration Testing
**Priority:** High
**Estimated Time:** 3 hours

- Test complete property creation flow with enhanced data
- Test estimate readiness calculations
- Test contractor access to property data

## Implementation Timeline

### Sprint 1 (Week 1-2): Foundation
- Task 1.1: Extend Property Schema
- Task 1.2: Climate Zone Service
- Task 1.3: Update Firebase Service
- Task 4.2: Update Security Rules

### Sprint 2 (Week 3-4): Core UI
- Task 2.1: Enhanced Property Modal
- Task 2.2: Readiness Indicator
- Task 3.1: Readiness Calculator

### Sprint 3 (Week 5-6): Integration & Polish
- Task 2.3: Update Property Cards
- Task 3.2: Validation Rules
- Task 5.2: Progressive Collection
- Task 7.1: Testing

### Sprint 4 (Week 7-8): Advanced Features
- Task 5.1: Import Helper
- Task 6.1: Contractor Integration
- Task 4.1: Migration Script
- Task 7.2: Integration Testing

## Success Metrics

1. **Data Completeness**: Increase average property data completeness from ~40% to 75%
2. **Estimate Accuracy**: Reduce contractor estimate variance by 25%
3. **User Adoption**: 80% of new properties created with enhanced data
4. **Contractor Satisfaction**: Improve contractor satisfaction with available property data

## Risk Mitigation

1. **Data Overwhelm**: Implement progressive disclosure and optional fields
2. **Migration Issues**: Thorough testing with backup/rollback plan
3. **Performance**: Lazy loading of enhanced data, efficient queries
4. **User Experience**: Clear guidance and help text throughout

## Post-Implementation Maintenance

1. **Data Quality Monitoring**: Track completion rates and data quality
2. **User Feedback Integration**: Regular surveys and usage analytics
3. **Contractor Feedback Loop**: Monitor estimate accuracy improvements
4. **Feature Enhancement**: Add more specialized data based on contractor needs 