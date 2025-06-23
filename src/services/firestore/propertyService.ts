import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc,
  query,
  where,
  deleteDoc,
  Timestamp,
  addDoc
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { 
  Property, 
  EnhancedProperty, 
  HVACData, 
  PlumbingData, 
  ElectricalData, 
  ContractorEstimateReadiness 
} from '../../models/schema';
import { propertyConverter, createNewProperty } from '../../models/converters';
import { getClimateZoneByZip } from '../climateZoneService';

// Collection references
const propertiesCollection = collection(db, 'properties').withConverter(propertyConverter);

/**
 * Get a property by ID
 */
export async function getPropertyById(propertyId: string): Promise<Property | null> {
  const propertyDoc = doc(db, 'properties', propertyId).withConverter(propertyConverter);
  const propertySnapshot = await getDoc(propertyDoc);
  
  if (propertySnapshot.exists()) {
    return propertySnapshot.data();
  }
  
  return null;
}

/**
 * Get enhanced property by ID
 */
export async function getEnhancedPropertyById(propertyId: string): Promise<EnhancedProperty | null> {
  const propertyDoc = doc(db, 'properties', propertyId);
  const propertySnapshot = await getDoc(propertyDoc);
  
  if (propertySnapshot.exists()) {
    const data = propertySnapshot.data();
    return {
      ...data,
      propertyId: propertySnapshot.id
    } as EnhancedProperty;
  }
  
  return null;
}

/**
 * Get all properties for a landlord
 */
export async function getLandlordProperties(landlordId: string): Promise<Property[]> {
  const q = query(propertiesCollection, where('landlordId', '==', landlordId));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => doc.data());
}

/**
 * Get enhanced properties for a landlord
 */
export async function getLandlordEnhancedProperties(landlordId: string): Promise<EnhancedProperty[]> {
  const q = query(collection(db, 'properties'), where('landlordId', '==', landlordId));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    ...doc.data(),
    propertyId: doc.id
  })) as EnhancedProperty[];
}

/**
 * Create a new property
 */
export async function createProperty(
  propertyName: string,
  address: Property['address'],
  landlordId: string,
  unitList: string[] = []
): Promise<Property> {
  // Reference to a new document with auto-generated ID
  const propertyRef = doc(collection(db, 'properties'));
  const propertyId = propertyRef.id;
  
  const propertyData = createNewProperty(
    propertyId,
    propertyName,
    address,
    landlordId,
    unitList
  );
  
  await setDoc(propertyRef, propertyData);
  
  // Update landlord profile to include this property
  const landlordProfileRef = doc(db, 'landlordProfiles', landlordId);
  const landlordProfileSnapshot = await getDoc(landlordProfileRef);
  
  if (landlordProfileSnapshot.exists()) {
    const properties = landlordProfileSnapshot.data().properties || [];
    await updateDoc(landlordProfileRef, {
      properties: [...properties, propertyId]
    });
  }
  
  return propertyData;
}

/**
 * Update a property
 */
export async function updateProperty(
  propertyId: string, 
  propertyData: Partial<Property>
): Promise<void> {
  const propertyRef = doc(db, 'properties', propertyId);
  await updateDoc(propertyRef, propertyData);
}

/**
 * Add a unit to a property
 */
export async function addUnitToProperty(
  propertyId: string,
  unitNumber: string
): Promise<void> {
  const propertyRef = doc(db, 'properties', propertyId);
  const propertySnapshot = await getDoc(propertyRef);
  
  if (propertySnapshot.exists()) {
    const unitList = propertySnapshot.data().unitList || [];
    
    // Add unit if not already in the list
    if (!unitList.includes(unitNumber)) {
      await updateDoc(propertyRef, {
        unitList: [...unitList, unitNumber]
      });
    }
  }
}

/**
 * Remove a unit from a property
 */
export async function removeUnitFromProperty(
  propertyId: string,
  unitNumber: string
): Promise<void> {
  const propertyRef = doc(db, 'properties', propertyId);
  const propertySnapshot = await getDoc(propertyRef);
  
  if (propertySnapshot.exists()) {
    const unitList = propertySnapshot.data().unitList || [];
    
    await updateDoc(propertyRef, {
      unitList: unitList.filter((unit: string) => unit !== unitNumber)
    });
  }
}

