import React from 'react';
import { CheckCircle, AlertCircle, RotateCw, Clock, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

/**
 * Save indicator component that shows the current save status
 * with appropriate visual feedback
 */
const SaveIndicator = ({ status, lastSaved, error, onRetry }) => {
  // Get status configuration
  const getStatusConfig = () => {
    switch (status) {
      case 'saving':
        return {
          icon: RotateCw,
          text: 'Saving...',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-700',
          iconColor: 'text-blue-500',
          borderColor: 'border-blue-200',
          animate: true
        };
      case 'saved':
        return {
          icon: CheckCircle,
          text: lastSaved ? `Saved ${formatDistanceToNow(lastSaved, { addSuffix: true })}` : 'Saved',
          bgColor: 'bg-green-50',
          textColor: 'text-green-700',
          iconColor: 'text-green-500',
          borderColor: 'border-green-200',
          animate: false
        };
      case 'error':
        return {
          icon: AlertCircle,
          text: 'Failed to save',
          bgColor: 'bg-red-50',
          textColor: 'text-red-700',
          iconColor: 'text-red-500',
          borderColor: 'border-red-200',
          animate: false
        };
      default:
        return {
          icon: Clock,
          text: 'Ready to save',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-700',
          iconColor: 'text-gray-500',
          borderColor: 'border-gray-200',
          animate: false
        };
    }
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  // Don't show indicator if status is saved and it's been more than 10 seconds
  if (status === 'saved' && lastSaved && Date.now() - lastSaved.getTime() > 10000) {
    return null;
  }

  return (
    <div className={`flex items-center justify-between p-2 rounded-md border ${config.bgColor} ${config.borderColor} transition-all duration-200`}>
      <div className="flex items-center space-x-2">
        <IconComponent 
          className={`h-4 w-4 ${config.iconColor} ${config.animate ? 'animate-spin' : ''}`}
        />
        <span className={`text-sm font-medium ${config.textColor}`}>
          {config.text}
        </span>
      </div>

      {/* Error details and retry button */}
      {status === 'error' && (
        <div className="flex items-center space-x-2">
          {error && (
            <span className="text-xs text-red-600 max-w-xs truncate" title={error}>
              {error}
            </span>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center space-x-1 text-xs text-red-600 hover:text-red-800 font-medium transition-colors"
              title="Retry saving"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Retry</span>
            </button>
          )}
        </div>
      )}

      {/* Last saved details for saved status */}
      {status === 'saved' && lastSaved && (
        <span className="text-xs text-green-600" title={lastSaved.toLocaleString()}>
          {formatDistanceToNow(lastSaved, { addSuffix: true })}
        </span>
      )}
    </div>
  );
};

export default SaveIndicator; 