import React, { useState, useEffect } from 'react';
import { useDemo } from '../../../context/DemoContext';
import { generateBulkProperties } from '../../../services/demoDataGenerator';
import { 
  PlusIcon, 
  PhotoIcon, 
  CheckIcon,
  SparklesIcon,
  DocumentArrowUpIcon,
  HomeIcon,
  MapPinIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

const LandlordOnboardingDemo = ({ isPlaying, onComplete }) => {
  const { demoData, addProperty, bulkAddProperties, startSection, completeSection } = useDemo();
  const [step, setStep] = useState(0);
  const [propertyForm, setPropertyForm] = useState({
    name: '',
    address: '',
    type: 'multi-family',
    units: 12,
    yearBuilt: 2018,
    monthlyRent: 2500
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [bulkImportProgress, setBulkImportProgress] = useState(0);

  // Auto-play logic
  useEffect(() => {
    if (isPlaying && step === 0) {
      startSection('landlordOnboarding');
      setTimeout(() => setStep(1), 1000);
    }
  }, [isPlaying, step, startSection]);

  // Simulate typing animation
  const simulateTyping = (field, value, callback) => {
    setIsTyping(true);
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex <= value.length) {
        setPropertyForm(prev => ({
          ...prev,
          [field]: value.substring(0, currentIndex)
        }));
        currentIndex++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
        if (callback) callback();
      }
    }, 50);
  };

  // Auto-complete address
  const handleAddressInput = (partial) => {
    if (partial.length > 5) {
      setTimeout(() => {
        setPropertyForm(prev => ({
          ...prev,
          address: '123 Main Street, San Francisco, CA 94105'
        }));
      }, 300);
    }
  };

  // Handle photo upload simulation
  const handlePhotoUpload = () => {
    const demoPhotos = [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400'
    ];
    
    // Simulate upload progress
    demoPhotos.forEach((photo, index) => {
      setTimeout(() => {
        setUploadedPhotos(prev => [...prev, photo]);
      }, (index + 1) * 300);
    });
  };

  // Handle bulk import
  const handleBulkImport = () => {
    setBulkImportProgress(0);
    const properties = generateBulkProperties(5);
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setBulkImportProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          bulkAddProperties(properties);
          setTimeout(() => {
            setShowSuccess(true);
            completeSection('landlordOnboarding');
            setTimeout(onComplete, 2000);
          }, 500);
          return 100;
        }
        return prev + 20;
      });
    }, 200);
  };

  // Handle single property submission
  const handleSubmitProperty = () => {
    const newProperty = {
      ...propertyForm,
      id: `property-${Date.now()}`,
      photos: uploadedPhotos,
      amenities: ['Parking', 'Laundry', 'Gym'],
      occupancyRate: 92,
      addedDate: new Date().toISOString()
    };
    
    addProperty(newProperty);
    setStep(4); // Move to bulk import
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <HomeIcon className="h-16 w-16 mx-auto text-teal-600 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome to PropAgentic
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Let's add your first property in under 2 minutes
            </p>
            <button
              onClick={() => {
                setStep(1);
                startSection('landlordOnboarding');
              }}
              className="px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transform hover:scale-105 transition-all"
            >
              <PlusIcon className="h-5 w-5 inline mr-2" />
              Add Your First Property
            </button>
          </motion.div>
        );

      case 1:
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-8"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Property Information
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Property Name
                </label>
                <input
                  type="text"
                  value={propertyForm.name}
                  onChange={(e) => setPropertyForm({ ...propertyForm, name: e.target.value })}
                  onFocus={() => simulateTyping('name', 'Sunset Ridge Apartments')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="Enter property name..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Address
                </label>
                <div className="relative">
                  <MapPinIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={propertyForm.address}
                    onChange={(e) => {
                      setPropertyForm({ ...propertyForm, address: e.target.value });
                      handleAddressInput(e.target.value);
                    }}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Start typing address..."
                  />
                  {propertyForm.address.includes('San Francisco') && (
                    <CheckIcon className="absolute right-3 top-2.5 h-5 w-5 text-green-500" />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Property Type
                  </label>
                  <select
                    value={propertyForm.type}
                    onChange={(e) => setPropertyForm({ ...propertyForm, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="multi-family">Multi-family</option>
                    <option value="single-family">Single-family</option>
                    <option value="condo">Condo</option>
                    <option value="townhouse">Townhouse</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Units
                  </label>
                  <input
                    type="number"
                    value={propertyForm.units}
                    onChange={(e) => setPropertyForm({ ...propertyForm, units: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!propertyForm.name || !propertyForm.address}
                className="w-full py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
              >
                Next: Add Photos
              </button>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-8"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Add Property Photos
            </h3>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              {uploadedPhotos.length === 0 ? (
                <>
                  <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    Drag and drop photos here, or click to select
                  </p>
                  <button
                    onClick={handlePhotoUpload}
                    className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Select Photos
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  <AnimatePresence>
                    {uploadedPhotos.map((photo, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative group"
                      >
                        <img
                          src={photo}
                          alt={`Property ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        {index === 0 && (
                          <div className="absolute top-2 left-2 bg-teal-600 text-white px-2 py-1 rounded text-xs">
                            Primary
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {uploadedPhotos.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex items-center justify-between"
              >
                <p className="text-sm text-green-600 flex items-center">
                  <CheckIcon className="h-4 w-4 mr-1" />
                  {uploadedPhotos.length} photos uploaded
                </p>
                <button
                  onClick={() => setStep(3)}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700"
                >
                  Create Property
                </button>
              </motion.div>
            )}
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
              className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <CheckIcon className="h-10 w-10 text-green-600" />
            </motion.div>
            
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Property Added Successfully!
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {propertyForm.name} has been added to your portfolio
            </p>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Setup Time</p>
                  <p className="font-bold text-gray-900 dark:text-white">1:47</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Photos Added</p>
                  <p className="font-bold text-gray-900 dark:text-white">3</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmitProperty}
              className="px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700"
            >
              Add More Properties
            </button>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-8"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Bulk Import Properties
            </h3>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <SparklesIcon className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Scale Your Portfolio Instantly
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Import multiple properties from a spreadsheet in seconds
                  </p>
                </div>
              </div>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Drop your CSV or Excel file here
              </p>
              <button
                onClick={handleBulkImport}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700"
              >
                Simulate Bulk Import (5 Properties)
              </button>
            </div>

            {bulkImportProgress > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6"
              >
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span>Importing properties...</span>
                  <span>{bulkImportProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    className="bg-teal-600 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${bulkImportProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </motion.div>
            )}

            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
              >
                <div className="flex items-center">
                  <CheckIcon className="h-5 w-5 text-green-600 mr-2" />
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-100">
                      5 Properties Added Successfully!
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Total time: 15 seconds • {demoData.properties.length} properties in portfolio
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-[600px] flex items-center justify-center">
      {renderStep()}
    </div>
  );
};

export default LandlordOnboardingDemo; 