/**
 * Add a tenant to a property
 */
export async function addTenantToProperty(
  propertyId: string,
  tenantId: string
): Promise<void> {
  const propertyRef = doc(db, 'properties', propertyId);
  const propertySnapshot = await getDoc(propertyRef);
  
  if (propertySnapshot.exists()) {
    const tenantIds = propertySnapshot.data().tenantIds || [];
    
    // Add tenant if not already in the list
    if (!tenantIds.includes(tenantId)) {
      await updateDoc(propertyRef, {
        tenantIds: [...tenantIds, tenantId]
      });
    }
  }
}

/**
 * Remove a tenant from a property
 */
export async function removeTenantFromProperty(
  propertyId: string,
  tenantId: string
): Promise<void> {
  const propertyRef = doc(db, 'properties', propertyId);
  const propertySnapshot = await getDoc(propertyRef);
  
  if (propertySnapshot.exists()) {
    const tenantIds = propertySnapshot.data().tenantIds || [];
    
    await updateDoc(propertyRef, {
      tenantIds: tenantIds.filter((id: string) => id !== tenantId)
    });
  }
}

// Export maintenance-related functions from the shared service
export { addMaintenanceRequestToProperty, removeMaintenanceRequestFromProperty } from './propertyMaintenanceService';

/**
 * Get all active maintenance requests for a property
 */
export async function getPropertyActiveRequests(propertyId: string): Promise<string[]> {
  const propertyRef = doc(db, 'properties', propertyId);
  const propertySnapshot = await getDoc(propertyRef);
  
  if (propertySnapshot.exists()) {
    return propertySnapshot.data().activeRequests || [];
  }
  
  return [];
}

// ========================================
// ENHANCED PROPERTY DATA FUNCTIONS
// ========================================

/**
 * Update HVAC data for a property
 */
export async function updatePropertyHVACData(
  propertyId: string, 
  hvacData: Partial<HVACData>
): Promise<void> {
  const propertyRef = doc(db, 'properties', propertyId);
  
  // Auto-calculate climate zone if ZIP code is available and not already set
  if (!hvacData.climateZone) {
    const property = await getEnhancedPropertyById(propertyId);
    if (property?.address?.zip || property?.enhancedAddress?.zip) {
      const zipCode = property.address?.zip || property.enhancedAddress?.zip;
      if (zipCode) {
        const climateZone = await getClimateZoneByZip(zipCode);
        hvacData.climateZone = climateZone.zone;
      }
    }
  }
  
  const updateData = {
    hvacData: {
      ...hvacData,
      lastUpdated: Timestamp.now(),
      dataSource: hvacData.dataSource || 'manual'
    }
  };
  
  await updateDoc(propertyRef, updateData);
  
  // Recalculate estimate readiness after update
  await calculateEstimateReadiness(propertyId);
}

/**
 * Update Plumbing data for a property
 */
export async function updatePropertyPlumbingData(
  propertyId: string, 
  plumbingData: Partial<PlumbingData>
): Promise<void> {
  const propertyRef = doc(db, 'properties', propertyId);
  
  const updateData = {
    plumbingData: {
      ...plumbingData,
      lastUpdated: Timestamp.now(),
      dataSource: plumbingData.dataSource || 'manual'
    }
  };
  
  await updateDoc(propertyRef, updateData);
  
  // Recalculate estimate readiness after update
  await calculateEstimateReadiness(propertyId);
}

/**
 * Update Electrical data for a property
 */
export async function updatePropertyElectricalData(
  propertyId: string, 
  electricalData: Partial<ElectricalData>
): Promise<void> {
  const propertyRef = doc(db, 'properties', propertyId);
  
  const updateData = {
    electricalData: {
      ...electricalData,
      lastUpdated: Timestamp.now(),
      dataSource: electricalData.dataSource || 'manual'
    }
  };
  
  await updateDoc(propertyRef, updateData);
  
  // Recalculate estimate readiness after update
  await calculateEstimateReadiness(propertyId);
}

