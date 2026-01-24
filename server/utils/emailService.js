const nodemailer = require('nodemailer');

// Create a single reusable transporter with connection pooling
let transporter = null;

const createTransporter = () => {
  if (transporter) {
    return transporter;
  }

  // If EMAIL_SERVICE is set, use predefined service (Gmail, Outlook, etc.)
  if (process.env.EMAIL_SERVICE) {
    transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      pool: true, // Enable connection pooling
      maxConnections: 5, // Max simultaneous connections
      maxMessages: 100, // Max messages per connection
      rateDelta: 1000, // Time between messages (1 second)
      rateLimit: 5 // Max 5 messages per rateDelta
    });
  } else {
    // Otherwise, use custom SMTP settings
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      pool: true, // Enable connection pooling
      maxConnections: 5, // Max simultaneous connections
      maxMessages: 100, // Max messages per connection
      rateDelta: 1000, // Time between messages (1 second)
      rateLimit: 5 // Max 5 messages per rateDelta
    });
  }

  // Verify connection configuration
  transporter.verify((error, success) => {
    if (error) {
      console.error('SMTP connection verification failed:', error);
    } else {
      console.log('SMTP server is ready to send emails');
    }
  });

  return transporter;
};

// Helper function to send email with retry logic
const sendEmailWithRetry = async (mailOptions, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const currentTransporter = createTransporter();
      const info = await currentTransporter.sendMail(mailOptions);
      return info;
    } catch (error) {
      console.error(`Email send attempt ${attempt} failed:`, error.message);
      
      // If it's an auth error and not the last attempt, reset the transporter
      if (error.code === 'EAUTH' && attempt < maxRetries) {
        console.log('Authentication error detected. Resetting transporter...');
        closeTransporter(); // Close and reset the module-level transporter
        
        // Wait before retrying (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // If it's the last attempt or a different error, throw it
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Close transporter connection (useful for graceful shutdown)
const closeTransporter = () => {
  if (transporter) {
    transporter.close();
    transporter = null;
    console.log('Email transporter connection closed');
  }
};

// Format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Send investment application confirmation email
const sendInvestmentConfirmationEmail = async (applicationData) => {
  try {
    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1a202c;
            background-color: #f5f7fa;
            margin: 0;
            padding: 0;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
          }
          .header {
            background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
            padding: 2rem;
            text-align: center;
          }
          .header h1 {
            color: #60a5fa !important;
            margin: 0;
            font-size: 1.75rem;
            font-weight: 700;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          }
          .header p {
            color: #cbd5e1 !important;
            margin: 0.5rem 0 0 0;
            font-size: 0.938rem;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
          }
          .content {
            padding: 2rem;
          }
          .greeting {
            font-size: 1.125rem;
            color: #1a202c;
            margin-bottom: 1rem;
          }
          .message {
            color: #64748b;
            margin-bottom: 2rem;
            font-size: 0.938rem;
          }
          .details-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 2rem;
          }
          .details-box h2 {
            color: #1a202c;
            font-size: 1.25rem;
            margin: 0 0 1.5rem 0;
            font-weight: 700;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.75rem 0;
            border-bottom: 1px solid #e2e8f0;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
          .detail-label {
            color: #64748b;
            font-weight: 600;
            font-size: 0.875rem;
            flex-shrink: 0;
            margin-right: 1rem;
          }
          .detail-value {
            color: #1a202c;
            font-weight: 600;
            text-align: right;
            font-size: 0.938rem;
            margin-left: auto;
            padding-left: 1rem;
          }
          .detail-value.highlight {
            color: #10b981;
            font-weight: 700;
            font-size: 1.125rem;
          }
          .status-badge {
            display: inline-block;
            padding: 0.375rem 0.875rem;
            background: #fef3c7;
            color: #92400e;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
          }
          .next-steps {
            background: #eff6ff;
            border-left: 4px solid #3b82f6;
            padding: 1.5rem;
            margin: 2rem 0;
            border-radius: 8px;
          }
          .next-steps h3 {
            color: #1e40af;
            margin: 0 0 1rem 0;
            font-size: 1rem;
          }
          .next-steps ul {
            margin: 0;
            padding-left: 1.25rem;
            color: #1e3a8a;
          }
          .next-steps li {
            margin-bottom: 0.5rem;
            font-size: 0.875rem;
          }
          .footer {
            background: #f8fafc;
            padding: 2rem;
            text-align: center;
            border-top: 1px solid #e2e8f0;
          }
          .footer p {
            color: #64748b;
            margin: 0.5rem 0;
            font-size: 0.813rem;
          }
          .contact-info {
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px solid #e2e8f0;
          }
          .contact-info a {
            color: #1a202c;
            text-decoration: none;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>✓ Application Received</h1>
            <p>Thank you for your investment application</p>
          </div>
          
          <div class="content">
            <div class="greeting">
              Dear ${applicationData.fullName},
            </div>
            
            <p class="message">
              We have successfully received your investment application. Our team is reviewing your submission and will contact you within 2-3 business days.
            </p>
            
            <div class="details-box">
              <h2>Application Details</h2>
              
              <div class="detail-row">
                <span class="detail-label">Application ID</span>
                <span class="detail-value">#${applicationData.applicationId}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Investment Opportunity</span>
                <span class="detail-value">${applicationData.investmentName}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Investment Amount</span>
                <span class="detail-value highlight">${formatCurrency(applicationData.investmentAmount)}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Full Name</span>
                <span class="detail-value">${applicationData.fullName}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Email</span>
                <span class="detail-value">${applicationData.email}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Phone</span>
                <span class="detail-value">${applicationData.phone}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Country</span>
                <span class="detail-value">${applicationData.country}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Submission Date</span>
                <span class="detail-value">${new Date(applicationData.submissionDate).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Status</span>
                <span class="detail-value"><span class="status-badge">Pending Review</span></span>
              </div>
            </div>
            
            <div class="next-steps">
              <h3>📋 Next Steps</h3>
              <ul>
                <li>Our investment team will review your application within 2-3 business days</li>
                <li>You will receive an email notification once the review is complete</li>
                <li>If approved, we will send you detailed instructions for the next steps</li>
                <li>If you have any questions, please don't hesitate to contact us</li>
              </ul>
            </div>
            
            <p class="message">
              Thank you for choosing Ssaye for your investment needs. We appreciate your trust and look forward to helping you achieve your financial goals.
            </p>
          </div>
          
          <div class="footer">
            <p><strong>Ssaye Investment Platform</strong></p>
            <p>Your trusted partner in alternative asset investments</p>
            
            <div class="contact-info">
              <p>Questions? Contact us at <a href="mailto:contact@ssaye.club">contact@ssaye.club</a></p>
              <p>© ${new Date().getFullYear()} Ssaye. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"Ssaye Investment Platform" <${process.env.EMAIL_USER}>`,
      to: applicationData.email,
      subject: `Investment Application Confirmation - ${applicationData.investmentName}`,
      html: emailHTML
    };

    const info = await sendEmailWithRetry(mailOptions);
    console.log('Confirmation email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendInvestmentConfirmationEmail,
  sendAdminApprovalEmail,
  sendFinalApprovalEmail,
  closeTransporter
};

// Send admin approval email (awaiting payment)
async function sendAdminApprovalEmail(applicationData) {
  try {
    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1a202c;
            background-color: #f5f7fa;
            margin: 0;
            padding: 0;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
          }
          .header {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            padding: 2rem;
            text-align: center;
          }
          .header h1 {
            color: #ffffff !important;
            margin: 0;
            font-size: 1.75rem;
            font-weight: 700;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          }
          .header p {
            color: #d1fae5 !important;
            margin: 0.5rem 0 0 0;
            font-size: 0.938rem;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
          }
          .content {
            padding: 2rem;
          }
          .greeting {
            font-size: 1.125rem;
            color: #1a202c;
            margin-bottom: 1rem;
          }
          .message {
            color: #64748b;
            margin-bottom: 2rem;
            font-size: 0.938rem;
          }
          .details-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 2rem;
          }
          .details-box h2 {
            color: #1a202c;
            font-size: 1.25rem;
            margin: 0 0 1.5rem 0;
            font-weight: 700;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.75rem 0;
            border-bottom: 1px solid #e2e8f0;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
          .detail-label {
            color: #64748b;
            font-weight: 600;
            font-size: 0.875rem;
            flex-shrink: 0;
            margin-right: 1rem;
          }
          .detail-value {
            color: #1a202c;
            font-weight: 600;
            text-align: right;
            font-size: 0.938rem;
            margin-left: auto;
            padding-left: 1rem;
          }
          .detail-value.highlight {
            color: #10b981;
            font-weight: 700;
            font-size: 1.125rem;
          }
          .status-badge {
            display: inline-block;
            padding: 0.375rem 0.875rem;
            background: #fef3c7;
            color: #92400e;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
          }
          .next-steps {
            background: #eff6ff;
            border-left: 4px solid #3b82f6;
            padding: 1.5rem;
            margin: 2rem 0;
            border-radius: 8px;
          }
          .next-steps h3 {
            color: #1e40af;
            margin: 0 0 1rem 0;
            font-size: 1rem;
          }
          .next-steps ul {
            margin: 0;
            padding-left: 1.25rem;
            color: #1e3a8a;
          }
          .next-steps li {
            margin-bottom: 0.5rem;
            font-size: 0.875rem;
          }
          .footer {
            background: #f8fafc;
            padding: 2rem;
            text-align: center;
            border-top: 1px solid #e2e8f0;
          }
          .footer p {
            color: #64748b;
            margin: 0.5rem 0;
            font-size: 0.813rem;
          }
          .contact-info {
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px solid #e2e8f0;
          }
          .contact-info a {
            color: #1a202c;
            text-decoration: none;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>Application Approved!</h1>
            <p>Your investment application has been approved by our admin team</p>
          </div>
          
          <div class="content">
            <div class="greeting">
              Dear ${applicationData.fullName},
            </div>
            
            <p class="message">
              Great news! Your investment application has been reviewed and approved by our admin team. Your application is now pending final approval after payment verification.
            </p>
            
            <div class="details-box">
              <h2>Application Details</h2>
              
              <div class="detail-row">
                <span class="detail-label">Application ID</span>
                <span class="detail-value">#${applicationData.applicationId}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Investment Opportunity</span>
                <span class="detail-value">${applicationData.investmentName}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Investment Amount</span>
                <span class="detail-value highlight">${formatCurrency(applicationData.investmentAmount)}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Payment Method</span>
                <span class="detail-value">${applicationData.paymentMethod}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Approval Date</span>
                <span class="detail-value">${new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Status</span>
                <span class="detail-value"><span class="status-badge">Awaiting Payment Verification</span></span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Admin Notes</span>
                <span class="detail-value">${applicationData.adminNotes ? applicationData.adminNotes : 'None'}</span>
              </div>
            </div>
            
            <div class="next-steps">
              <h3>📋 Next Steps</h3>
              <ul>
                <li>Our payment team will verify your payment information</li>
                <li>Once verified, your application will be sent for final approval</li>
                <li>You will receive another email notification upon final approval</li>
                <li>The entire process typically takes 3-5 business days</li>
              </ul>
            </div>
            
            <p class="message">
              Thank you for your patience. We're committed to processing your investment application as quickly as possible while maintaining the highest standards of security and compliance.
            </p>
          </div>
          
          <div class="footer">
            <p><strong>Ssaye Investment Platform</strong></p>
            <p>Your trusted partner in alternative asset investments</p>
            
            <div class="contact-info">
              <p>Questions? Contact us at <a href="mailto:contact@ssaye.club">contact@ssaye.club</a></p>
              <p>© ${new Date().toLocaleDateString('en-US', { year: 'numeric' })} Ssaye. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"Ssaye Investment Platform" <${process.env.EMAIL_USER}>`,
      to: applicationData.email,
      subject: `Application Approved - Awaiting Payment Verification`,
      html: emailHTML
    };

    const info = await sendEmailWithRetry(mailOptions);
    console.log('Admin approval email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending admin approval email:', error);
    return { success: false, error: error.message };
  }
}

// Send final approval email
async function sendFinalApprovalEmail(applicationData) {
  try {
    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1a202c;
            background-color: #f5f7fa;
            margin: 0;
            padding: 0;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 2rem;
            text-align: center;
          }
          .header h1 {
            color: #ffffff !important;
            margin: 0;
            font-size: 1.75rem;
            font-weight: 700;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          }
          .header p {
            color: #e0e7ff !important;
            margin: 0.5rem 0 0 0;
            font-size: 0.938rem;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
          }
          .content {
            padding: 2rem;
          }
          .greeting {
            font-size: 1.125rem;
            color: #1a202c;
            margin-bottom: 1rem;
          }
          .message {
            color: #64748b;
            margin-bottom: 2rem;
            font-size: 0.938rem;
          }
          .success-badge {
            background: #d1fae5;
            color: #065f46;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            font-weight: 600;
            display: inline-block;
            margin-bottom: 1.5rem;
          }
          .details-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 2rem;
          }
          .details-box h2 {
            color: #1a202c;
            margin: 0 0 1rem 0;
            font-size: 1.25rem;
            font-weight: 700;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 0.75rem 0;
            border-bottom: 1px solid #e2e8f0;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
          .detail-label {
            font-weight: 600;
            color: #475569;
            margin-right: 1rem;
          }
          .detail-value {
            color: #1a202c;
            text-align: right;
            margin-left: 1rem;
            padding-left: 0.5rem;
          }
          .detail-value.highlight {
            color: #10b981;
            font-weight: 700;
            font-size: 1.125rem;
          }
          .next-steps {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 1.5rem;
            border-radius: 8px;
            margin-bottom: 2rem;
          }
          .next-steps h3 {
            margin: 0 0 1rem 0;
            color: #92400e;
            font-size: 1.125rem;
          }
          .next-steps ul {
            margin: 0;
            padding-left: 1.25rem;
            color: #78350f;
          }
          .next-steps li {
            margin-bottom: 0.5rem;
          }
          .footer {
            background: #f8fafc;
            padding: 2rem;
            text-align: center;
            border-top: 1px solid #e2e8f0;
            color: #64748b;
          }
          .footer p {
            margin: 0.25rem 0;
            font-size: 0.875rem;
          }
          .footer a {
            color: #3b82f6;
            text-decoration: none;
          }
          .contact-info {
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px solid #e2e8f0;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>Final Approval Confirmed!</h1>
            <p>Your investment has been fully approved and activated</p>
          </div>
          
          <div class="content">
            <div class="greeting">
              Dear ${applicationData.fullName},
            </div>
            
            <div class="success-badge">
              ✓ FULLY APPROVED & ACTIVE
            </div>
            
            <p class="message">
              Congratulations! We are thrilled to inform you that your investment application has received final approval. Your investment is now active and you are officially part of the Ssaye investment community!
            </p>
            
            <div class="details-box">
              <h2>Investment Summary</h2>
              
              <div class="detail-row">
                <span class="detail-label">Application ID</span>
                <span class="detail-value">#${applicationData.applicationId}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Investment Opportunity</span>
                <span class="detail-value">${applicationData.investmentName}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Investment Amount</span>
                <span class="detail-value highlight">${formatCurrency(applicationData.investmentAmount)}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Final Approval Date</span>
                <span class="detail-value">${new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Status</span>
                <span class="detail-value"><span style="background: #d1fae5; color: #065f46; padding: 0.25rem 0.75rem; border-radius: 4px; font-size: 0.875rem; font-weight: 600;">✓ Active</span></span>
              </div>
            </div>
            
            <div class="welcome-box">
              <h3>🎯 What's Next?</h3>
              <ul>
                <li>Access your investment portfolio anytime through your dashboard</li>
                <li>Track your investment performance and returns in real-time</li>
                <li>Receive regular updates on your investment progress</li>
                <li>Our support team is available 24/7 for any questions</li>
              </ul>
            </div>
            
            <center>
              <a href="${process.env.CLIENT_URL || 'https://ssaye.club'}/portfolio" class="cta-button">
                View My Portfolio →
              </a>
            </center>
            
            <p class="message">
              Thank you for choosing Ssaye as your investment partner. We're committed to helping you achieve your financial goals and look forward to a successful investment journey together.
            </p>
          </div>
          
          <div class="footer">
            <p><strong>Ssaye Investment Platform</strong></p>
            <p>Your trusted partner in alternative asset investments</p>
            
            <div class="contact-info">
              <p>Questions? Contact us at <a href="mailto:contact@ssaye.club">contact@ssaye.club</a></p>
              <p>© ${new Date().getFullYear()} Ssaye. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"Ssaye Investment Platform" <${process.env.EMAIL_USER}>`,
      to: applicationData.email,
      subject: `🎉 Final Approval - Your Investment is Now Active!`,
      html: emailHTML
    };

    const info = await sendEmailWithRetry(mailOptions);
    console.log('Final approval email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending final approval email:', error);
    return { success: false, error: error.message };
  }
}
