

# Property and Unit Management Overhaul (Revised)

## 1. Objective

Restructure the `properties` data model to include a detailed `units` system. This will enable tracking tenants per-unit, managing unit capacity, and allowing landlords to invite tenants to a specific unit. This guide includes a data migration script and outlines the necessary frontend changes.

**Warning:** This process includes a script to **permanently delete all existing properties** to ensure data consistency with the new model. Please back up your data if necessary.

## 2. New Property Data Model

The document structure in the `properties` collection will be updated as follows.

**New Structure (Example):**
```json
{
  "id": "prop123",
  "name": "Sunnyvale Apartments",
  "address": "123 Main St",
  "landlordId": "landlord456",
  "units": {
    "101": {
      "capacity": 2,
      "tenants": ["tenantProfileId_A"] 
    },
    "102": {
      "capacity": 1,
      "tenants": []
    }
  }
}
```

---

## 3. Part 1: Data Migration (Deleting Existing Properties)

This script will delete all documents from your `properties` collection.

**Instructions:**
1.  Save the following code as `delete_all_properties.js` in the root of your project.
2.  Ensure you have `firebase-admin` installed (`npm install firebase-admin` or `yarn add firebase-admin`).
3.  Set up your Firebase Admin credentials.
4.  Run the script from your terminal: `node delete_all_properties.js --confirm`

### `delete_all_properties.js`
```javascript
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();
const propertiesCollection = db.collection('properties');

const BATCH_SIZE = 100;

async function deleteAllProperties() {
  console.log("Fetching all properties to delete...");

  try {
    const snapshot = await propertiesCollection.get();
    
    if (snapshot.empty) {
      console.log("No properties found to delete.");
      return;
    }

    console.log(`Found ${snapshot.size} properties. Preparing to delete...`);

    const batches = [];
    let currentBatch = db.batch();
    let batchCount = 0;

    snapshot.docs.forEach((doc, index) => {
      currentBatch.delete(doc.ref);
      batchCount++;
      if (batchCount === BATCH_SIZE || index === snapshot.size - 1) {
        batches.push(currentBatch);
        currentBatch = db.batch();
        batchCount = 0;
      }
    });

    console.log(`Committing ${batches.length} batch(es) of deletions.`);
    await Promise.all(batches.map(batch => batch.commit()));

    console.log(`✅ Successfully deleted ${snapshot.size} properties.`);

  } catch (error) {
    console.error("❌ Error deleting properties:", error);
    process.exit(1);
  }
}

const confirmArg = process.argv[2];
if (confirmArg !== '--confirm') {
  console.log("\n🛑 This is a destructive operation.");
  console.log("To proceed, run the script with the --confirm flag:");
  console.log("node delete_all_properties.js --confirm\n");
  process.exit(0);
}

deleteAllProperties();
```

---

## 4. Part 2: Update the "Add Property" and "Invite Tenant" Modals

### File to Modify: `src/components/landlord/InviteTenantModal.tsx`

The following changes will fix the race condition and prevent duplicate UI elements by handling property creation *within* the invite modal.

**Changes Required:**

1.  **Import `AddPropertyModal`:** We will reuse the existing "Add Property" modal.
    ```typescript
    import AddPropertyModal from './AddPropertyModal';
    ```

2.  **Add State for "Add Property" Modal:**
    ```typescript
    const [showAddPropertyModal, setShowAddPropertyModal] = useState(false);
    ```

3.  **Add "Create New Property" Button:** In the JSX, add a button next to the property selection dropdown.
    ```jsx
    // Inside the form, near the property selection
    <div className="flex items-center gap-2">
      <select /* ... existing select attributes ... */>
        {/* ... existing options ... */}
      </select>
      <Button
        type="button"
        variant="secondary"
        onClick={() => setShowAddPropertyModal(true)}
      >
        + New
      </Button>
    </div>
    ```

