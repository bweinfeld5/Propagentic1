import React, { useState, useEffect, useCallback } from 'react';
import { 
  HomeIcon, 
  BuildingOfficeIcon, 
  UsersIcon, 
  PresentationChartLineIcon,
  PlusCircleIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import PropertyCard from './PropertyCard';
import TicketCard from '../dashboard/TicketCard';
import Button from '../ui/Button';
import AddPropertyModal from './AddPropertyModal';
import InviteTenantModal from './InviteTenantModal';
import BulkPropertyImport from './BulkPropertyImport';

const LandlordDashboardDemo = () => {
  const [properties, setProperties] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [showInviteTenant, setShowInviteTenant] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [loading, setLoading] = useState(false);

  // Mock user profile for demo
  const mockUserProfile = {
    name: 'Demo Landlord',
    role: 'landlord'
  };

  // Mock data for demo
  const mockStats = [
    { 
      title: 'Total Properties', 
      value: '5', 
      icon: BuildingOfficeIcon,
      change: '+2 this month',
      changeType: 'positive'
    },
    { 
      title: 'Active Tenants', 
      value: '12', 
      icon: UsersIcon,
      change: '+3 this month',
      changeType: 'positive'
    },
    { 
      title: 'Open Requests', 
      value: '3', 
      icon: PresentationChartLineIcon,
      change: '-2 this week',
      changeType: 'positive'
    },
    { 
      title: 'Occupancy Rate', 
      value: '94%', 
      icon: HomeIcon,
      change: '+5% this quarter',
      changeType: 'positive'
    }
  ];

  const mockProperties = [
    {
      id: '1',
      name: 'Sunset Apartments',
      address: '123 Main St, City, State',
      units: 24,
      occupancy: 95,
      monthlyRent: 85000
    },
    {
      id: '2', 
      name: 'Downtown Lofts',
      address: '456 Oak Ave, City, State',
      units: 16,
      occupancy: 88,
      monthlyRent: 52000
    }
  ];

  const handleAddProperty = (newProperty) => {
    setProperties(prev => [...prev, { ...newProperty, id: Date.now().toString() }]);
    setShowAddProperty(false);
  };

  const handleBulkImportComplete = (importedProperties) => {
    setProperties(prev => [...prev, ...importedProperties]);
    setShowBulkImport(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Enhanced Landlord Dashboard (Demo)
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {mockUserProfile.name}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Phase 1.1 Banner */}
          <div className="mb-6 rounded-lg bg-blue-50 border border-blue-200 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <ClipboardDocumentListIcon className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  🎉 Phase 1.1 Enhanced Features Available!
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>Now with bulk property import, auto-save onboarding, and enhanced error handling.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {mockStats.map((stat) => (
              <div key={stat.title} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <stat.icon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          {stat.title}
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {stat.value}
                          </div>
                          <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                            stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {stat.change}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Phase 1.1 Enhanced Quick Actions */}
          <div className="bg-white shadow rounded-lg mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                🚀 Enhanced Quick Actions (Phase 1.1)
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Single Property Add */}
                <Button
                  variant="outline"
                  className="flex flex-col items-center p-6 h-auto"
                  onClick={() => setShowAddProperty(true)}
                >
                  <PlusCircleIcon className="h-8 w-8 text-gray-600 mb-2" />
                  <span className="text-sm font-medium">Add Property</span>
                  <span className="text-xs text-gray-500 mt-1">Single property</span>
                </Button>

                {/* NEW: Bulk Property Import */}
                <Button
                  variant="primary"
                  className="flex flex-col items-center p-6 h-auto bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  onClick={() => setShowBulkImport(true)}
                >
                  <ClipboardDocumentListIcon className="h-8 w-8 text-white mb-2" />
                  <span className="text-sm font-medium text-white">Bulk Import</span>
                  <span className="text-xs text-blue-100 mt-1">✨ NEW! CSV/Excel</span>
                </Button>

                {/* Invite Tenant */}
                <Button
                  variant="outline" 
                  className="flex flex-col items-center p-6 h-auto"
                  onClick={() => setShowInviteTenant(true)}
                >
                  <UsersIcon className="h-8 w-8 text-gray-600 mb-2" />
                  <span className="text-sm font-medium">Invite Tenant</span>
                  <span className="text-xs text-gray-500 mt-1">Send invitation</span>
                </Button>

                {/* Generate Report */}
                <Button
                  variant="outline"
                  className="flex flex-col items-center p-6 h-auto"
                >
                  <PresentationChartLineIcon className="h-8 w-8 text-gray-600 mb-2" />
                  <span className="text-sm font-medium">Generate Report</span>
                  <span className="text-xs text-gray-500 mt-1">Analytics</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Properties Grid */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Properties</h2>
            </div>
            <div className="p-6">
              {mockProperties.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mockProperties.map((property) => (
                    <PropertyCard 
                      key={property.id} 
                      property={property}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No properties</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by adding your first property.
                  </p>
                  <div className="mt-6 flex justify-center space-x-3">
                    <Button onClick={() => setShowAddProperty(true)}>
                      Add Property
                    </Button>
                    <Button 
                      variant="secondary" 
                      onClick={() => setShowBulkImport(true)}
                    >
                      Bulk Import
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      {showAddProperty && (
        <AddPropertyModal
          isOpen={showAddProperty}
          onClose={() => setShowAddProperty(false)}
          onAddProperty={handleAddProperty}
        />
      )}

      {showInviteTenant && (
        <InviteTenantModal
          isOpen={showInviteTenant}
          onClose={() => setShowInviteTenant(false)}
          properties={properties}
        />
      )}

      {/* Phase 1.1 Bulk Import Modal */}
      {showBulkImport && (
        <BulkPropertyImport
          isOpen={showBulkImport}
          onClose={() => setShowBulkImport(false)}
          onComplete={handleBulkImportComplete}
        />
      )}
    </div>
  );
};

export default LandlordDashboardDemo; 