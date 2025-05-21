# Project Feature Summary

The root `README.md` lists several key capabilities. The codebase provides implementations for most of these features.

- **Role-based authentication** is implemented through `AuthContext` and Firebase Authentication.
- **Maintenance request submission with photo uploads** is available via `MaintenanceSurvey.tsx` and related services.
- **AI classification** is handled by the `classifyMaintenanceRequest` Cloud Function and frontend hook `useMaintenanceAI`.
- **Contractor matching** logic exists in TypeScript but the JavaScript stubs remain, so automatic contractor assignment may not be fully wired up.
- **Landlord dashboard** components (`PropertiesPage`, `TenantsPage`) and invite flow are operational.
- **Notification functions** such as `notifyAssignedContractor` are present with support for Twilio via `notificationDelivery.js`.

Overall the feature list in the README aligns with the code, though some areas like contractor matching and end‑to‑end testing are still unfinished.
