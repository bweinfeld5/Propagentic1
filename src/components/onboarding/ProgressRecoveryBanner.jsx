import React from 'react';
import { Clock, ArrowRight, X, RotateCw } from 'lucide-react';
import Button from '../ui/Button';

/**
 * Progress recovery banner that shows when users can resume onboarding
 */
const ProgressRecoveryBanner = ({ 
  progressSummary, 
  onRestore, 
  onDiscard, 
  isLoading = false 
}) => {
  if (!progressSummary) return null;

  const { step, timeAgo, completionPercentage, deviceInfo } = progressSummary;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 shadow-sm">
      <div className="flex items-start justify-between">
        {/* Left content */}
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-0.5">
            <Clock className="h-5 w-5 text-blue-500" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-sm font-medium text-blue-800 mb-1">
              Continue where you left off
            </h3>
            
            <div className="text-sm text-blue-600 space-y-1">
              <p>
                You were on step {step} • {completionPercentage}% complete
              </p>
              <div className="flex items-center space-x-4 text-xs text-blue-500">
                <span>Saved {timeAgo}</span>
                {deviceInfo && <span>• {deviceInfo}</span>}
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-3 w-full bg-blue-100 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right content - Actions */}
        <div className="flex items-center space-x-2 ml-4">
          <Button
            onClick={onRestore}
            variant="primary"
            size="sm"
            disabled={isLoading}
            className="flex items-center space-x-1"
          >
            {isLoading ? (
              <RotateCw className="h-3 w-3 animate-spin" />
            ) : (
              <ArrowRight className="h-3 w-3" />
            )}
            <span>{isLoading ? 'Loading...' : 'Continue'}</span>
          </Button>
          
          <Button
            onClick={onDiscard}
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="text-blue-600 border-blue-300 hover:bg-blue-50"
          >
            Start Over
          </Button>
          
          <button
            onClick={onDiscard}
            className="text-blue-400 hover:text-blue-600 transition-colors p-1"
            disabled={isLoading}
            title="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Additional information */}
      <div className="mt-3 pt-3 border-t border-blue-200">
        <div className="flex items-center justify-between text-xs text-blue-500">
          <span>Your progress is automatically saved as you complete each step</span>
          <span>Expires in {7 - Math.floor((Date.now() - progressSummary.timestamp) / (1000 * 60 * 60 * 24))} days</span>
        </div>
      </div>
    </div>
  );
};

export default ProgressRecoveryBanner; 