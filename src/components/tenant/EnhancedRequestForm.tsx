import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import Button from '../ui/Button';
import { 
  Wrench, 
  AlertCircle, 
  Upload, 
  X, 
  Calendar,
  MapPin,
  Phone,
  Clock,
  CheckCircle
} from 'lucide-react';
import dataService from '../../services/dataService';
import { useAuth } from '../../context/AuthContext';

interface FormData {
  title: string;
  description: string;
  category: string;
  urgency: string;
  location: string;
  preferredDate: string;
  preferredTime: string;
  contactPreference: string;
  additionalNotes: string;
  photos: File[];
}

interface EnhancedRequestFormProps {
  onSuccess?: () => void;
  currentUser?: any;
  userProfile?: any;
  propertyId?: string;
}

const EnhancedRequestForm: React.FC<EnhancedRequestFormProps> = ({ 
  onSuccess, 
  currentUser: propCurrentUser, 
  userProfile: propUserProfile,
  propertyId 
}: EnhancedRequestFormProps) => {
  const { currentUser: authCurrentUser, userProfile: authUserProfile } = useAuth();
  const currentUser = propCurrentUser || authCurrentUser;
  const userProfile = propUserProfile || authUserProfile;

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    category: 'general',
    urgency: 'medium',
    location: '',
    preferredDate: '',
    preferredTime: '',
    contactPreference: 'email',
    additionalNotes: '',
    photos: []
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const categories = [
    { value: 'general', label: 'General Maintenance', icon: '🔧' },
    { value: 'plumbing', label: 'Plumbing', icon: '🚿' },
    { value: 'electrical', label: 'Electrical', icon: '⚡' },
    { value: 'hvac', label: 'Heating/Cooling', icon: '🌡️' },
    { value: 'appliance', label: 'Appliance', icon: '🔌' },
    { value: 'structural', label: 'Structural', icon: '🏠' },
    { value: 'pest', label: 'Pest Control', icon: '🐛' },
    { value: 'other', label: 'Other', icon: '📝' }
  ];

  const urgencyLevels = [
    { 
      value: 'low', 
      label: 'Low Priority', 
      description: 'Can wait a few days',
      color: 'bg-green-100 border-green-300 text-green-800',
      dotColor: 'bg-green-500'
    },
    { 
      value: 'medium', 
      label: 'Medium Priority', 
      description: 'Within 48 hours',
      color: 'bg-yellow-100 border-yellow-300 text-yellow-800',
      dotColor: 'bg-yellow-500'
    },
    { 
      value: 'high', 
      label: 'High Priority', 
      description: 'Within 24 hours',
      color: 'bg-orange-100 border-orange-300 text-orange-800',
      dotColor: 'bg-orange-500'
    },
    { 
      value: 'emergency', 
      label: 'Emergency', 
      description: 'Immediate attention',
      color: 'bg-red-100 border-red-300 text-red-800',
      dotColor: 'bg-red-500'
    }
  ];

  const contactPreferences = [
    { value: 'email', label: 'Email', icon: '📧' },
    { value: 'phone', label: 'Phone Call', icon: '📞' },
    { value: 'text', label: 'Text Message', icon: '💬' },
    { value: 'app', label: 'In-App Message', icon: '📱' }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: FormData) => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData((prev: FormData) => ({
      ...prev,
      photos: [...prev.photos, ...files].slice(0, 5) // Limit to 5 photos
    }));
  };

  const removePhoto = (index: number) => {
    setFormData((prev: FormData) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const ticketData = {
        issueTitle: formData.title,
        description: formData.description,
        category: formData.category,
        urgency: formData.urgency,
        location: formData.location,
        status: 'open',
        submittedBy: currentUser?.uid || 'demo-user',
        submittedByName: userProfile?.name || userProfile?.email || 'Demo User',
        propertyId: propertyId || userProfile?.propertyId || 'demo-property',
        preferredDate: formData.preferredDate,
        preferredTime: formData.preferredTime,
        contactPreference: formData.contactPreference,
        additionalNotes: formData.additionalNotes,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await dataService.createTicket(ticketData);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: 'general',
        urgency: 'medium',
        location: '',
        preferredDate: '',
        preferredTime: '',
        contactPreference: 'email',
        additionalNotes: '',
        photos: []
      });
      setCurrentStep(1);
      
      if (onSuccess) {
        onSuccess();
      }
      
      toast.success('Maintenance request submitted successfully!');
    } catch (error) {
      console.error('Error submitting maintenance request:', error);
      toast.error('Failed to submit maintenance request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.title && formData.description;
      case 2:
        return true; // Optional fields
      case 3:
        return true; // Optional fields
      default:
        return false;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
            <Wrench className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">New Maintenance Request</h3>
            <p className="text-orange-100 text-sm mt-1">Submit a request and we'll handle it promptly</p>
          </div>
        </div>
        
        {/* Progress Indicator */}
        <div className="mt-6 flex items-center justify-between">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex-1 flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                currentStep >= step 
                  ? 'bg-white text-orange-600 border-white' 
                  : 'bg-transparent text-white/70 border-white/30'
              }`}>
                {currentStep > step ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-medium">{step}</span>
                )}
              </div>
              {step < 3 && (
                <div className={`flex-1 h-1 mx-2 rounded-full ${
                  currentStep > step ? 'bg-white' : 'bg-white/30'
                }`} />
              )}
            </div>
          ))}
        </div>
        
        {/* Step Labels */}
        <div className="mt-2 flex justify-between text-xs text-orange-100">
          <span>Issue Details</span>
          <span>Preferences</span>
          <span>Review</span>
        </div>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="p-6">
        {/* Step 1: Issue Details */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What's the issue? <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Leaky faucet in kitchen"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setFormData((prev: FormData) => ({ ...prev, category: cat.value }))}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.category === cat.value
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-2xl">{cat.icon}</span>
                    <p className="text-xs mt-1 font-medium text-gray-700">{cat.label}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Urgency Level
              </label>
              <div className="space-y-2">
                {urgencyLevels.map((level) => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => setFormData((prev: FormData) => ({ ...prev, urgency: level.value }))}
                    className={`w-full p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
                      formData.urgency === level.value
                        ? level.color + ' border-current'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full ${level.dotColor}`} />
                    <div className="text-left">
                      <p className="font-medium">{level.label}</p>
                      <p className="text-sm opacity-75">{level.description}</p>
                    </div>
                  </button>
                ))}
              </div>
              {formData.urgency === 'emergency' && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  <p className="text-sm text-red-700">
                    For true emergencies, please call emergency services or your property manager directly at <strong>(555) 123-4567</strong>
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location in Unit
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g., Kitchen, Master Bathroom"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Describe the issue in detail <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="Please provide as much detail as possible..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none"
                required
              />
            </div>
          </div>
        )}

        {/* Step 2: Preferences */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Date for Service
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  name="preferredDate"
                  value={formData.preferredDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Time
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                <select
                  name="preferredTime"
                  value={formData.preferredTime}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all appearance-none"
                >
                  <option value="">Any time</option>
                  <option value="morning">Morning (8AM - 12PM)</option>
                  <option value="afternoon">Afternoon (12PM - 5PM)</option>
                  <option value="evening">Evening (5PM - 8PM)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Contact Method
              </label>
              <div className="grid grid-cols-2 gap-3">
                {contactPreferences.map((pref) => (
                  <button
                    key={pref.value}
                    type="button"
                    onClick={() => setFormData((prev: FormData) => ({ ...prev, contactPreference: pref.value }))}
                    className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 ${
                      formData.contactPreference === pref.value
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-xl">{pref.icon}</span>
                    <span className="text-sm font-medium">{pref.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                name="additionalNotes"
                value={formData.additionalNotes}
                onChange={handleChange}
                rows={3}
                placeholder="Any special instructions or access information..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attach Photos (Optional)
              </label>
              <div className="space-y-3">
                <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <div className="text-center">
                    <Upload className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">Click to upload photos</p>
                    <p className="text-xs text-gray-500">Max 5 photos</p>
                  </div>
                </label>
                
                {formData.photos.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(photo)}
                          alt={`Upload ${index + 1}`}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {currentStep === 3 && (
          <div className="space-y-5">
            <div className="bg-gray-50 rounded-lg p-5">
              <h4 className="font-medium text-gray-900 mb-3">Review Your Request</h4>
              
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm text-gray-600">Issue</dt>
                  <dd className="text-sm font-medium text-gray-900">{formData.title}</dd>
                </div>
                
                <div>
                  <dt className="text-sm text-gray-600">Category</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {categories.find(c => c.value === formData.category)?.label}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm text-gray-600">Urgency</dt>
                  <dd className="text-sm font-medium">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                      urgencyLevels.find(u => u.value === formData.urgency)?.color
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${
                        urgencyLevels.find(u => u.value === formData.urgency)?.dotColor
                      }`} />
                      {urgencyLevels.find(u => u.value === formData.urgency)?.label}
                    </span>
                  </dd>
                </div>
                
                {formData.location && (
                  <div>
                    <dt className="text-sm text-gray-600">Location</dt>
                    <dd className="text-sm font-medium text-gray-900">{formData.location}</dd>
                  </div>
                )}
                
                <div>
                  <dt className="text-sm text-gray-600">Description</dt>
                  <dd className="text-sm text-gray-900">{formData.description}</dd>
                </div>
                
                {formData.preferredDate && (
                  <div>
                    <dt className="text-sm text-gray-600">Preferred Date</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {new Date(formData.preferredDate).toLocaleDateString()}
                    </dd>
                  </div>
                )}
                
                {formData.photos.length > 0 && (
                  <div>
                    <dt className="text-sm text-gray-600">Photos</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {formData.photos.length} photo(s) attached
                    </dd>
                  </div>
                )}
              </dl>
            </div>
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">What happens next?</p>
                  <ul className="mt-1 space-y-1">
                    <li>• Your request will be reviewed within 24 hours</li>
                    <li>• You'll receive a confirmation via {formData.contactPreference}</li>
                    <li>• A maintenance professional will contact you to schedule service</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              currentStep === 1
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Previous
          </button>
          
          <div className="flex gap-3">
            {currentStep < totalSteps ? (
              <Button
                type="button"
                variant="primary"
                onClick={nextStep}
                disabled={!isStepValid()}
              >
                Continue
              </Button>
            ) : (
              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                disabled={isSubmitting || !isStepValid()}
              >
                Submit Request
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default EnhancedRequestForm;