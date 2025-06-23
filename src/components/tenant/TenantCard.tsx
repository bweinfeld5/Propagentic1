import React from 'react';
import { Tenant } from '../../utils/DataModel';

interface TenantCardProps {
  tenant: Tenant;
}

const TenantCard: React.FC<TenantCardProps> = ({ tenant }) => {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-3">
      <h3 className="font-semibold">{tenant.name || 'Unnamed Tenant'}</h3>
      <div className="text-sm text-gray-600 mt-1">
        {tenant.email && <div>Email: {tenant.email}</div>}
        {tenant.phone && <div>Phone: {tenant.phone}</div>}
        {tenant.status && (
          <div className="mt-2">
            <span 
              className={`px-2 py-1 text-xs rounded-full ${
                tenant.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {tenant.status.charAt(0).toUpperCase() + tenant.status.slice(1)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TenantCard;