4.  **Render the `AddPropertyModal`:** Place the modal component at the end of the `InviteTenantModal`'s JSX. We will pass a new handler function to it.
    ```jsx
    // At the end of the main Dialog.Panel
    <AddPropertyModal
      isOpen={showAddPropertyModal}
      onClose={() => setShowPropertyModal(false)}
      onPropertyAdded={handlePropertyCreated}
    />
    ```

5.  **Implement `handlePropertyCreated`:** This is the key function to fix the race condition. It will receive the newly created property, update the state, and automatically select it.
    ```typescript
    const handlePropertyCreated = (newProperty: Property) => {
      // This function is called AFTER the property is successfully created
      
      // 1. Update the local list of properties to prevent duplicates
      // The 'onInviteSuccess' callback should trigger a refresh from the parent component
      if (onInviteSuccess) {
        onInviteSuccess(); 
      }
      
      // 2. Automatically select the new property
      setSelectedPropertyId(newProperty.id);
      
      // 3. Close the "Add Property" modal
      setShowAddPropertyModal(false);
      
      toast.success(`Successfully created and selected "${newProperty.name}"!`);
    };
    ```

6.  **Ensure `onInviteSuccess` Refreshes State:** The `onInviteSuccess` prop, when called, should trigger a re-fetch of the properties in the parent component (`LandlordDashboard.tsx`). This is the correct way to avoid state inconsistencies and duplicate UI elements.

### File to Modify: `src/components/landlord/AddPropertyModal.tsx`

The `AddPropertyModal` needs to be updated to handle the new `units` data model.

**Changes Required:**

1.  **Add State for Units:**
    ```typescript
    const [units, setUnits] = useState([{ name: '', capacity: 1 }]);
    ```
2.  **Add UI for Unit Management:**
    ```jsx
    <div className="space-y-4">
      <label>Units</label>
      {units.map((unit, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Unit Name (e.g., 101)"
            value={unit.name}
            onChange={(e) => handleUnitChange(index, 'name', e.target.value)}
          />
          <input
            type="number"
            placeholder="Capacity"
            value={unit.capacity}
            min="1"
            onChange={(e) => handleUnitChange(index, 'capacity', parseInt(e.target.value, 10))}
          />
          <button type="button" onClick={() => removeUnit(index)}>Remove</button>
        </div>
      ))}
      <button type="button" onClick={addUnit}>+ Add Unit</button>
    </div>
    ```
3.  **Implement Handler Functions:**
    ```typescript
    const handleUnitChange = (index, field, value) => {
      const newUnits = [...units];
      newUnits[index][field] = value;
      setUnits(newUnits);
    };

    const addUnit = () => setUnits([...units, { name: '', capacity: 1 }]);
    const removeUnit = (index) => setUnits(units.filter((_, i) => i !== index));
    ```
4.  **Update Submission Logic:**
    ```typescript
    // Inside the handleSubmit function
    const unitsMap = units.reduce((acc, unit) => {
      if (unit.name) {
        acc[unit.name] = { capacity: unit.capacity || 1, tenants: [] };
      }
      return acc;
    }, {});

    const newPropertyData = {
      // ... other property data
      units: unitsMap,
    };
    // ... save to Firestore
    ```

---

## 5. Part 3: Update Tenant Acceptance Logic

When a tenant accepts an invite, your backend function must now add their `tenantProfileId` to the `tenants` array for the specific unit.

**File to Modify:** `functions/src/acceptTenantInvite.ts`

**Change Required:**
In the `db.runTransaction` block, replace the old property update logic with the following:

```typescript
// Use dot notation to update the nested tenants array
const updatePath = `units.${unitId}.tenants`;
transaction.update(propertyRef, {
  [updatePath]: admin.firestore.FieldValue.arrayUnion(uid),
  updatedAt: admin.firestore.FieldValue.serverTimestamp()
});
```
This ensures the update is atomic and targets the correct nested field.
