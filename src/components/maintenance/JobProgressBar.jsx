import React from 'react';
import PropTypes from 'prop-types';

/**
 * Displays the progress of a maintenance job through its lifecycle
 * Shows the current status and allows tracking progress visually
 */
const JobProgressBar = ({ ticketId, status, steps }) => {
  // Default steps if not provided
  const defaultSteps = [
    { id: 'new', label: 'New', completed: false },
    { id: 'ready_to_dispatch', label: 'Classified', completed: false },
    { id: 'assigned', label: 'Assigned', completed: false },
    { id: 'in_progress', label: 'In Progress', completed: false },
    { id: 'completed', label: 'Completed', completed: false }
  ];
  
  // Use provided steps or default
  const progressSteps = steps || defaultSteps;
  
  // Determine current step index
  const currentStepIndex = progressSteps.findIndex(step => step.id === status);
  
  // Update step completion based on current status
  const updatedSteps = progressSteps.map((step, index) => ({
    ...step,
    completed: index < currentStepIndex || (index === currentStepIndex && status === 'completed')
  }));
  
  return (
    <div className="w-full py-4">
      <h3 className="text-lg font-medium mb-3">Job Progress</h3>
      
      <div className="relative">
        {/* Progress Bar Line */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -translate-y-1/2 z-0" />
        
        {/* Colored Progress Line */}
        <div 
          className="absolute top-1/2 left-0 h-1 bg-blue-500 -translate-y-1/2 z-10 transition-all duration-300"
          style={{ 
            width: `${Math.min(100, (currentStepIndex / (updatedSteps.length - 1)) * 100)}%` 
          }} 
        />
        
        {/* Steps */}
        <div className="relative z-20 flex justify-between">
          {updatedSteps.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 transition-colors ${
                  step.completed 
                    ? 'bg-blue-500 text-white'
                    : index === currentStepIndex
                      ? 'bg-blue-100 border-2 border-blue-500 text-blue-500' 
                      : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step.completed ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <span className="text-xs text-center max-w-[80px]">{step.label}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Current Status */}
      <div className="text-center mt-4 text-sm text-gray-600">
        Current Status: <span className="font-medium text-blue-600">{
          updatedSteps.find(step => step.id === status)?.label || status
        }</span>
      </div>
    </div>
  );
};

JobProgressBar.propTypes = {
  ticketId: PropTypes.string.isRequired,
  status: PropTypes.string.isRequired,
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      completed: PropTypes.bool
    })
  )
};

export default JobProgressBar; 