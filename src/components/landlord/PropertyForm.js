/**
 * PropertyForm Component - PropAgentic
 * 
 * Comprehensive form for creating and editing properties
 */

import React, { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  PhotoIcon, 
  XMarkIcon, 
  PlusIcon,
  HomeIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import {
  Button,
  Input,
  TextArea,
  Select,
  FileUpload,
  StatusPill,
  CheckboxGroup,
  Container,
  Card
} from '../../design-system';
import { FadeIn, SlideUp, StaggerContainer, StaggerItem } from '../../design-system';
import { 
  PropertyType, 
  PropertyStatus, 
  validateProperty,
  getPropertyTypeLabel,
  createDefaultProperty
} from '../../models/Property';
import propertyService from '../../services/propertyService';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const AMENITIES_OPTIONS = [
  'Air Conditioning',
  'Heating',
  'Laundry',
  'Dishwasher',
  'Parking',
  'Balcony',
  'Pool',
  'Gym',
  'Pet Friendly',
  'Furnished',
  'Hardwood Floors',
  'Fireplace',
  'Garden',
  'Storage'
];

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

const PropertyForm = ({ 
  property = null, 
  onSubmit, 
  onCancel,
  isLoading = false,
  mode = 'create' // 'create' or 'edit'
}) => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState(() => 
    property || createDefaultProperty(currentUser?.uid)
  );
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  // Reset form when property prop changes
  useEffect(() => {
    if (property) {
      setFormData(property);
    } else {
      setFormData(createDefaultProperty(currentUser?.uid));
    }
    setErrors({});
  }, [property, currentUser?.uid]);

  // Handle form field changes
  const handleChange = useCallback((field, value) => {
    setFormData(prev => {
      // Handle nested fields like address.street
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        return {
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        };
      }
      
      return {
        ...prev,
        [field]: value
      };
    });

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  // Handle photo upload
  const handlePhotoUpload = useCallback(async (files) => {
    if (!files.length || !formData.id) return;

    setUploadingPhotos(true);
    try {
      const uploadedPhotos = await propertyService.uploadPropertyPhotos(
        formData.id, 
        Array.from(files)
      );
      
      const photoUrls = uploadedPhotos.map(photo => photo.url);
      const updatedPhotos = [...(formData.photos || []), ...photoUrls];
      
      await propertyService.addPhotosToProperty(formData.id, photoUrls);
      setFormData(prev => ({ ...prev, photos: updatedPhotos }));
      
    } catch (error) {
      console.error('Error uploading photos:', error);
    } finally {
      setUploadingPhotos(false);
    }
  }, [formData.id, formData.photos]);

  // Remove photo
  const handleRemovePhoto = useCallback(async (photoUrl) => {
    if (!formData.id) {
      // For new properties, just remove from local state
      setFormData(prev => ({
        ...prev,
        photos: prev.photos.filter(url => url !== photoUrl)
      }));
      return;
    }

    try {
      const updatedPhotos = await propertyService.removePhotoFromProperty(
        formData.id, 
        photoUrl
      );
      setFormData(prev => ({ ...prev, photos: updatedPhotos }));
    } catch (error) {
      console.error('Error removing photo:', error);
    }
  }, [formData.id]);

  // Validate and submit form
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = validateProperty(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to save property');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, onSubmit]);

  const propertyTypeOptions = Object.values(PropertyType).map(type => ({
    value: type,
    label: getPropertyTypeLabel(type)
  }));

  const propertyStatusOptions = Object.values(PropertyStatus).map(status => ({
    value: status,
    label: status.charAt(0).toUpperCase() + status.slice(1)
  }));

  const stateOptions = US_STATES.map(state => ({
    value: state,
    label: state
  }));

  return (
    <FadeIn>
      <Container maxWidth="4xl" padding={true}>
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Header */}
          <div className="text-center">
            <HomeIcon className="mx-auto h-12 w-12 text-blue-600 dark:text-blue-400" />
            <h1 className="mt-4 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {mode === 'create' ? 'Add New Property' : 'Edit Property'}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {mode === 'create' 
                ? 'Fill in the details below to add a new property to your portfolio'
                : 'Update your property information'
              }
            </p>
          </div>

          <StaggerContainer>
            {/* Basic Information */}
            <StaggerItem>
              <Card>
                <div className="flex items-center mb-6">
                  <InformationCircleIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Basic Information
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <Input
                      label="Property Name"
                      value={formData.name}
                      onChange={(value) => handleChange('name', value)}
                      error={errors.name}
                      placeholder="e.g., Sunset Apartments Unit 3B"
                      required
                    />
                  </div>

                  <Select
                    label="Property Type"
                    value={formData.type}
                    onChange={(value) => handleChange('type', value)}
                    options={propertyTypeOptions}
                    required
                  />

                  <Select
                    label="Status"
                    value={formData.status}
                    onChange={(value) => handleChange('status', value)}
                    options={propertyStatusOptions}
                    required
                  />

                  <Input
                    label="Bedrooms"
                    type="number"
                    value={formData.bedrooms}
                    onChange={(value) => handleChange('bedrooms', parseInt(value) || 0)}
                    min="0"
                    step="1"
                  />

                  <Input
                    label="Bathrooms"
                    type="number"
                    value={formData.bathrooms}
                    onChange={(value) => handleChange('bathrooms', parseFloat(value) || 0)}
                    min="0"
                    step="0.5"
                  />

                  <Input
                    label="Square Footage"
                    type="number"
                    value={formData.squareFootage || ''}
                    onChange={(value) => handleChange('squareFootage', parseInt(value) || null)}
                    placeholder="Optional"
                  />

                  <Input
                    label="Year Built"
                    type="number"
                    value={formData.yearBuilt || ''}
                    onChange={(value) => handleChange('yearBuilt', parseInt(value) || null)}
                    placeholder="Optional"
                    min="1800"
                    max={new Date().getFullYear()}
                  />

                  <div className="md:col-span-2">
                    <TextArea
                      label="Description"
                      value={formData.description}
                      onChange={(value) => handleChange('description', value)}
                      placeholder="Describe the property features, neighborhood, etc."
                      rows={4}
                    />
                  </div>
                </div>
              </Card>
            </StaggerItem>

            {/* Address */}
            <StaggerItem>
              <Card>
                <div className="flex items-center mb-6">
                  <MapPinIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Address
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <Input
                      label="Street Address"
                      value={formData.address.street}
                      onChange={(value) => handleChange('address.street', value)}
                      error={errors['address.street']}
                      placeholder="123 Main Street"
                      required
                    />
                  </div>

                  <Input
                    label="City"
                    value={formData.address.city}
                    onChange={(value) => handleChange('address.city', value)}
                    error={errors['address.city']}
                    required
                  />

                  <Select
                    label="State"
                    value={formData.address.state}
                    onChange={(value) => handleChange('address.state', value)}
                    options={stateOptions}
                    error={errors['address.state']}
                    required
                  />

                  <Input
                    label="ZIP Code"
                    value={formData.address.zipCode}
                    onChange={(value) => handleChange('address.zipCode', value)}
                    error={errors['address.zipCode']}
                    placeholder="12345"
                    required
                  />

                  <Input
                    label="Country"
                    value={formData.address.country}
                    onChange={(value) => handleChange('address.country', value)}
                    disabled
                  />
                </div>
              </Card>
            </StaggerItem>

            {/* Financial Information */}
            <StaggerItem>
              <Card>
                <div className="flex items-center mb-6">
                  <CurrencyDollarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Financial Information
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Monthly Rent"
                    type="number"
                    value={formData.monthlyRent}
                    onChange={(value) => handleChange('monthlyRent', parseFloat(value) || 0)}
                    error={errors.monthlyRent}
                    min="0"
                    step="0.01"
                    prefix="$"
                  />

                  <Input
                    label="Security Deposit"
                    type="number"
                    value={formData.securityDeposit}
                    onChange={(value) => handleChange('securityDeposit', parseFloat(value) || 0)}
                    min="0"
                    step="0.01"
                    prefix="$"
                  />

                  <Input
                    label="Property Value"
                    type="number"
                    value={formData.propertyValue}
                    onChange={(value) => handleChange('propertyValue', parseFloat(value) || 0)}
                    min="0"
                    step="0.01"
                    prefix="$"
                    placeholder="Estimated market value"
                  />

                  <Input
                    label="Monthly Expenses"
                    type="number"
                    value={formData.monthlyExpenses}
                    onChange={(value) => handleChange('monthlyExpenses', parseFloat(value) || 0)}
                    min="0"
                    step="0.01"
                    prefix="$"
                    placeholder="Insurance, taxes, etc."
                  />
                </div>
              </Card>
            </StaggerItem>

            {/* Amenities */}
            <StaggerItem>
              <Card>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                  Amenities
                </h2>

                <CheckboxGroup
                  options={AMENITIES_OPTIONS.map(amenity => ({
                    value: amenity,
                    label: amenity
                  }))}
                  value={formData.amenities}
                  onChange={(value) => handleChange('amenities', value)}
                  className="grid grid-cols-2 md:grid-cols-3 gap-4"
                />
              </Card>
            </StaggerItem>

            {/* Pet Policy */}
            <StaggerItem>
              <Card>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                  Pet Policy
                </h2>

                <div className="space-y-4">
                  <CheckboxGroup
                    options={[{
                      value: 'pets_allowed',
                      label: 'Pets Allowed'
                    }]}
                    value={formData.petPolicy.allowed ? ['pets_allowed'] : []}
                    onChange={(value) => handleChange('petPolicy', {
                      ...formData.petPolicy,
                      allowed: value.includes('pets_allowed')
                    })}
                  />

                  {formData.petPolicy.allowed && (
                    <SlideUp>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                        <Input
                          label="Pet Deposit"
                          type="number"
                          value={formData.petPolicy.deposit}
                          onChange={(value) => handleChange('petPolicy', {
                            ...formData.petPolicy,
                            deposit: parseFloat(value) || 0
                          })}
                          min="0"
                          step="0.01"
                          prefix="$"
                        />

                        <div className="md:col-span-2">
                          <TextArea
                            label="Pet Restrictions"
                            value={formData.petPolicy.restrictions}
                            onChange={(value) => handleChange('petPolicy', {
                              ...formData.petPolicy,
                              restrictions: value
                            })}
                            placeholder="e.g., No aggressive breeds, weight limit 50lbs"
                            rows={3}
                          />
                        </div>
                      </div>
                    </SlideUp>
                  )}
                </div>
              </Card>
            </StaggerItem>

            {/* Photos */}
            <StaggerItem>
              <Card>
                <div className="flex items-center mb-6">
                  <PhotoIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Photos
                  </h2>
                </div>

                {/* Photo Grid */}
                {formData.photos && formData.photos.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {formData.photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={photo}
                          alt={`Property photo ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(photo)}
                          className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <FileUpload
                  accept="image/*"
                  multiple
                  onUpload={handlePhotoUpload}
                  loading={uploadingPhotos}
                  disabled={!formData.id && mode === 'edit'}
                  maxSize={5 * 1024 * 1024} // 5MB
                >
                  <div className="text-center py-8">
                    <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      {uploadingPhotos ? 'Uploading...' : 'Click to upload photos or drag and drop'}
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF up to 5MB each
                    </p>
                  </div>
                </FileUpload>

                {!formData.id && mode === 'edit' && (
                  <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                    Save the property first to upload photos
                  </p>
                )}
              </Card>
            </StaggerItem>

            {/* Additional Notes */}
            <StaggerItem>
              <Card>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                  Additional Notes
                </h2>

                <TextArea
                  label="Notes"
                  value={formData.notes}
                  onChange={(value) => handleChange('notes', value)}
                  placeholder="Any additional information about the property..."
                  rows={4}
                />
              </Card>
            </StaggerItem>
          </StaggerContainer>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting || isLoading}
              disabled={uploadingPhotos}
              className="sm:order-2"
            >
              {mode === 'create' ? 'Create Property' : 'Save Changes'}
            </Button>
            
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={isSubmitting || isLoading || uploadingPhotos}
              className="sm:order-1"
            >
              Cancel
            </Button>

            {uploadingPhotos && (
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 sm:order-3">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Uploading photos...
              </div>
            )}
          </div>
        </form>
      </Container>
    </FadeIn>
  );
};

PropertyForm.propTypes = {
  property: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  mode: PropTypes.oneOf(['create', 'edit'])
};

export default PropertyForm; 