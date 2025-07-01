import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { addToWaitlist } from '../services/waitlistService';
import Button from '../components/ui/Button';

interface LandlordWaitlistFormData {
  name: string;
  email: string;
  phoneNumber: string;
  companyName?: string;
  properties: string;
  experience: 'first-time' | '1-5-properties' | '5-10-properties' | '10-plus-properties';
}

type FormErrors = {
  [key in keyof Partial<LandlordWaitlistFormData>]: string;
};

const LandlordWaitlistPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<LandlordWaitlistFormData>({
    name: '',
    email: '',
    phoneNumber: '',
    companyName: '',
    properties: '',
    experience: '' as LandlordWaitlistFormData['experience'],
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters long.';
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address.';
    }
    
    if (!/^\d{10}$/.test(formData.phoneNumber.replace(/\D/g, ''))) {
      newErrors.phoneNumber = 'Please enter a valid 10-digit phone number.';
    }
    
    if (!formData.experience) {
      newErrors.experience = 'Please select your property management experience.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting.');
      return;
    }

    setIsLoading(true);
    try {
      await addToWaitlist({
        email: formData.email,
        role: 'landlord',
        name: formData.name,
        source: 'landlord-waitlist',
        userId: null,
        subscribed_to_newsletter: true,
        marketing_consent: true,
        early_access: true,
      });
      
      toast.success('Registration successful! We will contact you soon.');
      navigate('/'); // Redirect back to home page
    } catch (error: any) {
      toast.error(error.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const experienceOptions: LandlordWaitlistFormData['experience'][] = [
    'first-time', '1-5-properties', '5-10-properties', '10-plus-properties'
  ];

  const formatExperienceLabel = (value: string): string => {
    switch (value) {
      case 'first-time': return 'First-time landlord';
      case '1-5-properties': return '1-5 properties';
      case '5-10-properties': return '5-10 properties';
      case '10-plus-properties': return '10+ properties';
      default: return value;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full bg-white p-8 md:p-10 rounded-xl shadow-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            ← Back to Home
          </button>
          <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
            Join Our Landlord Network
          </div>
          <p className="text-gray-600">
            Register as a landlord to get early access to PropAgentic's property management platform.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name and Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="John Doe"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="john@example.com"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>
          </div>

          {/* Phone and Company */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="(555) 123-4567"
              />
              {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>}
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
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="ABC Property Management"
              />
            </div>
          </div>

          {/* Experience Level */}
          <div>
            <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-2">
              Property Management Experience <span className="text-red-500">*</span>
            </label>
            <select
              id="experience"
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select your experience level</option>
              {experienceOptions.map((option) => (
                <option key={option} value={option}>
                  {formatExperienceLabel(option)}
                </option>
              ))}
            </select>
            {errors.experience && <p className="text-red-500 text-sm mt-1">{errors.experience}</p>}
          </div>

          {/* Properties Description */}
          <div>
            <label htmlFor="properties" className="block text-sm font-medium text-gray-700 mb-2">
              Tell us about your properties
            </label>
            <textarea
              id="properties"
              name="properties"
              value={formData.properties}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 3 single-family homes in Austin, TX. Looking to streamline maintenance requests and tenant communication."
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
            disabled={isLoading}
          >
            {isLoading ? 'Submitting...' : 'Submit Registration'}
          </Button>
        </form>

        {/* What happens next */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 mb-2">What happens next?</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• We'll review your registration within 1-2 business days</li>
            <li>• Our team will contact you to discuss your property management needs</li>
            <li>• You'll get early access to PropAgentic when we launch</li>
            <li>• Receive updates on new features and property management tips</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LandlordWaitlistPage; 