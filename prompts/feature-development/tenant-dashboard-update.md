# 🛠️ Update Tenant Dashboard to Load Property Data from Firestore

## 🎯 Goal
Replace the placeholder property data in the tenant dashboard (`Your Property` section) with real-time data pulled from Firestore using the authenticated user's `tenantProfile`.

## ✅ Requirements

### 🔐 Authentication
- Ensure tenant is authenticated via Firebase Auth.
- On load, fetch their corresponding `tenantProfile` from Firestore using their `uid`.

### 📄 Firestore Structure
- Each `tenantProfile` has a `properties` array containing the `propertyId` of each property the tenant is linked to.
- Each `property` document contains:
  - `name`
  - `address` (including street, unit, city, state, and zip)
  - `landlord` object with:
    - `name`
    - `email`
    - `phone`

### 🧠 Logic
1. After authentication, use the `uid` to query:
   ```ts
   const profileRef = doc(db, 'tenantProfiles', uid);
   const profileSnap = await getDoc(profileRef);
   ```
2. Extract the `properties` array.
3. For each `propertyId`, query Firestore to retrieve full property info:
   ```ts
   const propRef = doc(db, 'properties', propertyId);
   const propSnap = await getDoc(propRef);
   ```
4. Display all linked properties dynamically in the "Your Property" section.

### 🖼️ UI Update
- Remove the placeholder `"Sunset Apartments"` content.
- Loop through the tenant’s properties and display:
  ```tsx
  <div className="property-card">
    <h3>{property.name}</h3>
    <p>{property.address.street}, Unit {property.address.unit}</p>
    <p>{property.address.city}, {property.address.state} {property.address.zip}</p>
    <div className="landlord-info">
      <p><strong>Landlord:</strong> {landlord.name}</p>
      <p>{landlord.email}</p>
      <p>{landlord.phone}</p>
    </div>
  </div>
  ```

## 🚦 Edge Cases
- If `properties` array is empty, show a message: `"You are not currently assigned to any properties."`
- If property lookup fails, log a warning and continue rendering the rest.

---

## 🔄 Notes for Cursor
- You may use `Promise.all` to fetch multiple property documents efficiently.
- Ensure all Firestore access uses `async/await` and error-handling is in place.
- Add a loading state to the dashboard while data is being fetched.
