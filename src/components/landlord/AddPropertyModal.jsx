import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import Button from '../ui/Button';
import { XMarkIcon, HomeModernIcon } from '@heroicons/react/24/outline';

/**
 * AddPropertyModal Component
 * 
 * Modal form for adding a new property
 * 
 * @param {boolean} isOpen - Whether the modal is open
 * @param {function} onClose - Function to close the modal
 * @param {function} onAdd - Function to handle adding a property
 */
const AddPropertyModal = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    propertyName: '',
    streetAddress: '',
    city: '',
    state: '',
    zipCode: '',
    propertyType: 'Single-Family Home', // Default type
    numberOfUnits: 1, // Default units
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError(''); 
  };

  const handleSave = async () => {
    setError('');
    // Basic Validation
    if (!formData.propertyName.trim() || !formData.streetAddress.trim() || !formData.city.trim() || !formData.state.trim() || !formData.zipCode.trim()) {
      setError('Please fill in all required fields (Name, Address, City, State, Zip).');
      return;
    }

    setLoading(true);
    try {
      // Prepare data for dataService (adjust structure if needed)
      const propertyData = {
        name: formData.propertyName,
        address: {
          street: formData.streetAddress,
          city: formData.city,
          state: formData.state,
          zip: formData.zipCode,
        },
        propertyType: formData.propertyType,
        numberOfUnits: parseInt(formData.numberOfUnits, 10) || 1,
        // Add other relevant fields if needed by dataService.createProperty
      };
      
      console.log('Adding property with data:', propertyData);
      await onAdd(propertyData); // Call the passed onAdd function (connected to dataService)
      
      // Reset form and close modal on success
      setFormData({
        propertyName: '',
        streetAddress: '',
        city: '',
        state: '',
        zipCode: '',
        propertyType: 'Single-Family Home',
        numberOfUnits: 1,
      });
      onClose(); 
    } catch (err) {
      console.error("Error adding property:", err);
      setError(err.message || 'Failed to add property. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-background dark:bg-background-dark p-6 text-left align-middle shadow-xl transition-all border border-border dark:border-border-dark">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-content dark:text-content-dark flex items-center"
                >
                  <HomeModernIcon className="w-6 h-6 mr-2 text-primary dark:text-primary-light" />
                  Add New Property
                </Dialog.Title>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="!absolute top-2 right-2 !p-1"
                  icon={<XMarkIcon className="w-5 h-5"/>}
                  aria-label="Close"
                />

                <div className="mt-4 space-y-4">
                  {error && (
                    <div className="rounded-md bg-danger-subtle dark:bg-danger-darkSubtle p-3">
                      <p className="text-sm text-danger dark:text-red-400">{error}</p>
                    </div>
                  )}
                  {/* Form Fields */}
                  <div>
                    <label htmlFor="propertyName" className="block text-sm font-medium text-content-secondary dark:text-content-darkSecondary">Property Name / Nickname</label>
                    <input
                      type="text"
                      name="propertyName"
                      id="propertyName"
                      value={formData.propertyName}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-border dark:border-border-dark shadow-sm focus:border-primary focus:ring-primary sm:text-sm bg-background-subtle dark:bg-background-darkSubtle text-content dark:text-content-dark"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="streetAddress" className="block text-sm font-medium text-content-secondary dark:text-content-darkSecondary">Street Address</label>
                    <input
                      type="text"
                      name="streetAddress"
                      id="streetAddress"
                      value={formData.streetAddress}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-border dark:border-border-dark shadow-sm focus:border-primary focus:ring-primary sm:text-sm bg-background-subtle dark:bg-background-darkSubtle text-content dark:text-content-dark"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-1">
                      <label htmlFor="city" className="block text-sm font-medium text-content-secondary dark:text-content-darkSecondary">City</label>
                      <input type="text" name="city" id="city" value={formData.city} onChange={handleChange} className="mt-1 block w-full rounded-md border-border dark:border-border-dark shadow-sm focus:border-primary focus:ring-primary sm:text-sm bg-background-subtle dark:bg-background-darkSubtle text-content dark:text-content-dark" required/>
                    </div>
                    <div className="sm:col-span-1">
                      <label htmlFor="state" className="block text-sm font-medium text-content-secondary dark:text-content-darkSecondary">State</label>
                      <input type="text" name="state" id="state" value={formData.state} onChange={handleChange} className="mt-1 block w-full rounded-md border-border dark:border-border-dark shadow-sm focus:border-primary focus:ring-primary sm:text-sm bg-background-subtle dark:bg-background-darkSubtle text-content dark:text-content-dark" required/>
                    </div>
                    <div className="sm:col-span-1">
                      <label htmlFor="zipCode" className="block text-sm font-medium text-content-secondary dark:text-content-darkSecondary">Zip Code</label>
                      <input type="text" name="zipCode" id="zipCode" value={formData.zipCode} onChange={handleChange} className="mt-1 block w-full rounded-md border-border dark:border-border-dark shadow-sm focus:border-primary focus:ring-primary sm:text-sm bg-background-subtle dark:bg-background-darkSubtle text-content dark:text-content-dark" required/>
                    </div>
                  </div>
                   {/* Optional: Property Type and Units - Can be simplified for MVP */}
                  {/* <div>
                    <label htmlFor="propertyType" className="block text-sm font-medium text-content-secondary dark:text-content-darkSecondary">Property Type</label>
                    <select 
                      name="propertyType" 
                      id="propertyType" 
                      value={formData.propertyType} 
                      onChange={handleChange} 
                      className="mt-1 block w-full rounded-md border-border dark:border-border-dark shadow-sm focus:border-primary focus:ring-primary sm:text-sm bg-background-subtle dark:bg-background-darkSubtle text-content dark:text-content-dark"
                    >
                       <option>Single-Family Home</option>
                       <option>Multi-Family Building</option>
                       <option>Condo</option>
                       <option>Townhouse</option>
                       </select>
                     </div>
                   {formData.propertyType === 'Multi-Family Building' && (
                     <div>
                       <label htmlFor="numberOfUnits" className="block text-sm font-medium text-content-secondary dark:text-content-darkSecondary">Number of Units</label>
                       <input type="number" name="numberOfUnits" id="numberOfUnits" value={formData.numberOfUnits} onChange={handleChange} min="1" className="mt-1 block w-full rounded-md border-border dark:border-border-dark shadow-sm focus:border-primary focus:ring-primary sm:text-sm bg-background-subtle dark:bg-background-darkSubtle text-content dark:text-content-dark"/>
                     </div>
                   )} */}
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <Button variant="outline" onClick={onClose} disabled={loading}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={handleSave} isLoading={loading} disabled={loading}>
                    {loading ? 'Saving...' : 'Save Property'}
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default AddPropertyModal; 