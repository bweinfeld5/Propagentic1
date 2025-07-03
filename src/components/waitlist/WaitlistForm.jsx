import React, { useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { waitlistService } from '../../services/firestore/waitlistService';

const WaitlistForm = ({ onSuccess, currentUser, compact = false }) => {
  const [formData, setFormData] = useState({
    name: currentUser?.displayName || '',
    email: currentUser?.email || '',
    phoneNumber: '',
    userType: 'landlord',
    interests: [],
    referralSource: '',
    companyName: '',
    propertyCount: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const interestOptions = [
    { id: 'maintenance', label: 'Automated Maintenance Management' },
    { id: 'communication', label: 'Tenant Communication Tools' },
    { id: 'contractor', label: 'Contractor Network Access' },
    { id: 'analytics', label: 'Property Analytics & Insights' },
    { id: 'payments', label: 'Integrated Payment Processing' },
    { id: 'mobile', label: 'Mobile App Features' }
  ];

  const referralSources = [
    'Search Engine (Google, Bing, etc.)',
    'Social Media',
    'Word of Mouth',
    'Industry Publication',
    'Conference/Event',
    'Partner Referral',
    'Other'
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!compact && !formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (formData.phoneNumber && !/^[\+]?[\d\s\-\(\)]{10,}$/.test(formData.phoneNumber.replace(/\s/g, ''))) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    if (!agreedToTerms) {
      newErrors.terms = 'You must agree to the terms and privacy policy';
    }

    return newErrors;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleInterestChange = (interestId) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interestId)
        ? prev.interests.filter(id => id !== interestId)
        : [...prev.interests, interestId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Add to waitlist collection using the new service
      const result = await waitlistService.addWaitlistEntry({
        name: formData.name,
        email: formData.email.toLowerCase(),
        phoneNumber: formData.phoneNumber,
        userType: formData.userType,
        interests: formData.interests,
        referralSource: formData.referralSource,
        companyName: formData.companyName,
        propertyCount: formData.propertyCount,
        userId: currentUser?.uid || null,
        ipAddress: null, // Would need to implement IP detection
        userAgent: navigator.userAgent,
        timestamp: serverTimestamp(),
        source: compact ? 'hero_waitlist_form' : 'waitlist_form'
      });

      if (!result.success) {
        setErrors({
          submit: result.error || 'There was an error submitting your information. Please try again.'
        });
        return;
      }

      // Update user profile if logged in
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userDocRef, {
          onWaitlist: true,
          waitlistSignupDate: serverTimestamp(),
          phoneNumber: formData.phoneNumber,
          interests: formData.interests,
          updatedAt: serverTimestamp()
        });
      }

      // Track analytics event
      if (typeof gtag !== 'undefined') {
        gtag('event', 'waitlist_signup', {
          event_category: 'engagement',
          event_label: formData.userType,
          value: 1
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Error submitting waitlist form:', error);
      setErrors({
        submit: 'There was an error submitting your information. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Compact form for hero section
  if (compact) {
    return (
      <div className="w-full">
        {errors.submit && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {errors.submit}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Essential fields only in compact mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-sm ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter your name"
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-sm ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter your email"
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="userType" className="block text-sm font-medium text-gray-700 mb-1">
                I am a... *
              </label>
              <select
                id="userType"
                name="userType"
                value={formData.userType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-sm"
              >
                <option value="landlord">Property Owner/Landlord</option>
                <option value="tenant">Tenant/Renter</option>
                <option value="contractor">Contractor/Service Provider</option>
                <option value="property_manager">Property Manager</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-sm ${
                  errors.phoneNumber ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="(555) 123-4567"
              />
              {errors.phoneNumber && <p className="mt-1 text-xs text-red-600">{errors.phoneNumber}</p>}
            </div>
          </div>

          {/* Terms Agreement */}
          <div>
            <label className="flex items-start">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded mt-0.5 flex-shrink-0"
              />
              <span className="ml-3 text-xs text-gray-700">
                I agree to PropAgentic's{' '}
                <a href="/terms" className="text-orange-600 hover:text-orange-700 underline" target="_blank">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy" className="text-orange-600 hover:text-orange-700 underline" target="_blank">
                  Privacy Policy
                </a>
                . I consent to receiving updates via email. *
              </span>
            </label>
            {errors.terms && <p className="mt-1 text-xs text-red-600">{errors.terms}</p>}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 ${
              isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 shadow-lg hover:shadow-xl'
            } text-white`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Joining Waitlist...
              </span>
            ) : (
              'Join the Waitlist'
            )}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-3">
          🔒 Your information is secure and will never be shared.
        </p>
      </div>
    );
  }

  // Full form for dedicated waitlist page
  return (
    <div id="waitlist" className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Join the PropAgentic Waitlist
        </h2>
        <p className="text-gray-600">
          Be among the first to experience the future of property management. 
          Get early access, exclusive updates, and special launch pricing.
        </p>
      </div>

      {errors.submit && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {errors.submit}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter your full name"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                errors.email ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter your email"
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                errors.phoneNumber ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="(555) 123-4567"
            />
            {errors.phoneNumber && <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>}
          </div>

          <div>
            <label htmlFor="userType" className="block text-sm font-medium text-gray-700 mb-2">
              I am a... *
            </label>
            <select
              id="userType"
              name="userType"
              value={formData.userType}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
            >
              <option value="landlord">Property Owner/Landlord</option>
              <option value="tenant">Tenant/Renter</option>
              <option value="contractor">Contractor/Service Provider</option>
              <option value="property_manager">Property Manager</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Additional Info for Landlords */}
        {formData.userType === 'landlord' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="propertyCount" className="block text-sm font-medium text-gray-700 mb-2">
                Number of Properties
              </label>
              <select
                id="propertyCount"
                name="propertyCount"
                value={formData.propertyCount}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
              >
                <option value="">Select range</option>
                <option value="1">1 property</option>
                <option value="2-5">2-5 properties</option>
                <option value="6-10">6-10 properties</option>
                <option value="11-25">11-25 properties</option>
                <option value="26+">26+ properties</option>
              </select>
            </div>

            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                Company Name (Optional)
              </label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                placeholder="Your company name"
              />
            </div>
          </div>
        )}

        {/* Interests */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            What features interest you most? (Select all that apply)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {interestOptions.map((option) => (
              <label key={option.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.interests.includes(option.id)}
                  onChange={() => handleInterestChange(option.id)}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <span className="ml-3 text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Referral Source */}
        <div>
          <label htmlFor="referralSource" className="block text-sm font-medium text-gray-700 mb-2">
            How did you hear about PropAgentic?
          </label>
          <select
            id="referralSource"
            name="referralSource"
            value={formData.referralSource}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
          >
            <option value="">Select source</option>
            {referralSources.map((source) => (
              <option key={source} value={source}>{source}</option>
            ))}
          </select>
        </div>

        {/* Terms Agreement */}
        <div>
          <label className="flex items-start">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded mt-1"
            />
            <span className="ml-3 text-sm text-gray-700">
              I agree to PropAgentic's{' '}
              <a href="/terms" className="text-orange-600 hover:text-orange-700 underline" target="_blank">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-orange-600 hover:text-orange-700 underline" target="_blank">
                Privacy Policy
              </a>
              . I consent to receiving updates about PropAgentic via email and SMS. *
            </span>
          </label>
          {errors.terms && <p className="mt-1 text-sm text-red-600">{errors.terms}</p>}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 ${
            isSubmitting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 shadow-lg hover:shadow-xl'
          } text-white`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Joining Waitlist...
            </span>
          ) : (
            'Join the Waitlist'
          )}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        🔒 Your information is secure and will never be shared with third parties.
      </p>
    </div>
  );
};

export default WaitlistForm; 