# Node.js OpenSSL Legacy Provider Guide

## Overview

This document explains how to resolve the common `error:0308010C:digital envelope routines::unsupported` error that occurs when running modern Node.js versions with applications built using older webpack configurations.

## The Problem

When using Node.js 17+ (which uses OpenSSL 3.0+) with applications built on older webpack configurations (like some versions of Create React App), you may encounter this error:

```
error:0308010C:digital envelope routines::unsupported
```

This happens because OpenSSL 3.0 removed support for some older algorithms by default, but these algorithms are still used by some dependency packages or older webpack configurations.

## Solutions

### 1. Using the OpenSSL Legacy Provider

The most straightforward way to fix this issue is to enable the OpenSSL legacy provider by setting the `NODE_OPTIONS` environment variable:

```bash
export NODE_OPTIONS=--openssl-legacy-provider
```

For Windows CMD:
```cmd
set NODE_OPTIONS=--openssl-legacy-provider
```

For Windows PowerShell:
```powershell
$env:NODE_OPTIONS="--openssl-legacy-provider"
```

### 2. Using Cross-env in npm Scripts

For cross-platform compatibility, our project uses `cross-env` in the npm scripts:

```json
"scripts": {
  "build:safe": "cross-env NODE_OPTIONS=--openssl-legacy-provider react-scripts build",
  "start:legacy": "cross-env NODE_OPTIONS=--openssl-legacy-provider react-scripts start"
}
```

### 3. Downgrading Node.js

If enabling the legacy provider isn't an option, you can downgrade to Node.js 16.x, which uses OpenSSL 1.1.1 and doesn't have these issues:

```bash
# Using nvm (Node Version Manager)
nvm install 16
nvm use 16
```

### 4. Using the fix-dependencies.js Script

Our project includes a comprehensive dependency fix script that handles OpenSSL issues, along with other common dependency problems:

```bash
# Make it executable first
chmod +x scripts/fix-dependencies.js

# Run the script
node scripts/fix-dependencies.js
```

The script will update your package.json and add the necessary configurations to make the build process work with modern Node.js versions.

## Long-term Solutions

While the above solutions work as short-term fixes, consider these long-term approaches:

1. **Upgrade Webpack/CRA**: If possible, upgrade to newer versions of webpack or create-react-app that support OpenSSL 3.0

2. **Eject and Update Config**: If using Create React App, consider ejecting and updating the webpack configuration

3. **Use Modern Build Tools**: Consider migrating to more modern build tools like Vite, which don't have these issues

## Common Error Patterns

If you see any of the following errors, they're related to the OpenSSL issue:

- `error:0308010C:digital envelope routines::unsupported`
- `digital envelope routines::unsupported`
- `ERR_OSSL_EVP_UNSUPPORTED`

## Additional Resources

- [Node.js OpenSSL Migration Guide](https://nodejs.org/api/crypto.html#crypto_crypto_settings)
- [OpenSSL 3.0 Migration Guide](https://www.openssl.org/docs/man3.0/man7/migration_guide.html)
- [Create React App Issues](https://github.com/facebook/create-react-app/issues/11562)

## Troubleshooting

If you continue experiencing issues after trying these solutions:

1. Check if you have multiple versions of Node.js installed
2. Verify that the environment variable is being correctly set
3. Try clearing your npm/yarn cache and node_modules
4. Check if any global npm configurations are overriding your settings 