import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';

const UpcomingSchedule = () => {
  const { currentUser } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('week'); // 'week' or 'day'

  useEffect(() => {
    if (currentUser) {
      fetchUpcomingAppointments();
    }
  }, [currentUser]);

  const fetchUpcomingAppointments = async () => {
    try {
      setLoading(true);
      
      // Get date range for the next 7 days
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);

      // Query scheduled jobs
      const jobsRef = collection(db, 'tickets');
      const scheduledJobsQuery = query(
        jobsRef,
        where('contractorId', '==', currentUser.uid),
        where('status', 'in', ['scheduled', 'assigned', 'accepted']),
        orderBy('scheduledDate', 'asc'),
        limit(50)
      );

      const snapshot = await getDocs(scheduledJobsQuery);
      const jobs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        scheduledDate: doc.data().scheduledDate?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));

      // Mock data for demonstration (in real app, this would come from Firebase)
      const mockAppointments = [
        {
          id: '1',
          title: 'Plumbing Repair',
          property: '123 Main St, Apt 4B',
          landlord: 'John Smith',
          phone: '(555) 123-4567',
          scheduledDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
          duration: 120, // minutes
          status: 'confirmed',
          priority: 'high',
          description: 'Kitchen sink leak repair'
        },
        {
          id: '2',
          title: 'HVAC Maintenance',
          property: '456 Oak Ave',
          landlord: 'Sarah Johnson',
          phone: '(555) 987-6543',
          scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          duration: 180,
          status: 'pending',
          priority: 'medium',
          description: 'Annual HVAC system inspection'
        }
      ];

      setAppointments([...jobs, ...mockAppointments].sort((a, b) => a.scheduledDate - b.scheduledDate));
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-emerald-500';
      default: return 'border-l-gray-300';
    }
  };

  const getUpcomingToday = () => {
    const today = new Date();
    return appointments.filter(apt => 
      apt.scheduledDate.toDateString() === today.toDateString()
    );
  };

  const getUpcomingWeek = () => {
    const today = new Date();
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    
    return appointments.filter(apt => 
      apt.scheduledDate >= today && apt.scheduledDate <= weekFromNow
    );
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-6"></div>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const displayAppointments = viewMode === 'day' ? getUpcomingToday() : getUpcomingWeek();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
            <CalendarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Schedule
          </h3>
        </div>

        {/* View Toggle */}
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setViewMode('day')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
              viewMode === 'day'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
              viewMode === 'week'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Week
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {getUpcomingToday().length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Today
          </div>
        </div>
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {getUpcomingWeek().length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            This Week
          </div>
        </div>
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {appointments.filter(apt => apt.status === 'confirmed').length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Confirmed
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="space-y-3">
        {displayAppointments.length === 0 ? (
          <div className="text-center py-8">
            <CalendarIcon className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              No appointments {viewMode === 'day' ? 'today' : 'this week'}
            </p>
          </div>
        ) : (
          displayAppointments.slice(0, 3).map((appointment) => (
            <div
              key={appointment.id}
              className={`bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border-l-4 ${getPriorityColor(appointment.priority)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {appointment.title}
                    </h4>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                      {appointment.status}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex items-center space-x-1">
                      <ClockIcon className="w-3 h-3" />
                      <span>{formatDate(appointment.scheduledDate)} at {formatTime(appointment.scheduledDate)}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400 mt-1">
                    <MapPinIcon className="w-3 h-3" />
                    <span>{appointment.property}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                  <UserIcon className="w-3 h-3" />
                  <span>{appointment.landlord}</span>
                </div>
                <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium">
                  View Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Show More */}
      {displayAppointments.length > 3 && (
        <div className="mt-4 text-center">
          <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium">
            View All ({displayAppointments.length})
          </button>
        </div>
      )}
    </div>
  );
};

export default UpcomingSchedule; 