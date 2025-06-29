import React from 'react';

interface ContractorMetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
}

const ContractorMetricCard: React.FC<ContractorMetricCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend,
  trendDirection = 'neutral' 
}) => {
  const getTrendColor = () => {
    switch (trendDirection) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-orange-600';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200 hover:border-orange-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <div className="p-2 bg-orange-50 rounded-lg">
          <div className="w-5 h-5 text-orange-600">
            {icon}
          </div>
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">
          {trend && (
            <span className={`font-medium ${getTrendColor()}`}>
              {trend}{' '}
            </span>
          )}
          {subtitle}
        </p>
      </div>
    </div>
  );
};

export default ContractorMetricCard; 