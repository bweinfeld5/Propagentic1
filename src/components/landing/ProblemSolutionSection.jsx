import React from 'react';

const ProblemSolutionSection = () => {
  return (
    <section className="py-16 md:py-24 bg-propagentic-neutral-light dark:bg-propagentic-slate-dark">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-propagentic-slate-dark dark:text-white mb-16">
          A Better Way to Manage Properties
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {/* The Old Way */}
          <div className="bg-white dark:bg-propagentic-slate rounded-xl shadow-lg p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-red-500"></div>
            <h3 className="text-2xl font-bold text-propagentic-slate-dark dark:text-white mb-6">The Old Way</h3>
            
            <ul className="space-y-4">
              <li className="flex items-start">
                <div className="rounded-full p-1 bg-red-100 dark:bg-red-900 mr-4 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-propagentic-slate-dark dark:text-propagentic-neutral-light">Tenants call or email about maintenance issues, often with unclear descriptions</p>
                </div>
              </li>
              <li className="flex items-start">
                <div className="rounded-full p-1 bg-red-100 dark:bg-red-900 mr-4 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-propagentic-slate-dark dark:text-propagentic-neutral-light">Landlords manually search for available contractors, often settling for whoever is available</p>
                </div>
              </li>
              <li className="flex items-start">
                <div className="rounded-full p-1 bg-red-100 dark:bg-red-900 mr-4 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-propagentic-slate-dark dark:text-propagentic-neutral-light">Tenants kept in the dark about progress, with no clear timeline</p>
                </div>
              </li>
              <li className="flex items-start">
                <div className="rounded-full p-1 bg-red-100 dark:bg-red-900 mr-4 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-propagentic-slate-dark dark:text-propagentic-neutral-light">Manual paperwork, invoicing, and payment processing creates delays</p>
                </div>
              </li>
            </ul>
          </div>
          
          {/* The Propagentic Way */}
          <div className="bg-white dark:bg-propagentic-slate rounded-xl shadow-lg p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-propagentic-teal"></div>
            <h3 className="text-2xl font-bold text-propagentic-slate-dark dark:text-white mb-6">The Propagentic Way</h3>
            
            <ul className="space-y-4">
              <li className="flex items-start">
                <div className="rounded-full p-1 bg-propagentic-teal-light dark:bg-propagentic-teal mr-4 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-propagentic-slate-dark dark:text-propagentic-neutral-light">AI analyzes maintenance requests and automatically categorizes issues</p>
                </div>
              </li>
              <li className="flex items-start">
                <div className="rounded-full p-1 bg-propagentic-teal-light dark:bg-propagentic-teal mr-4 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-propagentic-slate-dark dark:text-propagentic-neutral-light">Smart matching connects you with pre-vetted, specialized contractors</p>
                </div>
              </li>
              <li className="flex items-start">
                <div className="rounded-full p-1 bg-propagentic-teal-light dark:bg-propagentic-teal mr-4 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-propagentic-slate-dark dark:text-propagentic-neutral-light">Real-time updates and progress tracking for all parties</p>
                </div>
              </li>
              <li className="flex items-start">
                <div className="rounded-full p-1 bg-propagentic-teal-light dark:bg-propagentic-teal mr-4 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-propagentic-slate-dark dark:text-propagentic-neutral-light">Seamless digital invoicing, approvals, and payment processing</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSolutionSection; 