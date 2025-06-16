#!/usr/bin/env node

/**
 * SendGrid Setup Automation Script
 * Automates SendGrid configuration and verification process
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class SendGridSetup {
  constructor() {
    this.projectRoot = process.cwd();
    this.logFile = path.join(this.projectRoot, '.taskmaster/logs/sendgrid-setup.log');
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}\\n`;
    
    console.log(logEntry.trim());
    
    if (!fs.existsSync(path.dirname(this.logFile))) {
      fs.mkdirSync(path.dirname(this.logFile), { recursive: true });
    }
    fs.appendFileSync(this.logFile, logEntry);
  }

  async checkSendGridConfig() {
    this.log('Checking SendGrid configuration...');
    
    try {
      const config = execSync('cd functions && firebase functions:config:get', { encoding: 'utf8' });
      const parsedConfig = JSON.parse(config);
      
      if (parsedConfig.sendgrid && parsedConfig.sendgrid.api_key) {
        this.log('SendGrid API key found in Firebase config', 'SUCCESS');
        return true;
      } else {
        this.log('SendGrid API key not found in Firebase config', 'ERROR');
        return false;
      }
    } catch (error) {
      this.log(`Error checking SendGrid config: ${error.message}`, 'ERROR');
      return false;
    }
  }

  async testEmailSending() {
    this.log('Testing email sending capability...');
    
    try {
      // Test the deployed function
      const result = execSync('cd functions && firebase functions:call testSendGrid', { 
        encoding: 'utf8',
        timeout: 30000 
      });
      
      if (result.includes('success') && !result.includes('error')) {
        this.log('Email sending test passed', 'SUCCESS');
        return true;
      } else {
        this.log(`Email sending test failed: ${result}`, 'ERROR');
        return false;
      }
    } catch (error) {
      this.log(`Email sending test error: ${error.message}`, 'ERROR');
      return false;
    }
  }

  async deployEmailFunctions() {
    this.log('Deploying email functions...');
    
    try {
      // Deploy only the email-related functions
      const result = execSync('cd functions && firebase deploy --only functions:sendInviteEmail,testSendGrid,testPing', {
        encoding: 'utf8',
        timeout: 300000 // 5 minutes
      });
      
      if (result.includes('Deploy complete')) {
        this.log('Email functions deployed successfully', 'SUCCESS');
        return true;
      } else {
        this.log(`Function deployment failed: ${result}`, 'ERROR');
        return false;
      }
    } catch (error) {
      this.log(`Function deployment error: ${error.message}`, 'ERROR');
      return false;
    }
  }

  generateVerificationGuide() {
    const guide = `
🔧 SENDGRID SENDER VERIFICATION GUIDE

To complete the email infrastructure setup, you need to verify sender emails in SendGrid:

STEP 1: Access SendGrid Dashboard
- Go to: https://app.sendgrid.com
- Log in with your SendGrid account

STEP 2: Navigate to Sender Authentication
- Click "Settings" in the left sidebar
- Click "Sender Authentication"

STEP 3: Verify Single Sender
- Click "Verify a Single Sender"
- Add email: noreply@propagentic.com
- Fill in the required information:
  * From Name: PropAgentic
  * From Email: noreply@propagentic.com
  * Reply To: support@propagentic.com
  * Company Address: Your company address
  * City, State, Zip: Your company location
  * Country: Your country

STEP 4: Check Email and Verify
- Check the email inbox for noreply@propagentic.com
- Click the verification link in the email
- Return to SendGrid dashboard to confirm verification

STEP 5: Optional - Add Additional Senders
- Repeat the process for: support@propagentic.com
- This provides a backup sender address

STEP 6: Test Email Sending
- Run: node .taskmaster/scripts/automation/sendgrid-setup.js test
- This will verify that emails can be sent successfully

TROUBLESHOOTING:
- If you don't have access to noreply@propagentic.com, use an email you control
- Update the sender email in functions/src/sendgridEmailService.ts
- Redeploy functions after making changes

Once verification is complete, the background agent will automatically detect the change and proceed with the next tasks.
    `;

    console.log(guide);
    
    // Save guide to file
    const guideFile = path.join(this.projectRoot, '.taskmaster/docs/sendgrid-verification-guide.md');
    fs.writeFileSync(guideFile, guide);
    
    this.log('SendGrid verification guide generated');
    return guide;
  }

  async createTestEmailScript() {
    const testScript = `#!/usr/bin/env node

/**
 * SendGrid Email Test Script
 * Tests email sending with current configuration
 */

