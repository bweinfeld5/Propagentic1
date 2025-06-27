import React, { useState } from 'react';
import {
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  StarIcon,
  BriefcaseIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import Button from '../ui/Button';

interface ContractorCardProps {
  contractor: any;
  onEdit: (contractor: any) => void;
  onRemove: (contractorId: string) => void;
  onRate: (contractor: any) => void;
}

/**
 * ContractorCard Component
 * 
 * Displays contractor information with actions
 * 
 * @param {object} contractor - The contractor object
 * @param {function} onEdit - Callback when editing contractor
 * @param {function} onRemove - Callback when removing contractor
 * @param {function} onRate - Callback when rating contractor
 */
const ContractorCard: React.FC<ContractorCardProps> = ({ contractor, onEdit, onRemove, onRate }) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false);

  // Helper function to render star ratings
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <StarIconSolid key={i} className="w-4 h-4 text-yellow-400" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative w-4 h-4">
            <StarIcon className="absolute w-4 h-4 text-gray-300" />
            <div className="absolute w-2 h-4 overflow-hidden">
              <StarIconSolid className="w-4 h-4 text-yellow-400" />
            </div>
          </div>
        );
      } else {
        stars.push(
          <StarIcon key={i} className="w-4 h-4 text-gray-300" />
        );
      }
    }
    return stars;
  };

  // Format trades list
  const formatTrades = (trades: string[]): string => {
    if (!trades || trades.length === 0) return 'No specialties listed';
    if (trades.length === 1) return trades[0];
    if (trades.length === 2) return trades.join(' & ');
    return `${trades.slice(0, 2).join(', ')} +${trades.length - 2}`;
  };

  // Handle delete confirmation
  const handleRemoveClick = (): void => {
    if (showConfirmDelete) {
      onRemove(contractor.id);
      setShowConfirmDelete(false);
    } else {
      setShowConfirmDelete(true);
      // Auto-hide confirmation after 3 seconds
      setTimeout(() => setShowConfirmDelete(false), 3000);
    }
  };

  return (
    <div className="bg-gradient-to-br from-white to-orange-50 rounded-xl border border-orange-100 shadow-sm hover:shadow-md transition-all duration-200 p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center shadow-sm">
            <UserIcon className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{contractor.name}</h3>
            {contractor.companyName && (
              <p className="text-sm text-gray-600">{contractor.companyName}</p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onEdit(contractor)}
            className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
            title="Edit contractor"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={handleRemoveClick}
            className={`p-1.5 rounded-lg transition-colors ${
              showConfirmDelete
                ? 'text-red-600 bg-red-50 hover:bg-red-100'
                : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
            }`}
            title={showConfirmDelete ? 'Click again to confirm removal' : 'Remove contractor'}
          >
            {showConfirmDelete ? (
              <ExclamationTriangleIcon className="w-4 h-4" />
            ) : (
              <TrashIcon className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-2 mb-4">
        {contractor.email && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <EnvelopeIcon className="w-4 h-4 text-gray-400" />
            <span>{contractor.email}</span>
          </div>
        )}
        {contractor.phone && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <PhoneIcon className="w-4 h-4 text-gray-400" />
            <span>{contractor.phone}</span>
          </div>
        )}
        {contractor.trades && contractor.trades.length > 0 && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <BriefcaseIcon className="w-4 h-4 text-gray-400" />
            <span>{formatTrades(contractor.trades)}</span>
          </div>
        )}
      </div>

      {/* Rating */}
      {contractor.ratings && contractor.ratings.reviewCount > 0 && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              {renderStars(contractor.ratings.overall)}
            </div>
            <span className="text-sm text-gray-600">
              {contractor.ratings.overall.toFixed(1)} ({contractor.ratings.reviewCount} review{contractor.ratings.reviewCount !== 1 ? 's' : ''})
            </span>
          </div>
        </div>
      )}

      {/* Statistics */}
      {contractor.statistics && (
        <div className="grid grid-cols-2 gap-3 mb-4 text-xs text-gray-600">
          <div className="bg-white/50 rounded-lg p-2 border border-orange-100">
            <div className="font-medium text-gray-900">{contractor.statistics.completedJobs || 0}</div>
            <div>Jobs Completed</div>
          </div>
          <div className="bg-white/50 rounded-lg p-2 border border-orange-100">
            <div className="font-medium text-gray-900">
              {contractor.statistics.repeatCustomer ? 'Yes' : 'New'}
            </div>
            <div>Repeat Customer</div>
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex justify-between items-center pt-3 border-t border-orange-100">
        <div className="text-xs text-gray-500">
          Added {contractor.createdAt ? new Date(contractor.createdAt.toDate()).toLocaleDateString() : 'Recently'}
        </div>
        {onRate && (
          <Button
            variant="outline"
            size="xs"
            onClick={() => onRate(contractor)}
            className="text-xs"
          >
            Rate Work
          </Button>
        )}
      </div>

      {/* Confirmation message */}
      {showConfirmDelete && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs text-red-700">Click remove again to confirm deletion</p>
        </div>
      )}
    </div>
  );
};

export default ContractorCard; 