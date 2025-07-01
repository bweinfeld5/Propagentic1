# Build Troubleshooting Tasks

This document outlines a systematic approach to troubleshoot the build process issues in PropAgentic.

## 1. Initial Diagnostics

- [ ] **Run a diagnostic build with verbose output**
  ```bash
  GENERATE_SOURCEMAP=false CI=false npm run build -- --verbose > build_log.txt 2>&1
  ```

- [ ] **Check for specific error messages in the log**
  Look for fatal errors, import failures, or TypeScript errors

- [ ] **Verify Node and npm versions**
  ```bash
  node -v
  npm -v
  ```
  Ensure you're using node v16+ and npm v7+ for compatibility

## 2. Dependency Issues

- [ ] **Clear npm cache and node_modules**
  ```bash
  npm cache clean --force
  rm -rf node_modules
  rm -rf build
  ```

- [ ] **Reinstall dependencies with legacy peer deps**
  ```bash
  npm install --legacy-peer-deps
  ```

- [ ] **Check for React/TypeScript version conflicts**
  Verify that TypeScript version (4.9.5) is compatible with React 17

- [ ] **Fix specific framer-motion issue**
  ```bash
  npm install framer-motion@6.5.1 --legacy-peer-deps --force
  ```

## 3. Configuration Checks

- [ ] **Verify TypeScript config**
  Look for errors in tsconfig.json

- [ ] **Check for missing or incorrect environment variables**
  Create a minimal .env file if needed:
  ```
  GENERATE_SOURCEMAP=false
  CI=false
  ```

- [ ] **Examine webpack configuration**
  If you have a custom webpack config, check for issues

## 4. Code-level Troubleshooting

- [ ] **Run TypeScript compiler in isolation**
  ```bash
  npx tsc --noEmit
  ```

- [ ] **Fix TypeScript errors one by one**
  Address any critical type errors

- [ ] **Search for unsupported React 18 features**
  Look for useId, useTransition, useDeferredValue or other React 18 specific hooks

- [ ] **Check @types package versions**
  Ensure @types/react and @types/react-dom are compatible with React 17

## 5. Alternative Build Approaches

- [ ] **Try building with development configuration**
  ```bash
  NODE_ENV=development npm run build
  ```

- [ ] **Use the build-fix script with debugging**
  ```bash
  node --inspect-brk build-fix.js
  ```

- [ ] **Try create-react-app's build script directly**
  ```bash
  ./node_modules/.bin/react-scripts build
  ```

## 6. Targeted Component Testing

- [ ] **Create a minimal test component**
  Create a simple component that doesn't use complex animations or imports

- [ ] **Check for circular dependencies**
  Circular imports can cause build failures

- [ ] **Test building with specific components excluded**
  Comment out complex components to isolate issues

## 7. Environment Isolation

- [ ] **Try building in a clean environment**
  Use Docker or a fresh environment to eliminate system-specific issues

- [ ] **Test with a specific Node.js version**
  ```bash
  nvm install 16.14.0
  nvm use 16.14.0
  npm run build
  ```

## 8. Last Resort Options

- [ ] **Eject from create-react-app**
  ```bash
  npm run eject
  ```
  Warning: This is a one-way operation and should be a last resort!

- [ ] **Start with a fresh create-react-app**
  Create a new project and migrate components one by one

- [ ] **Try an alternative build tool**
  Consider Vite, Parcel, or Next.js based on your specific needs

## Common Issues and Solutions

### React 17 + TypeScript Issues
The TypeScript types for React 17 might be mismatched. Try:
```bash
npm install --save-dev @types/react@17.0.43 @types/react-dom@17.0.14
```

### Memory Errors
If the build process is running out of memory:
```bash
NODE_OPTIONS=--max_old_space_size=4096 npm run build
```

### Webpack 5 Issues
Create React App 5.x uses Webpack 5, which may cause build issues:
```bash
npm install -D @craco/craco
```
And create a craco.config.js with custom webpack settings

### ESLint Config Problems
Temporarily disable ESLint during build:
```bash
DISABLE_ESLINT_PLUGIN=true npm run build
``` 