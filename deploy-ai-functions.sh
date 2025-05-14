#!/bin/bash

# Propagentic AI Functions Deployment Script
# This script deploys the AI-powered Firebase Cloud Functions for ticket classification and contractor matching

echo "==============================================="
echo "Propagentic AI Functions Deployment"
echo "==============================================="

# Check if .env file exists in functions directory
if [ ! -f "./functions/.env" ]; then
  echo "Error: functions/.env file not found!"
  echo "Please create functions/.env with your API keys before deploying."
  echo "Example:"
  echo "OPENAI_API_KEY=your_openai_api_key_here"
  exit 1
fi

# Install dependencies
echo "Installing dependencies..."
cd functions
npm install
cd ..

# Deploy functions
echo "Deploying Firebase Cloud Functions..."
firebase deploy --only functions

# Set up environment variables in Firebase
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
fi

echo "==============================================="
echo "Deployment Complete!"
echo "==============================================="
echo "AI Functions deployed:"
echo "1. classifyMaintenanceRequest - Classifies tickets using OpenAI"
echo "2. matchContractorToTicket - Matches suitable contractors to tickets"
echo "3. notifyAssignedContractor - Sends notifications to assigned contractors"
echo ""
echo "Notification Functions deployed:"
echo "4. notifyTicketClassified - Notifies users about classified tickets"
echo "5. notifyContractorsMatched - Notifies landlords about matched contractors"
echo "6. notifyTicketStatusChange - Notifies users about ticket status changes"
echo "7. notifyRequestCompleted - Notifies users about completed tickets"
echo "8. notifyNewMaintenanceRequest - Notifies landlords about new tickets"
echo "9. cleanupOldNotifications - Deletes old notifications (runs daily)"
echo "10. archiveReadNotifications - Archives read notifications (runs daily)"
echo ""
echo "User Relationship API endpoints deployed:"
echo "11. sendTenantInvitation - Sends invitation to tenant"
echo "12. acceptTenantInvitation - Accepts tenant invitation"
echo "13. revokeTenantInvitation - Revokes pending tenant invitation"
echo "14. getTenantInvitations - Gets all tenant invitations"
echo "15. addContractorToRolodex - Adds contractor to rolodex"
echo "16. acceptContractorInvitation - Accepts contractor invitation"
echo "17. removeContractorFromRolodex - Removes contractor from rolodex"
echo "18. getContractorRolodex - Gets all contractors in rolodex"
echo ""
echo "To test the functions, run:"
echo "cd functions && node test-functions.js"
echo ""
echo "To test user relationship APIs, run:"
echo "cd functions && node test-user-relationships.js"
echo "===============================================" 