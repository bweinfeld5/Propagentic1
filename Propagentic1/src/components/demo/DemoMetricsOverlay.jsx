import React from 'react';
import { useDemo } from '../../context/DemoContext';
import { 
  ChartBarIcon, 
  ClockIcon, 
  UserGroupIcon, 
  HomeIcon,
  SparklesIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';

const DemoMetricsOverlay = () => {
  const { metrics } = useDemo();

  const metricCards = [
    {
      label: 'Properties Added',
      value: metrics.totalProperties,
      icon: HomeIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
      suffix: ''
    },
    {
      label: 'Active Tenants',
      value: metrics.totalTenants,
      icon: UserGroupIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900',
      suffix: ''
    },
    {
      label: 'Property Setup Time',
      value: metrics.propertySetupTime > 0 ? Math.round(metrics.propertySetupTime) : '--',
      icon: ClockIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900',
      suffix: 's'
    },
    {
      label: 'Avg Response Time',
      value: metrics.maintenanceResponseTime || 12,
      icon: ArrowTrendingUpIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900',
      suffix: ' min'
    },
    {
      label: 'Tenant Satisfaction',
      value: metrics.satisfactionScore,
      icon: SparklesIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900',
      suffix: '/5'
    },
    {
      label: 'Call Reduction',
      value: metrics.phoneCallReduction,
      icon: ChartBarIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900',
      suffix: '%'
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {metricCards.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div
                key={index}
                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 transition-all hover:shadow-md"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className={`p-2 rounded-md ${metric.bgColor}`}>
                    <Icon className={`h-4 w-4 ${metric.color}`} />
                  </div>
                  <span className={`text-xs font-medium ${metric.color}`}>
                    Live
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  {metric.label}
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {metric.value}{metric.suffix}
                </p>
              </div>
            );
          })}
        </div>
        
        {/* Comparison Banner */}
        <div className="mt-4 bg-gradient-to-r from-teal-50 to-teal-100 dark:from-teal-900 dark:to-teal-800 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-teal-600 text-white rounded-full p-2">
                <ArrowTrendingUpIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-teal-900 dark:text-teal-100">
                  PropAgentic vs Traditional Property Management
                </p>
                <p className="text-xs text-teal-700 dark:text-teal-300">
                  {metrics.responseTimeImprovement}% faster response times • {metrics.phoneCallReduction}% fewer phone calls
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-teal-600 dark:text-teal-400">ROI</p>
              <p className="text-lg font-bold text-teal-900 dark:text-teal-100">312%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoMetricsOverlay; 