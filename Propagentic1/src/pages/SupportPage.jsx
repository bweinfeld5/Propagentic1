import React from 'react';

const SupportPage = () => {
  return (
    // Note: DashboardLayout is applied by the Router in App.js
    <div>
      <h1 className="text-2xl font-semibold text-content dark:text-content-dark mb-6">
        Support
      </h1>
      <div className="bg-background dark:bg-background-darkSubtle p-6 rounded-lg shadow border border-border dark:border-border-dark">
        <h2 className="text-lg font-medium text-content dark:text-content-dark mb-4">Contact Information</h2>
        <p className="text-content-secondary dark:text-content-darkSecondary mb-2">
          For support inquiries, please contact us at:
        </p>
        <a href="mailto:support@propagentic.com" className="text-primary dark:text-primary-light hover:underline font-medium">
          support@propagentic.com
        </a>
        
        <h2 className="text-lg font-medium text-content dark:text-content-dark mt-6 mb-4">Frequently Asked Questions</h2>
        <p className="text-content-secondary dark:text-content-darkSecondary mb-4">
          {/* Add links to FAQ or documentation if available */}
          Find answers to common questions in our <a href="/docs/faq" className="text-primary dark:text-primary-light hover:underline">FAQ section</a> (Link placeholder).
        </p>
        {/* Placeholder for FAQ content or component */}
        <div className="space-y-2">
             <p className="text-sm text-content-subtle dark:text-content-darkSubtle">- How do I add a property?</p>
             <p className="text-sm text-content-subtle dark:text-content-darkSubtle">- How do I invite a tenant?</p>
             <p className="text-sm text-content-subtle dark:text-content-darkSubtle">- How does maintenance request routing work?</p>
        </div>
      </div>
    </div>
  );
};

export default SupportPage; 