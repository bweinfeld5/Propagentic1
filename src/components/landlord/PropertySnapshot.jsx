import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import { useDemoMode } from '../../context/DemoModeContext';
import { demoProperties, demoTickets } from '../../utils/demoData';
import { useBreakpoint, darkModeClasses } from '../../design-system';
import { Skeleton } from '../../design-system/loading-states';
import {
  Home,
  Users,
  Clock,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Calendar
} from 'lucide-react';

const PropertySnapshot = ({ onViewAllProperties }) => {
  const [metrics, setMetrics] = useState({
    totalProperties: 0,
    totalUnits: 0,
    occupiedUnits: 0,
    occupancyRate: 0,
    activeRequests: 0,
    avgResponseTime: 0,
    upcomingLeaseEnds: 0
  });
  const [loading, setLoading] = useState(true);
  const { isDemoMode } = useDemoMode();

  // Responsive breakpoint
  const { isMobile, isTablet } = useBreakpoint();

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const fetchPropertyMetrics = async () => {
      try {
        if (isDemoMode) {
          // Use demo data
          const properties = demoProperties;
          const tickets = demoTickets;
          
          // Calculate metrics from demo data
          const totalProperties = properties.length;
          const totalUnits = properties.reduce((sum, prop) => sum + (prop.units || 0), 0);
          const occupiedUnits = properties.reduce((sum, prop) => sum + (prop.occupiedUnits || 0), 0);
          const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;
          
          // Count active requests (anything not completed or rejected)
          const activeRequests = tickets.filter(ticket => 
            !['completed', 'rejected'].includes(ticket.status)
          ).length;
          
          // Mock average response time (hours)
          const avgResponseTime = 8;
          
          // Mock upcoming lease ends in the next 30 days
          const upcomingLeaseEnds = 2;
          
          setMetrics({
            totalProperties,
            totalUnits,
            occupiedUnits,
            occupancyRate,
            activeRequests,
            avgResponseTime,
            upcomingLeaseEnds
          });
          
          setLoading(false);
          return;
        }
        
        // Real data fetch for production mode
        const landlordId = currentUser.uid;
        
        // Fetch properties
        const propertiesRef = collection(db, 'properties');
        const propertiesQuery = query(
          propertiesRef, 
          where('landlordId', '==', landlordId)
        );
        const propertiesSnapshot = await getDocs(propertiesQuery);
        const properties = propertiesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Calculate property metrics
        const totalProperties = properties.length;
        const totalUnits = properties.reduce((sum, prop) => sum + (prop.units || 0), 0);
        const occupiedUnits = properties.reduce((sum, prop) => sum + (prop.occupiedUnits || 0), 0);
        const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;
        
        // Fetch active maintenance requests
        const ticketsRef = collection(db, 'tickets');
        const activeTicketsQuery = query(
          ticketsRef,
          where('landlordId', '==', landlordId),
          where('status', 'not-in', ['completed', 'rejected'])
        );
        const activeTicketsSnapshot = await getDocs(activeTicketsQuery);
        const activeRequests = activeTicketsSnapshot.size;
        
        // Calculate average response time from completed tickets
        const responseTimesQuery = query(
          ticketsRef,
          where('landlordId', '==', landlordId),
          where('status', '==', 'completed'),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
        const responseTimesSnapshot = await getDocs(responseTimesQuery);
        const completedTickets = responseTimesSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            createdAt: data.createdAt?.toDate(),
            firstResponseAt: data.firstResponseAt?.toDate()
          };
        });
        
        // Calculate average response time in hours
        let totalResponseTime = 0;
        let countWithResponse = 0;
        
        completedTickets.forEach(ticket => {
          if (ticket.createdAt && ticket.firstResponseAt) {
            const responseTime = (ticket.firstResponseAt - ticket.createdAt) / (1000 * 60 * 60); // hours
            totalResponseTime += responseTime;
            countWithResponse++;
          }
        });
        
        const avgResponseTime = countWithResponse > 0 ? totalResponseTime / countWithResponse : 0;
        
        // Fetch upcoming lease ends in next 30 days
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        
        const today = new Date();
        const tenantsRef = collection(db, 'tenants');
        const leaseEndsQuery = query(
          tenantsRef,
          where('landlordId', '==', landlordId),
          where('leaseEndDate', '>=', today),
          where('leaseEndDate', '<=', thirtyDaysFromNow)
        );
        
        const leaseEndsSnapshot = await getDocs(leaseEndsQuery);
        const upcomingLeaseEnds = leaseEndsSnapshot.size;
        
        setMetrics({
          totalProperties,
          totalUnits,
          occupiedUnits,
          occupancyRate,
          activeRequests,
          avgResponseTime,
          upcomingLeaseEnds
        });
        
      } catch (error) {
        console.error('Error fetching property metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPropertyMetrics();
  }, [isDemoMode]);

  // Responsive grid columns
  const getMainGridCols = () => {
    if (isMobile) return 'grid-cols-1';
    return 'grid-cols-3';
  };

  const getBottomGridCols = () => {
    if (isMobile) return 'grid-cols-1';
    return 'grid-cols-2';
  };

  if (loading) {
    return (
      <div className={`${darkModeClasses.card.base} rounded-lg shadow p-4`}>
        <Skeleton height="1rem" width="33%" className="mb-4" />
        <div className={`grid ${getMainGridCols()} gap-4`}>
          <Skeleton height="5rem" />
          <Skeleton height="5rem" />
          <Skeleton height="5rem" />
        </div>
      </div>
    );
  }

  return (
    <div className={`${darkModeClasses.card.base} rounded-lg shadow overflow-hidden`}>
      <div className={`px-4 py-5 sm:px-6 flex ${isMobile ? 'flex-col space-y-2' : 'flex-row justify-between items-center'} ${darkModeClasses.border.default} border-b`}>
        <div>
          <h3 className={`text-lg font-medium leading-6 flex items-center ${darkModeClasses.text.primary}`}>
            <Home className="h-5 w-5 text-brand-600 dark:text-brand-400 mr-2" />
            Property Snapshot
          </h3>
          <p className={`mt-1 text-sm ${darkModeClasses.text.secondary}`}>
            Current portfolio overview
          </p>
        </div>
        
        <button
          onClick={onViewAllProperties}
          className={`inline-flex items-center text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300`}
        >
          View all
          <ArrowRight className="ml-1 h-4 w-4" />
        </button>
      </div>
      
      <div className="p-4 sm:p-6">
        <div className={`grid ${getMainGridCols()} gap-4`}>
          {/* Occupancy Rate Card */}
          <div className={`rounded-lg p-4 border ${darkModeClasses.badge.primary}`}>
            <div className="flex justify-between items-start">
              <div>
                <p className={`text-sm font-medium ${darkModeClasses.text.secondary}`}>Occupancy Rate</p>
                <p className={`text-2xl font-bold text-brand-700 dark:text-brand-300`}>{metrics.occupancyRate.toFixed(0)}%</p>
              </div>
              <div className={`p-2 rounded-md ${darkModeClasses.badge.primary}`}>
                <Users className="h-5 w-5 text-brand-700 dark:text-brand-300" />
              </div>
            </div>
            <div className="mt-1">
              <p className={`text-xs ${darkModeClasses.text.tertiary}`}>
                {metrics.occupiedUnits} of {metrics.totalUnits} units occupied
              </p>
              <div className={`w-full rounded-full h-1.5 mt-1.5 ${darkModeClasses.bg.secondary}`}>
                <div
                  className="bg-brand-600 dark:bg-brand-400 h-1.5 rounded-full"
                  style={{ width: `${metrics.occupancyRate}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          {/* Active Requests Card */}
          <div className={`rounded-lg p-4 border ${darkModeClasses.badge.primary}`}>
            <div className="flex justify-between items-start">
              <div>
                <p className={`text-sm font-medium ${darkModeClasses.text.secondary}`}>Active Requests</p>
                <p className={`text-2xl font-bold text-blue-700 dark:text-blue-300`}>{metrics.activeRequests}</p>
              </div>
              <div className={`p-2 rounded-md ${darkModeClasses.badge.primary}`}>
                <AlertCircle className="h-5 w-5 text-blue-700 dark:text-blue-300" />
              </div>
            </div>
            <div className="mt-1">
              <p className={`text-xs ${darkModeClasses.text.tertiary}`}>
                {metrics.activeRequests === 0 ? 
                  'No maintenance issues' :
                  metrics.activeRequests === 1 ?
                  '1 issue needs attention' :
                  `${metrics.activeRequests} issues need attention`
                }
              </p>
              
              <div className={`w-full rounded-full h-1.5 mt-1.5 ${darkModeClasses.bg.secondary}`}>
                <div
                  className="bg-blue-600 dark:bg-blue-400 h-1.5 rounded-full"
                  style={{ 
                    width: metrics.activeRequests === 0 ? '0%' : 
                          metrics.activeRequests <= 3 ? '33%' :
                          metrics.activeRequests <= 6 ? '66%' : '100%' 
                  }}
                ></div>
              </div>
            </div>
          </div>
          
          {/* Response Time Card */}
          <div className={`rounded-lg p-4 border ${darkModeClasses.badge.success}`}>
            <div className="flex justify-between items-start">
              <div>
                <p className={`text-sm font-medium ${darkModeClasses.text.secondary}`}>Avg Response Time</p>
                <p className={`text-2xl font-bold ${darkModeClasses.text.success}`}>{metrics.avgResponseTime.toFixed(1)}h</p>
              </div>
              <div className={`p-2 rounded-md ${darkModeClasses.badge.success}`}>
                <Clock className={`h-5 w-5 ${darkModeClasses.text.success}`} />
              </div>
            </div>
            <div className="mt-1">
              <p className={`text-xs ${darkModeClasses.text.tertiary}`}>
                {metrics.avgResponseTime < 12 ? 
                  'Excellent response time' :
                  metrics.avgResponseTime < 24 ?
                  'Good response time' :
                  'Consider improving response time'}
              </p>
              
              <div className={`w-full rounded-full h-1.5 mt-1.5 ${darkModeClasses.bg.secondary}`}>
                <div
                  className="bg-green-600 dark:bg-green-400 h-1.5 rounded-full"
                  style={{ 
                    width: metrics.avgResponseTime <= 8 ? '100%' : 
                           metrics.avgResponseTime <= 16 ? '75%' :
                           metrics.avgResponseTime <= 24 ? '50%' : '25%'
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Additional Property Overview - Responsive Grid */}
        <div className={`mt-4 grid ${getBottomGridCols()} gap-4`}>
          <div className={`rounded-lg p-4 border ${darkModeClasses.bg.secondary} ${darkModeClasses.border.default}`}>
            <div className="flex items-center">
              <TrendingUp className={`h-5 w-5 mr-2 ${darkModeClasses.text.secondary}`} />
              <span className={`text-sm font-medium ${darkModeClasses.text.secondary}`}>
                {metrics.totalProperties} {metrics.totalProperties === 1 ? 'Property' : 'Properties'}
              </span>
            </div>
            <p className={`mt-1 text-xs ${darkModeClasses.text.tertiary}`}>
              {metrics.totalUnits} total units managed
            </p>
          </div>
          
          <div className={`rounded-lg p-4 border ${darkModeClasses.badge.warning}`}>
            <div className="flex items-center">
              <Calendar className={`h-5 w-5 mr-2 ${darkModeClasses.text.warning}`} />
              <span className={`text-sm font-medium ${darkModeClasses.text.warning}`}>
                {metrics.upcomingLeaseEnds} Leases Ending Soon
              </span>
            </div>
            <p className={`mt-1 text-xs ${darkModeClasses.text.tertiary}`}>
              Next 30 days
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertySnapshot; 