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
exports.handleStripeError = exports.validateStripeConfig = exports.webhookConfig = exports.stripeConnectConfig = exports.stripe = void 0;
const functions = __importStar(require("firebase-functions"));
const stripe_1 = __importDefault(require("stripe"));
// Initialize Stripe with secret key
exports.stripe = new stripe_1.default(functions.config().stripe.secret_key, {
    apiVersion: '2023-10-16',
    typescript: true,
});
// Stripe Connect configuration
exports.stripeConnectConfig = {
    // Default settings for contractor accounts
    settings: {
        payouts_enabled: true,
        card_payments: {
            statement_descriptor_prefix: 'PROPAGENTIC',
        },
        payments: {
            statement_descriptor: 'PROPAGENTIC CONTRACTOR PAY',
        },
    },
    // Capabilities required for contractors
    capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
        tax_reporting_us_1099_k: { requested: true },
    },
    // Business profile for contractors
    business_profile: {
        mcc: '1520', // General Contractors
        product_description: 'Property maintenance and repair services',
        url: 'https://propagentic.com',
    },
    // Account requirements
    tos_acceptance: {
        service_agreement: 'recipient', // Required for US Connect accounts
    },
};
// Webhook configuration
exports.webhookConfig = {
    endpointSecret: functions.config().stripe.webhook_secret,
    tolerance: 300, // 5 minutes tolerance for webhook timestamps
};
// Validation helpers
const validateStripeConfig = () => {
    const requiredConfigs = [
        'stripe.secret_key',
        'stripe.webhook_secret',
        'stripe.connect.client_id',
    ];
    requiredConfigs.forEach(config => {
        var _a, _b, _c;
        const [namespace, key, subKey] = config.split('.');
        if (subKey) {
            if (!((_b = (_a = functions.config()[namespace]) === null || _a === void 0 ? void 0 : _a[key]) === null || _b === void 0 ? void 0 : _b[subKey])) {
                throw new Error(`Missing required config: ${config}`);
            }
        }
        else {
            if (!((_c = functions.config()[namespace]) === null || _c === void 0 ? void 0 : _c[key])) {
                throw new Error(`Missing required config: ${config}`);
            }
        }
    });
};
exports.validateStripeConfig = validateStripeConfig;
// Error handling
const handleStripeError = (error) => {
    console.error('Stripe error:', error);
    switch (error.type) {
        case 'StripeCardError':
            return new functions.https.HttpsError('invalid-argument', error.message);
        case 'StripeInvalidRequestError':
            return new functions.https.HttpsError('invalid-argument', error.message);
        case 'StripeConnectionError':
            return new functions.https.HttpsError('unavailable', 'Service temporarily unavailable');
        case 'StripeAuthenticationError':
            return new functions.https.HttpsError('unauthenticated', 'Authentication failed');
        default:
            return new functions.https.HttpsError('internal', 'An unexpected error occurred');
    }
};
exports.handleStripeError = handleStripeError;
//# sourceMappingURL=stripe.js.map