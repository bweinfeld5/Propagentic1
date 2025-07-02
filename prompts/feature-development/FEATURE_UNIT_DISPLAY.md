
# Feature Update: Displaying Units and Tenant Slots on Landlord Dashboard

## 1. Objective

Enhance the "Properties" view on the landlord dashboard to display individual units nested under each property. Each unit will show its capacity and a visual representation of "tenant slots," which will either be empty or populated with the tenant's information.

## 2. Part 1: Create the New `UnitCard` Component

First, we need to create a new, reusable component for displaying a single unit.

**Create a new file at this location:** `src/components/landlord/UnitCard.tsx`

**Add the following code to the new file:**
```typescript
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
}

const UnitCard: React.FC<UnitCardProps> = ({ unitId, unitData, allTenants }) => {
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
                  : 'bg-gray-100 border border-gray-200'
              }`}
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
                  <UserPlusIcon className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-500">Empty Slot</span>
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
```

---

## 3. Part 2: Integrate the `UnitCard` into the Dashboard

Now, we will modify the landlord dashboard to use our new `UnitCard` component.

**File to Modify:** `src/pages/landlord/LandlordDashboard.tsx`

### Step 3.1: Import the New Component
Add the following import statement at the top of the file.

```typescript
import UnitCard from '../../components/landlord/UnitCard';
```

### Step 3.2: Update the Properties View
In the `renderPropertiesView` function, we will add the logic to render the units for each property.

**Find this block of code in the `renderPropertiesView` function:**
```jsx
<div className="flex items-center gap-2 ml-4">
  <button
    onClick={(e) => {
      e.stopPropagation();
      handleEditProperty(property);
    }}
    className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
    title="Edit Property"
  >
    <PencilIcon className="w-4 h-4" />
  </button>
  <button
    onClick={(e) => {
      e.stopPropagation();
      handleDeleteProperty(property);
    }}
    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
    title="Delete Property"
  >
    <TrashIcon className="w-4 h-4" />
  </button>
</div>
```

**Replace it with the following code.** This replacement adds the new unit rendering logic right after the main property details.

```jsx
<div className="flex items-center gap-2 ml-4">
  <button
    onClick={(e) => {
      e.stopPropagation();
      handleEditProperty(property);
    }}
    className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
    title="Edit Property"
  >
    <PencilIcon className="w-4 h-4" />
  </button>
  <button
    onClick={(e) => {
      e.stopPropagation();
      handleDeleteProperty(property);
    }}
    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
    title="Delete Property"
  >
    <TrashIcon className="w-4 h-4" />
  </button>
</div>
</div>
</div>

{/* Render the units for this property */}
{property.units && Object.keys(property.units).length > 0 && (
<div className="mt-2">
  {Object.entries(property.units).map(([unitId, unitData]) => (
    <UnitCard
      key={unitId}
      unitId={unitId}
      unitData={unitData}
      allTenants={tenants}
    />
  ))}
</div>
)}
```

## 4. Final Check

After applying these changes:
1.  The dashboard will render a new, visually distinct card for each unit underneath its parent property.
2.  Each unit card will display its occupancy (e.g., "1 / 2").
3.  Each unit card will contain a number of "slots" equal to its capacity.
4.  Slots will correctly display the name of the tenant if occupied, or an "Empty Slot" message if available.
