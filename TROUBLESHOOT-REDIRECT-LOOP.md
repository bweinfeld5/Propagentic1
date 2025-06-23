# Troubleshooting Frontend Redirect Loop (`?redirect_url=`)

This document outlines the steps to diagnose and fix the infinite redirect loop observed on the frontend, specifically related to the handling of the `?redirect_url=` query parameter.

**Problem:** The application gets stuck on a loading screen (URL: `.../?redirect_url=%2F...`), and the browser console indicates the redirect logic is looping back to this same URL instead of navigating to the intended path (`/`).

## Task List

1.  **Locate the Redirect Handler Script:**
    *   **Goal:** Find the specific JavaScript code responsible for processing the `?redirect_url=` parameter.
    *   **Likely Locations:** `public/firebase-routing.js`, `<script>` tags within `public/index.html`, `<script>` tags within `public/404.html`.
    *   **Action:** Search these files for relevant keywords like `redirect_url`, `location.search`, `location.replace`, `history.replaceState`.

2.  **Analyze Script Logic:**
    *   **Goal:** Understand why the script is causing a loop.
    *   **Action:** Read the identified script. Does it check if `redirect_url` is *already* present in the current URL's query string? It likely redirects unconditionally, causing the loop. How does it extract the target path? How does it trigger the redirect?

3.  **Modify the Script:**
    *   **Goal:** Prevent the loop by adding a condition.
    *   **Action:**
        *   Add a check at the beginning of the script: If `window.location.search.includes('redirect_url=')`, the script should *not* perform another `window.location.replace`.
        *   Ideally, when the `redirect_url` is found *on initial load*, the script should use `history.replaceState()` to *clean* the URL (remove the `?redirect_url=...` part) **without** causing a full page reload, allowing the SPA router (React Router) to handle navigation based on the clean path.
        *   Alternatively, extract the path and store it (e.g., `sessionStorage`) for the React app to pick up after loading.

4.  **Test the Fix:**
    *   **Goal:** Verify the loop is resolved and the app navigates correctly.
    *   **Action:** Rebuild the frontend (`npm run build` in the root) and deploy to Firebase Hosting (`firebase deploy --only hosting`). Access the site and observe if the loading screen disappears and the correct page loads. Check the browser console for errors.

5.  **(If Necessary) Review `firebase.json`:**
    *   **Goal:** Ensure hosting rewrites aren't interfering.
    *   **Action:** Check the `hosting.rewrites` section. Confirm the SPA fallback (`"source": "**", "destination": "/index.html"`) is the last rule and correctly configured. 