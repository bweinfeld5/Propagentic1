"use strict";
const { onCall } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

exports.redeemInviteCode = onCall(async (request) => {
    const { code } = request.data;
    
    if (!code) {
        throw new Error('No invite code provided');
    }
    
    try {
        const inviteRef = admin.firestore().collection('invites').doc(code);
        const invite = await inviteRef.get();
        
        if (!invite.exists) {
            throw new Error('Invalid invite code');
        }
        
        const inviteData = invite.data();
        
        if (inviteData.redeemed) {
            throw new Error('Invite code has already been used');
        }
        
        // Mark invite as redeemed
        await inviteRef.update({
            redeemed: true,
            redeemedAt: admin.firestore.FieldValue.serverTimestamp(),
            redeemedBy: request.auth?.uid || null
        });
        
        return {
            success: true,
            inviteData: {
                propertyId: inviteData.propertyId,
                role: inviteData.role,
                invitedBy: inviteData.invitedBy
            }
        };
    } catch (error) {
        console.error('Error redeeming invite code:', error);
        throw new Error('Failed to redeem invite code: ' + error.message);
    }
}); 