/**
 * Calculate estimate readiness for all trades
 */
export async function calculateEstimateReadiness(propertyId: string): Promise<ContractorEstimateReadiness> {
  const property = await getEnhancedPropertyById(propertyId);
  
  if (!property) {
    throw new Error(`Property ${propertyId} not found`);
  }
  
  const readiness = calculatePropertyEstimateReadiness(property);
  
  // Update the property with the calculated readiness
  const propertyRef = doc(db, 'properties', propertyId);
  await updateDoc(propertyRef, {
    contractorEstimateReadiness: readiness
  });
  
  return readiness;
}

/**
 * Calculate estimate readiness for a property (utility function)
 */
function calculatePropertyEstimateReadiness(property: EnhancedProperty): ContractorEstimateReadiness {
  const hvacReadiness = calculateHVACReadiness(property);
  const plumbingReadiness = calculatePlumbingReadiness(property);
  const electricalReadiness = calculateElectricalReadiness(property);
  
  return {
    hvac: hvacReadiness.status,
    plumbing: plumbingReadiness.status,
    electrical: electricalReadiness.status,
    confidenceScores: {
      hvac: hvacReadiness.confidence,
      plumbing: plumbingReadiness.confidence,
      electrical: electricalReadiness.confidence
    },
    missingFields: {
      hvac: hvacReadiness.missingFields,
      plumbing: plumbingReadiness.missingFields,
      electrical: electricalReadiness.missingFields
    },
    lastCalculated: Timestamp.now()
  };
}

/**
 * Calculate HVAC estimate readiness
 */
function calculateHVACReadiness(property: EnhancedProperty): {
  status: 'ready' | 'partial' | 'insufficient';
  confidence: number;
  missingFields: string[];
} {
  const missingFields: string[] = [];
  let score = 0;
  let maxScore = 0;
  
  // CRITICAL fields (60% of total score)
  const criticalFields = [
    { field: 'squareFootage', weight: 15 },
    { field: 'yearBuilt', weight: 15 },
    { field: 'hvacData.currentSystems', weight: 15 },
    { field: 'hvacData.climateZone', weight: 15 }
  ];
  
  criticalFields.forEach(({ field, weight }) => {
    maxScore += weight;
    const value = getNestedValue(property, field);
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value) && value.length > 0) {
        score += weight;
      } else if (!Array.isArray(value)) {
        score += weight;
      } else {
        missingFields.push(field);
      }
    } else {
      missingFields.push(field);
    }
  });
  
  // IMPORTANT fields (30% of total score)
  const importantFields = [
    { field: 'hvacData.buildingConstruction', weight: 6 },
    { field: 'hvacData.ceilingHeight', weight: 6 },
    { field: 'hvacData.windowCount', weight: 6 },
    { field: 'hvacData.windowType', weight: 6 },
    { field: 'hvacData.insulationQuality', weight: 6 }
  ];
  
  importantFields.forEach(({ field, weight }) => {
    maxScore += weight;
    const value = getNestedValue(property, field);
    if (value !== undefined && value !== null && value !== '') {
      score += weight;
    } else {
      missingFields.push(field);
    }
  });
  
  // NICE-TO-HAVE fields (10% of total score)
  const niceToHaveFields = [
    { field: 'hvacData.currentUtilityCosts', weight: 3 },
    { field: 'hvacData.thermostatType', weight: 3 },
    { field: 'hvacData.hvacMaintenanceHistory', weight: 4 }
  ];
  
  niceToHaveFields.forEach(({ field, weight }) => {
    maxScore += weight;
    const value = getNestedValue(property, field);
    if (value !== undefined && value !== null && value !== '') {
      score += weight;
    }
  });
  
  const confidence = Math.round((score / maxScore) * 100);
  
  let status: 'ready' | 'partial' | 'insufficient';
  if (confidence >= 80) {
    status = 'ready';
  } else if (confidence >= 50) {
    status = 'partial';
  } else {
    status = 'insufficient';
  }
  
  return { status, confidence, missingFields };
}

/**
 * Calculate Plumbing estimate readiness
 */
