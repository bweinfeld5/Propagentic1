# PropAgentic Build Process Documentation

This document provides information about the enhanced build process for the PropAgentic application, including tools to diagnose and fix common build issues.

## Build Enhancement Tools

### Quick Start

To use the enhanced build process instead of the standard one:

```bash
# Make the script executable (first time only)
chmod +x scripts/build-enhancer.js

# Run the enhanced build
node scripts/build-enhancer.js
```

### Features

The build enhancement script provides several advantages over the standard build process:

1. **Port Conflict Detection**: Automatically detects and resolves port conflicts
2. **Environment Validation**: Checks for required environment variables
3. **Dependency Verification**: Validates critical dependencies before building
4. **Enhanced Logging**: Provides detailed build logs with timestamps
5. **Error Handling**: Improved TypeScript error reporting and solutions
6. **Build Analysis**: Validates the build output for completeness

### Options

The build enhancer supports several command-line options:

```bash
# Run in debug mode for detailed logging
node scripts/build-enhancer.js --debug

# Skip dependency checks
node scripts/build-enhancer.js --skip-dep-check

# Skip environment checks
node scripts/build-enhancer.js --skip-env-check
```

## Common Build Issues and Solutions

### 1. Missing Build Files

If you encounter 404 errors after deployment, it may be due to missing files in the build directory.

**Solution:**
- Run the enhanced build script which validates the build output
- Check for file path case sensitivity issues in imports
- Ensure all required files are included in the build process

### 2. Port Conflicts

If port 3000 is already in use, the build process may fail.

**Solution:**
- Use the build enhancer script which automatically detects and resolves port conflicts
- Manually set the PORT environment variable before building: `PORT=3001 npm run build`

### 3. TypeScript Errors

Common TypeScript errors during build:

**Solutions:**
- "No overload matches this call" - Check component prop types
- "Property does not exist on type" - Update type definitions
- "Cannot find module" - Check imports and dependencies

### 4. React Version Conflicts

React version conflicts can cause build failures.

**Solution:**
- Check [DEPENDENCY-README.md](./DEPENDENCY-README.md) for detailed resolution steps
- Run `npm list react react-dom` to identify version conflicts
- Update package.json "resolutions" field to force consistent versions

## Firebase Deployment

After a successful build, deploy to Firebase using:

```bash
# Standard deployment
firebase deploy

# Deploy with specific site
firebase deploy --only hosting:propagentic

# Preview before deploying
firebase hosting:channel:deploy preview
```

## Continuous Integration

The build enhancer can be integrated into CI/CD pipelines:

```yaml
build:
  script:
    - node scripts/build-enhancer.js --skip-interactive
  artifacts:
    paths:
      - build/
```

## Troubleshooting

### Build Error Logs

When running the build enhancer with `--debug`, detailed error logs are saved to `build-error.log` if the build fails.

### Common Error Patterns

| Error Pattern | Possible Solution |
|---------------|-------------------|
| "Failed to compile" | Check for syntax errors in your code |
| "Module not found" | Check import paths and dependencies |
| "ChunkLoadError" | Incorrect code splitting or dynamic imports |
| "Out of memory" | Increase Node memory with `NODE_OPTIONS=--max_old_space_size=4096` |

### Contact

For persistent build issues, contact the development team at dev@propagentic.com. 