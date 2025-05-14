import React from 'react';
import AnimatedStat from './AnimatedStat';

const StatsSection = () => {
  return (
    <section className="py-16 md:py-24 bg-propagentic-neutral-lightest dark:bg-propagentic-slate-dark">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-propagentic-slate-dark dark:text-propagentic-neutral-lightest mb-4">
            Making Property Management Easier
          </h2>
          <p className="text-xl text-propagentic-slate dark:text-propagentic-neutral-light max-w-3xl mx-auto">
            Thousands of property owners, tenants, and contractors trust Propagentic for their daily operations.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <AnimatedStat value={65} suffix="%" label="Time saved on maintenance requests" />
          <AnimatedStat value={3500} label="Property units managed" />
          <AnimatedStat value={98} suffix="%" label="Customer satisfaction" />
        </div>
      </div>
    </section>
  );
};

export default StatsSection; 