function calculatePlumbingReadiness(property: EnhancedProperty): {
  status: 'ready' | 'partial' | 'insufficient';
  confidence: number;
  missingFields: string[];
} {
  const missingFields: string[] = [];
  let score = 0;
  let maxScore = 0;
  
  // CRITICAL fields (70% of total score)
  const criticalFields = [
    { field: 'plumbingData.fullBathrooms', weight: 18 },
    { field: 'plumbingData.halfBathrooms', weight: 12 },
    { field: 'plumbingData.kitchens', weight: 15 },
    { field: 'yearBuilt', weight: 15 },
    { field: 'propertyType', weight: 10 }
  ];
  
  criticalFields.forEach(({ field, weight }) => {
    maxScore += weight;
    const value = getNestedValue(property, field);
    if (value !== undefined && value !== null && value !== '') {
      score += weight;
    } else {
      missingFields.push(field);
    }
  });
  
  // IMPORTANT fields (25% of total score)
  const importantFields = [
    { field: 'plumbingData.waterPressureIssues', weight: 5 },
    { field: 'plumbingData.basementAccess', weight: 5 },
    { field: 'plumbingData.existingPipeMaterial', weight: 5 },
    { field: 'plumbingData.waterHeaterType', weight: 5 },
    { field: 'plumbingData.waterHeaterAge', weight: 5 }
  ];
  
  importantFields.forEach(({ field, weight }) => {
    maxScore += weight;
    const value = getNestedValue(property, field);
    if (value !== undefined && value !== null && value !== '') {
      score += weight;
    } else {
      missingFields.push(field);
    }
  });
  
  // NICE-TO-HAVE fields (5% of total score)
  const niceToHaveFields = [
    { field: 'plumbingData.fixtureQuality', weight: 3 },
    { field: 'plumbingData.waterQualityIssues', weight: 2 }
  ];
  
  niceToHaveFields.forEach(({ field, weight }) => {
    maxScore += weight;
    const value = getNestedValue(property, field);
    if (value !== undefined && value !== null && value !== '') {
      score += weight;
    }
  });
  
  const confidence = Math.round((score / maxScore) * 100);
  
  let status: 'ready' | 'partial' | 'insufficient';
  if (confidence >= 80) {
    status = 'ready';
  } else if (confidence >= 50) {
    status = 'partial';
  } else {
    status = 'insufficient';
  }
  
  return { status, confidence, missingFields };
}

/**
 * Calculate Electrical estimate readiness
 */
function calculateElectricalReadiness(property: EnhancedProperty): {
  status: 'ready' | 'partial' | 'insufficient';
  confidence: number;
  missingFields: string[];
} {
  const missingFields: string[] = [];
  let score = 0;
  let maxScore = 0;
  
  // CRITICAL fields (65% of total score)
  const criticalFields = [
    { field: 'squareFootage', weight: 20 },
    { field: 'yearBuilt', weight: 20 },
    { field: 'propertyType', weight: 15 },
    { field: 'unitList', weight: 10 }
  ];
  
  criticalFields.forEach(({ field, weight }) => {
    maxScore += weight;
    const value = getNestedValue(property, field);
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value) && value.length > 0) {
        score += weight;
      } else if (!Array.isArray(value)) {
        score += weight;
      } else {
        missingFields.push(field);
      }
    } else {
      missingFields.push(field);
    }
  });
  
  // IMPORTANT fields (30% of total score)
  const importantFields = [
    { field: 'electricalData.electricalPanelCapacity', weight: 8 },
    { field: 'electricalData.electricalPanelAge', weight: 7 },
    { field: 'electricalData.majorAppliances', weight: 8 },
    { field: 'electricalData.outdoorElectricalNeeds', weight: 7 }
  ];
  
  importantFields.forEach(({ field, weight }) => {
    maxScore += weight;
    const value = getNestedValue(property, field);
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value) && value.length > 0) {
        score += weight;
      } else if (!Array.isArray(value)) {
        score += weight;
      } else {
        missingFields.push(field);
      }
    } else {
      missingFields.push(field);
    }
  });
  
  // NICE-TO-HAVE fields (5% of total score)
  const niceToHaveFields = [
    { field: 'electricalData.smartHomeFeatures', weight: 2 },
    { field: 'electricalData.specialElectricalNeeds', weight: 3 }
  ];
  
  niceToHaveFields.forEach(({ field, weight }) => {
    maxScore += weight;
    const value = getNestedValue(property, field);
    if (value !== undefined && value !== null && value !== '') {
      score += weight;
    }
  });
  
  const confidence = Math.round((score / maxScore) * 100);
  
  let status: 'ready' | 'partial' | 'insufficient';
  if (confidence >= 80) {
    status = 'ready';
  } else if (confidence >= 50) {
    status = 'partial';
  } else {
    status = 'insufficient';
  }
  
  return { status, confidence, missingFields };
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

