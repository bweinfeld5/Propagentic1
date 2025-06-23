/**
 * PropertyDetails Component - PropAgentic
 * 
 * Comprehensive property details view with photo gallery and management actions
 */

import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  ShareIcon,
  PhotoIcon,
  MapPinIcon,
  HomeIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  UserIcon,
  DocumentIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  InformationCircleIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline';
import {
  Button,
  StatusPill,
  Card,
  Container,
  ResponsiveGrid,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel
} from '../../design-system';
import { FadeIn, SlideUp, StaggerContainer, StaggerItem, PageTransition } from '../../design-system';
import { useConfirmationDialog } from '../../design-system';
import {
  formatPropertyAddress,
  formatPropertyRent,
  getPropertyStatusColor,
  getPropertyTypeLabel
} from '../../models/Property';
import ContractorEstimateReadinessIndicator from './ContractorEstimateReadinessIndicator';
import PropertyDataCompletenessIndicator from './PropertyDataCompletenessIndicator';

const PropertyDetails = ({
  property,
  loading = false,
  onBack,
  onEdit,
  onDelete,
  onShare
}) => {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  
  const { showConfirmation } = useConfirmationDialog();

  // Handle improving contractor estimate data
  const handleImproveData = useCallback((property, tradeType = 'all') => {
    if (tradeType === 'request-estimates') {
      // Future: Open contractor request flow
      console.log('Opening contractor estimate request for:', property.id);
      return;
    }
    
    // Open property edit modal with focus on the specific trade
    onEdit(property.id, { focusSection: tradeType });
  }, [onEdit]);

  // Handle delete with confirmation
  const handleDelete = useCallback(async () => {
    const confirmed = await showConfirmation({
      type: 'delete',
      title: 'Delete Property',
      message: `Are you sure you want to delete "${property.name}"? This action cannot be undone.`,
      confirmText: 'Delete Property',
      requireTextVerification: true
    });

    if (confirmed) {
      onDelete(property.id);
    }
  }, [showConfirmation, property, onDelete]);

  // Photo gallery navigation
  const nextPhoto = useCallback(() => {
    if (property.photos && property.photos.length > 0) {
      setSelectedPhotoIndex((prev) => 
        prev === property.photos.length - 1 ? 0 : prev + 1
      );
    }
  }, [property.photos]);

  const prevPhoto = useCallback(() => {
    if (property.photos && property.photos.length > 0) {
      setSelectedPhotoIndex((prev) => 
        prev === 0 ? property.photos.length - 1 : prev - 1
      );
    }
  }, [property.photos]);

  const openPhotoModal = useCallback((index) => {
    setSelectedPhotoIndex(index);
    setShowPhotoModal(true);
  }, []);

  if (loading) {
    return (
      <Container maxWidth="full" padding={true}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
            <div className="space-y-6">
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </Container>
    );
  }

  if (!property) {
    return (
      <Container maxWidth="full" padding={true}>
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Property not found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The property you're looking for doesn't exist or has been removed.
          </p>
          <Button variant="primary" onClick={onBack}>
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Properties
          </Button>
        </div>
      </Container>
    );
  }

  const hasPhotos = property.photos && property.photos.length > 0;

  return (
    <PageTransition>
      <Container maxWidth="full" padding={true}>
        {/* Header */}
        <FadeIn>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={onBack}
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back
              </Button>
              
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {property.name}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <StatusPill 
                    color={getPropertyStatusColor(property.status)}
                    size="sm"
                  >
                    {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
                  </StatusPill>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {getPropertyTypeLabel(property.type)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onShare && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onShare(property)}
                >
                  <ShareIcon className="h-4 w-4 mr-2" />
                  Share
                </Button>
              )}
              
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onEdit(property.id)}
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit
              </Button>
              
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Photo Gallery */}
            <SlideUp delay={0.1}>
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Photos
                  </h2>
                  
                  {hasPhotos ? (
                    <div className="space-y-4">
                      {/* Main Photo */}
                      <div className="relative aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                        <img
                          src={property.photos[selectedPhotoIndex]}
                          alt={`${property.name} - Photo ${selectedPhotoIndex + 1}`}
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => openPhotoModal(selectedPhotoIndex)}
                        />
                        
                        {property.photos.length > 1 && (
                          <>
                            <button
                              onClick={prevPhoto}
                              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-opacity"
                            >
                              <ChevronLeftIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={nextPhoto}
                              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-opacity"
                            >
                              <ChevronRightIcon className="h-5 w-5" />
                            </button>
                          </>
                        )}
                        
                        <div className="absolute bottom-3 right-3 bg-black bg-opacity-60 text-white text-sm px-2 py-1 rounded">
                          {selectedPhotoIndex + 1} / {property.photos.length}
                        </div>
                      </div>
                      
                      {/* Thumbnails */}
                      {property.photos.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {property.photos.map((photo, index) => (
                            <button
                              key={index}
                              onClick={() => setSelectedPhotoIndex(index)}
                              className={`
                                relative flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden 
                                ${index === selectedPhotoIndex 
                                  ? 'ring-2 ring-blue-500' 
                                  : 'ring-1 ring-gray-200 dark:ring-gray-700'}
                              `}
                            >
                              <img
                                src={photo}
                                alt={`${property.name} thumbnail ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <PhotoIcon className="h-12 w-12 text-gray-400 mb-2" />
                      <p className="text-gray-500 dark:text-gray-400">No photos available</p>
                    </div>
                  )}
                </div>
              </Card>
            </SlideUp>
            
            {/* Tabs */}
            <SlideUp delay={0.2}>
              <Card>
                <Tabs>
                  <TabList>
                    <Tab>Details</Tab>
                    <Tab>Data Quality</Tab>
                    <Tab>Estimates</Tab>
                    <Tab>Financial</Tab>
                    <Tab>Documents</Tab>
                    <Tab>Notes</Tab>
                  </TabList>
                  <TabPanels>
                    {/* Details Tab */}
                    <TabPanel>
                      <div className="space-y-6 p-2">
                        {/* Basic Details */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                            Basic Information
                          </h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-start">
                              <MapPinIcon className="mt-1 h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
                              <div>
                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Address</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {formatPropertyAddress(property, true)}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-start">
                              <HomeIcon className="mt-1 h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
                              <div>
                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Property Type</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {getPropertyTypeLabel(property.type)}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-start">
                              <CalendarIcon className="mt-1 h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
                              <div>
                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Year Built</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {property.yearBuilt || 'Not specified'}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-start">
                              <UserIcon className="mt-1 h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
                              <div>
                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Tenant</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {property.tenantId ? 'Occupied' : 'Vacant'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Characteristics */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                            Property Characteristics
                          </h3>
                          
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-center">
                              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100 block">
                                {property.bedrooms ?? 0}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">Bedrooms</span>
                            </div>
                            
                            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-center">
                              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100 block">
                                {property.bathrooms ?? 0}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">Bathrooms</span>
                            </div>
                            
                            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-center">
                              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100 block">
                                {property.squareFootage 
                                  ? `${property.squareFootage.toLocaleString()}`
                                  : 'N/A'}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">Square Feet</span>
                            </div>
                            
                            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-center">
                              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100 block">
                                {property.lotSize 
                                  ? `${property.lotSize.toLocaleString()}`
                                  : 'N/A'}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">Lot Size (sq ft)</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Description */}
                        {property.description && (
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                              Description
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
                              {property.description}
                            </p>
                          </div>
                        )}
                        
                        {/* Amenities */}
                        {property.amenities && property.amenities.length > 0 && (
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                              Amenities
                            </h3>
                            <ul className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {property.amenities.map((amenity, index) => (
                                <li key={index} className="flex items-center">
                                  <CheckBadgeIcon className="h-4 w-4 text-green-500 mr-2" />
                                  <span className="text-sm text-gray-600 dark:text-gray-400">{amenity}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {/* Pet Policy */}
                        {property.petPolicy && (
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                              Pet Policy
                            </h3>
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                              <div className="flex items-center mb-2">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">
                                  Pets Allowed:
                                </span>
                                <span className={`text-sm ${
                                  property.petPolicy.allowed 
                                    ? 'text-green-600 dark:text-green-400' 
                                    : 'text-red-600 dark:text-red-400'
                                }`}>
                                  {property.petPolicy.allowed ? 'Yes' : 'No'}
                                </span>
                              </div>
                              
                              {property.petPolicy.allowed && (
                                <>
                                  {property.petPolicy.deposit > 0 && (
                                    <div className="flex items-center mb-2">
                                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">
                                        Pet Deposit:
                                      </span>
                                      <span className="text-sm text-gray-600 dark:text-gray-400">
                                        ${property.petPolicy.deposit.toLocaleString()}
                                      </span>
                                    </div>
                                  )}
                                  
                                  {property.petPolicy.restrictions && (
                                    <div>
                                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                                        Restrictions:
                                      </span>
                                      <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {property.petPolicy.restrictions}
                                      </p>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </TabPanel>
                    
                    {/* Data Quality Tab */}
                    <TabPanel>
                      <div className="p-2">
                        <PropertyDataCompletenessIndicator
                          property={property}
                          onImproveData={() => onEdit?.(property.id)}
                          compact={false}
                          showActions={true}
                        />
                      </div>
                    </TabPanel>
                    
                    {/* Contractor Estimates Tab */}
                    <TabPanel>
                      <div className="p-2">
                        <ContractorEstimateReadinessIndicator
                          property={property}
                          onImproveData={handleImproveData}
                          compact={false}
                          showActions={true}
                        />
                      </div>
                    </TabPanel>
                    
                    {/* Financial Tab */}
                    <TabPanel>
                      <div className="space-y-6 p-2">
                        {/* Financial Overview */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                            Financial Overview
                          </h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Rent */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                              <div className="flex items-center mb-2">
                                <CurrencyDollarIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                                <h4 className="text-md font-medium text-gray-800 dark:text-gray-200">
                                  Monthly Rent
                                </h4>
                              </div>
                              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                ${property.monthlyRent?.toLocaleString() || '0'}
                              </div>
                              {property.monthlyRent && property.squareFootage && (
                                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                  ${(property.monthlyRent / property.squareFootage).toFixed(2)}/sq ft
                                </div>
                              )}
                            </div>
                            
                            {/* Security Deposit */}
                            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                              <div className="flex items-center mb-2">
                                <InformationCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                                <h4 className="text-md font-medium text-gray-800 dark:text-gray-200">
                                  Security Deposit
                                </h4>
                              </div>
                              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                ${property.securityDeposit?.toLocaleString() || '0'}
                              </div>
                              {property.securityDeposit && property.monthlyRent && (
                                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                  {(property.securityDeposit / property.monthlyRent).toFixed(1)}x monthly rent
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Additional Financial Details */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                            Additional Details
                          </h3>
                          
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                              <tbody>
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">Property Value</td>
                                  <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-gray-100">
                                    ${property.propertyValue?.toLocaleString() || 'N/A'}
                                  </td>
                                </tr>
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">Monthly Expenses</td>
                                  <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-gray-100">
                                    ${property.monthlyExpenses?.toLocaleString() || 'N/A'}
                                  </td>
                                </tr>
                                {property.monthlyRent && property.monthlyExpenses && (
                                  <tr className="border-b border-gray-200 dark:border-gray-700">
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">Monthly Net Income</td>
                                    <td className="px-4 py-3 text-right font-medium text-green-600 dark:text-green-400">
                                      ${(property.monthlyRent - property.monthlyExpenses).toLocaleString()}
                                    </td>
                                  </tr>
                                )}
                                {property.propertyValue && property.monthlyRent && (
                                  <tr className="border-b border-gray-200 dark:border-gray-700">
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">Annual Gross Yield</td>
                                    <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-gray-100">
                                      {((property.monthlyRent * 12 / property.propertyValue) * 100).toFixed(2)}%
                                    </td>
                                  </tr>
                                )}
                                {property.propertyValue && property.monthlyRent && property.monthlyExpenses && (
                                  <tr>
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">Annual Net Yield</td>
                                    <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-gray-100">
                                      {(((property.monthlyRent - property.monthlyExpenses) * 12 / property.propertyValue) * 100).toFixed(2)}%
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </TabPanel>
                    
                    {/* Documents Tab */}
                    <TabPanel>
                      <div className="p-2">
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                          <DocumentIcon className="h-12 w-12 text-gray-400 mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                            Document Management
                          </h3>
                          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
                            Store and manage important documents related to this property
                            such as lease agreements, inspection reports, and insurance policies.
                          </p>
                          <Button variant="primary" disabled>
                            Document Management Coming Soon
                          </Button>
                        </div>
                      </div>
                    </TabPanel>
                    
                    {/* Notes Tab */}
                    <TabPanel>
                      <div className="p-2">
                        {property.notes ? (
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                              Property Notes
                            </h3>
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
                                {property.notes}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-10 text-center">
                            <DocumentIcon className="h-12 w-12 text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                              No Notes Yet
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
                              Add notes to keep track of important information about this property.
                            </p>
                            <Button variant="secondary" onClick={() => onEdit(property.id)}>
                              Add Notes
                            </Button>
                          </div>
                        )}
                      </div>
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </Card>
            </SlideUp>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Data Completeness Indicator */}
            <SlideUp delay={0.3}>
              <PropertyDataCompletenessIndicator
                property={property}
                onImproveData={() => onEdit?.(property.id)}
                compact={true}
                showActions={true}
              />
            </SlideUp>
            
            {/* Contractor Estimate Readiness */}
            <SlideUp delay={0.4}>
              <ContractorEstimateReadinessIndicator
                property={property}
                onImproveData={handleImproveData}
                compact={true}
                showActions={true}
              />
            </SlideUp>

            {/* Quick Info */}
            <SlideUp delay={0.4}>
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Quick Info
                  </h2>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Address</div>
                      <div className="text-gray-800 dark:text-gray-200">
                        {formatPropertyAddress(property, true)}
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Monthly Rent</div>
                      <div className="text-xl font-semibold text-green-600 dark:text-green-400">
                        {formatPropertyRent(property)}
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Property Type</div>
                      <div className="text-gray-800 dark:text-gray-200">
                        {getPropertyTypeLabel(property.type)}
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Size</div>
                      <div className="text-gray-800 dark:text-gray-200">
                        {property.bedrooms} bed • {property.bathrooms} bath
                        {property.squareFootage && (
                          <> • {property.squareFootage.toLocaleString()} sq ft</>
                        )}
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Status</div>
                      <StatusPill 
                        color={getPropertyStatusColor(property.status)}
                      >
                        {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
                      </StatusPill>
                    </div>
                  </div>
                </div>
              </Card>
            </SlideUp>
            
            {/* Map Placeholder */}
            <SlideUp delay={0.5}>
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Location
                  </h2>
                  
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden h-64 flex items-center justify-center">
                    <div className="text-center p-4">
                      <MapPinIcon className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 dark:text-gray-400">
                        Map view coming soon
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                    {formatPropertyAddress(property, true)}
                  </div>
                </div>
              </Card>
            </SlideUp>
          </div>
        </div>
      </Container>
      
      {/* Photo Modal */}
      {showPhotoModal && hasPhotos && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
          <div className="relative w-full max-w-6xl">
            {/* Close Button */}
            <button
              onClick={() => setShowPhotoModal(false)}
              className="absolute right-4 top-4 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-opacity z-10"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
            
            {/* Image */}
            <div className="relative">
              <img
                src={property.photos[selectedPhotoIndex]}
                alt={`${property.name} - Photo ${selectedPhotoIndex + 1}`}
                className="w-full h-auto max-h-[80vh] object-contain"
              />
              
              {/* Navigation */}
              {property.photos.length > 1 && (
                <>
                  <button
                    onClick={prevPhoto}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-opacity"
                  >
                    <ChevronLeftIcon className="h-6 w-6" />
                  </button>
                  <button
                    onClick={nextPhoto}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-opacity"
                  >
                    <ChevronRightIcon className="h-6 w-6" />
                  </button>
                  
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black bg-opacity-60 text-white text-sm px-3 py-1.5 rounded-full">
                    {selectedPhotoIndex + 1} / {property.photos.length}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
};

PropertyDetails.propTypes = {
  property: PropTypes.object,
  loading: PropTypes.bool,
  onBack: PropTypes.func.isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onShare: PropTypes.func
};

export default PropertyDetails; 