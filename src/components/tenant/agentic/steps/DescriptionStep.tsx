import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PencilIcon, 
  SparklesIcon, 
  MicrophoneIcon,
  DocumentTextIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { Suggestion } from '../../../ui/agentic/SmartSuggestions';
import { Mic, MicOff, Type, Sparkles, RotateCcw, CheckCircle2, Brain, FileText, Lightbulb } from 'lucide-react';

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
  suggestions?: Suggestion[];
}

const DescriptionStep: React.FC<StepProps> = ({
  formData,
  updateFormData,
  onNext,
  onBack,
  onSuggestionClick,
  errors,
  suggestions = []
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<{
    clarity: number;
    details: number;
    urgencyIndicators: string[];
    suggestions: string[];
  } | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Template suggestions based on category
  const templates = {
    plumbing: [
      "Water is leaking from the {location}. It started {timeframe} and seems to be getting worse.",
      "The {fixture} in the {room} is not working properly. Water pressure is very low.",
      "There's a clog in the {location} that won't clear with normal methods."
    ],
    electrical: [
      "The {electrical_item} in the {room} is not working. It stopped working {timeframe}.",
      "Power keeps going out in the {room}. The circuit breaker trips frequently.",
      "Light switch/outlet in {room} is sparking or making unusual sounds."
    ],
    hvac: [
      "The air conditioning/heating is not working properly in {room/unit}.",
      "Temperature is not reaching the set point. System runs constantly but doesn't cool/heat.",
      "Strange noises coming from the HVAC unit. Sounds like {describe_sound}."
    ],
    general: [
      "There's an issue with {item/area} in {location}. It started {timeframe}.",
      "Something needs to be fixed/replaced in {location}. The problem is affecting {impact}.",
      "Maintenance needed for {item}. The issue is {description}."
    ]
  };

  // AI analysis (simulated)
  const analyzeDescription = async (text: string) => {
    if (text.length < 10) return;
    
    setIsAnalyzing(true);
    
    // Simulate AI analysis delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const analysis = {
      clarity: Math.floor(Math.random() * 80) + 20,
      details: Math.floor(Math.random() * 80) + 10,
      urgencyIndicators: text.toLowerCase().includes('emergency') || text.toLowerCase().includes('urgent') ? ['Urgency detected'] : [],
      suggestions: [
        text.length < 50 ? 'Consider adding more specific details' : '',
        !text.toLowerCase().includes('when') ? 'Mention when the issue started' : '',
        !text.toLowerCase().includes('where') ? 'Specify the exact location' : ''
      ].filter(Boolean)
    };
    
    setAnalysisResults(analysis);
    setIsAnalyzing(false);
  };

  // Handle text change with debounced analysis
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.description) {
        analyzeDescription(formData.description);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [formData.description]);

  const handleDescriptionChange = (value: string) => {
    updateFormData({ description: value });
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const applyTemplate = (template: string) => {
    setSelectedTemplate(template);
    updateFormData({ description: template });
    onSuggestionClick({ type: 'template', template });
    setShowTemplates(false);
  };

  const handleVoiceInput = () => {
    if (!isRecording) {
      // Start recording
      setIsRecording(true);
      // In a real implementation, you'd use Web Speech API
      setTimeout(() => {
        setIsRecording(false);
        updateFormData({ description: formData.description + " [Voice input would be processed here]" });
      }, 3000);
    } else {
      setIsRecording(false);
    }
  };

  const currentTemplates = templates[formData.category as keyof typeof templates] || templates.general;

  const canProceed = formData.description && formData.description.length >= 10;

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
          <PencilIcon className="w-8 h-8 text-orange-600" />
        </motion.div>
        
        <motion.h2 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-[var(--agentic-text-primary)]"
        >
          Describe Your Request
        </motion.h2>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-[var(--agentic-text-secondary)] max-w-md mx-auto"
        >
          Tell us what's happening. The more details you provide, the better we can help you.
        </motion.p>
      </div>

      {/* Template Suggestions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="space-y-3"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-[var(--agentic-text-secondary)]">
          <Lightbulb className="w-4 h-4" />
          Quick Templates
        </div>
        
        <div className="grid gap-2">
          {currentTemplates.slice(0, 2).map((template, index) => (
            <motion.button
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              onClick={() => applyTemplate(template)}
              className={`text-left p-3 rounded-xl border-2 transition-all group hover:scale-[1.02] ${
                selectedTemplate === template
                  ? 'border-orange-300 bg-gradient-to-r from-orange-50 to-orange-100'
                  : 'border-[var(--agentic-border)] hover:border-orange-200 bg-[var(--agentic-bg-secondary)]'
              }`}
            >
              <div className="flex items-start gap-2">
                <FileText className="w-4 h-4 text-[var(--agentic-text-secondary)] mt-0.5 flex-shrink-0" />
                <span className="text-sm text-[var(--agentic-text-primary)] group-hover:text-orange-700">
                  {template.replace(/\{[^}]+\}/g, '___')}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Description Input */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="space-y-3"
      >
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={formData.description || ''}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            placeholder="Describe what's happening in detail..."
            className={`w-full min-h-[120px] p-4 rounded-xl resize-none transition-all bg-[var(--agentic-bg-primary)] border-2 focus:outline-none ${
              errors.description
                ? 'border-red-300 focus:border-red-500'
                : 'border-[var(--agentic-border)] focus:border-orange-300'
            }`}
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              lineHeight: '1.6'
            }}
          />
          
          {/* Voice input button */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="p-2 text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Use templates"
            >
              <FileText className="w-4 h-4" />
            </button>
            <button
              onClick={handleVoiceInput}
              className={`p-2 rounded-lg transition-colors ${
                isRecording 
                  ? 'text-red-600 bg-red-100 dark:bg-red-900/20' 
                  : 'text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title={isRecording ? "Stop recording" : "Voice input"}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Character count and validation */}
        <div className="flex justify-between items-center text-sm">
          <span className={`${
            (formData.description?.length || 0) >= 10 
              ? 'text-green-600' 
              : 'text-[var(--agentic-text-secondary)]'
          }`}>
            {formData.description?.length || 0} characters
            {(formData.description?.length || 0) < 10 && ' (minimum 10)'}
          </span>
          
          {canProceed && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1 text-green-600"
            >
              <CheckCircleIcon className="w-4 h-4" />
              <span>Ready to continue</span>
            </motion.div>
          )}
        </div>

        {errors.description && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-600 text-sm"
          >
            {errors.description}
          </motion.p>
        )}
      </motion.div>

      {/* AI Analysis */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600 animate-spin" />
              <span className="text-blue-700 font-medium">AI is analyzing your description...</span>
            </div>
          </motion.div>
        )}

        {analysisResults && !isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 space-y-3"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-700">AI Analysis Complete</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <div className="text-xs text-green-700 mb-1">Clarity Score</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-green-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${analysisResults.clarity}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-green-700">
                    {analysisResults.clarity}%
                  </span>
                </div>
              </div>
              <div>
                <div className="text-xs text-green-700 mb-1">Detail Level</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-green-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${analysisResults.details}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-green-700">
                    {analysisResults.details}%
                  </span>
                </div>
              </div>
            </div>

            {/* Urgency indicators */}
            {analysisResults.urgencyIndicators.length > 0 && (
              <div className="mb-3">
                <div className="text-xs text-green-700 mb-1">Detected</div>
                <div className="flex gap-2">
                  {analysisResults.urgencyIndicators.map((indicator, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs"
                    >
                      {indicator}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {analysisResults.suggestions.length > 0 && (
              <div>
                <div className="text-xs text-green-700 mb-2">Suggestions</div>
                <ul className="space-y-1">
                  {analysisResults.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-xs text-green-800 flex items-start gap-2">
                      <CheckCircle2 className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick suggestions from props */}
      {suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <div className="text-sm font-medium text-gray-700">
            Quick Suggestions
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={suggestion.onClick}
                className="px-3 py-2 bg-white border border-gray-200 rounded-lg hover:border-orange-300"
              >
                {suggestion.text}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Voice recording indicator */}
      {isRecording && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <div className="bg-white rounded-2xl p-8 shadow-2xl text-center">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <Mic className="w-8 h-8 text-red-600" />
            </motion.div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Listening...
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Describe your maintenance issue clearly
            </p>
            <button
              onClick={() => setIsRecording(false)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Stop Recording
            </button>
          </div>
        </motion.div>
      )}

      {/* Templates section */}
      {showTemplates && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <div className="p-4 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/10 dark:to-yellow-900/10 rounded-xl border border-orange-200 dark:border-orange-800">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span className="text-sm font-medium text-orange-900 dark:text-orange-100">
                Quick Templates for {formData.category || 'General'} Issues
              </span>
            </div>
            <div className="space-y-2">
              {currentTemplates.map((template, index) => (
                <button
                  key={index}
                  onClick={() => applyTemplate(template)}
                  className="w-full text-left p-3 rounded-lg bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-700 hover:border-orange-300 dark:hover:border-orange-600 hover:shadow-sm transition-all duration-200 text-sm"
                >
                  {template}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

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
          disabled={!canProceed}
          className={`px-8 py-3 rounded-xl font-medium transition-all transform hover:scale-105 ${
            canProceed
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

export default DescriptionStep; 