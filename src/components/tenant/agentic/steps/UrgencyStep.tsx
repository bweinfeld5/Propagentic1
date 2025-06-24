import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ExclamationTriangleIcon,
  ClockIcon,
  ShieldExclamationIcon,
  FireIcon
} from '@heroicons/react/24/outline';

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
}

interface UrgencyStepProps {
  value?: 'low' | 'medium' | 'high' | 'urgent';
  onChange: (urgency: 'low' | 'medium' | 'high' | 'urgent') => void;
  category?: string;
  onNext: () => void;
  onBack: () => void;
}

const UrgencyStep: React.FC<UrgencyStepProps> = ({
  value,
  onChange,
  category,
  onNext,
  onBack
}) => {
  const [selectedUrgency, setSelectedUrgency] = useState(value || 'low');

  const updateFormData = (data: any) => {
    onChange(data.urgency);
  };

  const onSuggestionClick = (suggestion: any) => {
    // Handle suggestion clicks
  };

  const urgencyLevels = [
    {
      value: 'low',
      label: 'Low Priority',
      description: 'Can wait a week or more',
      color: 'text-green-700',
      borderColor: 'border-green-300',
      bgColor: 'bg-gradient-to-br from-green-50 to-green-100',
      icon: ClockIcon,
      timeline: '1-2 weeks',
      examples: ['Cosmetic issues', 'Non-urgent repairs', 'Routine maintenance']
    },
    {
      value: 'medium',
      label: 'Medium Priority', 
      description: 'Should be addressed within a few days',
      color: 'text-yellow-700',
      borderColor: 'border-yellow-300',
      bgColor: 'bg-gradient-to-br from-yellow-50 to-yellow-100',
      icon: ExclamationTriangleIcon,
      timeline: '2-5 days',
      examples: ['Appliance malfunctions', 'Minor leaks', 'Temperature issues']
    },
    {
      value: 'high',
      label: 'High Priority',
      description: 'Needs attention within 24 hours',
      color: 'text-orange-700',
      borderColor: 'border-orange-300', 
      bgColor: 'bg-gradient-to-br from-orange-50 to-orange-100',
      icon: ShieldExclamationIcon,
      timeline: 'Within 24 hours',
      examples: ['Major leaks', 'Heating/cooling failures', 'Security issues']
    },
    {
      value: 'urgent',
      label: 'Emergency',
      description: 'Immediate attention required',
      color: 'text-red-700',
      borderColor: 'border-red-300',
      bgColor: 'bg-gradient-to-br from-red-50 to-red-100',
      icon: FireIcon,
      timeline: 'Immediate',
      examples: ['Gas leaks', 'Electrical hazards', 'Burst pipes', 'Security emergencies']
    }
  ];

  const handleUrgencySelect = (urgency: string) => {
    setSelectedUrgency(urgency as any);
    updateFormData({ urgency: urgency as any });
    onSuggestionClick({ type: 'urgency', urgency });
  };

  const selectedLevel = urgencyLevels.find(level => level.value === selectedUrgency);

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
          <ExclamationTriangleIcon className="w-8 h-8 text-orange-600" />
        </motion.div>
        
        <motion.h2 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-[var(--agentic-text-primary)]"
        >
          Set Priority Level
        </motion.h2>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-[var(--agentic-text-secondary)] max-w-md mx-auto"
        >
          Help us understand how quickly this needs to be addressed.
        </motion.p>
      </div>

      {/* Urgency Level Selection */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="space-y-4"
      >
        {urgencyLevels.map((level, index) => {
          const Icon = level.icon;
          const isSelected = selectedUrgency === level.value;
          
          return (
            <motion.button
              key={level.value}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              onClick={() => handleUrgencySelect(level.value)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all group hover:scale-[1.02] ${
                isSelected
                  ? `${level.borderColor} ${level.bgColor} shadow-lg`
                  : 'border-[var(--agentic-border)] hover:border-orange-200 bg-[var(--agentic-bg-secondary)]'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${
                  isSelected ? level.bgColor : 'bg-[var(--agentic-bg-primary)]'
                }`}>
                  <Icon className={`w-6 h-6 ${
                    isSelected ? level.color : 'text-[var(--agentic-text-secondary)]'
                  }`} />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`font-semibold ${
                      isSelected ? level.color : 'text-[var(--agentic-text-primary)]'
                    }`}>
                      {level.label}
                    </h3>
                    <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                      isSelected 
                        ? `${level.color} bg-white/50` 
                        : 'text-[var(--agentic-text-secondary)] bg-[var(--agentic-bg-primary)]'
                    }`}>
                      {level.timeline}
                    </span>
                  </div>
                  
                  <p className={`text-sm mb-3 ${
                    isSelected ? level.color : 'text-[var(--agentic-text-secondary)]'
                  }`}>
                    {level.description}
                  </p>
                  
                  <div className="text-xs">
                    <span className={`font-medium ${
                      isSelected ? level.color : 'text-[var(--agentic-text-secondary)]'
                    }`}>
                      Examples: 
                    </span>
                    <span className={`ml-1 ${
                      isSelected ? level.color : 'text-[var(--agentic-text-secondary)]'
                    }`}>
                      {level.examples.join(', ')}
                    </span>
                  </div>
                </div>
                
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex-shrink-0"
                  >
                    <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Navigation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
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
          disabled={!selectedUrgency}
          className={`px-8 py-3 rounded-xl font-medium transition-all transform hover:scale-105 ${
            selectedUrgency
              ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Continue
        </button>
      </motion.div>
    </motion.div>
  );
};

export default UrgencyStep;
