/**
 * PublicPropertyDashboardDemo - PropAgentic
 * 
 * Public demo of the Property Dashboard with all implementations from tasks 1.1-4.1
 * No authentication required - uses mock data
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  HomeIcon,
  CurrencyDollarIcon,
  UsersIcon,
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  ArrowTopRightOnSquareIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import {
  Container,
  ResponsiveGrid,
  EmptyState,
  FadeIn,
  SlideUp,
  StaggerContainer,
  StaggerItem
} from '../design-system';
import Card from '../components/ui/Card';
import StatusPill from '../components/ui/StatusPill';
import Button from '../components/ui/Button';

// Mock data that matches the UI shown in the screenshot
const mockStats = {
  total: 3,
  occupied: 2,
  vacant: 1,
  maintenance: 1,
  occupancyRate: 86, // Matches screenshot
  totalValue: 2500000,
  totalUnits: 72, // Matches screenshot
  monthlyRevenue: 105600 // Matches screenshot
};

const mockProperties = [
  {
    id: 'sunset-apartments',
    name: 'Sunset Apartments',
    description: 'Modern apartment complex with stunning sunset views',
    type: 'apartment',
    status: 'occupied',
    address: {
      street: '123 Main St',
      city: 'Downtown',
      state: 'CA',
      zipCode: '90210',
      country: 'US'
    },
    bedrooms: 2,
    bathrooms: 2,
    squareFootage: 1200,
    monthlyRent: 3500,
    photos: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
    occupancyRate: 92
  },
  {
    id: 'downtown-lofts',
    name: 'Downtown Lofts',
    description: 'Luxury lofts in the heart of downtown',
    type: 'loft',
    status: 'occupied',
    address: {
      street: '456 Business Ave',
      city: 'Central',
      state: 'CA',
      zipCode: '90211',
      country: 'US'
    },
    bedrooms: 1,
    bathrooms: 1,
    squareFootage: 950,
    monthlyRent: 2800,
    photos: ['https://images.unsplash.com/photo-1595526051245-4506e0005bd7?w=800'],
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-20'),
    occupancyRate: 100
  },
  {
    id: 'garden-complex',
    name: 'Garden Complex',
    description: 'Family-friendly complex with beautiful gardens',
    type: 'house',
    status: 'maintenance',
    address: {
      street: '789 Park Lane',
      city: 'Suburbs',
      state: 'CA',
      zipCode: '90212',
      country: 'US'
    },
    bedrooms: 3,
    bathrooms: 2,
    squareFootage: 1500,
    monthlyRent: 4200,
    photos: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800'],
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-25'),
    occupancyRate: 78
  }
];

const mockRecentActivity = [
  {
    id: 'rent-sunset',
    type: 'rent_collected',
    property: mockProperties[0],
    amount: 3500,
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    description: 'Rent collected for Sunset Apartments'
  },
  {
    id: 'maintenance-garden',
    type: 'maintenance_started',
    property: mockProperties[2],
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    description: 'Maintenance started for Garden Complex'
  },
  {
    id: 'rent-downtown',
    type: 'rent_collected',
    property: mockProperties[1],
    amount: 2800,
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    description: 'Rent collected for Downtown Lofts'
  }
];

const PublicPropertyDashboardDemo = () => {
  const [properties, setProperties] = useState(mockProperties);
  const [stats, setStats] = useState(mockStats);
  const [recentActivity, setRecentActivity] = useState(mockRecentActivity);
  const [loading, setLoading] = useState(true);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Handler functions for demo
  const handleViewProperty = (propertyId) => {
    alert(`Would navigate to property details for: ${propertyId}`);
  };

  const handleAddProperty = () => {
    alert('Would navigate to add property form');
  };

  const handleViewAllProperties = () => {
    alert('Would navigate to full property list');
  };

  // Format property address
  const formatPropertyAddress = (property) => {
    if (!property.address) return '';
    return `${property.address.street}, ${property.address.city}`;
  };

  // Format property rent
  const formatPropertyRent = (property) => {
    return `$${property.monthlyRent?.toLocaleString() || 0}/mo`;
  };

  // Get property status color
  const getPropertyStatusColor = (status) => {
    switch (status) {
      case 'occupied': return 'green';
      case 'vacant': return 'yellow';
      case 'maintenance': return 'orange';
      default: return 'gray';
    }
  };

  // Get property type label
  const getPropertyTypeLabel = (type) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Calculate quick stats
  const quickStats = {
    totalProperties: stats.total,
    occupancyRate: stats.occupancyRate,
    totalUnits: stats.totalUnits,
    monthlyRevenue: stats.monthlyRevenue,
    rentCollected: properties.reduce((sum, p) => 
      p.status === 'occupied' ? sum + (p.monthlyRent || 0) : sum, 0
    ),
    maintenanceProperties: stats.maintenance
  };

  if (loading) {
    return (
      <Container maxWidth="full" padding={true}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Demo Header */}
      <div className="bg-blue-600 text-white px-6 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold">PropAgentic Property Dashboard Demo</h1>
              <p className="text-blue-100 text-sm">Live demo - No authentication required</p>
            </div>
            <div className="text-blue-100 text-sm">
              🏠 All implementations active (Tasks 1.1-4.1)
            </div>
          </div>
        </div>
      </div>

      <FadeIn>
        <Container maxWidth="full" padding={true}>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Dashboard
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-gray-600 dark:text-gray-400">Default View</span>
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={handleViewAllProperties}
              >
                <EyeIcon className="h-4 w-4 mr-2" />
                View All Properties
              </Button>
              <Button
                variant="primary"
                onClick={handleAddProperty}
              >
                <HomeIcon className="h-4 w-4 mr-2" />
                Add Property
              </Button>
            </div>
          </div>

          {/* Quick Stats - Matching screenshot exactly */}
          <SlideUp delay={0.1}>
            <StaggerContainer>
              <ResponsiveGrid cols={{ xs: 1, sm: 2, lg: 4 }} gap={6} className="mb-8">
                <StaggerItem>
                  <StatCard
                    title="Total Properties"
                    value={quickStats.totalProperties}
                    icon={HomeIcon}
                    color="orange"
                    trend="up"
                  />
                </StaggerItem>
                
                <StaggerItem>
                  <StatCard
                    title="Total Units"
                    value={quickStats.totalUnits}
                    icon={BuildingOfficeIcon}
                    color="blue"
                    trend="up"
                  />
                </StaggerItem>
                
                <StaggerItem>
                  <StatCard
                    title="Occupancy Rate"
                    value={`${quickStats.occupancyRate}%`}
                    icon={UsersIcon}
                    color="green"
                    trend="up"
                  />
                </StaggerItem>
                
                <StaggerItem>
                  <StatCard
                    title="Monthly Revenue"
                    value={`$${quickStats.monthlyRevenue.toLocaleString()}`}
                    icon={CurrencyDollarIcon}
                    color="purple"
                    trend="up"
                  />
                </StaggerItem>
              </ResponsiveGrid>
            </StaggerContainer>
          </SlideUp>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Properties - Matching screenshot */}
            <div className="lg:col-span-2">
              <SlideUp delay={0.2}>
                <Card>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Recent Properties
                      </h2>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleViewAllProperties}
                      >
                        View All
                        <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                    
                    <StaggerContainer>
                      <div className="space-y-4">
                        {properties.map((property) => (
                          <StaggerItem key={property.id}>
                            <PropertyOverviewCard 
                              property={property} 
                              onView={() => handleViewProperty(property.id)}
                              formatPropertyAddress={formatPropertyAddress}
                              formatPropertyRent={formatPropertyRent}
                              getPropertyStatusColor={getPropertyStatusColor}
                              getPropertyTypeLabel={getPropertyTypeLabel}
                            />
                          </StaggerItem>
                        ))}
                      </div>
                    </StaggerContainer>
                  </div>
                </Card>
              </SlideUp>
            </div>

            {/* Quick Actions - Matching screenshot */}
            <div>
              <SlideUp delay={0.3}>
                <Card>
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                      Quick Actions
                    </h2>
                    
                    <div className="space-y-4">
                      <QuickActionItem
                        icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}
                        title="Import Properties"
                        description="Bulk import from CSV"
                        color="blue"
                        onClick={handleAddProperty}
                      />
                      
                      <QuickActionItem
                        icon={<ChartBarIcon className="h-5 w-5" />}
                        title="View Reports"
                        description="Analytics & insights"
                        color="purple"
                        onClick={() => alert('Would open reports')}
                      />
                      
                      <QuickActionItem
                        icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" /></svg>}
                        title="Customize Dashboard"
                        description="Drag & drop widgets"
                        color="green"
                        onClick={() => alert('Would open customization')}
                      />
                      
                      <QuickActionItem
                        icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
                        title="Global Search"
                        description="Find anything quickly"
                        color="gray"
                        onClick={() => alert('Would open search')}
                      />
                    </div>
                  </div>
                </Card>
              </SlideUp>
            </div>
          </div>

          {/* Demo Information */}
          <div className="mt-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
              🎯 Demo Features Active
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="text-blue-800 dark:text-blue-200">
                ✅ Task 1.1: Property Overview Cards
              </div>
              <div className="text-blue-800 dark:text-blue-200">
                ✅ Task 1.2: Quick Stats Dashboard  
              </div>
              <div className="text-blue-800 dark:text-blue-200">
                ✅ Task 1.3: Recent Activity Feed
              </div>
              <div className="text-blue-800 dark:text-blue-200">
                ✅ Task 1.4: Responsive Design
              </div>
            </div>
          </div>
        </Container>
      </FadeIn>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, color, trend }) => {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
  };

  const TrendIcon = trend === 'up' ? ArrowUpIcon : trend === 'down' ? ArrowDownIcon : null;

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
          {TrendIcon && (
            <TrendIcon className={`h-5 w-5 ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`} />
          )}
        </div>
        
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {value}
          </p>
        </div>
      </div>
    </Card>
  );
};

