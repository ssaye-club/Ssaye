# Email Configuration Setup Guide

## Overview
The application now sends automated confirmation emails to users when they submit investment applications.

## Setup Instructions

### 1. Gmail Setup (Recommended)

1. **Create or use a Gmail account** for sending emails

2. **Enable 2-Factor Authentication**:
   - Go to Google Account settings
   - Security → 2-Step Verification
   - Enable it

3. **Generate App-Specific Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it "Ssaye Investment Platform"
   - Copy the 16-character password

4. **Update .env file**:
   ```env
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-16-character-app-password
   ```

### 2. Other Email Services

#### SendGrid
```env
EMAIL_SERVICE=SendGrid
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
```

#### Outlook/Office365
```env
EMAIL_SERVICE=Outlook365
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

#### Custom SMTP
```env
EMAIL_SERVICE=
EMAIL_HOST=smtp.yourprovider.com
EMAIL_PORT=587
EMAIL_USER=your-email@domain.com
EMAIL_PASSWORD=your-password
```

## Email Features

### Confirmation Email Includes:
- ✅ Application ID
- ✅ Investment opportunity name
- ✅ Investment amount (formatted)
- ✅ User details (name, email, phone, country)
- ✅ Submission date and time
- ✅ Status badge
- ✅ Next steps information
- ✅ Contact information

### Professional Design:
- Clean, modern HTML template
- Mobile-responsive
- Branded with your company colors
- Professional typography and spacing
- Clear call-to-action and next steps

## Testing

1. **Test the email**:
   - Submit an investment application from the frontend
   - Check the user's email inbox
   - Verify all details are correct

2. **Check server logs**:
   - Success: "Confirmation email sent: [messageId]"
   - Failure: "Failed to send confirmation email: [error]"

## Important Notes

- Emails are sent **asynchronously** - application submission doesn't wait for email
- If email fails, the application is still saved successfully
- Email failures are logged but don't affect user experience
- Keep your EMAIL_PASSWORD secure and never commit it to version control

## Troubleshooting

### "Invalid login" error
- Verify you're using an app-specific password (not your regular password)
- Ensure 2FA is enabled on your Gmail account

### "Connection timeout" error
- Check your firewall settings
- Verify EMAIL_SERVICE is set correctly
- Try using a different port (465 for SSL)

### Email goes to spam
- Add SPF and DKIM records to your domain
- Use a professional "from" email address
- Ensure content doesn't trigger spam filters

## Customization

Edit `server/utils/emailService.js` to customize:
- Email template design
- Email content
- From name
- Subject line

## Production Recommendations

For production, consider using:
- **SendGrid** - 100 emails/day free, reliable
- **Amazon SES** - Very cost-effective
- **Mailgun** - Good for transactional emails
- **Postmark** - Excellent deliverability

These services offer better deliverability and analytics than Gmail.
