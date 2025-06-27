/**
 * Climate Zone Service - PropAgentic
 * 
 * Service to determine climate zone based on ZIP code for accurate HVAC estimates
 * Uses IECC (International Energy Conservation Code) climate zones
 */

import { Timestamp } from 'firebase/firestore';

/**
 * Climate Zone Information Interface
 */
export interface ClimateZone {
  zone: string; // '1A', '2A', '3A', '3B', '3C', '4A', '4B', '4C', '5A', '5B', '6A', '6B', '7', '8'
  description: string;
  heatingDegreeDays: number; // HDD65 (base 65°F)
  coolingDegreeDays: number; // CDD50 (base 50°F)
  designTemp: {
    winter: number; // Winter design temperature (°F)
    summer: number; // Summer design temperature (°F)
  };
  hvacRecommendations: string[];
  climateCharacteristics: string[];
}

/**
 * ZIP Code to Climate Zone Mapping
 * This is a simplified mapping - in production, you'd want a more comprehensive database
 */
const zipCodeToClimateZone: Record<string, string> = {
  // Zone 1A - Very Hot, Humid (South Florida, Hawaii)
  '33101': '1A', '33102': '1A', '33109': '1A', '33111': '1A', '33112': '1A',
  '96701': '1A', '96702': '1A', '96703': '1A', '96704': '1A', '96705': '1A',
  
  // Zone 2A - Hot, Humid (South Texas, Louisiana, parts of Florida)
  '77001': '2A', '77002': '2A', '77003': '2A', '77004': '2A', '77005': '2A',
  '70001': '2A', '70002': '2A', '70003': '2A', '70004': '2A', '70005': '2A',
  '32601': '2A', '32602': '2A', '32603': '2A', '32604': '2A', '32605': '2A',
  
  // Zone 2B - Hot, Dry (Phoenix, Las Vegas, parts of Arizona/Nevada)
  '85001': '2B', '85002': '2B', '85003': '2B', '85004': '2B', '85005': '2B',
  '89101': '2B', '89102': '2B', '89103': '2B', '89104': '2B', '89105': '2B',
  
  // Zone 3A - Warm, Humid (Atlanta, Birmingham, parts of Southeast)
  '30301': '3A', '30302': '3A', '30303': '3A', '30304': '3A', '30305': '3A',
  '35201': '3A', '35202': '3A', '35203': '3A', '35204': '3A', '35205': '3A',
  
  // Zone 3B - Warm, Dry (Los Angeles, San Diego, parts of California)
  '90001': '3B', '90002': '3B', '90003': '3B', '90004': '3B', '90005': '3B',
  '92101': '3B', '92102': '3B', '92103': '3B', '92104': '3B', '92105': '3B',
  
  // Zone 3C - Warm, Marine (San Francisco, coastal California)
  '94101': '3C', '94102': '3C', '94103': '3C', '94104': '3C', '94105': '3C',
  
  // Zone 4A - Mixed, Humid (New York, Philadelphia, Washington DC)
  '10001': '4A', '10002': '4A', '10003': '4A', '10004': '4A', '10005': '4A',
  '19101': '4A', '19102': '4A', '19103': '4A', '19104': '4A', '19105': '4A',
  '20001': '4A', '20002': '4A', '20003': '4A', '20004': '4A', '20005': '4A',
  
  // Zone 4B - Mixed, Dry (Denver, Salt Lake City, Albuquerque)
  '80201': '4B', '80202': '4B', '80203': '4B', '80204': '4B', '80205': '4B',
  '84101': '4B', '84102': '4B', '84103': '4B', '84104': '4B', '84105': '4B',
  '87101': '4B', '87102': '4B', '87103': '4B', '87104': '4B', '87105': '4B',
  
  // Zone 4C - Mixed, Marine (Seattle, Portland)
  '98101': '4C', '98102': '4C', '98103': '4C', '98104': '4C', '98105': '4C',
  '97201': '4C', '97202': '4C', '97203': '4C', '97204': '4C', '97205': '4C',
  
  // Zone 5A - Cool, Humid (Chicago, Detroit, Boston)
  '60601': '5A', '60602': '5A', '60603': '5A', '60604': '5A', '60605': '5A',
  '48201': '5A', '48202': '5A', '48203': '5A', '48204': '5A', '48205': '5A',
  '02101': '5A', '02102': '5A', '02103': '5A', '02104': '5A', '02105': '5A',
  
  // Zone 5B - Cool, Dry (parts of Colorado, Wyoming, Montana)
  '80301': '5B', '80302': '5B', '80303': '5B', '80304': '5B', '80305': '5B',
  
  // Zone 6A - Cold, Humid (Minneapolis, Burlington VT)
  '55401': '6A', '55402': '6A', '55403': '6A', '55404': '6A', '55405': '6A',
  '05401': '6A', '05402': '6A', '05403': '6A', '05404': '6A', '05405': '6A',
  
  // Zone 6B - Cold, Dry (parts of Montana, Wyoming, Colorado)
  '59701': '6B', '59702': '6B', '59703': '6B', '59704': '6B', '59705': '6B',
  
  // Zone 7 - Very Cold (Duluth MN, northern Maine)
  '55801': '7', '55802': '7', '55803': '7', '55804': '7', '55805': '7',
  '04401': '7', '04402': '7', '04403': '7', '04404': '7', '04405': '7',
  
  // Zone 8 - Subarctic (Fairbanks, Alaska)
  '99701': '8', '99702': '8', '99703': '8', '99704': '8', '99705': '8'
};

