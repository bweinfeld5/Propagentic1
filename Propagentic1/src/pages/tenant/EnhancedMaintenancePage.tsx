import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Button from '../../components/ui/Button';
import EnhancedMaintenanceForm from '../../components/tenant/EnhancedMaintenanceForm';

const EnhancedMaintenancePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const propertyId = (location.state as { propertyId?: string } | null)?.propertyId;
  
  const handleSuccess = () => {
    navigate('/tenant/dashboard', {
      state: { showSuccessMessage: true }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pa-blue-50 to-white">
      {/* Navigation Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/tenant/dashboard')}
                className="mr-4"
              >
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Back to Dashboard
              </Button>
              <div className="hidden sm:block">
                <nav className="flex" aria-label="Breadcrumb">
                  <ol className="flex items-center space-x-2">
                    <li>
                      <span className="text-gray-500">Dashboard</span>
                    </li>
                    <li>
                      <span className="text-gray-500">/</span>
                    </li>
                    <li>
                      <span className="text-gray-900 font-medium">New Maintenance Request</span>
                    </li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Submit Maintenance Request
          </h1>
          <p className="text-lg text-gray-600">
            Describe your issue and we'll help you get it resolved quickly
          </p>
        </div>

        <EnhancedMaintenanceForm 
          propertyId={propertyId}
          onSuccess={handleSuccess}
        />
      </div>
    </div>
  );
};

export default EnhancedMaintenancePage; 