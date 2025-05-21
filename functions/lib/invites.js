"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendInviteEmail = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const nodemailer = __importStar(require("nodemailer"));
// Initialize nodemailer transporter.
// IMPORTANT: Replace with your actual email service configuration.
// It's recommended to store sensitive info in Firebase Functions config.
// Example using Gmail (less secure, for testing only, requires "less secure app access"):
// const mailTransport = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: functions.config().gmail?.email || 'YOUR_GMAIL_EMAIL',
//     pass: functions.config().gmail?.password || 'YOUR_GMAIL_PASSWORD',
//   },
// });
// Initialize admin if not already done
if (!admin.apps.length) {
    admin.initializeApp();
}
// Example using a generic SMTP provider (replace with your provider's details)
const mailTransport = nodemailer.createTransport({
    host: ((_a = functions.config().smtp) === null || _a === void 0 ? void 0 : _a.host) || 'YOUR_SMTP_HOST',
    port: parseInt(((_b = functions.config().smtp) === null || _b === void 0 ? void 0 : _b.port) || '587', 10), // common ports: 587 (TLS), 465 (SSL)
    secure: (((_c = functions.config().smtp) === null || _c === void 0 ? void 0 : _c.secure) === 'true') || false, // true for 465, false for other ports
    auth: {
        user: ((_d = functions.config().smtp) === null || _d === void 0 ? void 0 : _d.user) || 'YOUR_SMTP_USER',
        pass: ((_e = functions.config().smtp) === null || _e === void 0 ? void 0 : _e.pass) || 'YOUR_SMTP_PASSWORD',
    },
});
const APP_NAME = 'PropAgentic';
const YOUR_APP_DOMAIN = ((_f = functions.config().app) === null || _f === void 0 ? void 0 : _f.domain) || 'https://your-propagentic-app.com'; // Configure your app domain
exports.sendInviteEmail = functions.firestore
    .document('invites/{inviteId}')
    .onCreate(async (snap, context) => {
    var _a;
    const inviteData = snap.data();
    const inviteId = snap.id;
    console.log(`Processing new invite: ${inviteId}`, { config: functions.config().smtp });
    if (!inviteData) {
        console.error('No data associated with the event');
        return;
    }
    const tenantEmail = inviteData.tenantEmail;
    const propertyName = inviteData.propertyName || 'their new property';
    const landlordName = inviteData.landlordName || 'The Property Manager';
    if (!tenantEmail) {
        console.error('Tenant email is missing from invite data:', inviteId);
        // Update the invite status to reflect the error
        await admin.firestore().collection('invites').doc(inviteId).update({
            emailSentStatus: 'failed',
            emailError: 'Missing tenant email',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return;
    }
    // Generate an invite code or link. Using inviteId as the code here.
    // You might want to generate a more complex, short-lived code in a real app.
    const inviteLink = `${YOUR_APP_DOMAIN}/accept-invite?code=${inviteId}`;
    const mailOptions = {
        from: `"${APP_NAME}" <${((_a = functions.config().email) === null || _a === void 0 ? void 0 : _a.from) || 'noreply@your-propagentic-app.com'}>`, // Configure your "from" email
        to: tenantEmail,
        subject: `You're Invited to Join ${propertyName} on ${APP_NAME}!`,
        html: 
    } `
        <p>Hello,</p>
        <p>${landlordName} has invited you to join ${propertyName} on ${APP_NAME}.</p>
        <p>Please click the link below to accept your invitation and set up your account:</p>
        <p><a href="${inviteLink}">${inviteLink}</a></p>
        <p>If you were not expecting this invitation, you can safely ignore this email.</p>
        <p>Thanks,</p>
        <p>The ${APP_NAME} Team</p>
      \`,
    };

    console.log(`, Attempting, to, send, email, to, $, { tenantEmail };
    `, mailOptions);

    try {
      // Mark as processing
      await admin.firestore().collection('invites').doc(inviteId).update({ 
        emailSentStatus: 'processing',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Send the email
      const info = await mailTransport.sendMail(mailOptions);
      console.log('Invitation email sent to:', tenantEmail, 'for invite ID:', inviteId, 'Response:', info.response);
      
      // Update the invite document with success status
      await admin.firestore().collection('invites').doc(inviteId).update({ 
        emailSentStatus: 'sent', 
        emailSentAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

    } catch (error) {
      console.error('There was an error sending the email for invite ID:', inviteId, error);
      
      // Update the invite document with failure status
      await admin.firestore().collection('invites').doc(inviteId).update({ 
        emailSentStatus: 'failed', 
        emailError: (error as Error).message,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  }); ;
});
//# sourceMappingURL=invites.js.map