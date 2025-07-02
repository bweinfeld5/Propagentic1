#!/bin/bash

# Navigate to project root directory
cd "$(dirname "$0")/.."


# Deploy debug Firestore rules script
# This script helps safely deploy more permissive Firestore security rules for troubleshooting
# and then restores the original production rules afterwards

# Color codes for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to display status messages
status() {
  echo -e "${BLUE}==> $1${NC}"
}

# Function to display success messages
success() {
  echo -e "${GREEN}✓ $1${NC}"
}

# Function to display warning messages
warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

# Function to display error messages
error() {
  echo -e "${RED}❌ $1${NC}"
  exit 1
}

# Create a backup of current rules
backup_rules() {
  status "Creating backup of current Firestore rules..."
  if [ -f "firestore.rules" ]; then
    cp firestore.rules firestore.rules.backup
    success "Backup created at firestore.rules.backup"
  else
    error "firestore.rules not found in current directory"
  fi
}

# Deploy debug rules
deploy_debug_rules() {
  status "Deploying debug rules..."
  
  if [ ! -f "firestore.debug.rules" ]; then
    error "firestore.debug.rules not found. Run the script in the same directory as your debug rules file."
  fi
  
  # Temporarily replace firestore.rules with debug version
  cp firestore.debug.rules firestore.rules
  
  # Deploy to Firebase
  firebase deploy --only firestore:rules
  
  if [ $? -eq 0 ]; then
    success "Debug rules deployed successfully"
  else
    error "Failed to deploy debug rules"
  fi
}

# Restore production rules
restore_rules() {
  status "Restoring production rules..."
  
  if [ ! -f "firestore.rules.backup" ]; then
    error "Backup rules not found. Cannot restore."
  fi
  
  # Restore the original rules
  cp firestore.rules.backup firestore.rules
  
  # Deploy to Firebase
  firebase deploy --only firestore:rules
  
  if [ $? -eq 0 ]; then
    success "Original rules restored successfully"
    rm firestore.rules.backup
    success "Cleanup complete"
  else
    error "Failed to restore original rules. Original rules are still available in firestore.rules.backup"
  fi
}

# Main script
echo ""
echo "===========================================" 
echo "    FIRESTORE DEBUG RULES DEPLOYMENT"
echo "===========================================" 
echo ""

warning "This script will temporarily replace your Firestore security rules with more permissive debug rules."
warning "NEVER leave debug rules deployed in production for an extended period."
warning "The debug rules allow broader access to your database for easier troubleshooting."
echo ""
read -p "Do you want to deploy debug rules? (y/n): " choice

if [[ "$choice" == "y" || "$choice" == "Y" ]]; then
  # Deploy debug rules
  backup_rules
  deploy_debug_rules
  
  echo ""
  warning "Debug rules are now active. Your database is less secure!"
  warning "You should restore production rules as soon as troubleshooting is complete."
  echo ""
  
  # Ask how long to keep debug rules active
  read -p "Enter debug time in minutes (max 30, default 10): " debug_time
  debug_time=${debug_time:-10}
  
  # Limit to 30 minutes for safety
  if (( debug_time > 30 )); then
    warning "Limiting debug time to 30 minutes for security"
    debug_time=30
  fi
  
  echo ""
  status "Debug rules will be active for $debug_time minutes"
  echo "Press Ctrl+C to cancel automatic restoration if needed"
  
  # Display countdown
  for (( i=debug_time; i>0; i-- )); do
    echo -ne "Restoring production rules in ${i} minutes...\r"
    sleep 60
  done
  
  echo ""
  # Restore production rules
  restore_rules
  
  echo ""
  success "Debug session completed and security restored"
else
  echo ""
  status "Operation cancelled. No changes were made."
fi

echo ""
echo "===========================================" 
echo "" 