import React, { useState } from 'react';
import { UserCircleIcon, EnvelopeIcon, PhoneIcon, EyeIcon, CalendarIcon } from '@heroicons/react/24/outline';

const TenantTable = ({ tenants = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTenants = tenants.filter(tenant => 
    (tenant.name?.toLowerCase() || tenant.firstName?.toLowerCase() || tenant.lastName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (tenant.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (tenant.unitNumber?.toLowerCase() || tenant.unit?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  // Build tenant's full name from parts if needed
  const getTenantName = (tenant) => {
    if (tenant.name) return tenant.name;
    if (tenant.firstName || tenant.lastName) {
      return `${tenant.firstName || ''} ${tenant.lastName || ''}`.trim();
    }
    return 'Unknown Tenant';
  };

  // Format lease date for display
  const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  // Get lease status 
  const getLeaseStatus = (endDate) => {
    if (!endDate) return { status: 'active', label: 'Active', className: 'bg-green-100 text-green-800' };
    
    const today = new Date();
    const end = new Date(endDate);
    
    if (end < today) {
      return { status: 'expired', label: 'Expired', className: 'bg-red-100 text-red-800' };
    }
    
    // Within 30 days of expiration
    const daysToExpiry = Math.floor((end - today) / (1000 * 60 * 60 * 24));
    if (daysToExpiry <= 30) {
      return { status: 'expiring', label: `Expiring in ${daysToExpiry} days`, className: 'bg-amber-100 text-amber-800' };
    }
    
    return { status: 'active', label: 'Active', className: 'bg-green-100 text-green-800' };
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Lease Status</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Contact</th>
            <th scope="col" className="relative px-4 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredTenants.length > 0 ? (
            filteredTenants.map((tenant) => {
              const tenantName = getTenantName(tenant);
              const leaseInfo = getLeaseStatus(tenant.leaseEnd);
              
              return (
                <tr key={tenant.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-9 w-9 bg-gray-100 rounded-full flex items-center justify-center">
                        <UserCircleIcon className="h-7 w-7 text-gray-400" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{tenantName}</div>
                        <div className="text-xs text-gray-500 truncate max-w-[150px]">{tenant.email || 'No email'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {tenant.unitNumber || tenant.unit || 'N/A'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap hidden md:table-cell">
                    <div className="flex flex-col">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${leaseInfo.className}`}>
                        {leaseInfo.label}
                      </span>
                      <span className="text-xs text-gray-500 mt-1 flex items-center">
                        <CalendarIcon className="h-3 w-3 mr-1" />
                        {formatDate(tenant.leaseStart) || 'N/A'} - {formatDate(tenant.leaseEnd) || 'Present'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                    <div className="flex items-center space-x-2">
                      {tenant.email && (
                        <a 
                          href={`mailto:${tenant.email}`} 
                          className="text-gray-400 hover:text-teal-600 flex items-center"
                          title={tenant.email}
                        >
                          <EnvelopeIcon className="h-4 w-4" />
                          <span className="sr-only">Email</span>
                        </a>
                      )}
                      {tenant.phoneNumber && (
                        <a 
                          href={`tel:${tenant.phoneNumber}`} 
                          className="text-gray-400 hover:text-teal-600 flex items-center"
                          title={tenant.phoneNumber}
                        >
                          <PhoneIcon className="h-4 w-4" />
                          <span className="ml-1 text-xs">{tenant.phoneNumber}</span>
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-teal-600 hover:text-teal-900 flex items-center justify-center space-x-1 bg-teal-50 px-3 py-1 rounded transition-colors hover:bg-teal-100">
                      <EyeIcon className="h-4 w-4" />
                      <span className="hidden sm:inline">View</span>
                    </button>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="5" className="px-4 py-8 text-center text-sm text-gray-500">
                <div className="flex flex-col items-center justify-center">
                  <UserCircleIcon className="h-8 w-8 text-gray-300 mb-2" />
                  <p>{tenants.length === 0 ? 'No tenants found.' : 'No matching tenants found for your search.'}</p>
                  {tenants.length === 0 && (
                    <button className="mt-2 text-sm font-medium text-teal-600 hover:text-teal-800">
                      + Invite Tenant
                    </button>
                  )}
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TenantTable; 