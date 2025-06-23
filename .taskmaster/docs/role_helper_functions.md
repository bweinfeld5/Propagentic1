# Role Helper Functions Documentation

## Overview

This document provides a comprehensive guide to the role-based helper functions used in PropAgentic's Firestore security rules. These functions form the foundation of our security model, allowing for fine-grained access control based on user roles and resource ownership.

## Importance of Role Helper Functions

Role helper functions provide several key benefits to our security architecture:

1. **Code Reusability**: By abstracting common role checks into helper functions, we avoid duplicating logic across multiple rules.
2. **Semantic Clarity**: Functions like `isLandlord()` and `isAdmin()` make rule declarations more readable and self-documenting.
3. **Maintainability**: Changes to role verification logic only need to be made in one place.
4. **Security in Depth**: Functions can be composed to create multi-layered security checks (e.g., `isTenant() && isPropertyTenant(propertyId)`).
5. **Consistency**: Helper functions ensure that role checks are performed consistently across all rules.

## Core Helper Functions

### Authentication Helpers

#### `isSignedIn()`

The most fundamental security check, ensuring that the request comes from an authenticated user.

```javascript
function isSignedIn() {
  return request.auth != null;
}
```

- **Usage**: Used as the baseline check for all secure operations
- **Security Importance**: Prevents anonymous access to protected resources

#### `isOwner(userId)`

Verifies that the authenticated user is the owner of a specific resource identified by userId.

```javascript
function isOwner(userId) {
  return isSignedIn() && request.auth.uid == userId;
}
```

- **Usage**: Used for personal resource access control (user profiles, personal data)
- **Security Importance**: Prevents users from accessing or modifying other users' data

### Role-Based Helpers

#### `getUserData()`

Retrieves the current user's document from Firestore, enabling role-based checks.

```javascript
function getUserData() {
  return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
}
```

- **Usage**: Used by other role helper functions to access user attributes
- **Performance Note**: Causes a document read operation when called

#### `isUserRole(role)`

Checks if the current user has a specific role, looking at both the `userType` and `role` fields for compatibility.

```javascript
function isUserRole(role) {
  let userData = getUserData();
  return isSignedIn() && (userData.userType == role || userData.role == role);
}
```

- **Usage**: Foundation for specific role helper functions
- **Security Importance**: Provides the core role verification mechanism

#### `isLandlord()`

Determines if the current user has a landlord role.

```javascript
function isLandlord() { 
  return isUserRole('landlord');
}
```

- **Usage**: Used for landlord-specific operations (property management, tenant invitations)
- **Security Importance**: Restricts property management operations to authorized users

#### `isTenant()`

Determines if the current user has a tenant role.

```javascript
function isTenant() { 
  return isUserRole('tenant');
}
```

- **Usage**: Used for tenant-specific operations (viewing rental properties, submitting maintenance requests)
- **Security Importance**: Ensures only tenants can perform tenant-specific actions

#### `isAdmin()`

Determines if the current user has administrator privileges.

```javascript
function isAdmin() {
  return isUserRole('admin');
}
```

- **Usage**: Used for administrative operations (user management, system configuration)
- **Security Importance**: Restricts powerful system-wide operations to administrators only

### Resource-Specific Role Helpers

#### `isPropertyOwner(propertyId)`

Verifies if the current user is the owner of a specific property.

```javascript
function isPropertyOwner(propertyId) {
  let property = get(/databases/$(database)/documents/properties/$(propertyId)).data;
  return isSignedIn() && request.auth.uid == property.landlordId;
}
```

- **Usage**: Used for property management operations (updates, deletion)
- **Security Importance**: Ensures only the property owner can perform sensitive property operations
- **Performance Note**: Performs a document read operation

#### `isPropertyManager(propertyId)`

Determines if the current user is a manager for a specific property.

```javascript
function isPropertyManager(propertyId) {
  let property = get(/databases/$(database)/documents/properties/$(propertyId)).data;
  return isSignedIn() && property.keys().hasAny(['managers']) && request.auth.uid in property.managers;
}
```

- **Usage**: Used for property management operations with lower privileges than owners
- **Security Importance**: Allows delegation of property management tasks without full ownership rights
- **Performance Note**: Performs a document read operation

#### `isPropertyTenant(propertyId)`

Verifies if the current tenant user is associated with a specific property.

```javascript
function isPropertyTenant(propertyId) {
  let userData = getUserData();
  return isTenant() && 
         (userData.propertyId == propertyId || 
          (userData.properties != null && propertyId in userData.properties));
}
```

- **Usage**: Used for tenant-specific property operations (viewing details, creating tickets)
- **Security Importance**: Ensures tenants can only access properties they are legitimately associated with
- **Performance Note**: Performs a document read operation (through getUserData)

## Best Practices for Using Role Helpers

1. **Combine Checks for Defense in Depth**: Use multiple checks when appropriate (e.g., `isLandlord() && isPropertyOwner(propertyId)`)
2. **Consider Performance Impact**: Each helper that reads documents counts against Firestore quotas
3. **Handle Edge Cases**: Be aware of null checks and undefined fields
4. **Test Thoroughly**: Verify that role helpers work correctly in all scenarios
5. **Keep Documentation Updated**: When modifying helpers, update comments to reflect changes

## Security Considerations

### Potential Vulnerabilities

1. **Stale Role Data**: If a user's role changes, existing sessions will continue to have the old role permissions until authentication state is refreshed
2. **Document Read Costs**: Excessive use of role helpers that read documents can increase billing costs
3. **Rule Evaluation Limits**: Complex chains of role helpers can approach the Firestore rules evaluation limits

### Mitigations

1. **Token Claims**: For critical roles, consider using Firebase Auth custom claims instead of document reads
2. **Careful Function Composition**: Avoid unnecessary document reads by organizing helper functions efficiently
3. **Regular Security Audits**: Periodically review role helper usage and effectiveness

## Conclusion

Role helper functions form a crucial part of PropAgentic's security architecture. By centralizing role verification logic, we improve code quality, maintainability, and overall security posture. When implementing new security rules, leveraging these helper functions ensures consistent and robust access control throughout the application. 