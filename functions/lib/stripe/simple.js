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
exports.getStripeAccountStatus = exports.createStripeAccountLink = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const stripe_1 = __importDefault(require("stripe"));
// Initialize Stripe with the correct API version
const stripe = new stripe_1.default(functions.config().stripe.secret_key, {
    apiVersion: '2025-04-30.basil', // Updated to the supported version from error
});
// Simple createStripeAccountLink function
exports.createStripeAccountLink = functions.https.onCall(async (data, context) => {
    // Basic authentication check
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = data.userId;
    const returnUrl = data.returnUrl;
    const refreshUrl = data.refreshUrl;
    if (!userId || !returnUrl || !refreshUrl) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters');
    }
    try {
        // For now, create a basic account
        const account = await stripe.accounts.create({
            type: 'express',
            capabilities: {
                card_payments: { requested: true },
                transfers: { requested: true },
            },
        });
        // Create account link
        const accountLink = await stripe.accountLinks.create({
            account: account.id,
            refresh_url: refreshUrl,
            return_url: returnUrl,
            type: 'account_onboarding',
        });
        // Save account ID to user document
        await admin.firestore().doc(`users/${userId}`).update({
            stripeAccountId: account.id,
        });
        return { accountLinkUrl: accountLink.url };
    }
    catch (error) {
        console.error('Error creating account link:', error);
        throw new functions.https.HttpsError('internal', 'Failed to create account link');
    }
});
// Simple getStripeAccountStatus function
exports.getStripeAccountStatus = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = data.userId;
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
            needsRefresh: false, // Simplified for now
        };
    }
    catch (error) {
        console.error('Error getting account status:', error);
        throw new functions.https.HttpsError('internal', 'Failed to get account status');
    }
});
//# sourceMappingURL=simple.js.map