import React, { useState, useEffect } from 'react';
import { auth } from '../../firebase/config'; // Import auth
import dataService from '../../services/dataService'; 
import Button from '../../components/ui/Button'; 
import { PlusCircleIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline'; 
import PropertyCard from '../../components/landlord/PropertyCard'; 
import AddPropertyModal from '../../components/landlord/AddPropertyModal'; 
import InviteTenantModal from '../../components/landlord/InviteTenantModal'; // Keep invite modal logic here for now
import { db } from '../../firebase/config'; // Keep db import if used elsewhere, remove if not
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'; // Remove if not used directly

const PropertiesPage = () => {
  const [properties, setProperties] = useState([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [propertiesError, setPropertiesError] = useState(null);
  const [isAddPropertyModalOpen, setIsAddPropertyModalOpen] = useState(false);
  const [isInviteTenantModalOpen, setIsInviteTenantModalOpen] = useState(false);
  const [selectedPropertyForInvite, setSelectedPropertyForInvite] = useState(null);

  // Fetch Properties useEffect (Moved from LandlordTicketDashboard)
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        setPropertiesLoading(false);
        setPropertiesError("User not authenticated.");
        return;
    }
    
    // Configure dataService (important if not done globally)
    dataService.configure({ currentUser });

    setPropertiesLoading(true);
    setPropertiesError(null);

    const handlePropertyData = (propertiesData) => {
      console.log('Properties data received:', propertiesData.length);
      setProperties(propertiesData);
      setPropertiesLoading(false);
    };

    const handlePropertyFetchError = (error) => {
      console.error("Error fetching properties: ", error);
      setPropertiesError(error.message || "Failed to load properties.");
      setProperties([]);
      setPropertiesLoading(false);
    };

    // Subscribe to properties using dataService
    const unsubscribe = dataService.subscribeToProperties(
      handlePropertyData,
      handlePropertyFetchError
    );

    // Cleanup function
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []); // Dependency on auth.currentUser might be needed if it changes reactively

  // Handle Adding Property (Moved from LandlordTicketDashboard)
  const handleAddProperty = async (propertyData) => {
    if (!dataService.currentUser) {
      console.error("DataService not configured with current user.");
      throw new Error("Authentication context is missing.");
    }
    await dataService.createProperty(propertyData);
    // List should update via subscription, no need to manually set state
  };

  // Handle Inviting Tenant (Kept here for now)
  const handleInviteTenant = (propertyId) => {
    const property = properties.find(p => p.id === propertyId);
    if (property) {
      setSelectedPropertyForInvite(property);
      setIsInviteTenantModalOpen(true);
    }
  };

  // Create Invite Record - NOW CALLS dataService.sendInvite
  const createTenantInvite = async (propertyId, tenantEmail) => {
     // Basic frontend validation (can be enhanced)
     if (!propertyId) {
       alert("Cannot invite tenant without a selected property.");
       throw new Error("Property ID missing");
     }
     if (!tenantEmail || !tenantEmail.includes('@')) {
        alert("Please enter a valid email address.");
        throw new Error("Invalid tenant email");
     }
     
     console.log(`Calling dataService.sendInvite for ${tenantEmail} to property ${propertyId}`);
     // Call the dataService method which triggers the Cloud Function
     // Error handling is done within the modal using the error thrown by dataService
     await dataService.sendInvite(propertyId, tenantEmail);
     console.log('dataService.sendInvite completed.');
     alert('Tenant invitation sent successfully!'); // Keep feedback or handle in modal
  };

  return (
    // Note: DashboardLayout is applied by the Router in App.js
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-semibold text-content dark:text-content-dark flex items-center">
           <BuildingOfficeIcon className="w-6 h-6 mr-2 text-primary dark:text-primary-light"/>
           Properties Management
        </h1>
        <Button 
            variant="primary"
            onClick={() => setIsAddPropertyModalOpen(true)}
            icon={<PlusCircleIcon className="w-5 h-5"/>}
        >
            Add Property
        </Button>
      </div>

      {/* Property List Section */}
      {propertiesLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                  <div key={i} className="bg-background dark:bg-background-darkSubtle rounded-xl shadow border border-border dark:border-border-dark p-4 animate-pulse">
                      <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 mb-3"></div>
                      <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-full mb-2"></div>
                      <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2 mb-4"></div>
                      <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3 ml-auto"></div>
                  </div>
              ))}
          </div>
      )}
      {!propertiesLoading && propertiesError && (
          <div className="bg-danger-subtle dark:bg-danger-darkSubtle border-l-4 border-danger dark:border-red-400 p-4 rounded-md">
              <p className="text-sm text-danger dark:text-red-300">Error: {propertiesError}</p>
               {/* Optional: Add retry button */}
          </div>
      )}
      {!propertiesLoading && !propertiesError && properties.length === 0 && (
          <div className="bg-background dark:bg-background-darkSubtle rounded-lg shadow p-8 text-center border border-border dark:border-border-dark mt-8">
              <BuildingOfficeIcon className="w-12 h-12 mx-auto text-neutral-400 dark:text-neutral-500 mb-4" />
              <h3 className="text-lg font-medium text-content dark:text-content-dark">No Properties Found</h3>
              <p className="text-sm text-content-secondary dark:text-content-darkSecondary mt-1 mb-4">Get started by adding your first property.</p>
              <Button 
                  variant="primary"
                  onClick={() => setIsAddPropertyModalOpen(true)}
                  icon={<PlusCircleIcon className="w-5 h-5"/>}
              >
                  Add Your First Property
              </Button>
          </div>
      )}
      {!propertiesLoading && !propertiesError && properties.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {properties.map(property => (
                  <PropertyCard 
                      key={property.id}
                      property={property}
                      onInviteTenant={() => handleInviteTenant(property.id)}
                  />
              ))}
          </div>
      )}

      {/* Modals */}
      <AddPropertyModal 
        isOpen={isAddPropertyModalOpen}
        onClose={() => setIsAddPropertyModalOpen(false)}
        onAdd={handleAddProperty} 
      />
      <InviteTenantModal
        isOpen={isInviteTenantModalOpen}
        onClose={() => setIsInviteTenantModalOpen(false)}
        onInvite={createTenantInvite} 
        propertyId={selectedPropertyForInvite?.id}
        propertyName={selectedPropertyForInvite?.name}
      />
    </div>
  );
};

export default PropertiesPage; 