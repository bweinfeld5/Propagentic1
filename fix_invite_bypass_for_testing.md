
# Cursor Prompt: Bypass Invite Code for Testing Maintenance Request

## Objective
Modify the tenant dashboard invite code page to include a **temporary developer-only button** that navigates directly to the maintenance request screen. This is to facilitate testing of the enhanced maintenance request feature without needing a valid invite code.

---

## Task Instructions

1. **Locate the Invite Code Page Component**  
   Find the React (or relevant frontend framework) component that renders the "Invite Code Required" screen.

2. **Add Developer Bypass Button**
   Add a button labeled `Bypass and Test Maintenance Request` directly under the `Validate Code` button.

3. **Navigation Logic**  
   When this new button is clicked, route the user to the enhanced maintenance request screen, such as:
   ```
   /tenant/maintenance-request/test
   ```
   or whatever the correct dev route is for accessing that screen.

4. **Visibility Guard (Optional but Recommended)**  
   Make this bypass button appear **only if**:
   - The user email ends with `@propagentic.com`
   - OR use `process.env.NODE_ENV === 'development'` to restrict in dev builds only

5. **Sample JSX**
   ```jsx
   {process.env.NODE_ENV === 'development' && (
     <button
       onClick={() => navigate('/tenant/maintenance-request/test')}
       style={{ marginTop: '10px', backgroundColor: '#ddd', padding: '10px', borderRadius: '5px' }}
     >
       Bypass and Test Maintenance Request
     </button>
   )}
   ```

---

## Notes
- This is strictly for internal development and should never be exposed in production.
- Add a console warning if necessary: `console.warn("Bypassing invite code (dev only)")`

---

## Final Goal
Allow testing of the new maintenance request interface even if the invite code is not available or broken.

