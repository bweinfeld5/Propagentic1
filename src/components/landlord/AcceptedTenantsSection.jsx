import React, { useState, useEffect, useMemo } from 'react';

interface Property {
  id: string;
  name?: string;
  nickname?: string;
  title?: string;
  address?: string | {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  zip?: string;
  propertyType?: string;
  status?: string;
  monthlyRent?: number;
  rentAmount?: number;
  monthlyRevenue?: number;
  isOccupied?: boolean;
  occupiedUnits?: number;
  units?: number;
  updatedAt?: Date;
  lastUpdated?: Date;
  type?: string;
  [key: string]: any;
}

interface AcceptedTenantsSectionProps {
  properties?: Property[];
}
import {
  UsersIcon,
  BuildingOfficeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  TrashIcon,
  EyeIcon,
  CalendarIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAuth } from '../../context/AuthContext';
import landlordProfileService from '../../services/firestore/landlordProfileService';

const AcceptedTenantsSection: React.FC<AcceptedTenantsSectionProps> = ({ properties = [] }) => {
  const { currentUser } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProperty, setSelectedProperty] = useState('all');
  const [sortBy, setSortBy] = useState('joinedDate');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [tenantToRemove, setTenantToRemove] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // Load accepted tenants
  useEffect(() => {
    loadAcceptedTenants();
  }, [currentUser]);

  const loadAcceptedTenants = async () => {
    if (!currentUser) return;

    setIsLoading(true);
    setError(null);

    try {
      const acceptedTenants = await landlordProfileService.getAcceptedTenantsWithDetails(currentUser.uid);
      console.log('Loaded accepted tenants:', acceptedTenants);
      setTenants(acceptedTenants);
    } catch (err) {
      console.error('Error loading accepted tenants:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and sort tenants
  const filteredAndSortedTenants = useMemo(() => {
    let filtered = tenants.filter(tenant => {
      const matchesSearch = 
        tenant.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.propertyName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesProperty = 
        selectedProperty === 'all' || tenant.propertyId === selectedProperty;

      return matchesSearch && matchesProperty;
    });

    // Sort tenants
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'name':
          aVal = a.name || a.email;
          bVal = b.name || b.email;
          break;
        case 'propertyName':
          aVal = a.propertyName || '';
          bVal = b.propertyName || '';
          break;
        case 'joinedDate':
          aVal = new Date(a.acceptedAt || a.joinedDate || 0);
          bVal = new Date(b.acceptedAt || b.joinedDate || 0);
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [tenants, searchTerm, selectedProperty, sortBy, sortOrder]);

  // Handle remove tenant
  const handleRemoveTenant = async (tenant) => {
    setTenantToRemove(tenant);
    setShowRemoveModal(true);
  };

  const confirmRemoveTenant = async () => {
    if (!tenantToRemove || !currentUser) return;

    setIsRemoving(true);
    try {
      // Call cloud function to remove tenant
      const functions = getFunctions();
      const removeTenant = httpsCallable(functions, 'removeTenantFromLandlord');
      
      await removeTenant({
        landlordId: currentUser.uid,
        tenantId: tenantToRemove.tenantId,
        propertyId: tenantToRemove.propertyId
      });

      // Refresh tenants list
      await loadAcceptedTenants();
      
      setShowRemoveModal(false);
      setTenantToRemove(null);
    } catch (err) {
      console.error('Error removing tenant:', err);
      setError('Failed to remove tenant: ' + err.message);
    } finally {
      setIsRemoving(false);
    }
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <UsersIcon className="w-5 h-5 mr-2 text-blue-600" />
            Accepted Tenants
          </h3>
        </div>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <UsersIcon className="w-5 h-5 mr-2 text-blue-600" />
            Accepted Tenants
            <span className="ml-2 bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded-full">
              {tenants.length}
            </span>
          </h3>
          
          {error && (
            <div className="flex items-center text-red-600 text-sm">
              <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
              {error}
            </div>
          )}
        </div>

        {/* Filters and Search */}
        {tenants.length > 0 && (
          <div className="mt-4 flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tenants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Property Filter */}
            <div className="relative">
              <select
                value={selectedProperty}
                onChange={(e) => setSelectedProperty(e.target.value)}
                className="pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="all">All Properties</option>
                {properties.map(property => (
                  <option key={property.id} value={property.id}>
                    {property.name || property.nickname || property.title || 
                     (typeof property.address === 'string' ? property.address : `${property.street || ''} ${property.city || ''}`.trim())}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="joinedDate">Join Date</option>
                <option value="name">Name</option>
                <option value="propertyName">Property</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {filteredAndSortedTenants.length === 0 ? (
          <div className="text-center py-12">
            <UsersIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {tenants.length === 0 ? 'No Tenants Yet' : 'No Matching Tenants'}
            </h3>
            <p className="text-gray-600 mb-6">
              {tenants.length === 0 
                ? 'Tenants who accept your invitations will appear here.'
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedTenants.map((tenant) => (
              <div 
                key={`${tenant.tenantId}-${tenant.propertyId}`}
                className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between">
                  {/* Tenant Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <UsersIcon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {tenant.name || tenant.displayName || 'Unknown Name'}
                        </h4>
                        <div className="flex items-center text-sm text-gray-600">
                          <EnvelopeIcon className="w-3 h-3 mr-1" />
                          {tenant.email}
                        </div>
                      </div>
                    </div>

                    {/* Property and Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-13">
                      <div className="flex items-center text-sm text-gray-600">
                        <BuildingOfficeIcon className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="font-medium">{tenant.propertyName || 'Unknown Property'}</span>
                        {tenant.unitNumber && (
                          <span className="ml-1">• Unit {tenant.unitNumber}</span>
                        )}
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <CalendarIcon className="w-4 h-4 mr-2 text-gray-400" />
                        Joined: {formatDate(tenant.acceptedAt || tenant.joinedDate)}
                      </div>

                      {tenant.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <PhoneIcon className="w-4 h-4 mr-2 text-gray-400" />
                          {tenant.phone}
                        </div>
                      )}

                      {tenant.propertyAddress && (
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPinIcon className="w-4 h-4 mr-2 text-gray-400" />
                          {tenant.propertyAddress}
                        </div>
                      )}
                    </div>

                    {/* Status and Notes */}
                    <div className="mt-3 flex items-center gap-4">
                      <div className="flex items-center">
                        <CheckCircleIcon className="w-4 h-4 text-green-500 mr-1" />
                        <span className="text-sm text-green-700 font-medium">Active Tenant</span>
                      </div>
                      
                      {tenant.inviteMethod && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          Joined via {tenant.inviteMethod}
                        </span>
                      )}
                    </div>

                    {tenant.notes && (
                      <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-xs text-yellow-800">
                          <span className="font-medium">Notes:</span> {tenant.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => {/* View tenant details */}}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleRemoveTenant(tenant)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove Tenant"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Remove Tenant Modal */}
      {showRemoveModal && tenantToRemove && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Remove Tenant</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to remove <strong>{tenantToRemove.name || tenantToRemove.email}</strong> 
              from <strong>{tenantToRemove.propertyName}</strong>? This action cannot be undone.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowRemoveModal(false);
                  setTenantToRemove(null);
                }}
                disabled={isRemoving}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              
              <button
                onClick={confirmRemoveTenant}
                disabled={isRemoving}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center"
              >
                {isRemoving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Removing...
                  </>
                ) : (
                  'Remove Tenant'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcceptedTenantsSection; 