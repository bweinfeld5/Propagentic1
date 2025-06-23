import React from 'react';
import { HomeIcon, UserGroupIcon, ClipboardDocumentListIcon, ChartBarIcon, ClockIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

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

const OverviewCards = ({ stats }) => {
  // Default stats if none provided
  const defaultStats = {
    totalProperties: 0,
    activeTenants: 0,
    openRequests: 0,
    occupancyRate: 0,
    avgResponseTime: null,
    monthlyMaintenanceCost: null
  };

  const displayStats = { ...defaultStats, ...stats };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <OverviewCard 
        title="Total Properties" 
        value={displayStats.totalProperties} 
        icon={HomeIcon} 
        iconBgColor="bg-blue-100"
      />
      <OverviewCard 
        title="Active Tenants" 
        value={displayStats.activeTenants} 
        icon={UserGroupIcon}
        iconBgColor="bg-green-100" 
      />
      <OverviewCard 
        title="Open Requests" 
        value={displayStats.openRequests} 
        icon={ClipboardDocumentListIcon}
        iconBgColor="bg-amber-100" 
      />
      <OverviewCard 
        title="Occupancy Rate" 
        value={`${displayStats.occupancyRate}%`} 
        icon={ChartBarIcon}
        iconBgColor="bg-purple-100" 
      />
      
      {/* Optional metrics - only show if provided */}
      {displayStats.avgResponseTime && (
        <OverviewCard 
          title="Avg. Response Time" 
          value={displayStats.avgResponseTime} 
          icon={ClockIcon}
          iconBgColor="bg-indigo-100"
        />
      )}
      
      {displayStats.monthlyMaintenanceCost && (
        <OverviewCard 
          title="Monthly Maintenance" 
          value={`$${displayStats.monthlyMaintenanceCost}`} 
          icon={CurrencyDollarIcon}
          iconBgColor="bg-rose-100"
        />
      )}
    </div>
  );
};

export default OverviewCards; 