const sgMail = require('@sendgrid/mail');

// Get SendGrid API key from environment or Firebase config
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

if (!SENDGRID_API_KEY) {
  console.error('❌ SendGrid API key not found');
  process.exit(1);
}

sgMail.setApiKey(SENDGRID_API_KEY);

async function testEmail() {
  const msg = {
    to: 'bweinfeld15@gmail.com', // Change to your test email
    from: 'noreply@propagentic.com', // Must be verified in SendGrid
    subject: 'PropAgentic Email Test',
    text: 'This is a test email from PropAgentic to verify SendGrid integration.',
    html: '<strong>This is a test email from PropAgentic to verify SendGrid integration.</strong>',
  };

  try {
    console.log('🚀 Sending test email...');
    console.log(\`From: \${msg.from}\`);
    console.log(\`To: \${msg.to}\`);
    
    await sgMail.send(msg);
    console.log('✅ Test email sent successfully!');
    console.log('📧 Check your inbox for the test email.');
    return true;
  } catch (error) {
    console.error('❌ Error sending test email:');
    console.error(error.response ? error.response.body : error.message);
    
    if (error.response && error.response.body.errors) {
      error.response.body.errors.forEach(err => {
        console.error(\`   - \${err.message}\`);
      });
    }
    return false;
  }
}

if (require.main === module) {
  testEmail().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = testEmail;
`;

    const testFile = path.join(this.projectRoot, '.taskmaster/scripts/automation/test-email.js');
    fs.writeFileSync(testFile, testScript);
    fs.chmodSync(testFile, '755');
    
    this.log('Test email script created');
    return testFile;
  }

  async run(command = 'setup') {
    this.log('Starting SendGrid setup automation...');
    
    try {
      switch (command) {
        case 'setup':
          await this.runSetup();
          break;
        case 'test':
          await this.runTest();
          break;
        case 'deploy':
          await this.deployEmailFunctions();
          break;
        case 'guide':
          this.generateVerificationGuide();
          break;
        default:
          this.showUsage();
      }
    } catch (error) {
      this.log(`SendGrid setup error: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  async runSetup() {
    this.log('Running complete SendGrid setup...');
    
    // Step 1: Check configuration
    const configOk = await this.checkSendGridConfig();
    if (!configOk) {
      this.log('SendGrid configuration missing or invalid', 'ERROR');
      return false;
    }

    // Step 2: Deploy functions
    const deployOk = await this.deployEmailFunctions();
    if (!deployOk) {
      this.log('Function deployment failed', 'ERROR');
      return false;
    }

    // Step 3: Test email sending
    const testOk = await this.testEmailSending();
    if (!testOk) {
      this.log('Email sending test failed - sender verification likely needed', 'WARN');
      this.generateVerificationGuide();
      await this.createTestEmailScript();
      return false;
    }

    this.log('SendGrid setup completed successfully!', 'SUCCESS');
    return true;
  }

  async runTest() {
    this.log('Running SendGrid test...');
    
    const configOk = await this.checkSendGridConfig();
    if (!configOk) {
      this.log('SendGrid not configured', 'ERROR');
      return false;
    }

    const testOk = await this.testEmailSending();
    if (testOk) {
      this.log('SendGrid test passed!', 'SUCCESS');
    } else {
      this.log('SendGrid test failed', 'ERROR');
      this.generateVerificationGuide();
    }
    
    return testOk;
  }

  showUsage() {
    console.log(`
SendGrid Setup Automation

Usage:
  node sendgrid-setup.js setup   - Run complete setup process
  node sendgrid-setup.js test    - Test email sending capability
  node sendgrid-setup.js deploy  - Deploy email functions only
  node sendgrid-setup.js guide   - Show verification guide

The setup process will:
1. Check SendGrid configuration
2. Deploy email functions
3. Test email sending
4. Generate verification guide if needed
    `);
  }
}

// CLI interface
if (require.main === module) {
  const setup = new SendGridSetup();
  const command = process.argv[2] || 'setup';
  
  setup.run(command).catch(error => {
    console.error('Setup failed:', error.message);
    process.exit(1);
  });
}

module.exports = SendGridSetup; 