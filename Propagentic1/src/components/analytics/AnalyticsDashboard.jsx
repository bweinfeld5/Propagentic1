/**
 * Analytics Dashboard Component
 * React component for displaying analytics data visualization
 */

import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  FunnelIcon,
  BeakerIcon,
  UsersIcon,
  CurrencyDollarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  EyeIcon,
  CalendarIcon,
  AdjustmentsHorizontalIcon,
  DocumentChartBarIcon
} from '@heroicons/react/24/outline';
import { conversionTracking } from '../../services/analytics/conversionTracking';
import { abTesting } from '../../services/analytics/abTesting';
import Button from '../ui/Button';

const AnalyticsDashboard = ({ userRole = 'admin' }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState(30);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [funnelData, conversionRates, arpu] = await Promise.all([
        conversionTracking.getFunnelAnalytics({ dateRange }),
        conversionTracking.getConversionRates(null, dateRange),
        conversionTracking.calculateARPU(null, dateRange)
      ]);

      setAnalyticsData({
        funnel: funnelData,
        conversions: conversionRates,
        arpu,
        lastUpdated: new Date()
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'funnel', name: 'Conversion Funnel', icon: FunnelIcon },
    { id: 'experiments', name: 'A/B Tests', icon: BeakerIcon },
    { id: 'users', name: 'User Behavior', icon: UsersIcon },
    { id: 'revenue', name: 'Revenue Analytics', icon: CurrencyDollarIcon }
  ];

  const renderLoadingSkeleton = () => (
    <div className="space-y-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
          <div className="h-32 bg-gray-300 rounded"></div>
        </div>
      ))}
    </div>
  );

  const renderError = () => (
    <div className="text-center py-12">
      <div className="text-red-500 mb-4">
        <DocumentChartBarIcon className="w-12 h-12 mx-auto" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics Error</h3>
      <p className="text-gray-600 mb-4">Failed to load analytics data. Please try again.</p>
      <Button onClick={loadAnalyticsData} variant="primary">Try Again</Button>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Funnel Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {analyticsData?.funnel?.totalUsers || 0}
              </p>
            </div>
            <UsersIcon className="w-8 h-8 text-blue-500" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <TrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600">+12% vs last period</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overall Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {analyticsData?.conversions?.overall_conversion || 0}%
              </p>
            </div>
            <TrendingUpIcon className="w-8 h-8 text-green-500" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <TrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600">+12% vs last period</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Revenue Per User</p>
              <p className="text-2xl font-bold text-gray-900">
                ${analyticsData?.arpu?.toFixed(1) || 0}
              </p>
            </div>
            <CurrencyDollarIcon className="w-8 h-8 text-purple-500" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <TrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600">+12% vs last period</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Steps Per User</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(analyticsData?.funnel?.averageStepsPerUser || 0)}
              </p>
            </div>
            <FunnelIcon className="w-8 h-8 text-orange-500" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <TrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600">+12% vs last period</span>
          </div>
        </div>
      </div>

      {/* Conversion Rates by Stage */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Conversion Rates by Stage</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Signup → Onboarding</p>
            <p className="text-xl font-bold text-blue-600">
              {analyticsData?.conversions?.signup_to_onboarding || 0}%
            </p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600">Onboarding → Activation</p>
            <p className="text-xl font-bold text-green-600">
              {analyticsData?.conversions?.onboarding_to_activation || 0}%
            </p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-gray-600">Activation → Subscription</p>
            <p className="text-xl font-bold text-purple-600">
              {analyticsData?.conversions?.activation_to_subscription || 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Recent Analytics Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center text-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
            <span className="text-gray-600">New user signed up (Landlord)</span>
            <span className="ml-auto text-gray-400">2 min ago</span>
          </div>
          <div className="flex items-center text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
            <span className="text-gray-600">Subscription conversion completed</span>
            <span className="ml-auto text-gray-400">15 min ago</span>
          </div>
          <div className="flex items-center text-sm">
            <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
            <span className="text-gray-600">A/B test reached significance</span>
            <span className="ml-auto text-gray-400">1 hour ago</span>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">User behavior insights and conversion analytics for product decisions</p>
        </div>
        {renderLoadingSkeleton()}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">User behavior insights and conversion analytics for product decisions</p>
        </div>
        {renderError()}
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">User behavior insights and conversion analytics for product decisions</p>
        </div>

        <div className="mt-4 md:mt-0 flex items-center space-x-4">
          {/* Date Range Selector */}
          <div className="flex items-center">
            <CalendarIcon className="w-5 h-5 text-gray-400 mr-2" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(Number(e.target.value))}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 3 months</option>
              <option value={365}>Last year</option>
            </select>
          </div>

          <Button onClick={loadAnalyticsData} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8" role="navigation">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-5 h-5 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverview()}
      
      {activeTab === 'funnel' && (
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Conversion Funnel Visualization</h3>
          {analyticsData?.funnel?.stageCounts ? (
            <div className="space-y-4">
              {Object.entries(analyticsData.funnel.stageCounts).map(([stage, count]) => (
                <div key={stage} className="flex items-center">
                  <div className="w-32 text-sm font-medium">{stage.replace('_', ' ')}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-4 mx-4">
                    <div 
                      className="bg-blue-500 h-4 rounded-full"
                      style={{ width: `${(count / Math.max(...Object.values(analyticsData.funnel.stageCounts))) * 100}%` }}
                    ></div>
                  </div>
                  <div className="w-20 text-sm text-gray-600">{count} users</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FunnelIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Funnel Data</h3>
              <p className="text-gray-600">Funnel data will appear here as users progress through the system.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'experiments' && (
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Active A/B Tests</h3>
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Pricing Strategy Test</h4>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">active</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">Testing different pricing tiers for conversion optimization</p>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Control:</span>
                  <div className="font-medium">Current Pricing</div>
                  <div className="text-green-600">8.2% conversion</div>
                </div>
                <div>
                  <span className="text-gray-500">Variant A:</span>
                  <div className="font-medium">Lower Price</div>
                  <div className="text-green-600">12.1% conversion</div>
                </div>
                <div>
                  <span className="text-gray-500">Statistical Significance:</span>
                  <div className="font-medium text-green-600">Significant</div>
                  <div className="text-gray-500">96.2% confidence</div>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Onboarding Flow Optimization</h4>
                <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">completed</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">Testing simplified vs. detailed onboarding flow</p>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Control:</span>
                  <div className="font-medium">Current Flow</div>
                  <div className="text-blue-600">65% completion</div>
                </div>
                <div>
                  <span className="text-gray-500">Variant A:</span>
                  <div className="font-medium">3-Step Flow</div>
                  <div className="text-blue-600">68% completion</div>
                </div>
                <div>
                  <span className="text-gray-500">Statistical Significance:</span>
                  <div className="font-medium text-gray-600">Not Significant</div>
                  <div className="text-gray-500">82.1% confidence</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white p-6 rounded-lg border text-center py-12">
          <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">User Behavior Analytics</h3>
          <p className="text-gray-600">Detailed user behavior analytics and engagement metrics will be available here.</p>
        </div>
      )}

      {activeTab === 'revenue' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-lg border text-center">
              <CurrencyDollarIcon className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">ARPU</p>
              <p className="text-2xl font-bold text-gray-900">${analyticsData?.arpu?.toFixed(1) || 0}</p>
            </div>
            <div className="bg-white p-6 rounded-lg border text-center">
              <TrendingUpIcon className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">MRR</p>
              <p className="text-2xl font-bold text-gray-900">$12,450</p>
            </div>
            <div className="bg-white p-6 rounded-lg border text-center">
              <ChartBarIcon className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">LTV</p>
              <p className="text-2xl font-bold text-gray-900">$1,240</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">Revenue Trends</h3>
            <div className="h-64 flex items-center justify-center text-gray-500">
              Revenue chart visualization would go here
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard; 