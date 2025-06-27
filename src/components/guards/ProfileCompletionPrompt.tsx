import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface ProfileCompletionPromptProps {
  completionPercentage: number;
  missingFields: string[];
  userType: string;
  onDismiss?: () => void;
  allowPartialAccess?: boolean;
}

const ProfileCompletionPrompt: React.FC<ProfileCompletionPromptProps> = ({
  completionPercentage,
  missingFields,
  userType,
  onDismiss,
  allowPartialAccess = false
}) => {
  const navigate = useNavigate();

  const handleCompleteProfile = () => {
    // Navigate to appropriate onboarding or profile edit page
    switch (userType) {
      case 'contractor':
        navigate('/onboarding/contractor');
        break;
      case 'landlord':
        navigate('/onboarding/landlord');
        break;
      default:
        navigate('/onboarding/tenant');
        break;
    }
  };

  const isHighCompletion = completionPercentage >= 80;
  const isMediumCompletion = completionPercentage >= 50;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center mb-4">
          {isHighCompletion ? (
            <CheckCircleIcon className="h-8 w-8 text-green-500 mr-3" />
          ) : (
            <ExclamationTriangleIcon className="h-8 w-8 text-orange-500 mr-3" />
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {isHighCompletion ? 'Almost Done!' : 'Complete Your Profile'}
            </h3>
            <p className="text-sm text-gray-600">
              {completionPercentage}% complete
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Profile Progress</span>
            <span>{completionPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                isHighCompletion 
                  ? 'bg-green-500' 
                  : isMediumCompletion 
                    ? 'bg-blue-500' 
                    : 'bg-orange-500'
              }`}
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Missing Fields */}
        {missingFields.length > 0 && (
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Still needed:
            </p>
            <ul className="space-y-1">
              {missingFields.slice(0, 5).map((field, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-center">
                  <div className="w-1.5 h-1.5 bg-orange-400 rounded-full mr-2" />
                  {field}
                </li>
              ))}
              {missingFields.length > 5 && (
                <li className="text-sm text-gray-500 italic">
                  and {missingFields.length - 5} more...
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Description */}
        <p className="text-sm text-gray-600 mb-6">
          {isHighCompletion 
            ? 'Just a few more details and you\'ll have full access to all features!'
            : 'Complete your profile to access all PropAgentic features and get the best experience.'
          }
        </p>

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={handleCompleteProfile}
            className={`flex-1 px-4 py-2 rounded-lg text-white font-medium transition-colors ${
              isHighCompletion
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isHighCompletion ? 'Finish Setup' : 'Complete Profile'}
          </button>
          
          {allowPartialAccess && onDismiss && (
            <button
              onClick={onDismiss}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Continue
            </button>
          )}
        </div>

        {/* Footer note */}
        {allowPartialAccess && (
          <p className="text-xs text-gray-500 mt-3 text-center">
            You can complete this later in your profile settings.
          </p>
        )}
      </div>
    </div>
  );
};

export default ProfileCompletionPrompt; 