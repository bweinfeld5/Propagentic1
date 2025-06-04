import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

// Initialize Stripe with the correct API version
const stripe = new Stripe(functions.config().stripe.secret_key, {
  apiVersion: '2025-05-28.basil', // Updated to the latest supported version
});

// Simple createStripeAccountLink function
export const createStripeAccountLink = functions.https.onCall(async (data, context) => {
  // Basic authentication check
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = (data as any).userId;
  const returnUrl = (data as any).returnUrl;
  const refreshUrl = (data as any).refreshUrl;

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
  } catch (error) {
    console.error('Error creating account link:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create account link');
  }
});

// Simple getStripeAccountStatus function
export const getStripeAccountStatus = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = (data as any).userId;

  try {
    const userDoc = await admin.firestore().doc(`users/${userId}`).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userData = userDoc.data();
    
    if (!userData?.stripeAccountId) {
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
  } catch (error) {
    console.error('Error getting account status:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get account status');
  }
}); 