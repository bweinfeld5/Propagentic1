"use strict";
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

// Initialize admin if not already done
if (!admin.apps.length) {
    admin.initializeApp();
}

// Initialize nodemailer transporter
const mailTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'YOUR_SMTP_HOST',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: (process.env.SMTP_SECURE === 'true') || false,
    auth: {
        user: process.env.SMTP_USER || 'YOUR_SMTP_USER',
        pass: process.env.SMTP_PASS || 'YOUR_SMTP_PASSWORD',
    },
});

const APP_NAME = 'PropAgentic';
const YOUR_APP_DOMAIN = process.env.APP_DOMAIN || 'https://your-propagentic-app.com';

exports.sendInviteEmail = onDocumentCreated('invites/{inviteId}', async (event) => {
    const snap = event.data;
    if (!snap) {
        console.error('No data associated with the event');
        return;
    }

    const inviteData = snap.data();
    const inviteId = snap.id;
    
    console.log(`Processing new invite: ${inviteId}`);
    
    const tenantEmail = inviteData.tenantEmail;
    const propertyName = inviteData.propertyName || 'their new property';
    const landlordName = inviteData.landlordName || 'The Property Manager';
    
    if (!tenantEmail) {
        console.error('Tenant email is missing from invite data:', inviteId);
        await admin.firestore().collection('invites').doc(inviteId).update({
            emailSentStatus: 'failed',
            emailError: 'Missing tenant email',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return;
    }
    
    const inviteLink = `${YOUR_APP_DOMAIN}/accept-invite?code=${inviteId}`;
    
    const mailOptions = {
        from: `"${APP_NAME}" <${process.env.EMAIL_FROM || 'noreply@your-propagentic-app.com'}>`,
        to: tenantEmail,
        subject: `You're Invited to Join ${propertyName} on ${APP_NAME}!`,
        html: `
            <p>Hello,</p>
            <p>${landlordName} has invited you to join ${propertyName} on ${APP_NAME}.</p>
            <p>Please click the link below to accept your invitation and set up your account:</p>
            <p><a href="${inviteLink}">${inviteLink}</a></p>
            <p>If you were not expecting this invitation, you can safely ignore this email.</p>
            <p>Thanks,</p>
            <p>The ${APP_NAME} Team</p>
        `
    };
    
    console.log(`Attempting to send email to ${tenantEmail}`);
    
    try {
        await admin.firestore().collection('invites').doc(inviteId).update({
            emailSentStatus: 'processing',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        const info = await mailTransport.sendMail(mailOptions);
        console.log('Invitation email sent to:', tenantEmail, 'for invite ID:', inviteId, 'Response:', info.response);
        
        await admin.firestore().collection('invites').doc(inviteId).update({
            emailSentStatus: 'sent',
            emailSentAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('There was an error sending the email for invite ID:', inviteId, error);
        
        await admin.firestore().collection('invites').doc(inviteId).update({
            emailSentStatus: 'failed',
            emailError: error.message,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
    }
});