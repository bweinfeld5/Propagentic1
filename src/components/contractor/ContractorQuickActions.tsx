import React, { useState } from 'react';
import { EyeIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface ContractorQuickActionsProps {
  onViewAllRequests?: () => void;
  onUpdateAvailability?: (available: boolean) => void;
  currentAvailability?: boolean;
}

const ContractorQuickActions: React.FC<ContractorQuickActionsProps> = ({
  onViewAllRequests,
  onUpdateAvailability,
  currentAvailability = true
}) => {
  const [isAvailable, setIsAvailable] = useState(currentAvailability);

  const handleAvailabilityToggle = () => {
    const newAvailability = !isAvailable;
    setIsAvailable(newAvailability);
    onUpdateAvailability?.(newAvailability);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Quick Actions</h2>
      <p className="text-gray-600 text-sm mb-6">Manage your availability and view all requests.</p>
      
      <div className="space-y-3">
        {/* Availability Status */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isAvailable ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className="text-sm font-medium text-gray-700">
                {isAvailable ? 'Available for work' : 'Currently unavailable'}
              </span>
            </div>
            <button
              onClick={handleAvailabilityToggle}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                isAvailable 
                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isAvailable ? 'Set Unavailable' : 'Set Available'}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors text-left flex items-center space-x-2">
          <ClockIcon className="w-4 h-4" />
          <span>Update Schedule</span>
        </button>

        <button 
          className={`w-full font-medium py-3 px-4 rounded-lg transition-colors text-left flex items-center space-x-2 ${
            isAvailable 
              ? 'bg-orange-100 hover:bg-orange-200 text-orange-700' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
          disabled={!isAvailable}
        >
          <CheckCircleIcon className="w-4 h-4" />
          <span>Accept New Jobs</span>
        </button>

        <button 
          onClick={onViewAllRequests}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          <EyeIcon className="w-4 h-4" />
          <span>View All Requests</span>
        </button>
      </div>
    </div>
  );
};

export default ContractorQuickActions; 