/**
 * Climate Zone Definitions
 */
const climateZoneDefinitions: Record<string, ClimateZone> = {
  '1A': {
    zone: '1A',
    description: 'Very Hot, Humid',
    heatingDegreeDays: 0,
    coolingDegreeDays: 5000,
    designTemp: { winter: 45, summer: 97 },
    hvacRecommendations: [
      'High-efficiency air conditioning essential',
      'Dehumidification capabilities important',
      'Minimal heating requirements',
      'Focus on cooling efficiency and humidity control'
    ],
    climateCharacteristics: [
      'Year-round cooling needs',
      'High humidity levels',
      'Minimal winter heating',
      'Hot, muggy summers'
    ]
  },
  
  '2A': {
    zone: '2A',
    description: 'Hot, Humid',
    heatingDegreeDays: 1350,
    coolingDegreeDays: 2750,
    designTemp: { winter: 35, summer: 95 },
    hvacRecommendations: [
      'High-efficiency cooling systems',
      'Moderate heating capacity needed',
      'Humidity control important',
      'Heat pump systems often ideal'
    ],
    climateCharacteristics: [
      'Hot, humid summers',
      'Mild winters',
      'Extended cooling season',
      'Moderate heating needs'
    ]
  },
  
  '2B': {
    zone: '2B',
    description: 'Hot, Dry',
    heatingDegreeDays: 1350,
    coolingDegreeDays: 2750,
    designTemp: { winter: 35, summer: 109 },
    hvacRecommendations: [
      'Evaporative cooling may be effective',
      'High-efficiency air conditioning',
      'Minimal humidity concerns',
      'Solar considerations important'
    ],
    climateCharacteristics: [
      'Very hot, dry summers',
      'Low humidity',
      'Minimal precipitation',
      'High solar gain'
    ]
  },
  
  '3A': {
    zone: '3A',
    description: 'Warm, Humid',
    heatingDegreeDays: 2500,
    coolingDegreeDays: 1750,
    designTemp: { winter: 25, summer: 92 },
    hvacRecommendations: [
      'Balanced heating and cooling systems',
      'Heat pump systems ideal',
      'Humidity control during summer',
      'Moderate efficiency requirements'
    ],
    climateCharacteristics: [
      'Warm, humid summers',
      'Cool winters',
      'Balanced heating/cooling needs',
      'Moderate humidity'
    ]
  },
  
  '3B': {
    zone: '3B',
    description: 'Warm, Dry',
    heatingDegreeDays: 2500,
    coolingDegreeDays: 1750,
    designTemp: { winter: 25, summer: 94 },
    hvacRecommendations: [
      'Balanced systems needed',
      'Evaporative cooling effective',
      'Minimal humidity concerns',
      'Energy-efficient designs'
    ],
    climateCharacteristics: [
      'Warm, dry climate',
      'Low humidity year-round',
      'Mild winters',
      'Comfortable spring/fall'
    ]
  },
  
  '3C': {
    zone: '3C',
    description: 'Warm, Marine',
    heatingDegreeDays: 2500,
    coolingDegreeDays: 150,
    designTemp: { winter: 35, summer: 81 },
    hvacRecommendations: [
      'Minimal cooling needs',
      'Moderate heating required',
      'Humidity rarely an issue',
      'Natural ventilation effective'
    ],
    climateCharacteristics: [
      'Mild year-round temperatures',
      'Marine influence',
      'Minimal cooling needs',
      'Moderate heating'
    ]
  },
  
  '4A': {
    zone: '4A',
    description: 'Mixed, Humid',
    heatingDegreeDays: 4000,
    coolingDegreeDays: 1000,
    designTemp: { winter: 15, summer: 88 },
    hvacRecommendations: [
      'Balanced heating and cooling',
      'Heat pumps often effective',
      'Summer dehumidification helpful',
      'Four-season comfort systems'
    ],
    climateCharacteristics: [
      'Four distinct seasons',
      'Hot, humid summers',
      'Cold winters',
      'Balanced HVAC needs'
    ]
  },
  
  '4B': {
    zone: '4B',
    description: 'Mixed, Dry',
    heatingDegreeDays: 4000,
    coolingDegreeDays: 1000,
    designTemp: { winter: 5, summer: 89 },
    hvacRecommendations: [
      'Balanced systems needed',
      'Evaporative cooling effective',
      'Efficient heating important',
      'Low humidity benefits'
    ],
    climateCharacteristics: [
      'Four seasons with low humidity',
      'Hot, dry summers',
      'Cold, dry winters',
      'Large temperature swings'
    ]
  },
  
  '4C': {
    zone: '4C',
    description: 'Mixed, Marine',
    heatingDegreeDays: 4000,
    coolingDegreeDays: 150,
    designTemp: { winter: 25, summer: 81 },
    hvacRecommendations: [
      'Heating focus primary',
      'Minimal cooling needs',
      'Heat pumps very effective',
      'Natural ventilation good'
    ],
    climateCharacteristics: [
      'Marine climate influence',
      'Mild summers',
      'Cool, wet winters',
      'Moderate temperatures'
    ]
  },
  
  '5A': {
    zone: '5A',
    description: 'Cool, Humid',
    heatingDegreeDays: 5500,
    coolingDegreeDays: 500,
    designTemp: { winter: 0, summer: 85 },
    hvacRecommendations: [
      'Heating is primary concern',
      'High-efficiency heating systems',
      'Moderate cooling needs',
      'Humidity control in summer'
    ],
    climateCharacteristics: [
      'Cold winters dominate',
      'Warm, humid summers',
      'Significant heating season',
      'Four distinct seasons'
    ]
  },
  
  '5B': {
    zone: '5B',
    description: 'Cool, Dry',
    heatingDegreeDays: 5500,
    coolingDegreeDays: 500,
    designTemp: { winter: -5, summer: 87 },
    hvacRecommendations: [
      'Efficient heating essential',
      'Evaporative cooling viable',
      'Low humidity benefits',
      'High-altitude considerations'
    ],
    climateCharacteristics: [
      'Cold, dry winters',
      'Warm, dry summers',
      'Low humidity year-round',
      'High altitude effects'
    ]
  },
  
  '6A': {
    zone: '6A',
    description: 'Cold, Humid',
    heatingDegreeDays: 7000,
    coolingDegreeDays: 200,
    designTemp: { winter: -10, summer: 82 },
    hvacRecommendations: [
      'High-efficiency heating critical',
      'Minimal cooling needs',
      'Cold climate heat pumps',
      'Superior insulation important'
    ],
    climateCharacteristics: [
      'Very cold winters',
      'Short, mild summers',
      'Extended heating season',
      'Humidity in summer'
    ]
  },
  
  '6B': {
    zone: '6B',
    description: 'Cold, Dry',
    heatingDegreeDays: 7000,
    coolingDegreeDays: 200,
    designTemp: { winter: -15, summer: 84 },
    hvacRecommendations: [
      'Robust heating systems required',
      'Minimal cooling needed',
      'Dry air considerations',
      'High-altitude adaptations'
    ],
    climateCharacteristics: [
      'Very cold, dry winters',
      'Short summers',
      'Low humidity',
      'Mountain/high plains climate'
    ]
  },
  
  '7': {
    zone: '7',
    description: 'Very Cold',
    heatingDegreeDays: 9000,
    coolingDegreeDays: 50,
    designTemp: { winter: -20, summer: 78 },
    hvacRecommendations: [
      'Extreme cold heating systems',
      'Virtually no cooling needed',
      'Superior insulation critical',
      'Cold climate specialized equipment'
    ],
    climateCharacteristics: [
      'Extremely cold winters',
      'Very short summers',
      'Heating dominates energy use',
      'Severe weather conditions'
    ]
  },
  
  '8': {
    zone: '8',
    description: 'Subarctic',
    heatingDegreeDays: 12600,
    coolingDegreeDays: 0,
    designTemp: { winter: -50, summer: 72 },
    hvacRecommendations: [
      'Extreme cold weather systems',
      'No cooling required',
      'Specialized arctic equipment',
      'Maximum insulation required'
    ],
    climateCharacteristics: [
      'Extreme subarctic conditions',
      'Permafrost considerations',
      'Very short growing season',
      'Specialized construction needs'
    ]
  }
};

