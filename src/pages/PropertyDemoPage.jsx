/**
 * PropertyDemoPage - PropAgentic
 * 
 * Demo page for testing property management functionality
 */

import React, { useState } from 'react';
import { 
  Container, 
  Button, 
  Card, 
  ResponsiveGrid,
  PropertyForm,
  PropertyList,
  PropertyDetails
} from '../design-system';
import { FadeIn, StaggerContainer, StaggerItem } from '../design-system';
import { HomeIcon, PlusIcon, EyeIcon, PencilIcon } from '@heroicons/react/24/outline';
import { PropertyType, PropertyStatus, createDefaultProperty } from '../models/Property';

// Mock property data
const mockProperties = [
  {
    id: '1',
    name: 'Sunset Apartments Unit 3B',
    description: 'Beautiful 2-bedroom apartment with mountain views. Recently renovated with modern appliances and hardwood floors.',
    type: PropertyType.APARTMENT,
    status: PropertyStatus.OCCUPIED,
    
    address: {
      street: '123 Sunset Boulevard',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90210',
      country: 'US'
    },
    
    bedrooms: 2,
    bathrooms: 2,
    squareFootage: 1200,
    yearBuilt: 2018,
    
    monthlyRent: 3500,
    securityDeposit: 3500,
    propertyValue: 650000,
    monthlyExpenses: 500,
    
    photos: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      'https://images.unsplash.com/photo-1595526051245-4506e0005bd7?w=800',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800'
    ],
    
    amenities: ['Air Conditioning', 'Laundry', 'Parking', 'Balcony', 'Hardwood Floors'],
    petPolicy: {
      allowed: true,
      deposit: 500,
      restrictions: 'No aggressive breeds, 50lb weight limit'
    },
    
    tenantId: 'tenant-1',
    ownerId: 'owner-1',
    
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2024-01-10'),
    
    featured: true,
    notes: 'Great tenant, never late on rent. AC unit serviced last month.'
  },
  {
    id: '2',
    name: 'Downtown Loft Studio',
    description: 'Modern studio loft in the heart of downtown. Perfect for young professionals.',
    type: PropertyType.STUDIO,
    status: PropertyStatus.VACANT,
    
    address: {
      street: '456 Main Street',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102',
      country: 'US'
    },
    
    bedrooms: 0,
    bathrooms: 1,
    squareFootage: 650,
    yearBuilt: 2020,
    
    monthlyRent: 2800,
    securityDeposit: 2800,
    propertyValue: 580000,
    monthlyExpenses: 400,
    
    photos: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'
    ],
    
    amenities: ['Air Conditioning', 'Gym', 'Furnished'],
    petPolicy: {
      allowed: false,
      deposit: 0,
      restrictions: ''
    },
    
    ownerId: 'owner-1',
    
    createdAt: new Date('2023-06-01'),
    updatedAt: new Date('2024-01-05'),
    
    featured: false,
    notes: 'New on market, needs minor touch-ups before showing.'
  },
  {
    id: '3',
    name: 'Suburban Family House',
    description: 'Spacious 4-bedroom house in quiet family neighborhood. Large backyard and 2-car garage.',
    type: PropertyType.HOUSE,
    status: PropertyStatus.MAINTENANCE,
    
    address: {
      street: '789 Oak Avenue',
      city: 'Austin',
      state: 'TX',
      zipCode: '73301',
      country: 'US'
    },
    
    bedrooms: 4,
    bathrooms: 3,
    squareFootage: 2400,
    yearBuilt: 2010,
    lotSize: 8000,
    
    monthlyRent: 2200,
    securityDeposit: 2200,
    propertyValue: 420000,
    monthlyExpenses: 300,
    
    photos: [
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800'
    ],
    
    amenities: ['Heating', 'Laundry', 'Parking', 'Garden', 'Fireplace'],
    petPolicy: {
      allowed: true,
      deposit: 300,
      restrictions: 'Fenced yard available'
    },
    
    ownerId: 'owner-1',
    
    createdAt: new Date('2022-09-15'),
    updatedAt: new Date('2024-01-12'),
    
    featured: false,
    notes: 'HVAC system being serviced. Available for rent February 1st.'
  }
];

