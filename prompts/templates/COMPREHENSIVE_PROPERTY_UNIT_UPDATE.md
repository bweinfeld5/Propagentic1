
# Comprehensive Property and Unit Management Update

## 1. Objective

This guide provides a complete set of instructions to fully integrate the new, unit-based property management system across the application. This will fix incorrect occupancy data on the dashboard and implement robust, capacity-aware logic for inviting tenants.

## 2. Part 1: Fix Property Occupancy Display on Dashboard

The goal is to make the properties view on the landlord dashboard display accurate unit counts and occupancy percentages based on the new `units` data model.

**File to Modify:** `src/pages/landlord/LandlordDashboard.tsx`

### Step 2.1: Update the `Property` Interface
First, ensure the `Property` interface is aware of the new `units` structure.

**Find this interface:**
```typescript
interface Property {
  // ... existing fields
}
```
**Ensure it includes the `units` map:**
```typescript
interface Property {
  id: string;
  name?: string;
  // ... other fields
  units?: {
    [unitId: string]: {
      capacity: number;
      tenants: string[];
    };
  };
  // ... other fields
}
```

### Step 2.2: Create a Calculation Helper Function
Add this helper function inside the `LandlordDashboard` component. It will do all the complex calculations and return easy-to-use values.

```typescript
// Add this helper function inside the LandlordDashboard component
const getOccupancyDetails = (property: Property) => {
  if (!property.units || typeof property.units !== 'object' || Object.keys(property.units).length === 0) {
    return {
      totalUnits: 0,
      occupiedTenants: 0,
      totalCapacity: 0,
      occupancyPercentage: 0,
    };
  }

  const units = Object.values(property.units);
  const totalUnits = units.length;
  const occupiedTenants = units.reduce((sum, unit) => sum + (unit.tenants?.length || 0), 0);
  const totalCapacity = units.reduce((sum, unit) => sum + (unit.capacity || 0), 0);
  const occupancyPercentage = totalCapacity > 0 ? Math.round((occupiedTenants / totalCapacity) * 100) : 0;

  return { totalUnits, occupiedTenants, totalCapacity, occupancyPercentage };
};
```

### Step 2.3: Update the Properties View JSX
Now, find the `renderPropertiesView` function and update the JSX that maps over the properties to use the new helper function.

**Find the `properties.map` loop inside `renderPropertiesView`:**
```jsx
// ... inside the properties.map((property) => { ... }) loop
```

**Replace the hardcoded unit and occupancy display with this:**
```jsx
// ... inside the properties.map loop ...

// Add this line at the top of the map function
const { totalUnits, occupiedTenants, totalCapacity, occupancyPercentage } = getOccupancyDetails(property);

// Then, find the div that displays the unit/occupancy info and replace it
// with the following block to show the new, dynamic data.

<div className="text-right">
  <div className="font-semibold text-gray-900">
    {occupiedTenants}/{totalCapacity} Occupied
  </div>
  <div className="text-sm text-gray-600">
    {totalUnits} {totalUnits === 1 ? 'Unit' : 'Units'}
  </div>
  <div className="text-xs text-gray-500 mt-1">
    {occupancyPercentage}% occupied
  </div>
</div>
```

---

## 3. Part 2: Enhance the Tenant Invitation Modal

This section ensures that landlords can only invite tenants to units that have available capacity.

**File to Modify:** `src/components/landlord/InviteTenantModal.tsx`

### Step 3.1: Update the Unit Selection Dropdown
Modify the JSX for the unit selection dropdown to disable full units and provide clear visual feedback.

**Find the `<select>` element for units:**
```jsx
<select id="unit" /* ... other attributes ... */>
  {/* ... options ... */}
</select>
```

**Replace the options mapping inside it with this:**
```jsx
{Object.entries(propertyUnits).map(([unitId, unitData]) => {
  const isFull = (unitData.tenants?.length || 0) >= unitData.capacity;
  const occupancyText = `${unitData.tenants?.length || 0} / ${unitData.capacity}`;
  
  return (
    <option key={unitId} value={unitId} disabled={isFull}>
      Unit {unitId} ({occupancyText}) {isFull ? "- Full" : ""}
    </option>
  );
})}
```

### Step 3.2: Add Final Validation in `handleSubmit`
Add a final check in the `handleSubmit` function to prevent submitting an invite for a full unit, just in case.

**Find the `handleSubmit` function and add this check at the beginning:**
```javascript
// At the top of the handleSubmit function
if (selectedUnit && propertyUnits[selectedUnit]) {
  const unit = propertyUnits[selectedUnit];
  if ((unit.tenants?.length || 0) >= unit.capacity) {
    toast.error(`Unit ${selectedUnit} is at full capacity and cannot accept new tenants.`);
    setLoading(false); // Ensure loading state is reset
    return; // Stop the submission
  }
}
```

---

## 4. Part 3: Solidify Backend Tenant Acceptance Logic

This ensures that when a tenant accepts an invite, their ID is correctly placed in the right unit.

**File to Modify:** `functions/src/acceptTenantInvite.ts`

**Ensure the transaction logic is correct:** Inside the `db.runTransaction` block, make sure the code that updates the property document looks exactly like this. This logic is idempotent and correctly targets the nested array.

```typescript
// This code should be inside the transaction, after the reads.
const propertyData = propertyDoc.data();
const unitId = invite.unitId; // Get unitId from the invite document

if (!unitId) {
  throw new Error(`Invite is missing a unitId.`);
}

const unit = propertyData.units?.[unitId];

if (!unit) {
  throw new Error(`Unit ${unitId} not found on property ${propertyId}.`);
}

if (unit.tenants && unit.tenants.length >= unit.capacity) {
  throw new Error(`Unit ${unitId} is already at full capacity.`);
}

// Use dot notation to update the nested tenants array
const updatePath = `units.${unitId}.tenants`;
transaction.update(propertyRef, {
  [updatePath]: admin.firestore.FieldValue.arrayUnion(uid),
  updatedAt: admin.firestore.FieldValue.serverTimestamp()
});
```
This confirms the backend logic is robust and matches the frontend's expectations.
