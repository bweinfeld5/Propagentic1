import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import {
  StarIcon,
  CheckCircleIcon,
  ClockIcon,
  TrophyIcon,
  FireIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

const PerformanceMetrics = () => {
  const { currentUser } = useAuth();
  const [metrics, setMetrics] = useState({
    completionRate: 0,
    averageRating: 0,
    totalReviews: 0,
    onTimeCompletion: 0,
    responseTime: 0,
    totalJobsCompleted: 0,
    streak: 0,
    rank: 'Bronze'
  });
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('month'); // 'week', 'month', 'quarter'

  useEffect(() => {
    if (currentUser) {
      fetchPerformanceData();
    }
  }, [currentUser, timeframe]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      
      // Get date range based on timeframe
      const now = new Date();
      let startDate;
      
      switch (timeframe) {
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'quarter':
          startDate = new Date(now.setMonth(now.getMonth() - 3));
          break;
        default: // month
          startDate = new Date(now.setMonth(now.getMonth() - 1));
      }

      // Query contractor's jobs
      const jobsRef = collection(db, 'tickets');
      const jobsQuery = query(
        jobsRef,
        where('contractorId', '==', currentUser.uid),
        orderBy('createdAt', 'desc'),
        limit(200)
      );

      const snapshot = await getDocs(jobsQuery);
      const jobs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        completedAt: doc.data().completedAt?.toDate(),
        acceptedAt: doc.data().acceptedAt?.toDate(),
        dueDate: doc.data().dueDate?.toDate(),
        rating: doc.data().rating || 0,
        review: doc.data().review || ''
      }));

      // Filter jobs by timeframe
      const filteredJobs = jobs.filter(job => job.createdAt >= startDate);
      
      // Calculate metrics
      const totalJobs = filteredJobs.length;
      const completedJobs = filteredJobs.filter(job => job.status === 'completed');
      const completionRate = totalJobs > 0 ? (completedJobs.length / totalJobs) * 100 : 0;

      // Calculate average rating
      const ratedJobs = completedJobs.filter(job => job.rating > 0);
      const averageRating = ratedJobs.length > 0 
        ? ratedJobs.reduce((sum, job) => sum + job.rating, 0) / ratedJobs.length 
        : 0;

      // Calculate on-time completion
      const onTimeJobs = completedJobs.filter(job => 
        job.dueDate && job.completedAt && job.completedAt <= job.dueDate
      );
      const onTimeCompletion = completedJobs.length > 0 
        ? (onTimeJobs.length / completedJobs.length) * 100 
        : 0;

      // Calculate average response time (hours)
      const respondedJobs = filteredJobs.filter(job => job.acceptedAt);
      const avgResponseTime = respondedJobs.length > 0
        ? respondedJobs.reduce((sum, job) => {
            const responseTime = (job.acceptedAt - job.createdAt) / (1000 * 60 * 60); // hours
            return sum + responseTime;
          }, 0) / respondedJobs.length
        : 0;

      // Calculate current streak (consecutive completed jobs)
      const recentJobs = jobs.slice(0, 20); // Last 20 jobs
      let streak = 0;
      for (const job of recentJobs) {
        if (job.status === 'completed') {
          streak++;
        } else if (job.status === 'cancelled' || job.status === 'failed') {
          break;
        }
      }

      // Determine rank based on performance
      let rank = 'Bronze';
      if (averageRating >= 4.8 && completionRate >= 95 && onTimeCompletion >= 90) {
        rank = 'Platinum';
      } else if (averageRating >= 4.5 && completionRate >= 90 && onTimeCompletion >= 85) {
        rank = 'Gold';
      } else if (averageRating >= 4.0 && completionRate >= 80 && onTimeCompletion >= 75) {
        rank = 'Silver';
      }

      setMetrics({
        completionRate: Math.round(completionRate),
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: ratedJobs.length,
        onTimeCompletion: Math.round(onTimeCompletion),
        responseTime: Math.round(avgResponseTime * 10) / 10,
        totalJobsCompleted: completedJobs.length,
        streak,
        rank
      });
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankColor = (rank) => {
    switch (rank) {
      case 'Platinum': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'Gold': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'Silver': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default: return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center space-x-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <div key={star} className="relative">
            {rating >= star ? (
              <StarIconSolid className="w-4 h-4 text-yellow-400" />
            ) : (
              <StarIcon className="w-4 h-4 text-gray-300 dark:text-gray-600" />
            )}
          </div>
        ))}
        <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-6"></div>
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
            <TrophyIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Performance
            </h3>
            <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getRankColor(metrics.rank)}`}>
              {metrics.rank}
            </div>
          </div>
        </div>

        {/* Timeframe Toggle */}
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {['week', 'month', 'quarter'].map((period) => (
            <button
              key={period}
              onClick={() => setTimeframe(period)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 capitalize ${
                timeframe === period
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Completion Rate */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Completion Rate
            </span>
            <CheckCircleIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {metrics.completionRate}%
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
            <div 
              className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${metrics.completionRate}%` }}
            ></div>
          </div>
        </div>

        {/* Average Rating */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Rating
            </span>
            <StarIcon className="w-4 h-4 text-yellow-500" />
          </div>
          <div className="mb-2">
            {renderStars(metrics.averageRating)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {metrics.totalReviews} reviews
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <ClockIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              {metrics.onTimeCompletion}%
            </span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            On-Time
          </div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <FireIcon className="w-4 h-4 text-orange-500" />
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              {metrics.streak}
            </span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Streak
          </div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            {metrics.responseTime}h
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Response
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMetrics; 