# Tenant Dashboard Backend Tasks

## Overview
This document outlines the backend tasks required to fully support the redesigned tenant dashboard. These tasks focus on enhancing data services, invitation flow, and navigation to create a seamless tenant experience.

## 1. Invite Code System

### Description
Implement a system that allows tenants to redeem invitation codes manually, as an alternative to email-based invitations.

### Tasks
- [ ] **Create Invite Code Schema** (Effort: Medium)
  - Create a new `inviteCodes` collection in Firestore
  - Schema: `{ code: string, propertyId: string, landlordId: string, unitId?: string, expiresAt: timestamp, used: boolean, usedBy?: string, createdAt: timestamp }`
  - Add indexing for `code` field for quick lookups

- [ ] **Backend Endpoint for Code Redemption** (Effort: High)
  - Create Firebase Function `redeemInviteCode`
  - Input: `{ code: string, tenantId: string }`
  - Validate code exists and is not expired or used
  - Create association between tenant and property
  - Mark code as used and record which tenant used it
  - Return property details on success

- [ ] **Server-side Validation** (Effort: Medium)
  - Implement rate limiting to prevent brute force attacks
  - Add validation for code format (alphanumeric, case-insensitive)
  - Add security rules to prevent unauthorized access to invite codes collection

## 2. Property Services

### Description
Enhance the property data service to provide comprehensive property information for the tenant dashboard.

### Tasks
- [ ] **Update Property Schema** (Effort: Low)
  - Review current property schema
  - Ensure fields exist for: `name`, `address` (structured object), `units` (array), `photos` (array)

- [ ] **Enhance `dataService.getPropertyById()`** (Effort: Medium)
  - Modify to return complete property details
  - Include formatted address string
  - Include property photos (main photo as `photoUrl`)
  - Include unit information relevant to the tenant
  - Add caching layer to improve performance

- [ ] **Create Unit-Tenant Association** (Effort: Medium)
  - Update data model to clearly associate tenants with specific units
  - Ensure `getPropertyById()` filters unit information to only what's relevant to the requesting tenant

## 3. Invitation Services

### Description
Improve the invitation system to provide more context and information to tenants.

### Tasks
- [ ] **Enhance `getPendingInvitesForTenant()`** (Effort: Medium)
  - Modify to include property manager name and contact info
  - Include unit details in invitation objects
  - Add property preview image if available

- [ ] **Update Invitation Schema** (Effort: Low)
  - Add fields: `managerName`, `managerEmail`, `unitDetails`
  - Update invitation creation process to include these fields

- [ ] **Rename `deleteInvite()` to `declineInvite()`** (Effort: Low)
  - Maintain backward compatibility
  - Update method signature to match expected usage in frontend

## 4. Navigation Flow

### Description
Add and enhance routes to support the tenant dashboard workflow, particularly for maintenance requests.

### Tasks
- [ ] **Create Maintenance Request Route** (Effort: Medium)
  - Add route for `/maintenance/new` in App.js
  - Set up route to accept and handle state parameters
  - Create dedicated component for the maintenance request form

- [ ] **Property Selection Handling** (Effort: Medium)
  - Implement logic to pre-select property based on route state
  - Add fallback to select from available properties if none specified
  - Add validation to ensure tenant has access to the selected property

- [ ] **Navigation Service** (Effort: Low)
  - Create helper function for standardized navigation to maintenance form
  - Example: `navigateToMaintenanceForm(propertyId)`

## Implementation Notes

### Dependencies
- Firebase Functions for backend endpoints
- Firestore for data storage
- React Router for navigation flow

### Security Considerations
- Ensure proper validation on all inputs
- Implement Firebase security rules to prevent unauthorized access
- Apply rate limiting on invite code redemption

### Testing
- Create test cases for invite code redemption
- Test property service with various property configurations
- Verify invitation enrichment with sample data

## Estimation
- Total estimated effort: 25-30 person-hours
- Suggested implementation order:
  1. Property Services
  2. Invitation Services
  3. Navigation Flow
  4. Invite Code System 