import React, { useState, useEffect, useMemo } from 'react';
import { 
  UserIcon, 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import ContractorCard from './ContractorCard';
import contractorService from '../../services/contractorService';
import toast from 'react-hot-toast';

interface PreferredContractorsGridProps {
  contractors: any[]; // It will now receive contractors as a prop
  onAddContractor: () => void;
  onEditContractor: (contractor: any) => void;
  onRateContractor: (contractor: any) => void;
  onRemoveContractor: (contractorId: string) => void;
  isLoading: boolean; // Receive loading state as a prop
  onRefresh?: () => void; // Optional refresh callback for error handling
}

/**
 * PreferredContractorsGrid Component
 * 
 * Main grid layout for displaying and managing contractors
 * 
 * @param {string} landlordId - Current landlord's ID
 * @param {function} onAddContractor - Callback to open add contractor modal
 * @param {function} onEditContractor - Callback to edit contractor
 * @param {function} onRateContractor - Callback to rate contractor
 */
const PreferredContractorsGrid: React.FC<PreferredContractorsGridProps> = ({ 
  contractors,
  onAddContractor, 
  onEditContractor, 
  onRateContractor,
  onRemoveContractor,
  isLoading,
  onRefresh
}) => {
  const [filteredContractors, setFilteredContractors] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedTrade, setSelectedTrade] = useState<string>('all');

  // Filter contractors when search term or trade filter changes
  useEffect(() => {
    filterContractors();
  }, [contractors, searchTerm, selectedTrade]);

  const filterContractors = (): void => {
    let filtered = [...contractors];

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(contractor =>
        contractor.name?.toLowerCase().includes(searchLower) ||
        contractor.companyName?.toLowerCase().includes(searchLower) ||
        contractor.email?.toLowerCase().includes(searchLower) ||
        contractor.trades?.some((trade: string) => trade.toLowerCase().includes(searchLower))
      );
    }

    // Filter by trade
    if (selectedTrade !== 'all') {
      filtered = filtered.filter(contractor =>
        contractor.trades?.includes(selectedTrade)
      );
    }

    setFilteredContractors(filtered);
  };

  // Get unique trades from all contractors for filter dropdown
  const availableTrades: string[] = useMemo(() => {
    const trades = new Set<string>();
    contractors.forEach(contractor => {
      if (contractor.trades && Array.isArray(contractor.trades)) {
        contractor.trades.forEach((trade: string) => trades.add(trade));
      }
    });
    return Array.from(trades).sort();
  }, [contractors]);

  // Handle contractor removal
  const handleRemoveContractor = (contractorId: string): void => {
    onRemoveContractor(contractorId);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-4"></div>
        <p className="text-gray-600">Loading contractors...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <ExclamationCircleIcon className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-600 text-center">{error}</p>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search contractors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Trade Filter */}
          {availableTrades.length > 0 && (
            <div className="relative">
              <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={selectedTrade}
                onChange={(e) => setSelectedTrade(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
              >
                <option value="all">All Trades</option>
                {availableTrades.map((trade: string, index: number) => (
                  <option key={`trade-${index}-${trade}`} value={trade}>{trade}</option>
                ))}
              </select>
            </div>
          )}

          {/* Add Contractor Button */}
          <button
            onClick={onAddContractor}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            Add Contractor
          </button>
        </div>
      </div>

      {/* Results Summary */}
      {contractors.length > 0 && (
        <div className="text-sm text-gray-600">
          Showing {filteredContractors.length} of {contractors.length} contractor{contractors.length !== 1 ? 's' : ''}
          {searchTerm && ` matching "${searchTerm}"`}
          {selectedTrade !== 'all' && ` in ${selectedTrade}`}
        </div>
      )}

      {/* Contractors Grid */}
      {contractors.length === 0 ? (
        <div className="text-center py-12">
          <UserIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Contractors Yet</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Start building your preferred contractors list by adding trusted professionals for your maintenance needs.
          </p>
          <button
            onClick={onAddContractor}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2 mx-auto"
          >
            <PlusIcon className="w-5 h-5" />
            Add Your First Contractor
          </button>
        </div>
      ) : filteredContractors.length === 0 ? (
        <div className="text-center py-12">
          <MagnifyingGlassIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Contractors Found</h3>
          <p className="text-gray-600 mb-4">
            No contractors match your current search criteria.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedTrade('all');
            }}
            className="text-orange-600 hover:text-orange-700 font-medium"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContractors.map(contractor => (
            <ContractorCard
              key={contractor.id}
              contractor={contractor}
              onEdit={onEditContractor}
              onRemove={handleRemoveContractor}
              onRate={onRateContractor}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PreferredContractorsGrid; 