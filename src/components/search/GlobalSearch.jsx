import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  FunnelIcon,
  AdjustmentsHorizontalIcon,
  HomeIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
  DocumentTextIcon,
  CalendarIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Advanced Global Search with Filtering & Faceted Search
 * Phase 1.2 Implementation
 */
const GlobalSearch = ({ onClose, isOpen = false }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    type: 'all', // all, properties, tenants, maintenance, documents
    status: 'all', // all, active, inactive, pending, completed
    dateRange: 'all', // all, last7days, last30days, last90days
    priority: 'all' // all, high, medium, low
  });
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const searchInputRef = useRef(null);

  // Mock data for search
  const mockData = {
    properties: [
      {
        id: 'prop1',
        type: 'property',
        title: 'Sunset Apartments',
        subtitle: '123 Main St, Downtown',
        status: 'active',
        details: '24 units • 92% occupied • $36k monthly revenue',
        icon: HomeIcon,
        color: 'orange',
        date: '2024-01-15'
      },
      {
        id: 'prop2',
        type: 'property',
        title: 'Downtown Lofts',
        subtitle: '456 Business Ave, Central',
        status: 'active',
        details: '12 units • 100% occupied • $26k monthly revenue',
        icon: HomeIcon,
        color: 'orange',
        date: '2024-02-01'
      },
      {
        id: 'prop3',
        type: 'property',
        title: 'Garden Complex',
        subtitle: '789 Park Lane, Suburbs',
        status: 'active',
        details: '36 units • 78% occupied • $43k monthly revenue',
        icon: HomeIcon,
        color: 'orange',
        date: '2024-01-20'
      }
    ],
    tenants: [
      {
        id: 'tenant1',
        type: 'tenant',
        title: 'John Smith',
        subtitle: 'Unit 204, Sunset Apartments',
        status: 'active',
        details: 'Lease expires: Dec 2024 • $1,800/month • 2 years tenure',
        icon: UsersIcon,
        color: 'blue',
        date: '2022-12-01'
      },
      {
        id: 'tenant2',
        type: 'tenant',
        title: 'Sarah Johnson',
        subtitle: 'Unit 101, Downtown Lofts',
        status: 'active',
        details: 'Lease expires: Mar 2025 • $2,200/month • 3 years tenure',
        icon: UsersIcon,
        color: 'blue',
        date: '2021-03-15'
      },
      {
        id: 'tenant3',
        type: 'tenant',
        title: 'Mike Wilson',
        subtitle: 'Unit 305, Garden Complex',
        status: 'pending',
        details: 'Lease starts: Next month • $1,600/month • New tenant',
        icon: UsersIcon,
        color: 'blue',
        date: '2024-06-01'
      }
    ],
    maintenance: [
      {
        id: 'maint1',
        type: 'maintenance',
        title: 'Plumbing Repair',
        subtitle: 'Unit 204, Sunset Apartments',
        status: 'pending',
        details: 'Kitchen sink leak • Priority: High • Assigned to: ABC Plumbing',
        icon: WrenchScrewdriverIcon,
        color: 'red',
        priority: 'high',
        date: '2024-06-01'
      },
      {
        id: 'maint2',
        type: 'maintenance',
        title: 'HVAC Maintenance',
        subtitle: 'Unit 101, Downtown Lofts',
        status: 'completed',
        details: 'Annual service • Priority: Medium • Completed by: XYZ HVAC',
        icon: WrenchScrewdriverIcon,
        color: 'green',
        priority: 'medium',
        date: '2024-05-28'
      },
      {
        id: 'maint3',
        type: 'maintenance',
        title: 'Electrical Issue',
        subtitle: 'Unit 305, Garden Complex',
        status: 'in-progress',
        details: 'Circuit breaker replacement • Priority: High • ETA: Tomorrow',
        icon: WrenchScrewdriverIcon,
        color: 'yellow',
        priority: 'high',
        date: '2024-05-30'
      }
    ],
    documents: [
      {
        id: 'doc1',
        type: 'document',
        title: 'Lease Agreement - John Smith',
        subtitle: 'Unit 204, Sunset Apartments',
        status: 'active',
        details: 'Executed: Dec 2022 • Expires: Dec 2024 • Type: Residential Lease',
        icon: DocumentTextIcon,
        color: 'purple',
        date: '2022-12-01'
      },
      {
        id: 'doc2',
        type: 'document',
        title: 'Property Inspection Report',
        subtitle: 'Downtown Lofts',
        status: 'completed',
        details: 'Annual inspection • Date: May 2024 • Status: Passed',
        icon: DocumentTextIcon,
        color: 'purple',
        date: '2024-05-15'
      }
    ]
  };

  // Combine all data for search
  const allData = useMemo(() => [
    ...mockData.properties,
    ...mockData.tenants,
    ...mockData.maintenance,
    ...mockData.documents
  ], []);

  // Filter and search logic
  const filteredResults = useMemo(() => {
    let results = allData;

    // Apply type filter
    if (activeFilters.type !== 'all') {
      results = results.filter(item => item.type === activeFilters.type);
    }

    // Apply status filter
    if (activeFilters.status !== 'all') {
      results = results.filter(item => item.status === activeFilters.status);
    }

    // Apply priority filter (for maintenance items)
    if (activeFilters.priority !== 'all') {
      results = results.filter(item => 
        item.type !== 'maintenance' || item.priority === activeFilters.priority
      );
    }

    // Apply date range filter
    if (activeFilters.dateRange !== 'all') {
      const now = new Date();
      const dateThreshold = new Date();
      
      switch (activeFilters.dateRange) {
        case 'last7days':
          dateThreshold.setDate(now.getDate() - 7);
          break;
        case 'last30days':
          dateThreshold.setDate(now.getDate() - 30);
          break;
        case 'last90days':
          dateThreshold.setDate(now.getDate() - 90);
          break;
      }
      
      results = results.filter(item => new Date(item.date) >= dateThreshold);
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(item =>
        item.title.toLowerCase().includes(query) ||
        item.subtitle.toLowerCase().includes(query) ||
        item.details.toLowerCase().includes(query)
      );
    }

    return results;
  }, [allData, activeFilters, searchQuery]);

  // Auto-focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Simulate search loading
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setSearchResults(filteredResults);
      setIsLoading(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [filteredResults]);

  // Filter options
  const filterOptions = {
    type: [
      { value: 'all', label: 'All Types', icon: null },
      { value: 'properties', label: 'Properties', icon: HomeIcon },
      { value: 'tenants', label: 'Tenants', icon: UsersIcon },
      { value: 'maintenance', label: 'Maintenance', icon: WrenchScrewdriverIcon },
      { value: 'documents', label: 'Documents', icon: DocumentTextIcon }
    ],
    status: [
      { value: 'all', label: 'All Statuses' },
      { value: 'active', label: 'Active' },
      { value: 'pending', label: 'Pending' },
      { value: 'completed', label: 'Completed' },
      { value: 'in-progress', label: 'In Progress' }
    ],
    priority: [
      { value: 'all', label: 'All Priorities' },
      { value: 'high', label: 'High Priority' },
      { value: 'medium', label: 'Medium Priority' },
      { value: 'low', label: 'Low Priority' }
    ],
    dateRange: [
      { value: 'all', label: 'Any Time' },
      { value: 'last7days', label: 'Last 7 Days' },
      { value: 'last30days', label: 'Last 30 Days' },
      { value: 'last90days', label: 'Last 90 Days' }
    ]
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get result icon color
  const getIconColor = (color) => {
    switch (color) {
      case 'orange': return 'text-orange-600 bg-orange-100';
      case 'blue': return 'text-blue-600 bg-blue-100';
      case 'red': return 'text-red-600 bg-red-100';
      case 'green': return 'text-green-600 bg-green-100';
      case 'yellow': return 'text-yellow-600 bg-yellow-100';
      case 'purple': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-16"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search properties, tenants, maintenance, documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-lg"
              />
            </div>
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-4 py-3 rounded-lg border transition-colors flex items-center gap-2 ${
                showAdvancedFilters
                  ? 'bg-orange-50 border-orange-200 text-orange-700'
                  : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FunnelIcon className="w-5 h-5" />
              Filters
            </button>
            <button
              onClick={onClose}
              className="p-3 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2">
            {filterOptions.type.slice(0, 5).map((option) => (
              <button
                key={option.value}
                onClick={() => setActiveFilters(prev => ({ ...prev, type: option.value }))}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  activeFilters.type === option.value
                    ? 'bg-orange-100 text-orange-700 border border-orange-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.icon && <option.icon className="w-4 h-4" />}
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Filters */}
        <AnimatePresence>
          {showAdvancedFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b border-gray-200 bg-gray-50 overflow-hidden"
            >
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={activeFilters.status}
                    onChange={(e) => setActiveFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    {filterOptions.status.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={activeFilters.priority}
                    onChange={(e) => setActiveFilters(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    {filterOptions.priority.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                  <select
                    value={activeFilters.dateRange}
                    onChange={(e) => setActiveFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    {filterOptions.dateRange.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto max-h-96">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="p-6">
              <div className="mb-4 text-sm text-gray-600">
                Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
              </div>
              <div className="space-y-3">
                {searchResults.map((result) => (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 border border-gray-200 rounded-lg hover:border-orange-200 hover:bg-orange-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${getIconColor(result.color)}`}>
                        <result.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {result.title}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(result.status)}`}>
                            {result.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{result.subtitle}</p>
                        <p className="text-sm text-gray-500">{result.details}</p>
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(result.date).toLocaleDateString()}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <MagnifyingGlassIcon className="w-12 h-12 mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery.trim() ? 'No results found' : 'Start typing to search'}
              </h3>
              <p className="text-sm text-center">
                {searchQuery.trim() 
                  ? 'Try adjusting your search terms or filters'
                  : 'Search across properties, tenants, maintenance requests, and documents'
                }
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              Press <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono">Esc</kbd> to close
            </div>
            <div>
              Use <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono">↑</kbd> 
              <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono ml-1">↓</kbd> to navigate
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GlobalSearch; 