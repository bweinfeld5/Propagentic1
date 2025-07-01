# Task 5: Add Tenants Field to Properties Collection

## 🎯 Goal
Add a new `tenants` array field to the properties collection and ensure it gets populated when tenants accept invites. This will provide a direct way to track which tenants are associated with each property.

## 📋 Current System Analysis

### Current Invite Acceptance Flow
1. **acceptTenantInvite** (HTTP Cloud Function) - Handles 8-character invite codes
2. **acceptPropertyInvite** (Callable Cloud Function) - Handles direct invite IDs
3. **acceptTenantInvitation** (Legacy function in userRelationships.js)

### Current Property-Tenant Tracking
- `landlordProfiles.acceptedTenants[]` - Array of tenant IDs 
- `landlordProfiles.acceptedTenantDetails[]` - Detailed tenant information
- `tenantProfiles.properties[]` - Properties associated with tenant
- `propertyTenantRelationships` collection - Separate relationship tracking
- **MISSING**: `properties.tenants[]` - Direct tenant list in property documents

## 🔧 Implementation Tasks

### Task 5.1: Database Schema Updates
**Priority: High | Estimated Time: 30 minutes**

#### 5.1.1 Update Properties Collection Schema
- **File:** Update existing property interfaces
- **Action:** Add `tenants: string[]` field to property schemas
- **Files to Update:**
  - `src/models/schema.ts` - Add tenants field to Property interface
  - `src/models/tenantSchema.ts` - Update Property interface
  - `src/models/Property.js` - Add tenants to PropertySchema
  - `docs/architecture/FIREBASE_COLLECTIONS_SCHEMA.md` - Document new field

```typescript
// Add to Property interface:
export interface Property {
  // ... existing fields
  tenants: string[]; // Array of tenant user IDs
  // ... rest of fields
}
```

#### 5.1.2 Update Property Converters
- **File:** `src/models/tenantConverters.ts`
- **Action:** Ensure tenants field is properly handled in fromFirestore/toFirestore methods

### Task 5.2: Cloud Functions Updates
**Priority: High | Estimated Time: 2 hours**

#### 5.2.1 Update acceptTenantInvite Function
- **File:** `functions/src/acceptTenantInvite.ts`
- **Location:** Around line 200 in the transaction
- **Action:** Add property tenants array update

```typescript
// Add this to the transaction after updating landlord profile:
transaction.update(propertyRef, {
  tenants: admin.firestore.FieldValue.arrayUnion(uid),
  updatedAt: admin.firestore.FieldValue.serverTimestamp()
});
```

#### 5.2.2 Update acceptPropertyInvite Function
- **File:** `functions/src/userRelationships.ts`
- **Location:** Around line 250 in the transaction
- **Action:** Add property tenants array update (if not already present)

```typescript
// Check if this line exists, if not add it:
transaction.update(propertyRef, {
  tenants: admin.firestore.FieldValue.arrayUnion(tenantUid),
  updatedAt: admin.firestore.FieldValue.serverTimestamp()
});
```

#### 5.2.3 Update Legacy acceptTenantInvitation Function
- **File:** `functions/userRelationships.js`
- **Location:** Around line 200
- **Action:** Add property tenants array update

```javascript
// Add to the function after updating tenantProperties:
await admin.firestore()
  .collection("properties")
  .doc(invitation.propertyId)
  .update({
    tenants: admin.firestore.FieldValue.arrayUnion(tenantId),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
```

#### 5.2.4 Update removeTenantFromLandlord Function
- **File:** `functions/src/removeTenantFromLandlord.ts`
- **Location:** Around line 150 in the transaction
- **Action:** Remove tenant from property tenants array

```typescript
// Add this to the transaction:
transaction.update(propertyDoc.ref, {
  tenants: admin.firestore.FieldValue.arrayRemove(tenantId),
  updatedAt: admin.firestore.FieldValue.serverTimestamp()
});
```

### Task 5.3: Frontend Service Updates
**Priority: Medium | Estimated Time: 1 hour**

#### 5.3.1 Update Property Service
- **File:** `src/services/firestore/propertyService.ts`
- **Action:** Update addTenantToProperty and removeTenantFromProperty functions

```typescript
// Update existing functions to use 'tenants' instead of 'tenantIds':
export async function addTenantToProperty(propertyId: string, tenantId: string): Promise<void> {
  const propertyRef = doc(db, 'properties', propertyId);
  const propertySnapshot = await getDoc(propertyRef);
  
  if (propertySnapshot.exists()) {
    const tenants = propertySnapshot.data().tenants || [];
    
    if (!tenants.includes(tenantId)) {
      await updateDoc(propertyRef, {
        tenants: [...tenants, tenantId],
        updatedAt: serverTimestamp()
      });
    }
  }
}
```

#### 5.3.2 Update Data Service
- **File:** `src/services/dataService.js`
- **Action:** Update getTenantsForProperty to use new tenants field

