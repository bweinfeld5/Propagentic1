import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with public key
export const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY!);

// Stripe configuration object
export const stripeConfig = {
  publishableKey: process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY!,
  apiVersion: '2023-10-16', // Use latest API version
  connectAccountType: 'express', // Use Express onboarding for simplicity
  connectAccountSettings: {
    payouts: {
      schedule: {
        interval: 'weekly',
        weekly_anchor: 'friday', // Pay contractors every Friday
      },
    },
    payments: {
      statement_descriptor: 'PROPAGENTIC PAY',
    },
  },
};

// Stripe Connect configuration
export const stripeConnectConfig = {
  onboardingType: 'express',
  capabilities: {
    card_payments: { requested: true },
    transfers: { requested: true },
    tax_reporting_us_1099_k: { requested: true },
  },
  businessType: 'individual',
  businessProfile: {
    mcc: '1520', // Merchant Category Code for General Contractors
    url: 'https://propagentic.com',
  },
};

// Validation helpers
export const isValidStripeSetup = (): boolean => {
  return Boolean(
    process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY &&
    process.env.REACT_APP_STRIPE_SECRET_KEY
  );
};

// Error messages
export const STRIPE_ERRORS = {
  MISSING_KEYS: 'Stripe API keys are not configured. Please check your environment variables.',
  INVALID_ACCOUNT: 'Invalid Stripe Connect account configuration.',
  ONBOARDING_FAILED: 'Failed to complete Stripe Connect onboarding.',
}; 