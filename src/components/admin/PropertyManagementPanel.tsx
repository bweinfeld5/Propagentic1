import React, { useState, useEffect, useCallback } from 'react';
import { BuildingOfficeIcon, MagnifyingGlassIcon, EyeIcon, CalendarIcon, MapPinIcon, UserIcon } from '@heroicons/react/24/outline';
import { DocumentSnapshot } from 'firebase/firestore';
import adminService from '../../services/adminService';
import Button from '../ui/Button';

interface Property {
  id: string;
  address?: {
    full?: string;
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  landlordId: string;
  landlordName: string;
  status?: string;
  type?: string;
  bedrooms?: number;
  bathrooms?: number;
  rent?: number;
  tenants?: any[];
  createdAt: Date;
  updatedAt?: Date;
}

const PropertyManagementPanel: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({ search: '', status: 'all' });
  const [pagination, setPagination] = useState<{ lastDoc?: DocumentSnapshot; hasMore: boolean }>({ hasMore: true });
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  const loadProperties = useCallback(async (loadMore = false) => {
    setIsLoading(true);
    try {
      const result = await adminService.getAllProperties(filters, {
        pageSize: 20,
        lastDoc: loadMore ? pagination.lastDoc : undefined,
      });
      setProperties(prev => loadMore ? [...prev, ...result.properties] : result.properties);
      setPagination({ lastDoc: result.lastDoc, hasMore: result.hasMore });
    } catch (error) {
      console.error('Failed to load properties:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filters, pagination.lastDoc]);

  useEffect(() => {
    loadProperties();
  }, [filters.status]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadProperties();
  };

  const handleLoadMore = () => {
    if (pagination.hasMore && !isLoading) {
      loadProperties(true);
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getPropertyStatusBadge = (status?: string) => {
    const variant = adminService.getPropertyStatusVariant(status);
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${variant}`}>
        {status || 'Unknown'}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Property Management</h2>
          <p className="text-gray-600 mt-1">Monitor and oversee all properties on the platform</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <BuildingOfficeIcon className="w-5 h-5" />
          <span>{properties.length} properties loaded</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by address, landlord, or city..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="vacant">Vacant</option>
            <option value="maintenance">Maintenance</option>
            <option value="inactive">Inactive</option>
          </select>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Searching...' : 'Search'}
          </Button>
        </form>
      </div>

      {/* Properties Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Property
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Landlord
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date Added
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {properties.map((property) => (
                <tr key={property.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <BuildingOfficeIcon className="w-8 h-8 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {property.address?.full || property.address?.street || 'No Address'}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <MapPinIcon className="w-4 h-4 mr-1" />
                          {property.address?.city && property.address?.state
                            ? `${property.address.city}, ${property.address.state}`
                            : 'Location Unknown'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <UserIcon className="w-5 h-5 text-gray-400 mr-2" />
                      <div className="text-sm text-gray-900">{property.landlordName}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {property.bedrooms && property.bathrooms ? (
                        <div>{property.bedrooms}bd / {property.bathrooms}ba</div>
                      ) : (
                        <div>Details not available</div>
                      )}
                      <div className="text-sm text-gray-500">
                        {property.rent ? formatCurrency(property.rent) : 'Rent not set'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getPropertyStatusBadge(property.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <CalendarIcon className="w-4 h-4 mr-1" />
                      {property.createdAt ? property.createdAt.toLocaleDateString() : 'Unknown'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedProperty(property)}
                    >
                      <EyeIcon className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading properties...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && properties.length === 0 && (
          <div className="text-center p-12">
            <BuildingOfficeIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
            <p className="text-gray-600">
              {filters.search || filters.status !== 'all'
                ? 'Try adjusting your search criteria or filters.'
                : 'There are no properties in the system yet.'}
            </p>
          </div>
        )}

        {/* Load More Button */}
        {!isLoading && properties.length > 0 && pagination.hasMore && (
          <div className="text-center p-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={handleLoadMore}
              disabled={isLoading}
            >
              Load More Properties
            </Button>
          </div>
        )}
      </div>

      {/* Property Detail Modal */}
      {selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Property Details</h3>
                <button
                  onClick={() => setSelectedProperty(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Address */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Address</h4>
                  <p className="text-gray-600">
                    {selectedProperty.address?.full || 'No address available'}
                  </p>
                </div>

                {/* Landlord */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Property Owner</h4>
                  <p className="text-gray-600">{selectedProperty.landlordName}</p>
                </div>

                {/* Property Details */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Property Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-500">Bedrooms:</span>
                      <p className="text-gray-900">{selectedProperty.bedrooms || 'Not specified'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Bathrooms:</span>
                      <p className="text-gray-900">{selectedProperty.bathrooms || 'Not specified'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Monthly Rent:</span>
                      <p className="text-gray-900">{formatCurrency(selectedProperty.rent)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Status:</span>
                      <div className="mt-1">{getPropertyStatusBadge(selectedProperty.status)}</div>
                    </div>
                  </div>
                </div>

                {/* Tenants */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Current Tenants</h4>
                  {selectedProperty.tenants && selectedProperty.tenants.length > 0 ? (
                    <div className="space-y-2">
                      {selectedProperty.tenants.map((tenant, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <p className="font-medium">{tenant.name || tenant.email}</p>
                          {tenant.email && <p className="text-sm text-gray-600">{tenant.email}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">No tenants currently assigned</p>
                  )}
                </div>

                {/* Dates */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Timeline</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-500">Created:</span>
                      <p className="text-gray-900">
                        {selectedProperty.createdAt ? selectedProperty.createdAt.toLocaleDateString() : 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Last Updated:</span>
                      <p className="text-gray-900">
                        {selectedProperty.updatedAt ? new Date(selectedProperty.updatedAt).toLocaleDateString() : 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setSelectedProperty(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyManagementPanel;