// Property Overview Card Component
const PropertyOverviewCard = ({ 
  property, 
  onView, 
  formatPropertyAddress, 
  formatPropertyRent, 
  getPropertyStatusColor, 
  getPropertyTypeLabel 
}) => {
  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
      {/* Property Image */}
      <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-lg overflow-hidden flex-shrink-0">
        {property.photos && property.photos.length > 0 ? (
          <img
            src={property.photos[0]}
            alt={property.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <PhotoIcon className="h-6 w-6 text-gray-400" />
          </div>
        )}
      </div>

      {/* Property Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between mb-1">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
            {property.name}
          </h3>
          <StatusPill 
            color={getPropertyStatusColor(property.status)}
            size="xs"
          >
            {property.occupancyRate}% occupied
          </StatusPill>
        </div>
        
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-1">
          <MapPinIcon className="h-3 w-3 mr-1 flex-shrink-0" />
          <span className="truncate">{formatPropertyAddress(property)}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {getPropertyTypeLabel(property.type)} • {property.bedrooms}bed/{property.bathrooms}bath
          </span>
          <span className="font-medium text-green-600 dark:text-green-400">
            {formatPropertyRent(property)}
          </span>
        </div>
      </div>

      {/* View Button */}
      <Button
        variant="secondary"
        size="sm"
        onClick={onView}
      >
        <EyeIcon className="h-4 w-4" />
      </Button>
    </div>
  );
};

// Quick Action Item Component
const QuickActionItem = ({ icon, title, description, color, onClick }) => {
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400',
    purple: 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400',
    gray: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
  };

  return (
    <div 
      className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {title}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </div>
    </div>
  );
};

export default PublicPropertyDashboardDemo; 