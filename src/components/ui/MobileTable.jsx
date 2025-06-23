import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  EllipsisVerticalIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

const MobileTable = ({
  data = [],
  columns = [],
  onRowClick,
  onRowLongPress,
  showSearch = true,
  showSort = true,
  showFilter = true,
  searchPlaceholder = "Search...",
  emptyMessage = "No data available",
  loading = false,
  className = ""
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [longPressTimer, setLongPressTimer] = useState(null);

  // Filter data based on search query
  const filteredData = data.filter(item => {
    if (!searchQuery) return true;
    return columns.some(column => {
      const value = column.accessor ? item[column.accessor] : '';
      return String(value).toLowerCase().includes(searchQuery.toLowerCase());
    });
  });

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortField) return 0;
    
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Handle sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle row expansion
  const toggleRowExpansion = (id) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  // Handle long press for context menu
  const handleTouchStart = (item, e) => {
    const timer = setTimeout(() => {
      onRowLongPress?.(item, e);
    }, 500); // 500ms for long press
    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  // Get primary columns (first 2-3 most important)
  const primaryColumns = columns.slice(0, 2);
  const secondaryColumns = columns.slice(2);

  const MobileCard = ({ item, index }) => {
    const isExpanded = expandedRows.has(item.id || index);
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-3 shadow-sm"
        onTouchStart={(e) => handleTouchStart(item, e)}
        onTouchEnd={handleTouchEnd}
        onClick={() => onRowClick?.(item)}
      >
        {/* Primary Content */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            {primaryColumns.map((column, idx) => {
              const value = column.accessor ? item[column.accessor] : '';
              const displayValue = column.render ? column.render(value, item) : value;
              
              return (
                <div key={idx} className={idx === 0 ? "mb-1" : ""}>
                  {idx === 0 ? (
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {displayValue}
                    </h3>
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                      {displayValue}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2 ml-3">
            {secondaryColumns.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleRowExpansion(item.id || index);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label={isExpanded ? "Collapse details" : "Expand details"}
              >
                {isExpanded ? (
                  <ChevronUpIcon className="w-5 h-5" />
                ) : (
                  <ChevronDownIcon className="w-5 h-5" />
                )}
              </button>
            )}
            
            {onRowLongPress && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRowLongPress(item, e);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label="More actions"
              >
                <EllipsisVerticalIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && secondaryColumns.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-2"
            >
              {secondaryColumns.map((column, idx) => {
                const value = column.accessor ? item[column.accessor] : '';
                const displayValue = column.render ? column.render(value, item) : value;
                
                return (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {column.header}
                    </span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {displayValue}
                    </span>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  const LoadingCard = ({ index }) => (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-3 shadow-sm animate-pulse"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-3/4"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
        <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    </div>
  );

  return (
    <div className={`mobile-table ${className}`}>
      {/* Header */}
      {(showSearch || showSort || showFilter) && (
        <div className="mb-4 space-y-3">
          {/* Search */}
          {showSearch && (
            <div className="relative">
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-800 dark:text-white text-base"
              />
            </div>
          )}
          
          {/* Sort and Filter */}
          {(showSort || showFilter) && (
            <div className="flex gap-2">
              {showSort && (
                <select
                  value={sortField || ''}
                  onChange={(e) => handleSort(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-800 dark:text-white text-sm"
                >
                  <option value="">Sort by...</option>
                  {columns.map((column) => (
                    <option key={column.accessor} value={column.accessor}>
                      {column.header}
                    </option>
                  ))}
                </select>
              )}
              
              {showSort && sortField && (
                <button
                  onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  aria-label={`Sort ${sortDirection === 'asc' ? 'descending' : 'ascending'}`}
                >
                  {sortDirection === 'asc' ? (
                    <ArrowUpIcon className="w-4 h-4" />
                  ) : (
                    <ArrowDownIcon className="w-4 h-4" />
                  )}
                </button>
              )}
              
              {showFilter && (
                <button
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Filter options"
                >
                  <FunnelIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Results Summary */}
      {!loading && (
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          {sortedData.length === 0 && searchQuery ? (
            <span>No results found for "{searchQuery}"</span>
          ) : (
            <span>
              {sortedData.length} item{sortedData.length !== 1 ? 's' : ''}
              {searchQuery && ` found for "${searchQuery}"`}
            </span>
          )}
        </div>
      )}

      {/* Content */}
      <div className="space-y-0">
        {loading ? (
          // Loading skeleton
          Array.from({ length: 3 }).map((_, index) => (
            <LoadingCard key={index} index={index} />
          ))
        ) : sortedData.length === 0 ? (
          // Empty state
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-600 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m4-8h8m-8 0V4m0 1v4" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
          </div>
        ) : (
          // Data rows
          sortedData.map((item, index) => (
            <MobileCard 
              key={item.id || index} 
              item={item} 
              index={index} 
            />
          ))
        )}
      </div>
    </div>
  );
};

export default MobileTable;