import React from 'react';
import MaintenanceClassifier from '../components/ai/MaintenanceClassifier';
import PropertyDescriptionGenerator from '../components/ai/PropertyDescriptionGenerator';
import AIConfigurationPanel from '../components/ai/AIConfigurationPanel';

const AIExamples = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8 text-primary dark:text-primary-light">
        Propagentic AI Features Showcase
      </h1>
      
      <AIConfigurationPanel />
      
      <div className="mb-12">
        <PropertyDescriptionGenerator />
      </div>
      
      <div className="mb-12">
        <MaintenanceClassifier />
      </div>
    </div>
  );
};

export default AIExamples; 