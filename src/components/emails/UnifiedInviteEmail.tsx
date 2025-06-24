import React from 'react';

export interface UnifiedInviteEmailProps {
  inviteId: string;
  propertyName: string;
  landlordName: string;
  unitInfo?: string;
  inviteUrl: string;
  inviteCode: string;
  appDomain?: string;
  tenantEmail: string;
}

/**
 * UnifiedInviteEmail - Consolidates all invitation email best practices
 * 
 * Features extracted from analysis:
 * - Subject: "You're Invited to Join {propertyName} on PropAgentic" (highest engagement)
 * - Preheader: Dynamic greeting with landlord name
 * - Clear visual hierarchy with branded header
 * - Prominent invitation code display with expiration notice
 * - Benefits section with checkmarks
 * - Bold CTA button with gradient styling
 * - Alternative instructions for accessibility
 * - Support section with contact info
 * - Consistent PropAgentic branding with Tailwind tokens
 */
const UnifiedInviteEmail: React.FC<UnifiedInviteEmailProps> = ({
  inviteId,
  propertyName,
  landlordName,
  unitInfo,
  inviteUrl,
  inviteCode,
  appDomain = 'https://propagentic.com',
  tenantEmail
}) => {
  const currentYear = new Date().getFullYear();
  
  // Generate subject line for external use
  const getSubjectLine = () => `You're Invited to Join ${propertyName} on PropAgentic`;
  
  // Generate preheader for external use
  const getPreheader = () => `${landlordName} has invited you to join ${propertyName}. Get started with easy rent payments and maintenance requests.`;

  return (
    <div style={{
      fontFamily: 'Arial, Helvetica, sans-serif',
      maxWidth: '600px',
      margin: '0 auto',
      backgroundColor: '#ffffff',
      color: '#1e293b'
    }}>
      {/* Email Header with PropAgentic Branding */}
      <div style={{
        background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
        padding: '40px 30px',
        textAlign: 'center' as const,
        borderRadius: '12px 12px 0 0'
      }}>
        <h1 style={{
          color: '#ffffff',
          margin: '0 0 8px 0',
          fontSize: '32px',
          fontWeight: '700',
          letterSpacing: '-0.5px'
        }}>
          PropAgentic
        </h1>
        <p style={{
          color: 'rgba(255, 255, 255, 0.9)',
          margin: '0',
          fontSize: '16px',
          fontWeight: '500'
        }}>
          Property Management, Simplified
        </p>
      </div>

      {/* Main Content */}
      <div style={{ padding: '40px 30px' }}>
        {/* Welcome Header */}
        <h2 style={{
          color: '#1e293b',
          fontSize: '28px',
          margin: '0 0 24px 0',
          fontWeight: '600',
          textAlign: 'center' as const
        }}>
          You've Been Invited! 🎉
        </h2>

        {/* Dynamic Greeting */}
        <p style={{
          fontSize: '18px',
          lineHeight: '1.6',
          color: '#374151',
          margin: '0 0 32px 0',
          textAlign: 'center' as const
        }}>
          <strong style={{ color: '#4F46E5' }}>{landlordName}</strong> has invited you to join{' '}
          <strong style={{ color: '#4F46E5' }}>{propertyName}</strong>
          {unitInfo && <span> ({unitInfo})</span>} on PropAgentic, 
          our AI-powered property management platform that makes renting easier for everyone.
        </p>

        {/* Invitation Code Box - Enhanced Design */}
        <div style={{
          background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
          borderLeft: '4px solid #4F46E5',
          padding: '24px',
          borderRadius: '12px',
          textAlign: 'center' as const,
          margin: '32px 0',
          boxShadow: '0 4px 12px rgba(79, 70, 229, 0.1)'
        }}>
          <p style={{
            margin: '0 0 12px 0',
            fontWeight: '600',
            color: '#1e293b',
            fontSize: '16px'
          }}>
            Your Invitation Code
          </p>
          <p style={{
            fontSize: '36px',
            letterSpacing: '4px',
            color: '#4F46E5',
            margin: '16px 0',
            fontWeight: 'bold',
            fontFamily: '"Courier New", monospace'
          }}>
            {inviteCode}
          </p>
          <p style={{
            margin: '12px 0 0 0',
            fontSize: '14px',
            color: '#64748b',
            fontWeight: '500'
          }}>
            ⏰ This code is valid for 7 days
          </p>
        </div>

        {/* Primary CTA Button - Enhanced Styling */}
        <div style={{ textAlign: 'center' as const, margin: '40px 0' }}>
          <a
            href={inviteUrl}
            style={{
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              color: '#ffffff',
              padding: '18px 36px',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '18px',
              display: 'inline-block',
              boxShadow: '0 8px 20px rgba(79, 70, 229, 0.3)',
              transition: 'all 0.3s ease',
              letterSpacing: '0.5px'
            }}
          >
            🚀 Accept Invitation
          </a>
        </div>

        {/* Benefits Section - Enhanced with Icons */}
        <div style={{
          backgroundColor: '#f8fafc',
          padding: '32px 24px',
          borderRadius: '12px',
          margin: '32px 0',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{
            color: '#1e293b',
            fontSize: '20px',
            margin: '0 0 20px 0',
            fontWeight: '600',
            textAlign: 'center' as const
          }}>
            ✨ What you'll get with PropAgentic:
          </h3>
          <div style={{ display: 'grid', gap: '16px' }}>
            {[
              { icon: '💳', text: 'Easy online rent payments with multiple payment options' },
              { icon: '🔧', text: 'Submit maintenance requests instantly with photo uploads' },
              { icon: '💬', text: 'Direct communication with your landlord and contractors' },
              { icon: '📄', text: 'Access important documents, leases, and notices 24/7' },
              { icon: '🤖', text: 'AI-powered assistance for faster issue resolution' },
              { icon: '📱', text: 'Mobile-friendly platform accessible anywhere' }
            ].map((benefit, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
              }}>
                <span style={{
                  fontSize: '18px',
                  marginTop: '2px'
                }}>
                  {benefit.icon}
                </span>
                <span style={{
                  color: '#374151',
                  fontSize: '15px',
                  lineHeight: '1.5',
                  fontWeight: '500'
                }}>
                  {benefit.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Alternative Instructions */}
        <div style={{
          borderTop: '2px solid #e5e7eb',
          paddingTop: '24px',
          margin: '32px 0'
        }}>
          <p style={{
            fontSize: '14px',
            color: '#6b7280',
            lineHeight: '1.6',
            margin: '0 0 16px 0',
            textAlign: 'center' as const
          }}>
            <strong style={{ color: '#374151' }}>Can't click the button?</strong>
            <br />
            You can also manually enter your invitation code after creating an account at{' '}
            <a
              href={appDomain}
              style={{
                color: '#4F46E5',
                textDecoration: 'none',
                fontWeight: '600'
              }}
            >
              {appDomain}
            </a>
          </p>
        </div>

        {/* Support Section */}
        <div style={{
          backgroundColor: '#fef3c7',
          border: '1px solid #fbbf24',
          padding: '20px',
          borderRadius: '8px',
          margin: '24px 0'
        }}>
          <p style={{
            margin: '0',
            fontSize: '14px',
            color: '#92400e',
            lineHeight: '1.6',
            textAlign: 'center' as const
          }}>
            <strong>Need help?</strong> Contact our support team at{' '}
            <a
              href="mailto:support@propagentic.com"
              style={{
                color: '#92400e',
                textDecoration: 'none',
                fontWeight: '600'
              }}
            >
              support@propagentic.com
            </a>
            {' '}or visit our help center.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        backgroundColor: '#f8fafc',
        padding: '32px 30px',
        textAlign: 'center' as const,
        borderTop: '1px solid #e2e8f0',
        borderRadius: '0 0 12px 12px'
      }}>
        <p style={{
          margin: '0 0 12px 0',
          fontSize: '12px',
          color: '#64748b',
          lineHeight: '1.5'
        }}>
          This is an automated message from PropAgentic. Please do not reply to this email.
        </p>
        <p style={{
          margin: '0 0 12px 0',
          fontSize: '12px',
          color: '#64748b'
        }}>
          If you have questions, please contact your landlord: <strong>{landlordName}</strong>
        </p>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '20px',
          margin: '16px 0 12px 0',
          flexWrap: 'wrap' as const
        }}>
          <a
            href={`${appDomain}/privacy`}
            style={{
              color: '#64748b',
              textDecoration: 'none',
              fontSize: '12px',
              fontWeight: '500'
            }}
          >
            Privacy Policy
          </a>
          <a
            href={`${appDomain}/unsubscribe?email=${encodeURIComponent(tenantEmail)}`}
            style={{
              color: '#64748b',
              textDecoration: 'none',
              fontSize: '12px',
              fontWeight: '500'
            }}
          >
            Unsubscribe
          </a>
          <a
            href={`${appDomain}/help`}
            style={{
              color: '#64748b',
              textDecoration: 'none',
              fontSize: '12px',
              fontWeight: '500'
            }}
          >
            Help Center
          </a>
        </div>
        <p style={{
          margin: '0',
          fontSize: '12px',
          color: '#9ca3af'
        }}>
          © {currentYear} PropAgentic. All rights reserved.
        </p>
      </div>
    </div>
  );
};

// Export helper functions for external use
export const getEmailSubject = (propertyName: string): string => 
  `You're Invited to Join ${propertyName} on PropAgentic`;

export const getEmailPreheader = (landlordName: string, propertyName: string): string => 
  `${landlordName} has invited you to join ${propertyName}. Get started with easy rent payments and maintenance requests.`;

export const generateInviteUrl = (appDomain: string, inviteId: string): string => 
  `${appDomain}/invite?code=${inviteId}`;

export default UnifiedInviteEmail; 