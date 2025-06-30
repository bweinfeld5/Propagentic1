import React, { useState, useEffect } from 'react';
import { 
  BellIcon, 
  Cog6ToothIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  DocumentCheckIcon,
  ArrowRightIcon,
  ClockIcon,
  CurrencyDollarIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';

interface ContractorStats {
  newJobs: number;
  activeJobs: number;
  completedThisMonth: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
}

const CleanContractorDashboard: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<ContractorStats>({
    newJobs: 0,
    activeJobs: 0,
    completedThisMonth: 0,
    weeklyEarnings: 0,
    monthlyEarnings: 0
  });

  // Mock data - replace with real data fetching
  useEffect(() => {
    setStats({
      newJobs: 0,
      activeJobs: 0,
      completedThisMonth: 0,
      weeklyEarnings: 0,
      monthlyEarnings: 0
    });
  }, []);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: ChartBarIcon },
    { id: 'jobs', label: 'Job Assignments', icon: ClipboardDocumentListIcon },
    { id: 'verification', label: 'Document Verification', icon: DocumentCheckIcon },
    { id: 'notifications', label: 'Notifications', icon: BellIcon }
  ];

  const quickActions = [
    {
      title: 'View Jobs',
      subtitle: 'Check new assignments',
      icon: ClipboardDocumentListIcon,
      action: () => setActiveTab('jobs')
    },
    {
      title: 'Upload Documents',
      subtitle: 'Add verification documents',
      icon: DocumentCheckIcon,
      action: () => setActiveTab('verification')
    },
    {
      title: 'Update Schedule',
      subtitle: 'Set your availability',
      icon: ClockIcon,
      action: () => console.log('Update schedule')
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Contractor Dashboard</h1>
              <p className="text-sm text-orange-600">Manage your jobs and verification status</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <BellIcon className="w-6 h-6" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Cog6ToothIcon className="w-6 h-6" />
              </button>
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {userProfile?.firstName?.charAt(0) || 'C'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-1 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-5 h-5 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">New Jobs</h3>
                    <p className="text-3xl font-bold text-gray-900">{stats.newJobs}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <ClipboardDocumentListIcon className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Active Jobs</h3>
                    <p className="text-3xl font-bold text-gray-900">{stats.activeJobs}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <ClockIcon className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Completed (This Month)</h3>
                    <p className="text-3xl font-bold text-gray-900">{stats.completedThisMonth}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircleIcon className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Earnings Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <CurrencyDollarIcon className="w-5 h-5 text-orange-500 mr-2" />
                    Earnings
                  </h3>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 text-sm font-medium text-orange-600 bg-orange-50 rounded-md">
                      Week
                    </button>
                    <button className="px-3 py-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md">
                      Month
                    </button>
                  </div>
                </div>
                
                <div className="text-center py-8">
                  <p className="text-4xl font-bold text-gray-900 mb-2">${stats.weeklyEarnings}</p>
                  <div className="flex justify-center space-x-4">
                    <div className="bg-gray-100 rounded-lg px-4 py-2 text-center">
                      <p className="text-sm font-medium text-gray-500">$0</p>
                    </div>
                    <div className="bg-gray-100 rounded-lg px-4 py-2 text-center">
                      <p className="text-sm font-medium text-gray-500">$0</p>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-center space-x-4">
                    <button className="text-sm text-gray-500 hover:text-gray-700 flex items-center">
                      <span className="w-2 h-2 bg-gray-300 rounded-full mr-2"></span>
                      Details
                    </button>
                    <button className="text-sm text-gray-500 hover:text-gray-700 flex items-center">
                      <span className="w-2 h-2 bg-gray-300 rounded-full mr-2"></span>
                      Export
                    </button>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <ChartBarIcon className="w-5 h-5 text-orange-500 mr-2" />
                    Performance Metrics
                  </h3>
                  <button className="text-orange-500 hover:text-orange-600">
                    <ArrowRightIcon className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500 mb-4">Click to expand - performance metrics details</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
                  <button className="text-orange-500 hover:text-orange-600">
                    <ArrowRightIcon className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={action.action}
                      className="w-full flex items-center justify-between p-4 rounded-lg border border-orange-200 hover:bg-orange-50 transition-colors"
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                          <action.icon className="w-5 h-5 text-orange-600" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-gray-900">{action.title}</p>
                          <p className="text-sm text-gray-500">{action.subtitle}</p>
                        </div>
                      </div>
                      <ArrowRightIcon className="w-4 h-4 text-gray-400" />
                    </button>
                  ))}
                </div>

                {/* Additional Actions */}
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                      <span className="text-sm font-medium text-gray-900">Messages</span>
                    </div>
                    <div className="flex items-center">
                      <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center mr-2">3</span>
                      <ArrowRightIcon className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                      <span className="text-sm font-medium text-gray-900">Notifications</span>
                    </div>
                    <div className="flex items-center">
                      <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center mr-2">2</span>
                      <ArrowRightIcon className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                    <span className="text-sm font-medium text-gray-900">Edit Profile</span>
                    <ArrowRightIcon className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'jobs' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Assignments</h2>
            <div className="text-center py-12">
              <ClipboardDocumentListIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No job assignments at the moment</p>
              <p className="text-sm text-gray-400 mt-2">New assignments will appear here</p>
            </div>
          </div>
        )}

        {activeTab === 'verification' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Document Verification</h2>
            <div className="text-center py-12">
              <DocumentCheckIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Document verification system</p>
              <p className="text-sm text-gray-400 mt-2">Upload and manage your verification documents</p>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Notifications</h2>
            <div className="text-center py-12">
              <BellIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No new notifications</p>
              <p className="text-sm text-gray-400 mt-2">You're all caught up!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CleanContractorDashboard; 