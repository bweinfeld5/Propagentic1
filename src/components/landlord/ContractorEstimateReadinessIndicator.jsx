import React, { useState, useEffect } from 'react';
import {
  WrenchScrewdriverIcon,
  FireIcon,
  BoltIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { calculateEstimateReadiness, calculateDataCompleteness } from '../../services/firestore/propertyService';

/**
 * Contractor Estimate Readiness Indicator Component
 * 
 * Displays the readiness status for contractor estimates across all three trades:
 * - HVAC (Heating, Ventilation, Air Conditioning)
 * - Plumbing
 * - Electrical
 * 
 * Features:
 * - Visual status indicators (ready/partial/insufficient)
 * - Confidence scores and progress bars
 * - Expandable details showing missing fields
 * - Real-time updates when property data changes
 * - Action buttons to improve readiness
 * - Demo mode support for standalone operation
 */
const ContractorEstimateReadinessIndicator = ({ 
  property, 
  onImproveData, 
  compact = false,
  showActions = true,
  demoMode = false  // Add demo mode flag
}) => {
  const [readinessData, setReadinessData] = useState(null);
  const [completenessData, setCompletenessData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});

  // Trade configurations with icons and colors
  const tradeConfigs = {
    hvac: {
      name: 'HVAC Systems',
      icon: FireIcon,
      description: 'Heating, ventilation, and air conditioning data',
      color: {
        ready: 'text-green-700 bg-green-100 border-green-300',
        partial: 'text-yellow-700 bg-yellow-100 border-yellow-300',
        insufficient: 'text-red-700 bg-red-100 border-red-300'
      }
    },
    plumbing: {
      name: 'Plumbing Systems',
      icon: WrenchScrewdriverIcon,
      description: 'Water supply, drainage, and fixtures',
      color: {
        ready: 'text-blue-700 bg-blue-100 border-blue-300',
        partial: 'text-orange-700 bg-orange-100 border-orange-300',
        insufficient: 'text-red-700 bg-red-100 border-red-300'
      }
    },
    electrical: {
      name: 'Electrical Systems',
      icon: BoltIcon,
      description: 'Power supply, panels, and appliances',
      color: {
        ready: 'text-purple-700 bg-purple-100 border-purple-300',
        partial: 'text-yellow-700 bg-yellow-100 border-yellow-300',
        insufficient: 'text-red-700 bg-red-100 border-red-300'
      }
    }
  };

  // Helper function to get nested values from objects
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  // Calculate HVAC readiness locally (for demo mode)
  const calculateHVACReadiness = (property) => {
    const missingFields = [];
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
      { field: 'hvacData.utilityCosts', weight: 5 },
      { field: 'hvacData.ductworkAccess', weight: 5 }
    ];
    
    niceToHaveFields.forEach(({ field, weight }) => {
      maxScore += weight;
      const value = getNestedValue(property, field);
      if (value !== undefined && value !== null && value !== '') {
        score += weight;
      }
    });
    
    const confidence = Math.round((score / maxScore) * 100);
    
    let status;
    if (confidence >= 80) {
      status = 'ready';
    } else if (confidence >= 50) {
      status = 'partial';
    } else {
      status = 'insufficient';
    }
    
    return { status, confidence, missingFields };
  };

  // Calculate Plumbing readiness locally (for demo mode)
  const calculatePlumbingReadiness = (property) => {
    const missingFields = [];
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
      { field: 'plumbingData.pipeMaterial', weight: 5 },
      { field: 'plumbingData.waterHeaterType', weight: 5 },
      { field: 'plumbingData.waterHeaterAge', weight: 5 },
      { field: 'plumbingData.accessPoints', weight: 5 },
      { field: 'plumbingData.waterPressureIssues', weight: 5 }
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
      { field: 'plumbingData.washerDryerHookup', weight: 2 }
    ];
    
    niceToHaveFields.forEach(({ field, weight }) => {
      maxScore += weight;
      const value = getNestedValue(property, field);
      if (value !== undefined && value !== null && value !== '') {
        score += weight;
      }
    });
    
    const confidence = Math.round((score / maxScore) * 100);
    
    let status;
    if (confidence >= 80) {
      status = 'ready';
    } else if (confidence >= 50) {
      status = 'partial';
    } else {
      status = 'insufficient';
    }
    
    return { status, confidence, missingFields };
  };

  // Calculate Electrical readiness locally (for demo mode)
  const calculateElectricalReadiness = (property) => {
    const missingFields = [];
    let score = 0;
    let maxScore = 0;
    
    // CRITICAL fields (60% of total score)
    const criticalFields = [
      { field: 'electricalData.panelCapacity', weight: 20 },
      { field: 'electricalData.panelAge', weight: 15 },
      { field: 'electricalData.majorAppliances', weight: 15 },
      { field: 'yearBuilt', weight: 10 }
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
      { field: 'electricalData.outdoorElectrical', weight: 10 },
      { field: 'electricalData.smartFeatures', weight: 10 },
      { field: 'electricalData.highDemandFacilities', weight: 10 }
    ];
    
    importantFields.forEach(({ field, weight }) => {
      maxScore += weight;
      const value = getNestedValue(property, field);
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          score += weight; // Arrays are okay even if empty for these fields
        } else {
          score += weight;
        }
      } else {
        missingFields.push(field);
      }
    });
    
    // NICE-TO-HAVE fields (10% of total score)
    const niceToHaveFields = [
      { field: 'squareFootage', weight: 5 },
      { field: 'propertyType', weight: 5 }
    ];
    
    niceToHaveFields.forEach(({ field, weight }) => {
      maxScore += weight;
      const value = getNestedValue(property, field);
      if (value !== undefined && value !== null && value !== '') {
        score += weight;
      }
    });
    
    const confidence = Math.round((score / maxScore) * 100);
    
    let status;
    if (confidence >= 80) {
      status = 'ready';
    } else if (confidence >= 50) {
      status = 'partial';
    } else {
      status = 'insufficient';
    }
    
    return { status, confidence, missingFields };
  };

  // Calculate readiness locally (for demo mode)
  const calculateLocalReadiness = (property) => {
    const hvacResult = calculateHVACReadiness(property);
    const plumbingResult = calculatePlumbingReadiness(property);
    const electricalResult = calculateElectricalReadiness(property);
    
    return {
      hvac: hvacResult.status,
      plumbing: plumbingResult.status,
      electrical: electricalResult.status,
      confidenceScores: {
        hvac: hvacResult.confidence,
        plumbing: plumbingResult.confidence,
        electrical: electricalResult.confidence
      },
      missingFields: {
        hvac: hvacResult.missingFields,
        plumbing: plumbingResult.missingFields,
        electrical: electricalResult.missingFields
      },
      lastCalculated: new Date()
    };
  };

  // Calculate completeness locally (for demo mode)
  const calculateLocalCompleteness = (property) => {
    const hvacResult = calculateHVACReadiness(property);
    const plumbingResult = calculatePlumbingReadiness(property);
    const electricalResult = calculateElectricalReadiness(property);
    
    const overall = Math.round(
      (hvacResult.confidence + plumbingResult.confidence + electricalResult.confidence) / 3
    );
    
    return {
      basic: 85, // Mock basic completeness
      hvac: hvacResult.confidence,
      plumbing: plumbingResult.confidence,
      electrical: electricalResult.confidence,
      overall
    };
  };

  // Auto-detect demo mode based on property structure
  const isDemo = demoMode || !property?.id || property?.id?.startsWith('demo-');

  // Load readiness data
  useEffect(() => {
    if (!property) return;

    const loadReadinessData = async () => {
      setLoading(true);
      setError(null);

      try {
        if (isDemo) {
          // Calculate readiness locally for demo
          const readiness = calculateLocalReadiness(property);
          setReadinessData(readiness);

          const completeness = calculateLocalCompleteness(property);
          setCompletenessData(completeness);
        } else {
          // Use Firebase functions for production
          const readiness = await calculateEstimateReadiness(property.id);
          setReadinessData(readiness);

          const completeness = await calculateDataCompleteness(property.id);
          setCompletenessData(completeness);
        }

      } catch (err) {
        console.error('Error loading readiness data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadReadinessData();
  }, [property, property?.lastUpdated, isDemo]);

  // Toggle expanded section
  const toggleSection = (trade) => {
    setExpandedSections(prev => ({
      ...prev,
      [trade]: !prev[trade]
    }));
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'ready':
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case 'partial':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />;
      case 'insufficient':
        return <InformationCircleIcon className="w-5 h-5 text-red-600" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  // Get status text
  const getStatusText = (status) => {
    switch (status) {
      case 'ready':
        return 'Ready for Estimates';
      case 'partial':
        return 'Partially Ready';
      case 'insufficient':
        return 'Insufficient Data';
      default:
        return 'Unknown';
    }
  };

  // Get overall readiness score
  const getOverallScore = () => {
    if (!readinessData?.confidenceScores) return 0;
    
    const scores = Object.values(readinessData.confidenceScores);
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  };

  // Get trade readiness count
  const getReadinessCount = () => {
    if (!readinessData) return { ready: 0, total: 3 };
    
    const readyCount = Object.values(readinessData)
      .filter(status => status === 'ready').length;
    
    return { ready: readyCount, total: 3 };
  };

  // Format missing fields for display
  const formatMissingFields = (fields) => {
    return fields.map(field => {
      // Convert dot notation to readable text
      return field
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .replace(/Data\./g, '')
        .replace(/\./g, ' > ');
    });
  };

  // Render loading state
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <span className="ml-3 text-gray-600">Calculating readiness...</span>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-2" />
          <span className="text-red-700">Error loading readiness data: {error}</span>
        </div>
      </div>
    );
  }

  const overallScore = getOverallScore();
  const { ready, total } = getReadinessCount();

  // Compact view for property cards
  if (compact) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Estimate Readiness</span>
          <span className="text-sm font-semibold text-gray-900">{overallScore}%</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              overallScore >= 80 ? 'bg-green-500' :
              overallScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${overallScore}%` }}
          ></div>
        </div>
        
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>{ready}/{total} trades ready</span>
          <button 
            onClick={() => onImproveData?.(property)}
            className="text-orange-600 hover:text-orange-700 font-medium"
          >
            Improve
          </button>
        </div>
      </div>
    );
  }

  // Full detailed view
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <WrenchScrewdriverIcon className="w-6 h-6 text-orange-600 mr-2" />
              Contractor Estimate Readiness
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Data completeness for accurate contractor estimates
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">{overallScore}%</div>
            <div className="text-sm text-gray-600">{ready}/{total} trades ready</div>
          </div>
        </div>
        
        {/* Overall progress bar */}
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${
                overallScore >= 80 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                overallScore >= 50 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' : 
                'bg-gradient-to-r from-red-500 to-red-600'
              }`}
              style={{ width: `${overallScore}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Trade Details */}
      <div className="p-6">
        <div className="space-y-4">
          {Object.entries(tradeConfigs).map(([tradeKey, config]) => {
            const status = readinessData?.[tradeKey] || 'insufficient';
            const confidence = readinessData?.confidenceScores?.[tradeKey] || 0;
            const missingFields = readinessData?.missingFields?.[tradeKey] || [];
            const isExpanded = expandedSections[tradeKey];
            const IconComponent = config.icon;

            return (
              <div key={tradeKey} className={`border rounded-lg ${config.color[status]}`}>
                {/* Trade Header */}
                <div 
                  className="p-4 cursor-pointer"
                  onClick={() => toggleSection(tradeKey)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <IconComponent className="w-6 h-6 mr-3" />
                      <div>
                        <div className="font-semibold">{config.name}</div>
                        <div className="text-sm opacity-75">{config.description}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="flex items-center">
                          {getStatusIcon(status)}
                          <span className="ml-2 font-medium">{getStatusText(status)}</span>
                        </div>
                        <div className="text-sm opacity-75">{confidence}% complete</div>
                      </div>
                      
                      {isExpanded ? (
                        <ChevronUpIcon className="w-5 h-5" />
                      ) : (
                        <ChevronDownIcon className="w-5 h-5" />
                      )}
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="w-full bg-white/50 rounded-full h-2">
                      <div 
                        className="h-2 bg-current rounded-full transition-all duration-300 opacity-70"
                        style={{ width: `${confidence}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-current border-opacity-20">
                    {missingFields.length > 0 ? (
                      <div className="mt-4">
                        <h5 className="font-medium mb-2">Missing Information:</h5>
                        <ul className="text-sm space-y-1">
                          {formatMissingFields(missingFields).map((field, index) => (
                            <li key={index} className="flex items-center">
                              <div className="w-1.5 h-1.5 bg-current rounded-full mr-2 opacity-50"></div>
                              {field}
                            </li>
                          ))}
                        </ul>
                        
                        {showActions && (
                          <button
                            onClick={() => onImproveData?.(property, tradeKey)}
                            className="mt-3 px-4 py-2 bg-white text-current border border-current rounded-lg hover:bg-current hover:bg-opacity-10 transition-colors font-medium text-sm"
                          >
                            Add {config.name} Data
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="mt-4 flex items-center text-sm">
                        <CheckCircleIcon className="w-4 h-4 mr-2" />
                        All required data is available for accurate estimates
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => onImproveData?.(property, 'all')}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium flex items-center"
              >
                <WrenchScrewdriverIcon className="w-4 h-4 mr-2" />
                Complete All Data
              </button>
              
              <button
                onClick={() => window.open('/help/contractor-estimates', '_blank')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Learn More
              </button>
              
              {overallScore >= 80 && (
                <button
                  onClick={() => onImproveData?.(property, 'request-estimates')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center"
                >
                  <CheckCircleIcon className="w-4 h-4 mr-2" />
                  Request Estimates
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Footer with last updated */}
      {readinessData?.lastCalculated && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              Last updated: {new Date(readinessData.lastCalculated.seconds * 1000).toLocaleString()}
            </span>
            <button
              onClick={() => window.location.reload()}
              className="text-orange-600 hover:text-orange-700 font-medium"
            >
              Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractorEstimateReadinessIndicator; 