/**
 * PropertyDashboard Component - PropAgentic
 * 
 * Comprehensive property dashboard with overview cards, stats, and activity feed
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  HomeIcon,
  CurrencyDollarIcon,
  UsersIcon,
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  ArrowTopRightOnSquareIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import {
  Container,
  ResponsiveGrid,
  EmptyState
} from '../../design-system';
import Card from '../ui/Card';
import StatusPill from '../ui/StatusPill';
import Button from '../ui/Button';
import { FadeIn, SlideUp, StaggerContainer, StaggerItem } from '../../design-system';
import {
  PropertyStatus,
  formatPropertyAddress,
  formatPropertyRent,
  getPropertyStatusColor,
  getPropertyTypeLabel
} from '../../models/Property';
import propertyService from '../../services/propertyService';
import { useAuth } from '../../context/AuthContext';

const PropertyDashboard = ({
  onViewProperty,
  onAddProperty,
  onViewAllProperties
}) => {
  const { currentUser } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      
      // Load properties and stats in parallel
      const [userProperties, propertyStats] = await Promise.all([
        propertyService.getPropertiesByOwner(currentUser.uid, { limit: 6 }),
        propertyService.getPropertyStats(currentUser.uid)
      ]);
      
      setProperties(userProperties);
      setStats(propertyStats);
      
      // Generate recent activity (in real app, this would come from an activity log)
      const activity = generateRecentActivity(userProperties);
      setRecentActivity(activity);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Generate mock recent activity (replace with real activity service)
  const generateRecentActivity = (properties) => {
    const activities = [];
    const now = new Date();
    
    properties.forEach((property, index) => {
      const date = new Date(now - (index + 1) * 24 * 60 * 60 * 1000); // Days ago
      
      if (property.status === PropertyStatus.OCCUPIED) {
        activities.push({
          id: `rent-${property.id}`,
          type: 'rent_collected',
          property: property,
          amount: property.monthlyRent,
          date: date,
          description: `Rent collected for ${property.name}`
        });
      } else if (property.status === PropertyStatus.VACANT) {
        activities.push({
          id: `vacant-${property.id}`,
          type: 'property_vacant',
          property: property,
          date: date,
          description: `${property.name} became vacant`
        });
      } else if (property.status === PropertyStatus.MAINTENANCE) {
        activities.push({
          id: `maintenance-${property.id}`,
          type: 'maintenance_started',
          property: property,
          date: date,
          description: `Maintenance started for ${property.name}`
        });
      }
    });
    
    return activities.sort((a, b) => b.date - a.date).slice(0, 10);
  };

  // Calculate quick stats
  const quickStats = useMemo(() => {
    if (!stats) return null;
    
    const rentCollected = properties
      .filter(p => p.status === PropertyStatus.OCCUPIED)
      .reduce((sum, p) => sum + (p.monthlyRent || 0), 0);
    
    const potentialRent = properties.reduce((sum, p) => sum + (p.monthlyRent || 0), 0);
    const collectionRate = potentialRent > 0 ? (rentCollected / potentialRent) * 100 : 0;
    
    return {
      totalProperties: stats.total,
      occupancyRate: stats.occupancyRate,
      rentCollected: rentCollected,
      collectionRate: collectionRate,
      maintenanceProperties: stats.maintenance,
      totalValue: stats.totalValue
    };
  }, [stats, properties]);

  if (loading) {
    return (
      <Container maxWidth="full" padding={true}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <FadeIn>
      <Container maxWidth="full" padding={true}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Property Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Overview of your property portfolio
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={onViewAllProperties}
            >
              <EyeIcon className="h-4 w-4 mr-2" />
              View All Properties
            </Button>
            <Button
              variant="primary"
              onClick={onAddProperty}
            >
              <HomeIcon className="h-4 w-4 mr-2" />
              Add Property
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        {quickStats && (
          <SlideUp delay={0.1}>
            <StaggerContainer>
              <ResponsiveGrid cols={{ xs: 1, sm: 2, lg: 4 }} gap={6} className="mb-8">
                <StaggerItem>
                  <StatCard
                    title="Total Properties"
                    value={quickStats.totalProperties}
                    icon={HomeIcon}
                    color="blue"
                    trend={quickStats.totalProperties > 0 ? 'up' : 'neutral'}
                  />
                </StaggerItem>
                
                <StaggerItem>
                  <StatCard
                    title="Occupancy Rate"
                    value={`${quickStats.occupancyRate.toFixed(1)}%`}
                    icon={UsersIcon}
                    color={quickStats.occupancyRate >= 90 ? 'green' : quickStats.occupancyRate >= 70 ? 'yellow' : 'red'}
                    trend={quickStats.occupancyRate >= 90 ? 'up' : quickStats.occupancyRate >= 70 ? 'neutral' : 'down'}
                  />
                </StaggerItem>
                
                <StaggerItem>
                  <StatCard
                    title="Monthly Rent"
                    value={`$${quickStats.rentCollected.toLocaleString()}`}
                    icon={CurrencyDollarIcon}
                    color="green"
                    subtitle={`${quickStats.collectionRate.toFixed(0)}% collected`}
                    trend="up"
                  />
                </StaggerItem>
                
                <StaggerItem>
                  <StatCard
                    title="Maintenance"
                    value={quickStats.maintenanceProperties}
                    icon={ExclamationTriangleIcon}
                    color={quickStats.maintenanceProperties === 0 ? 'green' : 'orange'}
                    subtitle="properties"
                    trend={quickStats.maintenanceProperties === 0 ? 'up' : 'down'}
                  />
                </StaggerItem>
              </ResponsiveGrid>
            </StaggerContainer>
          </SlideUp>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Property Overview Cards */}
          <div className="lg:col-span-2">
            <SlideUp delay={0.2}>
              <Card>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      Recent Properties
                    </h2>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={onViewAllProperties}
                    >
                      View All
                      <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                  
                  {properties.length === 0 ? (
                    <EmptyState
                      type="properties"
                      title="No properties yet"
                      description="Add your first property to get started"
                      primaryAction={{
                        label: "Add Property",
                        onClick: onAddProperty
                      }}
                    />
                  ) : (
                    <StaggerContainer>
                      <div className="space-y-4">
                        {properties.map((property) => (
                          <StaggerItem key={property.id}>
                            <PropertyOverviewCard 
                              property={property} 
                              onView={() => onViewProperty(property.id)}
                            />
                          </StaggerItem>
                        ))}
                      </div>
                    </StaggerContainer>
                  )}
                </div>
              </Card>
            </SlideUp>
          </div>

          {/* Recent Activity Feed */}
          <div>
            <SlideUp delay={0.3}>
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                    Recent Activity
                  </h2>
                  
                  {recentActivity.length === 0 ? (
                    <div className="text-center py-8">
                      <ClockIcon className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                      <p className="text-gray-500 dark:text-gray-400">
                        No recent activity
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentActivity.map((activity) => (
                        <ActivityItem
                          key={activity.id}
                          activity={activity}
                          onViewProperty={() => onViewProperty(activity.property.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </SlideUp>
          </div>
        </div>
      </Container>
    </FadeIn>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, color, subtitle, trend }) => {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
  };

  const TrendIcon = trend === 'up' ? ArrowUpIcon : trend === 'down' ? ArrowDownIcon : null;

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
          {TrendIcon && (
            <TrendIcon className={`h-5 w-5 ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`} />
          )}
        </div>
        
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};

// Property Overview Card Component
const PropertyOverviewCard = ({ property, onView }) => {
  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
      {/* Property Image */}
      <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-lg overflow-hidden flex-shrink-0">
        {property.photos && property.photos.length > 0 ? (
          <img
            src={property.photos[0]}
            alt={property.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <PhotoIcon className="h-6 w-6 text-gray-400" />
          </div>
        )}
      </div>

      {/* Property Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between mb-1">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
            {property.name}
          </h3>
          <StatusPill 
            color={getPropertyStatusColor(property.status)}
            size="xs"
          >
            {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
          </StatusPill>
        </div>
        
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-1">
          <MapPinIcon className="h-3 w-3 mr-1 flex-shrink-0" />
          <span className="truncate">{formatPropertyAddress(property)}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {getPropertyTypeLabel(property.type)} • {property.bedrooms}bed/{property.bathrooms}bath
          </span>
          <span className="font-medium text-green-600 dark:text-green-400">
            {formatPropertyRent(property)}
          </span>
        </div>
      </div>

      {/* View Button */}
      <Button
        variant="secondary"
        size="sm"
        onClick={onView}
      >
        <EyeIcon className="h-4 w-4" />
      </Button>
    </div>
  );
};

// Activity Item Component
const ActivityItem = ({ activity, onViewProperty }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'rent_collected':
        return { icon: CurrencyDollarIcon, color: 'text-green-500' };
      case 'property_vacant':
        return { icon: HomeIcon, color: 'text-yellow-500' };
      case 'maintenance_started':
        return { icon: ExclamationTriangleIcon, color: 'text-orange-500' };
      case 'lease_signed':
        return { icon: CheckCircleIcon, color: 'text-blue-500' };
      default:
        return { icon: ClockIcon, color: 'text-gray-500' };
    }
  };

  const { icon: Icon, color } = getActivityIcon(activity.type);

  return (
    <div className="flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
      <div className={`p-2 rounded-full bg-gray-100 dark:bg-gray-700 ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 dark:text-gray-100 mb-1">
          {activity.description}
        </p>
        {activity.amount && (
          <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">
            ${activity.amount.toLocaleString()}
          </p>
        )}
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {activity.date.toLocaleDateString()}
          </p>
          <button
            onClick={onViewProperty}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            View Property
          </button>
        </div>
      </div>
    </div>
  );
};

PropertyDashboard.propTypes = {
  onViewProperty: PropTypes.func.isRequired,
  onAddProperty: PropTypes.func.isRequired,
  onViewAllProperties: PropTypes.func.isRequired
};

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.elementType.isRequired,
  color: PropTypes.oneOf(['blue', 'green', 'yellow', 'orange', 'red']).isRequired,
  subtitle: PropTypes.string,
  trend: PropTypes.oneOf(['up', 'down', 'neutral'])
};

PropertyOverviewCard.propTypes = {
  property: PropTypes.object.isRequired,
  onView: PropTypes.func.isRequired
};

ActivityItem.propTypes = {
  activity: PropTypes.object.isRequired,
  onViewProperty: PropTypes.func.isRequired
};

export default PropertyDashboard; 