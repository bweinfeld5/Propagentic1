import React from 'react';
import EnhancedContractorDashboard from '../components/contractor/EnhancedContractorDashboard';

const ContractorDashboardDemo = () => {
  return (
    <div className="min-h-screen bg-background dark:bg-background-dark">
      <div className="bg-primary/10 dark:bg-primary/20 border-b border-primary/20 dark:border-primary/30 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-primary dark:text-primary-light">
                Enhanced Contractor Dashboard Demo
              </h1>
              <p className="text-sm text-primary/80 dark:text-primary-light/80">
                Showcasing the new UX/UI with integrated document verification system
              </p>
            </div>
            <div className="text-xs text-primary/60 dark:text-primary-light/60 bg-primary/5 dark:bg-primary/10 px-3 py-1 rounded-full">
              Demo Mode
            </div>
          </div>
        </div>
      </div>
      <EnhancedContractorDashboard />
    </div>
  );
};

export default ContractorDashboardDemo; 