import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import UnifiedInviteEmail, { 
  UnifiedInviteEmailProps, 
  getEmailSubject, 
  getEmailPreheader,
  generateInviteUrl 
} from '../components/emails/UnifiedInviteEmail';

export interface SendInviteEmailParams {
  tenantEmail: string;
  inviteCode: string;
  landlordName: string;
  propertyName: string;
  unitInfo?: string;
  appDomain?: string;
}

/**
 * Unified Email Service - Replaces all scattered email template logic
 * 
 * This service consolidates all invitation email functionality using the
 * UnifiedInviteEmail component and provides a clean API for sending emails.
 */
export class UnifiedEmailService {
  private readonly defaultAppDomain = 'https://propagentic.com';

  /**
   * Generate HTML content for invitation email using the unified template
   */
  generateInviteEmailHtml(params: SendInviteEmailParams): string {
    const {
      tenantEmail,
      inviteCode,
      landlordName,
      propertyName,
      unitInfo,
      appDomain = this.defaultAppDomain
    } = params;

    const inviteUrl = generateInviteUrl(appDomain, inviteCode);

    const emailProps: UnifiedInviteEmailProps = {
      inviteId: inviteCode,
      propertyName,
      landlordName,
      unitInfo,
      inviteUrl,
      inviteCode,
      appDomain,
      tenantEmail
    };

    // Render React component to static HTML
    const htmlContent = renderToStaticMarkup(
      createElement(UnifiedInviteEmail, emailProps)
    );

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${getEmailSubject(propertyName)}</title>
  <meta name="description" content="${getEmailPreheader(landlordName, propertyName)}">
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Email client compatibility styles */
    @media only screen and (max-width: 600px) {
      .mobile-padding { padding: 20px !important; }
      .mobile-text { font-size: 16px !important; }
      .mobile-button { 
        padding: 16px 24px !important; 
        font-size: 16px !important; 
      }
    }
    
    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .dark-mode-bg { background-color: #1f2937 !important; }
      .dark-mode-text { color: #f9fafb !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc;">
  ${htmlContent}
</body>
</html>`;
  }

  /**
   * Generate plain text version of invitation email
   */
  generateInviteEmailText(params: SendInviteEmailParams): string {
    const {
      tenantEmail,
      inviteCode,
      landlordName,
      propertyName,
      unitInfo,
      appDomain = this.defaultAppDomain
    } = params;

    const inviteUrl = generateInviteUrl(appDomain, inviteCode);
    const currentYear = new Date().getFullYear();

    return `
PROPAGENTIC - Property Management, Simplified

You've Been Invited!

${landlordName} has invited you to join ${propertyName}${unitInfo ? ` (${unitInfo})` : ''} on PropAgentic, our AI-powered property management platform that makes renting easier for everyone.

YOUR INVITATION CODE: ${inviteCode}
⏰ This code is valid for 7 days

ACCEPT INVITATION: ${inviteUrl}

What you'll get with PropAgentic:
• Easy online rent payments with multiple payment options
• Submit maintenance requests instantly with photo uploads  
• Direct communication with your landlord and contractors
• Access important documents, leases, and notices 24/7
• AI-powered assistance for faster issue resolution
• Mobile-friendly platform accessible anywhere

Can't click the link? You can also manually enter your invitation code after creating an account at ${appDomain}

Need help? Contact our support team at support@propagentic.com or visit our help center.

---
This is an automated message from PropAgentic. Please do not reply to this email.
If you have questions, please contact your landlord: ${landlordName}

Privacy Policy: ${appDomain}/privacy
Unsubscribe: ${appDomain}/unsubscribe?email=${encodeURIComponent(tenantEmail)}
Help Center: ${appDomain}/help

© ${currentYear} PropAgentic. All rights reserved.
    `.trim();
  }

  /**
   * Get email subject line
   */
  getSubject(propertyName: string): string {
    return getEmailSubject(propertyName);
  }

  /**
   * Get email preheader
   */
  getPreheader(landlordName: string, propertyName: string): string {
    return getEmailPreheader(landlordName, propertyName);
  }

  /**
   * Generate complete email data for Firebase mail collection
   */
  generateEmailData(params: SendInviteEmailParams) {
    const { tenantEmail, propertyName, landlordName } = params;

    return {
      to: tenantEmail,
      message: {
        subject: this.getSubject(propertyName),
        html: this.generateInviteEmailHtml(params),
        text: this.generateInviteEmailText(params),
        // Add preheader for better email client support
        headers: {
          'X-Preheader': this.getPreheader(landlordName, propertyName)
        }
      }
    };
  }
}

// Export singleton instance
export const unifiedEmailService = new UnifiedEmailService();

// Export for backward compatibility
export default unifiedEmailService; 