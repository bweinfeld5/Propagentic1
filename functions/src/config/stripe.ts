import * as functions from 'firebase-functions';
import Stripe from 'stripe';

// Initialize Stripe with secret key
export const stripe = new Stripe(functions.config().stripe.secret_key, {
  apiVersion: '2023-10-16',
  typescript: true,
});

// Stripe Connect configuration
export const stripeConnectConfig = {
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
export const webhookConfig = {
  endpointSecret: functions.config().stripe.webhook_secret,
  tolerance: 300, // 5 minutes tolerance for webhook timestamps
};

// Validation helpers
export const validateStripeConfig = (): void => {
  const requiredConfigs = [
    'stripe.secret_key',
    'stripe.webhook_secret',
    'stripe.connect.client_id',
  ];

  requiredConfigs.forEach(config => {
    const [namespace, key, subKey] = config.split('.');
    if (subKey) {
      if (!functions.config()[namespace]?.[key]?.[subKey]) {
        throw new Error(`Missing required config: ${config}`);
      }
    } else {
      if (!functions.config()[namespace]?.[key]) {
        throw new Error(`Missing required config: ${config}`);
      }
    }
  });
};

// Error handling
export const handleStripeError = (error: Stripe.StripeError): functions.https.HttpsError => {
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