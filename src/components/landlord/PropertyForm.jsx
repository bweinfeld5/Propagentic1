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
import RichTextEditor from '../forms/RichTextEditor';
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
                    error={errors.type}
                    required
                  />

                  <Select
                    label="Status"
                    value={formData.status}
                    onChange={(value) => handleChange('status', value)}
                    options={propertyStatusOptions}
                    error={errors.status}
                    required
                  />
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
                      value={formData.address?.street}
                      onChange={(value) => handleChange('address.street', value)}
                      error={errors['address.street']}
                      placeholder="123 Main St"
                      required
                    />
                  </div>

                  <Input
                    label="City"
                    value={formData.address?.city}
                    onChange={(value) => handleChange('address.city', value)}
                    error={errors['address.city']}
                    required
                  />
                  
                  <Select
                    label="State"
                    value={formData.address?.state}
                    onChange={(value) => handleChange('address.state', value)}
                    options={stateOptions}
                    error={errors['address.state']}
                    required
                  />
                  
                  <Input
                    label="ZIP Code"
                    value={formData.address?.zip}
                    onChange={(value) => handleChange('address.zip', value)}
                    error={errors['address.zip']}
                    required
                  />
                </div>
              </Card>
            </StaggerItem>

            {/* Financials */}
            <StaggerItem>
              <Card>
                <div className="flex items-center mb-6">
                  <CurrencyDollarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Financials
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Rent Amount"
                    type="number"
                    value={formData.rentAmount}
                    onChange={(value) => handleChange('rentAmount', parseFloat(value))}
                    error={errors.rentAmount}
                    placeholder="1500"
                    required
                    prefix="$"
                  />

                  <Input
                    label="Deposit"
                    type="number"
                    value={formData.deposit}
                    onChange={(value) => handleChange('deposit', parseFloat(value))}
                    error={errors.deposit}
                    prefix="$"
                  />
                </div>
              </Card>
            </StaggerItem>
            
            {/* Details */}
            <StaggerItem>
              <Card>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                  Details
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Input
                    label="Bedrooms"
                    type="number"
                    value={formData.bedrooms}
                    onChange={(value) => handleChange('bedrooms', parseInt(value, 10))}
                    error={errors.bedrooms}
                    min="0"
                  />
                  
                  <Input
                    label="Bathrooms"
                    type="number"
                    value={formData.bathrooms}
                    onChange={(value) => handleChange('bathrooms', parseInt(value, 10))}
                    error={errors.bathrooms}
                    min="0"
                  />

                  <Input
                    label="Square Footage"
                    type="number"
                    value={formData.sqft}
                    onChange={(value) => handleChange('sqft', parseInt(value, 10))}
                    error={errors.sqft}
                    min="0"
                    suffix="sqft"
                  />
                </div>

                <div className="mt-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Description
                    </label>
                    <RichTextEditor
                      value={formData.description}
                      onChange={(content, stats) => {
                        handleChange('description', content);
                      }}
                      placeholder="Describe your property in detail - highlight key features, amenities, location benefits, and any unique selling points..."
                      maxLength={3000}
                      allowImages={true}
                      allowLinks={true}
                      allowLists={true}
                      height="250px"
                      toolbar="default"
                      error={errors.description}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Create an engaging property description with rich formatting, images, and lists to attract potential tenants.
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <CheckboxGroup
                    label="Amenities"
                    options={AMENITIES_OPTIONS}
                    selected={formData.amenities || []}
                    onChange={(selected) => handleChange('amenities', selected)}
                    error={errors.amenities}
                  />
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
                
                <FileUpload
                  onUpload={handlePhotoUpload}
                  isUploading={uploadingPhotos}
                  label="Upload property photos"
                  helpText="PNG, JPG, GIF up to 10MB"
                />

                {formData.photos && formData.photos.length > 0 && (
                  <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {formData.photos.map((photoUrl, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={photoUrl} 
                          alt={`Property photo ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(photoUrl)}
                            className="p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </StaggerItem>

          </StaggerContainer>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-8 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={isSubmitting || isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting || isLoading}
            >
              {mode === 'create' ? 'Create Property' : 'Save Changes'}
            </Button>
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

// Default export
export default PropertyForm;

// Prop types for individual components if they were separate files
Input.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  type: PropTypes.string,
  prefix: PropTypes.string,
  suffix: PropTypes.string,
  min: PropTypes.string
};

Select.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired
  })).isRequired,
  error: PropTypes.string,
  required: PropTypes.bool
};

TextArea.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string,
  rows: PropTypes.string,
  placeholder: PropTypes.string
};

CheckboxGroup.propTypes = {
  label: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(PropTypes.string).isRequired,
  selected: PropTypes.arrayOf(PropTypes.string).isRequired,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string
};

FileUpload.propTypes = {
  onUpload: PropTypes.func.isRequired,
  isUploading: PropTypes.bool,
  label: PropTypes.string,
  helpText: PropTypes.string
}; 