import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

// Initialize Stripe with secret key
const stripe = new Stripe(functions.config().stripe.secret_key, {
  apiVersion: '2023-10-16',
});

// Create payment for completed job
export const createJobPayment = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { jobId, contractorId, amount, description } = data;

  if (!jobId || !contractorId || !amount || amount <= 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required payment parameters');
  }

  try {
    // Verify the job exists and is completed
    const jobDoc = await admin.firestore().doc(`jobs/${jobId}`).get();
    if (!jobDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Job not found');
    }

    const jobData = jobDoc.data();
    if (jobData?.status !== 'completed') {
      throw new functions.https.HttpsError('failed-precondition', 'Job must be completed before payment');
    }

    if (jobData?.contractorId !== contractorId) {
      throw new functions.https.HttpsError('permission-denied', 'Contractor mismatch');
    }

    // Get contractor's Stripe account
    const contractorDoc = await admin.firestore().doc(`users/${contractorId}`).get();
    if (!contractorDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Contractor not found');
    }

    const contractorData = contractorDoc.data();
    if (!contractorData?.stripeAccountId) {
      throw new functions.https.HttpsError('failed-precondition', 'Contractor has no payment account');
    }

    // Check if contractor's account can receive transfers
    const account = await stripe.accounts.retrieve(contractorData.stripeAccountId);
    if (!account.charges_enabled || !account.payouts_enabled) {
      throw new functions.https.HttpsError('failed-precondition', 'Contractor account not ready for payments');
    }

    // Calculate platform fee (e.g., 5% of payment)
    const platformFeePercent = 0.05; // 5%
    const platformFee = Math.round(amount * platformFeePercent * 100); // Convert to cents
    const contractorAmount = Math.round(amount * 100) - platformFee; // Amount contractor receives

    // Create the transfer to contractor
    const transfer = await stripe.transfers.create({
      amount: contractorAmount,
      currency: 'usd',
      destination: contractorData.stripeAccountId,
      description: description || `Payment for job ${jobId}`,
      metadata: {
        jobId,
        contractorId,
        platformFee: platformFee.toString(),
      },
    });

    // Record the payment in Firestore
    const paymentData = {
      jobId,
      contractorId,
      landlordId: jobData.landlordId,
      stripeTransferId: transfer.id,
      totalAmount: amount * 100, // Store in cents
      contractorAmount,
      platformFee,
      currency: 'usd',
      status: 'created',
      description: description || `Payment for job ${jobId}`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const paymentRef = await admin.firestore().collection('payments').add(paymentData);

    // Update job with payment reference
    await admin.firestore().doc(`jobs/${jobId}`).update({
      paymentId: paymentRef.id,
      paymentStatus: 'created',
      paidAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      paymentId: paymentRef.id,
      transferId: transfer.id,
      contractorAmount: contractorAmount / 100, // Return in dollars
      platformFee: platformFee / 100, // Return in dollars
    };

  } catch (error) {
    console.error('Error creating job payment:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to create payment');
  }
});

// Get payment history for a contractor
export const getContractorPayments = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { contractorId, limit = 20, startAfter } = data;

  if (!contractorId) {
    throw new functions.https.HttpsError('invalid-argument', 'Contractor ID is required');
  }

  // Verify user can access this contractor's payments
  if (context.auth.uid !== contractorId) {
    throw new functions.https.HttpsError('permission-denied', 'Can only access own payment history');
  }

  try {
    let query = admin.firestore()
      .collection('payments')
      .where('contractorId', '==', contractorId)
      .orderBy('createdAt', 'desc')
      .limit(limit);

    if (startAfter) {
      const startAfterDoc = await admin.firestore().doc(`payments/${startAfter}`).get();
      if (startAfterDoc.exists) {
        query = query.startAfter(startAfterDoc);
      }
    }

    const paymentsSnapshot = await query.get();
    
    const payments = paymentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      totalAmount: doc.data().totalAmount / 100, // Convert to dollars
      contractorAmount: doc.data().contractorAmount / 100, // Convert to dollars
      platformFee: doc.data().platformFee / 100, // Convert to dollars
    }));

    return { payments };

  } catch (error) {
    console.error('Error getting contractor payments:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get payment history');
  }
});

