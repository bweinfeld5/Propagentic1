import React, { useState } from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  HomeIcon,
  WrenchScrewdriverIcon,
  FireIcon,
  BoltIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

/**
 * Property Data Completeness Indicator Component
 * Shows landlords how complete their property data is across different categories
 */
const PropertyDataCompletenessIndicator = ({ 
  property, 
  onImproveData, 
  compact = false,
  showActions = true 
}) => {
  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Calculate completeness for basic property info
  const calculateBasicCompleteness = () => {
    const requiredFields = [
      'name', 'propertyType', 'street', 'city', 'state', 'zipCode', 
      'squareFootage', 'yearBuilt', 'units', 'bedrooms', 'bathrooms'
    ];
    
    let score = 0;
    let missing = [];
    
    requiredFields.forEach(field => {
      let hasValue = false;
      
      switch (field) {
        case 'street':
        case 'city':
        case 'state':
        case 'zipCode':
          hasValue = property?.address?.[field] || property?.[field];
          break;
        default:
          hasValue = property?.[field] && property[field] !== '';
      }
      
      if (hasValue) {
        score += 100 / requiredFields.length;
      } else {
        missing.push(field);
      }
    });
    
    return {
      score: Math.round(score),
      missing,
      status: score >= 80 ? 'complete' : score >= 50 ? 'partial' : 'insufficient'
    };
  };

  // Calculate completeness for financial info
  const calculateFinancialCompleteness = () => {
    const fields = ['monthlyRent', 'deposit', 'utilities', 'leaseTerm'];
    let score = 0;
    let missing = [];
    
    fields.forEach(field => {
      if (property?.[field] && property[field] !== '') {
        score += 100 / fields.length;
      } else {
        missing.push(field);
      }
    });
    
    return {
      score: Math.round(score),
      missing,
      status: score >= 80 ? 'complete' : score >= 50 ? 'partial' : 'insufficient'
    };
  };

  // Calculate completeness for HVAC data
  const calculateHVACCompleteness = () => {
    const hvacData = property?.hvacData || {};
    const fields = [
      'currentSystems', 'buildingConstruction', 'ceilingHeight', 
      'windowCount', 'windowType', 'insulationQuality'
    ];
    
    let score = 0;
    let missing = [];
    
    fields.forEach(field => {
      let hasValue = false;
      
      if (field === 'currentSystems') {
        hasValue = Array.isArray(hvacData[field]) && hvacData[field].length > 0;
      } else {
        hasValue = hvacData[field] && hvacData[field] !== '';
      }
      
      if (hasValue) {
        score += 100 / fields.length;
      } else {
        missing.push(field);
      }
    });
    
    return {
      score: Math.round(score),
      missing,
      status: score >= 80 ? 'complete' : score >= 50 ? 'partial' : 'insufficient'
    };
  };

  // Calculate completeness for plumbing data  
  const calculatePlumbingCompleteness = () => {
    const plumbingData = property?.plumbingData || {};
    const fields = ['fixtureCount', 'pipeMaterial', 'waterHeaterType', 'waterHeaterAge'];
    
    let score = 0;
    let missing = [];
    
    fields.forEach(field => {
      if (plumbingData[field] && plumbingData[field] !== '') {
        score += 100 / fields.length;
      } else {
        missing.push(field);
      }
    });
    
    return {
      score: Math.round(score),
      missing,
      status: score >= 80 ? 'complete' : score >= 50 ? 'partial' : 'insufficient'
    };
  };

  // Calculate completeness for electrical data
  const calculateElectricalCompleteness = () => {
    const electricalData = property?.electricalData || {};
    const fields = ['electricalPanelCapacity', 'electricalPanelAge', 'wiringType', 'outletCount'];
    
    let score = 0;
    let missing = [];
    
    fields.forEach(field => {
      if (electricalData[field] && electricalData[field] !== '') {
        score += 100 / fields.length;
      } else {
        missing.push(field);
      }
    });
    
    return {
      score: Math.round(score),
      missing,
      status: score >= 80 ? 'complete' : score >= 50 ? 'partial' : 'insufficient'
    };
  };

  // Get all completeness data
  const basic = calculateBasicCompleteness();
  const financial = calculateFinancialCompleteness();
  const hvac = calculateHVACCompleteness();
  const plumbing = calculatePlumbingCompleteness();
  const electrical = calculateElectricalCompleteness();

  // Calculate overall completeness
  const overallScore = Math.round((basic.score + financial.score + hvac.score + plumbing.score + electrical.score) / 5);
  const overallStatus = overallScore >= 80 ? 'complete' : overallScore >= 60 ? 'partial' : 'insufficient';

  // Helper functions
  const getStatusColor = (status) => {
    switch (status) {
      case 'complete': return 'text-green-600';
      case 'partial': return 'text-yellow-600';
      case 'insufficient': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBgColor = (status) => {
    switch (status) {
      case 'complete': return 'bg-green-100 border-green-200';
      case 'partial': return 'bg-yellow-100 border-yellow-200';
      case 'insufficient': return 'bg-red-100 border-red-200';
      default: return 'bg-gray-100 border-gray-200';
    }
  };

  const getProgressBarColor = (status) => {
    switch (status) {
      case 'complete': return 'bg-green-500';
      case 'partial': return 'bg-yellow-500';
      case 'insufficient': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatFieldName = (fieldName) => {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase());
  };

  if (compact) {
    return (
      <div className={`p-4 rounded-lg border ${getStatusBgColor(overallStatus)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              {overallStatus === 'complete' ? (
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              ) : (
                <ExclamationTriangleIcon className={`h-6 w-6 ${getStatusColor(overallStatus)}`} />
              )}
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900">
                Data Completeness: {overallScore}%
              </h4>
              <p className="text-xs text-gray-600">
                {overallStatus === 'complete' 
                  ? 'Ready for accurate estimates' 
                  : 'More data needed'
                }
              </p>
            </div>
          </div>
          
          {showActions && (
            <button
              onClick={() => onImproveData?.(property)}
              className="flex items-center space-x-1 px-3 py-1 text-xs font-medium text-orange-700 bg-orange-100 hover:bg-orange-200 rounded-md transition-colors"
            >
              <PencilIcon className="h-4 w-4" />
              <span>Improve</span>
            </button>
          )}
        </div>
        
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(overallStatus)}`}
              style={{ width: `${overallScore}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Categories for full view
  const categories = [
    {
      id: 'basic',
      name: 'Basic Information', 
      icon: HomeIcon,
      data: basic,
      description: 'Property details and location'
    },
    {
      id: 'financial',
      name: 'Financial Information',
      icon: InformationCircleIcon, 
      data: financial,
      description: 'Rent and financial terms'
    },
    {
      id: 'hvac',
      name: 'HVAC System',
      icon: FireIcon,
      data: hvac,
      description: 'Heating and cooling details'
    },
    {
      id: 'plumbing', 
      name: 'Plumbing System',
      icon: WrenchScrewdriverIcon,
      data: plumbing,
      description: 'Water and plumbing systems'
    },
    {
      id: 'electrical',
      name: 'Electrical System', 
      icon: BoltIcon,
      data: electrical,
      description: 'Electrical and power systems'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <div className={`p-6 rounded-lg border ${getStatusBgColor(overallStatus)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              {overallStatus === 'complete' ? (
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              ) : (
                <ExclamationTriangleIcon className={`h-8 w-8 ${getStatusColor(overallStatus)}`} />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Property Data Completeness: {overallScore}%
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {overallStatus === 'complete' 
                  ? 'Your property data is comprehensive and ready for accurate estimates!'
                  : 'More information will improve estimate accuracy.'
                }
              </p>
            </div>
          </div>
          
          {showActions && (
            <button
              onClick={() => onImproveData?.(property)}
              className="flex items-center space-x-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md transition-colors"
            >
              <PencilIcon className="h-4 w-4" />
              <span>Improve Data</span>
            </button>
          )}
        </div>
        
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${getProgressBarColor(overallStatus)}`}
              style={{ width: `${overallScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-900">Category Breakdown</h4>
        
        {categories.map((category) => {
          const IconComponent = category.icon;
          const isExpanded = expandedSections[category.id];
          
          return (
            <div key={category.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection(category.id)}
                className="w-full p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <IconComponent className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">{category.name}</span>
                      <span className={`text-sm font-medium ${getStatusColor(category.data.status)}`}>
                        {category.data.score}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">{category.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(category.data.status)}`}
                      style={{ width: `${category.data.score}%` }}
                    />
                  </div>
                  
                  {isExpanded ? (
                    <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </button>
              
              {isExpanded && (
                <div className="p-4 bg-white border-t border-gray-200">
                  {category.data.missing.length > 0 ? (
                    <div>
                      <h5 className="text-sm font-medium text-red-700 mb-2">
                        Missing Fields:
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {category.data.missing.map((field) => (
                          <span 
                            key={field}
                            className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-md"
                          >
                            {formatFieldName(field)}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <span className="text-green-600 text-sm font-medium">
                        ✅ All data complete for this category!
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PropertyDataCompletenessIndicator; 