/**
 * Calculate data completeness percentages
 */
export async function calculateDataCompleteness(propertyId: string): Promise<{
  basic: number;
  hvac: number;
  plumbing: number;
  electrical: number;
  overall: number;
}> {
  const property = await getEnhancedPropertyById(propertyId);
  
  if (!property) {
    throw new Error(`Property ${propertyId} not found`);
  }
  
  // Calculate basic data completeness
  const basicFields = ['propertyName', 'address', 'squareFootage', 'yearBuilt', 'propertyType'];
  const basicCompleteness = calculateFieldCompleteness(property, basicFields);
  
  // Calculate HVAC data completeness
  const hvacFields = [
    'hvacData.currentSystems',
    'hvacData.climateZone',
    'hvacData.buildingConstruction',
    'hvacData.ceilingHeight',
    'hvacData.windowCount',
    'hvacData.windowType',
    'hvacData.insulationQuality',
    'hvacData.ductworkAccess'
  ];
  const hvacCompleteness = calculateFieldCompleteness(property, hvacFields);
  
  // Calculate Plumbing data completeness
  const plumbingFields = [
    'plumbingData.fullBathrooms',
    'plumbingData.halfBathrooms',
    'plumbingData.kitchens',
    'plumbingData.waterPressureIssues',
    'plumbingData.existingPipeMaterial',
    'plumbingData.waterHeaterType',
    'plumbingData.waterHeaterAge'
  ];
  const plumbingCompleteness = calculateFieldCompleteness(property, plumbingFields);
  
  // Calculate Electrical data completeness
  const electricalFields = [
    'electricalData.electricalPanelCapacity',
    'electricalData.electricalPanelAge',
    'electricalData.majorAppliances',
    'electricalData.outdoorElectricalNeeds'
  ];
  const electricalCompleteness = calculateFieldCompleteness(property, electricalFields);
  
  // Calculate overall completeness
  const overall = Math.round((basicCompleteness + hvacCompleteness + plumbingCompleteness + electricalCompleteness) / 4);
  
  const completeness = {
    basic: basicCompleteness,
    hvac: hvacCompleteness,
    plumbing: plumbingCompleteness,
    electrical: electricalCompleteness,
    overall
  };
  
  // Update property with completeness data
  const propertyRef = doc(db, 'properties', propertyId);
  await updateDoc(propertyRef, {
    dataCompleteness: completeness
  });
  
  return completeness;
}

/**
 * Calculate field completeness percentage
 */
function calculateFieldCompleteness(property: EnhancedProperty, fields: string[]): number {
  let completedFields = 0;
  
  fields.forEach(field => {
    const value = getNestedValue(property, field);
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value) && value.length > 0) {
        completedFields++;
      } else if (!Array.isArray(value)) {
        completedFields++;
      }
    }
  });
  
  return Math.round((completedFields / fields.length) * 100);
}

/**
 * Get properties by estimate readiness status
 */
export async function getPropertiesByReadinessStatus(
  landlordId: string,
  trade: 'hvac' | 'plumbing' | 'electrical',
  status: 'ready' | 'partial' | 'insufficient'
): Promise<EnhancedProperty[]> {
  const properties = await getLandlordEnhancedProperties(landlordId);
  
  return properties.filter(property => {
    const readiness = property.contractorEstimateReadiness;
    return readiness && readiness[trade] === status;
  });
} 