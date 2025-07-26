// const { Resend } = require('resend');

// const resend = new Resend(process.env.RESEND_API_KEY);

// const emailService = {
//   // Send hearing reminder email
//   sendHearingReminder: async (recipients, hearing, caseData) => {
//     try {
//       const { data, error } = await resend.emails.send({
//         from: 'Law Case System <noreply@yourlaw.com>',
//         to: recipients,
//         subject: `Hearing Reminder: ${caseData.referenceNumber} - ${hearing.type}`,
//         html: `
//           <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//             <h2 style="color: #2563eb;">Upcoming Hearing Reminder</h2>
            
//             <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
//               <h3 style="margin-top: 0; color: #1f2937;">Case Details</h3>
//               <p><strong>Reference Number:</strong> ${caseData.referenceNumber}</p>
//               <p><strong>Case Title:</strong> ${caseData.title}</p>
//               <p><strong>Client(s):</strong> ${caseData.clientNames.join(', ')}</p>
//             </div>
            
//             <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
//               <h3 style="margin-top: 0; color: #92400e;">Hearing Information</h3>
//               <p><strong>Type:</strong> ${hearing.type}</p>
//               <p><strong>Date:</strong> ${new Date(hearing.date).toLocaleDateString()}</p>
//               <p><strong>Time:</strong> ${hearing.time}</p>
//               <p><strong>Judge:</strong> ${hearing.judge}</p>
//               <p><strong>Courtroom:</strong> ${hearing.courtroom}</p>
//               ${hearing.notes ? `<p><strong>Notes:</strong> ${hearing.notes}</p>` : ''}
//             </div>
            
//             ${hearing.documentsRequired ? `
//             <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0;">
//               <h3 style="margin-top: 0; color: #dc2626;">Documents Required</h3>
//               <p>${hearing.documentsRequired}</p>
//             </div>
//             ` : ''}
            
//             <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
//               <p style="color: #6b7280; font-size: 14px;">
//                 This is an automated reminder from the Law Case Management System.
//                 Please ensure all required documents are prepared and you are ready for the hearing.
//               </p>
//             </div>
//           </div>
//         `,
//       });

//       if (error) {
//         console.error('Error sending hearing reminder:', error);
//         return false;
//       }

//       console.log('Hearing reminder sent successfully:', data);
//       return true;
//     } catch (error) {
//       console.error('Email service error:', error);
//       return false;
//     }
//   },

//   // Send case update notification
//   sendCaseUpdateNotification: async (recipients, caseData, updateType, updatedBy) => {
//     try {
//       const { data, error } = await resend.emails.send({
//         from: 'Law Case System <noreply@yourlaw.com>',
//         to: recipients,
//         subject: `Case ${updateType}: ${caseData.referenceNumber}`,
//         html: `
//           <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//             <h2 style="color: #2563eb;">Case ${updateType}</h2>
            
//             <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
//               <p><strong>Reference Number:</strong> ${caseData.referenceNumber}</p>
//               <p><strong>Case Title:</strong> ${caseData.title}</p>
//               <p><strong>Updated By:</strong> ${updatedBy}</p>
//               <p><strong>Update Time:</strong> ${new Date().toLocaleString()}</p>
//             </div>
            
//             <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
//               <p style="color: #6b7280; font-size: 14px;">
//                 This is an automated notification from the Law Case Management System.
//                 <a href="${process.env.FRONTEND_URL}/cases/${caseData._id}" style="color: #2563eb;">View Case Details</a>
//               </p>
//             </div>
//           </div>
//         `,
//       });

//       if (error) {
//         console.error('Error sending case update notification:', error);
//         return false;
//       }

//       return true;
//     } catch (error) {
//       console.error('Email service error:', error);
//       return false;
//     }
//   },

//   // Send staff registration notification
//   sendStaffRegistrationNotification: async (staffEmail, tempPassword, createdBy) => {
//     try {
//       const { data, error } = await resend.emails.send({
//         from: 'Law Case System <noreply@yourlaw.com>',
//         to: [staffEmail],
//         subject: 'Welcome to Law Case Management System',
//         html: `
//           <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//             <h2 style="color: #2563eb;">Welcome to Law Case Management System</h2>
            
//             <p>Your account has been created by ${createdBy}.</p>
            
//             <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
//               <h3 style="margin-top: 0;">Login Details</h3>
//               <p><strong>Email:</strong> ${staffEmail}</p>
//               <p><strong>Temporary Password:</strong> ${tempPassword}</p>
//             </div>
            
//             <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
//               <p><strong>Important:</strong> Please change your password after your first login for security purposes.</p>
//             </div>
            
//             <p>
//               <a href="${process.env.FRONTEND_URL}/login" 
//                  style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
//                 Login to Your Account
//               </a>
//             </p>
//           </div>
//         `,
//       });

//       if (error) {
//         console.error('Error sending staff registration notification:', error);
//         return false;
//       }

//       return true;
//     } catch (error) {
//       console.error('Email service error:', error);
//       return false;
//     }
//   },

//   // Send document requirement notification
//   sendDocumentRequiredNotification: async (recipients, caseData, documentName, hearingDate) => {
//     try {
//       const { data, error } = await resend.emails.send({
//         from: 'Law Case System <noreply@yourlaw.com>',
//         to: recipients,
//         subject: `Document Required: ${caseData.referenceNumber}`,
//         html: `
//           <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//             <h2 style="color: #dc2626;">Document Required</h2>
            
//             <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
//               <p><strong>Case:</strong> ${caseData.referenceNumber} - ${caseData.title}</p>
//               <p><strong>Document Required:</strong> ${documentName}</p>
//               <p><strong>Required for Hearing:</strong> ${new Date(hearingDate).toLocaleDateString()}</p>
//             </div>
            
//             <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0;">
//               <p><strong>Action Required:</strong> Please prepare and upload the required document as soon as possible.</p>
//             </div>
            
//             <p>
//               <a href="${process.env.FRONTEND_URL}/cases/${caseData._id}" 
//                  style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
//                 View Case & Upload Document
//               </a>
//             </p>
//           </div>
//         `,
//       });

//       if (error) {
//         console.error('Error sending document notification:', error);
//         return false;
//       }

//       return true;
//     } catch (error) {
//       console.error('Email service error:', error);
//       return false;
//     }
//   },

//   // Send inactive case alert
//   sendInactiveCaseAlert: async (recipients, inactiveCases) => {
//     try {
//       const caseList = inactiveCases.map(c => 
//         `<li>${c.referenceNumber} - ${c.title} (${c.monthsInactive} months inactive)</li>`
//       ).join('');

//       const { data, error } = await resend.emails.send({
//         from: 'Law Case System <noreply@yourlaw.com>',
//         to: recipients,
//         subject: `Inactive Cases Alert - ${inactiveCases.length} cases require attention`,
//         html: `
//           <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//             <h2 style="color: #dc2626;">Inactive Cases Alert</h2>
            
//             <p>The following cases have been inactive for more than 10 months:</p>
            
//             <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0;">
//               <ul style="margin: 0; padding-left: 20px;">
//                 ${caseList}
//               </ul>
//             </div>
            
//             <p>Please review these cases and take appropriate action.</p>
            
//             <p>
//               <a href="${process.env.FRONTEND_URL}/dashboard" 
//                  style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
//                 View Dashboard
//               </a>
//             </p>
//           </div>
//         `,
//       });

//       if (error) {
//         console.error('Error sending inactive case alert:', error);
//         return false;
//       }

//       return true;
//     } catch (error) {
//       console.error('Email service error:', error);
//       return false;
//     }
//   }
// };

// module.exports = emailService;