// Get payment details
export const getPaymentDetails = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { paymentId } = data;

  if (!paymentId) {
    throw new functions.https.HttpsError('invalid-argument', 'Payment ID is required');
  }

  try {
    const paymentDoc = await admin.firestore().doc(`payments/${paymentId}`).get();
    if (!paymentDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Payment not found');
    }

    const paymentData = paymentDoc.data();

    // Verify user can access this payment
    if (context.auth.uid !== paymentData?.contractorId && context.auth.uid !== paymentData?.landlordId) {
      throw new functions.https.HttpsError('permission-denied', 'Cannot access this payment');
    }

    // Get additional details from Stripe if available
    let stripeDetails = null;
    if (paymentData?.stripeTransferId) {
      try {
        const transfer = await stripe.transfers.retrieve(paymentData.stripeTransferId);
        stripeDetails = {
          status: transfer.failure_code ? 'failed' : 'succeeded',
          failureCode: transfer.failure_code,
          failureMessage: transfer.failure_message,
          created: transfer.created,
        };
      } catch (stripeError) {
        console.error('Error fetching Stripe transfer details:', stripeError);
      }
    }

    return {
      id: paymentDoc.id,
      ...paymentData,
      totalAmount: paymentData.totalAmount / 100, // Convert to dollars
      contractorAmount: paymentData.contractorAmount / 100, // Convert to dollars
      platformFee: paymentData.platformFee / 100, // Convert to dollars
      stripeDetails,
    };

  } catch (error) {
    console.error('Error getting payment details:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to get payment details');
  }
});

// Calculate contractor earnings summary
export const getContractorEarnings = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { contractorId, timeframe = 'month' } = data; // 'week', 'month', 'year', 'all'

  if (!contractorId) {
    throw new functions.https.HttpsError('invalid-argument', 'Contractor ID is required');
  }

  // Verify user can access this contractor's earnings
  if (context.auth.uid !== contractorId) {
    throw new functions.https.HttpsError('permission-denied', 'Can only access own earnings');
  }

  try {
    let startDate: Date;
    const now = new Date();

    switch (timeframe) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(0); // All time
    }

    let query = admin.firestore()
      .collection('payments')
      .where('contractorId', '==', contractorId)
      .where('status', 'in', ['created', 'paid']);

    if (timeframe !== 'all') {
      query = query.where('createdAt', '>=', startDate);
    }

    const paymentsSnapshot = await query.get();
    
    let totalEarnings = 0;
    let totalJobs = 0;
    let pendingPayments = 0;
    let completedPayments = 0;

    paymentsSnapshot.docs.forEach(doc => {
      const payment = doc.data();
      const amount = payment.contractorAmount / 100; // Convert to dollars
      
      totalEarnings += amount;
      totalJobs++;

      if (payment.status === 'paid') {
        completedPayments += amount;
      } else {
        pendingPayments += amount;
      }
    });

    // Calculate average earnings per job
    const averagePerJob = totalJobs > 0 ? totalEarnings / totalJobs : 0;

    return {
      timeframe,
      totalEarnings: parseFloat(totalEarnings.toFixed(2)),
      totalJobs,
      averagePerJob: parseFloat(averagePerJob.toFixed(2)),
      completedPayments: parseFloat(completedPayments.toFixed(2)),
      pendingPayments: parseFloat(pendingPayments.toFixed(2)),
    };

  } catch (error) {
    console.error('Error calculating contractor earnings:', error);
    throw new functions.https.HttpsError('internal', 'Failed to calculate earnings');
  }
});

// Refund payment (admin function)
export const refundPayment = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Check if user is admin (you'll need to implement admin role checking)
  const userDoc = await admin.firestore().doc(`users/${context.auth.uid}`).get();
  const userData = userDoc.data();
  
  if (!userData?.isAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }

  const { paymentId, reason } = data;

  if (!paymentId) {
    throw new functions.https.HttpsError('invalid-argument', 'Payment ID is required');
  }

  try {
    const paymentDoc = await admin.firestore().doc(`payments/${paymentId}`).get();
    if (!paymentDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Payment not found');
    }

    const paymentData = paymentDoc.data();
    
    if (paymentData?.status === 'refunded') {
      throw new functions.https.HttpsError('failed-precondition', 'Payment already refunded');
    }

    if (!paymentData?.stripeTransferId) {
      throw new functions.https.HttpsError('failed-precondition', 'No Stripe transfer found');
    }

    // Create reversal for the transfer
    const reversal = await stripe.transfers.createReversal(paymentData.stripeTransferId, {
      amount: paymentData.contractorAmount,
      description: reason || 'Payment refund',
      metadata: {
        paymentId,
        reason: reason || 'Refund requested',
      },
    });

    // Update payment status
    await admin.firestore().doc(`payments/${paymentId}`).update({
      status: 'refunded',
      refundReason: reason,
      stripeReversalId: reversal.id,
      refundedAt: admin.firestore.FieldValue.serverTimestamp(),
      refundedBy: context.auth.uid,
    });

    // Update job payment status
    if (paymentData.jobId) {
      await admin.firestore().doc(`jobs/${paymentData.jobId}`).update({
        paymentStatus: 'refunded',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return {
      success: true,
      reversalId: reversal.id,
    };

  } catch (error) {
    console.error('Error refunding payment:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to refund payment');
  }
}); 