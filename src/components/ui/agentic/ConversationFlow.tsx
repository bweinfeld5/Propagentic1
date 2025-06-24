import React, { useState, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface ConversationStep {
  id: string;
  title: string;
  subtitle?: string;
  content: ReactNode;
  canProceed?: boolean;
  canGoBack?: boolean;
}

interface ConversationFlowProps {
  steps: ConversationStep[];
  currentStepIndex: number;
  onStepChange: (index: number) => void;
  className?: string;
  showProgress?: boolean;
}

export const ConversationFlow: React.FC<ConversationFlowProps> = ({
  steps,
  currentStepIndex,
  onStepChange,
  className,
  showProgress = true
}) => {
  const [direction, setDirection] = useState(0);
  const currentStep = steps[currentStepIndex];

  const goToStep = (index: number) => {
    if (index < 0 || index >= steps.length) return;
    setDirection(index > currentStepIndex ? 1 : -1);
    onStepChange(index);
  };

  const goNext = () => {
    if (currentStepIndex < steps.length - 1 && currentStep.canProceed !== false) {
      goToStep(currentStepIndex + 1);
    }
  };

  const goPrevious = () => {
    if (currentStepIndex > 0 && currentStep.canGoBack !== false) {
      goToStep(currentStepIndex - 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        goNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
        goPrevious();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStepIndex, currentStep]);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
      scale: 0.95
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0,
      scale: 0.95
    })
  };

  return (
    <div className={cn('relative w-full', className)}>
      {/* Progress indicator */}
      {showProgress && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Step {currentStepIndex + 1} of {steps.length}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-500">
              {Math.round(((currentStepIndex + 1) / steps.length) * 100)}% Complete
            </span>
          </div>
          <div className="relative h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-500 to-orange-600"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      )}

      {/* Step content */}
      <div className="relative min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            className="w-full"
          >
            {/* Step header */}
            <div className="mb-6">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-2xl font-semibold text-gray-900 dark:text-gray-100"
              >
                {currentStep.title}
              </motion.h2>
              {currentStep.subtitle && (
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-2 text-gray-600 dark:text-gray-400"
                >
                  {currentStep.subtitle}
                </motion.p>
              )}
            </div>

            {/* Step content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {currentStep.content}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation controls */}
      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={goPrevious}
          disabled={currentStepIndex === 0 || currentStep.canGoBack === false}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
            currentStepIndex === 0 || currentStep.canGoBack === false
              ? "text-gray-400 cursor-not-allowed"
              : "text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-800"
          )}
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        {/* Step dots */}
        <div className="flex items-center gap-2">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => goToStep(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                index === currentStepIndex
                  ? "w-8 bg-orange-500"
                  : index < currentStepIndex
                  ? "bg-orange-300"
                  : "bg-gray-300 dark:bg-gray-700"
              )}
            />
          ))}
        </div>

        <button
          onClick={goNext}
          disabled={currentStepIndex === steps.length - 1 || currentStep.canProceed === false}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
            currentStepIndex === steps.length - 1 || currentStep.canProceed === false
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-orange-500 text-white hover:bg-orange-600 shadow-lg hover:shadow-xl"
          )}
        >
          {currentStepIndex === steps.length - 1 ? 'Complete' : 'Next'}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}; 