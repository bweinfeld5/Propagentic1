# Shell Scripts Directory

This directory contains all the shell scripts (`.sh` files) that were previously in the project root directory.

## 📂 Organization

All shell scripts have been moved from the root directory to this `shell-scripts/` directory for better organization and cleaner project structure.

## 🔧 How Scripts Work

Each script has been modified to work correctly from this new location. At the beginning of every script, you'll find:

```bash
#!/bin/bash

# Navigate to project root directory
cd "$(dirname "$0")/.."
```

This command ensures that:
- **Relative paths work correctly** - All scripts continue to reference files relative to the project root
- **Scripts work from anywhere** - You can call these scripts from any directory and they'll still function
- **No path modifications needed** - The scripts maintain their original logic and file references

## 📋 Available Scripts

### Deployment Scripts
- `deploy-all.sh` - Full deployment of React frontend and Firebase functions
- `deploy-hosting.sh` - Deploy only the React frontend
- `deploy-functions.sh` - Deploy only Firebase functions
- `deploy-ai-functions.sh` - Deploy AI-specific functions
- `deploy.sh` - Basic deployment script
- `deploy-auth-update.sh` - Deploy authentication updates
- `deploy-debug-rules.sh` - Deploy Firestore rules for debugging
- `deploy-function.sh` - Deploy a specific function
- `deploy_delete_user_function.sh` - Deploy user deletion function

### Build & Fix Scripts
- `fix-everything.sh` - Comprehensive React app fixes
- `fix-deploy.sh` - Fix deployment issues
- `fix-deploy-final.sh` - Final deployment fixes
- `fix-firebase-json.sh` - Fix Firebase configuration
- `fix-js-errors.sh` - Fix JavaScript errors
- `fix-js-loading.sh` - Fix JavaScript loading issues
- `fix-react-errors.sh` - Fix React-specific errors
- `rebuild.sh` - Basic rebuild script
- `rebuild-complete.sh` - Complete rebuild process
- `simple-rebuild.sh` - Simple rebuild without extras

### Development & Setup Scripts
- `firebase-emulator-setup.sh` - Set up Firebase emulators
- `firebase-test-setup.sh` - Set up Firebase testing environment
- `setup-intern-git.sh` - Set up Git for interns
- `setup-taskmaster-implementation.sh` - Set up Taskmaster implementation
- `configure-stripe.sh` - Configure Stripe integration

### Testing & Verification Scripts
- `run-tests.sh` - Run test suites
- `verify-components.sh` - Verify React component imports/exports
- `check-hidden-chars.sh` - Check for hidden characters in files

### Utility Scripts
- `update-heroicons.sh` - Update Heroicons library
- `create_firestore_index.sh` - Create Firestore indexes

## 🚀 Usage

You can run any script in several ways:

### From Project Root
```bash
./shell-scripts/script-name.sh
```

### From Any Directory (using full path)
```bash
/path/to/project/shell-scripts/script-name.sh
```

### From Shell Scripts Directory
```bash
cd shell-scripts
./script-name.sh
```

All methods will work correctly because each script automatically navigates to the project root before executing.

## ✅ Verification

To verify that scripts are working correctly:

1. **Test from project root:**
   ```bash
   ./shell-scripts/verify-components.sh
   ```

2. **Test from another directory:**
   ```bash
   cd /tmp
   /full/path/to/project/shell-scripts/verify-components.sh
   ```

Both should produce the same results, confirming that the scripts work regardless of the calling location.

## 🔄 Migration Notes

- **Before:** Scripts were in project root and assumed they were running from there
- **After:** Scripts are in `shell-scripts/` directory but automatically navigate to project root
- **Compatibility:** All scripts maintain their original functionality and interfaces
- **No breaking changes:** Existing usage patterns continue to work with updated paths

## 📝 Script Modification Pattern

If you need to add new scripts to this directory, follow this pattern:

```bash
#!/bin/bash

# Navigate to project root directory
cd "$(dirname "$0")/.."

# Your script logic here...
# All relative paths will now work correctly
npm run build
firebase deploy
# etc.
```

This ensures consistency and proper functionality across all scripts. 