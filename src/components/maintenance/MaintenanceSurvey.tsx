import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { db, storage } from '../../firebase/config';
import { doc, setDoc, collection, serverTimestamp, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import surveySchema from '../../schemas/surveySchema.json';
import dataService from '../../services/dataService';

// Define TypeScript interfaces for the survey schema
interface CategoryEnum {
  type: string;
  enum: string[];
}

interface SubcategoryProperties {
  [key: string]: CategoryEnum;
}

interface LocationRoomEnum {
  type: string;
  enum: string[];
}

interface SurveySchema {
  $schema: string;
  type: string;
  required: string[];
  properties: {
    category: CategoryEnum;
    subcategory: {
      type: string;
      properties: SubcategoryProperties;
    };
    location: {
      type: string;
      required: string[];
      properties: {
        room: LocationRoomEnum;
        details?: {
          type: string;
          maxLength: number;
        };
      };
    };
    urgency: CategoryEnum;
    [key: string]: any;
  };
}

// Type assertion for the imported JSON schema
const typedSurveySchema = surveySchema as SurveySchema;

interface MediaFile {
  file: File;
  preview: string;
  type: 'image' | 'video';
  uploading?: boolean;
  progress?: number;
  url?: string;
  caption?: string;
}

interface FormData {
  category: string;
  subcategory?: string;
  description: string;
  location: {
    room: string;
    details?: string;
  };
  urgency: string;
  availability: Array<{
    day: string;
    timeRanges: string[];
  }>;
  media: MediaFile[];
  tenant_notes?: string;
}

interface MaintenanceLocationState {
  propertyId?: string;
  returnTo?: string;
  [key: string]: any;
}

interface Property {
  id: string;
  name: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  formattedAddress?: string;
  photoUrl?: string;
  units?: any[];
  [key: string]: any;
}

const MaintenanceSurvey: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extract property ID from location state
  const locationState = location.state as MaintenanceLocationState || {};
  const routePropertyId = locationState.propertyId;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    category: '',
    description: '',
    location: {
      room: '',
    },
    urgency: '',
    availability: [],
    media: []
  });

  // Fetch available properties for the tenant
  useEffect(() => {
    if (!currentUser) return;
    
    const fetchProperties = async () => {
      setLoadingProperties(true);
      try {
        // Configure dataService with current user
        dataService.configure({ isDemoMode: false, currentUser });
        
        // If we have a route property ID, fetch just that property
        if (routePropertyId) {
          const property = await dataService.getPropertyById(routePropertyId);
          if (property) {
            setProperties([property]);
            setSelectedProperty(property);
          } else {
            // Property not found - fetch all properties instead
            await fetchAllProperties();
          }
        } else if (userProfile?.propertyId) {
          // If user has a default property in their profile
          const property = await dataService.getPropertyById(userProfile.propertyId);
          if (property) {
            setProperties([property]);
            setSelectedProperty(property);
          } else {
            // Default property not found - fetch all properties
            await fetchAllProperties();
          }
        } else {
          // No pre-selected property - fetch all properties for tenant
          await fetchAllProperties();
        }
      } catch (err) {
        console.error("Error fetching properties:", err);
        setError("Failed to load properties. Please try again.");
      } finally {
        setLoadingProperties(false);
      }
    };
    
    const fetchAllProperties = async () => {
      try {
        // Attempt to get properties associated with this tenant
        // For tenants, this might need to be a special query
        // This assumes a method exists - you may need to adapt this
        const userProperties = await dataService.getPropertiesForTenant(currentUser.uid);
        setProperties(userProperties || []);
        
        // If we have properties, set the first one as selected
        if (userProperties && userProperties.length > 0) {
          setSelectedProperty(userProperties[0]);
        }
      } catch (error) {
        console.error("Error fetching all properties:", error);
      }
    };
    
    fetchProperties();
  }, [currentUser, userProfile, routePropertyId]);

  // Handle file drops
  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Define the union type early so TypeScript can infer a literal type
    type MediaKind = "video" | "image";
    
    // Map the files to correctly-typed objects
    const mappedFiles: MediaFile[] = acceptedFiles.map(file => {
      const kind: MediaKind = file.type.startsWith('image/') ? "image" : "video";
      
      return {
        file,
        preview: URL.createObjectURL(file),
        type: kind,  // Now 'video' | 'image', not generic string
      };
    });

    setMediaFiles(prev => [...prev, ...mappedFiles].slice(0, 5)); // Limit to 5 files
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'video/*': ['.mp4', '.mov']
    },
    maxSize: 20 * 1024 * 1024, // 20MB max
    maxFiles: 5
  });

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => {
        // Ensure parent is a valid key of FormData and the value is an object
        const parentKey = parent as keyof FormData;
        const parentObj = prev[parentKey];
        
        if (typeof parentObj === 'object' && parentObj !== null) {
          return {
            ...prev,
            [parent]: {
              ...parentObj,
              [child]: value
            }
          };
        }
        return prev; // Return unchanged if parent is not an object
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle property selection change
  const handlePropertyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const propertyId = e.target.value;
    const selected = properties.find(p => p.id === propertyId) || null;
    setSelectedProperty(selected);
  };

  // Upload media files to Firebase Storage
  const uploadMedia = async (file: File): Promise<string> => {
    const storageRef = ref(storage, `maintenance-media/${currentUser?.uid}/${Date.now()}-${file.name}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedProperty) {
      setError("Please select a property for this maintenance request.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Upload all media files first
      const mediaUrls = await Promise.all(
        mediaFiles.map(async (mediaFile) => {
          const url = await uploadMedia(mediaFile.file);
          return {
            type: mediaFile.type,
            url,
            caption: mediaFile.caption
          };
        })
      );

      // Create work order document
      const workOrderRef = doc(collection(db, 'workOrders'));
      await setDoc(workOrderRef, {
        ...formData,
        media: mediaUrls,
        tenantId: currentUser.uid,
        propertyId: selectedProperty.id,
        propertyName: selectedProperty.name,
        propertyAddress: selectedProperty.formattedAddress || '',
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Clear form and media
      setFormData({
        category: '',
        description: '',
        location: { room: '' },
        urgency: '',
        availability: [],
        media: []
      });
      setMediaFiles([]);
      
      // Navigate back if specified in route state
      if (locationState.returnTo) {
        navigate(locationState.returnTo);
      } else {
        // Otherwise go to tenant dashboard
        navigate('/tenant/dashboard', { 
          state: { showSuccessMessage: true, message: 'Maintenance request submitted successfully!' }
        });
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Clean up previews on unmount
  React.useEffect(() => {
    return () => mediaFiles.forEach(file => URL.revokeObjectURL(file.preview));
  }, [mediaFiles]);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Report Maintenance Issue</h2>
      
      {loadingProperties ? (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Property Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Property
            </label>
            {properties.length === 0 ? (
              <div className="mt-2 text-sm text-red-600">
                You don't have any properties assigned. Please contact your property manager.
              </div>
            ) : properties.length === 1 ? (
              <div className="mt-2 p-3 border rounded-md bg-gray-50">
                <p className="font-medium">{selectedProperty?.name}</p>
                <p className="text-sm text-gray-600">{selectedProperty?.formattedAddress}</p>
              </div>
            ) : (
              <select
                name="propertyId"
                value={selectedProperty?.id || ''}
                onChange={handlePropertyChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                required
              >
                <option value="">Select a property</option>
                {properties.map(property => (
                  <option key={property.id} value={property.id}>
                    {property.name} - {property.formattedAddress || 'No address'}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Issue Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
              required
            >
              <option value="">Select a category</option>
              {typedSurveySchema.properties.category.enum.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Subcategory Selection (if category selected) */}
          {formData.category && typedSurveySchema.properties.subcategory.properties[formData.category] && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Specific Issue
              </label>
              <select
                name="subcategory"
                value={formData.subcategory}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
              >
                <option value="">Select specific issue</option>
                {typedSurveySchema.properties.subcategory.properties[formData.category].enum.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
              placeholder="Please describe the issue in detail..."
              required
              minLength={10}
              maxLength={1000}
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Location
            </label>
            <select
              name="location.room"
              value={formData.location.room}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
              required
            >
              <option value="">Select room</option>
              {typedSurveySchema.properties.location.properties.room.enum.map((room) => (
                <option key={room} value={room}>
                  {room.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </option>
              ))}
            </select>
            <input
              type="text"
              name="location.details"
              value={formData.location.details}
              onChange={handleChange}
              placeholder="Additional location details (optional)"
              className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
              maxLength={200}
            />
          </div>

          {/* Urgency */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Urgency Level
            </label>
            <select
              name="urgency"
              value={formData.urgency}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
              required
            >
              <option value="">Select urgency</option>
              {typedSurveySchema.properties.urgency.enum.map((level) => (
                <option key={level} value={level}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Media Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Photos/Videos (Optional)
            </label>
            <div
              {...getRootProps()}
              className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md
                ${isDragActive ? 'border-teal-500 bg-teal-50' : 'border-gray-300'}`}
            >
              <div className="space-y-1 text-center">
                <input {...getInputProps()} />
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <span>Drop files here or click to upload</span>
                </div>
                <p className="text-xs text-gray-500">
                  PNG, JPG, MP4 up to 20MB (max 5 files)
                </p>
              </div>
            </div>

            {/* Preview uploaded files */}
            {mediaFiles.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                {mediaFiles.map((file, index) => (
                  <div key={index} className="relative">
                    {file.type === 'image' ? (
                      <img
                        src={file.preview}
                        alt={`Preview ${index + 1}`}
                        className="h-24 w-full object-cover rounded"
                      />
                    ) : (
                      <video
                        src={file.preview}
                        className="h-24 w-full object-cover rounded"
                        controls
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => setMediaFiles(files => files.filter((_, i) => i !== index))}
                      className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full p-1"
                    >
                      ×
                    </button>
                    <input
                      type="text"
                      placeholder="Add caption (optional)"
                      className="mt-1 block w-full text-sm"
                      value={file.caption || ''}
                      onChange={(e) => {
                        const newFiles = [...mediaFiles];
                        newFiles[index] = { ...file, caption: e.target.value };
                        setMediaFiles(newFiles);
                      }}
                      maxLength={200}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Additional Notes (Optional)
            </label>
            <textarea
              name="tenant_notes"
              value={formData.tenant_notes}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
              placeholder="Any additional information..."
              maxLength={500}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading || properties.length === 0}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white
                ${(loading || properties.length === 0) ? 'bg-teal-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700'}`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Submitting...
                </>
              ) : (
                'Submit Maintenance Request'
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default MaintenanceSurvey; 