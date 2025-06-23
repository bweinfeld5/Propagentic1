import React from 'react';
import ContractorEstimateReadinessIndicator from './ContractorEstimateReadinessIndicator';

/**
 * Demo component for testing the ContractorEstimateReadinessIndicator
 * 
 * This component provides sample property data to test the readiness indicator
 * in different states without requiring Firebase connection.
 */
const ContractorEstimateReadinessDemo = () => {
  // Sample property with complete contractor estimate data
  const completeProperty = {
    id: 'demo-complete-property',
    name: 'Complete Property Example',
    address: {
      street: '123 Complete St',
      city: 'Full City',
      state: 'CA', 
      zip: '90210'
    },
    squareFootage: 2500,
    yearBuilt: 2015,
    hvacData: {
      currentSystems: ['Central Air Conditioning', 'Central Heating (Gas)'],
      buildingConstruction: 'Wood Frame',
      ceilingHeight: 9,
      windowCount: 15,
      windowType: 'Double Pane',
      insulationQuality: 'Good',
      ductworkAccess: 'Easy - Basement',
      utilityCosts: {
        lastMonthElectric: 150,
        lastMonthGas: 75
      },
      climateZone: '3B'
    },
    plumbingData: {
      fullBathrooms: 3,
      halfBathrooms: 1,
      kitchens: 1,
      kitchenettes: 0,
      pipeMaterial: 'Copper',
      waterHeaterType: 'Gas Tank',
      waterHeaterAge: 5,
      accessPoints: ['Basement'],
      waterPressureIssues: false,
      washerDryerHookup: true,
      fixtureQuality: 'High-end'
    },
    electricalData: {
      panelCapacity: 200,
      panelAge: 8,
      majorAppliances: ['Electric Range', 'Electric Dryer', 'Central AC', 'Electric Water Heater'],
      outdoorElectrical: ['Exterior Lighting', 'Outlet - Patio'],
      smartFeatures: ['Smart Thermostat', 'Smart Lighting'],
      highDemandFacilities: []
    },
    lastUpdated: new Date()
  };

  // Sample property with partial contractor estimate data
  const partialProperty = {
    id: 'demo-partial-property',
    name: 'Partial Property Example',
    address: {
      street: '456 Partial Ave',
      city: 'Some City',
      state: 'TX',
      zip: '75201'
    },
    squareFootage: 1800,
    yearBuilt: 2005,
    hvacData: {
      currentSystems: ['Central Air Conditioning'],
      buildingConstruction: 'Masonry',
      ceilingHeight: 8,
      // Missing: windowCount, windowType, insulationQuality, etc.
      climateZone: '2A'
    },
    plumbingData: {
      fullBathrooms: 2,
      halfBathrooms: 1,
      kitchens: 1
      // Missing: pipeMaterial, waterHeaterType, etc.
    },
    electricalData: {
      panelCapacity: 150,
      majorAppliances: ['Electric Range']
      // Missing: panelAge, outdoorElectrical, etc.
    },
    lastUpdated: new Date()
  };

  // Sample property with minimal contractor estimate data
  const minimalProperty = {
    id: 'demo-minimal-property',
    name: 'Minimal Property Example',
    address: {
      street: '789 Basic Blvd',
      city: 'Simple City',
      state: 'FL',
      zip: '33101'
    },
    squareFootage: 1200,
    yearBuilt: 1995,
    // Missing most contractor estimate data
    hvacData: {
      currentSystems: ['Window AC Units']
    },
    plumbingData: {
      fullBathrooms: 2,
      kitchens: 1
    },
    electricalData: {
      panelCapacity: 100
    },
    lastUpdated: new Date()
  };

  const handleImproveData = (property, tradeType = 'all') => {
    console.log(`Demo: Improving ${tradeType} data for property:`, property.id);
    alert(`Demo Mode: Would open editor for ${tradeType} data on property "${property.name}"`);
  };

  return (
    <div className="space-y-8 p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Contractor Estimate Readiness Demo
        </h1>
        <p className="text-gray-600 mb-8">
          This demo shows the contractor estimate readiness indicator in different states 
          based on the completeness of property data for HVAC, Plumbing, and Electrical estimates.
        </p>

        {/* Complete Property Example */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Complete Property Data (80%+ Ready)
          </h2>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <ContractorEstimateReadinessIndicator
              property={completeProperty}
              onImproveData={handleImproveData}
              compact={false}
              showActions={true}
              demoMode={true}
            />
          </div>
        </div>

        {/* Partial Property Example */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Partial Property Data (50-80% Ready)
          </h2>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <ContractorEstimateReadinessIndicator
              property={partialProperty}
              onImproveData={handleImproveData}
              compact={false}
              showActions={true}
              demoMode={true}
            />
          </div>
        </div>

        {/* Minimal Property Example */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Minimal Property Data (&lt;50% Ready)
          </h2>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <ContractorEstimateReadinessIndicator
              property={minimalProperty}
              onImproveData={handleImproveData}
              compact={false}
              showActions={true}
              demoMode={true}
            />
          </div>
        </div>

        {/* Compact Versions (as would appear in property cards) */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Compact Versions (Property Cards)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-medium text-gray-900 mb-3">Complete Property</h3>
              <ContractorEstimateReadinessIndicator
                property={completeProperty}
                onImproveData={handleImproveData}
                compact={true}
                showActions={true}
                demoMode={true}
              />
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-medium text-gray-900 mb-3">Partial Property</h3>
              <ContractorEstimateReadinessIndicator
                property={partialProperty}
                onImproveData={handleImproveData}
                compact={true}
                showActions={true}
                demoMode={true}
              />
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-medium text-gray-900 mb-3">Minimal Property</h3>
              <ContractorEstimateReadinessIndicator
                property={minimalProperty}
                onImproveData={handleImproveData}
                compact={true}
                showActions={true}
                demoMode={true}
              />
            </div>
          </div>
        </div>

        {/* Feature Explanation */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            How Readiness is Calculated
          </h2>
          <div className="space-y-4 text-gray-600">
            <div>
              <h3 className="font-medium text-gray-900">HVAC Data (33% of overall score)</h3>
              <p>Square footage, current systems, building construction, ceiling height, 
              windows, insulation, ductwork access, climate zone, and utility costs.</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Plumbing Data (33% of overall score)</h3>
              <p>Bathroom/kitchen counts, pipe materials, water heater details, 
              access points, water pressure, fixtures, and hookups.</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Electrical Data (33% of overall score)</h3>
              <p>Panel capacity/age, major appliances, outdoor electrical needs, 
              smart features, and high-demand facilities.</p>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <h3 className="font-medium text-gray-900">Readiness Levels</h3>
              <ul className="mt-2 space-y-1">
                <li><span className="font-medium text-green-600">Ready (80%+):</span> Sufficient data for accurate estimates</li>
                <li><span className="font-medium text-yellow-600">Partial (50-79%):</span> Some data missing, estimates may vary</li>
                <li><span className="font-medium text-red-600">Insufficient (&lt;50%):</span> More data needed for reliable estimates</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractorEstimateReadinessDemo; 