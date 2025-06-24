import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { AgenticContainer } from '../../ui/agentic/AgenticContainer';
import { ConversationFlow, ConversationStep } from '../../ui/agentic/ConversationFlow';
import { CommandPalette, CommandItem } from '../../ui/agentic/CommandPalette';
import { SmartSuggestions, Suggestion } from '../../ui/agentic/SmartSuggestions';
import { motion } from 'framer-motion';
import { Command, HelpCircle, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

// Import step components
import { WelcomeStep } from './steps/WelcomeStep';
import { CategoryStep } from './steps/CategoryStep';
import { LocationStep } from './steps/LocationStep';
import DescriptionStep from './steps/DescriptionStep';
import UrgencyStep from './steps/UrgencyStep';
import { MediaStep } from './steps/MediaStep';
import ReviewStep from './steps/ReviewStep';
import { SubmissionStep } from './steps/SubmissionStep';

// Form data interface
export interface RequestFormData {
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

interface AgenticRequestFlowProps {
  onComplete?: (data: RequestFormData) => void;
  onCancel?: () => void;
  propertyId?: string;
}

export const AgenticRequestFlow: React.FC<AgenticRequestFlowProps> = ({
  onComplete,
  onCancel,
  propertyId
}) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState<RequestFormData>({
    propertyId,
    contactPreference: 'email',
    allowEntry: true
  });
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form data
  const updateFormData = (updates: Partial<RequestFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  // Command palette items
  const commands: CommandItem[] = [
    {
      id: 'go-to-welcome',
      title: 'Go to Welcome',
      subtitle: 'Start over from the beginning',
      category: 'Navigation',
      action: () => setCurrentStepIndex(0),
      keywords: ['start', 'begin', 'welcome']
    },
    {
      id: 'go-to-category',
      title: 'Go to Category',
      subtitle: 'Select issue category',
      category: 'Navigation',
      action: () => setCurrentStepIndex(1),
      keywords: ['category', 'type', 'issue']
    },
    {
      id: 'go-to-description',
      title: 'Go to Description',
      subtitle: 'Describe your issue',
      category: 'Navigation',
      action: () => setCurrentStepIndex(2),
      keywords: ['describe', 'explain', 'details']
    },
    {
      id: 'skip-photos',
      title: 'Skip Photo Upload',
      subtitle: 'Continue without adding photos',
      category: 'Actions',
      action: () => {
        if (currentStepIndex === 5) {
          setCurrentStepIndex(6);
        }
      },
      keywords: ['skip', 'photos', 'images']
    },
    {
      id: 'cancel-request',
      title: 'Cancel Request',
      subtitle: 'Exit without submitting',
      category: 'Actions',
      action: () => {
        onCancel?.();
        navigate('/tenant/dashboard');
      },
      keywords: ['cancel', 'exit', 'quit']
    }
  ];

  // Generate suggestions based on current step
  useEffect(() => {
    const generateSuggestions = () => {
      const stepSuggestions: Suggestion[] = [];

      if (currentStepIndex === 2) { // Description step
        stepSuggestions.push(
          {
            id: 'template-1',
            text: 'Water is leaking from under the sink',
            type: 'trending',
            onClick: () => updateFormData({ description: 'Water is leaking from under the sink' })
          },
          {
            id: 'template-2',
            text: 'The AC is not cooling properly',
            type: 'trending',
            onClick: () => updateFormData({ description: 'The AC is not cooling properly' })
          }
        );
      } else if (currentStepIndex === 4) { // Location step
        stepSuggestions.push(
          {
            id: 'location-1',
            text: 'Kitchen',
            type: 'recent',
            onClick: () => updateFormData({ location: 'Kitchen' })
          },
          {
            id: 'location-2',
            text: 'Master Bedroom',
            type: 'recent',
            onClick: () => updateFormData({ location: 'Master Bedroom' })
          }
        );
      }

      setSuggestions(stepSuggestions);
    };

    generateSuggestions();
  }, [currentStepIndex]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Define conversation steps
  const steps: ConversationStep[] = [
    {
      id: 'welcome',
      title: 'Welcome! Let\'s get your issue resolved',
      subtitle: 'We\'re here to help you 24/7',
      content: <WelcomeStep onNext={() => setCurrentStepIndex(1)} />,
      canGoBack: false,
      canProceed: true
    },
    {
      id: 'category',
      title: 'What type of issue are you experiencing?',
      subtitle: 'This helps us assign the right specialist',
      content: (
        <CategoryStep 
          value={formData.category}
          onChange={(category: string, subcategory?: string) => {
            updateFormData({ category, subcategory });
          }}
        />
      ),
      canProceed: !!formData.category
    },
    {
      id: 'description',
      title: 'Tell us more about the issue',
      subtitle: 'The more details, the better we can help',
      content: (
        <DescriptionStep
          formData={formData}
          updateFormData={updateFormData}
          onNext={() => setCurrentStepIndex(3)}
          onBack={() => setCurrentStepIndex(1)}
          onSuggestionClick={(suggestion: any) => {
            updateFormData({ description: suggestion.text });
          }}
          errors={{}}
          suggestions={suggestions.filter(s => currentStepIndex === 2)}
        />
      ),
      canProceed: !!formData.description && formData.description.length >= 10
    },
    {
      id: 'urgency',
      title: 'How urgent is this issue?',
      subtitle: 'We\'ll prioritize accordingly',
      content: (
        <UrgencyStep
          value={formData.urgency}
          onChange={(urgency: 'low' | 'medium' | 'high' | 'urgent') => updateFormData({ urgency })}
          category={formData.category}
          onNext={() => setCurrentStepIndex(4)}
          onBack={() => setCurrentStepIndex(2)}
        />
      ),
      canProceed: !!formData.urgency
    },
    {
      id: 'location',
      title: 'Where is the issue located?',
      subtitle: 'Help us find it quickly',
      content: (
        <LocationStep
          value={formData.location || ''}
          onChange={(location: string) => updateFormData({ location })}
          propertyId={formData.propertyId}
          suggestions={suggestions.filter(s => currentStepIndex === 4)}
        />
      ),
      canProceed: !!formData.location
    },
    {
      id: 'media',
      title: 'Add photos (optional)',
      subtitle: 'Visual context helps us prepare better',
      content: (
        <MediaStep
          images={formData.images || []}
          onChange={(images: File[]) => updateFormData({ images })}
          category={formData.category}
        />
      ),
      canProceed: true
    },
    {
      id: 'review',
      title: 'Review your request',
      subtitle: 'Make sure everything looks correct',
      content: (
        <ReviewStep
          formData={formData}
          updateFormData={updateFormData}
          onNext={() => setCurrentStepIndex(7)}
          onBack={() => setCurrentStepIndex(5)}
          onSuggestionClick={(suggestion: any) => {
            updateFormData({ description: suggestion.text });
          }}
          errors={{}}
          onEditStep={(step: number) => {
            // Navigate to appropriate step for editing
            const stepMap: Record<string, number> = {
              category: 1,
              location: 2,
              description: 3,
              urgency: 4,
              media: 5
            };
            
            const targetStep = Object.keys(stepMap).find(key => stepMap[key] === step);
            if (targetStep) {
              setCurrentStepIndex(step - 1);
            }
          }}
        />
      ),
      canProceed: true
    },
    {
      id: 'submission',
      title: 'Submitting your request',
      subtitle: 'Almost done!',
      content: (
        <SubmissionStep
          formData={formData}
          isSubmitting={currentStepIndex === 7 ? true : isSubmitting}
          onComplete={(requestId) => {
            setIsSubmitting(false);
            onComplete?.(formData);
            toast.success(`Request submitted successfully! ID: ${requestId}`);
            // Stay on the completion view to show success
          }}
        />
      ),
      canGoBack: false,
      canProceed: false
    }
  ];

  return (
    <AgenticContainer className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <Sparkles className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  New Maintenance Request
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  AI-powered assistance to get help faster
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCommandPaletteOpen(true)}
                className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Command Palette (⌘K)"
              >
                <Command className="w-5 h-5" />
              </button>
              <button
                className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Help"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Main content area */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-8"
        >
          <ConversationFlow
            steps={steps}
            currentStepIndex={currentStepIndex}
            onStepChange={setCurrentStepIndex}
          />
        </motion.div>

        {/* Smart suggestions sidebar */}
        {suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6"
          >
            <SmartSuggestions
              suggestions={suggestions}
              title="Quick Suggestions"
              className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-4"
            />
          </motion.div>
        )}
      </div>

      {/* Command palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        commands={commands}
      />
    </AgenticContainer>
  );
}; 