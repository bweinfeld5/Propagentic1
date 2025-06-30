import React from 'react';
import SimpleOnboardingWizard from './SimpleOnboardingWizard';
import { landlordSteps, initialLandlordFormData } from './configs/landlordOnboardingConfig';

const LandlordOnboardingWizard = () => {
  return (
    <SimpleOnboardingWizard
      userType="landlord"
      steps={landlordSteps}
      initialFormData={initialLandlordFormData}
      theme="orange"
      title="Property Setup"
      subtitle="Let's get your first property set up in the system"
    />
  );
};

export default LandlordOnboardingWizard; 