# 🚨 Handling Firestore 'Missing or Insufficient Permissions' Error

When fetching property data in the tenant dashboard, you may encounter the following error:

```
FirebaseError: Missing or insufficient permissions
```

This means the authenticated tenant user does not have the required Firestore read permissions for the `properties/{propertyId}` document.

---

## ✅ Step 1: Update Firestore Security Rules

Update your Firestore security rules to allow tenants to read only the properties they are associated with in their tenant profile.

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /tenantProfiles/{tenantId} {
      allow read: if request.auth != null && request.auth.uid == tenantId;
    }

    match /properties/{propertyId} {
      allow read: if isTenantOfProperty(propertyId);
    }

    function isTenantOfProperty(propertyId) {
      return exists(/databases/$(database)/documents/tenantProfiles/$(request.auth.uid)) &&
             propertyId in get(/databases/$(database)/documents/tenantProfiles/$(request.auth.uid)).data.properties;
    }
  }
}
```

---

## ✅ Step 2: Add Error Handling in Code

Ensure your property-fetching logic catches permission errors:

```ts
try {
  const propRef = doc(db, 'properties', propertyId);
  const propSnap = await getDoc(propRef);

  if (!propSnap.exists()) {
    console.warn(`Property ${propertyId} not found`);
    return null;
  }

  return propSnap.data();
} catch (error) {
  console.error(`Failed to fetch property ${propertyId}:`, error.message);

  if (error.code === 'permission-denied') {
    return { error: 'You do not have permission to view this property.' };
  }

  return { error: 'An unexpected error occurred.' };
}
```

---

## ✅ Step 3: Display User-Friendly UI Message

Update the dashboard UI to handle errors gracefully:

```tsx
{propertyData.error ? (
  <div className="error-card">
    <p>{propertyData.error}</p>
  </div>
) : (
  <div className="property-card">
    {/* Render property details */}
  </div>
)}
```

---

## 🧪 Edge Cases
- If `properties` array is empty, show a message like:
  ```
  You are not currently assigned to any properties.
  ```

- Log permission errors for debugging, but don’t crash the dashboard.

