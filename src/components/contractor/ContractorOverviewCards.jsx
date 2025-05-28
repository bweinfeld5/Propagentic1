import React from 'react';
import { ClipboardDocumentListIcon as ClipboardListIcon, ClockIcon, CheckCircleIcon, BoltIcon as LightningBoltIcon } from '@heroicons/react/24/outline';

const OverviewCard = ({ title, value, icon: Icon, trend, trendLabel, iconBgColor, iconColor }) => (
  <div className="bg-background dark:bg-background-darkSubtle rounded-xl shadow-md border border-border dark:border-border-dark p-6 hover:shadow-lg transition-all duration-200">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-sm font-medium text-content-secondary dark:text-content-darkSecondary">{title}</h3>
      <div className={`${iconBgColor || 'bg-primary/10 dark:bg-primary/20'} p-3 rounded-lg`}>
        <Icon className={`h-6 w-6 ${iconColor || 'text-primary dark:text-primary-light'}`} />
      </div>
    </div>
    <p className="text-3xl font-bold text-content dark:text-content-dark mb-2">{value}</p>
    {trend && (
      <p className={`text-sm flex items-center ${trend.startsWith('+') ? 'text-success dark:text-emerald-300' : 'text-error dark:text-red-400'}`}>
        <span className={`inline-block mr-1 ${trend.startsWith('+') ? 'text-success' : 'text-error'}`}>
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
        iconBgColor="bg-info/10 dark:bg-info/20" 
        iconColor="text-info dark:text-blue-300"
      />
      <OverviewCard 
        title="Active Jobs" 
        value={displayStats.activeJobs} 
        icon={ClockIcon}
        iconBgColor="bg-warning/10 dark:bg-warning/20"
        iconColor="text-warning dark:text-yellow-300"
      />
      <OverviewCard 
        title="Completed (This Month)" 
        value={displayStats.completedThisMonth} 
        icon={CheckCircleIcon}
        iconBgColor="bg-success/10 dark:bg-success/20"
        iconColor="text-success dark:text-emerald-300"
      />
      
      {/* Show average completion time if available */}
      {displayStats.avgCompletionTime && (
        <OverviewCard 
          title="Avg. Completion Time" 
          value={displayStats.avgCompletionTime}
          icon={LightningBoltIcon}
          iconBgColor="bg-secondary/10 dark:bg-secondary/20"
          iconColor="text-secondary dark:text-secondary-light"
        />
      )}
    </div>
  );
};

export default ContractorOverviewCards; 