import React from 'react';
import { SafeMotion } from '../../shared/SafeMotion.jsx';

interface RoleDashboardProps {
  activeRole: 'Landlord' | 'Tenant' | 'Contractor';
}

/**
 * Role-specific dashboard content to be displayed inside the laptop frame
 * Displays different UI elements based on the selected role
 */
const RoleDashboard: React.FC<RoleDashboardProps> = ({ activeRole }) => {
  return (
    <div className="flex-1 relative bg-gray-100 dark:bg-gray-900">
      <SafeMotion.div 
        className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 text-white p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">{activeRole} Dashboard</h3>
          <p className="text-sm text-gray-300 mb-4">Smart property management for {activeRole}s</p>
          
          {/* Mock dashboard UI with role-specific colors */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-gray-700 rounded p-2">
              <div className={`w-full h-2 ${
                activeRole === 'Landlord' ? 'bg-blue-500' : 
                activeRole === 'Tenant' ? 'bg-green-500' : 
                'bg-purple-500'
              } rounded mb-1`}></div>
              <div className="w-3/4 h-2 bg-gray-500 rounded"></div>
            </div>
            <div className="bg-gray-700 rounded p-2">
              <div className={`w-full h-2 ${
                activeRole === 'Landlord' ? 'bg-indigo-500' : 
                activeRole === 'Tenant' ? 'bg-teal-500' : 
                'bg-amber-500'
              } rounded mb-1`}></div>
              <div className="w-2/3 h-2 bg-gray-500 rounded"></div>
            </div>
            <div className="bg-gray-700 rounded p-2">
              <div className={`w-full h-2 ${
                activeRole === 'Landlord' ? 'bg-cyan-500' : 
                activeRole === 'Tenant' ? 'bg-emerald-500' : 
                'bg-pink-500'
              } rounded mb-1`}></div>
              <div className="w-1/2 h-2 bg-gray-500 rounded"></div>
            </div>
            <div className="bg-gray-700 rounded p-2">
              <div className={`w-full h-2 ${
                activeRole === 'Landlord' ? 'bg-sky-500' : 
                activeRole === 'Tenant' ? 'bg-lime-500' : 
                'bg-orange-500'
              } rounded mb-1`}></div>
              <div className="w-4/5 h-2 bg-gray-500 rounded"></div>
            </div>
          </div>
          
          {/* Mock table */}
          <div className="bg-gray-700 rounded p-2">
            <div className="grid grid-cols-3 gap-1 mb-1">
              <div className="h-2 bg-gray-500 rounded"></div>
              <div className="h-2 bg-gray-500 rounded"></div>
              <div className="h-2 bg-gray-500 rounded"></div>
            </div>
            <div className="grid grid-cols-3 gap-1 mb-1">
              <div className="h-2 bg-gray-600 rounded"></div>
              <div className="h-2 bg-gray-600 rounded"></div>
              <div className="h-2 bg-gray-600 rounded"></div>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <div className="h-2 bg-gray-600 rounded"></div>
              <div className="h-2 bg-gray-600 rounded"></div>
              <div className="h-2 bg-gray-600 rounded"></div>
            </div>
          </div>
        </div>
      </SafeMotion.div>
    </div>
  );
};

export default RoleDashboard; 