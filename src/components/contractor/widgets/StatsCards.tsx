import React from 'react';
import {
  ClipboardDocumentListIcon,
  ClockIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  ArrowRightIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { designSystem } from '../../../styles/designSystem';
import { layoutSystem, getGridLayout } from '../../../styles/layoutSystem';

interface StatsCardsProps {
  stats: {
    newJobs: number;
    activeJobs: number;
    completedJobs: number;
    totalEarnings: number;
  };
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getCardData = () => {
    const isNewContractor = stats.completedJobs === 0 && stats.totalEarnings === 0;
    
    return [
      {
        title: 'New Jobs',
        value: stats.newJobs,
        icon: ClipboardDocumentListIcon,
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        trend: stats.newJobs > 0 ? '+' + stats.newJobs : null,
        trendColor: 'text-green-600',
        description: stats.newJobs > 0 
          ? `${stats.newJobs} job${stats.newJobs === 1 ? '' : 's'} available`
          : 'New jobs will appear here',
        actionText: stats.newJobs > 0 ? 'View Jobs' : 'Complete Verification',
        isEmpty: stats.newJobs === 0,
        priority: 'high' // Show first on mobile
      },
      {
        title: 'Active Jobs',
        value: stats.activeJobs,
        icon: ClockIcon,
        iconBg: 'bg-orange-100',
        iconColor: 'text-orange-600',
        trend: null,
        description: stats.activeJobs > 0 
          ? `${stats.activeJobs} job${stats.activeJobs === 1 ? '' : 's'} in progress`
          : isNewContractor 
            ? 'Accept your first job to get started'
            : 'No active jobs at the moment',
        actionText: stats.activeJobs > 0 ? 'Manage Jobs' : null,
        isEmpty: stats.activeJobs === 0,
        priority: 'high' // Show second on mobile
      },
      {
        title: 'Completed (This Month)',
        value: stats.completedJobs,
        icon: CheckCircleIcon,
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
        trend: stats.completedJobs > 0 ? '+' + stats.completedJobs : null,
        trendColor: 'text-green-600',
        description: stats.completedJobs > 0 
          ? `${stats.completedJobs} job${stats.completedJobs === 1 ? '' : 's'} completed this month`
          : isNewContractor
            ? 'Complete jobs to build your reputation'
            : 'No completed jobs this month',
        actionText: stats.completedJobs > 0 ? 'View History' : null,
        isEmpty: stats.completedJobs === 0,
        priority: 'medium' // Show third on mobile
      },
      {
        title: 'Total Earnings',
        value: formatCurrency(stats.totalEarnings),
        icon: CurrencyDollarIcon,
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
        trend: stats.totalEarnings > 0 ? '+' + formatCurrency(stats.totalEarnings) : null,
        trendColor: 'text-green-600',
        description: stats.totalEarnings > 0 
          ? 'Total earned to date'
          : isNewContractor
            ? 'Start completing jobs to earn money'
            : 'No earnings yet',
        actionText: stats.totalEarnings > 0 ? 'View Earnings' : 'Find Jobs',
        isEmpty: stats.totalEarnings === 0,
        isEarnings: true,
        priority: 'high' // Important for contractors
      }
    ];
  };

  const cards = getCardData();

  return (
    <div className={`${getGridLayout('stats')} gap-4 md:gap-6`}>
      {cards.map((card, index) => {
        const IconComponent = card.icon;
        
        return (
          <div 
            key={index}
            className={`${designSystem.components.widget.base} ${designSystem.components.widget.borderRadius} p-4 md:p-6 ${
              // Mobile-first responsive design
              index < 2 ? 'order-1' : index === 2 ? 'order-3 lg:order-2' : 'order-2 lg:order-3'
            }`}
          >
            {/* Header with icon and trend - responsive layout */}
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className={`${designSystem.components.iconContainer.lg} ${card.iconBg}`}>
                <IconComponent className={`w-5 h-5 md:w-6 md:h-6 ${card.iconColor}`} />
              </div>
              {card.trend && (
                <span className={`text-xs md:text-sm font-medium ${card.trendColor} flex items-center`}>
                  <ArrowRightIcon className="w-3 h-3 mr-1" />
                  {card.trend}
                </span>
              )}
            </div>
            
            {/* Title and value - responsive typography */}
            <div className="mb-3 md:mb-4">
              <h3 className="text-xs md:text-sm font-medium text-gray-600 mb-2 leading-tight">{card.title}</h3>
              <div className="flex items-baseline">
                <span className="text-2xl md:text-3xl font-bold text-gray-900 leading-none">
                  {card.isEarnings ? card.value : card.value}
                </span>
                {card.isEmpty && !card.isEarnings && (
                  <SparklesIcon className="w-4 h-4 md:w-5 md:h-5 text-orange-500 ml-2" />
                )}
              </div>
            </div>
            
            {/* Description - responsive text */}
            <p className="text-xs md:text-sm text-gray-500 mb-3 md:mb-4 leading-relaxed">
              {card.description}
            </p>
            
            {/* Action button - responsive sizing */}
            {card.actionText && (
              <button 
                className={`w-full text-xs md:text-sm font-medium py-2 md:py-2.5 px-3 md:px-4 rounded-lg transition-all duration-200 ${
                  card.isEmpty 
                    ? `${designSystem.components.button.outline} text-orange-700 bg-orange-50 hover:bg-orange-100`
                    : `${designSystem.components.button.secondary}`
                }`}
              >
                {card.actionText}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StatsCards; 