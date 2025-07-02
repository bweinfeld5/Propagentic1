# 🛠️ Add Maintenance Request Association to Properties in Firestore

## 🎯 Goal
Enable maintenance requests to be linked to the relevant property document in Firestore. When a tenant creates a maintenance request, it should update both the `maintenanceRequests` collection and the corresponding `property` document to store a reference to the request.

---

## ✅ Requirements

### 🔧 Firestore Structure

- Maintenance requests are stored in the `maintenanceRequests` collection.
- Each property in the `properties` collection should have a `maintenanceRequests` array that contains the document IDs of related requests.

---

## 🧠 Logic

### 🔹 When a Maintenance Request is Created

1. **Create the request in Firestore:**
   ```ts
   const requestRef = await addDoc(collection(db, 'maintenanceRequests'), {
     ...requestData,
     tenantId: user.uid,
     propertyId: currentPropertyId,
     createdAt: serverTimestamp(),
     status: 'open',
   });
   const requestId = requestRef.id;
   ```

2. **Link it to the Property Document:**

   First, fetch the property document:
   ```ts
   const propertyRef = doc(db, 'properties', currentPropertyId);
   const propertySnap = await getDoc(propertyRef);
   ```

   Then, check for an existing `maintenanceRequests` array and update:
   ```ts
   if (propertySnap.exists()) {
     await updateDoc(propertyRef, {
       maintenanceRequests: arrayUnion(requestId)
     });
   }
   ```

   🔒 Note: `arrayUnion()` is from Firestore and automatically handles adding to an existing array or creating it if it doesn’t exist.

---

## 🔍 Loading Requests Associated with a Property

1. **Get the property document and extract its `maintenanceRequests`:**
   ```ts
   const propertySnap = await getDoc(doc(db, 'properties', propertyId));
   const requestIds = propertySnap.data().maintenanceRequests || [];
   ```

2. **Fetch each request using `Promise.all`:**
   ```ts
   const requests = await Promise.all(
     requestIds.map(id => getDoc(doc(db, 'maintenanceRequests', id)))
   );
   const requestData = requests.map(docSnap => docSnap.data());
   ```

---

## 🚦 Edge Cases

- If `maintenanceRequests` array doesn’t exist, create it with `arrayUnion`.
- If the same request is added again, Firestore `arrayUnion` ensures it is not duplicated.
- Add try/catch around Firestore updates to handle permission or network issues.

---

## 🖼️ UI Considerations

- Display the list of maintenance requests under the property’s detail view.
- Include a loading spinner or message while fetching requests.
- Show a message if no requests are found: `"No maintenance requests submitted yet."`

---

## 🧪 Security Rules (Additions)

```js
match /maintenanceRequests/{requestId} {
  allow create: if request.auth != null;
  allow read: if request.auth != null;
}

match /properties/{propertyId} {
  allow update: if request.auth != null &&
                resource.data.tenantIds.hasAny([request.auth.uid]); // customize to your tenant logic
}
```

