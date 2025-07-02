# PropAgentic OpenSSL Compatibility Guide

## Problem: Node.js 17+ OpenSSL Error

When attempting to build PropAgentic with Node.js version 17 or above, you may encounter an error like:

```
Error: error:0308010C:digital envelope routines::unsupported
```

### Why This Happens

Node.js versions 17 and above use OpenSSL 3.0, which deprecates certain algorithms and features that older webpack configurations rely on. This is a known issue that affects many React applications built with Create React App or older webpack configurations.

## Quick Solution: Use Our Build Helper Script

The easiest way to solve this issue is to use our build helper script:

```bash
# Make the script executable (only needed once)
chmod +x scripts/build-openssl-fix.js

# Run the build with OpenSSL fix
node scripts/build-openssl-fix.js
```

This script automatically:
- Detects your Node.js version
- Applies the OpenSSL legacy provider fix if needed
- Runs the build with proper environment variables
- Validates the build output

## Manual Solutions

If you prefer to handle this issue manually, you have several options:

### Option 1: Set NODE_OPTIONS environment variable

```bash
# On Linux/macOS
export NODE_OPTIONS=--openssl-legacy-provider
npm run build

# On Windows (CMD)
set NODE_OPTIONS=--openssl-legacy-provider
npm run build

# On Windows (PowerShell)
$env:NODE_OPTIONS="--openssl-legacy-provider"
npm run build
```

### Option 2: Modify package.json scripts

Add the OpenSSL legacy provider flag to your build script in package.json:

```json
"scripts": {
  "build": "cross-env NODE_OPTIONS=--openssl-legacy-provider react-scripts build"
}
```

### Option 3: Downgrade Node.js

Switch to an LTS version of Node.js before v17, such as Node.js 16.x:

```bash
# Using nvm
nvm install 16
nvm use 16

# Then build
npm run build
```

## Build Helper Script Options

Our `build-openssl-fix.js` script supports several options:

```bash
node scripts/build-openssl-fix.js [options]
```

Options:
- `--clean`: Clean the build directory before building
- `--debug`: Run in debug mode with verbose logging
- `--skip-checks`: Skip package.json validation checks
- `--help`: Show the help message

Example with options:
```bash
node scripts/build-openssl-fix.js --clean --debug
```

## Long-term Solutions for Sustainability

For a more permanent solution:

1. **Update Dependencies**: Update React Scripts to the latest version which supports newer Node.js
   ```bash
   npm install react-scripts@latest
   ```

2. **Eject from Create React App**: Eject and configure webpack directly
   ```bash
   npm run eject
   ```
   Then update the webpack configuration accordingly.

3. **Migrate to Vite or Next.js**: Consider migrating to more modern build tools which support newer Node.js versions out of the box.

## Additional Resources

- [Node.js OpenSSL Migration Guide](https://nodejs.org/en/blog/vulnerability/openssl-november-2022)
- [Create React App Issue #11562](https://github.com/facebook/create-react-app/issues/11562)
- [Webpack OpenSSL Compatibility](https://webpack.js.org/configuration/node/)

## Troubleshooting

If you still encounter issues:

1. Try running with the debug flag: `node scripts/build-openssl-fix.js --debug`
2. Check if you have the latest versions of npm and Node.js
3. Clear your node_modules and reinstall dependencies:
   ```bash
   rm -rf node_modules
   npm install --legacy-peer-deps
   ```
4. If all else fails, contact the PropAgentic development team for support. 