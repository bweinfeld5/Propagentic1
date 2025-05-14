import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

const TenantForm = () => {
  const { currentUser, completeOnboarding } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    apartmentUnit: '',
    moveInDate: '',
    maintenancePreference: 'email',
    landlordName: '',
    propertyAddress: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Use the completeOnboarding function
      await completeOnboarding(currentUser.uid, {
        ...formData,
        role: 'tenant' // Ensure role is set
      });
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      setError('Failed to save your information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Tenant Information</h2>
      
      {error && (
        <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
          <p>{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Full Name */}
          <div className="col-span-2">
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              required
              value={formData.fullName}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          
          {/* Apartment Unit */}
          <div>
            <label htmlFor="apartmentUnit" className="block text-sm font-medium text-gray-700">
              Apartment/Unit Number
            </label>
            <input
              type="text"
              id="apartmentUnit"
              name="apartmentUnit"
              required
              value={formData.apartmentUnit}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          
          {/* Move-in Date */}
          <div>
            <label htmlFor="moveInDate" className="block text-sm font-medium text-gray-700">
              Move-in Date
            </label>
            <input
              type="date"
              id="moveInDate"
              name="moveInDate"
              required
              value={formData.moveInDate}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          
          {/* Maintenance Preferences */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Preferred Maintenance Contact Method
            </label>
            <div className="mt-2 space-y-2">
              <div className="flex items-center">
                <input
                  id="maintenance-email"
                  name="maintenancePreference"
                  type="radio"
                  value="email"
                  checked={formData.maintenancePreference === 'email'}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <label htmlFor="maintenance-email" className="ml-3 block text-sm font-medium text-gray-700">
                  Email
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="maintenance-phone"
                  name="maintenancePreference"
                  type="radio"
                  value="phone"
                  checked={formData.maintenancePreference === 'phone'}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <label htmlFor="maintenance-phone" className="ml-3 block text-sm font-medium text-gray-700">
                  Phone Call
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="maintenance-text"
                  name="maintenancePreference"
                  type="radio"
                  value="text"
                  checked={formData.maintenancePreference === 'text'}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <label htmlFor="maintenance-text" className="ml-3 block text-sm font-medium text-gray-700">
                  Text Message
                </label>
              </div>
            </div>
          </div>
          
          {/* Landlord Name */}
          <div>
            <label htmlFor="landlordName" className="block text-sm font-medium text-gray-700">
              Landlord's Name
            </label>
            <input
              type="text"
              id="landlordName"
              name="landlordName"
              required
              value={formData.landlordName}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          
          {/* Property Address */}
          <div>
            <label htmlFor="propertyAddress" className="block text-sm font-medium text-gray-700">
              Property Address
            </label>
            <input
              type="text"
              id="propertyAddress"
              name="propertyAddress"
              required
              value={formData.propertyAddress}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>
        
        <div className="mt-8">
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Complete Setup'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TenantForm; 