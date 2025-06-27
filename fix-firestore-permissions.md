
# 🔐 Fix Firebase Firestore Rules: Missing or Insufficient Permissions (403)

## 🧩 Problem

Tenants are still unable to create `maintenanceRequest` documents. The Firebase error is:

> **FirebaseError: Missing or insufficient permissions**  
> Code: **403 (permission-denied)**  
> When trying to write to: `maintenanceRequests` and update `properties`

This means the Firestore security rules do not currently allow the authenticated user to perform `create` or `update` operations on these collections/documents.

---

## 📂 Firestore Collections Affected

- `maintenanceRequests` (creating a new document)
- `properties` (updating a property's `maintenanceRequests` array)

---

## ✅ Cursor Task: Update Firebase Security Rules

Please update the Firestore security rules to allow authenticated users (e.g., tenants) to:

### 1. `CREATE` documents in `maintenanceRequests`:
```js
match /maintenanceRequests/{docId} {
  allow create: if request.auth != null;
}
```

### 2. `UPDATE` their associated `property` document:
```js
match /properties/{propertyId} {
  allow update: if request.auth != null &&
                 propertyId in request.auth.token.properties; // or your user->property logic
}
```

---

## ⚠️ Notes

- If you're storing property access control differently, adjust the rule accordingly (e.g., if user ID is inside the property).
- You may need to include rules that allow reading these collections as well for later features.
- After editing the rules in Firebase Console, **publish the changes** for them to take effect.

---

## 🔁 Retest Instructions

Once the rules are updated:
1. Refresh the app.
2. Retry creating a `maintenanceRequest`.
3. Confirm no more `403` errors in the network console.

