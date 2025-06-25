import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  MapPinIcon,
  HomeIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  StarIcon,
  AdjustmentsHorizontalIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  Squares2X2Icon,
  ListBulletIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import SearchPropertyCard from './SearchPropertyCard';
import LoadingSpinner from '../ui/LoadingSpinner';
import EmptyState from '../ui/EmptyState';
import { useBreakpoint } from '../../design-system/responsive';

const AdvancedPropertySearch = ({
  properties = [],
  onSearch,
  loading = false,
  showFilters = true,
  onPropertySelect,
  displayMode = 'grid', // 'grid' | 'list' | 'map'
  className = ''
}) => {
  const { currentUser, user } = useAuth();
  const { isMobile, isTablet } = useBreakpoint();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    propertyType: '',
    status: '',
    priceRange: { min: '', max: '' },
    bedrooms: '',
    bathrooms: '',
    sqftRange: { min: '', max: '' },
    location: {
      city: '',
      state: '',
      zipCode: '',
      radius: '10' // miles
    },
    amenities: [],
    availability: '',
    petPolicy: '',
    parkingType: '',
    leaseLength: '',
    sortBy: 'relevance',
    sortOrder: 'desc'
  });
  
  const [viewMode, setViewMode] = useState(displayMode);
  const [favorites, setFavorites] = useState([]);
  
  // Filter presets
  const filterPresets = [
    {
      id: 'budget',
      name: 'Budget-Friendly',
      filters: { priceRange: { min: '', max: '1500' }, sortBy: 'price', sortOrder: 'asc' }
    },
    {
      id: 'luxury',
      name: 'Luxury Properties',
      filters: { priceRange: { min: '2500', max: '' }, amenities: ['Pool', 'Gym', 'Concierge'], sortBy: 'price', sortOrder: 'desc' }
    },
    {
      id: 'family',
      name: 'Family-Friendly',
      filters: { bedrooms: '3+', amenities: ['Playground', 'School District'], petPolicy: 'allowed' }
    },
    {
      id: 'downtown',
      name: 'Downtown Living',
      filters: { location: { city: 'Downtown' }, amenities: ['Transit Access', 'Shopping'], sortBy: 'distance' }
    }
  ];

  // Filter options
  const filterOptions = {
    propertyType: [
      { value: '', label: 'All Types' },
      { value: 'apartment', label: 'Apartment' },
      { value: 'house', label: 'House' },
      { value: 'condo', label: 'Condo' },
      { value: 'townhouse', label: 'Townhouse' },
      { value: 'studio', label: 'Studio' },
      { value: 'loft', label: 'Loft' }
    ],
    status: [
      { value: '', label: 'All Status' },
      { value: 'available', label: 'Available' },
      { value: 'occupied', label: 'Occupied' },
      { value: 'maintenance', label: 'Under Maintenance' },
      { value: 'pending', label: 'Application Pending' }
    ],
    bedrooms: [
      { value: '', label: 'Any Bedrooms' },
      { value: '0', label: 'Studio' },
      { value: '1', label: '1 Bedroom' },
      { value: '2', label: '2 Bedrooms' },
      { value: '3', label: '3 Bedrooms' },
      { value: '4', label: '4 Bedrooms' },
      { value: '5+', label: '5+ Bedrooms' }
    ],
    bathrooms: [
      { value: '', label: 'Any Bathrooms' },
      { value: '1', label: '1+ Bathroom' },
      { value: '1.5', label: '1.5+ Bathrooms' },
      { value: '2', label: '2+ Bathrooms' },
      { value: '2.5', label: '2.5+ Bathrooms' },
      { value: '3', label: '3+ Bathrooms' }
    ],
    amenities: [
      'Pool', 'Gym', 'Parking', 'Laundry', 'Air Conditioning', 'Heating',
      'Dishwasher', 'Microwave', 'Refrigerator', 'Balcony', 'Patio',
      'Garden', 'Fireplace', 'Hardwood Floors', 'Carpet', 'Tile',
      'Walk-in Closet', 'Storage', 'Elevator', 'Wheelchair Accessible',
      'Pet Friendly', 'Playground', 'BBQ Area', 'Concierge', 'Security',
      'Gated Community', 'School District', 'Transit Access', 'Shopping',
      'Restaurants', 'Entertainment', 'Parks', 'Beach Access'
    ],
    availability: [
      { value: '', label: 'Any Availability' },
      { value: 'immediate', label: 'Available Now' },
      { value: 'within_30', label: 'Within 30 Days' },
      { value: 'within_60', label: 'Within 60 Days' },
      { value: 'future', label: 'Future Availability' }
    ],
    petPolicy: [
      { value: '', label: 'Any Pet Policy' },
      { value: 'allowed', label: 'Pets Allowed' },
      { value: 'cats_only', label: 'Cats Only' },
      { value: 'dogs_only', label: 'Dogs Only' },
      { value: 'no_pets', label: 'No Pets' }
    ],
    parkingType: [
      { value: '', label: 'Any Parking' },
      { value: 'garage', label: 'Garage' },
      { value: 'covered', label: 'Covered Parking' },
      { value: 'open', label: 'Open Parking' },
      { value: 'street', label: 'Street Parking' },
      { value: 'none', label: 'No Parking' }
    ],
    leaseLength: [
      { value: '', label: 'Any Lease Length' },
      { value: 'month_to_month', label: 'Month-to-Month' },
      { value: '6_months', label: '6 Months' },
      { value: '12_months', label: '12 Months' },
      { value: '18_months', label: '18 Months' },
      { value: '24_months', label: '24+ Months' }
    ],
    sortBy: [
      { value: 'relevance', label: 'Relevance' },
      { value: 'price', label: 'Price' },
      { value: 'size', label: 'Size' },
      { value: 'date_added', label: 'Date Added' },
      { value: 'distance', label: 'Distance' },
      { value: 'rating', label: 'Rating' }
    ]
  };

  // Filter and search properties
  const filteredProperties = useMemo(() => {
    let filtered = [...properties];

    // Text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(property =>
        property.name?.toLowerCase().includes(query) ||
        property.description?.toLowerCase().includes(query) ||
        property.address?.street?.toLowerCase().includes(query) ||
        property.address?.city?.toLowerCase().includes(query) ||
        property.address?.state?.toLowerCase().includes(query) ||
        property.address?.zipCode?.includes(query) ||
        property.amenities?.some(amenity => amenity.toLowerCase().includes(query))
      );
    }

    // Apply filters
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (!value || (typeof value === 'object' && Object.values(value).every(v => !v))) return;

      switch (key) {
        case 'propertyType':
          if (value) filtered = filtered.filter(p => p.type === value);
          break;
        case 'status':
          if (value) filtered = filtered.filter(p => p.status === value);
          break;
        case 'priceRange':
          if (value.min) filtered = filtered.filter(p => p.rentAmount >= parseFloat(value.min));
          if (value.max) filtered = filtered.filter(p => p.rentAmount <= parseFloat(value.max));
          break;
        case 'bedrooms':
          if (value) {
            if (value === '5+') {
              filtered = filtered.filter(p => p.bedrooms >= 5);
            } else {
              filtered = filtered.filter(p => p.bedrooms === parseInt(value));
            }
          }
          break;
        case 'bathrooms':
          if (value) filtered = filtered.filter(p => p.bathrooms >= parseFloat(value));
          break;
        case 'sqftRange':
          if (value.min) filtered = filtered.filter(p => p.sqft >= parseFloat(value.min));
          if (value.max) filtered = filtered.filter(p => p.sqft <= parseFloat(value.max));
          break;
        case 'location':
          if (value.city) filtered = filtered.filter(p => 
            p.address?.city?.toLowerCase().includes(value.city.toLowerCase())
          );
          if (value.state) filtered = filtered.filter(p => 
            p.address?.state?.toLowerCase() === value.state.toLowerCase()
          );
          if (value.zipCode) filtered = filtered.filter(p => 
            p.address?.zipCode?.includes(value.zipCode)
          );
          break;
        case 'amenities':
          if (value.length > 0) {
            filtered = filtered.filter(p =>
              value.every(amenity => p.amenities?.includes(amenity))
            );
          }
          break;
        case 'availability':
          if (value) {
            const now = new Date();
            filtered = filtered.filter(p => {
              if (!p.availableDate) return value === 'immediate';
              const availableDate = new Date(p.availableDate);
              const daysDiff = Math.ceil((availableDate - now) / (1000 * 60 * 60 * 24));
              
              switch (value) {
                case 'immediate': return daysDiff <= 0;
                case 'within_30': return daysDiff <= 30;
                case 'within_60': return daysDiff <= 60;
                case 'future': return daysDiff > 60;
                default: return true;
              }
            });
          }
          break;
        case 'petPolicy':
          if (value) filtered = filtered.filter(p => p.petPolicy === value);
          break;
        case 'parkingType':
          if (value) filtered = filtered.filter(p => p.parkingType === value);
          break;
        case 'leaseLength':
          if (value) filtered = filtered.filter(p => p.leaseLength === value);
          break;
      }
    });

    // Sort results
    const { sortBy, sortOrder } = activeFilters;
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'price':
          comparison = (a.rentAmount || 0) - (b.rentAmount || 0);
          break;
        case 'size':
          comparison = (a.sqft || 0) - (b.sqft || 0);
          break;
        case 'date_added':
          comparison = new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
          break;
        case 'rating':
          comparison = (a.rating || 0) - (b.rating || 0);
          break;
        case 'distance':
          // Would require geolocation logic
          comparison = 0;
          break;
        default: // relevance
          comparison = 0;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [properties, searchQuery, activeFilters]);

  // Handle filter changes
  const handleFilterChange = useCallback((filterKey, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
  }, []);

  // Handle nested filter changes (like priceRange)
  const handleNestedFilterChange = useCallback((filterKey, subKey, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterKey]: {
        ...prev[filterKey],
        [subKey]: value
      }
    }));
  }, []);

  // Apply filter preset
  const applyPreset = useCallback((preset) => {
    setActiveFilters(prev => ({
      ...prev,
      ...preset.filters
    }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setActiveFilters({
      propertyType: '',
      status: '',
      priceRange: { min: '', max: '' },
      bedrooms: '',
      bathrooms: '',
      sqftRange: { min: '', max: '' },
      location: {
        city: '',
        state: '',
        zipCode: '',
        radius: '10'
      },
      amenities: [],
      availability: '',
      petPolicy: '',
      parkingType: '',
      leaseLength: '',
      sortBy: 'relevance',
      sortOrder: 'desc'
    });
    setSearchQuery('');
  }, []);

  // Get active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (key === 'sortBy' || key === 'sortOrder') return;
      
      if (typeof value === 'object') {
        if (Array.isArray(value)) {
          if (value.length > 0) count++;
        } else {
          if (Object.values(value).some(v => v)) count++;
        }
      } else if (value) {
        count++;
      }
    });
    return count;
  }, [activeFilters]);

  // Handle favorites
  const handleToggleFavorite = useCallback((propertyId) => {
    setFavorites(prev => {
      if (prev.includes(propertyId)) {
        return prev.filter(id => id !== propertyId);
      } else {
        return [...prev, propertyId];
      }
    });
  }, []);

  // Handle view mode change
  const handleViewModeChange = useCallback((mode) => {
    setViewMode(mode);
  }, []);

  // Update search callback
  useEffect(() => {
    onSearch?.({
      query: searchQuery,
      filters: activeFilters,
      results: filteredProperties
    });
  }, [searchQuery, activeFilters, filteredProperties, onSearch]);

  return (
    <div className={`advanced-property-search ${className}`}>
      {/* Search Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        {/* Main Search Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by location, property name, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {showFilters && (
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-4 py-3 rounded-lg border flex items-center gap-2 whitespace-nowrap ${
                showAdvancedFilters || activeFilterCount > 0
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FunnelIcon className="w-5 h-5" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
              {showAdvancedFilters ? (
                <ChevronUpIcon className="w-4 h-4" />
              ) : (
                <ChevronDownIcon className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Filter Presets */}
        {!isMobile && (
          <div className="flex flex-wrap gap-2 mb-4">
            {filterPresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset)}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
              >
                {preset.name}
              </button>
            ))}
          </div>
        )}

        {/* Results Summary and View Controls */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            {loading ? 'Searching...' : `${filteredProperties.length} properties found`}
          </span>
          
          <div className="flex items-center gap-4">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => handleViewModeChange('grid')}
                className={`p-2 rounded ${
                  viewMode === 'grid'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                title="Grid View"
              >
                <Squares2X2Icon className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleViewModeChange('list')}
                className={`p-2 rounded ${
                  viewMode === 'list'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                title="List View"
              >
                <ListBulletIcon className="w-4 h-4" />
              </button>
            </div>

            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showAdvancedFilters && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            
            {/* Property Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Type
              </label>
              <select
                value={activeFilters.propertyType}
                onChange={(e) => handleFilterChange('propertyType', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {filterOptions.propertyType.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={activeFilters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {filterOptions.status.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price Range
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={activeFilters.priceRange.min}
                  onChange={(e) => handleNestedFilterChange('priceRange', 'min', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={activeFilters.priceRange.max}
                  onChange={(e) => handleNestedFilterChange('priceRange', 'max', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Bedrooms */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bedrooms
              </label>
              <select
                value={activeFilters.bedrooms}
                onChange={(e) => handleFilterChange('bedrooms', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {filterOptions.bedrooms.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Bathrooms */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bathrooms
              </label>
              <select
                value={activeFilters.bathrooms}
                onChange={(e) => handleFilterChange('bathrooms', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {filterOptions.bathrooms.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Square Footage */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Square Footage
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={activeFilters.sqftRange.min}
                  onChange={(e) => handleNestedFilterChange('sqftRange', 'min', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={activeFilters.sqftRange.max}
                  onChange={(e) => handleNestedFilterChange('sqftRange', 'max', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Availability */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Availability
              </label>
              <select
                value={activeFilters.availability}
                onChange={(e) => handleFilterChange('availability', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {filterOptions.availability.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Pet Policy */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pet Policy
              </label>
              <select
                value={activeFilters.petPolicy}
                onChange={(e) => handleFilterChange('petPolicy', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {filterOptions.petPolicy.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amenities Filter */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Amenities
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {filterOptions.amenities.map(amenity => (
                <label key={amenity} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={activeFilters.amenities.includes(amenity)}
                    onChange={(e) => {
                      const newAmenities = e.target.checked
                        ? [...activeFilters.amenities, amenity]
                        : activeFilters.amenities.filter(a => a !== amenity);
                      handleFilterChange('amenities', newAmenities);
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{amenity}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Sort Options */}
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={activeFilters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {filterOptions.sortBy.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order
              </label>
              <select
                value={activeFilters.sortOrder}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="desc">High to Low</option>
                <option value="asc">Low to High</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Search Results */}
      <div className="search-results">
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredProperties.length === 0 ? (
          <EmptyState
            icon={<HomeIcon className="h-12 w-12" />}
            title="No properties found"
            description="Try adjusting your search criteria or clearing some filters."
            actionLabel="Clear Filters"
            onAction={clearFilters}
          />
        ) : (
          <div className={`property-results ${
            viewMode === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          }`}>
            {filteredProperties.map((property) => (
              <SearchPropertyCard
                key={property.id}
                property={property}
                viewMode={viewMode}
                onView={(property) => onPropertySelect?.(property)}
                onFavorite={handleToggleFavorite}
                isFavorited={favorites.includes(property.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedPropertySearch; 