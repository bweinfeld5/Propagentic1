import React, { useState } from 'react';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ContractorOnboardingNew = () => {
  const { currentUser, fetchUserProfile } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    specialties: [],
    companyName: ''
  });
  
  const [loading, setLoading] = useState(false);
  
  const specialtyOptions = [
    'plumbing', 'electrical', 'hvac', 'carpentry', 
    'painting', 'roofing', 'landscaping', 'general'
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSpecialtyChange = (specialty, checked) => {
    const currentSpecialties = formData.specialties;
    if (checked) {
      setFormData(prev => ({
        ...prev,
        specialties: [...currentSpecialties, specialty]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        specialties: currentSpecialties.filter(s => s !== specialty)
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
        specialties: formData.specialties,
        companyName: formData.companyName || null,
        onboardingComplete: true,
        profileComplete: true,
        updatedAt: new Date().toISOString()
      });
      
      // Create contractor profile
      await setDoc(doc(db, 'contractorProfiles', currentUser.uid), {
        uid: currentUser.uid,
        contractorId: currentUser.uid,
        email: currentUser.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        fullName: displayName,
        phoneNumber: formData.phoneNumber,
        companyName: formData.companyName || null,
        specialties: formData.specialties,
        serviceTypes: formData.specialties, // Map specialties to serviceTypes for compatibility
        createdAt: new Date().toISOString(),
        profileCompletionPercentage: 100,
        verified: false,
        status: 'active'
      });
      
      // Refresh the user profile to ensure AuthContext has the latest data
      if (fetchUserProfile) {
        await fetchUserProfile(currentUser.uid);
      }
      
      toast.success('Welcome to PropAgentic! Your contractor profile is complete.');
      
      // Small delay to ensure all updates are processed
      setTimeout(() => {
        navigate('/contractor/dashboard');
      }, 500);
      
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Failed to complete setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return formData.firstName && 
           formData.lastName && 
           formData.phoneNumber && 
           formData.specialties.length > 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <WrenchScrewdriverIcon className="w-16 h-16 mx-auto text-green-500 mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to PropAgentic!</h1>
          <p className="text-gray-600">Let's set up your contractor profile</p>
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="(555) 123-4567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Name (Optional)
            </label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => handleInputChange('companyName', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Your company name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Specialties * (Select all that apply)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {specialtyOptions.map((specialty) => (
                <div key={specialty} className="flex items-center">
                  <input
                    id={`specialty-${specialty}`}
                    type="checkbox"
                    checked={formData.specialties.includes(specialty)}
                    onChange={(e) => handleSpecialtyChange(specialty, e.target.checked)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor={`specialty-${specialty}`}
                    className="ml-2 text-sm text-gray-700 capitalize"
                  >
                    {specialty}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              <strong>Pre-filled:</strong> Your email ({currentUser?.email}) is already set up from registration.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !isFormValid()}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
              loading || !isFormValid()
                ? 'bg-green-400 text-white cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {loading ? 'Setting up...' : 'Complete Setup'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ContractorOnboardingNew; 