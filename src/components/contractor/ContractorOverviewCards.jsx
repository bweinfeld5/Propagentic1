import React from 'react';
import { ClipboardDocumentListIcon as ClipboardListIcon, ClockIcon, CheckCircleIcon, BoltIcon as LightningBoltIcon } from '@heroicons/react/24/outline';

const OverviewCard = ({ title, value, icon: Icon, trend, trendLabel, iconBgColor, iconColor }) => (
  <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-orange-200 p-6 hover:shadow-xl transition-all duration-200 transform hover:scale-105">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      <div className={`${iconBgColor || 'bg-orange-100'} p-3 rounded-lg`}>
        <Icon className={`h-6 w-6 ${iconColor || 'text-orange-600'}`} />
      </div>
    </div>
    <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
    {trend && (
      <p className={`text-sm flex items-center ${trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
        <span className={`inline-block mr-1 ${trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
          {trend.startsWith('+') ? '↗' : '↘'}
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <OverviewCard 
        title="New Jobs" 
        value={displayStats.newJobs} 
        icon={ClipboardListIcon}
        iconBgColor="bg-blue-100" 
        iconColor="text-blue-600"
      />
      <OverviewCard 
        title="Active Jobs" 
        value={displayStats.activeJobs} 
        icon={ClockIcon}
        iconBgColor="bg-orange-100"
        iconColor="text-orange-600"
      />
      <OverviewCard 
        title="Completed (This Month)" 
        value={displayStats.completedThisMonth} 
        icon={CheckCircleIcon}
        iconBgColor="bg-green-100"
        iconColor="text-green-600"
      />
      
      {/* Show average completion time if available */}
      {displayStats.avgCompletionTime && (
        <OverviewCard 
          title="Avg. Completion Time" 
          value={displayStats.avgCompletionTime}
          icon={LightningBoltIcon}
          iconBgColor="bg-purple-100"
          iconColor="text-purple-600"
        />
      )}
    </div>
  );
};

export default ContractorOverviewCards; 