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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeWebhooks = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const stripe_1 = __importDefault(require("stripe"));
// Initialize Stripe with secret key
const stripe = new stripe_1.default(functions.config().stripe.secret_key, {
    apiVersion: '2023-10-16',
});
const endpointSecret = functions.config().stripe.webhook_secret;
// Stripe webhook handler
exports.stripeWebhooks = functions.https.onRequest(async (req, res) => {
    const sig = req.headers['stripe-signature'];
    if (!sig || !endpointSecret) {
        console.error('Missing stripe signature or webhook secret');
        res.status(400).send('Missing stripe signature or webhook secret');
        return;
    }
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    }
    catch (err) {
        console.error('Webhook signature verification failed:', err);
        res.status(400).send(`Webhook Error: ${err}`);
        return;
    }
    console.log('Received webhook event:', event.type);
    try {
        switch (event.type) {
            case 'account.updated':
                await handleAccountUpdated(event.data.object);
                break;
            case 'account.external_account.created':
                await handleExternalAccountCreated(event.data.object);
                break;
            case 'account.external_account.updated':
                await handleExternalAccountUpdated(event.data.object);
                break;
            case 'account.external_account.deleted':
                await handleExternalAccountDeleted(event.data.object);
                break;
            case 'transfer.created':
                await handleTransferCreated(event.data.object);
                break;
            case 'transfer.paid':
                await handleTransferPaid(event.data.object);
                break;
            case 'transfer.failed':
                await handleTransferFailed(event.data.object);
                break;
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }
        res.json({ received: true });
    }
    catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).send('Internal server error');
    }
});
// Handle account updates (onboarding completion, verification status changes)
const handleAccountUpdated = async (account) => {
    var _a, _b, _c, _d, _e, _f;
    try {
        // Find user by Stripe account ID
        const usersSnapshot = await admin.firestore()
            .collection('users')
            .where('stripeAccountId', '==', account.id)
            .limit(1)
            .get();
        if (usersSnapshot.empty) {
            console.log(`No user found for Stripe account: ${account.id}`);
            return;
        }
        const userDoc = usersSnapshot.docs[0];
        const userId = userDoc.id;
        // Update user document with latest account status
        await admin.firestore().doc(`users/${userId}`).update({
            stripeAccountStatus: {
                chargesEnabled: account.charges_enabled,
                payoutsEnabled: account.payouts_enabled,
                detailsSubmitted: account.details_submitted,
                currentlyDue: ((_a = account.requirements) === null || _a === void 0 ? void 0 : _a.currently_due) || [],
                pastDue: ((_b = account.requirements) === null || _b === void 0 ? void 0 : _b.past_due) || [],
                pendingVerification: ((_c = account.requirements) === null || _c === void 0 ? void 0 : _c.pending_verification) || [],
                disabled: (_d = account.requirements) === null || _d === void 0 ? void 0 : _d.disabled_reason,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`Updated account status for user ${userId}`);
        // Send notification if account is fully verified
        if (account.charges_enabled && account.payouts_enabled && account.details_submitted) {
            await sendAccountVerifiedNotification(userId);
        }
        // Send notification if account needs attention
        if (((_f = (_e = account.requirements) === null || _e === void 0 ? void 0 : _e.currently_due) === null || _f === void 0 ? void 0 : _f.length) > 0) {
            await sendAccountAttentionNeededNotification(userId, account.requirements.currently_due);
        }
    }
    catch (error) {
        console.error('Error handling account update:', error);
        throw error;
    }
};
// Handle external account creation (bank account or card added)
const handleExternalAccountCreated = async (externalAccount) => {
    try {
        // Find user by Stripe account ID
        const usersSnapshot = await admin.firestore()
            .collection('users')
            .where('stripeAccountId', '==', externalAccount.account)
            .limit(1)
            .get();
        if (usersSnapshot.empty) {
            console.log(`No user found for Stripe account: ${externalAccount.account}`);
            return;
        }
        const userDoc = usersSnapshot.docs[0];
        const userId = userDoc.id;
        console.log(`External account created for user ${userId}: ${externalAccount.object}`);
        // Send notification about new payment method
        await sendPaymentMethodAddedNotification(userId, externalAccount);
    }
    catch (error) {
        console.error('Error handling external account creation:', error);
        throw error;
    }
};
// Handle external account updates (verification status changes)
const handleExternalAccountUpdated = async (externalAccount) => {
    try {
        // Find user by Stripe account ID
        const usersSnapshot = await admin.firestore()
            .collection('users')
            .where('stripeAccountId', '==', externalAccount.account)
            .limit(1)
            .get();
        if (usersSnapshot.empty) {
            console.log(`No user found for Stripe account: ${externalAccount.account}`);
            return;
        }
        const userDoc = usersSnapshot.docs[0];
        const userId = userDoc.id;
        console.log(`External account updated for user ${userId}: ${externalAccount.object}`);
        // Send notification about payment method verification
        if (externalAccount.object === 'bank_account') {
            const bankAccount = externalAccount;
            if (bankAccount.status === 'verified') {
                await sendBankAccountVerifiedNotification(userId, bankAccount);
            }
            else if (bankAccount.status === 'verification_failed') {
                await sendBankAccountVerificationFailedNotification(userId, bankAccount);
            }
        }
    }
    catch (error) {
        console.error('Error handling external account update:', error);
        throw error;
    }
};
// Handle external account deletion
const handleExternalAccountDeleted = async (externalAccount) => {
    try {
        // Find user by Stripe account ID
        const usersSnapshot = await admin.firestore()
            .collection('users')
            .where('stripeAccountId', '==', externalAccount.account)
            .limit(1)
            .get();
        if (usersSnapshot.empty) {
            console.log(`No user found for Stripe account: ${externalAccount.account}`);
            return;
        }
        const userDoc = usersSnapshot.docs[0];
        const userId = userDoc.id;
        console.log(`External account deleted for user ${userId}: ${externalAccount.object}`);
    }
    catch (error) {
        console.error('Error handling external account deletion:', error);
        throw error;
    }
};
// Handle transfer creation (payment to contractor)
const handleTransferCreated = async (transfer) => {
    try {
        // Log the transfer creation
        await admin.firestore().collection('payments').add({
            stripeTransferId: transfer.id,
            amount: transfer.amount,
            currency: transfer.currency,
            destination: transfer.destination,
            status: 'created',
            metadata: transfer.metadata,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`Transfer created: ${transfer.id} for ${transfer.amount / 100} ${transfer.currency.toUpperCase()}`);
    }
    catch (error) {
        console.error('Error handling transfer creation:', error);
        throw error;
    }
};
// Handle transfer completion (payment successful)
const handleTransferPaid = async (transfer) => {
    try {
        // Update payment record
        const paymentsSnapshot = await admin.firestore()
            .collection('payments')
            .where('stripeTransferId', '==', transfer.id)
            .limit(1)
            .get();
        if (!paymentsSnapshot.empty) {
            const paymentDoc = paymentsSnapshot.docs[0];
            await paymentDoc.ref.update({
                status: 'paid',
                paidAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        // Find user and send notification
        const usersSnapshot = await admin.firestore()
            .collection('users')
            .where('stripeAccountId', '==', transfer.destination)
            .limit(1)
            .get();
        if (!usersSnapshot.empty) {
            const userDoc = usersSnapshot.docs[0];
            const userId = userDoc.id;
            await sendPaymentReceivedNotification(userId, transfer);
        }
        console.log(`Transfer paid: ${transfer.id}`);
    }
    catch (error) {
        console.error('Error handling transfer payment:', error);
        throw error;
    }
};
// Handle transfer failure
const handleTransferFailed = async (transfer) => {
    try {
        // Update payment record
        const paymentsSnapshot = await admin.firestore()
            .collection('payments')
            .where('stripeTransferId', '==', transfer.id)
            .limit(1)
            .get();
        if (!paymentsSnapshot.empty) {
            const paymentDoc = paymentsSnapshot.docs[0];
            await paymentDoc.ref.update({
                status: 'failed',
                failedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        // Find user and send notification
        const usersSnapshot = await admin.firestore()
            .collection('users')
            .where('stripeAccountId', '==', transfer.destination)
            .limit(1)
            .get();
        if (!usersSnapshot.empty) {
            const userDoc = usersSnapshot.docs[0];
            const userId = userDoc.id;
            await sendPaymentFailedNotification(userId, transfer);
        }
        console.log(`Transfer failed: ${transfer.id}`);
    }
    catch (error) {
        console.error('Error handling transfer failure:', error);
        throw error;
    }
};
// Notification helper functions
const sendAccountVerifiedNotification = async (userId) => {
    await admin.firestore().collection('notifications').add({
        userId,
        type: 'payment_account_verified',
        title: 'Payment Account Verified',
        message: 'Your payment account has been successfully verified. You can now receive payments.',
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
};
const sendAccountAttentionNeededNotification = async (userId, requirements) => {
    await admin.firestore().collection('notifications').add({
        userId,
        type: 'payment_account_attention_needed',
        title: 'Payment Account Needs Attention',
        message: `Your payment account requires additional information: ${requirements.join(', ')}`,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
};
const sendPaymentMethodAddedNotification = async (userId, paymentMethod) => {
    const type = paymentMethod.object === 'bank_account' ? 'bank account' : 'card';
    await admin.firestore().collection('notifications').add({
        userId,
        type: 'payment_method_added',
        title: 'Payment Method Added',
        message: `A new ${type} has been added to your account.`,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
};
const sendBankAccountVerifiedNotification = async (userId, bankAccount) => {
    await admin.firestore().collection('notifications').add({
        userId,
        type: 'bank_account_verified',
        title: 'Bank Account Verified',
        message: `Your bank account ending in ${bankAccount.last4} has been verified.`,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
};
const sendBankAccountVerificationFailedNotification = async (userId, bankAccount) => {
    await admin.firestore().collection('notifications').add({
        userId,
        type: 'bank_account_verification_failed',
        title: 'Bank Account Verification Failed',
        message: `Verification failed for your bank account ending in ${bankAccount.last4}. Please try again.`,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
};
const sendPaymentReceivedNotification = async (userId, transfer) => {
    const amount = (transfer.amount / 100).toFixed(2);
    const currency = transfer.currency.toUpperCase();
    await admin.firestore().collection('notifications').add({
        userId,
        type: 'payment_received',
        title: 'Payment Received',
        message: `You received a payment of ${currency} ${amount}.`,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
};
const sendPaymentFailedNotification = async (userId, transfer) => {
    const amount = (transfer.amount / 100).toFixed(2);
    const currency = transfer.currency.toUpperCase();
    await admin.firestore().collection('notifications').add({
        userId,
        type: 'payment_failed',
        title: 'Payment Failed',
        message: `A payment of ${currency} ${amount} could not be processed. Please check your payment method.`,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
};
//# sourceMappingURL=webhooks.js.map