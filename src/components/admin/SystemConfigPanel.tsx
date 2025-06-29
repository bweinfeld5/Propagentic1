import React, { useState } from 'react';
import {
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';

const SystemConfigPanel: React.FC = () => {
  const { userProfile } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  // Check if user is super admin
  const isSuperAdmin = userProfile?.role === 'super_admin';

  if (!isSuperAdmin) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
        <p className="text-gray-600">Only super administrators can access system configuration.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Cog6ToothIcon className="w-8 h-8 text-red-600" />
            System Configuration
          </h2>
          <p className="text-gray-600">Manage system-wide settings and feature toggles</p>
        </div>
        
        <Button
          disabled={isSaving}
          className="flex items-center gap-2"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Maintenance Mode */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <WrenchScrewdriverIcon className="w-5 h-5" />
              Maintenance Mode
            </h3>
            <p className="text-sm text-gray-600">
              System configuration features coming soon
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemConfigPanel; 