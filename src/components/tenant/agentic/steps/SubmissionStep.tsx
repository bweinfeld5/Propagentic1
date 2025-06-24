import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  Loader, 
  AlertTriangle,
  Mail,
  Phone,
  MessageSquare,
  Calendar,
  ExternalLink,
  Copy,
  ChevronRight,
  Sparkles
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

interface SubmissionStepProps {
  formData: RequestFormData;
  isSubmitting: boolean;
  onComplete?: (requestId: string) => void;
}

export const SubmissionStep: React.FC<SubmissionStepProps> = ({
  formData,
  isSubmitting,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<string>('');
  const [assignedTeam, setAssignedTeam] = useState<string>('');
  const [copiedRequestId, setCopiedRequestId] = useState(false);

  const submissionSteps = [
    { 
      id: 'validating', 
      label: 'Validating request details', 
      description: 'Checking all information and attachments',
      duration: 2000 
    },
    { 
      id: 'analyzing', 
      label: 'AI analyzing your request', 
      description: 'Determining priority and routing',
      duration: 3000 
    },
    { 
      id: 'routing', 
      label: 'Routing to appropriate team', 
      description: 'Connecting with the right specialists',
      duration: 2500 
    },
    { 
      id: 'scheduling', 
      label: 'Estimating timeline', 
      description: 'Calculating response and resolution times',
      duration: 1500 
    },
    { 
      id: 'complete', 
      label: 'Request submitted successfully', 
      description: 'You will receive confirmation shortly',
      duration: 0 
    }
  ];

  // Simulate submission process
  useEffect(() => {
    if (!isSubmitting) return;

    let stepIndex = 0;
    
    const processStep = () => {
      if (stepIndex < submissionSteps.length - 1) {
        setCurrentStep(stepIndex);
        
        setTimeout(() => {
          stepIndex++;
          processStep();
        }, submissionSteps[stepIndex].duration);
      } else {
        // Final step - generate mock data
        const mockRequestId = `REQ-${Date.now().toString().slice(-6)}`;
        setRequestId(mockRequestId);
        setCurrentStep(stepIndex);
        
        // Generate estimated time based on urgency
        const urgencyTimes = {
          urgent: 'within 1 hour',
          high: 'within 4 hours',
          medium: 'within 24 hours',
          low: 'within 3-5 business days'
        };
        setEstimatedTime(urgencyTimes[formData.urgency || 'medium']);
        
        // Assign team based on category
        const categoryTeams = {
          plumbing: 'Plumbing Specialists',
          electrical: 'Electrical Team',
          hvac: 'HVAC Technicians',
          appliance: 'Appliance Repair',
          general: 'General Maintenance'
        };
        setAssignedTeam(categoryTeams[formData.category as keyof typeof categoryTeams] || 'General Maintenance');
        
        if (onComplete) {
          onComplete(mockRequestId);
        }
      }
    };

    processStep();
  }, [isSubmitting, formData, onComplete]);

  const copyRequestId = async () => {
    if (requestId) {
      try {
        await navigator.clipboard.writeText(requestId);
        setCopiedRequestId(true);
        setTimeout(() => setCopiedRequestId(false), 2000);
      } catch (err) {
        console.error('Failed to copy request ID:', err);
      }
    }
  };

  if (!isSubmitting && currentStep < submissionSteps.length - 1) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">
          Ready to submit your maintenance request
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Submission progress */}
      {currentStep < submissionSteps.length - 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6"
        >
          {/* Progress indicator */}
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-20 h-20 mx-auto mb-4"
            >
              <div className="w-full h-full rounded-full border-4 border-gray-200 dark:border-gray-700">
                <div className="w-full h-full rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
              </div>
            </motion.div>
            
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Sparkles className="w-6 h-6 text-orange-500" />
            </motion.div>
          </div>

          {/* Current step */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {submissionSteps[currentStep]?.label}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {submissionSteps[currentStep]?.description}
            </p>
          </div>

          {/* Progress steps */}
          <div className="max-w-md mx-auto">
            <div className="flex justify-between items-center">
              {submissionSteps.slice(0, -1).map((step, index) => (
                <div
                  key={step.id}
                  className="flex flex-col items-center"
                >
                  <div className={`w-3 h-3 rounded-full transition-colors ${
                    index <= currentStep 
                      ? 'bg-orange-500' 
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`} />
                  <span className="text-xs text-gray-500 dark:text-gray-500 mt-1 text-center max-w-16">
                    {step.label.split(' ')[0]}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2">
              {submissionSteps.slice(0, -2).map((_, index) => (
                <div
                  key={index}
                  className={`h-0.5 flex-1 mx-1 transition-colors ${
                    index < currentStep 
                      ? 'bg-orange-500' 
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Success state */}
      {currentStep === submissionSteps.length - 1 && requestId && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          {/* Success icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center"
          >
            <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
          </motion.div>

          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Request Submitted Successfully!
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Your maintenance request has been received and is being processed
            </p>
          </div>

          {/* Request ID */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Request ID</span>
                <div className="font-mono text-lg font-bold text-gray-900 dark:text-gray-100">
                  {requestId}
                </div>
              </div>
              <button
                onClick={copyRequestId}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                title="Copy request ID"
              >
                {copiedRequestId ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>
            {copiedRequestId && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-green-600 dark:text-green-400 mt-1"
              >
                Copied to clipboard!
              </motion.p>
            )}
          </motion.div>

          {/* Assignment info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-blue-900 dark:text-blue-100">
                  Expected Response
                </span>
              </div>
              <p className="text-blue-800 dark:text-blue-200">
                {estimatedTime}
              </p>
            </div>
            
            <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-2">
                <ChevronRight className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="font-medium text-purple-900 dark:text-purple-100">
                  Assigned Team
                </span>
              </div>
              <p className="text-purple-800 dark:text-purple-200">
                {assignedTeam}
              </p>
            </div>
          </motion.div>

          {/* Next steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl text-left"
          >
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
              What happens next?
            </h4>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-start gap-2">
                <Mail className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span>You'll receive a confirmation email with all the details</span>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span>Our team will contact you to schedule if needed</span>
              </div>
              <div className="flex items-start gap-2">
                <MessageSquare className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span>Track progress and communicate through your dashboard</span>
              </div>
            </div>
          </motion.div>

          {/* Action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <button
              onClick={() => window.location.reload()}
              className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors font-medium"
            >
              Submit Another Request
            </button>
            <button
              onClick={() => {
                // Navigate to dashboard or tracking page
                console.log('Navigate to dashboard');
              }}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              View Dashboard
              <ExternalLink className="w-4 h-4" />
            </button>
          </motion.div>
        </motion.div>
      )}

      {/* Error state (if needed) */}
      {!isSubmitting && currentStep === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4 p-6 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-800"
        >
          <AlertTriangle className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto" />
          <div>
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
              Submission Failed
            </h3>
            <p className="text-red-800 dark:text-red-200">
              There was an error submitting your request. Please try again.
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </motion.div>
      )}
    </div>
  );
};
