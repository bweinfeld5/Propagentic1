import React from 'react';
import { UserIcon, UserPlusIcon } from '@heroicons/react/24/outline';

// Define the types for the component's props
interface Tenant {
  id: string;
  name?: string;
  email: string;
}

interface UnitData {
  capacity: number;
  tenants: string[]; // Array of tenant IDs
}

interface UnitCardProps {
  unitId: string;
  unitData: UnitData;
  allTenants: Tenant[]; // The full list of tenant objects
  propertyId: string;
  propertyName: string;
  onEmptySlotClick?: (propertyId: string, propertyName: string, unitId: string) => void;
}

const UnitCard: React.FC<UnitCardProps> = ({ unitId, unitData, allTenants, propertyId, propertyName, onEmptySlotClick }) => {
  const { capacity = 0, tenants: tenantIds = [] } = unitData;

  // Create an array representing the "slots" for the unit based on its capacity
  const slots = Array.from({ length: capacity });

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-2 ml-4">
      {/* Unit Header */}
      <div className="flex justify-between items-center mb-2">
        <h5 className="font-semibold text-gray-800">Unit {unitId}</h5>
        <span className="text-sm text-gray-600">
          Occupancy: {tenantIds.length} / {capacity}
        </span>
      </div>

      {/* Tenant Slots */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
        {slots.map((_, index) => {
          const tenantId = tenantIds[index];
          const tenant = tenantId ? allTenants.find(t => t.id === tenantId) : null;

          return (
            <div
              key={index}
              className={`p-2 rounded-md flex items-center text-xs ${
                tenant
                  ? 'bg-blue-100 border border-blue-200'
                  : onEmptySlotClick 
                    ? 'bg-gray-100 border border-gray-200 hover:bg-orange-50 hover:border-orange-300 cursor-pointer transition-colors'
                    : 'bg-gray-100 border border-gray-200'
              }`}
              onClick={tenant ? undefined : () => onEmptySlotClick?.(propertyId, propertyName, unitId)}
              title={tenant ? undefined : 'Click to invite tenant to this slot'}
            >
              {tenant ? (
                <>
                  <UserIcon className="w-4 h-4 mr-2 text-blue-600 flex-shrink-0" />
                  <span className="font-medium text-blue-800 truncate" title={tenant.email}>
                    {tenant.name || tenant.email}
                  </span>
                </>
              ) : (
                <>
                  <UserPlusIcon className={`w-4 h-4 mr-2 flex-shrink-0 ${
                    onEmptySlotClick ? 'text-orange-500 group-hover:text-orange-600' : 'text-gray-400'
                  }`} />
                  <span className={`${
                    onEmptySlotClick ? 'text-orange-600 group-hover:text-orange-700' : 'text-gray-500'
                  }`}>
                    {onEmptySlotClick ? 'Click to Invite' : 'Empty Slot'}
                  </span>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UnitCard; 