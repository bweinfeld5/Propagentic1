import React, { useState, useEffect, useCallback } from 'react';
import { 
  HomeIcon, 
  BuildingOfficeIcon, 
  UsersIcon, 
  PresentationChartLineIcon,
  PlusCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import dataService from '../../services/dataService';
import PropertyCard from '../../components/landlord/PropertyCard';
import TicketCard from '../../components/tickets/TicketCard';
import Button from '../../components/ui/Button';
import AddPropertyModal from '../../components/landlord/AddPropertyModal';
import InviteTenantModal from '../../components/landlord/InviteTenantModal';
import AssignContractorToTicket from '../../components/maintenance/AssignContractorToTicket';
import StatCard from '../../components/landlord/StatCard';
import MaintenanceRequestCard from '../../components/landlord/MaintenanceRequestCard';

const LandlordDashboard = () => {
  // Removed mock data for properties and maintenance requests
  // Use live data fetched in the actual dashboard component (e.g., LandlordTicketDashboard.jsx)
  const [properties, setProperties] = useState([]); 
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);

  // State for add property modal
  const [isAddPropertyModalOpen, setIsAddPropertyModalOpen] = useState(false);

  // Calculations should use live data, removed calculations based on mock data
  const totalUnits = 0; // Placeholder - Recalculate with live data if needed here
  const averageOccupancyRate = 0; // Placeholder

  // Removed local handlers that manipulated mock state
  // These actions should now interact with dataService/Firestore
  const handleAddProperty = (newProperty) => {
    console.warn("handleAddProperty called in mock component. Should use dataService.");
    // This would typically call dataService.createProperty(newProperty);
  };

  return (
    <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard Overview (Mock/Deprecated)</h1>
      </div>

      {/* Stats Overview - Will show 0s until connected to live data */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard 
          title="Total Properties" 
          value={properties.length} 
          icon={HomeIcon} 
          variant="primary" // Use primary (teal)
        />
        <StatCard 
          title="Total Units" 
          value={totalUnits} 
          icon={BuildingOfficeIcon} 
          variant="info" // Use info (blue)
        />
        <StatCard 
          title="Occupancy Rate" 
          value={`${averageOccupancyRate}%`} 
          icon={PresentationChartLineIcon} 
          variant="success" // Use success (green)
        />
        <StatCard 
          title="Maintenance Requests" 
          value={maintenanceRequests.length} 
          icon={UsersIcon} // Consider a wrench or clipboard icon?
          variant="warning" // Use warning (amber)
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Recent Maintenance Requests */}
        <div className="lg:col-span-2">
          <div className="bg-background dark:bg-background-darkSubtle shadow-sm rounded-lg p-6 border border-border dark:border-border-dark">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-content dark:text-content-dark">Recent Maintenance Requests</h2>
              <span className="text-sm text-content-secondary dark:text-content-darkSecondary">{maintenanceRequests.length} requests</span>
            </div>
            {/* MaintenanceRequestCard needs refactoring */}
            <div className="space-y-4">
              {maintenanceRequests.map(request => (
                <MaintenanceRequestCard 
                  key={request.id}
                  request={request}
                />
              ))}
            </div>
            {maintenanceRequests.length === 0 && <p className="text-center text-gray-500">No maintenance requests found.</p>}
          </div>
        </div>

        {/* My Properties */}
        <div className="lg:col-span-1">
          <div className="bg-background dark:bg-background-darkSubtle shadow-sm rounded-lg p-6 border border-border dark:border-border-dark">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-content dark:text-content-dark">My Properties</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsAddPropertyModalOpen(true)}
                icon={<PlusCircleIcon className="h-5 w-5"/>}
              >
                Add Property
              </Button>
            </div>
            {properties.length === 0 && <p className="text-center text-gray-500">No properties found.</p>}
            {/* PropertyCard needs refactoring */}
            <div className="space-y-4">
              {properties.map(property => (
                <PropertyCard 
                  key={property.id}
                  property={property}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Add Property Modal - Still functional but uses mock handler */}
      <AddPropertyModal 
        isOpen={isAddPropertyModalOpen}
        onClose={() => setIsAddPropertyModalOpen(false)}
        onAdd={handleAddProperty} // Uses the placeholder handler
      />
    </div>
  );
};

export default LandlordDashboard; 