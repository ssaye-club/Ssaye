const nodemailer = require('nodemailer');

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
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
    const transporter = createTransporter();

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
            color: #ffffff;
            margin: 0;
            font-size: 1.75rem;
            font-weight: 700;
          }
          .header p {
            color: rgba(255, 255, 255, 0.9);
            margin: 0.5rem 0 0 0;
            font-size: 0.938rem;
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
          }
          .detail-value {
            color: #1a202c;
            font-weight: 600;
            text-align: right;
            font-size: 0.938rem;
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
              <p>Questions? Contact us at <a href="mailto:support@ssaye.com">support@ssaye.com</a></p>
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

    const info = await transporter.sendMail(mailOptions);
    console.log('Confirmation email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendInvestmentConfirmationEmail
};
