# Resolving Extension Resource Loading Errors (ERR_FAILED)

## Common Extension Resource Errors

When developing a Chrome extension or working with web applications that interact with extensions, you may encounter resource loading errors such as:

- `Failed to load resource: net::ERR_FAILED`
- `Denying load of chrome-extension:///src/assets/styles.css`
- `Resource load failed (ERR_FAILED)`

## Root Causes

1. **Missing web_accessible_resources**: Extension resources not properly declared in manifest.json
2. **Path resolution issues**: Incorrect paths to resources within the extension
3. **CORS restrictions**: Cross-origin resource sharing restrictions for extension content
4. **Self-healing mechanisms failing**: Content state restoration issues

## Fixes for PropAgentic

### 1. Update Manifest.json

We've updated the `web_accessible_resources` in `manifest.json` to use a more permissive pattern:

```json
"web_accessible_resources": [
  {
    "resources": ["*"],
    "matches": ["<all_urls>"]
  }
]
```

This allows all assets to be accessible to the extension content.

### 2. Ensure Proper CSS File Structure

Make sure your CSS files are located at the expected paths:
- Main styles: `src/assets/css/styles.css`
- Additional CSS: `public/assets/css/*.css`

### 3. Self-Healing Playback Issues

If you encounter "Content not found in playback state, this is self healing" warnings:

1. These typically occur when the app tries to restore content state but can't find matching data
2. We've added CSS styles in `styles.css` to handle visual feedback for these cases
3. The app will attempt to recover by:
   - Displaying fallback content
   - Retrying resource loading
   - Using cached data when available

### 4. Debugging Resource Load Failures

When a resource fails to load:

1. Open Chrome DevTools (F12)
2. Go to the Network tab
3. Filter for "Failed" resources
4. Check the full URL path of failing resources
5. Verify the file exists at the expected location
6. Ensure the path is correctly specified in your code

### 5. Extension Development Mode

When developing the extension:

1. Use `npm run start:fix` to start the development server
2. This prevents React Fast Refresh issues
3. Load your extension in developer mode in Chrome

## Additional Resources

- [Chrome Extension Manifest V3 Documentation](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Web Accessible Resources](https://developer.chrome.com/docs/extensions/mv3/manifest/web_accessible_resources/)
- [CORS and Extensions](https://developer.chrome.com/docs/extensions/mv3/xhr/) 