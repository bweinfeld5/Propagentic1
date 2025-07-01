import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  CheckCircleIcon, 
  MapPinIcon,
  WrenchScrewdriverIcon,
  BuildingOffice2Icon,
  PhoneIcon,
  EnvelopeIcon,
  UserIcon,
  ClockIcon,
  ShieldCheckIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/20/solid';
import { motion, AnimatePresence } from 'framer-motion';
import { APIProvider, Map, MapCameraChangedEvent, AdvancedMarker, useMapsLibrary } from '@vis.gl/react-google-maps';
import { addToWaitlist } from '../services/waitlistService';

// Trade icons mapping
const tradeIcons: { [key: string]: React.ComponentType<{ className?: string }> } = {
  'Plumbing': WrenchScrewdriverIcon,
  'Electrical': WrenchScrewdriverIcon,
  'HVAC': WrenchScrewdriverIcon,
  'Carpentry': WrenchScrewdriverIcon,
  'Painting': WrenchScrewdriverIcon,
  'Landscaping': WrenchScrewdriverIcon,
  'Roofing': WrenchScrewdriverIcon,
  'Flooring': WrenchScrewdriverIcon,
  'Appliance Repair': WrenchScrewdriverIcon,
  'General Handyman': WrenchScrewdriverIcon,
};

const availableTrades = [
  'Plumbing', 'Electrical', 'HVAC', 'Carpentry', 'Painting',
  'Landscaping', 'Roofing', 'Flooring', 'Appliance Repair', 'General Handyman'
];

const experienceLevels = [
  { value: 'less-than-1', label: 'Less than 1 year', description: 'New to the trade' },
  { value: '1-3', label: '1-3 years', description: 'Building experience' },
  { value: '3-5', label: '3-5 years', description: 'Experienced professional' },
  { value: '5-10', label: '5-10 years', description: 'Senior professional' },
  { value: '10-plus', label: '10+ years', description: 'Master craftsperson' }
];

interface FormData {
  name: string;
  email: string;
  phoneNumber: string;
  businessName: string;
  businessAddress: string;
  serviceArea: string;
  trades: string[];
  experience: string;
  description: string;
  serviceRadius: number;
}

interface FormErrors {
  [key: string]: string;
}

interface MapPosition {
  lat: number;
  lng: number;
}

