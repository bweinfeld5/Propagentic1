
# Cursor Prompt: Fix Broken Bypass Navigation for Maintenance Request

## Issue
The "Bypass and Test Maintenance Request (Dev Only)" button now appears and triggers a toast message saying:
```
Bypassing to maintenance request for testing
```
However, the page does **not actually navigate** anywhere after clicking the button.

---

## Troubleshooting Tasks

### 1. **Check Navigation Function**
Verify that the `onClick` handler is properly invoking navigation logic.

- Are you using `navigate()` from `react-router-dom`?
- Is the function properly called?
- Add a `console.log("Bypass button clicked")` to verify the button works.

### 2. **Check Route Path**
Make sure the route you're navigating to actually exists. For example:

```js
navigate('/tenant/maintenance-request/test');
```

- Does this route exist in your `Routes` or router configuration?
- Try replacing with an existing page like `/dashboard` to test if navigation works at all.

### 3. **Example Fix**
If route is missing, either:
- Add the proper route for maintenance request testing, or
- Redirect temporarily to an existing known-good route

```jsx
<button
  onClick={() => {
    console.log("Bypass button clicked");
    toast.success("Bypassing to maintenance request for testing");
    navigate('/tenant/maintenance-request/test'); // Make sure this route exists
  }}
>
  Bypass and Test Maintenance Request (Dev Only)
</button>
```

### 4. **React Router Notes**
If you're using `useNavigate()`:
```js
import { useNavigate } from 'react-router-dom';
const navigate = useNavigate();
```

---

## Final Goal
Ensure that clicking the bypass button actually takes the user to a valid maintenance request test screen.

- ✅ Button is visible and clickable
- ✅ Console and toast confirm the click
- ❌ Navigation silently fails (likely invalid path)

---

## Deliverable
Fix the broken navigation so the test screen loads as expected when using the dev-only bypass button.

