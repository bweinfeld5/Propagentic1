# Functions Documentation Status

The `functions/README.md` describes several Cloud Functions used in Propagentic. The repository includes TypeScript implementations for these functions.

## Implemented
- `classifyMaintenanceRequest` triggers on ticket creation and updates the ticket with a category and urgency.
- `matchContractorToTicket` is fully implemented in `functions/src/matchContractorToTicket.ts` with logic to prioritize preferred contractors.
- `notifyAssignedContractor`, `sendTenantInvitation`, `acceptPropertyInvite`, and related invitation functions exist in the `functions/src` directory and are exported in `index.ts`.

## Differences
- The plain JavaScript versions in `functions/functions/` are placeholders that log and return dummy data. Deployment uses the compiled files under `functions/lib/` but these stubs remain in the repository.
