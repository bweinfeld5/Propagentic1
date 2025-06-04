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
            <div className="flex items-start justify-between mb-2">
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {property.name}
                </h3>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-1">
                  <MapPinIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span className="truncate">{formatPropertyAddress(property)}</span>
                </div>
              </div>
              <div className="flex items-center gap-4 ml-4">
                <StatusPill color={getPropertyStatusColor(property.status)} size="sm">
                  {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
                </StatusPill>
                <span className="text-lg font-bold text-green-600 dark:text-green-400">
                  {formatPropertyRent(property)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <HomeIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                <span>
                  {getPropertyTypeLabel(property.type)} • 
                  {property.bedrooms} bed • 
                  {property.bathrooms} bath
                  {property.squareFootage && ` • ${property.squareFootage} sq ft`}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onViewProperty(property.id)}
                >
                  <EyeIcon className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onEditProperty(property.id)}
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
          </div>
        </div>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <Container maxWidth="full" padding={true}>
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-80 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </Container>
    );
  }

  return (
    <FadeIn>
      <Container maxWidth="full" padding={true}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Properties
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your property portfolio
            </p>
          </div>
          
          <Button
            variant="primary"
            onClick={onAddProperty}
            className="sm:w-auto"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Property
          </Button>
        </div>

        {/* Filters and Controls */}
        <SlideUp delay={0.1}>
          <Card className="mb-6">
            <div className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <Input
                    type="search"
                    placeholder="Search properties..."
                    value={searchTerm}
                    onChange={setSearchTerm}
                    icon={MagnifyingGlassIcon}
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Select
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={statusOptions}
                    className="sm:w-40"
                  />
                  
                  <Select
                    value={typeFilter}
                    onChange={setTypeFilter}
                    options={typeOptions}
                    className="sm:w-40"
                  />

                  {hasActiveFilters && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={clearFilters}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>

                {/* View Toggle */}
                <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode(VIEW_MODES.GRID)}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === VIEW_MODES.GRID
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                    }`}
                  >
                    <Squares2X2Icon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setViewMode(VIEW_MODES.LIST)}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === VIEW_MODES.LIST
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                    }`}
                  >
                    <ListBulletIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </SlideUp>

        {/* Results Summary */}
        {(hasActiveFilters || filteredProperties.length > 0) && (
          <SlideUp delay={0.2}>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {filteredProperties.length === properties.length ? (
                  `${properties.length} ${properties.length === 1 ? 'property' : 'properties'}`
                ) : (
                  `${filteredProperties.length} of ${properties.length} ${properties.length === 1 ? 'property' : 'properties'}`
                )}
              </p>
              
              {onRefresh && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onRefresh}
                >
                  Refresh
                </Button>
              )}
            </div>
          </SlideUp>
        )}

        {/* Properties Grid/List */}
        {filteredProperties.length === 0 ? (
          <SlideUp delay={0.3}>
            <EmptyState
              type={hasActiveFilters ? "no-results" : "properties"}
              title={hasActiveFilters ? "No properties found" : "No properties yet"}
              description={
                hasActiveFilters 
                  ? "Try adjusting your search or filter criteria"
                  : "Add your first property to get started with your portfolio"
              }
              primaryAction={
                hasActiveFilters 
                  ? { label: "Clear Filters", onClick: clearFilters }
                  : { label: "Add Property", onClick: onAddProperty }
              }
              secondaryAction={
                hasActiveFilters 
                  ? { label: "Add Property", onClick: onAddProperty }
                  : null
              }
            />
          </SlideUp>
        ) : (
          <StaggerContainer delay={0.3}>
            {viewMode === VIEW_MODES.GRID ? (
              <ResponsiveGrid 
                cols={{ xs: 1, sm: 2, lg: 3, xl: 4 }} 
                gap={6}
              >
                {filteredProperties.map((property) => (
                  <StaggerItem key={property.id}>
                    <PropertyCard property={property} />
                  </StaggerItem>
                ))}
              </ResponsiveGrid>
            ) : (
              <div className="space-y-4">
                {filteredProperties.map((property) => (
                  <StaggerItem key={property.id}>
                    <PropertyListRow property={property} />
                  </StaggerItem>
                ))}
              </div>
            )}
          </StaggerContainer>
        )}
      </Container>
    </FadeIn>
  );
};

PropertyList.propTypes = {
  properties: PropTypes.array,
  loading: PropTypes.bool,
  onAddProperty: PropTypes.func.isRequired,
  onViewProperty: PropTypes.func.isRequired,
  onEditProperty: PropTypes.func.isRequired,
  onDeleteProperty: PropTypes.func.isRequired,
  onRefresh: PropTypes.func
};

export default PropertyList; 