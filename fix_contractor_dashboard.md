# Fix Contractor Dashboard: Job Assignments Tab

## Goal
Revamp the **Job Assignments** tab in the contractor dashboard to show relevant maintenance requests from Firestore for the logged-in contractor.

---

## 🔍 Current Problem
- The `Available Jobs` tab shows some maintenance requests, but there's **no tab showing jobs specifically assigned to the logged-in contractor**.
- Currently, the contractor’s assigned jobs are **not filtered** using their `contractorId`.

---

## ✅ What Needs to Be Done

### 1. Contractor Identity Lookup
- Use the currently signed-in user's UID to **fetch the contractor's `contractorId`** from their user document in the `users` collection.

### 2. Query Assigned Jobs
- In the new **"My Assignments"** tab, query the `maintenanceRequests` collection where:
  ```js
  contractorId == [logged-in contractor’s contractorId]
  ```

### 3. Handle `status` Field Logic
- When `status == "pending"`:
  - Show **Accept** and **Reject** buttons.
  - On Accept:
    - Change status to `"in-progress"`.
  - On Reject:
    - Set contractorId to `""` or remove it
    - Set status to `"available"` or something indicating it's unassigned.

### 4. UI Update
- Create a new tab in the contractor dashboard UI called **"My Assignments"**.
- Display all maintenanceRequests assigned to this contractor with appropriate status indicators and controls.

---

## 📁 Firestore Document References

### From `users` collection:
```js
contractorId: "6byneWMUGcqhNdDUqsS5"
```

### From `maintenanceRequests` collection:
Relevant fields include:
```js
contractorId
status
category
description
timestamp
```

---

## ✅ Summary

- [x] Add a new tab called **"My Assignments"**
- [x] Pull contractorId from user's document (uses currentUser.uid as contractorId)
- [x] Query `maintenanceRequests` where contractorId matches
- [x] Show assigned requests with Accept/Reject (status = 'assigned')
- [x] Update Firestore status on action
