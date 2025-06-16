import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import MaintenanceRequestForm from './MaintenanceRequestForm';

interface WizardStep {
  id: number;
  title: string;
  description: string;
  component?: React.ReactNode;
}

const MaintenanceWizard: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  const steps: WizardStep[] = [
    {
      id: 1,
      title: 'Before You Begin',
      description: 'Important information about maintenance requests',
      component: (
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              What you'll need:
            </h3>
            <ul className="list-disc list-inside space-y-2 text-blue-800 dark:text-blue-200">
              <li>Clear description of the issue</li>
              <li>Photos of the problem (optional but helpful)</li>
              <li>Your availability for repairs</li>
              <li>Contact preference for updates</li>
            </ul>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-lg">
            <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
              Emergency Situations:
            </h3>
            <p className="text-amber-800 dark:text-amber-200 mb-3">
              If you have a true emergency (flooding, fire, gas leak, etc.), please:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-amber-800 dark:text-amber-200">
              <li>Call 911 immediately if there's danger</li>
              <li>Contact your landlord directly</li>
              <li>Submit an emergency maintenance request</li>
            </ol>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
              Response Times:
            </h3>
            <ul className="space-y-2 text-green-800 dark:text-green-200">
              <li><strong>Emergency:</strong> Within 2-4 hours</li>
              <li><strong>High Priority:</strong> Within 24 hours</li>
              <li><strong>Medium Priority:</strong> 2-3 business days</li>
              <li><strong>Low Priority:</strong> Within 1 week</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: 'Submit Your Request',
      description: 'Fill out the maintenance request form',
      component: <MaintenanceRequestForm />
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    // Skip to the form step
    setCurrentStep(1);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Step {currentStep + 1} of {steps.length}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {Math.round(((currentStep + 1) / steps.length) * 100)}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-teal-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white dark:bg-slate-800 shadow-lg rounded-xl p-8 border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
          {steps[currentStep].title}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {steps[currentStep].description}
        </p>

        {steps[currentStep].component}

        {/* Navigation Buttons */}
        {currentStep === 0 && (
          <div className="flex justify-between mt-8">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <div className="space-x-3">
              <button
                type="button"
                onClick={handleSkip}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2 bg-teal-600 text-white rounded-full hover:bg-teal-700 transition-colors flex items-center"
              >
                Next
                <ChevronRightIcon className="ml-2 h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MaintenanceWizard;