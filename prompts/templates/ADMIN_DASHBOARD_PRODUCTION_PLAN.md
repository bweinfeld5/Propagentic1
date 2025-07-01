
# Prompt for AI-Assisted Admin Dashboard Development

**Project:** PropAgentic - AI-Powered Property Management SaaS

**Objective:** Audit the existing Super Admin dashboard and generate a comprehensive implementation plan to create a production-ready user management interface with full CRUD (Create, Read, Update, Delete) functionality.

**Current State:** The Super Admin dashboard currently displays a list of users from Firestore. However, it lacks the essential administrative functions for managing user accounts directly from the UI. All administrative actions must be secure, efficient, and align with the project's existing technology stack and conventions (React, TypeScript, Firebase, Tailwind CSS).

---

### **1. Audit and Analysis (What to look for):**

Please begin by thoroughly auditing the current codebase to understand the existing implementation.

- **Identify Core Files:** Locate and list all files related to the current admin dashboard. This includes:
    - Page components in `src/pages/admin/`
    - UI components in `src/components/admin/` or `src/components/shared/`
    - Data fetching logic in `src/services/` (e.g., `dataService.js`)
    - React routes and protected route configurations.

- **Analyze Data Layer:**
    - Examine how the user list is currently fetched from Firestore.
    - Review the `users` collection data model in Firestore.
    - Inspect the existing Firestore Security Rules (`firestore.rules`) to determine what permissions are currently granted to the `admin` role.

- **Assess UI/UX:**
    - Evaluate the current user list component.
    - Check for any placeholder or partially implemented UI elements for create, edit, or delete functions.

### **2. Production-Ready Implementation Plan (What to create):**

Based on your audit, please generate a detailed, step-by-step plan in this markdown file. The plan should be a roadmap for building a robust, production-ready admin dashboard.

#### **Part A: UI/UX Enhancements**

1.  **User Table/List View (`UserList.tsx`):**
    *   **Detailed Columns:** Enhance the table to include columns for: User Avatar/Initials, Full Name, Email, Role (Landlord, Tenant, Contractor), Status (Active, Pending Invite, Disabled), and Joined Date.
    *   **Action Buttons:** For each row, add a menu (e.g., a dropdown on a "..." icon) with "View Details," "Edit," and "Delete" actions.
    *   **Search & Filtering:** Implement a search bar to filter users by name or email. Add dropdowns to filter by Role and Status.
    *   **Pagination:** Add pagination to handle a large number of users gracefully.
    *   **"Create User" Button:** Add a primary button at the top of the page to launch the user creation flow.

2.  **Create User Flow (`CreateUserModal.tsx`):**
    *   Design a modal form to create a new user.
    *   **Fields:** Include fields for First Name, Last Name, Email, and a dropdown to select the user's Role.
    *   **Action:** On submission, this should trigger an invitation email to the new user to set their password and complete onboarding. The user should initially have a "Pending Invite" status.

3.  **Edit User Flow (`EditUserModal.tsx`):**
    *   Design a modal form pre-filled with the selected user's data.
    *   **Editable Fields:** Allow admins to update the user's Role, and profile information.
    *   **Administrative Actions:** Include options to:
        *   Disable/Re-enable the user's account.
        *   Resend the invitation email if the user is "Pending Invite."
        *   Trigger a password reset email.

4.  **Delete User Flow (`DeleteUserConfirmation.tsx`):**
    *   Implement a confirmation modal that appears when an admin clicks "Delete."
    *   **Warning Message:** The modal must clearly state the irreversible consequences of deleting a user (e.g., "You are about to permanently delete the user 'John Doe (john.doe@email.com)'. This will remove their access and all associated data. This action cannot be undone.").
    *   **Confirmation Input:** Require the admin to type the user's email or the word "DELETE" to confirm the action, preventing accidental clicks.

#### **Part B: Backend and Data Layer (Firebase)**

1.  **Secure Cloud Functions (`functions/src/users.ts`):**
    *   Propose three new **Callable Cloud Functions** to handle the logic securely on the backend. Each function must verify that the caller is an authenticated admin before executing.
    *   `createUser(data: {firstName, lastName, email, role})`: Creates a user record in Firebase Auth, sets their custom claim for the role, and creates a corresponding user document in Firestore with a "Pending Invite" status.
    *   `updateUser(data: {uid, role, status, ...})`: Updates the user's custom claims in Auth and their document in Firestore.
    *   `deleteUser(data: {uid})`: Deletes the user from Firebase Auth and their corresponding document from Firestore. Consider how to handle their associated data (e.g., properties, maintenance requests). Propose a strategy for either deleting or archiving this data.

2.  **Admin Service Module (`src/services/adminService.ts`):**
    *   Create a new frontend service file to interact with the new cloud functions.
    *   This module should contain functions like `createNewUser(userData)`, `updateUserDetails(userId, updates)`, and `deleteUserById(userId)` that call the respective cloud functions.

3.  **Firestore Security Rules (`firestore.rules`):**
    *   Write the specific security rules required for the `users` collection.
    *   The rules should only allow users with an `admin` custom claim to read the full user list and to write/delete user documents.
    *   Ensure non-admin users can only read/write their own user document.

#### **Part C: State Management & Polish**

1.  **Data Fetching:** Recommend using **React Query** (as it's planned for the project) to fetch the user list and manage server state. This will handle caching, re-fetching on focus, and optimistic updates.
2.  **Notifications:** Use `react-hot-toast` to provide clear feedback for all actions (e.g., "User created successfully," "Failed to delete user," "Invitation sent").
3.  **Error Handling:** Implement comprehensive error handling for both UI and backend operations. Display clear error messages if a cloud function fails.

Please structure the final output as a clean, actionable markdown file that can be used as a checklist for development.
