# PropAgentic Dependency Resolution Tasks

## Identified Issues

The root cause of the build failures is a dependency conflict between multiple React-based libraries:

1. **React Version Conflict**: 
   - Your project uses React 17.0.2
   - But @headlessui/react@2.2.1 requires React 18, 19, or 19.0.0-rc

2. **Multiple Dependency Mismatches**:
   - Fixed: framer-motion is at 6.5.1 (compatible with React 17)
   - Fixed: @types/react and @types/react-dom are at version 17.x
   - Problem: @headlessui/react is at 2.2.1 (requires React 18+)

## Option 1: Downgrade @headlessui/react (Recommended)

This option maintains React 17 compatibility and involves fewer changes.

### Tasks

- [ ] **Downgrade @headlessui/react to a React 17 compatible version**
  ```bash
  npm uninstall @headlessui/react
  npm install @headlessui/react@1.7.19 --legacy-peer-deps
  ```

- [ ] **Update package.json to specify the correct version**
  ```json
  "@headlessui/react": "^1.7.19"
  ```

- [ ] **Verify API compatibility**
  - Check components that use @headlessui/react
  - Ensure they use the v1.x API, not v2.x features

- [ ] **Test all Headless UI components**:
  - Dialog/Modal components
  - Dropdown menus
  - Tabs
  - Other interactive components

## Option 2: Upgrade to React 18

This is a more substantial change that requires updating multiple dependencies and checking for compatibility issues.

### Tasks

- [ ] **Upgrade React and React DOM**
  ```bash
  npm install react@18 react-dom@18 --legacy-peer-deps
  ```

- [ ] **Update React types**
  ```bash
  npm install @types/react@18 @types/react-dom@18 --save-dev --legacy-peer-deps
  ```

- [ ] **Upgrade framer-motion to a React 18 compatible version**
  ```bash
  npm install framer-motion@^10.16.4 --legacy-peer-deps
  ```

- [ ] **Run type checks to catch compatibility issues**
  ```bash
  npm run fix-ts
  ```

- [ ] **Fix React 18 migration issues**:
  - Update imports if createRoot API is needed
  - Replace ReactDOM.render with ReactDOM.createRoot
  - Check for concurrent mode compatibility issues
  - Update any components using deprecated lifecycle methods

## Building and Testing

- [ ] **Test with the safe build command**
  ```bash
  npm run build:safe
  ```

- [ ] **Verify build output**
  ```bash
  ls -la build
  ```
  Ensure it contains:
  - index.html
  - static/js directory with bundle files
  - static/css directory with stylesheet files

- [ ] **Test locally before deployment**
  ```bash
  npx serve -s build
  ```

- [ ] **Deploy when everything works**
  ```bash
  npm run deploy:clean
  ```

## Dependency Management Best Practices

- [ ] **Lock versions more strictly in package.json**
  - Change caret (^) dependencies to tilde (~) or exact versions for critical packages

- [ ] **Create a .npmrc file with safer defaults**
  ```
  engine-strict=true
  save-exact=true
  legacy-peer-deps=true
  ```

- [ ] **Add dependency constraints to package.json**
  ```json
  "engines": {
    "node": ">=16.0.0 <19.0.0",
    "npm": ">=7.0.0"
  }
  ```

- [ ] **Document dependencies in README**
  - List core dependencies and their version requirements
  - Add troubleshooting section for common issues

## Additional Tasks for Future Maintenance

- [ ] **Set up dependency monitoring**
  - Consider adding Dependabot or Renovate
  - Configure to only update patch and minor versions automatically

- [ ] **Implement a lockfile for reproducible builds**
  - Consider yarn.lock or package-lock.json
  - Commit this file to version control

- [ ] **Create an emergency rollback plan**
  - Document how to revert to the last working version
  - Include steps to restore known-good dependencies

## Progress Tracking

- [ ] Option selected: _________________
- [ ] Dependencies updated
- [ ] Build successful
- [ ] Local testing passed
- [ ] Deployment completed

When following this guide, start by choosing either Option 1 (downgrade Headless UI) or Option 2 (upgrade React). Option 1 is recommended as it involves fewer changes and less risk. 