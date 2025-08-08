const { Resend } = require('resend');

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY);

const emailService = {
  // Send hearing reminder email
  sendHearingReminder: async (recipients, hearing, caseData) => {
    try {
      const { data, error } = await resend.emails.send({
        from: 'Law Case System <noreply@notification.cdcorporate.site>',
        to: recipients,
        subject: `Hearing Reminder: ${caseData.referenceNumber} - ${hearing.type}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Upcoming Hearing Reminder</h2>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1f2937;">Case Details</h3>
              <p><strong>Reference Number:</strong> ${caseData.referenceNumber}</p>
              <p><strong>Case Title:</strong> ${caseData.title}</p>
              <p><strong>Client(s):</strong> ${caseData.clientNames.join(', ')}</p>
            </div>
            
            <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #92400e;">Hearing Information</h3>
              <p><strong>Type:</strong> ${hearing.type}</p>
              <p><strong>Date:</strong> ${new Date(hearing.date).toLocaleDateString()}</p>
              <p><strong>Time:</strong> ${hearing.time}</p>
              <p><strong>Judge:</strong> ${hearing.judge}</p>
              <p><strong>Courtroom:</strong> ${hearing.courtroom}</p>
              ${hearing.notes ? `<p><strong>Notes:</strong> ${hearing.notes}</p>` : ''}
            </div>
            
            ${hearing.documentsRequired ? `
            <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #dc2626;">Documents Required</h3>
              <p>${hearing.documentsRequired}</p>
            </div>
            ` : ''}
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px;">
                This is an automated reminder from the Law Case Management System.
                Please ensure all required documents are prepared and you are ready for the hearing.
              </p>
            </div>
          </div>
        `,
      });

      if (error) {
        console.error('❌ Error sending hearing reminder:', error);
        return false;
      }

      console.log('✅ Hearing reminder sent successfully:', data?.id);
      return true;
    } catch (error) {
      console.error('❌ Email service error:', error);
      return false;
    }
  },

  // Send case update notification
  sendCaseUpdateNotification: async (recipients, caseData, updateType, updatedBy) => {
    try {
      const { data, error } = await resend.emails.send({
        from: 'Law Case System <noreply@notification.cdcorporate.site>',
        to: recipients,
        subject: `Case ${updateType}: ${caseData.referenceNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Case ${updateType}</h2>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Reference Number:</strong> ${caseData.referenceNumber}</p>
              <p><strong>Case Title:</strong> ${caseData.title}</p>
              <p><strong>Updated By:</strong> ${updatedBy}</p>
              <p><strong>Update Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px;">
                This is an automated notification from the Law Case Management System.
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/cases/${caseData._id}" style="color: #2563eb;">View Case Details</a>
              </p>
            </div>
          </div>
        `,
      });

      if (error) {
        console.error('❌ Error sending case update notification:', error);
        return false;
      }

      console.log('✅ Case update notification sent successfully:', data?.id);
      return true;
    } catch (error) {
      console.error('❌ Email service error:', error);
      return false;
    }
  },

  // Send staff registration notification
  sendStaffRegistrationNotification: async (staffEmail, userDetails, tempPassword, createdBy) => {
    try {
      const { data, error } = await resend.emails.send({
        from: 'Law Case System <noreply@notification.cdcorporate.site>',
        to: [staffEmail],
        subject: 'Welcome to Law Case Management System',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Law Case Management System</h1>
            </div>
            
            <div style="padding: 30px; background: white; border: 1px solid #e5e7eb; border-top: none;">
              <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
                Hello <strong>${userDetails.name}</strong>,
              </p>
              
              <p style="color: #6b7280; margin-bottom: 25px;">
                Your account has been created by <strong>${createdBy}</strong>. You now have access to the Law Case Management System.
              </p>
              
              <div style="background-color: #f8fafc; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #3b82f6;">
                <h3 style="margin-top: 0; color: #1f2937; font-size: 18px;">Login Details</h3>
                <div style="background: white; padding: 15px; border-radius: 6px; margin: 10px 0;">
                  <p style="margin: 5px 0;"><strong>Email:</strong> ${staffEmail}</p>
                  <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <code style="background: #fee2e2; padding: 4px 8px; border-radius: 4px; color: #dc2626; font-family: monospace;">${tempPassword}</code></p>
                  <p style="margin: 5px 0;"><strong>Role:</strong> ${userDetails.role.charAt(0).toUpperCase() + userDetails.role.slice(1)}</p>
                  ${userDetails.department ? `<p style="margin: 5px 0;"><strong>Department:</strong> ${userDetails.department}</p>` : ''}
                </div>
              </div>
              
              <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; color: #92400e;">
                  <strong>⚠️ Important Security Notice:</strong> Please change your password immediately after your first login for security purposes.
                </p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; box-shadow: 0 4px 14px 0 rgba(0,118,255,0.39);">
                  🚀 Login to Your Account
                </a>
              </div>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <h4 style="color: #374151; margin-bottom: 15px;">What you can do:</h4>
                <ul style="color: #6b7280; line-height: 1.6;">
                  <li>Create and manage legal cases</li>
                  <li>Schedule and track hearings</li>
                  <li>Upload and organize case documents</li>
                  <li>Add notes and communicate with team members</li>
                  <li>Monitor case progress and deadlines</li>
                </ul>
              </div>
              
              <div style="margin-top: 30px; padding: 20px; background: #f9fafb; border-radius: 8px;">
                <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
                  Need help? Contact your administrator or visit our help center.
                  <br>
                  This is an automated email from the Law Case Management System.
                </p>
              </div>
            </div>
          </div>
        `,
      });

      if (error) {
        console.error('❌ Error sending staff registration notification:', error);
        console.error('Error details:', error);
        return false;
      }

      console.log('✅ Staff registration notification sent successfully to:', staffEmail);
      console.log('Email ID:', data?.id);
      return true;
    } catch (error) {
      console.error('❌ Email service error in staff registration:', error);
      return false;
    }
  },

  // Send document requirement notification
  sendDocumentRequiredNotification: async (recipients, caseData, documentName, hearingDate) => {
    try {
      const { data, error } = await resend.emails.send({
        from: 'Law Case System <noreply@notification.cdcorporate.site>',
        to: recipients,
        subject: `Document Required: ${caseData.referenceNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Document Required</h2>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Case:</strong> ${caseData.referenceNumber} - ${caseData.title}</p>
              <p><strong>Document Required:</strong> ${documentName}</p>
              <p><strong>Required for Hearing:</strong> ${new Date(hearingDate).toLocaleDateString()}</p>
            </div>
            
            <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Action Required:</strong> Please prepare and upload the required document as soon as possible.</p>
            </div>
            
            <p>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/cases/${caseData._id}" 
                 style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View Case & Upload Document
              </a>
            </p>
          </div>
        `,
      });

      if (error) {
        console.error('❌ Error sending document notification:', error);
        return false;
      }

      console.log('✅ Document notification sent successfully:', data?.id);
      return true;
    } catch (error) {
      console.error('❌ Email service error:', error);
      return false;
    }
  },

  // Send inactive case alert
  sendInactiveCaseAlert: async (recipients, inactiveCases) => {
    try {
      const caseList = inactiveCases.map(c => 
        `<li style="margin: 8px 0; padding: 8px; background: #fef2f2; border-radius: 4px;">${c.referenceNumber} - ${c.title} <span style="color: #dc2626; font-weight: bold;">(${c.monthsInactive} months inactive)</span></li>`
      ).join('');

      const { data, error } = await resend.emails.send({
        from: 'Law Case System <noreply@notification.cdcorporate.site>',
        to: recipients,
        subject: `🚨 Inactive Cases Alert - ${inactiveCases.length} cases require attention`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">⚠️ Inactive Cases Alert</h2>
            
            <p style="color: #374151; font-size: 16px;">The following <strong>${inactiveCases.length}</strong> cases have been inactive for more than 10 months:</p>
            
            <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
              <ul style="margin: 0; padding-left: 0; list-style: none;">
                ${caseList}
              </ul>
            </div>
            
            <p style="color: #6b7280;">Please review these cases and take appropriate action to reactivate or close them.</p>
            
            <p style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" 
                 style="background-color: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
                📊 View Dashboard
              </a>
            </p>
            
            <div style="margin-top: 30px; padding: 15px; background: #f9fafb; border-radius: 8px;">
              <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
                This is an automated alert from the Law Case Management System.
              </p>
            </div>
          </div>
        `,
      });

      if (error) {
        console.error('❌ Error sending inactive case alert:', error);
        return false;
      }

      console.log('✅ Inactive case alert sent successfully:', data?.id);
      return true;
    } catch (error) {
      console.error('❌ Email service error:', error);
      return false;
    }
  },

  // Test email function
  sendTestEmail: async (recipient, testMessage = 'Test email from Law Case Management System') => {
    try {
      const { data, error } = await resend.emails.send({
        from: 'Law Case System <noreply@notification.cdcorporate.site>',
        to: [recipient],
        subject: '✅ Test Email - Law Case Management System',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background: white;">
            <h2 style="color: #10b981;">✅ Email Service Test Successful!</h2>
            <p style="color: #374151; font-size: 16px;">${testMessage}</p>
            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
              <p style="margin: 0; color: #166534;">
                <strong>Great news!</strong> Your email service is working correctly. 
                You should now receive notifications for user registrations, case updates, and other important events.
              </p>
            </div>
            <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 30px;">
              Sent at: ${new Date().toLocaleString()}
            </p>
          </div>
        `
      });

      if (error) {
        console.error('❌ Test email failed:', error);
        return { success: false, error };
      }

      console.log('✅ Test email sent successfully:', data?.id);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Test email service error:', error);
      return { success: false, error: error.message };
    }
  }
};

module.exports = emailService;