```javascript
// Update around line 650:
async getTenantsForProperty(propertyId) {
  try {
    const propertyRef = doc(db, 'properties', propertyId);
    const propertyDoc = await getDoc(propertyRef);
    
    if (!propertyDoc.exists()) {
      return [];
    }
    
    const property = propertyDoc.data();
    const tenantIds = property.tenants || [];
    
    // Fetch tenant profiles
    const tenants = [];
    for (const tenantId of tenantIds) {
      const tenantDoc = await getDoc(doc(db, 'users', tenantId));
      if (tenantDoc.exists()) {
        tenants.push({
          id: tenantDoc.id,
          ...tenantDoc.data()
        });
      }
    }
    
    return tenants;
  } catch (error) {
    console.error('Error fetching tenants for property:', error);
    throw error;
  }
}
```

### Task 5.4: Firestore Security Rules Update
**Priority: High | Estimated Time: 30 minutes**

#### 5.4.1 Update Property Security Rules
- **File:** `firestore.rules`
- **Action:** Add rules for the new tenants field

```javascript
// Add to properties rules (around line 200):
match /properties/{propertyId} {
  // Existing rules...
  
  // Only landlords and Cloud Functions can modify tenants array
  allow update: if isOwner(resource.data.landlordId) && 
                   !request.resource.data.diff(resource.data).affectedKeys().hasAny(['tenants']);
  
  // Cloud Functions (admin) can modify tenants array
  allow update: if isAdmin();
}
```

### Task 5.5: Component Updates
**Priority: Medium | Estimated Time: 1 hour**

#### 5.5.1 Update AcceptedTenantsSection Component
- **File:** `src/components/landlord/AcceptedTenantsSection.jsx`
- **Action:** Update to optionally use properties.tenants field for cross-reference

```javascript
// Add validation to ensure consistency between landlordProfiles and properties:
const validateTenantConsistency = async (properties) => {
  for (const property of properties) {
    const propertyRef = doc(db, 'properties', property.id);
    const propertyDoc = await getDoc(propertyRef);
    
    if (propertyDoc.exists()) {
      const propertyTenants = propertyDoc.data().tenants || [];
      // Log any inconsistencies for debugging
      if (propertyTenants.length !== property.tenants?.length) {
        console.warn(`Tenant count mismatch for property ${property.id}`);
      }
    }
  }
};
```

#### 5.5.2 Update Property Dashboard Components
- **Files:** 
  - `src/components/landlord/PropertyDetails.jsx`
  - `src/components/landlord/PropertyCard.jsx`
  - `src/components/landlord/PropertySnapshot.jsx`
- **Action:** Update tenant count displays to use properties.tenants.length

### Task 5.6: Data Migration
**Priority: High | Estimated Time: 2 hours**

#### 5.6.1 Create Migration Script
- **File:** `scripts/migrate-properties-tenants-field.js`
- **Action:** Migrate existing data to populate tenants field

```javascript
#!/usr/bin/env node

/**
 * Migration Script: Add tenants field to properties collection
 * 
 * This script populates the new tenants[] field in properties collection
 * by analyzing existing landlordProfiles.acceptedTenantDetails data.
 */

const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

async function migratePropertiesTenantsField() {
  try {
    console.log('🔄 Starting properties tenants field migration...');
    
    // Get all landlord profiles with accepted tenants
    const landlordProfilesSnapshot = await db.collection('landlordProfiles').get();
    
    let processedProperties = 0;
    let totalUpdates = 0;
    
    for (const landlordDoc of landlordProfilesSnapshot.docs) {
      const landlordData = landlordDoc.data();
      const acceptedTenantDetails = landlordData.acceptedTenantDetails || [];
      
      if (acceptedTenantDetails.length === 0) continue;
      
      // Group tenants by property
      const propertyTenants = {};
      
      for (const tenantDetail of acceptedTenantDetails) {
        const propertyId = tenantDetail.propertyId;
        const tenantId = tenantDetail.tenantId;
        
        if (!propertyTenants[propertyId]) {
          propertyTenants[propertyId] = [];
        }
        
        if (!propertyTenants[propertyId].includes(tenantId)) {
          propertyTenants[propertyId].push(tenantId);
        }
      }
      
      // Update each property with its tenants
      for (const [propertyId, tenantIds] of Object.entries(propertyTenants)) {
        try {
          const propertyRef = db.collection('properties').doc(propertyId);
          const propertyDoc = await propertyRef.get();
          
          if (propertyDoc.exists()) {
            await propertyRef.update({
              tenants: tenantIds,
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            
            console.log(`✅ Updated property ${propertyId} with ${tenantIds.length} tenants`);
            totalUpdates++;
          }
          
          processedProperties++;
        } catch (error) {
          console.error(`❌ Error updating property ${propertyId}:`, error.message);
        }
      }
    }
    
    console.log(`\n🎉 Migration completed!`);
    console.log(`📊 Properties processed: ${processedProperties}`);
    console.log(`📊 Properties updated: ${totalUpdates}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migratePropertiesTenantsField();
