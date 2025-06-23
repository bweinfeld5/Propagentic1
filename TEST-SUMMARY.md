# Tenant Dashboard Backend Tests

This document summarizes the automated tests created for the Tenant Dashboard Backend services.

## Test Structure

```
/__tests__/
  |- fixtures.ts                  # Test fixtures for all tests
  |- jest.setup.ts                # Jest setup file for Firebase testing
  |- dashboard-backend/
      |- dataService.test.ts      # Tests for dataService methods
      |- inviteService.test.ts    # Tests for inviteService methods
      |- navigationService.test.ts # Tests for navigationService functions
      |- inviteCodeFunction.test.ts # Tests for the redeemInviteCode Cloud Function
/__mocks__/
  |- styleMock.js                 # Mock for CSS/style imports
  |- fileMock.js                  # Mock for file imports
```

## Test Coverage

The tests cover all the required functionality:

1. `dataService.getPropertyById()` tests:
   - Returns a property with full details when found (address, units, manager info)
   - Returns null when the property is not found
   - Throws an error when propertyId is not provided

2. `dataService.getPropertiesForTenant()` tests:
   - Returns properties associated with the tenant from user profile
   - Returns properties with tenant in units array
   - Returns empty array when tenant has no properties
   - Throws an error when tenantId is not provided

3. `inviteService.getPendingInvitesForTenant()` tests:
   - Returns enriched invites with property and manager details
   - Returns an empty array when no invites found
   - Returns an empty array when email is not provided

4. `inviteService.declineInvite()` tests:
   - Calls deleteInvite to remove the invite document
   - deleteInvite removes the invite document

5. `navigationService` tests:
   - navigateToMaintenanceForm navigates to correct route with propertyId in state
   - navigateToMaintenanceForm navigates to correct route without propertyId
   - navigateToMaintenanceForm navigates with additional state data
   - navigateToTenantDashboard navigates to the tenant dashboard route
   - navigateToMaintenanceDetail navigates to the correct maintenance detail route with ticket ID
   - navigateToPropertyDetail navigates to the correct property detail route

6. `redeemInviteCode` Cloud Function tests:
   - Successfully redeems a valid invite code
   - Throws an error for invalid invite code format
   - Throws an error when redeeming already used code
   - Throws an error when redeeming non-existent code
   - Validates an invite code without redeeming it

## Testing Strategy

The testing strategy involves:

1. **Unit Testing**: Each service method is tested in isolation using mocks for dependencies
2. **Mock Data**: Using realistic fixtures that match the Firestore data structure
3. **Edge Cases**: Testing error conditions and edge cases (missing IDs, already used codes, etc.)
4. **Firebase Emulation**: Configuring tests to run against the Firebase emulator
5. **Comprehensive Assertions**: Verifying both successful results and error handling

## How to Run Tests

```bash
# Install dependencies
yarn add -D @firebase/testing jest-environment-jsdom ts-jest

# Run all tests with coverage report
yarn test:unit --coverage
```

> Note: Tests currently require the Firebase emulator suite to be running.
> Start emulators with: `firebase emulators:start --only firestore,functions,auth`

## Conclusion

The test suite provides comprehensive coverage of the Tenant Dashboard backend services, ensuring that:

1. Property details are fully populated with formatted addresses and manager info
2. Tenant property associations work correctly across different data structures
3. Invitations are enriched with property and manager details
4. Invite code redemption handles all success and error cases
5. Navigation functions generate correct routes and state objects

These tests will help maintain the reliability of the backend services as the application evolves. 