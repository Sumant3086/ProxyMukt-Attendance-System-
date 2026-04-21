let transporter = null;

// Try to configure email transporter if nodemailer is available
try {
  const nodemailer = await import('nodemailer');
  
  const emailService = process.env.EMAIL_SERVICE || 'gmail';
  
  // Configure transporter based on email service
  if (emailService.toLowerCase() === 'sendgrid') {
    // SendGrid configuration
    transporter = nodemailer.default.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER || 'apikey',
        pass: process.env.EMAIL_PASSWORD,
      },
    });
    console.log(`✅ Email service configured: SendGrid`);
  } else {
    // Generic configuration (Gmail, etc.)
    transporter = nodemailer.default.createTransport({
      service: emailService,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
    console.log(`✅ Email service configured: ${emailService}`);
  }
} catch (error) {
  console.warn('⚠️  Nodemailer not installed. Email notifications will be disabled.');
  console.warn('   To enable email notifications, run: npm install nodemailer');
}

/**
 * Send high-risk attendance alert email
 */
export const sendHighRiskAlertEmail = async (adminEmail, alertData) => {
  if (!transporter) {
    console.log('Email service not available. Skipping alert email.');
    return;
  }
  
  try {
    const { student, riskScore, riskFactors, severity, session, class: classData } = alertData;

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: adminEmail,
      subject: `🚨 High-Risk Attendance Alert - ${student.name} (Risk Score: ${riskScore})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">⚠️ High-Risk Attendance Detected</h2>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border: 1px solid #dee2e6;">
            <h3 style="color: #333; margin-top: 0;">Alert Details</h3>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #dee2e6;">
                <td style="padding: 10px; font-weight: bold; color: #666;">Student Name:</td>
                <td style="padding: 10px;">${student.name}</td>
              </tr>
              <tr style="border-bottom: 1px solid #dee2e6;">
                <td style="padding: 10px; font-weight: bold; color: #666;">Student ID:</td>
                <td style="padding: 10px;">${student.studentId}</td>
              </tr>
              <tr style="border-bottom: 1px solid #dee2e6;">
                <td style="padding: 10px; font-weight: bold; color: #666;">Email:</td>
                <td style="padding: 10px;">${student.email}</td>
              </tr>
              <tr style="border-bottom: 1px solid #dee2e6;">
                <td style="padding: 10px; font-weight: bold; color: #666;">Class:</td>
                <td style="padding: 10px;">${classData?.name || 'N/A'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #dee2e6;">
                <td style="padding: 10px; font-weight: bold; color: #666;">Session:</td>
                <td style="padding: 10px;">${session?.name || 'N/A'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #dee2e6;">
                <td style="padding: 10px; font-weight: bold; color: #666;">Risk Score:</td>
                <td style="padding: 10px; font-weight: bold; color: #dc3545;">${riskScore}/100</td>
              </tr>
              <tr style="border-bottom: 1px solid #dee2e6;">
                <td style="padding: 10px; font-weight: bold; color: #666;">Severity:</td>
                <td style="padding: 10px;">
                  <span style="padding: 5px 10px; border-radius: 4px; font-weight: bold; color: white; background: ${
                    severity === 'CRITICAL' ? '#dc3545' :
                    severity === 'HIGH' ? '#fd7e14' :
                    severity === 'MEDIUM' ? '#ffc107' : '#17a2b8'
                  };">${severity}</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px; font-weight: bold; color: #666;">Risk Factors:</td>
                <td style="padding: 10px;">
                  ${riskFactors.map(factor => `<span style="display: inline-block; background: #e9ecef; padding: 4px 8px; margin: 2px; border-radius: 3px; font-size: 12px;">${factor}</span>`).join('')}
                </td>
              </tr>
            </table>

            <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
              <p style="margin: 0; color: #856404;">
                <strong>Action Required:</strong> Please review this alert in the admin dashboard and take appropriate action.
              </p>
            </div>

            <div style="margin-top: 20px; text-align: center;">
              <a href="${process.env.CLIENT_URL}/admin?tab=alerts" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                Review Alert in Dashboard
              </a>
            </div>
          </div>

          <div style="background: #f8f9fa; padding: 15px; border-top: 1px solid #dee2e6; font-size: 12px; color: #666; text-align: center;">
            <p style="margin: 0;">This is an automated alert from the Attendance System. Please do not reply to this email.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Alert email sent to ${adminEmail}`);
  } catch (error) {
    console.error('Error sending alert email:', error);
  }
};

