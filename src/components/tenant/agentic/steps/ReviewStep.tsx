import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircleIcon,
  PencilIcon,
  PhotoIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  ClockIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { 
  Eye, 
  Edit, 
  CheckCircle2, 
  AlertTriangle,
  Clock,
  MapPin,
  FileText,
  Image as ImageIcon,
  ChevronRight
} from 'lucide-react';

interface RequestFormData {
  category?: string;
  subcategory?: string;
  description?: string;
  urgency?: 'low' | 'medium' | 'high' | 'urgent';
  location?: string;
  propertyId?: string;
  images?: File[];
  imageUrls?: string[];
  contactPreference?: 'phone' | 'email' | 'text';
  bestTimeToContact?: string;
  allowEntry?: boolean;
}

interface StepProps {
  formData: RequestFormData;
  updateFormData: (updates: Partial<RequestFormData>) => void;
  onNext: () => void;
  onBack: () => void;
  onSuggestionClick: (suggestion: any) => void;
  errors: Record<string, string>;
  onEditStep?: (step: number) => void;
}

const ReviewStep: React.FC<StepProps> = ({
  formData,
  updateFormData,
  onNext,
  onBack,
  onSuggestionClick,
  errors,
  onEditStep
}) => {
  const [allowEntry, setAllowEntry] = useState(formData.allowEntry || false);
  const [contactPreference, setContactPreference] = useState<"text" | "email" | "phone">(formData.contactPreference || "email");
  const [bestTimeToContact, setBestTimeToContact] = useState(formData.bestTimeToContact || '');

  // Mock properties data
  const properties = [
    { id: '1', name: 'Sunset Apartments - Unit 3A', address: '123 Main St, Apt 3A' },
    { id: '2', name: 'Downtown Loft - Unit B', address: '456 Oak Ave, Unit B' },
    { id: '3', name: 'Garden View Townhouse', address: '789 Pine St' }
  ];

  const urgencyLabels = {
    low: 'Low Priority',
    medium: 'Medium Priority', 
    high: 'High Priority',
    urgent: 'Emergency'
  };

  const urgencyColors = {
    low: 'text-green-700 bg-green-50 border-green-200',
    medium: 'text-yellow-700 bg-yellow-50 border-yellow-200',
    high: 'text-orange-700 bg-orange-50 border-orange-200',
    urgent: 'text-red-700 bg-red-50 border-red-200'
  };

  const handleContactUpdate = () => {
    updateFormData({
      allowEntry,
      contactPreference,
      bestTimeToContact
    });
  };

  const selectedProperty = properties.find(p => p.id === formData.propertyId);

  const urgencyConfig = {
    low: { label: 'Low Priority', color: 'text-green-600', bg: 'bg-green-50', timeline: '3-7 days' },
    medium: { label: 'Medium Priority', color: 'text-yellow-600', bg: 'bg-yellow-50', timeline: '1-3 days' },
    high: { label: 'High Priority', color: 'text-orange-600', bg: 'bg-orange-50', timeline: 'Same day' },
    urgent: { label: 'Emergency', color: 'text-red-600', bg: 'bg-red-50', timeline: 'Immediately' }
  };

  const currentUrgency = formData.urgency ? urgencyConfig[formData.urgency] : null;

  const sections = [
    {
      id: 'category',
      title: 'Issue Category',
      icon: FileText,
      content: formData.category ? (
        <div>
          <span className="font-medium">{formData.category}</span>
          {formData.subcategory && (
            <span className="text-gray-600 dark:text-gray-400"> - {formData.subcategory}</span>
          )}
        </div>
      ) : (
        <span className="text-gray-500 italic">Not specified</span>
      ),
      complete: !!formData.category
    },
    {
      id: 'description',
      title: 'Description',
      icon: FileText,
      content: formData.description ? (
        <div className="text-sm leading-relaxed">
          {formData.description.length > 200 
            ? `${formData.description.substring(0, 200)}...`
            : formData.description
          }
        </div>
      ) : (
        <span className="text-gray-500 italic">No description provided</span>
      ),
      complete: !!formData.description && formData.description.length > 10
    },
    {
      id: 'urgency',
      title: 'Priority Level',
      icon: currentUrgency ? AlertTriangle : Clock,
      content: currentUrgency ? (
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${currentUrgency.bg}`}>
          <span className={`font-medium ${currentUrgency.color}`}>
            {currentUrgency.label}
          </span>
          <span className="text-xs text-gray-600">
            {currentUrgency.timeline}
          </span>
        </div>
      ) : (
        <span className="text-gray-500 italic">Not specified</span>
      ),
      complete: !!formData.urgency
    },
    {
      id: 'location',
      title: 'Location',
      icon: MapPin,
      content: formData.location ? (
        <span className="font-medium">{formData.location}</span>
      ) : (
        <span className="text-gray-500 italic">Not specified</span>
      ),
      complete: !!formData.location
    },
    {
      id: 'media',
      title: 'Photos',
      icon: ImageIcon,
      content: formData.images && formData.images.length > 0 ? (
        <div className="flex items-center gap-2">
          <span className="font-medium">{formData.images.length} photo(s) uploaded</span>
          <div className="flex gap-1">
            {formData.images.slice(0, 3).map((image, index) => (
              <div
                key={index}
                className="w-8 h-8 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden"
              >
                <img
                  src={URL.createObjectURL(image)}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            {formData.images.length > 3 && (
              <div className="w-8 h-8 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs text-gray-600">
                +{formData.images.length - 3}
              </div>
            )}
          </div>
        </div>
      ) : (
        <span className="text-gray-500 italic">No photos uploaded</span>
      ),
      complete: true // Photos are optional
    }
  ];

  const completedSections = sections.filter(section => section.complete).length;
  const completionPercentage = Math.round((completedSections / sections.length) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-16 h-16 mx-auto bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center"
        >
          <CheckCircleIcon className="w-8 h-8 text-orange-600" />
        </motion.div>
        
        <motion.h2 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-[var(--agentic-text-primary)]"
        >
          Review Your Request
        </motion.h2>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-[var(--agentic-text-secondary)] max-w-md mx-auto"
        >
          Please review all details before submitting. You can edit any section if needed.
        </motion.p>
      </div>

      {/* Progress summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-xl border border-green-200 dark:border-green-800"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-green-900 dark:text-green-100">
            Request Summary
          </h3>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              {completionPercentage}% Complete
            </span>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-2 mb-3">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionPercentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="bg-green-600 dark:bg-green-400 h-2 rounded-full"
          />
        </div>
        
        <p className="text-sm text-green-800 dark:text-green-200">
          {completedSections === sections.length 
            ? "All sections completed! Ready to submit your request."
            : `${sections.length - completedSections} section(s) need attention.`
          }
        </p>
      </motion.div>

      {/* Review sections */}
      <div className="space-y-4">
        {sections.map((section, index) => {
          const IconComponent = section.icon;
          
          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                section.complete
                  ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10'
                  : 'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/10'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`p-2 rounded-lg ${
                    section.complete 
                      ? 'bg-green-100 dark:bg-green-900/20' 
                      : 'bg-orange-100 dark:bg-orange-900/20'
                  }`}>
                    <IconComponent className={`w-4 h-4 ${
                      section.complete 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-orange-600 dark:text-orange-400'
                    }`} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {section.title}
                      </h4>
                      {section.complete ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      )}
                    </div>
                    
                    <div className="text-gray-700 dark:text-gray-300">
                      {section.content}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => onEditStep?.(index + 1)}
                  className={`p-2 rounded-lg transition-colors ${
                    section.complete
                      ? 'text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/20'
                      : 'text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/20'
                  }`}
                  title={`Edit ${section.title}`}
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Contact Preferences */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="space-y-4"
      >
        <h3 className="font-semibold text-[var(--agentic-text-primary)]">Contact Preferences</h3>
        
        <div className="bg-[var(--agentic-bg-secondary)] border border-[var(--agentic-border)] rounded-xl p-4 space-y-4">
          {/* Contact Method */}
          <div>
            <label className="block text-sm font-medium text-[var(--agentic-text-primary)] mb-2">
              Preferred Contact Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'email', label: 'Email', icon: '📧' },
                { value: 'phone', label: 'Phone', icon: '📞' },
                { value: 'text', label: 'Text', icon: '💬' }
              ].map((method) => (
                <button
                  key={method.value}
                  onClick={() => {
                    setContactPreference(method.value as "text" | "email" | "phone");
                    handleContactUpdate();
                  }}
                  className={`p-3 rounded-lg border-2 transition-all text-center ${
                    contactPreference === method.value
                      ? 'border-orange-300 bg-orange-50 text-orange-700'
                      : 'border-[var(--agentic-border)] hover:border-orange-200 text-[var(--agentic-text-primary)]'
                  }`}
                >
                  <div className="text-lg">{method.icon}</div>
                  <div className="text-sm font-medium">{method.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Best Time to Contact */}
          <div>
            <label className="block text-sm font-medium text-[var(--agentic-text-primary)] mb-2">
              Best Time to Contact
            </label>
            <select
              value={bestTimeToContact}
              onChange={(e) => {
                setBestTimeToContact(e.target.value);
                handleContactUpdate();
              }}
              className="w-full p-3 rounded-lg border border-[var(--agentic-border)] bg-[var(--agentic-bg-primary)] focus:border-orange-300 focus:outline-none"
            >
              <option value="">No preference</option>
              <option value="morning">Morning (8AM - 12PM)</option>
              <option value="afternoon">Afternoon (12PM - 6PM)</option>
              <option value="evening">Evening (6PM - 9PM)</option>
              <option value="weekends">Weekends only</option>
            </select>
          </div>

          {/* Allow Entry */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="allowEntry"
              checked={allowEntry}
              onChange={(e) => {
                setAllowEntry(e.target.checked);
                handleContactUpdate();
              }}
              className="mt-1 w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
            />
            <div>
              <label htmlFor="allowEntry" className="text-sm font-medium text-[var(--agentic-text-primary)]">
                Allow property entry without tenant present
              </label>
              <p className="text-xs text-[var(--agentic-text-secondary)] mt-1">
                Check this if maintenance can be performed when you're not home
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Urgency Notice */}
      {formData.urgency === 'urgent' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl p-4"
        >
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-600 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-red-800 mb-1">Emergency Request</h4>
              <p className="text-sm text-red-700">
                This request has been marked as urgent and will receive immediate attention.
                If this is a life-threatening emergency, please call 911 immediately.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Error Display */}
      {Object.keys(errors).length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-red-50 border border-red-200 rounded-xl p-4"
        >
          <h4 className="font-medium text-red-800 mb-2">Please fix the following issues:</h4>
          <ul className="text-sm text-red-600 space-y-1">
            {Object.entries(errors).map(([field, message]) => (
              <li key={field}>• {message}</li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Next steps preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-800"
      >
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-3">
          What happens next?
        </h4>
        <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <div className="flex items-start gap-2">
            <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span>Your request will be automatically routed to the appropriate team</span>
          </div>
          <div className="flex items-start gap-2">
            <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span>You'll receive a confirmation with a tracking number via email</span>
          </div>
          <div className="flex items-start gap-2">
            <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span>
              {currentUrgency 
                ? `Expected response time: ${currentUrgency.timeline}`
                : 'Response time will depend on priority level'
              }
            </span>
          </div>
          <div className="flex items-start gap-2">
            <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span>You can track progress and communicate with the team through your dashboard</span>
          </div>
        </div>
      </motion.div>

      {/* Estimated timeline */}
      {currentUrgency && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className={`p-4 rounded-xl border ${
            formData.urgency === 'urgent' 
              ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10'
              : currentUrgency.bg + ' border-gray-200 dark:border-gray-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <Clock className={`w-5 h-5 ${currentUrgency.color}`} />
            <div>
              <h5 className={`font-medium ${currentUrgency.color}`}>
                Estimated Timeline: {currentUrgency.timeline}
              </h5>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {formData.urgency === 'urgent' && "Emergency requests receive immediate attention."}
                {formData.urgency === 'high' && "High priority requests are addressed the same business day."}
                {formData.urgency === 'medium' && "Medium priority requests are typically handled within 1-3 business days."}
                {formData.urgency === 'low' && "Low priority requests are scheduled within the next week."}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Navigation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="flex justify-between pt-6"
      >
        <button
          onClick={onBack}
          className="px-6 py-3 border border-[var(--agentic-border)] rounded-xl text-[var(--agentic-text-primary)] hover:bg-[var(--agentic-hover)] transition-all"
        >
          Back
        </button>
        
        <button
          onClick={onNext}
          className="px-8 py-3 rounded-xl font-medium transition-all transform hover:scale-105 bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl"
        >
          Submit Request
        </button>
      </motion.div>
    </motion.div>
  );
};

export default ReviewStep;