const PropertyDemoPage = () => {
  const [currentView, setCurrentView] = useState('showcase');
  const [properties, setProperties] = useState(mockProperties);
  const [selectedProperty, setSelectedProperty] = useState(null);

  const handleViewProperty = (propertyId) => {
    const property = properties.find(p => p.id === propertyId);
    setSelectedProperty(property);
    setCurrentView('details');
  };

  const handleEditProperty = (propertyId) => {
    const property = properties.find(p => p.id === propertyId);
    setSelectedProperty(property);
    setCurrentView('edit');
  };

  const handleAddProperty = () => {
    setSelectedProperty(null);
    setCurrentView('create');
  };

  const handleDeleteProperty = (propertyId) => {
    setProperties(prev => prev.filter(p => p.id !== propertyId));
    if (selectedProperty?.id === propertyId) {
      setSelectedProperty(null);
      setCurrentView('list');
    }
  };

  const handleSubmitProperty = async (propertyData) => {
    if (selectedProperty) {
      // Edit existing
      setProperties(prev => 
        prev.map(p => p.id === selectedProperty.id ? { ...p, ...propertyData } : p)
      );
      setSelectedProperty({ ...selectedProperty, ...propertyData });
      setCurrentView('details');
    } else {
      // Create new
      const newProperty = {
        ...propertyData,
        id: Date.now().toString(),
        ownerId: 'demo-owner',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setProperties(prev => [newProperty, ...prev]);
      setSelectedProperty(newProperty);
      setCurrentView('details');
    }
  };

  const handleBackToList = () => {
    setSelectedProperty(null);
    setCurrentView('list');
  };

  const renderShowcase = () => (
    <FadeIn>
      <Container maxWidth="full" padding={true}>
        <div className="text-center mb-12">
          <HomeIcon className="mx-auto h-16 w-16 text-blue-600 dark:text-blue-400 mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Property Management System
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Complete CRUD operations for property management with photo upload, 
            responsive design, and comprehensive details views.
          </p>
        </div>

        <StaggerContainer>
          <ResponsiveGrid cols={{ xs: 1, md: 2, lg: 4 }} gap={6} className="mb-12">
            <StaggerItem>
              <Card className="text-center p-8 hover:shadow-lg transition-shadow">
                <PlusIcon className="mx-auto h-12 w-12 text-green-600 dark:text-green-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Create Properties
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Comprehensive form with validation, photo upload, and all property details
                </p>
                <Button variant="primary" onClick={handleAddProperty} className="w-full">
                  Try Create Form
                </Button>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card className="text-center p-8 hover:shadow-lg transition-shadow">
                <EyeIcon className="mx-auto h-12 w-12 text-blue-600 dark:text-blue-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  View Properties
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Grid and list views with search, filtering, and responsive design
                </p>
                <Button variant="primary" onClick={() => setCurrentView('list')} className="w-full">
                  View Property List
                </Button>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card className="text-center p-8 hover:shadow-lg transition-shadow">
                <PencilIcon className="mx-auto h-12 w-12 text-purple-600 dark:text-purple-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Property Details
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Comprehensive details with photo gallery, tabs, and management actions
                </p>
                <Button 
                  variant="primary" 
                  onClick={() => handleViewProperty('1')} 
                  className="w-full"
                >
                  View Sample Property
                </Button>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card className="text-center p-8 hover:shadow-lg transition-shadow">
                <HomeIcon className="mx-auto h-12 w-12 text-orange-600 dark:text-orange-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Full Integration
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Complete Firebase integration with real-time updates and photo storage
                </p>
                <Button 
                  variant="secondary" 
                  onClick={() => setCurrentView('list')} 
                  className="w-full"
                >
                  Explore System
                </Button>
              </Card>
            </StaggerItem>
          </ResponsiveGrid>

          <StaggerItem>
            <Card className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                System Features
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    CRUD Operations
                  </h3>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                    <li>✓ Create properties with comprehensive form</li>
                    <li>✓ Read properties with grid/list views</li>
                    <li>✓ Update properties with inline editing</li>
                    <li>✓ Delete properties with confirmation</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Photo Management
                  </h3>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                    <li>✓ Multiple photo upload with drag & drop</li>
                    <li>✓ Photo gallery with thumbnails</li>
                    <li>✓ Full-screen photo modal</li>
                    <li>✓ Firebase Storage integration</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    User Experience
                  </h3>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                    <li>✓ Responsive design for all devices</li>
                    <li>✓ Search and filtering capabilities</li>
                    <li>✓ Loading states and error handling</li>
                    <li>✓ Smooth animations and transitions</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Data Management
                  </h3>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                    <li>✓ Form validation and error messages</li>
                    <li>✓ Property status and type management</li>
                    <li>✓ Financial tracking and calculations</li>
                    <li>✓ Amenities and pet policy options</li>
                  </ul>
                </div>
              </div>
            </Card>
          </StaggerItem>
        </StaggerContainer>
      </Container>
    </FadeIn>
  );

  switch (currentView) {
    case 'create':
      return (
        <PropertyForm
          mode="create"
          onSubmit={handleSubmitProperty}
          onCancel={() => setCurrentView('showcase')}
        />
      );

    case 'edit':
      return (
        <PropertyForm
          property={selectedProperty}
          mode="edit"
          onSubmit={handleSubmitProperty}
          onCancel={handleBackToList}
        />
      );

    case 'details':
      return (
        <PropertyDetails
          property={selectedProperty}
          onBack={handleBackToList}
          onEdit={handleEditProperty}
          onDelete={handleDeleteProperty}
        />
      );

    case 'list':
      return (
        <PropertyList
          properties={properties}
          onAddProperty={handleAddProperty}
          onViewProperty={handleViewProperty}
          onEditProperty={handleEditProperty}
          onDeleteProperty={handleDeleteProperty}
          onRefresh={() => console.log('Refresh properties')}
        />
      );

    case 'showcase':
    default:
      return renderShowcase();
  }
};

export default PropertyDemoPage; 