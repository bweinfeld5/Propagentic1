import React, { useState } from 'react';
import {
  HomeIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import Button from '../ui/Button';
import ContractorEstimateReadinessIndicator from './ContractorEstimateReadinessIndicator';

/**
 * PropertyCard Component
 * 
 * Displays property information with inline editing capabilities
 * 
 * @param {object} property - The property object
 * @param {function} onUpdate - Callback when property is updated
 * @param {function} onDelete - Callback when property is deleted
 * @param {function} onInviteTenant - Callback when inviting a tenant
 * @param {function} onEditProperty - Callback when editing property for contractor data
 */
const PropertyCard = ({ property, onUpdate, onDelete, onInviteTenant, onEditProperty }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProperty, setEditedProperty] = useState({ ...property });

  // Handle improving contractor estimate data
  const handleImproveData = (property, tradeType = 'all') => {
    if (tradeType === 'request-estimates') {
      // Future: Open contractor request flow
      console.log('Opening contractor estimate request for:', property.id);
      return;
    }
    
    // Open property edit modal with focus on the specific trade
    onEditProperty?.(property.id, { focusSection: tradeType });
  };

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedProperty(prev => ({
      ...prev,
      [name]: name === 'units' ? parseInt(value, 10) || 0 : value
    }));
  };

  // Save changes
  const handleSave = () => {
    onUpdate(editedProperty);
    setIsEditing(false);
  };

  // Cancel changes
  const handleCancel = () => {
    setEditedProperty({ ...property });
    setIsEditing(false);
  };

  // Basic check for address object
  const addressString = property.address 
    ? `${property.address.street || ''}, ${property.address.city || ''}, ${property.address.state || ''} ${property.address.zip || ''}` 
    : 'Address not available';

  return (
    <div className="bg-background dark:bg-background-darkSubtle rounded-xl shadow border border-border dark:border-border-dark p-4 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center mb-3">
        <BuildingOfficeIcon className="w-6 h-6 mr-3 text-primary dark:text-primary-light flex-shrink-0" />
        <h3 className="text-md font-semibold text-content dark:text-content-dark truncate" title={property.name}>
          {property.name || 'Unnamed Property'}
        </h3>
      </div>
      
      <div className="text-sm text-content-secondary dark:text-content-darkSecondary space-y-1.5 mb-4">
        <div className="flex items-start">
          <MapPinIcon className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
          <span className="truncate" title={addressString}>{addressString}</span>
        </div>
        <div className="flex items-center">
          <UsersIcon className="w-4 h-4 mr-2 flex-shrink-0" />
          <span>{property.numberOfUnits || 1} Unit(s)</span> 
          {/* Add occupancy info if available */}
          {/* {property.occupancyRate !== undefined && (
            <span className="ml-2 text-xs">({property.occupancyRate}% Occupied)</span>
          )} */}
        </div>
      </div>
      
      {/* Contractor Estimate Readiness */}
      <div className="mb-4">
        <ContractorEstimateReadinessIndicator
          property={property}
          onImproveData={handleImproveData}
          compact={true}
          showActions={true}
        />
      </div>
      
      <div className="flex justify-end space-x-2 border-t border-border dark:border-border-dark pt-3 mt-3">
        <Button 
          variant="outline"
          size="xs"
          onClick={() => onInviteTenant(property.id)} // Pass property ID to invite handler
        >
          Invite Tenant
        </Button>
        {/* Optional: Add View/Edit buttons later */}
        {/* <Button variant="ghost" size="xs">View</Button> */}
      </div>
    </div>
  );
};

export default PropertyCard; 