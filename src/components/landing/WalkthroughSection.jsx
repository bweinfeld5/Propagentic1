import React from 'react';
import WorkflowDemo from './WorkflowDemo';

const WalkthroughSection = () => {
  return (
    <div className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-base text-propagentic-teal font-semibold tracking-wide uppercase">Interactive Demo</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            See How It Works
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
            Try our interactive demo and see how Propagentic streamlines the entire maintenance workflow.
          </p>
        </div>

        <div className="mt-8">
          <WorkflowDemo />
        </div>
      </div>
    </div>
  );
};

export default WalkthroughSection; 