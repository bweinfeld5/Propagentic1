# PropAgentic Dependency Management Guide

This document explains how to manage dependencies in the PropAgentic application, particularly focusing on resolving common conflicts.

## React Version Compatibility

The application uses React 19, which has specific compatibility requirements:

1. All React-related packages must be compatible with React 19
2. Certain animation libraries require special handling
3. Some third-party components may need wrappers or alternatives

## Common Dependency Issues

### React Version Conflicts

**Symptoms:**
- Build errors mentioning multiple React instances
- Runtime errors about invalid hooks usage
- Unexpected component behavior

**Resolution:**
```bash
# Check React versions
npm list react react-dom

# Force consistent versions through resolutions in package.json
npm install
```

### Framer Motion Compatibility

**Symptoms:**
- Error: "AnimatePresence is not a component"
- Missing animation effects
- Console errors about missing methods

**Resolution:**
Use the SafeMotion wrapper component for all Framer Motion elements:

```jsx
import { SafeMotion } from '../components/shared/SafeMotion';

// Instead of direct import from framer-motion
// import { motion } from 'framer-motion';

function MyComponent() {
  return (
    <SafeMotion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      Content
    </SafeMotion.div>
  );
}
```

### Package Installation Issues

**Symptoms:**
- Peer dependency warnings during installation
- Failed installations due to version conflicts
- Missing dependencies at runtime

**Resolution:**
```bash
# Clean installation
rm -rf node_modules
npm cache clean --force

# Install with legacy peer deps
npm install --legacy-peer-deps

# Fix problematic dependencies
node scripts/fix-dependencies.js
```

## NPM Configuration

The application uses the following NPM configuration in `.npmrc`:

```
legacy-peer-deps=true
resolution-mode=highest
```

This ensures:
1. Packages install despite peer dependency warnings
2. The highest available version is used when conflicts occur

## Managing Dependencies in package.json

### Resolutions Field

The "resolutions" field in package.json forces specific versions of packages regardless of what dependencies request:

```json
"resolutions": {
  "react": "^19.1.0",
  "react-dom": "^19.1.0",
  "@types/react": "^18.2.0"
}
```

### Dev Dependencies vs Dependencies

- Place build and development tools in `devDependencies`
- Place runtime dependencies in `dependencies`
- UI component libraries should be in `dependencies`

## Specific Package Solutions

### Playwright

Playwright may have conflicts with Firefox. Use our setup script:

```bash
node scripts/setup-playwright.js
```

### Tailwind CSS

Ensure consistent Tailwind CSS versions with PostCSS:

```bash
npm install tailwindcss@latest postcss@latest autoprefixer@latest
```

### Material UI and Emotion

For Material UI components, check emotion dependencies:

```bash
npm list @emotion/react @emotion/styled
```

## Dependency Cleanup Script

The dependency cleanup script can fix common issues:

```bash
# Run the dependency cleanup script
node scripts/fix-dependencies.js

# With specific flags
node scripts/fix-dependencies.js --force-react-19 --fix-emotion
```

## Updating Dependencies

When updating dependencies:

1. Update a few packages at a time to isolate issues
2. Test thoroughly after each update
3. Update React and related packages together
4. Use `--legacy-peer-deps` when installing new packages

## Troubleshooting Tools

### Dependency Visualization

```bash
# Install dependency visualizer
npm install -g npm-why

# Check why a package is installed
npx npm-why package-name
```

### Duplicate Package Detection

```bash
# Find duplicate packages
npx find-duplicate-dependencies
```

### Bundler Analysis

```bash
# Analyze bundle size
npm run build -- --stats
npx webpack-bundle-analyzer ./build/bundle-stats.json
```

For further assistance with dependencies, contact the development team at dev@propagentic.com. 