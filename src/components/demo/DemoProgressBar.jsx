import React from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

const DemoProgressBar = ({ currentSection, totalSections, sections }) => {
  const progressPercentage = ((currentSection + 1) / totalSections) * 100;

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Progress Bar */}
        <div className="relative">
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200 dark:bg-gray-700">
            <div
              style={{ width: `${progressPercentage}%` }}
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-teal-600 transition-all duration-500"
            />
          </div>
          
          {/* Section Indicators */}
          <div className="flex justify-between items-center relative -mt-1">
            {sections.map((section, index) => {
              const isActive = index === currentSection;
              const isCompleted = index < currentSection;
              
              return (
                <div
                  key={section.id}
                  className="flex flex-col items-center"
                >
                  <div
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                      transition-all duration-300 
                      ${isActive 
                        ? 'bg-teal-600 text-white ring-4 ring-teal-100 dark:ring-teal-900' 
                        : isCompleted 
                          ? 'bg-teal-600 text-white' 
                          : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'}
                    `}
                  >
                    {isCompleted ? (
                      <CheckCircleIcon className="w-5 h-5" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span 
                    className={`
                      mt-2 text-xs font-medium
                      ${isActive 
                        ? 'text-teal-600 dark:text-teal-400' 
                        : 'text-gray-500 dark:text-gray-400'}
                    `}
                  >
                    {section.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Section Progress Text */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Section {currentSection + 1} of {totalSections}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DemoProgressBar; 