```

#### 5.6.2 Create Validation Script
- **File:** `scripts/validate-properties-tenants-consistency.js`
- **Action:** Validate data consistency after migration

```javascript
#!/usr/bin/env node

/**
 * Validation Script: Check properties tenants field consistency
 * 
 * Validates that the tenants field in properties matches the 
 * acceptedTenantDetails in landlordProfiles.
 */

async function validatePropertiesTenantsConsistency() {
  // Implementation details for validation
  console.log('🔍 Validating properties tenants field consistency...');
  
  // Compare properties.tenants with landlordProfiles.acceptedTenantDetails
  // Report any inconsistencies
  // Suggest fixes for mismatches
}
```

### Task 5.7: Testing & Validation
**Priority: High | Estimated Time: 1.5 hours**

#### 5.7.1 Create Integration Tests
- **File:** `tests/properties-tenants-integration.test.js`
- **Action:** Test the complete invite acceptance flow

```javascript
describe('Properties Tenants Field Integration', () => {
  test('should add tenant to property when invite is accepted', async () => {
    // Test acceptTenantInvite adds to properties.tenants
  });
  
  test('should remove tenant from property when removed', async () => {
    // Test removeTenantFromLandlord removes from properties.tenants
  });
  
  test('should maintain consistency between collections', async () => {
    // Test data consistency across collections
  });
});
```

#### 5.7.2 Manual Testing Checklist
- **File:** `PROPERTIES_TENANTS_TESTING_GUIDE.md`
- **Action:** Create comprehensive testing guide

### Task 5.8: Documentation Updates
**Priority: Medium | Estimated Time: 30 minutes**

#### 5.8.1 Update System Documentation
- **Files:**
  - `docs/architecture/FIREBASE_COLLECTIONS_SCHEMA.md` - Add tenants field documentation
- `docs/architecture/INVITE_FLOW_ARCHITECTURE.md` - Update invite flow diagrams
  - `README.md` - Update data structure overview

#### 5.8.2 Update Code Comments
- **Action:** Add comprehensive comments explaining the tenants field purpose and usage

## 🔄 Implementation Order

### Phase 1: Core Infrastructure (Day 1)
1. Task 5.1: Database Schema Updates
2. Task 5.4: Security Rules Update
3. Task 5.6.1: Create Migration Script

### Phase 2: Backend Implementation (Day 1-2)
4. Task 5.2: Cloud Functions Updates
5. Task 5.6.2: Run Migration & Validation

### Phase 3: Frontend Integration (Day 2)
6. Task 5.3: Frontend Service Updates  
7. Task 5.5: Component Updates

### Phase 4: Testing & Documentation (Day 2-3)
8. Task 5.7: Testing & Validation
9. Task 5.8: Documentation Updates

## ⚠️ Important Considerations

### Data Consistency
- The `properties.tenants[]` field should be considered the **source of truth** for active tenants
- Existing `landlordProfiles.acceptedTenants[]` should remain for landlord-specific tracking
- `tenantProfiles.properties[]` should remain for tenant-specific tracking

### Backward Compatibility
- All existing invite acceptance flows must continue to work
- Migration script must handle edge cases (orphaned data, missing properties, etc.)
- Gradual rollout with validation at each step

### Security
- Only Cloud Functions should modify the `properties.tenants[]` field
- Frontend components should display but not directly modify this field
- Security rules must prevent client-side tampering

### Performance
- Consider indexing on `properties.tenants` if querying by tenant ID becomes common
- Monitor Cloud Function execution time after adding property updates
- Batch updates where possible to reduce Firestore write costs

## 🎯 Success Criteria

1. ✅ **Properties Collection Schema**: All properties have a `tenants` array field
2. ✅ **Invite Acceptance**: When tenant accepts invite, they are added to `properties.tenants[]`
3. ✅ **Tenant Removal**: When tenant is removed, they are removed from `properties.tenants[]`
4. ✅ **Data Consistency**: Properties tenants field matches landlord/tenant profile data
5. ✅ **Security**: Only Cloud Functions can modify properties tenants field
6. ✅ **Testing**: All invite flows work correctly with new field
7. ✅ **Migration**: Existing data successfully migrated to new structure
8. ✅ **Documentation**: Complete documentation of new field and its usage

## 📊 Expected Outcomes

After implementation:
- **Direct Property Queries**: Easy to find all tenants for a property with single read
- **Improved Performance**: No need to cross-reference multiple collections for basic tenant listing
- **Data Integrity**: Single source of truth for property-tenant relationships
- **Simplified UI Logic**: Components can directly display `property.tenants.length`
- **Better Analytics**: Easier to calculate occupancy rates and tenant statistics

This implementation will significantly improve the efficiency of property-tenant relationship tracking while maintaining full backward compatibility with existing systems. 