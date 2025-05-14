import React from 'react';

const CompetitorMatrix = () => {
  const compareFeatures = [
    {
      feature: 'AI Classification',
      propagentic: true,
      appfolio: false,
      buildium: false,
      description: 'Automatically categorize and prioritize maintenance requests',
    },
    {
      feature: 'Contractor Matching',
      propagentic: true,
      appfolio: false,
      buildium: false,
      description: 'AI-powered matching of contractors based on expertise, availability and location',
    },
    {
      feature: 'Real-time Tracking',
      propagentic: true,
      appfolio: false,
      buildium: true,
      description: 'Follow maintenance requests from submission to completion in real-time',
    },
    {
      feature: 'Integrated Communication',
      propagentic: true,
      appfolio: true,
      buildium: true,
      description: 'Built-in messaging between tenants, landlords, and contractors',
    },
    {
      feature: 'Property Analytics',
      propagentic: true,
      appfolio: true,
      buildium: false,
      description: 'Detailed insights into maintenance trends and property performance',
    },
    {
      feature: 'Mobile Optimization',
      propagentic: true,
      appfolio: true,
      buildium: false,
      description: 'Fully responsive design and dedicated mobile apps for all user types',
    },
  ];

  const CheckIcon = () => (
    <svg className="h-6 w-6 text-propagentic-teal" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );

  const XIcon = () => (
    <svg className="h-6 w-6 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  );

  const PartialIcon = () => (
    <svg className="h-6 w-6 text-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
    </svg>
  );

  return (
    <div className="bg-white dark:bg-propagentic-slate rounded-xl shadow-xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-propagentic-neutral-light dark:bg-propagentic-slate-dark">
            <th className="py-4 px-6 text-left text-propagentic-slate-dark dark:text-white font-bold">Features</th>
            <th className="py-4 px-6 text-center text-propagentic-teal font-bold">Propagentic</th>
            <th className="py-4 px-6 text-center text-propagentic-slate-dark dark:text-white font-bold">AppFolio</th>
            <th className="py-4 px-6 text-center text-propagentic-slate-dark dark:text-white font-bold">Buildium</th>
          </tr>
        </thead>
        <tbody>
          {compareFeatures.map((item, index) => (
            <tr key={index} className={index % 2 === 0 ? 'bg-white dark:bg-propagentic-slate' : 'bg-propagentic-neutral-light dark:bg-propagentic-slate-dark bg-opacity-50 dark:bg-opacity-50'}>
              <td className="py-4 px-6">
                <div className="text-propagentic-slate-dark dark:text-white font-medium">{item.feature}</div>
                <div className="text-sm text-propagentic-slate dark:text-propagentic-neutral-light mt-1">{item.description}</div>
              </td>
              <td className="py-4 px-6 text-center">{item.propagentic ? <CheckIcon /> : <XIcon />}</td>
              <td className="py-4 px-6 text-center">{item.appfolio ? <CheckIcon /> : <XIcon />}</td>
              <td className="py-4 px-6 text-center">{item.buildium ? <CheckIcon /> : <XIcon />}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="py-6 px-6 bg-propagentic-neutral-light dark:bg-propagentic-slate-dark text-center">
        <a 
          href="/signup"
          className="inline-block bg-propagentic-teal text-white px-8 py-3 rounded-lg font-medium hover:bg-propagentic-teal-dark transform hover:-translate-y-0.5 transition duration-150 text-center"
        >
          Get Started Free
        </a>
      </div>
    </div>
  );
};

export default CompetitorMatrix; 