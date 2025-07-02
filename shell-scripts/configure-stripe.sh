#!/bin/bash

# Navigate to project root directory
cd "$(dirname "$0")/.."


echo "🔑 Stripe Configuration Script"
echo "=============================="

# Check if we're already authenticated with Firebase
firebase projects:list > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Please run 'firebase login' first"
    exit 1
fi

echo "📋 Current project: $(firebase use)"

echo ""
echo "🔧 Setting up Stripe configuration..."
echo ""

# Get Stripe publishable key from .env
PUBLISHABLE_KEY=$(grep REACT_APP_STRIPE_PUBLISHABLE_KEY .env | cut -d '=' -f2-)

if [ -z "$PUBLISHABLE_KEY" ]; then
    echo "❌ REACT_APP_STRIPE_PUBLISHABLE_KEY not found in .env file"
    exit 1
fi

echo "✅ Found Stripe publishable key in .env"

# Prompt for secret key
echo ""
echo "🔐 Please provide your Stripe SECRET key:"
echo "   (Get it from: https://dashboard.stripe.com/test/apikeys)"
echo "   Format: sk_test_... or sk_live_..."
echo ""
read -p "Stripe Secret Key: " SECRET_KEY

if [[ ! $SECRET_KEY =~ ^sk_(test|live)_ ]]; then
    echo "❌ Invalid Stripe secret key format"
    exit 1
fi

# Determine if this is test or live
if [[ $SECRET_KEY == sk_test_* ]]; then
    echo "🧪 Detected TEST mode"
    MODE="test"
else
    echo "🚀 Detected LIVE mode"
    MODE="live"
fi

# Set the configuration
echo ""
echo "⚙️  Setting Firebase Functions configuration..."

firebase functions:config:set \
    stripe.secret_key="$SECRET_KEY" \
    stripe.mode="$MODE"

if [ $? -eq 0 ]; then
    echo "✅ Stripe configuration set successfully!"
    echo ""
    echo "🚀 Now deploying Stripe functions..."
    
    # Deploy Stripe functions
    firebase deploy --only functions:createStripeAccountLink,functions:getStripeAccountStatus,functions:refreshStripeAccount,functions:stripeWebhooks
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "🎉 SUCCESS! Stripe is now configured and deployed"
        echo ""
        echo "📝 Next steps:"
        echo "   1. Test contractor onboarding Step 4"
        echo "   2. Configure webhooks in Stripe Dashboard"
        echo "   3. Set up return URLs for production domain"
        echo ""
        echo "🌐 Webhook endpoint:"
        echo "   https://us-central1-propagentic.cloudfunctions.net/stripeWebhooks"
        echo ""
    else
        echo "❌ Failed to deploy functions"
        exit 1
    fi
else
    echo "❌ Failed to set configuration"
    exit 1
fi 