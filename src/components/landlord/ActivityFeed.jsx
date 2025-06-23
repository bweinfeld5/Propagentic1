import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import { useDemoMode } from '../../context/DemoModeContext';
import { generateActivityFeed } from '../../utils/demoData';
import {
  Clock,
  Tool,
  Home,
  User,
  MessageSquare,
  CheckCircle,
  Tag,
  Star,
  AlertTriangle,
  Activity
} from 'lucide-react';

const ActivityFeed = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { isDemoMode } = useDemoMode();

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    if (isDemoMode) {
      // In demo mode, use static demo data
      setActivities(generateActivityFeed());
      setLoading(false);
      return;
    }

    // Otherwise, fetch real data from Firestore
    const landlordId = currentUser.uid;
    
    const activitiesRef = collection(db, 'activities');
    const activitiesQuery = query(
      activitiesRef,
      where('landlordId', '==', landlordId),
      orderBy('timestamp', 'desc'),
      limit(10)
    );
    
    const unsubscribe = onSnapshot(activitiesQuery, (snapshot) => {
      try {
        const activitiesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date()
        }));
        
        setActivities(activitiesData);
        setLoading(false);
      } catch (err) {
        console.error('Error processing activities data:', err);
        setError('Failed to load activity feed');
        setLoading(false);
      }
    }, (err) => {
      console.error('Error fetching activities:', err);
      setError('Failed to load activity feed');
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [isDemoMode]);

  const getActivityIcon = (type) => {
    switch(type) {
      case 'ticket_created':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'ai_classification':
        return <Tag className="h-4 w-4 text-purple-500" />;
      case 'contractor_assigned':
        return <Tool className="h-4 w-4 text-teal-500" />;
      case 'ticket_updated':
        return <Activity className="h-4 w-4 text-blue-500" />;
      case 'ticket_completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'feedback_received':
        return <Star className="h-4 w-4 text-yellow-500" />;
      case 'property_updated':
        return <Home className="h-4 w-4 text-brand-500" />;
      case 'tenant_issue':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (date) => {
    if (!date) return '';
    
    const now = new Date();
    const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    }
    
    return new Date(date).toLocaleDateString();
  };

  const handleActivityClick = (activity) => {
    if (activity.ticketId) {
      navigate(`/tickets/${activity.ticketId}`);
    } else if (activity.propertyId) {
      navigate(`/properties/${activity.propertyId}`);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2.5"></div>
        <div className="h-3 bg-gray-200 rounded mb-2.5"></div>
        <div className="h-3 bg-gray-200 rounded mb-2.5"></div>
        <div className="h-3 bg-gray-200 rounded mb-2.5"></div>
        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center text-red-500 mb-2">
          <AlertTriangle className="h-5 w-5 mr-2" />
          <h3 className="text-lg font-medium">Error</h3>
        </div>
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
          <Activity className="h-5 w-5 text-brand-600 mr-2" />
          Activity Feed
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Recent updates and events
        </p>
      </div>
      
      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-sm text-gray-500">No recent activity</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div 
              key={activity.id} 
              className="p-4 hover:bg-gray-50 cursor-pointer transition duration-150"
              onClick={() => handleActivityClick(activity)}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-3">
                  {activity.user?.photo ? (
                    <img 
                      src={activity.user.photo} 
                      alt={activity.user.name || 'User'} 
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center">
                      {getActivityIcon(activity.type)}
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.title}
                    </p>
                    <p className="text-xs text-gray-500 whitespace-nowrap ml-2">
                      {formatTimeAgo(activity.timestamp)}
                    </p>
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {activity.details}
                  </p>
                  
                  {/* Optional tag for activity type */}
                  <div className="mt-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-brand-100 text-brand-800">
                      {getActivityIcon(activity.type)}
                      <span className="ml-1.5 capitalize">
                        {activity.type?.replace(/_/g, ' ')}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActivityFeed; 