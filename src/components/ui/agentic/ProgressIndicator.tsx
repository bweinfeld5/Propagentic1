import React from 'react';
import { motion } from 'framer-motion';
import { CheckIcon } from '@heroicons/react/24/solid';

interface Step {
  id: number;
  name: string;
  description: string;
  icon?: React.ComponentType<any>;
}

interface ProgressIndicatorProps {
  steps: Step[];
  currentStep: number;
  completedSteps: number[];
  className?: string;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  steps,
  currentStep,
  completedSteps,
  className = ''
}) => {
  const progressPercentage = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className={`w-full ${className}`}>
      {/* Progress Bar */}
      <div className="relative mb-8">
        <div className="absolute top-5 left-0 w-full h-0.5 bg-gray-200">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-orange-500 to-orange-600"
          />
        </div>
        
        <div className="relative flex justify-between">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isCompleted = completedSteps.includes(stepNumber);
            const isCurrent = stepNumber === currentStep;
            const isUpcoming = stepNumber > currentStep;
            
            return (
              <motion.div
                key={step.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col items-center"
              >
                {/* Step Circle */}
                <div
                  className={`relative w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                    isCompleted
                      ? 'bg-green-500 border-green-500 text-white'
                      : isCurrent
                      ? 'bg-orange-500 border-orange-500 text-white animate-pulse'
                      : isUpcoming
                      ? 'bg-white border-gray-300 text-gray-400'
                      : 'bg-gray-100 border-gray-300 text-gray-400'
                  }`}
                >
                  {isCompleted ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <CheckIcon className="w-5 h-5" />
                    </motion.div>
                  ) : step.icon ? (
                    <step.icon className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-semibold">{stepNumber}</span>
                  )}
                </div>
                
                {/* Step Label */}
                <div className="mt-3 text-center max-w-[100px]">
                  <div
                    className={`text-sm font-medium transition-colors duration-300 ${
                      isCompleted
                        ? 'text-green-600'
                        : isCurrent
                        ? 'text-orange-600'
                        : 'text-gray-400'
                    }`}
                  >
                    {step.name}
                  </div>
                  <div
                    className={`text-xs mt-1 transition-colors duration-300 ${
                      isCompleted
                        ? 'text-green-500'
                        : isCurrent
                        ? 'text-orange-500'
                        : 'text-gray-400'
                    }`}
                  >
                    {step.description}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
      
      {/* Current Step Info */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="text-lg font-semibold text-[var(--agentic-text-primary)]">
          Step {currentStep} of {steps.length}
        </div>
        <div className="text-sm text-[var(--agentic-text-secondary)] mt-1">
          {steps[currentStep - 1]?.description}
        </div>
      </motion.div>
    </div>
  );
};

export default ProgressIndicator;
