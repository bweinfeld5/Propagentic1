import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Clock } from 'lucide-react';

interface ProgressStep {
  id: string;
  label: string;
  description?: string;
  icon?: React.ElementType;
}

interface ProgressIndicatorProps {
  steps: ProgressStep[];
  currentStep: number;
  className?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  steps,
  currentStep,
  className = ''
}) => {
  return (
    <div className={`relative ${className}`}>
      {/* Progress bar background */}
      <div className="absolute top-6 left-6 right-6 h-0.5 bg-gray-200 dark:bg-gray-700 -z-10" />
      
      {/* Animated progress line */}
      <motion.div
        initial={{ width: 0 }}
        animate={{ 
          width: `${Math.max(0, Math.min(100, ((currentStep) / (steps.length - 1)) * 100))}%` 
        }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="absolute top-6 left-6 h-0.5 bg-orange-500 -z-10"
        style={{ 
          transformOrigin: 'left',
          maxWidth: 'calc(100% - 3rem)'
        }}
      />

      {/* Step indicators */}
      <div className="flex justify-between items-center">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          
          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="flex flex-col items-center text-center max-w-20"
            >
              {/* Step circle */}
              <motion.div
                animate={{
                  scale: isCurrent ? 1.1 : 1
                }}
                transition={{ duration: 0.3 }}
                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center relative z-10 ${
                  isCompleted
                    ? 'border-green-500 bg-green-500 text-white'
                    : isCurrent
                    ? 'border-orange-500 bg-orange-500 text-white'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : isCurrent ? (
                  <Clock className="w-5 h-5" />
                ) : (
                  <Circle className="w-5 h-5" />
                )}
              </motion.div>
              
              {/* Step label */}
              <motion.div
                initial={{ opacity: 0.5 }}
                animate={{ 
                  opacity: isCompleted || isCurrent ? 1 : 0.5,
                  y: isCurrent ? -2 : 0
                }}
                transition={{ duration: 0.3 }}
                className="mt-2"
              >
                <div className={`text-xs font-medium ${
                  isCompleted 
                    ? 'text-green-600 dark:text-green-400'
                    : isCurrent 
                    ? 'text-orange-600 dark:text-orange-400' 
                    : 'text-gray-500 dark:text-gray-500'
                }`}>
                  {step.label}
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </div>
      
      {/* Step counter */}
      <div className="text-center mt-4">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Step {currentStep + 1} of {steps.length}
        </span>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          className="h-1 bg-orange-500 rounded-full mt-2 mx-auto max-w-40"
        />
      </div>
    </div>
  );
};
