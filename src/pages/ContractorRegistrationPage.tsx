import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ContractorWaitlistEntry } from '../models/ContractorRegistration';
import { registerContractorForWaitlist } from '../services/firestore/contractorService';
import TradesSelector from '../components/contractor/TradesSelector';
import BusinessAutocomplete from '../components/contractor/BusinessAutocomplete';
import { BusinessInfo } from '../services/placesService';
import Button from '../components/ui/Button';

type FormErrors = {
  [key in keyof Partial<ContractorWaitlistEntry>]: string;
};

const ContractorRegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    email: '',
    trades: [] as string[],
    experience: '' as ContractorWaitlistEntry['experience'],
    serviceArea: '',
    businessName: '',
  });
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessInfo | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters long.';
    }
    // Basic phone validation (e.g., 10 digits)
    if (!/^\d{10}$/.test(formData.phoneNumber.replace(/\D/g, ''))) {
      newErrors.phoneNumber = 'Please enter a valid 10-digit phone number.';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (formData.trades.length === 0) {
      newErrors.trades = 'Please select at least one trade.';
    }
    if (!formData.experience) {
      newErrors.experience = 'Please select your years of experience.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTradesChange = (trades: string[]) => {
    setFormData(prev => ({ ...prev, trades }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting.');
      return;
    }

    setIsLoading(true);
    try {
      await registerContractorForWaitlist({
        ...formData,
        experience: formData.experience as ContractorWaitlistEntry['experience'],
      });
      toast.success('Registration successful! We will contact you soon.');
      navigate('/'); // Redirect back to home page
    } catch (error: any) {
      toast.error(error.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const experienceOptions: ContractorWaitlistEntry['experience'][] = [
    'under-1-year', '1-3-years', '3-5-years', '5-10-years', '10-plus-years'
  ];

  const formatExperienceLabel = (value: string): string => {
    switch (value) {
      case 'under-1-year': return 'Under 1 year';
      case '1-3-years': return '1-3 years';
      case '3-5-years': return '3-5 years';
      case '5-10-years': return '5-10 years';
      case '10-plus-years': return '10+ years';
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
            Join Our Contractor Network
          </div>
          <p className="text-gray-600">
            Register as a contractor to get access to exclusive job opportunities in the PropAgentic network.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-6">
            {/* Name and Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="(555) 123-4567"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
                {errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>}
              </div>
            </div>

            {/* Email and Service Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <label htmlFor="serviceArea" className="block text-sm font-medium text-gray-700">
                  Service Area / City
                </label>
                <input
                  type="text"
                  name="serviceArea"
                  id="serviceArea"
                  value={formData.serviceArea}
                  onChange={handleChange}
                  placeholder="e.g., San Francisco Bay Area"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Experience */}
            <div>
              <label htmlFor="experience" className="block text-sm font-medium text-gray-700">
                Years of Experience <span className="text-red-500">*</span>
              </label>
              <select
                name="experience"
                id="experience"
                value={formData.experience}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="" disabled>Select your experience level</option>
                {experienceOptions.map(opt => (
                  <option key={opt} value={opt}>
                    {formatExperienceLabel(opt)}
                  </option>
                ))}
              </select>
              {errors.experience && <p className="text-red-500 text-xs mt-1">{errors.experience}</p>}
            </div>

            {/* Trades Selector */}
            <div>
              <TradesSelector selectedTrades={formData.trades} onChange={handleTradesChange} />
              {errors.trades && <p className="text-red-500 text-xs mt-1">{errors.trades}</p>}
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Submitting...' : 'Submit Registration'}
              </Button>
            </div>
          </div>
        </form>

        {/* Additional Information */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 mb-2">What happens next?</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• We'll review your registration within 1-2 business days</li>
            <li>• Our team will contact you to verify your credentials</li>
            <li>• Once approved, you'll gain access to job opportunities in your area</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ContractorRegistrationPage; 