import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';

admin.initializeApp();
const db = admin.firestore();

// Pull SMTP creds from environment
const { host, port, user, pass } = functions.config().smtp;

// Create a reusable transporter object
const transporter = nodemailer.createTransport({
  host,
  port: parseInt(port, 10),
  secure: port === '465',   // true for 465, false for other ports
  auth: { user, pass },
});

/**
 * Firestore trigger: send email on new "mail" doc.
 */
export const sendMailOnCreate = functions
  .region('us-central1')
  .firestore.document('mail/{mailId}')
  .onCreate(async (snap, ctx) => {
    const data = snap.data()!;
    const { to, subject, text, html } = data;

    // Normalize recipient list
    const recipients = Array.isArray(to) ? to : [to];

    try {
      // Send the email
      const info = await transporter.sendMail({
        to:        recipients,
        from:      `"PropAgentic" <no-reply@propagentic.com>`,
        subject,
        text,
        html,
      });

      // Write delivery info back to Firestore
      await snap.ref.update({
        delivery: {
          info: {
            messageId: info.messageId,
            accepted:  info.accepted,
            rejected:  info.rejected,
            response:  info.response
          }
        }
      });

      console.log(`Email sent: ${info.messageId}`);
    } catch (err: any) {
      console.error('Error sending email:', err);
      await snap.ref.update({
        delivery: {
          error: err.message
        }
      });
    }
  });