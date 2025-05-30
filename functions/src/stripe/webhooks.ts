import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

// Initialize Stripe with secret key
const stripe = new Stripe(functions.config().stripe.secret_key, {
  apiVersion: '2023-10-16',
});

const endpointSecret = functions.config().stripe.webhook_secret;

// Stripe webhook handler
export const stripeWebhooks = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'];

  if (!sig || !endpointSecret) {
    console.error('Missing stripe signature or webhook secret');
    res.status(400).send('Missing stripe signature or webhook secret');
    return;
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    res.status(400).send(`Webhook Error: ${err}`);
    return;
  }

  console.log('Received webhook event:', event.type);

  try {
    switch (event.type) {
      case 'account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;

      case 'account.external_account.created':
        await handleExternalAccountCreated(event.data.object as Stripe.BankAccount | Stripe.Card);
        break;

      case 'account.external_account.updated':
        await handleExternalAccountUpdated(event.data.object as Stripe.BankAccount | Stripe.Card);
        break;

      case 'account.external_account.deleted':
        await handleExternalAccountDeleted(event.data.object as Stripe.BankAccount | Stripe.Card);
        break;

      case 'transfer.created':
        await handleTransferCreated(event.data.object as Stripe.Transfer);
        break;

      case 'transfer.paid':
        await handleTransferPaid(event.data.object as Stripe.Transfer);
        break;

      case 'transfer.failed':
        await handleTransferFailed(event.data.object as Stripe.Transfer);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send('Internal server error');
  }
});

// Handle account updates (onboarding completion, verification status changes)
const handleAccountUpdated = async (account: Stripe.Account) => {
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
        currentlyDue: account.requirements?.currently_due || [],
        pastDue: account.requirements?.past_due || [],
        pendingVerification: account.requirements?.pending_verification || [],
        disabled: account.requirements?.disabled_reason,
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
    if (account.requirements?.currently_due?.length > 0) {
      await sendAccountAttentionNeededNotification(userId, account.requirements.currently_due);
    }

  } catch (error) {
    console.error('Error handling account update:', error);
    throw error;
  }
};

// Handle external account creation (bank account or card added)
const handleExternalAccountCreated = async (externalAccount: Stripe.BankAccount | Stripe.Card) => {
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

  } catch (error) {
    console.error('Error handling external account creation:', error);
    throw error;
  }
};

// Handle external account updates (verification status changes)
const handleExternalAccountUpdated = async (externalAccount: Stripe.BankAccount | Stripe.Card) => {
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
      const bankAccount = externalAccount as Stripe.BankAccount;
      if (bankAccount.status === 'verified') {
        await sendBankAccountVerifiedNotification(userId, bankAccount);
      } else if (bankAccount.status === 'verification_failed') {
        await sendBankAccountVerificationFailedNotification(userId, bankAccount);
      }
    }

  } catch (error) {
    console.error('Error handling external account update:', error);
    throw error;
  }
};

// Handle external account deletion
const handleExternalAccountDeleted = async (externalAccount: Stripe.BankAccount | Stripe.Card) => {
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

  } catch (error) {
    console.error('Error handling external account deletion:', error);
    throw error;
  }
};

// Handle transfer creation (payment to contractor)
const handleTransferCreated = async (transfer: Stripe.Transfer) => {
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

  } catch (error) {
    console.error('Error handling transfer creation:', error);
    throw error;
  }
};

// Handle transfer completion (payment successful)
const handleTransferPaid = async (transfer: Stripe.Transfer) => {
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

  } catch (error) {
    console.error('Error handling transfer payment:', error);
    throw error;
  }
};

// Handle transfer failure
const handleTransferFailed = async (transfer: Stripe.Transfer) => {
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

  } catch (error) {
    console.error('Error handling transfer failure:', error);
    throw error;
  }
};

// Notification helper functions
const sendAccountVerifiedNotification = async (userId: string) => {
  await admin.firestore().collection('notifications').add({
    userId,
    type: 'payment_account_verified',
    title: 'Payment Account Verified',
    message: 'Your payment account has been successfully verified. You can now receive payments.',
    read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
};

const sendAccountAttentionNeededNotification = async (userId: string, requirements: string[]) => {
  await admin.firestore().collection('notifications').add({
    userId,
    type: 'payment_account_attention_needed',
    title: 'Payment Account Needs Attention',
    message: `Your payment account requires additional information: ${requirements.join(', ')}`,
    read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
};

const sendPaymentMethodAddedNotification = async (userId: string, paymentMethod: Stripe.BankAccount | Stripe.Card) => {
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

const sendBankAccountVerifiedNotification = async (userId: string, bankAccount: Stripe.BankAccount) => {
  await admin.firestore().collection('notifications').add({
    userId,
    type: 'bank_account_verified',
    title: 'Bank Account Verified',
    message: `Your bank account ending in ${bankAccount.last4} has been verified.`,
    read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
};

const sendBankAccountVerificationFailedNotification = async (userId: string, bankAccount: Stripe.BankAccount) => {
  await admin.firestore().collection('notifications').add({
    userId,
    type: 'bank_account_verification_failed',
    title: 'Bank Account Verification Failed',
    message: `Verification failed for your bank account ending in ${bankAccount.last4}. Please try again.`,
    read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
};

const sendPaymentReceivedNotification = async (userId: string, transfer: Stripe.Transfer) => {
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

const sendPaymentFailedNotification = async (userId: string, transfer: Stripe.Transfer) => {
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