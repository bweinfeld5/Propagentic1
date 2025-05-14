import React from 'react';
import { ClipboardDocumentListIcon as ClipboardListIcon, ClockIcon, CheckCircleIcon, BoltIcon as LightningBoltIcon } from '@heroicons/react/24/outline';

const OverviewCard = ({ title, value, icon: Icon, trend, trendLabel, iconBgColor }) => (
  <div className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition-shadow duration-200">
    <div className="flex justify-between items-center mb-3">
      <h3 className="text-sm font-medium text-slate-500">{title}</h3>
      <div className={`${iconBgColor || 'bg-teal-100'} p-2 rounded-lg`}>
        <Icon className="h-5 w-5 text-teal-600" />
      </div>
    </div>
    <p className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">{value}</p>
    {trend && (
      <p className={`text-xs flex items-center ${trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
        <span className={`inline-block mr-1 ${trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
          {trend.startsWith('+') ? '↑' : '↓'}
        </span>
        {trend} {trendLabel || 'from last month'}
      </p>
    )}
  </div>
);

const ContractorOverviewCards = ({ stats }) => {
  // Default stats if none provided
  const defaultStats = {
    newJobs: 0,
    activeJobs: 0,
    completedThisMonth: 0,
    avgCompletionTime: null, // Optional
  };

  const displayStats = { ...defaultStats, ...stats };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <OverviewCard 
        title="New Jobs" 
        value={displayStats.newJobs} 
        icon={ClipboardListIcon}
        iconBgColor="bg-blue-100" 
      />
      <OverviewCard 
        title="Active Jobs" 
        value={displayStats.activeJobs} 
        icon={ClockIcon}
        iconBgColor="bg-yellow-100"
      />
      <OverviewCard 
        title="Completed (This Month)" 
        value={displayStats.completedThisMonth} 
        icon={CheckCircleIcon}
        iconBgColor="bg-green-100"
      />
      
      {/* Show average completion time if available */}
      {displayStats.avgCompletionTime && (
        <OverviewCard 
          title="Avg. Completion Time" 
          value={displayStats.avgCompletionTime}
          icon={LightningBoltIcon}
          iconBgColor="bg-purple-100"
        />
      )}
    </div>
  );
};

export default ContractorOverviewCards; 