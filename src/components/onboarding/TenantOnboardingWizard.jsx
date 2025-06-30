import React from 'react';
import SimpleOnboardingWizard from './SimpleOnboardingWizard';
import { tenantSteps, initialTenantFormData } from './configs/tenantOnboardingConfig';

const TenantOnboardingWizard = () => {
  return (
    <SimpleOnboardingWizard
      userType="tenant"
      steps={tenantSteps}
      initialFormData={initialTenantFormData}
      theme="blue"
      title="Welcome to PropAgentic!"
      subtitle="Let's set up your tenant profile"
    />
  );
};

export default TenantOnboardingWizard; 