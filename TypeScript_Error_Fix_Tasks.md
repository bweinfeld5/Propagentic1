# TypeScript Error Fix Tasks - Phase 2 Maintenance Components

## Priority 1: Critical Type Mismatches (Blocking Build)

### Task 1.1: Fix Job Interface Property Mismatches
**Priority: HIGH** - Blocking compilation

**Problem**: Job interface lacks properties used throughout codebase
- `priority` property missing
- `propertyId` property missing  
- `assignedContractorId` property missing
- `landlordId` property missing

**Files Affected**:
- `src/services/firestore/communicationIntegrationService.ts` (lines 190, 191, 333, 339, 343, 349, 355, 356, 359, 363, 369, 382, 388, 400, 406)
- `src/services/firestore/maintenanceService.ts` (line 291)

**Solution**: 
1. Update Job interface in `src/models/` to include missing properties
2. OR remove references to non-existent properties and use defaults/stubs

### Task 1.2: Fix Message Interface Type Issues  
**Priority: HIGH** - Multiple compilation errors

**Problem**: Message interface inconsistencies
- `readBy` defined as `string[]` but service uses `{}`
- `deliveredTo` property missing from interface
- `isEdited`/`isDeleted` properties missing

**Files Affected**:
- `src/services/firestore/communicationService.ts` (lines 141, 142, 163)
- `src/models/Communication.ts`

**Solution**: 
1. Align Message interface with actual service usage
2. Fix type mismatches in service methods

### Task 1.3: Fix Timestamp vs Date Type Conflicts
**Priority: HIGH** - Firebase integration issues

**Problem**: Service using `new Date()` where Firestore expects `Timestamp`
- `createdAt`/`updatedAt` fields 
- `timestamp` fields in messages

**Files Affected**:
- `src/services/firestore/communicationService.ts` (lines 60, 61, 141, 327, 328)
- `src/services/firestore/communicationIntegrationService.ts` (line 472)

**Solution**: 
1. Use `serverTimestamp()` for Firestore operations
2. Convert Timestamp to Date when needed for UI

## Priority 2: Interface Property Mismatches

### Task 2.1: Fix BulkOperation Interface Issues
**Priority: MEDIUM** - Service method signature errors

**Problem**: BulkOperation interface missing expected properties
- `operationType` property missing (has `type` instead)
- `parameters` property missing

**Files Affected**:
- `src/services/firestore/maintenanceService.ts` (lines 394, 395, 430, 483)

**Solution**: 
1. Update BulkOperation interface to match service expectations
2. OR update service to match existing interface

### Task 2.2: Fix MaintenanceMetrics Interface Mismatches
**Priority: MEDIUM** - Metrics service errors

**Problem**: MaintenanceMetrics interface missing properties
- `totalRequests` property missing
- `contractorPerformance` property missing

**Files Affected**:
- `src/services/firestore/maintenanceService.ts` (lines 506, 548)

**Solution**: 
1. Add missing properties to MaintenanceMetrics interface
2. OR remove references and use different approach

### Task 2.3: Fix Photos Property Type Mismatch
**Priority: MEDIUM** - Data structure inconsistency

**Problem**: MaintenanceRequest photos field expects `string[]` but service creates object array

**Files Affected**:
- `src/services/firestore/maintenanceService.ts` (line 161)

**Solution**: 
1. Update MaintenanceRequest interface photos field to accept object array
2. OR modify service to only store URLs as strings

## Priority 3: Missing Type Definitions

### Task 3.1: Add Missing Type Imports
**Priority: LOW** - Missing type references

**Problem**: `Message` type not imported where used

**Files Affected**:
- `src/services/firestore/communicationIntegrationService.ts` (lines 519, 576)

**Solution**: 
1. Add proper import for Message type
2. Ensure all required types are exported from models

### Task 3.2: Fix Conversation Property Issues  
**Priority: LOW** - Optional property errors

**Problem**: Conversation interface missing optional properties
- `jobId` property used but not defined
- `updatedAt` property in NotificationPreference

**Files Affected**:
- `src/services/firestore/communicationIntegrationService.ts` (line 444)
- `src/services/firestore/communicationService.ts` (line 253)

**Solution**: 
1. Add optional jobId to Conversation interface
2. Remove invalid updatedAt from NotificationPreference operations

## Priority 4: Status and Enum Value Mismatches

### Task 4.1: Fix MaintenanceStatus Value Issues
**Priority: LOW** - Enum value errors

**Problem**: Invalid status values used
- `'status_update'` not valid MaintenanceStatus
- `'partial_failure'` not valid BulkOperationStatus

**Files Affected**:
- `src/services/firestore/maintenanceService.ts` (lines 430, 483)

**Solution**: 
1. Use valid MaintenanceStatus values
2. Update BulkOperationStatus enum to include needed values

## Implementation Plan

### Phase 1: Critical Fixes (Day 1)
1. Fix Job interface or remove invalid property access
2. Resolve Message interface inconsistencies
3. Fix Timestamp/Date type conflicts

### Phase 2: Interface Updates (Day 2)
1. Update BulkOperation interface
2. Fix MaintenanceMetrics interface
3. Resolve photos property type mismatch

### Phase 3: Cleanup (Day 3)
1. Add missing type imports
2. Fix optional property issues
3. Resolve status/enum mismatches

## Success Criteria
- [ ] All TypeScript compilation errors resolved
- [ ] Build completes successfully
- [ ] No type safety regressions
- [ ] All services compile without warnings

## Notes
- Consider creating stub implementations for missing functionality
- Maintain backward compatibility where possible
- Document any breaking changes in type definitions 