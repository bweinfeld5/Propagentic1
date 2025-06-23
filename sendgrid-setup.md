# SendGrid Configuration for Firebase Email Extension

## SMTP Configuration Settings

When configuring the Firebase Email Extension to use SendGrid, use these settings:

### SendGrid SMTP Details:
- **SMTP Connection URI**: `smtps://apikey@smtp.sendgrid.net:465`
- **SMTP Password**: Your SendGrid API Key (starts with `SG.`)
- **Authentication Type**: Username & Password

### Alternative Format (if using port 587):
- **SMTP Connection URI**: `smtp://apikey@smtp.sendgrid.net:587`
- **Use TLS**: Yes

## Step-by-Step Setup:

1. **Get SendGrid API Key**:
   - Log in to SendGrid (https://app.sendgrid.com/)
   - Go to Settings → API Keys
   - Create a new API Key with "Mail Send" permissions
   - Copy the API key (it starts with `SG.`)

2. **Update Firebase Extension**:
   ```bash
   firebase ext:update firestore-send-email --project propagentic
   ```

3. **Configure with these parameters**:
   - Authentication Type: `Username & Password`
   - SMTP connection URI: `smtps://apikey@smtp.sendgrid.net:465`
   - SMTP password: `YOUR_SENDGRID_API_KEY`
   - Default FROM address: `no-reply@propagentic.com`
   - Email documents collection: `mail`

## Important Notes:
- The username is literally the string "apikey" (not your actual API key)
- The password is your actual SendGrid API key
- Use port 465 for SSL/TLS or port 587 for STARTTLS
- Make sure your SendGrid account has verified the sender domain 