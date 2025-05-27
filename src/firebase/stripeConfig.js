// Stripe configuration
const stripeConfig = {
  publishableKey: process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY,
  options: {
    apiVersion: '2023-10-16',
    locale: 'en',
  }
};

// Initialize Stripe
let stripePromise = null;
const getStripe = async () => {
  if (!stripePromise) {
    const { loadStripe } = await import('@stripe/stripe-js');
    if (!stripeConfig.publishableKey) {
      console.error('Stripe publishable key is not configured');
      throw new Error('Stripe publishable key is missing');
    }
    stripePromise = loadStripe(stripeConfig.publishableKey);
  }
  return stripePromise;
};

// Validation helper
export const isStripeConfigured = () => {
  return Boolean(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
};

export { stripeConfig, getStripe }; 