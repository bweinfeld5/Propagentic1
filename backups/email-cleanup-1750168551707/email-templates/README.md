# PropAgentic Email Templates

This directory contains standardized email templates for all PropAgentic email communications.

## 📁 Template Structure

### Base Template (`base-template.html`)
The foundational template that provides:
- PropAgentic branding and styling
- Responsive design for mobile/desktop
- Dark mode support
- Email client compatibility
- Consistent header/footer

### Specific Templates
- `tenant-invitation.html` - Tenant invitation email content
- `contractor-notification.html` - Contractor assignment notifications
- `welcome-sequence.html` - Welcome email series
- `maintenance-update.html` - Maintenance request updates

## 🎨 Brand Guidelines

### Colors
- **Primary Brand**: `#4F46E5` (Indigo)
- **Secondary**: `#64748b` (Slate)
- **Accent**: `#7C3AED` (Purple)
- **Background**: `#f8fafc` (Light gray)
- **Text**: `#1e293b` (Dark slate)

### Typography
- **Font Family**: Arial, Helvetica, sans-serif
- **Headings**: 24px-32px, font-weight: 600
- **Body Text**: 16px, line-height: 1.6
- **Small Text**: 14px, line-height: 1.5

### Spacing
- **Container Width**: 600px max
- **Content Padding**: 30px
- **Section Margins**: 20-30px
- **Button Padding**: 16px 32px

## 🔧 Template Variables

### Common Variables
- `{{SUBJECT}}` - Email subject line
- `{{CONTENT}}` - Main email content
- `{{YEAR}}` - Current year
- `{{APP_DOMAIN}}` - Application domain
- `{{UNSUBSCRIBE_URL}}` - Unsubscribe link
- `{{SUPPORT_URL}}` - Support page link
- `{{PRIVACY_URL}}` - Privacy policy link

### Invitation Specific
- `{{LANDLORD_NAME}}` - Inviting landlord's name
- `{{PROPERTY_NAME}}` - Property name
- `{{INVITE_CODE}}` - Unique invitation code
- `{{INVITE_LINK}}` - Direct invitation link

### Contractor Specific
- `{{CONTRACTOR_NAME}}` - Contractor's name
- `{{TICKET_ID}}` - Maintenance ticket ID
- `{{ISSUE_DESCRIPTION}}` - Issue description
- `{{PROPERTY_ADDRESS}}` - Property address
- `{{CONTACT_INFO}}` - Tenant contact information

## 📧 Usage in Functions

### Method 1: Template Replacement
```javascript
import fs from 'fs';
import path from 'path';

// Load base template
const baseTemplate = fs.readFileSync(
  path.join(__dirname, '../email-templates/base-template.html'), 
  'utf8'
);

// Load content template
const invitationContent = fs.readFileSync(
  path.join(__dirname, '../email-templates/tenant-invitation.html'), 
  'utf8'
);

// Replace variables
const emailHtml = baseTemplate
  .replace('{{SUBJECT}}', 'You\'re Invited to Join PropAgentic')
  .replace('{{CONTENT}}', invitationContent
    .replace('{{LANDLORD_NAME}}', landlordName)
    .replace('{{PROPERTY_NAME}}', propertyName)
    .replace('{{INVITE_CODE}}', inviteCode)
    .replace('{{INVITE_LINK}}', inviteLink)
  )
  .replace('{{YEAR}}', new Date().getFullYear())
  .replace('{{APP_DOMAIN}}', appDomain);
```

### Method 2: Inline Template (Current Method)
```javascript
// Current method used in functions/src/invites.ts
const emailData = {
  to: tenantEmail,
  message: {
    subject: `You're Invited to Join ${propertyName} on PropAgentic`,
    html: `<!-- Inline HTML template -->`,
    text: `Plain text version`
  }
};

await db.collection('mail').add(emailData);
```

## 🚀 Migration Recommendations

### Step 1: Extract Current Templates
Move existing inline HTML templates to separate files:
1. `functions/src/invites.ts` → `email-templates/tenant-invitation.html`
2. `functions/src/notifyAssignedContractor.ts` → `email-templates/contractor-notification.html`
3. `functions/src/emailSequences.js` → `email-templates/welcome-sequence.html`

### Step 2: Create Template Engine
```javascript
// email-templates/template-engine.js
class EmailTemplateEngine {
  static render(templateName, variables) {
    const baseTemplate = this.loadTemplate('base-template');
    const contentTemplate = this.loadTemplate(templateName);
    
    let content = contentTemplate;
    let email = baseTemplate;
    
    // Replace content variables
    Object.keys(variables).forEach(key => {
      content = content.replace(new RegExp(`{{${key}}}`, 'g'), variables[key]);
    });
    
    // Replace base template variables
    email = email.replace('{{CONTENT}}', content);
    email = email.replace('{{YEAR}}', new Date().getFullYear());
    
    return email;
  }
  
  static loadTemplate(name) {
    return fs.readFileSync(`email-templates/${name}.html`, 'utf8');
  }
}
```

### Step 3: Update Functions
```javascript
// In functions/src/invites.ts
const emailHtml = EmailTemplateEngine.render('tenant-invitation', {
  LANDLORD_NAME: landlordName,
  PROPERTY_NAME: propertyName,
  INVITE_CODE: inviteCode,
  INVITE_LINK: inviteLink,
  APP_DOMAIN: appDomain
});

const emailData = {
  to: tenantEmail,
  message: {
    subject: `You're Invited to Join ${propertyName} on PropAgentic`,
    html: emailHtml,
    text: generatePlainText(emailHtml) // Helper function
  }
};
```

## 📱 Responsive Design

Templates are designed to work across:
- **Desktop**: Outlook, Apple Mail, Gmail
- **Mobile**: iOS Mail, Android Gmail
- **Web**: Gmail, Yahoo, Outlook.com

### Responsive Breakpoints
- Desktop: 600px+
- Mobile: <600px
- Email client specific adjustments

## 🔒 Security Considerations

### Email Client Compatibility
- No external CSS files
- Inline styles for critical formatting
- Fallback fonts specified
- Image dimensions specified

### Privacy & Compliance
- Unsubscribe links required
- Privacy policy links included
- GDPR compliance considerations
- CAN-SPAM Act compliance

## 🧪 Testing Checklist

### Before Deployment
- [ ] Test in major email clients
- [ ] Verify responsive design
- [ ] Check all links work
- [ ] Validate HTML markup
- [ ] Test variable replacement
- [ ] Verify accessibility

### Email Clients to Test
- [ ] Gmail (Web, Mobile)
- [ ] Outlook (Desktop, Web)
- [ ] Apple Mail (Desktop, Mobile)
- [ ] Yahoo Mail
- [ ] Android Gmail
- [ ] iOS Mail

## 📈 Performance Optimization

### Image Optimization
- Use optimized images
- Specify dimensions
- Include alt text
- Consider email client blocking

### Template Size
- Keep HTML under 100KB
- Minimize inline CSS
- Remove unnecessary whitespace
- Compress images

## 🔄 Version Control

### Template Versioning
- Version templates when making changes
- Test thoroughly before deployment
- Keep backup of working versions
- Document changes in commit messages

### Deployment Process
1. Update template files
2. Test in staging environment
3. Deploy to production
4. Monitor delivery rates
5. Rollback if issues occur

---

## 📞 Support & Maintenance

For questions about email templates:
- Check function implementations
- Review SendGrid dashboard
- Monitor email delivery rates
- Update templates based on feedback

*Email templates maintained by PropAgentic Development Team*