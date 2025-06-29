import React, { useState, useEffect } from 'react';
import { 
  ClipboardDocumentListIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  StarIcon,
  BellIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import ContractorMetricCard from '../../components/contractor/ContractorMetricCard';
import ContractorQuickActions from '../../components/contractor/ContractorQuickActions';
import ContractorRequestsTable from '../../components/contractor/ContractorRequestsTable';

interface JobRequest {
  id: string;
  property: string;
  issue: string;
  date: string;
  priority: 'high' | 'medium' | 'low';
  description?: string;
  estimatedDuration?: string;
}

interface Activity {
  id: string;
  type: 'completed' | 'invoice' | 'new_job' | 'payment';
  title: string;
  subtitle: string;
  amount?: string;
  status?: string;
  initials: string;
  time: string;
}

const ContractorDashboardPage: React.FC = () => {
  const [pendingRequests] = useState<JobRequest[]>([
    {
      id: '1',
      property: '123 Main St, Unit 4B',
      issue: 'Leaky Faucet',
      date: '2023-06-23',
      priority: 'high',
      description: 'Kitchen sink faucet dripping continuously',
      estimatedDuration: '2-3 hours'
    },
    {
      id: '2', 
      property: '456 Oak Ave, Unit 12',
      issue: 'Broken Window',
      date: '2023-06-22',
      priority: 'medium',
      description: 'Bedroom window pane cracked',
      estimatedDuration: '1-2 hours'
    }
  ]);

  const [recentActivity] = useState<Activity[]>([
    {
      id: '1',
      type: 'completed',
      title: 'Job Completed',
      subtitle: '789 Pine Ln: HVAC Repair',
      amount: '+ $250.00',
      initials: 'OM',
      time: '2 hours ago'
    },
    {
      id: '2',
      type: 'invoice',
      title: 'Invoice Sent',
      subtitle: '#INV-0023 for 101 Maple Dr',
      status: 'Pending',
      initials: 'JL', 
      time: '4 hours ago'
    }
  ]);

  const metrics = [
    {
      title: 'Pending Requests',
      value: 12,
      subtitle: 'since last week',
      trend: '+2',
      icon: <ClipboardDocumentListIcon className="w-5 h-5" />
    },
    {
      title: 'Upcoming Jobs (Next 3 Days)',
      value: 3,
      subtitle: 'starting today',
      trend: '1',
      icon: <CalendarDaysIcon className="w-5 h-5" />
    },
    {
      title: 'Earnings This Week',
      value: '$1,250.00',
      subtitle: 'Based on completed jobs',
      icon: <CurrencyDollarIcon className="w-5 h-5" />
    },
    {
      title: 'Average Rating',
      value: '4.9',
      subtitle: 'From 87 reviews',
      icon: <StarIcon className="w-5 h-5" />
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Contractor Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600 relative">
                <BellIcon className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full"></span>
              </button>
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">AV</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric, index) => (
            <ContractorMetricCard key={index} {...metric} />
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <ContractorQuickActions 
              onViewAllRequests={() => console.log('View all requests')}
              onUpdateAvailability={(available) => console.log('Availability:', available)}
              currentAvailability={true}
            />
          </div>

          {/* Recent High-Priority Requests */}
          <div className="lg:col-span-2">
            <ContractorRequestsTable 
              requests={pendingRequests}
              onAcceptRequest={(id) => console.log('Accept request:', id)}
              onViewDetails={(id) => console.log('View details:', id)}
              onViewAll={() => console.log('View all requests')}
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h2>
            
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-700 text-sm font-medium">{activity.initials}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      {activity.type === 'completed' && (
                        <CheckIcon className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{activity.subtitle}</p>
                  </div>
                  
                  <div className="text-right">
                    {activity.amount && (
                      <p className="text-sm font-semibold text-green-600">{activity.amount}</p>
                    )}
                    {activity.status && (
                      <p className="text-sm text-gray-500">{activity.status}</p>
                    )}
                    <p className="text-xs text-gray-400">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractorDashboardPage; 