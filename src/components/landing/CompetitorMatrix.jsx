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
    <div className="flex items-center justify-center">
      <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center border border-green-200 dark:border-green-800">
        <svg className="h-5 w-5 text-green-600 dark:text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </div>
    </div>
  );

  const XIcon = () => (
    <div className="flex items-center justify-center">
      <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center border border-red-200 dark:border-red-800">
        <svg className="h-5 w-5 text-red-500 dark:text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-slate-100 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-600">
              <th className="py-4 px-6 text-left text-gray-900 dark:text-white font-bold text-lg">Features</th>
              <th className="py-4 px-6 text-center">
                <div className="inline-flex flex-col items-center">
                  <span className="text-orange-500 dark:text-orange-400 font-bold text-lg">Propagentic</span>
                  <span className="text-xs text-orange-600 dark:text-orange-300 mt-1 bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded-full">AI-powered</span>
                </div>
              </th>
              <th className="py-4 px-6 text-center">
                <div className="inline-flex flex-col items-center">
                  <span className="text-gray-900 dark:text-white font-bold text-lg">AppFolio</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">Traditional</span>
                </div>
              </th>
              <th className="py-4 px-6 text-center">
                <div className="inline-flex flex-col items-center">
                  <span className="text-gray-900 dark:text-white font-bold text-lg">Buildium</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">Traditional</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {compareFeatures.map((item, index) => (
              <tr 
                key={index} 
                className={`transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                  index % 2 === 0 
                    ? 'bg-white dark:bg-gray-800' 
                    : 'bg-slate-50 dark:bg-gray-700/30'
                }`}
              >
                <td className="py-5 px-6 border-b border-gray-100 dark:border-gray-600">
                  <div className="text-gray-900 dark:text-white font-medium text-base">{item.feature}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.description}</div>
                </td>
                <td className="py-5 px-6 text-center border-b border-gray-100 dark:border-gray-600">
                  {item.propagentic ? <CheckIcon /> : <XIcon />}
                </td>
                <td className="py-5 px-6 text-center border-b border-gray-100 dark:border-gray-600">
                  {item.appfolio ? <CheckIcon /> : <XIcon />}
                </td>
                <td className="py-5 px-6 text-center border-b border-gray-100 dark:border-gray-600">
                  {item.buildium ? <CheckIcon /> : <XIcon />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="py-8 px-6 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-gray-800 dark:to-gray-700 text-center border-t border-gray-200 dark:border-gray-600">
        <p className="text-gray-600 dark:text-gray-300 mb-4 font-medium">
          Experience the PropAgentic advantage with our AI-powered platform
        </p>
        <a 
          href="/signup"
          className="inline-block bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-3 rounded-lg font-medium transform hover:-translate-y-0.5 transition-all duration-200 text-center shadow-lg hover:shadow-xl"
        >
          Get Started Free
        </a>
      </div>
    </div>
  );
};

export default CompetitorMatrix; 