// AddressAutocomplete component
const AddressAutocomplete: React.FC<{
  value: string;
  onChange: (address: string, coordinates?: MapPosition) => void;
  placeholder?: string;
  className?: string;
}> = ({ value, onChange, placeholder, className }) => {
  const placesLibrary = useMapsLibrary('places');
  const [autocompleteService, setAutocompleteService] = React.useState<google.maps.places.AutocompleteService | null>(null);
  const [placesService, setPlacesService] = React.useState<google.maps.places.PlacesService | null>(null);
  const [predictions, setPredictions] = React.useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showDropdown, setShowDropdown] = React.useState(false);
  
  React.useEffect(() => {
    if (!placesLibrary) return;
    
    setAutocompleteService(new placesLibrary.AutocompleteService());
    // Create a dummy element for PlacesService since we only need getDetails
    const dummyElement = document.createElement('div');
    setPlacesService(new placesLibrary.PlacesService(dummyElement));
  }, [placesLibrary]);

  const handleInputChange = (inputValue: string) => {
    onChange(inputValue);
    
    if (!autocompleteService || inputValue.length < 3) {
      setPredictions([]);
      setShowDropdown(false);
      return;
    }

    autocompleteService.getPlacePredictions(
      {
        input: inputValue,
        types: ['address'],
        componentRestrictions: { country: 'us' }
      },
      (predictions: google.maps.places.AutocompletePrediction[] | null, status: google.maps.places.PlacesServiceStatus) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          setPredictions(predictions);
          setShowDropdown(true);
        } else {
          setPredictions([]);
          setShowDropdown(false);
        }
      }
    );
  };

  const handlePredictionSelect = (prediction: google.maps.places.AutocompletePrediction) => {
    if (!placesService) return;
    
    placesService.getDetails(
      {
        placeId: prediction.place_id,
        fields: ['geometry', 'formatted_address']
      },
      (place: google.maps.places.PlaceResult | null, status: google.maps.places.PlacesServiceStatus) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          const address = place.formatted_address || prediction.description;
          let coordinates: MapPosition | undefined;
          
          if (place.geometry?.location) {
            coordinates = {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            };
          }
          
          onChange(address, coordinates);
          setPredictions([]);
          setShowDropdown(false);
        }
      }
    );
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
        onFocus={() => value.length >= 3 && predictions.length > 0 && setShowDropdown(true)}
        className={className}
        placeholder={placeholder}
        autoComplete="off"
      />
      
      {showDropdown && predictions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {predictions.map((prediction) => (
            <button
              key={prediction.place_id}
              type="button"
              onClick={() => handlePredictionSelect(prediction)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 border-b border-gray-100 last:border-b-0"
            >
              <div className="font-medium text-gray-900">{prediction.structured_formatting.main_text}</div>
              <div className="text-sm text-gray-600">{prediction.structured_formatting.secondary_text}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const EnhancedContractorRegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phoneNumber: '',
    businessName: '',
    businessAddress: '',
    serviceArea: '',
    trades: [],
    experience: '',
    description: 'Experienced contractor ready to provide quality service.',
    serviceRadius: 10
  });
  
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  
  // Map state - Default to center of US
  const [mapCenter, setMapCenter] = useState<MapPosition>({ lat: 39.8283, lng: -98.5795 }); // Center of US
  const [markerPosition, setMarkerPosition] = useState<MapPosition>({ lat: 39.8283, lng: -98.5795 });

  const totalSteps = 3;
  const progressPercentage = (currentStep / totalSteps) * 100;

  // Google Maps API Key - you should set this in your environment
  const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY_HERE';

  // Handle map camera changes
  const handleCameraChanged = useCallback((ev: MapCameraChangedEvent) => {
    console.log('Camera changed:', ev.detail.center, 'zoom:', ev.detail.zoom);
    setMapCenter(ev.detail.center);
  }, []);

  // Handle marker position updates (if implementing draggable marker)
  const handleMarkerDrag = useCallback((position: MapPosition) => {
    setMarkerPosition(position);
    setMapCenter(position);
  }, []);

  // Geocode address and update map location
  const geocodeAddress = useCallback(async (address: string) => {
    if (!address.trim() || !window.google) return;
    
    try {
      const geocoder = new window.google.maps.Geocoder();
      const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
        geocoder.geocode({ address }, (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
          if (status === 'OK' && results) {
            resolve(results);
          } else {
            reject(new Error(`Geocoding failed: ${status}`));
          }
        });
      });

      if (result.length > 0) {
        const location = result[0].geometry.location;
        const newPosition = {
          lat: location.lat(),
          lng: location.lng()
        };
        setMapCenter(newPosition);
        setMarkerPosition(newPosition);
        console.log('Address geocoded successfully:', newPosition);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      // Silently fail - don't show error to user for geocoding failures
    }
  }, []);

  // Handle business address change with coordinates from autocomplete
  const handleBusinessAddressChange = useCallback((address: string, coordinates?: MapPosition) => {
    setFormData(prev => ({ ...prev, businessAddress: address }));
    
    // If coordinates are provided from autocomplete, use them immediately
    if (coordinates) {
      setMapCenter(coordinates);
      setMarkerPosition(coordinates);
    } else {
      // Fallback to geocoding for manual input
      const timeoutId = setTimeout(() => {
        if (address.trim().length > 10) {
          geocodeAddress(address);
        }
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [geocodeAddress]);

  // Validation functions
  const validateStep = (step: number): boolean => {
    const errors: FormErrors = {};
    
    switch (step) {
      case 1:
        if (!formData.name.trim()) errors.name = 'Name is required';
        if (!formData.email.trim()) errors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Invalid email format';
        if (!formData.phoneNumber.trim()) errors.phoneNumber = 'Phone number is required';
        break;
      case 2:
        if (formData.trades.length === 0) errors.trades = 'Select at least one trade';
        if (!formData.experience) errors.experience = 'Experience level is required';
        break;
      case 3:
        if (!formData.businessAddress.trim()) errors.businessAddress = 'Business address is required';
        break;
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleTradeToggle = (trade: string) => {
    setFormData(prev => ({
      ...prev,
      trades: prev.trades.includes(trade) 
        ? prev.trades.filter(t => t !== trade)
        : [...prev.trades, trade]
    }));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    
    setIsSubmitting(true);
    try {
      await addToWaitlist({
        email: formData.email,
        role: 'contractor',
        name: formData.name,
        source: 'contractor-registration',
        userId: null,
        subscribed_to_newsletter: true,
        marketing_consent: true,
        early_access: true
      });
      
      // Store additional contractor data separately if needed
      // You can create a separate collection for contractor-specific data
      
      toast.success('Registration successful! We\'ll be in touch soon.');
      navigate('/');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <UserIcon className="h-16 w-16 text-orange-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
              <p className="text-gray-600">Tell us about yourself</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-orange-500 focus:ring-orange-500 bg-white"
                  placeholder="Enter your full name"
                />
                {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-orange-500 focus:ring-orange-500 bg-white"
                  placeholder="your@email.com"
                />
                {formErrors.email && <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-orange-500 focus:ring-orange-500 bg-white"
                  placeholder="(555) 123-4567"
                />
                {formErrors.phoneNumber && <p className="text-red-500 text-sm mt-1">{formErrors.phoneNumber}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name
                </label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-orange-500 focus:ring-orange-500 bg-white"
                  placeholder="Your Business Name"
                />
              </div>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <WrenchScrewdriverIcon className="h-16 w-16 text-orange-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Skills & Experience</h2>
              <p className="text-gray-600">What services do you provide?</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Select Your Trades <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availableTrades.map((trade) => {
                  const Icon = tradeIcons[trade];
                  const isSelected = formData.trades.includes(trade);
                  return (
                    <motion.button
                      key={trade}
                      type="button"
                      onClick={() => handleTradeToggle(trade)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isSelected 
                          ? 'border-orange-500 bg-orange-50' 
                          : 'border-gray-300 hover:border-orange-300 hover:bg-gray-50'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Icon className={`h-8 w-8 mx-auto mb-2 ${isSelected ? 'text-orange-600' : 'text-gray-400'}`} />
                      <span className={`text-sm font-medium ${isSelected ? 'text-orange-600' : 'text-gray-700'}`}>
                        {trade}
                      </span>
                      {isSelected && (
                        <CheckIcon className="h-5 w-5 text-orange-600 mx-auto mt-1" />
                      )}
                    </motion.button>
                  );
                })}
              </div>
              {formErrors.trades && <p className="text-red-500 text-sm mt-2">{formErrors.trades}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Years of Experience <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                {experienceLevels.map((level) => (
                  <motion.button
                    key={level.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, experience: level.value }))}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      formData.experience === level.value
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-300 hover:border-orange-300 hover:bg-gray-50'
                    }`}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className={`font-medium ${formData.experience === level.value ? 'text-orange-600' : 'text-gray-900'}`}>
                          {level.label}
                        </div>
                        <div className="text-sm text-gray-500">{level.description}</div>
                      </div>
                      {formData.experience === level.value && (
                        <CheckIcon className="h-6 w-6 text-orange-600" />
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
              {formErrors.experience && <p className="text-red-500 text-sm mt-2">{formErrors.experience}</p>}
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <MapPinIcon className="h-16 w-16 text-orange-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Service Area</h2>
              <p className="text-gray-600">Where do you operate?</p>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Address <span className="text-red-500">*</span>
                </label>
                <AddressAutocomplete
                  value={formData.businessAddress}
                  onChange={handleBusinessAddressChange}
                  placeholder="Enter your business address"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-orange-500 focus:ring-orange-500 bg-white"
                />
                {formErrors.businessAddress && <p className="text-red-500 text-sm mt-1">{formErrors.businessAddress}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Radius: {formData.serviceRadius} miles
                </label>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={formData.serviceRadius}
                  onChange={(e) => setFormData(prev => ({ ...prev, serviceRadius: parseInt(e.target.value) }))}
                  className="w-full slider"
                  style={{
                    background: `linear-gradient(to right, #f97316 0%, #f97316 ${(formData.serviceRadius - 5) / 45 * 100}%, #d1d5db ${(formData.serviceRadius - 5) / 45 * 100}%, #d1d5db 100%)`
                  }}
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>5 miles</span>
                  <span>50 miles</span>
                </div>
              </div>
              
              {/* Google Maps Integration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Location
                </label>
                <div className="h-64 rounded-lg overflow-hidden border border-gray-300">
                  <APIProvider 
                    apiKey={GOOGLE_MAPS_API_KEY} 
                    libraries={['places']}
                    onLoad={() => console.log('Maps API has loaded.')}
                  >
                    <Map
                      zoom={formData.businessAddress.trim().length > 10 ? 14 : 4}
                      center={mapCenter}
                      onCameraChanged={handleCameraChanged}
                      mapId="contractor-service-area-map"
                      style={{ width: '100%', height: '100%' }}
                    >
                      <AdvancedMarker
                        position={markerPosition}
                      />
                    </Map>
                  </APIProvider>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  The marker shows your primary service location. You can drag it to adjust.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brief Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-orange-500 focus:ring-orange-500 bg-white"
                  placeholder="Tell potential clients about your services and experience..."
                />
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  const renderProgressBar = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-900">Step {currentStep} of {totalSteps}</span>
        <span className="text-sm text-gray-600">{Math.round(progressPercentage)}% Complete</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <motion.div
          className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      <div className="flex justify-between mt-2">
        <div className="flex items-center space-x-1">
          <ClockIcon className="w-3 h-3 text-gray-400" />
          <span className="text-xs text-gray-500">~{4 - currentStep} min remaining</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full bg-white p-8 md:p-10 rounded-xl shadow-xl mx-auto border border-gray-200">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4 transition-colors"
              type="button"
            >
              ← Back to Home
            </button>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent mb-2">
              Join Our Contractor Network
            </h1>
            <p className="text-gray-600">
              Connect with property managers and grow your business
            </p>
          </motion.div>
          
          {renderProgressBar()}
        </div>

        {/* Form Content */}
        <AnimatePresence mode="wait">
          <div key={currentStep}>
            {renderStepContent()}
          </div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
          <motion.button
            type="button"
            onClick={handlePrev}
            disabled={currentStep === 1}
            whileHover={{ scale: currentStep === 1 ? 1 : 1.02 }}
            whileTap={{ scale: currentStep === 1 ? 1 : 0.98 }}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              currentStep === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Previous
          </motion.button>

          {currentStep < totalSteps ? (
            <motion.button
              type="button"
              onClick={handleNext}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Continue
            </motion.button>
          ) : (
            <motion.button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
              whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
              className={`px-8 py-3 font-medium rounded-lg shadow-lg transition-all duration-200 ${
                isSubmitting
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white hover:shadow-xl'
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </div>
              ) : (
                'Join Network'
              )}
            </motion.button>
          )}
        </div>
        
        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          We'll review your application and contact you within 24-48 hours.
        </p>
      </div>
    </div>
  );
};

export default EnhancedContractorRegistrationPage; 