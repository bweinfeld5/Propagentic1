import React from 'react';
import MaintenanceRequestForm from '../components/maintenance/MaintenanceRequestForm';

const MaintenanceFormPage = () => {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Submit Maintenance Request</h1>
        <p className="mt-2 text-sm text-gray-600">
          Use this form to report any maintenance issues with your unit.
        </p>
      </div>
      
      <div className="bg-white shadow rounded-lg">
        <MaintenanceRequestForm />
      </div>
    </div>
  );
};

export default MaintenanceFormPage; 