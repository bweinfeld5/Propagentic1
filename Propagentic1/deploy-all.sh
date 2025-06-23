#!/bin/bash

# Propagentic - Full Deployment Script
# This script deploys both the React frontend and all Firebase functions

echo "==============================================="
echo "Propagentic - Full Deployment"
echo "==============================================="

# Check for Firebase CLI
if ! command -v firebase &> /dev/null; then
  echo "Firebase CLI not found. Please install it using:"
  echo "npm install -g firebase-tools"
  exit 1
fi

# Check if user is logged in to Firebase
firebase projects:list &> /dev/null
if [ $? -ne 0 ]; then
  echo "You are not logged in to Firebase. Please log in:"
  firebase login
fi

# Build the React application
echo "Building React application..."
npm run build

if [ $? -ne 0 ]; then
  echo "React build failed. Aborting deployment."
  exit 1
fi

# Check for .env file in functions directory
if [ ! -f "./functions/.env" ]; then
  echo "Warning: functions/.env file not found!"
  echo "This is required for AI functions. Do you want to continue? (y/n)"
  read -r continue_without_env
  
  if [ "$continue_without_env" != "y" ] && [ "$continue_without_env" != "Y" ]; then
    echo "Deployment aborted. Please create the functions/.env file with your API keys."
    exit 1
  fi
fi

# Install dependencies for functions
echo "Installing dependencies for Firebase functions..."
cd functions
npm install
cd ..

# Deploy Firebase hosting and functions
echo "Deploying to Firebase..."

# First, deploy only hosting (React app)
echo "Deploying frontend to Firebase hosting..."
firebase deploy --only hosting

# Then, deploy all functions
echo "Deploying all Firebase functions..."
firebase deploy --only functions

# Set up environment variables in Firebase if .env exists
if [ -f "./functions/.env" ]; then
  echo "Would you like to set up environment variables in Firebase? (y/n)"
  read -r setup_env

  if [ "$setup_env" == "y" ] || [ "$setup_env" == "Y" ]; then
    # Get OpenAI API key from .env file
    OPENAI_API_KEY=$(grep OPENAI_API_KEY ./functions/.env | cut -d '=' -f2)
    
    if [ -z "$OPENAI_API_KEY" ]; then
      echo "OpenAI API key not found in .env file."
      echo "Please enter your OpenAI API key:"
      read -r OPENAI_API_KEY
    fi
    
    echo "Setting up Firebase environment variables..."
    firebase functions:config:set openai.apikey="$OPENAI_API_KEY"
    
    echo "Environment variables configured successfully!"

    # Set additional environment variables
    echo "Setting additional environment variables..."
    firebase functions:config:set email.user="YOUR_GMAIL_USERNAME_OR_APP_PASSWORD_USER"
    firebase functions:config:set email.password="YOUR_GMAIL_PASSWORD_OR_APP_PASSWORD"
    firebase functions:config:set twilio.account_sid="YOUR_TWILIO_ACCOUNT_SID"
    firebase functions:config:set twilio.auth_token="YOUR_TWILIO_AUTH_TOKEN"
    firebase functions:config:set twilio.phone_number="YOUR_TWILIO_PHONE_NUMBER"
    firebase functions:config:set app.url="YOUR_APPLICATION_URL"
    
    echo "Additional environment variables configured successfully!"
  fi
fi

echo "==============================================="
echo "Deployment Complete!"
echo "==============================================="
echo "Frontend application and the following Firebase functions are now deployed:"
echo ""
echo "AI Functions:"
echo "- classifyMaintenanceRequest - Classifies tickets using OpenAI"
echo "- matchContractorToTicket - Matches suitable contractors to tickets"
echo "- notifyAssignedContractor - Sends notifications to assigned contractors"
echo ""
echo "Notification Functions:"
echo "- notifyTicketClassified - Notifies users about classified tickets"
echo "- notifyContractorsMatched - Notifies landlords about matched contractors"
echo "- notifyTicketStatusChange - Notifies users about ticket status changes"
echo "- notifyRequestCompleted - Notifies users about completed tickets"
echo "- notifyNewMaintenanceRequest - Notifies landlords about new tickets"
echo "- cleanupOldNotifications - Deletes old notifications (runs daily)"
echo "- archiveReadNotifications - Archives read notifications (runs daily)"
echo ""
echo "User Relationship API endpoints:"
echo "- sendTenantInvitation - Sends invitation to tenant"
echo "- acceptTenantInvitation - Accepts tenant invitation"
echo "- revokeTenantInvitation - Revokes pending tenant invitation"
echo "- getTenantInvitations - Gets all tenant invitations"
echo "- addContractorToRolodex - Adds contractor to rolodex"
echo "- acceptContractorInvitation - Accepts contractor invitation"
echo "- removeContractorFromRolodex - Removes contractor from rolodex"
echo "- getContractorRolodex - Gets all contractors in rolodex"
echo ""
echo "Your application is now live at: https://propagentic.web.app"
echo "===============================================" 

echo ""
echo "==============================================="
echo "Testing Instructions"
echo "==============================================="
echo "To test these features locally before using the deployed version:"
echo ""
echo "1. Start Firebase emulators:"
echo "   firebase emulators:start"
echo ""
echo "2. In a separate terminal, start the React app in development mode:"
echo "   npm start"
echo ""
echo "3. Create test users with different roles (tenant, landlord, contractor)"
echo ""
echo "4. Test notification workflow scenarios:"
echo "   - Create maintenance requests as tenant"
echo "   - Process requests as landlord"
echo "   - Assign contractors and update status"
echo ""
echo "5. Check notification components:"
echo "   - NotificationBell with badge counter"
echo "   - NotificationPanel slide-in overlay"
echo "   - NotificationsPage with filtering options"
echo "   - NotificationPreferences settings"
echo ""
echo "For a comprehensive testing guide, refer to testing-guide.md"
echo "===============================================" 