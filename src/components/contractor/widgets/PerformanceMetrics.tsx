import React from 'react';
import {
  ChartBarIcon,
  ClockIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { designSystem } from '../../../styles/designSystem';
import CollapsibleWidget from './CollapsibleWidget';

interface PerformanceMetricsProps {
  completionRate: number;
  responseTime: number;
  customerSatisfaction: number;
}

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({
  completionRate = 0,
  responseTime = 0,
  customerSatisfaction = 0
}) => {
  // Helper function to determine color based on value
  const getColorClass = (value: number, metric: 'completion' | 'response' | 'satisfaction') => {
    if (metric === 'completion') {
      if (value >= 90) return 'text-green-600';
      if (value >= 75) return 'text-yellow-600';
      return 'text-red-600';
    } else if (metric === 'response') {
      if (value <= 2) return 'text-green-600';
      if (value <= 4) return 'text-yellow-600';
      return 'text-red-600';
    } else {
      if (value >= 90) return 'text-green-600';
      if (value >= 75) return 'text-yellow-600';
      return 'text-red-600';
    }
  };

  // Helper function to get meaningful default values and messages
  const getMetricDisplay = (value: number, type: 'completion' | 'response' | 'satisfaction') => {
    if (value === 0) {
      switch (type) {
        case 'completion':
          return {
            value: 'New',
            description: 'Complete your first job to see rate',
            showProgress: false
          };
        case 'response':
          return {
            value: '< 1 hr',
            description: 'Average response time goal',
            showProgress: false
          };
        case 'satisfaction':
          return {
            value: 'New',
            description: 'Complete jobs to get ratings',
            showProgress: false
          };
        default:
          return {
            value: 'N/A',
            description: 'No data available',
            showProgress: false
          };
      }
    }
    
    return {
      value: type === 'response' ? `${value} hrs` : `${value}%`,
      description: type === 'completion' 
        ? 'Jobs completed successfully'
        : type === 'response'
        ? 'Time to accept new jobs'
        : 'Based on client ratings',
      showProgress: true
    };
  };

  // Metrics data with improved handling
  const metrics = [
    {
      title: 'Completion Rate',
      value: completionRate,
      icon: ChartBarIcon,
      type: 'completion' as const,
      color: completionRate > 0 ? getColorClass(completionRate, 'completion') : 'text-gray-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      display: getMetricDisplay(completionRate, 'completion')
    },
    {
      title: 'Avg. Response Time',
      value: responseTime,
      icon: ClockIcon,
      type: 'response' as const,
      color: responseTime > 0 ? getColorClass(responseTime, 'response') : 'text-gray-500',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      display: getMetricDisplay(responseTime, 'response')
    },
    {
      title: 'Customer Satisfaction',
      value: customerSatisfaction,
      icon: StarIcon,
      type: 'satisfaction' as const,
      color: customerSatisfaction > 0 ? getColorClass(customerSatisfaction, 'satisfaction') : 'text-gray-500',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      display: getMetricDisplay(customerSatisfaction, 'satisfaction')
    }
  ];

  // Determine priority based on metrics
  const hasMetrics = completionRate > 0 || responseTime > 0 || customerSatisfaction > 0;
  const priority = hasMetrics ? 'medium' : 'low';

  return (
    <CollapsibleWidget
      title="Performance Metrics"
      icon={ChartBarIcon}
      priority={priority}
      defaultExpanded={hasMetrics} // Auto-collapse if no performance data yet
    >
      {/* Metrics grid with consistent spacing */}
      <div className="space-y-6">
        {metrics.map((metric, index) => {
          const IconComponent = metric.icon;
          const percentage = metric.display.showProgress 
            ? metric.type === 'response'
              ? Math.max(0, 100 - (metric.value / 8) * 100) // Invert for response time (lower is better)
              : metric.value
            : 0;

          return (
            <div 
              key={index}
              className={`${metric.bgColor} ${metric.borderColor} border rounded-xl p-5`}
            >
              {/* Metric header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className={`${designSystem.components.iconContainer.sm} ${metric.color} bg-white mr-3 shadow-sm`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-700">{metric.title}</h3>
                </div>
                <span className={`text-xl font-bold ${metric.color}`}>
                  {metric.display.value}
                </span>
              </div>
              
              {/* Progress indicator and description */}
              <div className="mt-3">
                {metric.display.showProgress && (
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-500 ${metric.color.replace('text-', 'bg-')}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                )}
                <p className="text-sm text-gray-600 leading-relaxed">{metric.display.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer with consistent button styling */}
      <div className="mt-8 pt-6 border-t border-orange-200">
        <button className={`w-full ${designSystem.components.button.outline} text-orange-700 bg-orange-50 hover:bg-orange-100`}>
          View Detailed Performance
        </button>
      </div>
    </CollapsibleWidget>
  );
};

export default PerformanceMetrics; 