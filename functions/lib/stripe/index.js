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
exports.removePaymentMethod = exports.setDefaultPaymentMethod = exports.createSetupIntent = exports.getStripePaymentMethods = exports.verifyBankAccountMicroDeposits = exports.getStripeBankAccountStatus = exports.createBankAccountSetupLink = exports.refreshStripeAccount = exports.getStripeAccountStatus = exports.createStripeAccountLink = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const stripe_1 = __importDefault(require("stripe"));
// Initialize Stripe with secret key
const stripe = new stripe_1.default(functions.config().stripe.secret_key, {
    apiVersion: '2023-10-16',
});
// Helper function to get or create Stripe Connect account
const getOrCreateStripeAccount = async (userId, userEmail) => {
    const userDoc = await admin.firestore().doc(`users/${userId}`).get();
    const userData = userDoc.data();
    if (userData === null || userData === void 0 ? void 0 : userData.stripeAccountId) {
        return userData.stripeAccountId;
    }
    // Create new Stripe Connect account
    const account = await stripe.accounts.create({
        type: 'express',
        email: userEmail,
        capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
            tax_reporting_us_1099_k: { requested: true },
        },
        business_type: 'individual',
        business_profile: {
            mcc: '1520', // General Contractors
            url: 'https://propagentic.com',
        },
    });
    // Save the account ID to user document
    await admin.firestore().doc(`users/${userId}`).update({
        stripeAccountId: account.id,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return account.id;
};
// Create Stripe Connect account link for onboarding
exports.createStripeAccountLink = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { userId, returnUrl, refreshUrl } = data;
    if (!userId || !returnUrl || !refreshUrl) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters');
    }
    try {
        const userDoc = await admin.firestore().doc(`users/${userId}`).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'User not found');
        }
        const userData = userDoc.data();
        const accountId = await getOrCreateStripeAccount(userId, (userData === null || userData === void 0 ? void 0 : userData.email) || context.auth.token.email);
        const accountLink = await stripe.accountLinks.create({
            account: accountId,
            refresh_url: refreshUrl,
            return_url: returnUrl,
            type: 'account_onboarding',
        });
        return { accountLinkUrl: accountLink.url };
    }
    catch (error) {
        console.error('Error creating account link:', error);
        throw new functions.https.HttpsError('internal', 'Failed to create account link');
    }
});
// Get Stripe account status
exports.getStripeAccountStatus = functions.https.onCall(async (data, context) => {
    var _a, _b;
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { userId } = data;
    try {
        const userDoc = await admin.firestore().doc(`users/${userId}`).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'User not found');
        }
        const userData = userDoc.data();
        if (!(userData === null || userData === void 0 ? void 0 : userData.stripeAccountId)) {
            return {
                isEnabled: false,
                needsOnboarding: true,
                needsRefresh: false,
            };
        }
        const account = await stripe.accounts.retrieve(userData.stripeAccountId);
        return {
            isEnabled: account.charges_enabled && account.payouts_enabled,
            needsOnboarding: !account.details_submitted,
            needsRefresh: ((_b = (_a = account.requirements) === null || _a === void 0 ? void 0 : _a.currently_due) === null || _b === void 0 ? void 0 : _b.length) > 0,
        };
    }
    catch (error) {
        console.error('Error getting account status:', error);
        throw new functions.https.HttpsError('internal', 'Failed to get account status');
    }
});
// Refresh Stripe account (for incomplete onboarding)
exports.refreshStripeAccount = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { userId, returnUrl, refreshUrl } = data;
    try {
        const userDoc = await admin.firestore().doc(`users/${userId}`).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'User not found');
        }
        const userData = userDoc.data();
        if (!(userData === null || userData === void 0 ? void 0 : userData.stripeAccountId)) {
            throw new functions.https.HttpsError('failed-precondition', 'No Stripe account found');
        }
        const accountLink = await stripe.accountLinks.create({
            account: userData.stripeAccountId,
            refresh_url: refreshUrl,
            return_url: returnUrl,
            type: 'account_onboarding',
        });
        return { accountLinkUrl: accountLink.url };
    }
    catch (error) {
        console.error('Error refreshing account:', error);
        throw new functions.https.HttpsError('internal', 'Failed to refresh account');
    }
});
// Create bank account setup link
exports.createBankAccountSetupLink = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { userId, returnUrl, refreshUrl } = data;
    try {
        const userDoc = await admin.firestore().doc(`users/${userId}`).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'User not found');
        }
        const userData = userDoc.data();
        if (!(userData === null || userData === void 0 ? void 0 : userData.stripeAccountId)) {
            throw new functions.https.HttpsError('failed-precondition', 'No Stripe account found');
        }
        const accountLink = await stripe.accountLinks.create({
            account: userData.stripeAccountId,
            refresh_url: refreshUrl,
            return_url: returnUrl,
            type: 'account_update',
            collect: 'eventually_due',
        });
        return { setupUrl: accountLink.url };
    }
    catch (error) {
        console.error('Error creating bank account setup link:', error);
        throw new functions.https.HttpsError('internal', 'Failed to create bank account setup link');
    }
});
// Get bank account status
exports.getStripeBankAccountStatus = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { userId } = data;
    try {
        const userDoc = await admin.firestore().doc(`users/${userId}`).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'User not found');
        }
        const userData = userDoc.data();
        if (!(userData === null || userData === void 0 ? void 0 : userData.stripeAccountId)) {
            return { bankAccount: null };
        }
        const account = await stripe.accounts.retrieve(userData.stripeAccountId);
        // Get external accounts (bank accounts)
        const externalAccounts = await stripe.accounts.listExternalAccounts(userData.stripeAccountId, { object: 'bank_account', limit: 1 });
        if (externalAccounts.data.length === 0) {
            return { bankAccount: null };
        }
        const bankAccount = externalAccounts.data[0];
        return {
            bankAccount: {
                last4: bankAccount.last4,
                bankName: bankAccount.bank_name,
                status: bankAccount.status,
            },
        };
    }
    catch (error) {
        console.error('Error getting bank account status:', error);
        throw new functions.https.HttpsError('internal', 'Failed to get bank account status');
    }
});
// Verify bank account micro-deposits
exports.verifyBankAccountMicroDeposits = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { userId, amounts } = data;
    if (!amounts || amounts.length !== 2) {
        throw new functions.https.HttpsError('invalid-argument', 'Two micro-deposit amounts required');
    }
    try {
        const userDoc = await admin.firestore().doc(`users/${userId}`).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'User not found');
        }
        const userData = userDoc.data();
        if (!(userData === null || userData === void 0 ? void 0 : userData.stripeAccountId)) {
            throw new functions.https.HttpsError('failed-precondition', 'No Stripe account found');
        }
        // Get the bank account
        const externalAccounts = await stripe.accounts.listExternalAccounts(userData.stripeAccountId, { object: 'bank_account', limit: 1 });
        if (externalAccounts.data.length === 0) {
            throw new functions.https.HttpsError('failed-precondition', 'No bank account found');
        }
        const bankAccount = externalAccounts.data[0];
        // Verify the micro-deposits
        await stripe.accounts.verifyExternalAccount(userData.stripeAccountId, bankAccount.id, {
            amounts: amounts.map((amount) => Math.round(amount * 100)), // Convert to cents
        });
        return { success: true };
    }
    catch (error) {
        console.error('Error verifying micro-deposits:', error);
        throw new functions.https.HttpsError('internal', 'Failed to verify micro-deposits');
    }
});
// Get payment methods
exports.getStripePaymentMethods = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { userId } = data;
    try {
        const userDoc = await admin.firestore().doc(`users/${userId}`).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'User not found');
        }
        const userData = userDoc.data();
        if (!(userData === null || userData === void 0 ? void 0 : userData.stripeAccountId)) {
            return { paymentMethods: [] };
        }
        // Get external accounts (bank accounts and cards)
        const externalAccounts = await stripe.accounts.listExternalAccounts(userData.stripeAccountId, { limit: 10 });
        const paymentMethods = externalAccounts.data.map((account) => {
            if (account.object === 'bank_account') {
                return {
                    id: account.id,
                    type: 'bank_account',
                    last4: account.last4,
                    bankName: account.bank_name,
                    isDefault: account.default_for_currency,
                };
            }
            else if (account.object === 'card') {
                return {
                    id: account.id,
                    type: 'card',
                    last4: account.last4,
                    brand: account.brand,
                    expiryMonth: account.exp_month,
                    expiryYear: account.exp_year,
                    isDefault: account.default_for_currency,
                };
            }
            return null;
        }).filter(Boolean);
        return { paymentMethods };
    }
    catch (error) {
        console.error('Error getting payment methods:', error);
        throw new functions.https.HttpsError('internal', 'Failed to get payment methods');
    }
});
// Create setup intent for adding payment methods
exports.createSetupIntent = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { userId } = data;
    try {
        const userDoc = await admin.firestore().doc(`users/${userId}`).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'User not found');
        }
        const userData = userDoc.data();
        if (!(userData === null || userData === void 0 ? void 0 : userData.stripeAccountId)) {
            throw new functions.https.HttpsError('failed-precondition', 'No Stripe account found');
        }
        const setupIntent = await stripe.setupIntents.create({
            customer: userData.stripeAccountId,
            payment_method_types: ['card'],
            usage: 'off_session',
        });
        return { clientSecret: setupIntent.client_secret };
    }
    catch (error) {
        console.error('Error creating setup intent:', error);
        throw new functions.https.HttpsError('internal', 'Failed to create setup intent');
    }
});
// Set default payment method
exports.setDefaultPaymentMethod = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { userId, paymentMethodId } = data;
    try {
        const userDoc = await admin.firestore().doc(`users/${userId}`).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'User not found');
        }
        const userData = userDoc.data();
        if (!(userData === null || userData === void 0 ? void 0 : userData.stripeAccountId)) {
            throw new functions.https.HttpsError('failed-precondition', 'No Stripe account found');
        }
        // Update the external account to be the default
        await stripe.accounts.updateExternalAccount(userData.stripeAccountId, paymentMethodId, { default_for_currency: true });
        return { success: true };
    }
    catch (error) {
        console.error('Error setting default payment method:', error);
        throw new functions.https.HttpsError('internal', 'Failed to set default payment method');
    }
});
// Remove payment method
exports.removePaymentMethod = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { userId, paymentMethodId } = data;
    try {
        const userDoc = await admin.firestore().doc(`users/${userId}`).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'User not found');
        }
        const userData = userDoc.data();
        if (!(userData === null || userData === void 0 ? void 0 : userData.stripeAccountId)) {
            throw new functions.https.HttpsError('failed-precondition', 'No Stripe account found');
        }
        // Delete the external account
        await stripe.accounts.deleteExternalAccount(userData.stripeAccountId, paymentMethodId);
        return { success: true };
    }
    catch (error) {
        console.error('Error removing payment method:', error);
        throw new functions.https.HttpsError('internal', 'Failed to remove payment method');
    }
});
//# sourceMappingURL=index.js.map