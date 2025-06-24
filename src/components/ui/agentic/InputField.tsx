import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  SparklesIcon,
  MagnifyingGlassIcon,
  ExclamationCircleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface Suggestion {
  id: string;
  text: string;
  type: 'ai' | 'recent' | 'popular';
  confidence?: number;
}

interface InputFieldProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  error?: string;
  suggestions?: Suggestion[];
  onSuggestionSelect?: (suggestion: Suggestion) => void;
  aiEnabled?: boolean;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
  required?: boolean;
  className?: string;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  onFocus,
  error,
  suggestions = [],
  onSuggestionSelect,
  aiEnabled = false,
  multiline = false,
  rows = 3,
  maxLength,
  required = false,
  className = ''
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const hasValue = value.length > 0;
  const hasError = Boolean(error);
  const isValid = hasValue && !hasError;

  // Simulate AI analysis
  useEffect(() => {
    if (aiEnabled && value.length > 5) {
      setIsAnalyzing(true);
      const timer = setTimeout(() => {
        setIsAnalyzing(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [value, aiEnabled]);

  const handleFocus = () => {
    setIsFocused(true);
    setShowSuggestions(suggestions.length > 0);
    onFocus?.();
  };

  const handleBlur = () => {
    setTimeout(() => {
      setIsFocused(false);
      setShowSuggestions(false);
      onBlur?.();
    }, 200);
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    onChange(suggestion.text);
    onSuggestionSelect?.(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const InputComponent = multiline ? 'textarea' : 'input';

  return (
    <div className={`relative ${className}`}>
      {/* Label */}
      <motion.label
        initial={false}
        animate={{
          scale: isFocused || hasValue ? 0.85 : 1,
          y: isFocused || hasValue ? -24 : 0,
          color: hasError ? '#ef4444' : isFocused ? '#f97316' : '#6b7280'
        }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={`absolute left-3 top-3 origin-left pointer-events-none font-medium transition-colors ${
          isFocused || hasValue ? 'z-10' : 'z-0'
        }`}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </motion.label>

      {/* Input Field */}
      <div className="relative">
        <InputComponent
          ref={inputRef as any}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={isFocused ? placeholder : ''}
          maxLength={maxLength}
          rows={multiline ? rows : undefined}
          className={`w-full px-3 py-3 bg-[var(--agentic-bg-primary)] border-2 rounded-xl transition-all duration-200 focus:outline-none resize-none ${
            hasError
              ? 'border-red-300 focus:border-red-500'
              : isValid
              ? 'border-green-300 focus:border-green-500'
              : isFocused
              ? 'border-orange-300 focus:border-orange-500'
              : 'border-[var(--agentic-border)]'
          } ${multiline ? 'min-h-[80px]' : 'h-12'}`}
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            lineHeight: multiline ? '1.6' : 'normal'
          }}
        />

        {/* Right Side Icons */}
        <div className="absolute right-3 top-3 flex items-center gap-2">
          {/* AI Analysis Indicator */}
          {aiEnabled && isAnalyzing && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <SparklesIcon className="w-5 h-5 text-blue-500 animate-spin" />
            </motion.div>
          )}

          {/* Validation Icon */}
          {hasValue && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              {hasError ? (
                <ExclamationCircleIcon className="w-5 h-5 text-red-500" />
              ) : (
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
              )}
            </motion.div>
          )}

          {/* Suggestions Icon */}
          {suggestions.length > 0 && (
            <button
              type="button"
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Character Count */}
      {maxLength && (
        <div className="absolute right-2 bottom-2 text-xs text-gray-400">
          {value.length}/{maxLength}
        </div>
      )}

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-2 flex items-center gap-2 text-sm text-red-600"
          >
            <ExclamationCircleIcon className="w-4 h-4 flex-shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 z-50 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
          >
            <div className="max-h-60 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <motion.button
                  key={suggestion.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-4 py-3 text-left hover:bg-orange-50 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-sm text-gray-900">{suggestion.text}</div>
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                        {suggestion.type === 'ai' && (
                          <>
                            <SparklesIcon className="w-3 h-3" />
                            <span>AI Suggestion</span>
                            {suggestion.confidence && (
                              <span>({suggestion.confidence}% confidence)</span>
                            )}
                          </>
                        )}
                        {suggestion.type === 'recent' && <span>Recently used</span>}
                        {suggestion.type === 'popular' && <span>Popular choice</span>}
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InputField;
