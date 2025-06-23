import React from 'react';
import { TrendingUp, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

interface AnalyticsData {
  responseTimeAvg: number;
  responseTimeTrend: 'up' | 'down' | 'stable';
  completionRate: number;
  urgentRequests: number;
  monthlyData: Array<{
    month: string;
    requests: number;
    avgResponseTime: number;
  }>;
}

interface AdvancedAnalyticsProps {
  data: AnalyticsData;
}

const AdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({ data }) => {
  return (
    <div className="space-y-6">
      {/* KPI Cards with Trends */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Avg Response Time</p>
              <p className="text-2xl font-bold text-gray-900">{data.responseTimeAvg}h</p>
            </div>
            <div className={`p-3 rounded-full ${
              data.responseTimeTrend === 'down' ? 'bg-green-100' : 'bg-orange-100'
            }`}>
              <Clock className={`w-6 h-6 ${
                data.responseTimeTrend === 'down' ? 'text-green-600' : 'text-orange-600'
              }`} />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className={`w-4 h-4 mr-1 ${
              data.responseTimeTrend === 'down' ? 'text-green-500' : 'text-orange-500'
            }`} />
            <span className={`text-sm font-medium ${
              data.responseTimeTrend === 'down' ? 'text-green-600' : 'text-orange-600'
            }`}>
              {data.responseTimeTrend === 'down' ? '15% faster' : '5% slower'} than last month
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{data.completionRate}%</p>
            </div>
            <div className="p-3 rounded-full bg-green-100">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${data.completionRate}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Urgent Requests</p>
              <p className="text-2xl font-bold text-gray-900">{data.urgentRequests}</p>
            </div>
            <div className="p-3 rounded-full bg-red-100">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">Requires immediate attention</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 font-medium">Property Score</p>
              <p className="text-3xl font-bold">9.2/10</p>
            </div>
            <div className="p-3 rounded-full bg-white/20">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-orange-100 text-sm mt-4">Excellent maintenance response</p>
        </div>
      </div>

      {/* Request Trends Chart */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Trends</h3>
        <div className="h-64 flex items-end space-x-2">
          {data.monthlyData.map((month, index) => (
            <div key={month.month} className="flex-1 flex flex-col items-center">
              <div 
                className="w-full bg-gradient-to-t from-orange-500 to-orange-400 rounded-t-md hover:from-orange-600 hover:to-orange-500 transition-colors cursor-pointer"
                style={{ 
                  height: `${(month.requests / Math.max(...data.monthlyData.map(m => m.requests))) * 200}px`,
                  minHeight: '20px'
                }}
                title={`${month.requests} requests`}
              ></div>
              <p className="text-xs text-gray-500 mt-2">{month.month}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalytics; 