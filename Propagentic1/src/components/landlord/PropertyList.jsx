/**
 * PropertyList Component - PropAgentic
 * 
 * Display properties in grid or list view with search and filtering
 */

import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  MagnifyingGlassIcon,
  Squares2X2Icon,
  ListBulletIcon,
  PlusIcon,
  FunnelIcon,
  PhotoIcon,
  MapPinIcon,
  HomeIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import {
  Button,
  Input,
  Select,
  StatusPill,
  EmptyState,
  Card,
  Container,
  ResponsiveGrid
} from '../../design-system';
import { FadeIn, SlideUp, StaggerContainer, StaggerItem } from '../../design-system';
import { useConfirmationDialog } from '../../design-system';
import {
  PropertyType,
  PropertyStatus,
  formatPropertyAddress,
  formatPropertyRent,
  getPropertyStatusColor,
  getPropertyTypeLabel
} from '../../models/Property';

const VIEW_MODES = {
  GRID: 'grid',
  LIST: 'list'
};

const PropertyList = ({
  properties = [],
  loading = false,
  onAddProperty,
  onViewProperty,
  onEditProperty,
  onDeleteProperty,
  onRefresh
}) => {
  const [viewMode, setViewMode] = useState(VIEW_MODES.GRID);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  
  const { showConfirmation } = useConfirmationDialog();

  // Filter and search properties
  const filteredProperties = useMemo(() => {
    let filtered = [...properties];

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(property =>
        property.name.toLowerCase().includes(term) ||
        property.description.toLowerCase().includes(term) ||
        formatPropertyAddress(property).toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(property => property.status === statusFilter);
    }

    // Type filter
    if (typeFilter) {
      filtered = filtered.filter(property => property.type === typeFilter);
    }

    return filtered;
  }, [properties, searchTerm, statusFilter, typeFilter]);

  // Handle delete with confirmation
  const handleDelete = useCallback(async (property) => {
    const confirmed = await showConfirmation({
      type: 'delete',
      title: 'Delete Property',
      message: `Are you sure you want to delete "${property.name}"? This action cannot be undone.`,
      confirmText: 'Delete Property',
      requireTextVerification: true
    });

    if (confirmed) {
      onDeleteProperty(property.id);
    }
  }, [showConfirmation, onDeleteProperty]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('');
    setTypeFilter('');
  }, []);

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    ...Object.values(PropertyStatus).map(status => ({
      value: status,
      label: status.charAt(0).toUpperCase() + status.slice(1)
    }))
  ];

  const typeOptions = [
    { value: '', label: 'All Types' },
    ...Object.values(PropertyType).map(type => ({
      value: type,
      label: getPropertyTypeLabel(type)
    }))
  ];

  const hasActiveFilters = searchTerm || statusFilter || typeFilter;

  // Property Card Component
  const PropertyCard = ({ property }) => (
    <Card className="h-full hover:shadow-lg transition-shadow duration-200">
      {/* Property Image */}
      <div className="relative h-48 bg-gray-100 dark:bg-gray-700 rounded-t-lg overflow-hidden">
        {property.photos && property.photos.length > 0 ? (
          <img
            src={property.photos[0]}
            alt={property.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <PhotoIcon className="h-16 w-16 text-gray-400" />
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <StatusPill 
            color={getPropertyStatusColor(property.status)}
            size="sm"
          >
            {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
          </StatusPill>
        </div>

        {/* Photo Count */}
        {property.photos && property.photos.length > 1 && (
          <div className="absolute top-3 right-3 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
            <PhotoIcon className="h-3 w-3 inline mr-1" />
            {property.photos.length}
          </div>
        )}
      </div>

      {/* Property Details */}
      <div className="p-6">
        <div className="mb-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">
              {property.name}
            </h3>
            <span className="text-lg font-bold text-green-600 dark:text-green-400 ml-2">
              {formatPropertyRent(property)}
            </span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
            <MapPinIcon className="h-4 w-4 mr-1 flex-shrink-0" />
            <span className="line-clamp-1">{formatPropertyAddress(property)}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <HomeIcon className="h-4 w-4 mr-1 flex-shrink-0" />
            <span>
              {getPropertyTypeLabel(property.type)} • 
              {property.bedrooms} bed • 
              {property.bathrooms} bath
              {property.squareFootage && ` • ${property.squareFootage} sq ft`}
            </span>
          </div>
        </div>

        {property.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
            {property.description}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onViewProperty(property.id)}
            className="flex-1"
          >
            <EyeIcon className="h-4 w-4 mr-1" />
            View
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onEditProperty(property.id)}
            className="flex-1"
          >
            <PencilIcon className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleDelete(property)}
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );

  // Property List Row Component
  const PropertyListRow = ({ property }) => (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <div className="p-6">
        <div className="flex items-center gap-6">
          {/* Property Image */}
          <div className="w-24 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
            {property.photos && property.photos.length > 0 ? (
              <img
                src={property.photos[0]}
                alt={property.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <PhotoIcon className="h-8 w-8 text-gray-400" />
              </div>
            )}
          </div>

          {/* Property Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                {property.name}
              </h3>
              <StatusPill 
                color={getPropertyStatusColor(property.status)}
                size="xs"
                className="ml-2"
              >
                {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
              </StatusPill>
            </div>
            
            <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
              <MapPinIcon className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="truncate">{formatPropertyAddress(property)}</span>
            </div>
            
            <div className="flex items-center justify-between mt-2">
              <div className="text-xs text-gray-600 dark:text-gray-400">
                <span className="inline-flex items-center">
                  <HomeIcon className="h-3 w-3 mr-1" />
                  {getPropertyTypeLabel(property.type)}
                </span>
                <span className="mx-2">•</span>
                <span>{property.bedrooms} bed</span>
                <span className="mx-1">•</span>
                <span>{property.bathrooms} bath</span>
                {property.squareFootage && (
                  <>
                    <span className="mx-1">•</span>
                    <span>{property.squareFootage} sq ft</span>
                  </>
                )}
              </div>
              <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                {formatPropertyRent(property)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 items-center">
            <Button
              variant="secondary"
              size="xs"
              onClick={() => onViewProperty(property.id)}
            >
              <EyeIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="xs"
              onClick={() => onEditProperty(property.id)}
            >
              <PencilIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="danger"
              size="xs"
              onClick={() => handleDelete(property)}
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search Bar */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            className="pl-10"
            placeholder="Search by name, address, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Filter Controls */}
        <div className="flex flex-wrap gap-2 items-center">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={statusOptions}
            className="w-36"
          />
          
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={typeOptions}
            className="w-40"
          />
          
          {/* View Mode Toggle */}
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-1 flex ml-2">
            <button
              className={`p-1.5 rounded ${
                viewMode === VIEW_MODES.GRID
                  ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              onClick={() => setViewMode(VIEW_MODES.GRID)}
              aria-label="Grid view"
            >
              <Squares2X2Icon className="h-5 w-5" />
            </button>
            
            <button
              className={`p-1.5 rounded ${
                viewMode === VIEW_MODES.LIST
                  ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              onClick={() => setViewMode(VIEW_MODES.LIST)}
              aria-label="List view"
            >
              <ListBulletIcon className="h-5 w-5" />
            </button>
          </div>
          
          {/* Add Property Button */}
          {onAddProperty && (
            <Button
              variant="primary"
              onClick={onAddProperty}
              className="ml-2"
            >
              <PlusIcon className="h-5 w-5 mr-1" />
              Add Property
            </Button>
          )}
        </div>
      </div>
      
      {/* Active Filters Indicator */}
      {hasActiveFilters && (
        <div className="flex items-center">
          <div className="flex items-center text-sm">
            <FunnelIcon className="h-4 w-4 text-blue-600 mr-2" />
            <span className="text-gray-700 dark:text-gray-300">
              Filtered by: 
              {statusFilter && (
                <span className="ml-1 font-medium">
                  {statusOptions.find(o => o.value === statusFilter)?.label}
                </span>
              )}
              {typeFilter && (
                <span className="ml-1 font-medium">
                  {typeOptions.find(o => o.value === typeFilter)?.label}
                </span>
              )}
              {searchTerm && (
                <span className="ml-1 font-medium">
                  Search "{searchTerm}"
                </span>
              )}
            </span>
          </div>
          
          <button
            className="ml-2 text-sm text-blue-600 hover:text-blue-800 dark:hover:text-blue-400"
            onClick={clearFilters}
          >
            Clear Filters
          </button>
        </div>
      )}
      
      {/* Properties Grid/List */}
      <FadeIn>
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading properties...</p>
          </div>
        ) : filteredProperties.length === 0 ? (
          <EmptyState
            icon={<HomeIcon className="h-12 w-12" />}
            title="No properties found"
            description={
              hasActiveFilters
                ? "No properties match your current filters. Try adjusting your search criteria."
                : "You don't have any properties yet. Add your first property to get started."
            }
            actionLabel={hasActiveFilters ? "Clear Filters" : "Add Property"}
            onAction={hasActiveFilters ? clearFilters : onAddProperty}
          />
        ) : (
          <StaggerContainer>
            {viewMode === VIEW_MODES.GRID ? (
              <ResponsiveGrid columns={{ sm: 1, md: 2, lg: 3 }} spacing="md">
                {filteredProperties.map((property) => (
                  <StaggerItem key={property.id}>
                    <SlideUp>
                      <PropertyCard property={property} />
                    </SlideUp>
                  </StaggerItem>
                ))}
              </ResponsiveGrid>
            ) : (
              <div className="space-y-4">
                {filteredProperties.map((property) => (
                  <StaggerItem key={property.id}>
                    <SlideUp>
                      <PropertyListRow property={property} />
                    </SlideUp>
                  </StaggerItem>
                ))}
              </div>
            )}
          </StaggerContainer>
        )}
      </FadeIn>
    </div>
  );
};

PropertyList.propTypes = {
  properties: PropTypes.array,
  loading: PropTypes.bool,
  onAddProperty: PropTypes.func,
  onViewProperty: PropTypes.func,
  onEditProperty: PropTypes.func,
  onDeleteProperty: PropTypes.func,
  onRefresh: PropTypes.func
};

export default PropertyList; 