import React, { useState, useEffect } from 'react';
import { 
  UserGroupIcon, 
  MagnifyingGlassIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { getAllTenants, searchTenants, formatTenantForDisplay, TenantAccount } from '../../utils/tenantUtils';
import toast from 'react-hot-toast';

const TenantList: React.FC = () => {
  const [tenants, setTenants] = useState<TenantAccount[]>([]);
  const [filteredTenants, setFilteredTenants] = useState<TenantAccount[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTenants();
  }, []);

  useEffect(() => {
    const filtered = searchTenants(tenants, searchQuery);
    setFilteredTenants(filtered);
  }, [tenants, searchQuery]);

  const loadTenants = async () => {
    setLoading(true);
    setError(null);
    try {
      const tenantAccounts = await getAllTenants();
      setTenants(tenantAccounts);
      console.log(`Loaded ${tenantAccounts.length} tenant accounts`);
      toast.success(`Found ${tenantAccounts.length} tenant accounts`);
    } catch (err: any) {
      setError(err.message || 'Failed to load tenant accounts');
      toast.error('Failed to load tenant accounts');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    if (date?.toDate) return date.toDate().toLocaleDateString();
    if (date instanceof Date) return date.toLocaleDateString();
    return 'N/A';
  };

  const getTenantName = (tenant: TenantAccount) => {
    if (tenant.name) return tenant.name;
    if (tenant.displayName) return tenant.displayName;
    if (tenant.firstName && tenant.lastName) return `${tenant.firstName} ${tenant.lastName}`;
    if (tenant.firstName) return tenant.firstName;
    return 'No Name';
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading tenant accounts...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="text-red-400">⚠️</div>
            <div className="ml-3">
              <h3 className="text-red-800 font-medium">Error Loading Tenants</h3>
              <p className="text-red-600 mt-1">{error}</p>
              <button 
                onClick={loadTenants}
                className="mt-3 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <UserGroupIcon className="h-6 w-6 text-blue-600 mr-3" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  PropAgentic Tenant Accounts
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {filteredTenants.length} of {tenants.length} tenant{tenants.length !== 1 ? 's' : ''} shown
                </p>
              </div>
            </div>
            <button 
              onClick={loadTenants}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-6 py-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search tenants by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Tenant List */}
      {filteredTenants.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <UserIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? 'No tenants found' : 'No tenant accounts'}
          </h3>
          <p className="text-gray-500">
            {searchQuery 
              ? `No tenants match "${searchQuery}". Try a different search term.`
              : 'There are no tenant accounts in the system yet.'
            }
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tenant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTenants.map((tenant) => (
                  <tr key={tenant.uid} className="hover:bg-gray-50">
                    {/* Tenant Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <UserIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {getTenantName(tenant)}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {tenant.uid.substring(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact Info */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-900">
                          <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                          <a 
                            href={`mailto:${tenant.email}`}
                            className="hover:text-blue-600 underline"
                          >
                            {tenant.email}
                          </a>
                        </div>
                        {tenant.phone && (
                          <div className="flex items-center text-sm text-gray-500">
                            <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                            <a 
                              href={`tel:${tenant.phone}`}
                              className="hover:text-blue-600"
                            >
                              {tenant.phone}
                            </a>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          tenant.status === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {tenant.status || 'active'}
                        </span>
                        <div className="text-xs text-gray-500">
                          Role: {tenant.role}
                        </div>
                      </div>
                    </td>

                    {/* Dates */}
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                          <span>Joined: {formatDate(tenant.createdAt)}</span>
                        </div>
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
                          <span>Last Login: {formatDate(tenant.lastLoginAt)}</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <UserGroupIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-2xl font-semibold text-gray-900">{tenants.length}</p>
              <p className="text-sm text-gray-500">Total Tenants</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
              <div className="h-3 w-3 rounded-full bg-green-600"></div>
            </div>
            <div className="ml-3">
              <p className="text-2xl font-semibold text-gray-900">
                {tenants.filter(t => t.status === 'active' || !t.status).length}
              </p>
              <p className="text-sm text-gray-500">Active Tenants</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <EnvelopeIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-2xl font-semibold text-gray-900">
                {tenants.filter(t => t.phone).length}
              </p>
              <p className="text-sm text-gray-500">With Phone Numbers</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantList; 