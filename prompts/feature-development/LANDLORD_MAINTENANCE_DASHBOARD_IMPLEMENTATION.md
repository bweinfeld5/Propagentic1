
# Landlord Maintenance Dashboard Implementation

## Objective

The goal is to implement a "Maintenance" tab within the landlord dashboard. This tab will display a comprehensive list of maintenance requests from all properties associated with the landlord. Each request will be presented as a UI element with relevant details, allowing landlords to efficiently track and manage maintenance tasks.

## File To Be Modified

-   `src/pages/landlord/LandlordDashboard.tsx`: This is the primary file for the landlord dashboard, where the new maintenance tab and its content will be added.

## Data Fetching and Logic

The following steps outline the data retrieval process to be implemented in `src/pages/landlord/LandlordDashboard.tsx`:

1.  **Get User ID**: Retrieve the `userId` of the currently logged-in landlord from the authentication context.

2.  **Fetch Landlord Profile**: Use the `userId` to query the `landlordProfiles` collection in Firestore and retrieve the landlord's profile document.

3.  **Get Property IDs**: From the landlord's profile document, extract the `properties` array, which contains the IDs of all properties managed by the landlord.

4.  **Fetch Property Details**: For each `propertyId` in the `properties` array, query the `properties` collection to get the details of each property.

5.  **Get Maintenance Request IDs**: Within each property document, access the `maintenanceRequests` array. This array holds the IDs of all maintenance requests associated with that property.

6.  **Fetch Maintenance Requests**: For each `maintenanceRequestId` obtained in the previous step, query the `maintenanceRequests` collection to retrieve the full details of each maintenance request.

7.  **Populate UI**: Use the fetched maintenance request data to populate the UI elements in the "Maintenance" tab.

## UI Implementation

The "Maintenance" tab should display a list of maintenance requests. Each request should be a card or a list item with the following information:

-   **Property Name/Address**: The name or address of the property where the maintenance is required.
-   **Creator/Tenant**: The name or identifier of the tenant who created the request.
-   **Status**: The current status of the request (e.g., "Pending," "In Progress," "Completed").
-   **Date Submitted**: The date when the request was submitted.
-   **Description**: A brief description of the maintenance issue.

## Example Code Structure (for `LandlordDashboard.tsx`)

```typescript
// src/pages/landlord/LandlordDashboard.tsx

// ... other imports

// Add a new state to hold the maintenance requests
const [maintenanceRequests, setMaintenanceRequests] = useState([]);

// Function to fetch maintenance requests
const fetchMaintenanceRequests = async (userId) => {
  // 1. Fetch landlord profile
  const landlordProfile = await getLandlordProfile(userId);
  const propertyIds = landlordProfile.properties;

  let allMaintenanceRequests = [];

  // 2. Loop through property IDs
  for (const propertyId of propertyIds) {
    // 3. Fetch property details
    const property = await getProperty(propertyId);
    const maintenanceRequestIds = property.maintenanceRequests;

    // 4. Loop through maintenance request IDs
    for (const requestId of maintenanceRequestIds) {
      // 5. Fetch maintenance request details
      const request = await getMaintenanceRequest(requestId);
      allMaintenanceRequests.push({
        ...request,
        propertyName: property.name // Add property name for display
      });
    }
  }

  setMaintenanceRequests(allMaintenanceRequests);
};

// Call this function in a useEffect hook
useEffect(() => {
  if (currentUser) {
    fetchMaintenanceRequests(currentUser.uid);
  }
}, [currentUser]);

// ... inside the render function

// Add a new case for the 'maintenance' view
case 'maintenance':
  return (
    <div>
      {/* UI for displaying maintenance requests */}
      {maintenanceRequests.map(request => (
        <div key={request.id}>
          <h3>{request.propertyName}</h3>
          <p>Created by: {request.creator}</p>
          <p>Status: {request.status}</p>
          <p>{request.description}</p>
        </div>
      ))}
    </div>
  );
```
