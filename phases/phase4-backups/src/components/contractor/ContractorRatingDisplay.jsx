import React, { useState, useEffect } from 'react';
import {
  StarIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  TrophyIcon,
  UsersIcon,
  CalendarIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

const ContractorRatingDisplay = ({ 
  contractorId, 
  ratings = [], 
  averageRating = 0, 
  totalReviews = 0,
  className = '',
  showDetails = false 
}) => {
  const [expandedReview, setExpandedReview] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Calculate rating breakdown
  const ratingBreakdown = {
    5: ratings.filter(r => r.rating === 5).length,
    4: ratings.filter(r => r.rating === 4).length,
    3: ratings.filter(r => r.rating === 3).length,
    2: ratings.filter(r => r.rating === 2).length,
    1: ratings.filter(r => r.rating === 1).length,
  };

  // Calculate performance metrics
  const performanceMetrics = {
    onTimeCompletion: ratings.filter(r => r.onTime).length / ratings.length * 100 || 0,
    qualityScore: ratings.reduce((acc, r) => acc + (r.qualityRating || 0), 0) / ratings.length || 0,
    communicationScore: ratings.reduce((acc, r) => acc + (r.communicationRating || 0), 0) / ratings.length || 0,
    avgJobDuration: ratings.reduce((acc, r) => acc + (r.completionTime || 0), 0) / ratings.length || 0
  };

  // Filter and sort reviews
  const filteredReviews = ratings
    .filter(review => {
      if (filterCategory === 'all') return true;
      return review.category === filterCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'highest':
          return b.rating - a.rating;
        case 'lowest':
          return a.rating - b.rating;
        default:
          return 0;
      }
    });

  const renderStars = (rating, size = 'w-5 h-5', className = '') => (
    <div className={`flex items-center gap-1 ${className}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <div key={star} className="relative">
          <StarIcon className={`${size} text-gray-300`} />
          {star <= rating && (
            <StarSolidIcon className={`${size} text-yellow-400 absolute inset-0`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderRatingBar = (count, total, rating) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="w-3 text-gray-700">{rating}</span>
        <StarSolidIcon className="w-4 h-4 text-yellow-400" />
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div 
            className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="w-8 text-gray-600 text-xs">{count}</span>
      </div>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCategoryIcon = (category) => {
    const icons = {
      plumbing: '🔧',
      electrical: '⚡',
      hvac: '❄️',
      carpentry: '🔨',
      painting: '🎨',
      general: '🏠'
    };
    return icons[category] || '🔧';
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header with overall rating */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {averageRating.toFixed(1)}
              </div>
              {renderStars(averageRating, 'w-6 h-6')}
              <div className="text-sm text-gray-600 mt-1">
                {totalReviews} review{totalReviews !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Performance badges */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50 px-3 py-2 rounded-lg text-center">
                <div className="text-lg font-semibold text-green-800">
                  {performanceMetrics.onTimeCompletion.toFixed(0)}%
                </div>
                <div className="text-xs text-green-600">On Time</div>
              </div>
              
              <div className="bg-blue-50 px-3 py-2 rounded-lg text-center">
                <div className="text-lg font-semibold text-blue-800">
                  {performanceMetrics.qualityScore.toFixed(1)}
                </div>
                <div className="text-xs text-blue-600">Quality</div>
              </div>

              <div className="bg-purple-50 px-3 py-2 rounded-lg text-center">
                <div className="text-lg font-semibold text-purple-800">
                  {performanceMetrics.communicationScore.toFixed(1)}
                </div>
                <div className="text-xs text-purple-600">Communication</div>
              </div>

              <div className="bg-orange-50 px-3 py-2 rounded-lg text-center">
                <div className="text-lg font-semibold text-orange-800">
                  {performanceMetrics.avgJobDuration.toFixed(0)}h
                </div>
                <div className="text-xs text-orange-600">Avg Duration</div>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
              <TrophyIcon className="w-4 h-4 inline mr-1" />
              View Awards
            </button>
          </div>
        </div>
      </div>

      {showDetails && (
        <>
          {/* Rating breakdown */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ChartBarIcon className="w-5 h-5" />
              Rating Breakdown
            </h3>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map(rating => 
                renderRatingBar(ratingBreakdown[rating], totalReviews, rating)
              )}
            </div>
          </div>

          {/* Filters and sorting */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mr-2">Category:</label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="text-sm border border-gray-300 rounded-lg px-3 py-1"
                  >
                    <option value="all">All Categories</option>
                    <option value="plumbing">Plumbing</option>
                    <option value="electrical">Electrical</option>
                    <option value="hvac">HVAC</option>
                    <option value="carpentry">Carpentry</option>
                    <option value="painting">Painting</option>
                    <option value="general">General</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mr-2">Sort by:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="text-sm border border-gray-300 rounded-lg px-3 py-1"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="highest">Highest Rating</option>
                    <option value="lowest">Lowest Rating</option>
                  </select>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                Showing {filteredReviews.length} of {totalReviews} reviews
              </div>
            </div>
          </div>

          {/* Reviews list */}
          <div className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Recent Reviews</h3>
            
            {filteredReviews.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <UsersIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No reviews found for the selected criteria.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredReviews.slice(0, expandedReview ? filteredReviews.length : 3).map((review, index) => (
                  <div key={review.id || index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                          {review.reviewerName ? review.reviewerName[0].toUpperCase() : 'A'}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {review.reviewerName || 'Anonymous'}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <CalendarIcon className="w-4 h-4" />
                            {formatDate(review.createdAt)}
                            {review.category && (
                              <>
                                <span>•</span>
                                <TagIcon className="w-4 h-4" />
                                <span className="flex items-center gap-1">
                                  {getCategoryIcon(review.category)}
                                  {review.category}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        {renderStars(review.rating, 'w-4 h-4')}
                        {review.onTime && (
                          <div className="flex items-center gap-1 text-green-600 text-xs mt-1">
                            <CheckCircleIcon className="w-3 h-3" />
                            <span>On Time</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-gray-700 mb-3">{review.comment}</p>

                    {/* Additional metrics */}
                    {(review.qualityRating || review.communicationRating || review.completionTime) && (
                      <div className="flex items-center gap-4 text-sm text-gray-600 pt-3 border-t border-gray-100">
                        {review.qualityRating && (
                          <span>Quality: {review.qualityRating}/5</span>
                        )}
                        {review.communicationRating && (
                          <span>Communication: {review.communicationRating}/5</span>
                        )}
                        {review.completionTime && (
                          <span className="flex items-center gap-1">
                            <ClockIcon className="w-4 h-4" />
                            Completed in {review.completionTime}h
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Show more button */}
                {filteredReviews.length > 3 && !expandedReview && (
                  <button
                    onClick={() => setExpandedReview(true)}
                    className="w-full py-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Show {filteredReviews.length - 3} more reviews
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ContractorRatingDisplay; 