/**
 * Get climate zone by ZIP code
 */
export async function getClimateZoneByZip(zipCode: string): Promise<ClimateZone> {
  // Clean the ZIP code (remove spaces, hyphens, take only first 5 digits)
  const cleanZip = zipCode.replace(/[\s-]/g, '').substring(0, 5);
  
  // Look up the climate zone
  const zoneCode = zipCodeToClimateZone[cleanZip];
  
  if (!zoneCode) {
    // If ZIP not found, try to determine by state patterns (fallback)
    const stateBasedZone = getClimateZoneByState(cleanZip);
    if (stateBasedZone) {
      return climateZoneDefinitions[stateBasedZone];
    }
    
    // Ultimate fallback - return a default zone
    return climateZoneDefinitions['4A']; // Mixed, Humid as default
  }
  
  return climateZoneDefinitions[zoneCode];
}

/**
 * Get climate zone recommendations for HVAC systems
 */
export function getClimateZoneRecommendations(zone: string): string[] {
  const climateData = climateZoneDefinitions[zone];
  return climateData ? climateData.hvacRecommendations : [];
}

/**
 * Get all available climate zones
 */
export function getAllClimateZones(): ClimateZone[] {
  return Object.values(climateZoneDefinitions);
}

/**
 * Determine if a climate zone needs specific HVAC features
 */
