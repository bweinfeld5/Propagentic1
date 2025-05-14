import React from 'react';

const EnhancedComparisonTable = () => {
  const features = [
    {
      name: 'AI Request Routing',
      propagentic: true,
      appfolio: false,
      buildium: false,
      description: 'Automatically route maintenance requests to the right contractor based on skills, availability, and proximity.'
    },
    {
      name: 'Role-Specific Dashboards',
      propagentic: true,
      appfolio: false,
      buildium: true,
      description: 'Custom user interfaces tailored to landlords, tenants, and contractors.'
    },
    {
      name: 'Real-Time Messaging',
      propagentic: true,
      appfolio: true,
      buildium: false,
      description: 'Instant communication between all parties, with read receipts and typing indicators.'
    },
    {
      name: 'Free Tier (MVP)',
      propagentic: true,
      appfolio: false,
      buildium: false,
      description: 'Get started for free with your first 5 properties.'
    },
    {
      name: 'Maintenance AI Analysis',
      propagentic: true,
      appfolio: false,
      buildium: false,
      description: 'ML algorithms that can detect patterns in maintenance requests and suggest preventative actions.'
    }
  ];

  // Helper for check/cross icons
  const renderIcon = (value) => {
    if (value) {
      return (
        // Use Success color for checkmark
        <div className="mx-auto h-8 w-8 rounded-full bg-propagentic-success bg-opacity-10 flex items-center justify-center">
          <svg className="h-5 w-5 text-propagentic-success" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      );
    }
    return (
      // Use Error color for cross mark
      <div className="mx-auto h-8 w-8 rounded-full bg-propagentic-error bg-opacity-10 flex items-center justify-center">
        <svg className="h-5 w-5 text-propagentic-error" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </div>
    );
  };

  return (
    <section className="py-16 md:py-24 bg-propagentic-neutral-light dark:bg-propagentic-slate-dark">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-propagentic-slate-dark dark:text-propagentic-neutral-lightest mb-4">
            How We Compare
          </h2>
          <p className="text-xl text-propagentic-slate dark:text-propagentic-neutral-light max-w-3xl mx-auto">
            See how Propagentic stands apart from traditional property management software.
          </p>
        </div>
        
        <div className="max-w-5xl mx-auto overflow-x-auto">
          <table className="w-full bg-propagentic-neutral-lightest dark:bg-propagentic-neutral-dark rounded-lg shadow-card overflow-hidden">
            <thead>
              <tr className="bg-propagentic-neutral-light dark:bg-propagentic-neutral-dark border-b border-propagentic-neutral dark:border-propagentic-neutral-dark">
                <th className="py-4 px-6 text-left text-propagentic-slate-dark dark:text-propagentic-neutral-lightest font-semibold w-1/3">Feature</th>
                <th className="py-4 px-2 text-center text-propagentic-teal font-semibold w-1/5">
                  <div className="flex flex-col items-center">
                    <span className="text-lg">Propagentic</span>
                    <span className="text-xs mt-1 text-propagentic-slate dark:text-propagentic-neutral-light">(Our Platform)</span>
                  </div>
                </th>
                <th className="py-4 px-2 text-center text-propagentic-slate-dark dark:text-propagentic-neutral-lightest font-semibold w-1/5">
                  <div className="flex flex-col items-center">
                    <span className="text-lg">AppFolio</span>
                    <span className="text-xs mt-1 text-propagentic-slate dark:text-propagentic-neutral-light">Property Manager</span>
                  </div>
                </th>
                <th className="py-4 px-2 text-center text-propagentic-slate-dark dark:text-propagentic-neutral-lightest font-semibold w-1/5">
                  <div className="flex flex-col items-center">
                    <span className="text-lg">Buildium</span>
                    <span className="text-xs mt-1 text-propagentic-slate dark:text-propagentic-neutral-light">by RealPage</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature, index) => (
                <tr 
                  key={index} 
                  className={`border-b border-propagentic-neutral dark:border-propagentic-neutral-dark ${
                    index % 2 === 0 
                    ? 'bg-propagentic-neutral-lightest dark:bg-propagentic-neutral-dark' 
                    : 'bg-propagentic-neutral-light dark:bg-propagentic-neutral-dark/60'
                  }`}
                >
                  <td className="py-4 px-6 text-propagentic-slate-dark dark:text-propagentic-neutral-lightest font-medium">
                    <div>
                      <div>{feature.name}</div>
                      <div className="text-xs text-propagentic-slate dark:text-propagentic-neutral-light mt-1">{feature.description}</div>
                    </div>
                  </td>
                  <td className="py-4 px-2 text-center">{renderIcon(feature.propagentic)}</td>
                  <td className="py-4 px-2 text-center">{renderIcon(feature.appfolio)}</td>
                  <td className="py-4 px-2 text-center">{renderIcon(feature.buildium)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-12 bg-propagentic-neutral-lightest dark:bg-propagentic-neutral-dark rounded-xl p-6 md:p-8 shadow-card max-w-3xl mx-auto">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/4 mb-6 md:mb-0 flex justify-center">
              <div className="bg-propagentic-teal bg-opacity-10 p-5 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-propagentic-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div className="md:w-3/4 md:pl-8">
              <h3 className="text-xl font-bold text-propagentic-slate-dark dark:text-propagentic-neutral-lightest mb-3">AI-Powered Advantage</h3>
              <p className="text-propagentic-slate dark:text-propagentic-neutral-light mb-4">
                Our proprietary AI technology is what sets Propagentic apart. By automatically routing maintenance requests, analyzing patterns, and matching the right contractors, we reduce response times by an average of 65%.
              </p>
              <div className="flex items-center text-sm text-propagentic-teal font-semibold">
                <span>Ready to experience the difference?</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EnhancedComparisonTable; 