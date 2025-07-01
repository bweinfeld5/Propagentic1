import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronUpIcon, ChevronDownIcon, CheckCircleIcon, MagnifyingGlassIcon as SearchIcon } from '@heroicons/react/24/solid';

const CompletedJobsHistory = ({ completedJobs = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'completedAt', direction: 'descending' });
  const navigate = useNavigate();

  // Filter jobs based on search term
  const filteredJobs = completedJobs.filter(job => {
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      (job.title || job.issueTitle || '').toLowerCase().includes(searchLower) ||
      (job.property?.address || job.propertyAddress || '').toLowerCase().includes(searchLower) ||
      (job.landlordName || '').toLowerCase().includes(searchLower) ||
      (job.unit || job.unitNumber || '').toString().toLowerCase().includes(searchLower)
    );
  });

  // Sort jobs based on current sort configuration
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    // Default values if properties are missing
    let aValue = a[sortConfig.key] || '';
    let bValue = b[sortConfig.key] || '';
    
    // Special handling for dates
    if (sortConfig.key === 'completedAt') {
      aValue = a.completedAt?.toDate?.() || new Date(a.completedAt || 0);
      bValue = b.completedAt?.toDate?.() || new Date(b.completedAt || 0);
      
      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    }
    
    // For string comparison
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return (
        sortConfig.direction === 'ascending' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      );
    }
    
    // For number comparison
    if (aValue < bValue) {
      return sortConfig.direction === 'ascending' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'ascending' ? 1 : -1;
    }
    
    return 0;
  });

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === 'ascending' ? 
      <ChevronUpIcon className="w-4 h-4 ml-1 text-teal-600" /> : 
      <ChevronDownIcon className="w-4 h-4 ml-1 text-teal-600" />;
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    
    try {
      const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
      return date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  const handleViewDetails = (jobId) => {
    navigate(`/contractor/jobs/${jobId}`);
  };

  if (completedJobs.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center">
          <CheckCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No Completed Jobs</h3>
          <p className="mt-1 text-gray-500">You haven't completed any jobs yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="sm:flex sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Completed Jobs History</h2>
          
          {/* Search Input */}
          <div className="mt-3 sm:mt-0 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search jobs..."
              className="focus:ring-teal-500 focus:border-teal-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
            />
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('title')}
              >
                <div className="flex items-center">
                  Job Title{getSortIcon('title')}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hidden md:table-cell"
                onClick={() => requestSort('propertyAddress')}
              >
                <div className="flex items-center">
                  Property{getSortIcon('propertyAddress')}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('completedAt')}
              >
                <div className="flex items-center">
                  Date Completed{getSortIcon('completedAt')}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hidden lg:table-cell"
                onClick={() => requestSort('landlordName')}
              >
                <div className="flex items-center">
                  Landlord{getSortIcon('landlordName')}
                </div>
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">View</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedJobs.map((job) => (
              <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <CheckCircleIcon className="flex-shrink-0 h-5 w-5 text-green-500 mr-2" />
                    <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                      {job.title || job.issueTitle || 'Maintenance Request'}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                  <div className="text-sm text-gray-500">
                    {job.property?.address || job.propertyAddress || 'Address not available'}
                  </div>
                  <div className="text-sm text-gray-500">
                    Unit {job.unit || job.unitNumber || 'N/A'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{formatDate(job.completedAt)}</div>
                  {job.acceptedAt && (
                    <div className="text-xs text-gray-500">
                      Started: {formatDate(job.acceptedAt)}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                  <div className="text-sm text-gray-500">
                    {job.landlordName || 'Landlord'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleViewDetails(job.id)}
                    className="text-teal-600 hover:text-teal-900 bg-teal-50 px-3 py-1 rounded-md hover:bg-teal-100 transition-colors"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CompletedJobsHistory; 