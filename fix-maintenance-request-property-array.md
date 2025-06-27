
# 🛠️ Fix: Update Property ID Check in createMaintenanceRequest

## 🧩 Problem

Tenants are currently unable to create maintenance requests. The following error is shown:

> **"User does not have an associated property"**

This happens because the `createMaintenanceRequest` function checks for a `propertyId` directly on the `tenantProfile`, but the correct property ID is actually inside an array called `properties`.

---

## 🛠️ Required Fix

Update the `createMaintenanceRequest` logic so it properly checks inside the `properties` array of the user's tenant profile.

---

### ❌ Incorrect (current code):
```ts
const propertyId = tenantProfile.propertyId;
```

---

### ✅ Correct (fix this logic):
```ts
// Make sure the properties array exists and is not empty
if (!tenantProfile.properties || tenantProfile.properties.length === 0) {
  throw new Error("User does not have an associated property");
}

// Use the first property or implement a method to select the appropriate one
const propertyId = tenantProfile.properties[0];
```

---

## ✅ Where to Apply This

Apply this logic inside the `createMaintenanceRequest` function in `AIMaintenanceChat.tsx` or wherever the tenantProfile is accessed.

---

## 📌 Summary

Ensure you:
- Validate that `tenantProfile.properties` exists and has at least one entry.
- Extract the property ID from the array instead of assuming a top-level `propertyId`.

This fix will allow tenants to successfully initiate maintenance requests as long as they are linked to at least one property.
