import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import { useDemoMode } from '../../context/DemoModeContext';
import { demoProperties, demoTickets } from '../../utils/demoData';
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

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
            <Home className="h-5 w-5 text-brand-600 mr-2" />
            Property Snapshot
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Current portfolio overview
          </p>
        </div>
        
        <button
          onClick={onViewAllProperties}
          className="inline-flex items-center text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          View all
          <ArrowRight className="ml-1 h-4 w-4" />
        </button>
      </div>
      
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-brand-50 rounded-lg p-4 border border-brand-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Occupancy Rate</p>
                <p className="text-2xl font-bold text-brand-700">{metrics.occupancyRate.toFixed(0)}%</p>
              </div>
              <div className="p-2 bg-brand-100 rounded-md">
                <Users className="h-5 w-5 text-brand-700" />
              </div>
            </div>
            <div className="mt-1">
              <p className="text-xs text-gray-500">
                {metrics.occupiedUnits} of {metrics.totalUnits} units occupied
              </p>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1.5">
                <div
                  className="bg-brand-600 h-1.5 rounded-full"
                  style={{ width: `${metrics.occupancyRate}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Requests</p>
                <p className="text-2xl font-bold text-blue-700">{metrics.activeRequests}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-md">
                <AlertCircle className="h-5 w-5 text-blue-700" />
              </div>
            </div>
            <div className="mt-1">
              <p className="text-xs text-gray-500">
                {metrics.activeRequests === 0 ? 
                  'No maintenance issues' :
                  metrics.activeRequests === 1 ?
                  '1 issue needs attention' :
                  `${metrics.activeRequests} issues need attention`
                }
              </p>
              
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1.5">
                <div
                  className="bg-blue-600 h-1.5 rounded-full"
                  style={{ 
                    width: metrics.activeRequests === 0 ? '0%' : 
                          metrics.activeRequests <= 3 ? '33%' :
                          metrics.activeRequests <= 6 ? '66%' : '100%' 
                  }}
                ></div>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4 border border-green-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Avg Response Time</p>
                <p className="text-2xl font-bold text-green-700">{metrics.avgResponseTime.toFixed(1)}h</p>
              </div>
              <div className="p-2 bg-green-100 rounded-md">
                <Clock className="h-5 w-5 text-green-700" />
              </div>
            </div>
            <div className="mt-1">
              <p className="text-xs text-gray-500">
                {metrics.avgResponseTime < 12 ? 
                  'Excellent response time' :
                  metrics.avgResponseTime < 24 ?
                  'Good response time' :
                  'Consider improving response time'}
              </p>
              
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1.5">
                <div
                  className="bg-green-600 h-1.5 rounded-full"
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
        
        {/* Additional Property Overview */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 text-gray-700 mr-2" />
              <span className="text-sm font-medium text-gray-700">
                {metrics.totalProperties} {metrics.totalProperties === 1 ? 'Property' : 'Properties'}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {metrics.totalUnits} total units managed
            </p>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-yellow-700 mr-2" />
              <span className="text-sm font-medium text-yellow-700">
                {metrics.upcomingLeaseEnds} Leases Ending Soon
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Next 30 days
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertySnapshot; 