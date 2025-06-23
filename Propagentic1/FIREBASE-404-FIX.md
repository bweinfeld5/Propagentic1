# Fixing 404 Errors with React Router on Firebase Hosting

## The Problem

When deploying a React application with React Router to Firebase Hosting, you may encounter 404 errors when:

1. Directly accessing a route other than the root (e.g., `/dashboard`)
2. Refreshing the page on a non-root route
3. Sharing or bookmarking links to specific routes

This happens because Firebase Hosting serves static files, and when a request comes in for a path that doesn't match a physical file, Firebase returns a 404 error instead of serving your `index.html` (which is needed for client-side routing to work).

## The Solution

We've implemented a complete solution with multiple layers to ensure reliable routing:

### 1. Firebase Configuration (firebase.json)

```json
{
  "hosting": {
    "public": "build",
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "cleanUrls": true,
    "trailingSlash": false
  }
}
```

The `rewrites` section tells Firebase to serve `index.html` for any route that doesn't match a static file. This handles most cases.

### 2. Custom 404.html Page

We've created a custom 404.html page with a script that redirects users back to the application with the correct route information:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Page Not Found - PropAgentic</title>
  <script>
    // Redirect script
    var pathSegmentsToKeep = 0;
    var l = window.location;
    l.replace(
      l.protocol + '//' + l.hostname + (l.port ? ':' + l.port : '') +
      l.pathname.split('/').slice(0, 1 + pathSegmentsToKeep).join('/') + '/?/' +
      l.pathname.slice(1).split('/').slice(pathSegmentsToKeep).join('/').replace(/&/g, '~and~') +
      (l.search ? '&' + l.search.slice(1).replace(/&/g, '~and~') : '') +
      l.hash
    );
  </script>
</head>
<body>
  <!-- Fallback content if script doesn't execute -->
  <h1>Page Not Found</h1>
  <p>The page you're looking for doesn't exist or has been moved.</p>
  <a href="/">Return to Dashboard</a>
</body>
</html>
```

### 3. Handling Redirect in index.html

We've added a script to `index.html` that takes the encoded route information and restores the proper URL:

```html
<script type="text/javascript">
  (function(l) {
    if (l.search[1] === '/' ) {
      var decoded = l.search.slice(1).split('&').map(function(s) { 
        return s.replace(/~and~/g, '&')
      }).join('?');
      window.history.replaceState(null, null,
          l.pathname.slice(0, -1) + decoded + l.hash
      );
    }
  }(window.location))
</script>
```

### 4. Build Process Improvements

We've created a `build-fix.js` script that:

1. Cleans the build directory completely
2. Verifies the public directory has all required files
3. Runs the build process with proper environment variables
4. Verifies the build output has the correct structure
5. Copies necessary Firebase-specific files

## How to Deploy

Use one of our improved deployment scripts:

```bash
# Clean build and deploy
npm run deploy:clean

# Use deployment helper with error handling
npm run deploy:helper

# Force rebuild and deploy
npm run deploy:force
```

## Testing Your Routes

After deployment, test your application by:

1. Accessing the root URL (e.g., `https://your-app.web.app/`)
2. Directly accessing a deep route (e.g., `https://your-app.web.app/dashboard`)
3. Refreshing the page on a non-root route
4. Using the browser's back/forward buttons

All of these actions should work correctly without 404 errors.

## Troubleshooting

If you still encounter 404 errors:

1. Make sure you've deployed the latest version with all fixes
2. Clear your browser cache completely
3. Check Firebase Hosting logs for any errors
4. Verify your React Router configuration uses BrowserRouter, not HashRouter
5. Try using incognito mode to rule out caching issues

## References

- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)
- [React Router Documentation](https://reactrouter.com/en/main)
- [SPA GitHub Pages](https://github.com/rafgraph/spa-github-pages) - The inspiration for our redirect approach 