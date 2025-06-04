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

                      {/* Photo Thumbnails */}
                      {property.photos.length > 1 && (
                        <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                          {property.photos.map((photo, index) => (
                            <button
                              key={index}
                              onClick={() => setSelectedPhotoIndex(index)}
                              className={`aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden border-2 transition-colors ${
                                index === selectedPhotoIndex
                                  ? 'border-blue-500'
                                  : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                              }`}
                            >
                              <img
                                src={photo}
                                alt={`Thumbnail ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <PhotoIcon className="mx-auto h-16 w-16 text-gray-400 mb-2" />
                        <p className="text-gray-500 dark:text-gray-400">No photos uploaded</p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </SlideUp>

            {/* Property Details Tabs */}
            <SlideUp delay={0.2}>
              <Card>
                <div className="p-6">
                  <Tabs>
                    <TabList>
                      <Tab>Details</Tab>
                      <Tab>Financial</Tab>
                      <Tab>Amenities</Tab>
                      <Tab>Documents</Tab>
                    </TabList>
                    
                    <TabPanels>
                      {/* Details Tab */}
                      <TabPanel>
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
                              Property Information
                            </h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Type:</span>
                                <span className="ml-2 text-gray-900 dark:text-gray-100">
                                  {getPropertyTypeLabel(property.type)}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Status:</span>
                                <span className="ml-2">
                                  <StatusPill 
                                    color={getPropertyStatusColor(property.status)}
                                    size="xs"
                                  >
                                    {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
                                  </StatusPill>
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Bedrooms:</span>
                                <span className="ml-2 text-gray-900 dark:text-gray-100">
                                  {property.bedrooms}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Bathrooms:</span>
                                <span className="ml-2 text-gray-900 dark:text-gray-100">
                                  {property.bathrooms}
                                </span>
                              </div>
                              {property.squareFootage && (
                                <div>
                                  <span className="text-gray-600 dark:text-gray-400">Square Footage:</span>
                                  <span className="ml-2 text-gray-900 dark:text-gray-100">
                                    {property.squareFootage.toLocaleString()} sq ft
                                  </span>
                                </div>
                              )}
                              {property.yearBuilt && (
                                <div>
                                  <span className="text-gray-600 dark:text-gray-400">Year Built:</span>
                                  <span className="ml-2 text-gray-900 dark:text-gray-100">
                                    {property.yearBuilt}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {property.description && (
                            <div>
                              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
                                Description
                              </h3>
                              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                {property.description}
                              </p>
                            </div>
                          )}

                          <div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
                              Address
                            </h3>
                            <div className="flex items-start gap-2">
                              <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-gray-900 dark:text-gray-100">
                                  {property.address.street}
                                </p>
                                <p className="text-gray-600 dark:text-gray-400">
                                  {property.address.city}, {property.address.state} {property.address.zipCode}
                                </p>
                                {property.address.country !== 'US' && (
                                  <p className="text-gray-600 dark:text-gray-400">
                                    {property.address.country}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          {property.petPolicy && (
                            <div>
                              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
                                Pet Policy
                              </h3>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  {property.petPolicy.allowed ? (
                                    <CheckBadgeIcon className="h-5 w-5 text-green-500" />
                                  ) : (
                                    <XMarkIcon className="h-5 w-5 text-red-500" />
                                  )}
                                  <span className="text-gray-900 dark:text-gray-100">
                                    Pets {property.petPolicy.allowed ? 'Allowed' : 'Not Allowed'}
                                  </span>
                                </div>
                                {property.petPolicy.allowed && property.petPolicy.deposit > 0 && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 ml-7">
                                    Pet deposit: ${property.petPolicy.deposit.toLocaleString()}
                                  </p>
                                )}
                                {property.petPolicy.restrictions && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 ml-7">
                                    {property.petPolicy.restrictions}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {property.notes && (
                            <div>
                              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
                                Additional Notes
                              </h3>
                              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                {property.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </TabPanel>

                      {/* Financial Tab */}
                      <TabPanel>
                        <div className="space-y-6">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                            Financial Information
                          </h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <CurrencyDollarIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                                  Monthly Rent
                                </span>
                              </div>
                              <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                                {formatPropertyRent(property)}
                              </p>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <CurrencyDollarIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                  Security Deposit
                                </span>
                              </div>
                              <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                                ${property.securityDeposit?.toLocaleString() || '0'}
                              </p>
                            </div>

                            {property.propertyValue > 0 && (
                              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <HomeIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                  <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                                    Property Value
                                  </span>
                                </div>
                                <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                                  ${property.propertyValue.toLocaleString()}
                                </p>
                              </div>
                            )}

                            {property.monthlyExpenses > 0 && (
                              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <CurrencyDollarIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                  <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                                    Monthly Expenses
                                  </span>
                                </div>
                                <p className="text-2xl font-bold text-orange-800 dark:text-orange-200">
                                  ${property.monthlyExpenses.toLocaleString()}
                                </p>
                              </div>
                            )}
                          </div>

                          {property.monthlyRent > 0 && property.monthlyExpenses > 0 && (
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Net Monthly Income
                              </h4>
                              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                ${(property.monthlyRent - property.monthlyExpenses).toLocaleString()}
                              </p>
                            </div>
                          )}
                        </div>
                      </TabPanel>

                      {/* Amenities Tab */}
                      <TabPanel>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                            Amenities
                          </h3>
                          
                          {property.amenities && property.amenities.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {property.amenities.map((amenity) => (
                                <div 
                                  key={amenity}
                                  className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                >
                                  <CheckBadgeIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                                  <span className="text-gray-900 dark:text-gray-100 text-sm">
                                    {amenity}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <InformationCircleIcon className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                              <p className="text-gray-500 dark:text-gray-400">
                                No amenities listed
                              </p>
                            </div>
                          )}
                        </div>
                      </TabPanel>

                      {/* Documents Tab */}
                      <TabPanel>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                            Documents
                          </h3>
                          
                          {property.documents && property.documents.length > 0 ? (
                            <div className="space-y-3">
                              {property.documents.map((doc, index) => (
                                <div 
                                  key={index}
                                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                >
                                  <DocumentIcon className="h-6 w-6 text-gray-400 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-gray-900 dark:text-gray-100 text-sm font-medium truncate">
                                      Document {index + 1}
                                    </p>
                                  </div>
                                  <Button variant="secondary" size="sm">
                                    View
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <DocumentIcon className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                              <p className="text-gray-500 dark:text-gray-400">
                                No documents uploaded
                              </p>
                            </div>
                          )}
                        </div>
                      </TabPanel>
                    </TabPanels>
                  </Tabs>
                </div>
              </Card>
            </SlideUp>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Property Summary */}
            <SlideUp delay={0.3}>
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Property Summary
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Monthly Rent</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {formatPropertyRent(property)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Bedrooms</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {property.bedrooms}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Bathrooms</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {property.bathrooms}
                      </span>
                    </div>
                    
                    {property.squareFootage && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Square Feet</span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {property.squareFootage.toLocaleString()}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Status</span>
                      <StatusPill 
                        color={getPropertyStatusColor(property.status)}
                        size="xs"
                      >
                        {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
                      </StatusPill>
                    </div>
                  </div>
                </div>
              </Card>
            </SlideUp>

            {/* Management Actions */}
            <SlideUp delay={0.4}>
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Management
                  </h3>
                  
                  <div className="space-y-3">
                    <Button variant="primary" className="w-full justify-center">
                      <UserIcon className="h-4 w-4 mr-2" />
                      Manage Tenant
                    </Button>
                    
                    <Button variant="secondary" className="w-full justify-center">
                      <DocumentIcon className="h-4 w-4 mr-2" />
                      Lease Agreement
                    </Button>
                    
                    <Button variant="secondary" className="w-full justify-center">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Maintenance History
                    </Button>
                  </div>
                </div>
              </Card>
            </SlideUp>

            {/* Property Dates */}
            <SlideUp delay={0.5}>
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Important Dates
                  </h3>
                  
                  <div className="space-y-3 text-sm">
                    {property.createdAt && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Added:</span>
                        <p className="text-gray-900 dark:text-gray-100">
                          {property.createdAt.toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    
                    {property.updatedAt && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Last Updated:</span>
                        <p className="text-gray-900 dark:text-gray-100">
                          {property.updatedAt.toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </SlideUp>
          </div>
        </div>

        {/* Photo Modal */}
        {showPhotoModal && hasPhotos && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
            <div className="relative max-w-7xl max-h-full">
              <button
                onClick={() => setShowPhotoModal(false)}
                className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
              >
                <XMarkIcon className="h-8 w-8" />
              </button>
              
              <img
                src={property.photos[selectedPhotoIndex]}
                alt={`${property.name} - Photo ${selectedPhotoIndex + 1}`}
                className="max-w-full max-h-full object-contain"
              />
              
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
                </>
              )}
              
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
                {selectedPhotoIndex + 1} of {property.photos.length}
              </div>
            </div>
          </div>
        )}
      </Container>
    </PageTransition>
  );
};

PropertyDetails.propTypes = {
  property: PropTypes.object,
  loading: PropTypes.bool,
  onBack: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onShare: PropTypes.func
};

export default PropertyDetails; 