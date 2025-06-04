import React, { useState } from 'react';
import {
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { designSystem } from '../../../styles/designSystem';
import CollapsibleWidget from './CollapsibleWidget';

interface EarningsDashboardProps {
  totalEarnings: number;
  pendingPayments: number;
}

const EarningsDashboard: React.FC<EarningsDashboardProps> = ({ 
  totalEarnings, 
  pendingPayments 
}) => {
  const [timeframe, setTimeframe] = useState<'week' | 'month'>('week');
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Mock data for earnings chart
  const weeklyData = [
    { day: 'Mon', amount: 120 },
    { day: 'Tue', amount: 250 },
    { day: 'Wed', amount: 180 },
    { day: 'Thu', amount: 310 },
    { day: 'Fri', amount: 290 },
    { day: 'Sat', amount: 150 },
    { day: 'Sun', amount: 0 }
  ];
  
  const monthlyData = [
    { week: 'Week 1', amount: 950 },
    { week: 'Week 2', amount: 1200 },
    { week: 'Week 3', amount: 830 },
    { week: 'Week 4', amount: 1400 }
  ];
  
  // Calculate max value for chart scaling
  const maxValue = Math.max(
    ...(timeframe === 'week' 
      ? weeklyData.map(d => d.amount) 
      : monthlyData.map(d => d.amount))
  );
  
  // Calculate totals
  const weeklyTotal = weeklyData.reduce((sum, day) => sum + day.amount, 0);
  const monthlyTotal = monthlyData.reduce((sum, week) => sum + week.amount, 0);
  const currentTotal = timeframe === 'week' ? weeklyTotal : monthlyTotal;
  
  // Mock trend data
  const weeklyTrend = 12; // 12% increase
  const monthlyTrend = 8; // 8% increase
  const currentTrend = timeframe === 'week' ? weeklyTrend : monthlyTrend;
  const isTrendPositive = currentTrend > 0;
  const TrendIcon = isTrendPositive ? ArrowTrendingUpIcon : ArrowTrendingDownIcon;
  
  // Payment status data
  const paymentStatusData = [
    { status: 'Paid', amount: totalEarnings, color: 'bg-green-500' },
    { status: 'Pending', amount: pendingPayments, color: 'bg-yellow-500' },
    { status: 'Overdue', amount: 350, color: 'bg-red-500' } // Mock data
  ];
  
  const totalPayments = paymentStatusData.reduce((sum, item) => sum + item.amount, 0);

  // Timeframe Toggle Component
  const TimeframeToggle = () => (
    <div className="flex bg-orange-100 rounded-lg p-1">
      <button
        onClick={() => setTimeframe('week')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
          timeframe === 'week'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Week
      </button>
      <button
        onClick={() => setTimeframe('month')}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
          timeframe === 'month'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Month
      </button>
    </div>
  );

  return (
    <CollapsibleWidget
      title="Earnings Dashboard"
      icon={CurrencyDollarIcon}
      priority="high"
      actions={<TimeframeToggle />}
      defaultExpanded={totalEarnings > 0} // Auto-collapse if no earnings yet
    >
      {/* Main content grid with consistent spacing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Left column - Summary with improved styling */}
        <div className="space-y-6">
          {/* Current Earnings Card */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-6 text-white shadow-lg">
            <h3 className="text-sm font-medium text-white/90 mb-2">
              {timeframe === 'week' ? 'This Week' : 'This Month'}
            </h3>
            <div className="flex items-end space-x-3 mb-2">
              <span className="text-3xl font-bold leading-none">{formatCurrency(currentTotal)}</span>
              {currentTrend !== undefined && currentTrend !== null && currentTrend !== 8 && currentTrend !== 12 && (
                <div className={`flex items-center text-sm font-medium ${
                  isTrendPositive ? 'text-green-200' : 'text-red-200'
                }`}>
                  <TrendIcon className="w-4 h-4 mr-1" />
                  <span>{Math.abs(currentTrend)}%</span>
                </div>
              )}
            </div>
            <p className="text-xs text-white/80">
              {timeframe === 'week' 
                ? 'vs. previous week' 
                : 'vs. previous month'}
            </p>
          </div>
          
          {/* Payment Status Card with improved styling */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-5">Payment Status</h3>
            
            <div className="space-y-5">
              {paymentStatusData.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 font-medium">{item.status}</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(item.amount)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={`${item.color} h-2.5 rounded-full transition-all duration-500`} 
                      style={{ width: `${(item.amount / totalPayments) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            
            <button className={`mt-6 w-full ${designSystem.components.button.outline} text-orange-700 bg-orange-50 hover:bg-orange-100 flex items-center justify-center`}>
              <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
              Download Statement
            </button>
          </div>
        </div>
        
        {/* Right column - Chart with improved styling */}
        <div className="lg:col-span-2">
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 h-full">
            {/* Chart header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-semibold text-gray-700">
                {timeframe === 'week' ? 'Daily Earnings' : 'Weekly Earnings'}
              </h3>
              <div className="flex items-center text-xs text-gray-500">
                <CalendarIcon className="w-4 h-4 mr-2" />
                <span className="font-medium">
                  {timeframe === 'week' 
                    ? 'May 1 - May 7, 2023' 
                    : 'May 2023'}
                </span>
              </div>
            </div>
            
            {/* Chart with improved spacing */}
            <div className="h-64 flex items-end space-x-3 mb-6">
              {(timeframe === 'week' ? weeklyData : monthlyData).map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex justify-center mb-3">
                    <div 
                      className="w-full max-w-[32px] bg-gradient-to-t from-orange-500 to-orange-300 rounded-t-lg shadow-sm"
                      style={{ 
                        height: `${(item.amount / maxValue) * 180}px`,
                        opacity: item.amount > 0 ? 1 : 0.3
                      }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-600 font-medium mb-1">
                    {timeframe === 'week' ? (item as { day: string; amount: number }).day : (item as { week: string; amount: number }).week}
                  </span>
                  <span className="text-xs font-semibold text-gray-900">
                    ${item.amount}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Chart Legend with improved styling */}
            <div className="pt-6 border-t border-gray-200 flex justify-between items-center">
              <div className="flex items-center space-x-6">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                  <span className="text-xs text-gray-600 font-medium">Earnings</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-300 rounded-full mr-2"></div>
                  <span className="text-xs text-gray-600 font-medium">Target</span>
                </div>
              </div>
              
              <button className="text-xs text-orange-600 hover:text-orange-700 font-medium flex items-center transition-colors duration-200">
                <ChartBarIcon className="w-4 h-4 mr-1" />
                Detailed Analytics
              </button>
            </div>
          </div>
        </div>
      </div>
    </CollapsibleWidget>
  );
};

export default EarningsDashboard; 