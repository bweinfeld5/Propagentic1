import React from 'react';
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  WrenchScrewdriverIcon,
  HomeIcon,
  CalendarDaysIcon,
  PhoneIcon,
  EnvelopeIcon,
  ArrowTrendingUpIcon,
  SparklesIcon,
  ShieldCheckIcon,
  BoltIcon
} from '@heroicons/react/24/outline';
import { ChartBarIcon, UserGroupIcon } from '@heroicons/react/24/solid';
import Button from '../ui/Button';

interface Property {
  id: string;
  name: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    unit?: string;
  };
  landlordName?: string;
  landlordEmail?: string;
  landlordPhone?: string;
  [key: string]: any;
}

interface Ticket {
  id: string;
  status: string;
  urgency?: string;
  category?: string;
  createdAt?: Date;
  issueTitle: string;
  [key: string]: any;
}

interface DashboardOverviewProps {
  userProfile?: {
    fullName?: string;
    firstName?: string;
    lastName?: string;
    propertyName?: string;
    unitNumber?: string;
  };
  tenantProperties: Property[];
  tickets: Ticket[];
  onNewRequest: () => void;
  onViewProperty?: (propertyId: string) => void;
  onContactLandlord?: (property: Property) => void;
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  userProfile,
  tenantProperties,
  tickets,
  onNewRequest,
  onViewProperty,
  onContactLandlord
}) => {
  // Calculate stats
  const stats = {
    total: tickets.length,
    open: tickets.filter(t => ['pending_classification', 'open', 'in_progress'].includes(t.status)).length,
    resolved: tickets.filter(t => ['resolved', 'closed'].includes(t.status)).length,
    high_priority: tickets.filter(t => t.urgency === 'high' && !['resolved', 'closed'].includes(t.status)).length
  };

  // Calculate response rate
  const responseRate = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0;

  // Get user display name
  const userName = userProfile?.fullName || 
                  `${userProfile?.firstName || ''} ${userProfile?.lastName || ''}`.trim() ||
                  'Tenant';

  // Get recent activity
  const recentTickets = tickets
    .filter(t => t.createdAt)
    .sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, 3);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
      case 'closed':
        return <CheckCircleIcon className="w-4 h-4 text-green-600" />;
      case 'in_progress':
        return <WrenchScrewdriverIcon className="w-4 h-4 text-purple-600" />;
      case 'open':
        return <ExclamationTriangleIcon className="w-4 h-4 text-yellow-600" />;
      default:
        return <ClockIcon className="w-4 h-4 text-blue-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
      case 'closed':
        return 'text-green-600 bg-green-50';
      case 'in_progress':
        return 'text-purple-600 bg-purple-50';
      case 'open':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-blue-600 bg-blue-50';
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header with Gradient */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl shadow-xl text-white p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              Welcome back, {userName}! 
              <SparklesIcon className="w-8 h-8 text-yellow-300" />
            </h1>
            <p className="text-orange-100 mt-2 text-lg">
              Your property management dashboard is ready
            </p>
          </div>
          <HomeIcon className="w-16 h-16 text-orange-200/50" />
        </div>
      </div>

      {/* Enhanced Stats Cards with Hover Effects */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 group hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Requests</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
              <p className="text-xs text-gray-400 mt-1">All time</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <ClockIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 group hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Open Requests</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.open}</p>
              <p className="text-xs text-gray-400 mt-1">Needs attention</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 group hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Resolved</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.resolved}</p>
              <p className="text-xs text-gray-400 mt-1">Completed</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 group hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Response Rate</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{responseRate}%</p>
              <p className="text-xs text-gray-400 mt-1">Resolution rate</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <ArrowTrendingUpIcon className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions and Property Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions with Enhanced Design */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
            <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <BoltIcon className="w-5 h-5 text-orange-500" />
                Quick Actions
              </h3>
            </div>
            <div className="p-6 space-y-3">
              <Button
                variant="primary"
                onClick={onNewRequest}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                icon={<WrenchScrewdriverIcon className="w-5 h-5" />}
              >
                Submit New Request
              </Button>
              
              {tenantProperties.length > 0 && onViewProperty && (
                <Button
                  variant="secondary"
                  onClick={() => onViewProperty(tenantProperties[0].id)}
                  className="w-full border-2 hover:shadow-lg transition-all duration-200"
                  icon={<HomeIcon className="w-5 h-5" />}
                >
                  View Property Details
                </Button>
              )}

              {tenantProperties.length > 0 && tenantProperties[0].landlordEmail && onContactLandlord && (
                <Button
                  variant="outline"
                  onClick={() => onContactLandlord(tenantProperties[0])}
                  className="w-full hover:shadow-lg transition-all duration-200"
                  icon={<EnvelopeIcon className="w-5 h-5" />}
                >
                  Contact Landlord
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Property Information with Enhanced Card */}
        {tenantProperties.length > 0 && (
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <HomeIcon className="w-5 h-5 text-orange-500" />
                  Your Property
                </h3>
              </div>
              <div className="p-6">
                {tenantProperties.map((property) => (
                  <div key={property.id} className="space-y-4">
                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4 border border-orange-200">
                      <h4 className="text-xl font-bold text-gray-900 mb-2">
                        {property.name || 'Property'}
                      </h4>
                      {property.address && (
                        <div className="text-gray-600">
                          <p className="font-medium">
                            {property.address.street}
                            {property.address.unit && `, Unit ${property.address.unit}`}
                          </p>
                          <p>
                            {property.address.city}, {property.address.state} {property.address.zipCode}
                          </p>
                        </div>
                      )}
                      {userProfile?.unitNumber && (
                        <p className="text-gray-600 mt-2">
                          <span className="font-medium">Unit:</span> {userProfile.unitNumber}
                        </p>
                      )}
                    </div>

                    {/* Landlord Contact with Enhanced Design */}
                    {(property.landlordName || property.landlordEmail || property.landlordPhone) && (
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <h5 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <UserGroupIcon className="w-4 h-4 text-orange-500" />
                          Landlord Contact Information
                        </h5>
                        <div className="space-y-2">
                          {property.landlordName && (
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Name:</span> {property.landlordName}
                            </p>
                          )}
                          {property.landlordEmail && (
                            <div className="flex items-center text-sm text-gray-700">
                              <EnvelopeIcon className="w-4 h-4 mr-2 text-orange-500" />
                              <a 
                                href={`mailto:${property.landlordEmail}`}
                                className="text-orange-600 hover:text-orange-700 font-medium hover:underline"
                              >
                                {property.landlordEmail}
                              </a>
                            </div>
                          )}
                          {property.landlordPhone && (
                            <div className="flex items-center text-sm text-gray-700">
                              <PhoneIcon className="w-4 h-4 mr-2 text-orange-500" />
                              <a 
                                href={`tel:${property.landlordPhone}`}
                                className="text-orange-600 hover:text-orange-700 font-medium hover:underline"
                              >
                                {property.landlordPhone}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity with Enhanced Design */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ChartBarIcon className="w-5 h-5 text-orange-500" />
            Recent Activity
          </h3>
          {tickets.length > 3 && (
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('viewHistory'))}
              className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1 hover:underline"
            >
              View All 
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
        <div className="p-6">
          {recentTickets.length > 0 ? (
            <div className="space-y-4">
              {recentTickets.map((ticket) => (
                <div key={ticket.id} className="flex items-start space-x-3 p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100">
                  <div className="flex-shrink-0 mt-0.5">
                    {getStatusIcon(ticket.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {ticket.issueTitle}
                    </p>
                    <div className="flex items-center mt-2 space-x-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                        {ticket.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center">
                        <CalendarDaysIcon className="w-3 h-3 mr-1" />
                        {ticket.createdAt ? formatDate(ticket.createdAt) : 'Unknown date'}
                      </span>
                      {ticket.urgency === 'high' && (
                        <span className="text-xs text-red-600 font-medium bg-red-50 px-2 py-0.5 rounded-full">
                          HIGH PRIORITY
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <WrenchScrewdriverIcon className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">No maintenance requests yet</p>
              <p className="text-sm text-gray-400 mt-1">Submit your first request to get started</p>
              <Button
                variant="primary"
                onClick={onNewRequest}
                className="mt-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                icon={<WrenchScrewdriverIcon className="w-4 h-4" />}
              >
                Submit Request
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview; 