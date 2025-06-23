import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import {
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';

const EarningsSummary = () => {
  const { currentUser } = useAuth();
  const [earnings, setEarnings] = useState({
    thisWeek: 0,
    thisMonth: 0,
    lastMonth: 0,
    totalEarnings: 0,
    pendingPayments: 0,
    weeklyTrend: 0,
    monthlyTrend: 0
  });
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('week'); // 'week' or 'month'

  useEffect(() => {
    if (currentUser) {
      fetchEarningsData();
    }
  }, [currentUser]);

  const fetchEarningsData = async () => {
    try {
      setLoading(true);
      
      // Get current date ranges
      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      // Query completed jobs with payments
      const jobsRef = collection(db, 'tickets');
      const completedJobsQuery = query(
        jobsRef,
        where('contractorId', '==', currentUser.uid),
        where('status', '==', 'completed'),
        orderBy('completedAt', 'desc'),
        limit(100)
      );

      const snapshot = await getDocs(completedJobsQuery);
      const jobs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        completedAt: doc.data().completedAt?.toDate() || new Date(),
        amount: doc.data().payment?.amount || 0,
        isPaid: doc.data().payment?.status === 'paid'
      }));

      // Calculate earnings
      let thisWeekEarnings = 0;
      let thisMonthEarnings = 0;
      let lastMonthEarnings = 0;
      let totalEarnings = 0;
      let pendingPayments = 0;

      jobs.forEach(job => {
        const jobDate = job.completedAt;
        const amount = job.amount;

        if (job.isPaid) {
          totalEarnings += amount;
          
          if (jobDate >= startOfWeek) {
            thisWeekEarnings += amount;
          }
          
          if (jobDate >= startOfMonth) {
            thisMonthEarnings += amount;
          }
          
          if (jobDate >= startOfLastMonth && jobDate <= endOfLastMonth) {
            lastMonthEarnings += amount;
          }
        } else {
          pendingPayments += amount;
        }
      });

      // Calculate trends
      const weeklyTrend = thisWeekEarnings > 0 ? 
        ((thisWeekEarnings - (thisMonthEarnings - thisWeekEarnings)) / (thisMonthEarnings - thisWeekEarnings)) * 100 : 0;
      const monthlyTrend = lastMonthEarnings > 0 ? 
        ((thisMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100 : 0;

      setEarnings({
        thisWeek: thisWeekEarnings,
        thisMonth: thisMonthEarnings,
        lastMonth: lastMonthEarnings,
        totalEarnings,
        pendingPayments,
        weeklyTrend: Math.round(weeklyTrend),
        monthlyTrend: Math.round(monthlyTrend)
      });
    } catch (error) {
      console.error('Error fetching earnings data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getTrendIcon = (trend) => {
    if (trend > 0) return ArrowTrendingUpIcon;
    if (trend < 0) return ArrowTrendingDownIcon;
    return null;
  };

  const getTrendColor = (trend) => {
    if (trend > 0) return 'text-orange-600';
    if (trend < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-100 via-orange-50 to-gray-200 backdrop-blur-sm rounded-2xl border border-orange-200 p-6 shadow-lg">
        <div className="animate-pulse">
          <div className="h-5 bg-gray-300 rounded w-32 mb-6"></div>
          <div className="h-12 bg-gray-300 rounded w-24 mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-20"></div>
        </div>
      </div>
    );
  }

  const currentEarnings = timeframe === 'week' ? earnings.thisWeek : earnings.thisMonth;
  const currentTrend = timeframe === 'week' ? earnings.weeklyTrend : earnings.monthlyTrend;
  const TrendIcon = getTrendIcon(currentTrend);

  return (
    <div className="bg-gradient-to-br from-gray-100 via-orange-50 to-gray-200 backdrop-blur-sm rounded-2xl border border-orange-200 p-6 hover:shadow-xl transition-all duration-200 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-md">
            <CurrencyDollarIcon className="w-5 h-5 text-orange-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">
            Earnings
          </h3>
        </div>
        
        {/* Timeframe Toggle */}
        <div className="flex bg-white rounded-lg p-1 shadow-sm">
          <button
            onClick={() => setTimeframe('week')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
              timeframe === 'week'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setTimeframe('month')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
              timeframe === 'month'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Month
          </button>
        </div>
      </div>

      {/* Main Amount */}
      <div className="mb-6">
        <div className="flex items-end space-x-3">
          <span className="text-3xl font-bold text-gray-800">
            {formatCurrency(currentEarnings)}
          </span>
          {TrendIcon && currentTrend !== 0 && (
            <div className={`flex items-center space-x-1 ${getTrendColor(currentTrend)}`}>
              <TrendIcon className="w-4 h-4" />
              <span className="text-sm font-medium">{Math.abs(currentTrend)}%</span>
            </div>
          )}
        </div>
        <p className="text-sm text-white/70 mt-1">
          This {timeframe}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {formatCurrency(earnings.pendingPayments)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Pending
          </div>
        </div>
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {formatCurrency(earnings.totalEarnings)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Total
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex space-x-3">
        <button className="flex-1 flex items-center justify-center space-x-2 bg-gray-50 hover:bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200">
          <EyeIcon className="w-4 h-4" />
          <span>Details</span>
        </button>
        <button className="flex-1 flex items-center justify-center space-x-2 bg-gray-50 hover:bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200">
          <DocumentArrowDownIcon className="w-4 h-4" />
          <span>Export</span>
        </button>
      </div>
    </div>
  );
};

export default EarningsSummary; 