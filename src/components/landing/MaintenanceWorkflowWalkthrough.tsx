import React from 'react';
import { SafeMotion } from '../shared/SafeMotion';

const MaintenanceWorkflowWalkthrough: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Maintenance Request Workflow</h2>
      <p className="text-gray-600 mb-6">See how our AI-powered system handles maintenance requests.</p>
      
      <div className="space-y-4">
        <SafeMotion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="p-4 border rounded-lg"
        >
          <h3 className="font-medium">Step 1: Submit Request</h3>
          <p className="text-sm text-gray-500">Tenant submits maintenance request with details and photos</p>
        </SafeMotion.div>
        
        <SafeMotion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="p-4 border rounded-lg"
        >
          <h3 className="font-medium">Step 2: AI Classification</h3>
          <p className="text-sm text-gray-500">AI analyzes the request to determine category and urgency</p>
        </SafeMotion.div>
        
        <SafeMotion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="p-4 border rounded-lg"
        >
          <h3 className="font-medium">Step 3: Dispatch</h3>
          <p className="text-sm text-gray-500">System matches with appropriate maintenance personnel</p>
        </SafeMotion.div>
      </div>
    </div>
  );
};

export default MaintenanceWorkflowWalkthrough; 
