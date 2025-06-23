# TypeScript Utilities

This directory contains utility functions to improve type safety and reduce boilerplate in the codebase.

## TypeUtils.ts

`TypeUtils.ts` provides utility functions for safer type assertions and Firestore data conversion. These utilities help ensure type safety while working with Firebase data.

### Key Features

- **Safe type casting**: Properly cast types through an `unknown` intermediate step
- **Firestore document conversion**: Safely convert Firestore data to typed models
- **Type guards**: Check for existence and array contents with proper TypeScript narrowing
- **Typed converters**: Create type-safe Firestore data converters

### Usage Examples

#### Safe Type Casting

```typescript
import { safeCast } from '../utils/TypeUtils';

// Instead of this (unsafe):
const tenant = someData as Tenant;

// Use this (safer):
const tenant = safeCast<Tenant>(someData);
```

#### Firestore Document Conversion

```typescript
import { convertSnapshot } from '../utils/TypeUtils';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

async function getTenant(tenantId: string) {
  const docRef = doc(db, 'tenants', tenantId);
  const snapshot = await getDoc(docRef);
  
  // Safely convert to Tenant type or null if it doesn't exist
  return convertSnapshot<Tenant>(snapshot, 'tenantId');
}
```

#### Type Guards

```typescript
import { exists, hasItems } from '../utils/TypeUtils';

function processProperty(property: Property | null) {
  // Type guard narrows property to non-null
  if (exists(property)) {
    console.log(property.propertyName); // TypeScript knows property is not null
    
    // Check if tenantIds array exists and has items
    if (hasItems(property.tenantIds)) {
      property.tenantIds.forEach(id => console.log(id)); // Safe access
    }
  }
}
```

#### Typed Converters

```typescript
import { createTypedConverter } from '../utils/TypeUtils';
import { collection, doc } from 'firebase/firestore';
import { db } from '../firebase/config';

// Create a typed converter
const tenantConverter = createTypedConverter<Tenant>('tenantId');

// Use with Firestore operations
const tenantsRef = collection(db, 'tenants').withConverter(tenantConverter);
const tenantRef = doc(db, 'tenants', 'tenant-123').withConverter(tenantConverter);
```

### Best Practices

1. Always use `safeCast<T>()` instead of `as T` for type assertions
2. Use the converter utilities for all Firestore data access
3. Use type guards to safely narrow types
4. Follow the example in `src/services/firestore/propertyService.example.ts` for service implementations

### Migration

We're gradually migrating existing code to use these utilities. The `createConverter` function in `src/models/converters.ts` is now marked as deprecated in favor of `createTypedConverter`. 