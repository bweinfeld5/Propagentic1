/**
 * PropertiesPage - PropAgentic
 * 
 * Main properties page with routing and state management
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import PropertyList from '../components/landlord/PropertyList';
import PropertyForm from '../components/landlord/PropertyForm';
import PropertyDetails from '../components/landlord/PropertyDetails';
import propertyService from '../services/propertyService';
import { LoadingState, Spinner } from '../design-system/loading-states';
import toast from 'react-hot-toast';

const VIEW_MODES = {
  LIST: 'list',
  CREATE: 'create',
  EDIT: 'edit',
  DETAILS: 'details'
};

const PropertiesPage = () => {
  const { currentUser } = useAuth();
  const [currentView, setCurrentView] = useState(VIEW_MODES.LIST);
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Load properties on mount
  useEffect(() => {
    if (currentUser) {
      loadProperties();
    }
  }, [currentUser]);

  // Load all properties for the current user
  const loadProperties = useCallback(async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const userProperties = await propertyService.getPropertiesByOwner(currentUser.uid);
      setProperties(userProperties);
    } catch (error) {
      console.error('Error loading properties:', error);
      toast.error('Failed to load properties');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Load single property by ID
  const loadProperty = useCallback(async (propertyId) => {
    try {
      setActionLoading(true);
      const property = await propertyService.getProperty(propertyId);
      setSelectedProperty(property);
      return property;
    } catch (error) {
      console.error('Error loading property:', error);
      toast.error('Failed to load property details');
      setCurrentView(VIEW_MODES.LIST);
      return null;
    } finally {
      setActionLoading(false);
    }
  }, []);

  // Handle navigation
  const handleAddProperty = useCallback(() => {
    setSelectedProperty(null);
    setCurrentView(VIEW_MODES.CREATE);
  }, []);

  const handleViewProperty = useCallback(async (propertyId) => {
    const property = await loadProperty(propertyId);
    if (property) {
      setCurrentView(VIEW_MODES.DETAILS);
    }
  }, [loadProperty]);

  const handleEditProperty = useCallback(async (propertyId) => {
    const property = await loadProperty(propertyId);
    if (property) {
      setCurrentView(VIEW_MODES.EDIT);
    }
  }, [loadProperty]);

  const handleDeleteProperty = useCallback(async (propertyId) => {
    try {
      setActionLoading(true);
      await propertyService.deleteProperty(propertyId);
      
      // Remove from local state
      setProperties(prev => prev.filter(p => p.id !== propertyId));
      
      // Navigate back to list if we're viewing/editing the deleted property
      if (selectedProperty?.id === propertyId) {
        setSelectedProperty(null);
        setCurrentView(VIEW_MODES.LIST);
      }
      
      toast.success('Property deleted successfully');
    } catch (error) {
      console.error('Error deleting property:', error);
      toast.error('Failed to delete property');
    } finally {
      setActionLoading(false);
    }
  }, [selectedProperty]);

  const handleBackToList = useCallback(() => {
    setSelectedProperty(null);
    setCurrentView(VIEW_MODES.LIST);
  }, []);

  // Handle form submissions
  const handleCreateProperty = useCallback(async (propertyData) => {
    try {
      setActionLoading(true);
      const newProperty = await propertyService.createProperty(propertyData, currentUser.uid);
      
      // Add to local state
      setProperties(prev => [newProperty, ...prev]);
      
      // Navigate to the new property details
      setSelectedProperty(newProperty);
      setCurrentView(VIEW_MODES.DETAILS);
      
      toast.success('Property created successfully!');
    } catch (error) {
      console.error('Error creating property:', error);
      toast.error('Failed to create property');
      throw error; // Re-throw to keep form in error state
    } finally {
      setActionLoading(false);
    }
  }, [currentUser]);

  const handleUpdateProperty = useCallback(async (propertyData) => {
    try {
      setActionLoading(true);
      const updatedProperty = await propertyService.updateProperty(selectedProperty.id, propertyData);
      
      // Update local state
      setProperties(prev => 
        prev.map(p => p.id === selectedProperty.id ? { ...p, ...updatedProperty } : p)
      );
      
      // Update selected property
      setSelectedProperty(prev => ({ ...prev, ...updatedProperty }));
      
      // Navigate to details view
      setCurrentView(VIEW_MODES.DETAILS);
      
      toast.success('Property updated successfully!');
    } catch (error) {
      console.error('Error updating property:', error);
      toast.error('Failed to update property');
      throw error; // Re-throw to keep form in error state
    } finally {
      setActionLoading(false);
    }
  }, [selectedProperty]);

  // Handle property sharing
  const handleShareProperty = useCallback(async (property) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: property.name,
          text: `Check out this property: ${property.name}`,
          url: window.location.href
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Property link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing property:', error);
      toast.error('Failed to share property');
    }
  }, []);

  // Render appropriate view based on current state
  const renderCurrentView = () => {
    switch (currentView) {
      case VIEW_MODES.CREATE:
        return (
          <PropertyForm
            mode="create"
            onSubmit={handleCreateProperty}
            onCancel={handleBackToList}
            isLoading={actionLoading}
          />
        );

      case VIEW_MODES.EDIT:
        return (
          <PropertyForm
            property={selectedProperty}
            mode="edit"
            onSubmit={handleUpdateProperty}
            onCancel={handleBackToList}
            isLoading={actionLoading}
          />
        );

      case VIEW_MODES.DETAILS:
        return (
          <PropertyDetails
            property={selectedProperty}
            loading={actionLoading}
            onBack={handleBackToList}
            onEdit={handleEditProperty}
            onDelete={handleDeleteProperty}
            onShare={handleShareProperty}
          />
        );

      case VIEW_MODES.LIST:
      default:
        return (
          <PropertyList
            properties={properties}
            loading={loading}
            onAddProperty={handleAddProperty}
            onViewProperty={handleViewProperty}
            onEditProperty={handleEditProperty}
            onDeleteProperty={handleDeleteProperty}
            onRefresh={loadProperties}
          />
        );
    }
  };

  // Show loading state for initial load
  if (loading && currentView === VIEW_MODES.LIST) {
    return (
      <LoadingState
        loading={true}
        loader={<Spinner size="lg" />}
        className="min-h-screen flex items-center justify-center"
      >
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Loading Properties
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please wait while we fetch your property portfolio...
          </p>
        </div>
      </LoadingState>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {renderCurrentView()}
      
      {/* Global loading overlay for actions */}
      {actionLoading && currentView !== VIEW_MODES.CREATE && currentView !== VIEW_MODES.EDIT && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center gap-3">
            <Spinner size="sm" />
            <span className="text-gray-900 dark:text-gray-100">
              {currentView === VIEW_MODES.DETAILS ? 'Loading property...' : 'Processing...'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertiesPage; 