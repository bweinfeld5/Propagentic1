import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  UsersIcon,
  ClockIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  EyeIcon,
  CursorArrowRaysIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  GlobeAltIcon,
  CalendarIcon,
  FunnelIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { analyticsService } from '../../services/analytics/analyticsService';
import Button from '../ui/Button';
import StatusPill from '../ui/StatusPill';
import LoadingSpinner from '../ui/LoadingSpinner';

const AdvancedAnalyticsDashboard = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('7d'); // 24h, 7d, 30d, 90d
  const [refreshing, setRefreshing] = useState(false);
  
  // Analytics data state
  const [analytics, setAnalytics] = useState({
    overview: {
      totalUsers: 0,
      activeUsers: 0,
      newSignups: 0,
      retentionRate: 0
    },
    performance: {
      avgPageLoadTime: 0,
      bounceRate: 0,
      sessionsPerUser: 0,
      avgSessionDuration: 0
    },
    userBehavior: {
      topPages: [],
      userJourney: [],
      deviceTypes: [],
      conversionFunnel: []
    },
    businessMetrics: {
      totalProperties: 0,
      activeListings: 0,
      maintenanceRequests: 0,
      contractorJobs: 0
    }
  });

  // Load analytics data
  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      
      const data = await analyticsService.getAdvancedAnalytics(timeRange);
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  // Overview metrics cards
  const OverviewCard = ({ title, value, change, changeType, icon: Icon, color }) => (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change !== undefined && (
            <div className={`flex items-center mt-2 text-sm ${
              changeType === 'positive' ? 'text-green-600' : 'text-red-600'
            }`}>
              {changeType === 'positive' ? (
                <TrendingUpIcon className="h-4 w-4 mr-1" />
              ) : (
                <TrendingDownIcon className="h-4 w-4 mr-1" />
              )}
              {Math.abs(change)}% from last period
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  // Performance metrics chart
  const PerformanceChart = () => (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
        <StatusPill status="monitoring" />
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {analytics.performance.avgPageLoadTime}ms
          </div>
          <div className="text-sm text-gray-600">Avg Load Time</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {analytics.performance.bounceRate}%
          </div>
          <div className="text-sm text-gray-600">Bounce Rate</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {analytics.performance.sessionsPerUser}
          </div>
          <div className="text-sm text-gray-600">Sessions/User</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">
            {Math.round(analytics.performance.avgSessionDuration / 60)}m
          </div>
          <div className="text-sm text-gray-600">Avg Session</div>
        </div>
      </div>
    </div>
  );

  // User behavior insights
  const UserBehaviorInsights = () => (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">User Behavior Insights</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages */}
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-3">Most Visited Pages</h4>
          <div className="space-y-3">
            {analytics.userBehavior.topPages.map((page, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                    {index + 1}
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">{page.path}</div>
                    <div className="text-xs text-gray-500">{page.title}</div>
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-600">
                  {page.views} views
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Device Types */}
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-3">Device Usage</h4>
          <div className="space-y-3">
            {analytics.userBehavior.deviceTypes.map((device, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  {device.type === 'mobile' ? (
                    <DevicePhoneMobileIcon className="h-5 w-5 text-blue-500 mr-3" />
                  ) : device.type === 'desktop' ? (
                    <ComputerDesktopIcon className="h-5 w-5 text-green-500 mr-3" />
                  ) : (
                    <GlobeAltIcon className="h-5 w-5 text-purple-500 mr-3" />
                  )}
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {device.type}
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="text-sm font-medium text-gray-600 mr-2">
                    {device.percentage}%
                  </div>
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${device.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Conversion funnel
  const ConversionFunnel = () => (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Conversion Funnel</h3>
        <FunnelIcon className="h-5 w-5 text-gray-400" />
      </div>
      
      <div className="space-y-4">
        {analytics.userBehavior.conversionFunnel.map((step, index) => (
          <div key={index} className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{step.name}</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">{step.count} users</span>
                <span className="text-xs text-gray-500">({step.percentage}%)</span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full ${
                  step.percentage > 70 ? 'bg-green-500' :
                  step.percentage > 40 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${step.percentage}%` }}
              />
            </div>
            {index < analytics.userBehavior.conversionFunnel.length - 1 && (
              <div className="absolute left-1/2 transform -translate-x-1/2 mt-2">
                <div className="text-xs text-gray-400">
                  ↓ {Math.round(
                    (analytics.userBehavior.conversionFunnel[index + 1].count / step.count) * 100
                  )}% continue
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // Business metrics for landlords/admins
  const BusinessMetrics = () => {
    if (userProfile?.userType !== 'landlord' && userProfile?.userType !== 'admin') {
      return null;
    }

    return (
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Business Metrics</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {analytics.businessMetrics.totalProperties}
            </div>
            <div className="text-sm text-gray-600">Total Properties</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {analytics.businessMetrics.activeListings}
            </div>
            <div className="text-sm text-gray-600">Active Listings</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {analytics.businessMetrics.maintenanceRequests}
            </div>
            <div className="text-sm text-gray-600">Maintenance Requests</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {analytics.businessMetrics.contractorJobs}
            </div>
            <div className="text-sm text-gray-600">Contractor Jobs</div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
        <span className="ml-2 text-gray-600">Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Advanced Analytics</h1>
          <p className="text-gray-600">Comprehensive insights and performance metrics</p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          
          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            icon={<ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <OverviewCard
          title="Total Users"
          value={analytics.overview.totalUsers.toLocaleString()}
          change={12}
          changeType="positive"
          icon={UsersIcon}
          color="bg-blue-500"
        />
        <OverviewCard
          title="Active Users"
          value={analytics.overview.activeUsers.toLocaleString()}
          change={8}
          changeType="positive"
          icon={EyeIcon}
          color="bg-green-500"
        />
        <OverviewCard
          title="New Signups"
          value={analytics.overview.newSignups.toLocaleString()}
          change={-3}
          changeType="negative"
          icon={CursorArrowRaysIcon}
          color="bg-purple-500"
        />
        <OverviewCard
          title="Retention Rate"
          value={`${analytics.overview.retentionRate}%`}
          change={5}
          changeType="positive"
          icon={TrendingUpIcon}
          color="bg-orange-500"
        />
      </div>

      {/* Performance Metrics */}
      <PerformanceChart />

      {/* User Behavior Insights */}
      <UserBehaviorInsights />

      {/* Conversion Funnel */}
      <ConversionFunnel />

      {/* Business Metrics */}
      <BusinessMetrics />
    </div>
  );
};

export default AdvancedAnalyticsDashboard; 