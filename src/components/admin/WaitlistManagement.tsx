import React, { useState, useEffect } from 'react';
import { 
  WaitlistEntry, 
  WaitlistStatus, 
  WaitlistFilters, 
  WaitlistMetrics 
} from '../../models/Waitlist';
import { waitlistService } from '../../services/firestore/waitlistService';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';

const WaitlistManagement: React.FC = () => {
  const { userProfile } = useAuth();
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [metrics, setMetrics] = useState<WaitlistMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<WaitlistFilters>({});
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);

  // Check if user is admin
  const isAdmin = userProfile?.userType === 'admin' || userProfile?.isAdmin;

  useEffect(() => {
    if (!isAdmin) return;
    loadWaitlistData();
  }, [isAdmin, filters]);

  const loadWaitlistData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load entries
      const entriesResult = await waitlistService.getWaitlistEntries(filters, { limit: 100 });
      if (entriesResult.success) {
        setEntries(entriesResult.data?.items || []);
      } else {
        setError(entriesResult.error || 'Failed to load waitlist entries');
      }

      // Load metrics
      const metricsResult = await waitlistService.getWaitlistMetrics();
      if (metricsResult.success) {
        setMetrics(metricsResult.data || null);
      }
    } catch (err) {
      console.error('Error loading waitlist data:', err);
      setError('Failed to load waitlist data');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (entryId: string, newStatus: WaitlistStatus) => {
    try {
      const result = await waitlistService.updateStatus(entryId, newStatus);
      if (result.success) {
        await loadWaitlistData(); // Refresh data
      } else {
        setError(result.error || 'Failed to update status');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update status');
    }
  };

  const handleBulkStatusUpdate = async (status: WaitlistStatus) => {
    if (selectedEntries.length === 0) return;

    try {
      const result = await waitlistService.bulkUpdateStatus(selectedEntries, status);
      if (result.success) {
        setSelectedEntries([]);
        await loadWaitlistData(); // Refresh data
      } else {
        setError(result.error || 'Failed to update entries');
      }
    } catch (err) {
      console.error('Error updating entries:', err);
      setError('Failed to update entries');
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadWaitlistData();
      return;
    }

    try {
      setLoading(true);
      const result = await waitlistService.searchWaitlist(searchTerm);
      if (result.success) {
        setEntries(result.data?.items || []);
      } else {
        setError(result.error || 'Search failed');
      }
    } catch (err) {
      console.error('Error searching:', err);
      setError('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectEntry = (entryId: string) => {
    setSelectedEntries(prev => 
      prev.includes(entryId) 
        ? prev.filter(id => id !== entryId)
        : [...prev, entryId]
    );
  };

  const getStatusColor = (status: WaitlistStatus) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'converted': return 'bg-green-100 text-green-800';
      case 'unsubscribed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const StatusBadge = ({ status, colorClass }: { status: string; colorClass: string }) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {status}
    </span>
  );

  if (!isAdmin) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Access denied. Admin privileges required.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Waitlist Management</h1>
        <Button onClick={loadWaitlistData} variant="outline" size="sm">
          Refresh Data
        </Button>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-500">Total Signups</h3>
            <p className="text-2xl font-bold text-gray-900">{metrics.totalSignups}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-500">Recent (7 days)</h3>
            <p className="text-2xl font-bold text-blue-600">{metrics.recentSignups}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-500">Conversion Rate</h3>
            <p className="text-2xl font-bold text-green-600">{metrics.conversionRate.toFixed(1)}%</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-500">Landlords</h3>
            <p className="text-2xl font-bold text-orange-600">{metrics.byUserType.landlord || 0}</p>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="flex">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by name, email, or company..."
                className="flex-1 border border-gray-300 rounded-l-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <Button onClick={handleSearch} className="rounded-l-none">
                Search
              </Button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User Type
            </label>
            <select
              value={filters.userType || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, userType: e.target.value || undefined }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              <option value="landlord">Landlord</option>
              <option value="tenant">Tenant</option>
              <option value="contractor">Contractor</option>
              <option value="property_manager">Property Manager</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value || undefined }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="contacted">Contacted</option>
              <option value="converted">Converted</option>
              <option value="unsubscribed">Unsubscribed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedEntries.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-800">
              {selectedEntries.length} entries selected
            </span>
            <div className="flex space-x-2">
              <Button
                onClick={() => handleBulkStatusUpdate('contacted')}
                size="sm"
                variant="outline"
              >
                Mark as Contacted
              </Button>
              <Button
                onClick={() => handleBulkStatusUpdate('converted')}
                size="sm"
                variant="outline"
              >
                Mark as Converted
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Entries Table */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <LoadingSpinner />
          </div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No waitlist entries found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedEntries.length === entries.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedEntries(entries.map(entry => entry.id!));
                        } else {
                          setSelectedEntries([]);
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedEntries.includes(entry.id!)}
                        onChange={() => toggleSelectEntry(entry.id!)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-900">{entry.name}</div>
                        <div className="text-sm text-gray-500">{entry.email}</div>
                        <div className="text-sm text-gray-500">{entry.phoneNumber}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="capitalize text-sm">{entry.userType.replace('_', ' ')}</span>
                      {entry.companyName && (
                        <div className="text-xs text-gray-500">{entry.companyName}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge 
                        status={entry.status} 
                        colorClass={getStatusColor(entry.status)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      {entry.priority && (
                        <StatusBadge 
                          status={entry.priority} 
                          colorClass={getPriorityColor(entry.priority)}
                        />
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {entry.timestamp?.toDate?.()?.toLocaleDateString() || 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-2">
                        {entry.status !== 'contacted' && (
                          <Button
                            onClick={() => handleStatusUpdate(entry.id!, 'contacted')}
                            size="sm"
                            variant="outline"
                          >
                            Contact
                          </Button>
                        )}
                        {entry.status === 'contacted' && (
                          <Button
                            onClick={() => handleStatusUpdate(entry.id!, 'converted')}
                            size="sm"
                            variant="outline"
                          >
                            Convert
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default WaitlistManagement; 