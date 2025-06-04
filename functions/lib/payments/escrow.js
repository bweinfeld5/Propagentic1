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
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoReleaseEscrowFunds = exports.getEscrowAccount = exports.refundEscrowFunds = exports.releaseEscrowFunds = exports.confirmEscrowPayment = exports.createEscrowPayment = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const stripe_1 = require("../config/stripe");
// Initialize Firestore
const db = admin.firestore();
// Create escrow account with Stripe Payment Intent
exports.createEscrowPayment = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { jobId, contractorId, amount, paymentMethodId, enableMilestones = false, milestones = [], autoReleaseAfterDays = 7 } = data;
    if (!jobId || !contractorId || !amount || amount <= 0) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required escrow parameters');
    }
    try {
        // Get job details
        const jobDoc = await db.doc(`jobs/${jobId}`).get();
        if (!jobDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Job not found');
        }
        const jobData = jobDoc.data();
        const landlordId = jobData.landlordId;
        // Get landlord and contractor details
        const [landlordDoc, contractorDoc] = await Promise.all([
            db.doc(`users/${landlordId}`).get(),
            db.doc(`users/${contractorId}`).get()
        ]);
        if (!landlordDoc.exists || !contractorDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'User not found');
        }
        const landlordData = landlordDoc.data();
        const contractorData = contractorDoc.data();
        // Verify contractor has Stripe account
        if (!contractorData.stripeAccountId) {
            throw new functions.https.HttpsError('failed-precondition', 'Contractor must have payment account');
        }
        // Calculate fees
        const platformFeePercentage = 0.05; // 5%
        const stripeFeePercentage = 0.029; // 2.9% + $0.30
        const stripeFixedFee = 0.30;
        const platformFee = Math.round(amount * platformFeePercentage * 100) / 100;
        const stripeFee = Math.round((amount * stripeFeePercentage + stripeFixedFee) * 100) / 100;
        const totalFees = platformFee + stripeFee;
        // Create Stripe Payment Intent for escrow funding
        const paymentIntent = await stripe_1.stripe.paymentIntents.create({
            amount: Math.round((amount + totalFees) * 100), // Convert to cents
            currency: 'usd',
            payment_method: paymentMethodId,
            confirmation_method: 'manual',
            confirm: true,
            setup_future_usage: 'off_session',
            description: `Escrow funding for job: ${jobData.title}`,
            metadata: {
                jobId,
                landlordId,
                contractorId,
                escrowAmount: (amount * 100).toString(),
                platformFee: (platformFee * 100).toString(),
                stripeFee: (stripeFee * 100).toString(),
            },
            // Hold the payment in escrow
            transfer_group: `escrow_${jobId}_${Date.now()}`,
        });
        // Process milestones if enabled
        let processedMilestones = [];
        if (enableMilestones && milestones.length > 0) {
            let totalPercentage = 0;
            processedMilestones = milestones.map((milestone, index) => {
                totalPercentage += milestone.percentage;
                return {
                    id: `milestone_${index + 1}`,
                    title: milestone.title,
                    description: milestone.description,
                    amount: Math.round((amount * milestone.percentage / 100) * 100) / 100,
                    percentage: milestone.percentage,
                    status: 'pending',
                    dueDate: milestone.dueDate ? new Date(milestone.dueDate) : null,
                    approvalRequired: milestone.approvalRequired || true
                };
            });
            if (totalPercentage !== 100) {
                throw new functions.https.HttpsError('invalid-argument', 'Milestone percentages must total 100%');
            }
        }
        // Create escrow account
        const escrowData = {
            jobId,
            jobTitle: jobData.title,
            landlordId,
            landlordName: `${landlordData.firstName} ${landlordData.lastName}`,
            contractorId,
            contractorName: `${contractorData.firstName} ${contractorData.lastName}`,
            propertyId: jobData.propertyId,
            propertyAddress: jobData.propertyAddress,
            amount,
            currency: 'usd',
            status: paymentIntent.status === 'succeeded' ? 'funded' : 'created',
            fundingMethod: 'stripe_payment_intent',
            paymentIntentId: paymentIntent.id,
            holdStartDate: admin.firestore.FieldValue.serverTimestamp(),
            releaseConditions: {
                requiresLandlordApproval: true,
                requiresContractorConfirmation: enableMilestones,
                autoReleaseAfterDays: enableMilestones ? null : autoReleaseAfterDays,
                milestoneBasedRelease: enableMilestones
            },
            milestones: processedMilestones.length > 0 ? processedMilestones : null,
            fees: {
                platformFee,
                stripeFee,
                totalFees
            },
            metadata: {
                stripeAccountId: contractorData.stripeAccountId,
                paymentMethodId,
                transferGroup: paymentIntent.transfer_group
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        if (paymentIntent.status === 'succeeded') {
            escrowData.fundedAt = admin.firestore.FieldValue.serverTimestamp();
        }
        const escrowRef = await db.collection('escrowAccounts').add(escrowData);
        // Create initial transaction record
        await db.collection('escrowTransactions').add({
            escrowAccountId: escrowRef.id,
            type: 'funding',
            amount: amount + totalFees,
            recipient: 'platform',
            status: paymentIntent.status === 'succeeded' ? 'completed' : 'pending',
            stripePaymentIntentId: paymentIntent.id,
            description: `Escrow funding for job: ${jobData.title}`,
            metadata: {
                paymentMethodId,
                clientSecret: paymentIntent.client_secret
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        // Update job with escrow information
        await db.doc(`jobs/${jobId}`).update({
            escrowAccountId: escrowRef.id,
            escrowStatus: paymentIntent.status === 'succeeded' ? 'funded' : 'pending',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return {
            escrowAccountId: escrowRef.id,
            paymentIntent: {
                id: paymentIntent.id,
                client_secret: paymentIntent.client_secret,
                status: paymentIntent.status
            },
            amount,
            fees: {
                platformFee,
                stripeFee,
                totalFees
            },
            requiresAction: paymentIntent.status === 'requires_action',
            nextAction: paymentIntent.next_action
        };
    }
    catch (error) {
        console.error('Error creating escrow payment:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Failed to create escrow payment');
    }
});
// Confirm escrow payment if additional authentication required
exports.confirmEscrowPayment = functions.https.onCall(async (data, context) => {
    var _a;
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { paymentIntentId, escrowAccountId } = data;
    if (!paymentIntentId || !escrowAccountId) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing payment intent or escrow account ID');
    }
    try {
        // Confirm the payment intent
        const paymentIntent = await stripe_1.stripe.paymentIntents.confirm(paymentIntentId);
        // Update escrow account status
        const updateData = {
            status: paymentIntent.status === 'succeeded' ? 'funded' : 'created',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        if (paymentIntent.status === 'succeeded') {
            updateData.fundedAt = admin.firestore.FieldValue.serverTimestamp();
        }
        await db.doc(`escrowAccounts/${escrowAccountId}`).update(updateData);
        // Update transaction status
        const transactionQuery = await db.collection('escrowTransactions')
            .where('escrowAccountId', '==', escrowAccountId)
            .where('type', '==', 'funding')
            .where('stripePaymentIntentId', '==', paymentIntentId)
            .get();
        if (!transactionQuery.empty) {
            const transactionDoc = transactionQuery.docs[0];
            await transactionDoc.ref.update({
                status: paymentIntent.status === 'succeeded' ? 'completed' : 'failed',
                failureReason: paymentIntent.status !== 'succeeded' ? (_a = paymentIntent.last_payment_error) === null || _a === void 0 ? void 0 : _a.message : null,
                processedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }
        return {
            paymentIntent: {
                id: paymentIntent.id,
                status: paymentIntent.status
            },
            requiresAction: paymentIntent.status === 'requires_action',
            nextAction: paymentIntent.next_action
        };
    }
    catch (error) {
        console.error('Error confirming escrow payment:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Failed to confirm escrow payment');
    }
});
// Release escrow funds to contractor
exports.releaseEscrowFunds = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { escrowAccountId, amount, milestoneId, reason } = data;
    if (!escrowAccountId) {
        throw new functions.https.HttpsError('invalid-argument', 'Escrow account ID is required');
    }
    try {
        const escrowDoc = await db.doc(`escrowAccounts/${escrowAccountId}`).get();
        if (!escrowDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Escrow account not found');
        }
        const escrowData = escrowDoc.data();
        // Verify escrow is funded
        if (escrowData.status !== 'funded') {
            throw new functions.https.HttpsError('failed-precondition', 'Escrow must be funded before release');
        }
        // Verify user has permission to release funds
        if (context.auth.uid !== escrowData.landlordId && context.auth.uid !== escrowData.contractorId) {
            // Check if user is admin
            const userDoc = await db.doc(`users/${context.auth.uid}`).get();
            const userData = userDoc.data();
            if (!(userData === null || userData === void 0 ? void 0 : userData.isAdmin)) {
                throw new functions.https.HttpsError('permission-denied', 'Not authorized to release funds');
            }
        }
        // Get contractor's Stripe account
        const contractorDoc = await db.doc(`users/${escrowData.contractorId}`).get();
        if (!contractorDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Contractor not found');
        }
        const contractorData = contractorDoc.data();
        if (!contractorData.stripeAccountId) {
            throw new functions.https.HttpsError('failed-precondition', 'Contractor has no payment account');
        }
        // Determine release amount
        let releaseAmount = amount || escrowData.amount;
        if (milestoneId && escrowData.milestones) {
            const milestone = escrowData.milestones.find((m) => m.id === milestoneId);
            if (!milestone) {
                throw new functions.https.HttpsError('not-found', 'Milestone not found');
            }
            if (milestone.status === 'released') {
                throw new functions.https.HttpsError('failed-precondition', 'Milestone already released');
            }
            releaseAmount = milestone.amount;
        }
        // Create transfer to contractor
        const transfer = await stripe_1.stripe.transfers.create({
            amount: Math.round(releaseAmount * 100), // Convert to cents
            currency: 'usd',
            destination: contractorData.stripeAccountId,
            description: `Escrow release: ${reason || 'Job completion'}`,
            metadata: {
                escrowAccountId,
                milestoneId: milestoneId || '',
                jobId: escrowData.jobId,
                contractorId: escrowData.contractorId,
            },
            transfer_group: escrowData.metadata.transferGroup,
        });
        // Create transaction record
        const transactionData = {
            escrowAccountId,
            type: milestoneId ? 'milestone_release' : 'full_release',
            amount: releaseAmount,
            recipient: 'contractor',
            status: 'completed',
            stripeTransferId: transfer.id,
            milestoneId: milestoneId || null,
            description: `Escrow release: ${reason || 'Job completion'}`,
            metadata: {
                transferGroup: escrowData.metadata.transferGroup,
                stripeAccountId: contractorData.stripeAccountId
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            processedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        await db.collection('escrowTransactions').add(transactionData);
        // Update escrow account
        const updateData = {
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        if (milestoneId && escrowData.milestones) {
            // Update specific milestone
            const updatedMilestones = escrowData.milestones.map((m) => {
                if (m.id === milestoneId) {
                    return Object.assign(Object.assign({}, m), { status: 'released', releasedAt: admin.firestore.FieldValue.serverTimestamp() });
                }
                return m;
            });
            updateData.milestones = updatedMilestones;
            // Check if all milestones are released
            const allReleased = updatedMilestones.every((m) => m.status === 'released');
            if (allReleased) {
                updateData.status = 'released';
                updateData.releasedAt = admin.firestore.FieldValue.serverTimestamp();
            }
        }
        else {
            // Full release
            updateData.status = 'released';
            updateData.releasedAt = admin.firestore.FieldValue.serverTimestamp();
        }
        await db.doc(`escrowAccounts/${escrowAccountId}`).update(updateData);
        // Update job status if fully released
        if (updateData.status === 'released') {
            await db.doc(`jobs/${escrowData.jobId}`).update({
                escrowStatus: 'released',
                paymentStatus: 'completed',
                paidAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }
        return {
            success: true,
            transferId: transfer.id,
            releasedAmount: releaseAmount,
            milestoneId,
            escrowStatus: updateData.status || escrowData.status
        };
    }
    catch (error) {
        console.error('Error releasing escrow funds:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Failed to release escrow funds');
    }
});
// Refund escrow funds to landlord
exports.refundEscrowFunds = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { escrowAccountId, amount, reason } = data;
    if (!escrowAccountId) {
        throw new functions.https.HttpsError('invalid-argument', 'Escrow account ID is required');
    }
    try {
        const escrowDoc = await db.doc(`escrowAccounts/${escrowAccountId}`).get();
        if (!escrowDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Escrow account not found');
        }
        const escrowData = escrowDoc.data();
        // Verify escrow is funded
        if (escrowData.status !== 'funded') {
            throw new functions.https.HttpsError('failed-precondition', 'Escrow must be funded before refund');
        }
        // Verify user has permission (landlord or admin)
        if (context.auth.uid !== escrowData.landlordId) {
            const userDoc = await db.doc(`users/${context.auth.uid}`).get();
            const userData = userDoc.data();
            if (!(userData === null || userData === void 0 ? void 0 : userData.isAdmin)) {
                throw new functions.https.HttpsError('permission-denied', 'Not authorized to refund escrow');
            }
        }
        const refundAmount = amount || escrowData.amount + escrowData.fees.totalFees;
        // Create refund via Stripe
        const paymentIntent = await stripe_1.stripe.paymentIntents.retrieve(escrowData.paymentIntentId);
        if (!paymentIntent.charges.data.length) {
            throw new functions.https.HttpsError('failed-precondition', 'No charge found for refund');
        }
        const charge = paymentIntent.charges.data[0];
        const refund = await stripe_1.stripe.refunds.create({
            charge: charge.id,
            amount: Math.round(refundAmount * 100), // Convert to cents
            reason: 'requested_by_customer',
            metadata: {
                escrowAccountId,
                jobId: escrowData.jobId,
                reason: reason || 'Escrow refund'
            }
        });
        // Create transaction record
        const transactionData = {
            escrowAccountId,
            type: 'refund',
            amount: refundAmount,
            recipient: 'landlord',
            status: refund.status === 'succeeded' ? 'completed' : 'failed',
            stripeTransferId: refund.id,
            description: `Escrow refund: ${reason || 'Job cancellation'}`,
            metadata: {
                refundId: refund.id,
                chargeId: charge.id
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            processedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        await db.collection('escrowTransactions').add(transactionData);
        // Update escrow account
        await db.doc(`escrowAccounts/${escrowAccountId}`).update({
            status: 'refunded',
            refundedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        // Update job status
        await db.doc(`jobs/${escrowData.jobId}`).update({
            escrowStatus: 'refunded',
            paymentStatus: 'refunded',
            refundedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return {
            success: true,
            refundId: refund.id,
            refundedAmount: refundAmount,
            refundStatus: refund.status
        };
    }
    catch (error) {
        console.error('Error refunding escrow funds:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Failed to refund escrow funds');
    }
});
// Get escrow account details
exports.getEscrowAccount = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { escrowAccountId } = data;
    if (!escrowAccountId) {
        throw new functions.https.HttpsError('invalid-argument', 'Escrow account ID is required');
    }
    try {
        const escrowDoc = await db.doc(`escrowAccounts/${escrowAccountId}`).get();
        if (!escrowDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Escrow account not found');
        }
        const escrowData = escrowDoc.data();
        // Verify user has permission to view
        if (context.auth.uid !== escrowData.landlordId &&
            context.auth.uid !== escrowData.contractorId) {
            const userDoc = await db.doc(`users/${context.auth.uid}`).get();
            const userData = userDoc.data();
            if (!(userData === null || userData === void 0 ? void 0 : userData.isAdmin)) {
                throw new functions.https.HttpsError('permission-denied', 'Not authorized to view escrow');
            }
        }
        // Get transaction history
        const transactionsSnapshot = await db.collection('escrowTransactions')
            .where('escrowAccountId', '==', escrowAccountId)
            .orderBy('createdAt', 'desc')
            .get();
        const transactions = transactionsSnapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        return Object.assign(Object.assign({ id: escrowDoc.id }, escrowData), { transactions });
    }
    catch (error) {
        console.error('Error getting escrow account:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Failed to get escrow account');
    }
});
// Scheduled function to auto-release escrow funds
exports.autoReleaseEscrowFunds = functions.pubsub
    .schedule('0 */6 * * *') // Run every 6 hours
    .onRun(async (context) => {
    try {
        const now = admin.firestore.Timestamp.now();
        // Find escrow accounts eligible for auto-release
        const escrowSnapshot = await db.collection('escrowAccounts')
            .where('status', '==', 'funded')
            .where('releaseConditions.autoReleaseAfterDays', '>', 0)
            .get();
        for (const escrowDoc of escrowSnapshot.docs) {
            const escrowData = escrowDoc.data();
            const holdStartDate = escrowData.holdStartDate;
            const autoReleaseAfterDays = escrowData.releaseConditions.autoReleaseAfterDays;
            if (!holdStartDate || !autoReleaseAfterDays)
                continue;
            // Check if auto-release period has passed
            const releaseDate = new Date(holdStartDate.toDate());
            releaseDate.setDate(releaseDate.getDate() + autoReleaseAfterDays);
            if (releaseDate <= now.toDate()) {
                console.log(`Auto-releasing escrow: ${escrowDoc.id}`);
                try {
                    // Get contractor's Stripe account
                    const contractorDoc = await db.doc(`users/${escrowData.contractorId}`).get();
                    if (!contractorDoc.exists)
                        continue;
                    const contractorData = contractorDoc.data();
                    if (!contractorData.stripeAccountId)
                        continue;
                    // Create transfer to contractor
                    const transfer = await stripe_1.stripe.transfers.create({
                        amount: Math.round(escrowData.amount * 100),
                        currency: 'usd',
                        destination: contractorData.stripeAccountId,
                        description: `Auto-release escrow for job: ${escrowData.jobTitle}`,
                        metadata: {
                            escrowAccountId: escrowDoc.id,
                            jobId: escrowData.jobId,
                            autoRelease: 'true'
                        },
                        transfer_group: escrowData.metadata.transferGroup,
                    });
                    // Update escrow account
                    await escrowDoc.ref.update({
                        status: 'released',
                        releasedAt: admin.firestore.FieldValue.serverTimestamp(),
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                    // Create transaction record
                    await db.collection('escrowTransactions').add({
                        escrowAccountId: escrowDoc.id,
                        type: 'full_release',
                        amount: escrowData.amount,
                        recipient: 'contractor',
                        status: 'completed',
                        stripeTransferId: transfer.id,
                        description: `Auto-release after ${autoReleaseAfterDays} days`,
                        metadata: {
                            autoRelease: true,
                            transferGroup: escrowData.metadata.transferGroup
                        },
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        processedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                    // Update job status
                    await db.doc(`jobs/${escrowData.jobId}`).update({
                        escrowStatus: 'released',
                        paymentStatus: 'completed',
                        paidAt: admin.firestore.FieldValue.serverTimestamp(),
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                    console.log(`Successfully auto-released escrow: ${escrowDoc.id}`);
                }
                catch (transferError) {
                    console.error(`Error auto-releasing escrow ${escrowDoc.id}:`, transferError);
                    // Mark as failed
                    await escrowDoc.ref.update({
                        status: 'pending_release',
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        metadata: Object.assign(Object.assign({}, escrowData.metadata), { autoReleaseError: transferError.message, autoReleaseAttemptedAt: admin.firestore.FieldValue.serverTimestamp() })
                    });
                }
            }
        }
        console.log('Auto-release escrow check completed');
        return null;
    }
    catch (error) {
        console.error('Error in auto-release escrow function:', error);
        throw error;
    }
});
//# sourceMappingURL=escrow.js.map