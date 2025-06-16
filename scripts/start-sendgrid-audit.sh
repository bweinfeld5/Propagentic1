#!/bin/bash

# PropAgentic SendGrid Integration Audit - Starter Script
# This script helps the background agent begin the audit process

echo "🚀 Starting PropAgentic SendGrid Integration Audit..."
echo "=================================================="

# Ensure we're on the right branch
echo "📋 Checking branch..."
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "feature/sendgrid-integration-audit" ]; then
    echo "⚠️  Switching to feature/sendgrid-integration-audit branch..."
    git checkout feature/sendgrid-integration-audit
fi

echo "✅ On branch: $(git branch --show-current)"
echo ""

# Create audit report directory
echo "📁 Setting up audit directories..."
mkdir -p audit-results
mkdir -p email-templates

echo "🔍 Beginning email function discovery..."
echo "======================================"

# Search for nodemailer usage
echo "🔎 Searching for nodemailer usage..."
grep -r "nodemailer" --include="*.js" --include="*.ts" . > audit-results/nodemailer-usage.txt 2>/dev/null
if [ -s audit-results/nodemailer-usage.txt ]; then
    echo "❌ Found nodemailer usage:"
    cat audit-results/nodemailer-usage.txt
else
    echo "✅ No nodemailer usage found"
fi
echo ""

# Search for transporter usage
echo "🔎 Searching for transporter usage..."
grep -r "transporter" --include="*.js" --include="*.ts" . > audit-results/transporter-usage.txt 2>/dev/null
if [ -s audit-results/transporter-usage.txt ]; then
    echo "❌ Found transporter usage:"
    cat audit-results/transporter-usage.txt
else
    echo "✅ No transporter usage found"
fi
echo ""

# Search for sendMail usage
echo "🔎 Searching for sendMail usage..."
grep -r "sendMail" --include="*.js" --include="*.ts" . > audit-results/sendmail-usage.txt 2>/dev/null
if [ -s audit-results/sendmail-usage.txt ]; then
    echo "❌ Found sendMail usage:"
    cat audit-results/sendmail-usage.txt
else
    echo "✅ No sendMail usage found"
fi
echo ""

# Search for SMTP connections
echo "🔎 Searching for SMTP connections..."
grep -r "smtp://" --include="*.js" --include="*.ts" . > audit-results/smtp-usage.txt 2>/dev/null
if [ -s audit-results/smtp-usage.txt ]; then
    echo "❌ Found SMTP connections:"
    cat audit-results/smtp-usage.txt
else
    echo "✅ No direct SMTP connections found"
fi
echo ""

# Search for createTransport usage
echo "🔎 Searching for createTransport usage..."
grep -r "createTransport" --include="*.js" --include="*.ts" . > audit-results/createtransport-usage.txt 2>/dev/null
if [ -s audit-results/createtransport-usage.txt ]; then
    echo "❌ Found createTransport usage:"
    cat audit-results/createtransport-usage.txt
else
    echo "✅ No createTransport usage found"
fi
echo ""

# Search for email-related functions
echo "🔎 Searching for email-related functions..."
grep -r "email" --include="*.js" --include="*.ts" functions/src/ | grep -E "(function|const|export)" > audit-results/email-functions.txt 2>/dev/null
if [ -s audit-results/email-functions.txt ]; then
    echo "📧 Found email-related functions:"
    cat audit-results/email-functions.txt
else
    echo "ℹ️  No obvious email functions found in functions/src/"
fi
echo ""

# Check Firebase Extension usage
echo "🔎 Checking Firebase Extension usage..."
grep -r "collection('mail')" --include="*.js" --include="*.ts" . > audit-results/firebase-extension-usage.txt 2>/dev/null
if [ -s audit-results/firebase-extension-usage.txt ]; then
    echo "✅ Found Firebase Extension usage:"
    cat audit-results/firebase-extension-usage.txt
else
    echo "⚠️  No Firebase Extension usage found"
fi
echo ""

# Summary
echo "📊 AUDIT SUMMARY"
echo "================"
echo "Results saved in audit-results/ directory:"
ls -la audit-results/
echo ""

echo "📋 NEXT STEPS FOR BACKGROUND AGENT:"
echo "1. Review audit-results/*.txt files"
echo "2. Create SENDGRID_AUDIT_REPORT.md with findings"
echo "3. Migrate functions to Firebase Extension pattern"
echo "4. Test each migrated function"
echo "5. Document results in EMAIL_TESTING_RESULTS.md"
echo ""

echo "📖 REFERENCE FILES:"
echo "- SENDGRID_INTEGRATION_TASK.md - Full task details"
echo "- BACKGROUND_AGENT_PROMPT.md - Quick instructions"
echo "- EMAIL_SYSTEM_STATUS.md - Current system status"
echo "- functions/src/invites.ts - Working example"
echo ""

echo "🎯 Ready for background agent to continue the audit!" 