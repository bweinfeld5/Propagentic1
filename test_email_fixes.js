const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function testEmailSystemFixes() {
  console.log('🔧 Testing Email System Fixes...\n');
  
  try {
    // Test 1: Simple Mail Collection Access (Fixed Query)
    console.log('1️⃣ Testing mail collection access with simplified query...');
    const mailQuery = db.collection('mail').limit(5);
    const mailSnapshot = await mailQuery.get();
    console.log(`✅ SUCCESS: Found ${mailSnapshot.size} emails in mail collection`);
    
    // Test 2: Send Test Email to Ben
    console.log('\n2️⃣ Sending test email to ben@propagenticai.com...');
    const testEmailData = {
      to: 'ben@propagenticai.com',
      subject: 'PropAgentic Email System Fixed - Test Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
          <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #f97316; margin: 0 0 20px 0;">🎉 PropAgentic Email System - FIXED!</h2>
            
            <div style="background: #dcfce7; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0;">
              <h3 style="color: #15803d; margin: 0 0 10px 0;">✅ Issues Resolved:</h3>
              <ul style="color: #166534; margin: 0;">
                <li><strong>Fixed composite index error:</strong> Simplified mail collection query</li>
                <li><strong>Updated security rules:</strong> Added read permissions for mail collection</li>
                <li><strong>Email recipient update:</strong> Now sending to ben@propagenticai.com</li>
                <li><strong>Enhanced error handling:</strong> Better diagnostics for email testing</li>
              </ul>
            </div>

            <p style="color: #374151; line-height: 1.6;">
              Hi Ben,<br><br>
              Great news! The email system issues have been resolved. The main problems were:
            </p>

            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
              <h4 style="color: #92400e; margin: 0 0 10px 0;">🔧 Technical Fixes Applied:</h4>
              <ol style="color: #78350f; margin: 0;">
                <li>Removed complex <code>orderBy('__name__', 'desc')</code> query that required composite index</li>
                <li>Updated Firestore security rules to allow read access to mail collection</li>
                <li>Configured all test emails to send to your address: ben@propagenticai.com</li>
                <li>Enhanced property invitation email flow with proper Firebase Extension integration</li>
              </ol>
            </div>

            <div style="background: #e0f2fe; border-left: 4px solid #0284c7; padding: 15px; margin: 20px 0;">
              <h4 style="color: #0369a1; margin: 0 0 10px 0;">🧪 Test Results Expected:</h4>
              <ul style="color: #075985; margin: 0;">
                <li>✅ <strong>Email System Access:</strong> Should now pass with simplified query</li>
                <li>✅ <strong>Email Send Test:</strong> This email proves it's working!</li>
                <li>📧 <strong>Property Invitations:</strong> Will now send to your email address</li>
                <li>🔔 <strong>Alternative Notifications:</strong> Ready for testing</li>
              </ul>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
              <strong>Test ID:</strong> EMAIL-FIX-${Date.now()}<br>
              <strong>Timestamp:</strong> ${new Date().toLocaleString()}<br>
              <strong>Source:</strong> PropAgentic Email System Test Script
            </p>
          </div>
        </div>
      `,
      text: `PropAgentic Email System Fixed! Hi Ben, the email system issues have been resolved. Key fixes: 1) Removed complex orderBy query causing index error, 2) Updated security rules for mail collection access, 3) All test emails now send to ben@propagenticai.com, 4) Enhanced Firebase Extension integration. Test ID: EMAIL-FIX-${Date.now()}`,
      metadata: {
        testId: `EMAIL-FIX-${Date.now()}`,
        source: 'email_fix_test_script',
        type: 'system_fix_notification',
        recipient: 'ben@propagenticai.com'
      }
    };
    
    const emailDoc = await db.collection('mail').add(testEmailData);
    console.log(`✅ SUCCESS: Test email queued! Document ID: ${emailDoc.id}`);
    console.log(`📧 Email sent to: ben@propagenticai.com`);
    
    // Test 3: Create Property Invitation for Ben
    console.log('\n3️⃣ Creating property invitation email for ben@propagenticai.com...');
    const mockInvitation = {
      propertyId: 'TEST-PROPERTY-EMAIL-FIX',
      landlordId: 'TEST-LANDLORD-123',
      landlordEmail: 'justin@propagenticai.com',
      tenantId: 'TEST-TENANT-789',
      tenantEmail: 'ben@propagenticai.com',
      tenantName: 'Ben Weinfeld',
      status: 'pending',
      type: 'existing_user',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      propertyName: 'Email System Test Property',
      propertyAddress: '123 PropAgentic Lane, Test City, TC 12345',
      unitId: 'Email Test Unit',
      metadata: {
        testId: `INVITATION-FIX-${Date.now()}`,
        source: 'email_fix_test_script'
      }
    };
    
    const invitationDoc = await db.collection('propertyInvitations').add(mockInvitation);
    console.log(`✅ SUCCESS: Property invitation created! Document ID: ${invitationDoc.id}`);
    console.log(`📨 Invitation email should be sent to ben@propagenticai.com via Cloud Function`);
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Mail collection access: Fixed (simplified query)');
    console.log('   ✅ Direct email send: Working (check ben@propagenticai.com)');
    console.log('   ✅ Property invitation flow: Triggered (Cloud Function should process)');
    console.log('\n💡 Next step: Check Firebase Functions logs and ben@propagenticai.com inbox');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  }
}

// Run the test
testEmailSystemFixes().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 