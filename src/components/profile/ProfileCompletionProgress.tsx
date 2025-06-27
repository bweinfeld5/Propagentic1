import React from 'react';
import { validateProfile, FIELD_LABELS } from '../../schemas/profileValidationSchemas';

interface ProfileCompletionProgressProps {
  userProfile: any;
  userType: string;
  className?: string;
  showDetails?: boolean;
  compact?: boolean;
}

/**
 * Reusable component that displays profile completion progress
 * Can be used in dashboards, headers, or onboarding flows
 */
const ProfileCompletionProgress: React.FC<ProfileCompletionProgressProps> = ({
  userProfile,
  userType,
  className = '',
  showDetails = false,
  compact = false
}) => {
  const validation = validateProfile(userProfile, userType);

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTextColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-700';
    if (percentage >= 70) return 'text-yellow-700';
    return 'text-red-700';
  };

  const getBadgeColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-100 text-green-800 border-green-200';
    if (percentage >= 70) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  if (compact) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-20 bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(validation.completionPercentage)}`}
            style={{ width: `${validation.completionPercentage}%` }}
          ></div>
        </div>
        <span className={`text-sm font-medium ${getTextColor(validation.completionPercentage)}`}>
          {validation.completionPercentage}%
        </span>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900">Profile Completion</h3>
        <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getBadgeColor(validation.completionPercentage)}`}>
          {validation.completionPercentage}% Complete
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
        <div 
          className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(validation.completionPercentage)}`}
          style={{ width: `${validation.completionPercentage}%` }}
        ></div>
      </div>

      {/* Status Message */}
      <div className="mb-4">
        {validation.completionPercentage >= 95 ? (
          <p className="text-green-700 text-sm">
            ✅ Your profile is complete! You have access to all features.
          </p>
        ) : validation.completionPercentage >= 80 ? (
          <p className="text-yellow-700 text-sm">
            ⚠️ Your profile is mostly complete. Consider adding the remaining information for full access to features.
          </p>
        ) : (
          <p className="text-red-700 text-sm">
            ❌ Your profile needs attention. Complete the missing information to access all features.
          </p>
        )}
      </div>

      {/* Missing Fields Details */}
      {showDetails && validation.missingFields.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-orange-800 mb-3">
            Missing Information ({validation.missingFields.length} items):
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {validation.missingFields.slice(0, 6).map((field, index) => (
              <div key={index} className="flex items-center text-sm text-orange-700">
                <svg className="w-4 h-4 mr-2 text-orange-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {FIELD_LABELS[field] || field}
              </div>
            ))}
            {validation.missingFields.length > 6 && (
              <div className="text-sm text-orange-600 font-medium col-span-full">
                +{validation.missingFields.length - 6} more items...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {validation.completionPercentage < 100 && (
        <div className="mt-4 flex space-x-3">
          <button
            onClick={() => {
              const routes = {
                contractor: '/onboarding/contractor',
                landlord: '/onboarding/landlord',
                tenant: '/onboarding/tenant'
              };
              window.location.href = routes[userType as keyof typeof routes] || '/onboarding/tenant';
            }}
            className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-orange-700 transition-colors"
          >
            Complete Profile
          </button>
          
          {validation.completionPercentage >= 70 && (
            <button
              onClick={() => {
                const routes = {
                  contractor: '/contractor/profile',
                  landlord: '/landlord/profile', 
                  tenant: '/tenant/profile'
                };
                window.location.href = routes[userType as keyof typeof routes] || '/profile';
              }}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300 transition-colors"
            >
              Quick Edit
            </button>
          )}
        </div>
      )}

      {/* Warnings */}
      {showDetails && validation.warnings.length > 0 && (
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">Recommendations:</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            {validation.warnings.slice(0, 3).map((warning, index) => (
              <li key={index} className="flex items-start">
                <svg className="w-4 h-4 mr-2 mt-0.5 text-yellow-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ProfileCompletionProgress; 