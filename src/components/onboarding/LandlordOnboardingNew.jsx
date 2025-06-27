import React, { useState } from 'react';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UserIcon, BuildingOfficeIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const LandlordOnboardingNew = () => {
  const { currentUser, fetchUserProfile } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    businessInfo: {
      companyName: '',
      businessType: 'individual',
      yearsInBusiness: '',
      numberOfProperties: ''
    },
    preferences: {
      communicationMethod: 'email',
      defaultCurrency: 'USD',
      timezone: 'America/New_York',
      autoScreeningEnabled: true,
      maintenanceNotifications: true
    }
  });
  
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      const displayName = `${formData.firstName} ${formData.lastName}`.trim();
      
      // Update Firebase Auth profile
      await updateProfile(currentUser, { displayName });
      
      // Update Firestore user document
      await updateDoc(doc(db, 'users', currentUser.uid), {
        firstName: formData.firstName,
        lastName: formData.lastName,
        displayName,
        phoneNumber: formData.phoneNumber,
        onboardingComplete: true,
        profileComplete: true,
        updatedAt: new Date().toISOString()
      });
      
      // Create landlord profile
      await setDoc(doc(db, 'landlordProfiles', currentUser.uid), {
        uid: currentUser.uid,
        landlordId: currentUser.uid,
        email: currentUser.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        fullName: displayName,
        phoneNumber: formData.phoneNumber,
        businessInfo: formData.businessInfo,
        preferences: formData.preferences,
        createdAt: new Date().toISOString(),
        properties: [],
        acceptedTenants: [],
        acceptedTenantDetails: [],
        contractors: [],
        totalProperties: 0,
        totalTenants: 0,
        totalInvitesSent: 0,
        totalInvitesAccepted: 0,
        inviteAcceptanceRate: 0,
        profileCompletionPercentage: 100,
        verified: false
      });
      
      // Refresh the user profile to ensure AuthContext has the latest data
      if (fetchUserProfile) {
        await fetchUserProfile(currentUser.uid);
      }
      
      toast.success('Welcome to PropAgentic! Your landlord profile is complete.');
      
      // Small delay to ensure all updates are processed
      setTimeout(() => {
        navigate('/landlord/dashboard');
      }, 500);
      
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Failed to complete setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return formData.firstName && formData.lastName && formData.phoneNumber;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <BuildingOfficeIcon className="w-16 h-16 mx-auto text-orange-500 mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to PropAgentic!</h1>
          <p className="text-gray-600">Let's set up your landlord profile</p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="John"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Doe"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="(555) 123-4567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Name (Optional)
            </label>
            <input
              type="text"
              value={formData.businessInfo.companyName}
              onChange={(e) => handleInputChange('businessInfo.companyName', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Your company name"
            />
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm text-orange-800">
              <strong>Pre-filled:</strong> Your email ({currentUser?.email}) is already set up from registration.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !isFormValid()}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
              loading || !isFormValid()
                ? 'bg-orange-400 text-white cursor-not-allowed'
                : 'bg-orange-600 text-white hover:bg-orange-700'
            }`}
          >
            {loading ? 'Setting up...' : 'Complete Setup'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LandlordOnboardingNew; 