/**
 * Send student appeal notification email
 */
export const sendAppealNotificationEmail = async (studentEmail, appealData) => {
  if (!transporter) {
    console.log('Email service not available. Skipping appeal email.');
    return;
  }
  
  try {
    const { appealId, reason, status } = appealData;

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: studentEmail,
      subject: `Attendance Appeal - ${status === 'PENDING' ? 'Received' : status}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">📋 Attendance Appeal ${status === 'PENDING' ? 'Received' : 'Updated'}</h2>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border: 1px solid #dee2e6;">
            <p>Your attendance appeal has been ${status === 'PENDING' ? 'received and is under review' : status.toLowerCase()}.</p>
            
            <div style="background: white; padding: 15px; border-radius: 4px; margin: 15px 0;">
              <p><strong>Appeal ID:</strong> ${appealId}</p>
              <p><strong>Status:</strong> ${status}</p>
              <p><strong>Reason:</strong> ${reason}</p>
            </div>

            <p>You will be notified once the admin has reviewed your appeal.</p>
          </div>

          <div style="background: #f8f9fa; padding: 15px; border-top: 1px solid #dee2e6; font-size: 12px; color: #666; text-align: center;">
            <p style="margin: 0;">This is an automated notification from the Attendance System.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Appeal notification email sent to ${studentEmail}`);
  } catch (error) {
    console.error('Error sending appeal email:', error);
  }
};

/**
 * Send daily risk summary report
 */
export const sendDailyRiskReport = async (adminEmail, reportData) => {
  if (!transporter) {
    console.log('Email service not available. Skipping daily report email.');
    return;
  }
  
  try {
    const { date, criticalCount, highCount, mediumCount, totalAlerts, topRisks } = reportData;

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: adminEmail,
      subject: `📊 Daily Risk Report - ${date}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">📊 Daily Risk Summary Report</h2>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">${date}</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border: 1px solid #dee2e6;">
            <h3 style="color: #333; margin-top: 0;">Alert Summary</h3>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 20px;">
              <div style="background: #f8d7da; padding: 15px; border-radius: 4px; text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #721c24;">${criticalCount}</div>
                <div style="font-size: 12px; color: #721c24;">Critical</div>
              </div>
              <div style="background: #fff3cd; padding: 15px; border-radius: 4px; text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #856404;">${highCount}</div>
                <div style="font-size: 12px; color: #856404;">High</div>
              </div>
              <div style="background: #d1ecf1; padding: 15px; border-radius: 4px; text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #0c5460;">${mediumCount}</div>
                <div style="font-size: 12px; color: #0c5460;">Medium</div>
              </div>
            </div>

            <p style="font-size: 14px; color: #666;"><strong>Total Alerts:</strong> ${totalAlerts}</p>

            ${topRisks && topRisks.length > 0 ? `
              <h3 style="color: #333; margin-top: 20px;">Top Risk Factors</h3>
              <ul style="margin: 10px 0; padding-left: 20px;">
                ${topRisks.map(risk => `<li style="margin: 5px 0;">${risk.factor}: ${risk.count} occurrences</li>`).join('')}
              </ul>
            ` : ''}

            <div style="margin-top: 20px; text-align: center;">
              <a href="${process.env.CLIENT_URL}/admin?tab=alerts" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                View Full Report
              </a>
            </div>
          </div>

          <div style="background: #f8f9fa; padding: 15px; border-top: 1px solid #dee2e6; font-size: 12px; color: #666; text-align: center;">
            <p style="margin: 0;">This is an automated report from the Attendance System.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Daily risk report sent to ${adminEmail}`);
  } catch (error) {
    console.error('Error sending daily report:', error);
  }
};
