import React from 'react';
import MaintenanceWizard from '../components/maintenance/MaintenanceWizard';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const MaintenanceFormPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Dashboard
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Submit Maintenance Request
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            Report any maintenance issues with your unit and we'll get them fixed promptly.
          </p>
        </div>
        
        {/* Maintenance Wizard */}
        <MaintenanceWizard />
        
        {/* Help Section */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Need immediate help?
            </h3>
            <div className="space-y-2 text-gray-600 dark:text-gray-400">
              <p>
                <strong>Emergency Maintenance:</strong> Call (555) 911-HELP
              </p>
              <p>
                <strong>Office Hours:</strong> Monday-Friday, 9AM-5PM
              </p>
              <p>
                <strong>Email:</strong> maintenance@propagentic.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceFormPage; 