export function getClimateZoneFeatureNeeds(zone: string): {
  highEfficiencyCooling: boolean;
  dehumidification: boolean;
  robustHeating: boolean;
  evaporativeCooling: boolean;
  heatPump: boolean;
} {
  const climateData = climateZoneDefinitions[zone];
  
  if (!climateData) {
    return {
      highEfficiencyCooling: false,
      dehumidification: false,
      robustHeating: false,
      evaporativeCooling: false,
      heatPump: false
    };
  }
  
  return {
    highEfficiencyCooling: climateData.coolingDegreeDays > 1500,
    dehumidification: zone.includes('A') && climateData.coolingDegreeDays > 1000,
    robustHeating: climateData.heatingDegreeDays > 5000,
    evaporativeCooling: zone.includes('B') && climateData.coolingDegreeDays > 500,
    heatPump: ['3A', '3C', '4A', '4C', '5A'].includes(zone)
  };
}

/**
 * Fallback: Determine climate zone by state (rough approximation)
 */
function getClimateZoneByState(zipCode: string): string | null {
  // Very basic state-based fallback using ZIP code prefixes
  const stateZones: Record<string, string> = {
    // Format: ZIP prefix -> Climate Zone
    '10': '4A', // NY
    '07': '4A', // NJ
    '19': '4A', // PA
    '20': '4A', // DC
    '30': '3A', // GA
    '33': '1A', // FL
    '77': '2A', // TX
    '90': '3B', // CA
    '94': '3C', // CA (Bay Area)
    '60': '5A', // IL
    '55': '6A', // MN
    '80': '4B', // CO
    '98': '4C', // WA
    '97': '4C', // OR
  };
  
  const prefix = zipCode.substring(0, 2);
  return stateZones[prefix] || null;
}

/**
 * Validate ZIP code format
 */
export function isValidZipCode(zipCode: string): boolean {
  const cleanZip = zipCode.replace(/[\s-]/g, '');
  return /^\d{5}(\d{4})?$/.test(cleanZip);
}

/**
 * Get climate zone impact on HVAC sizing
 */
export function getHVACSizingFactors(zone: string): {
  coolingFactor: number; // Multiplier for cooling capacity
  heatingFactor: number; // Multiplier for heating capacity
  humidityFactor: number; // Impact of humidity on system sizing
} {
  const climateData = climateZoneDefinitions[zone];
  
  if (!climateData) {
    return { coolingFactor: 1.0, heatingFactor: 1.0, humidityFactor: 1.0 };
  }
  
  // Calculate factors based on degree days
  const coolingFactor = Math.min(Math.max(climateData.coolingDegreeDays / 2000, 0.5), 2.0);
  const heatingFactor = Math.min(Math.max(climateData.heatingDegreeDays / 5000, 0.5), 2.0);
  const humidityFactor = zone.includes('A') ? 1.15 : 1.0; // Humid zones need more capacity
  
  return {
    coolingFactor,
    heatingFactor,
    humidityFactor
  };
}

export default {
  getClimateZoneByZip,
  getClimateZoneRecommendations,
  getAllClimateZones,
  getClimateZoneFeatureNeeds,
  getHVACSizingFactors,
  isValidZipCode
}; 