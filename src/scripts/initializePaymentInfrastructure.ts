import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

// Initialize Payment Infrastructure for Phase 1.4
const initializePaymentInfrastructure = async () => {
  console.log('🚀 Initializing Phase 1.4 Payment Infrastructure...');

  try {
    // 1. Initialize Escrow Templates
    console.log('📋 Creating escrow templates...');
    
    const escrowTemplates = [
      {
        id: 'standard_job_escrow',
        name: 'Standard Job Escrow',
        description: 'Standard escrow terms for single-payment jobs',
        releaseConditions: {
          requiresLandlordApproval: true,
          requiresContractorConfirmation: false,
          autoReleaseAfterDays: 7,
          milestoneBasedRelease: false
        },
        defaultTerms: {
          currency: 'usd',
          platformFeePercentage: 0.05,
          autoReleaseEnabled: true,
          disputeEligibleDays: 30
        },
        isActive: true,
        category: 'standard',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      {
        id: 'milestone_project_escrow',
        name: 'Milestone Project Escrow',
        description: 'Escrow with milestone-based releases for larger projects',
        releaseConditions: {
          requiresLandlordApproval: true,
          requiresContractorConfirmation: true,
          autoReleaseAfterDays: null,
          milestoneBasedRelease: true
        },
        defaultTerms: {
          currency: 'usd',
          platformFeePercentage: 0.05,
          autoReleaseEnabled: false,
          disputeEligibleDays: 60
        },
        isActive: true,
        category: 'milestone',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      {
        id: 'emergency_repair_escrow',
        name: 'Emergency Repair Escrow',
        description: 'Fast-track escrow for emergency repairs',
        releaseConditions: {
          requiresLandlordApproval: true,
          requiresContractorConfirmation: false,
          autoReleaseAfterDays: 3,
          milestoneBasedRelease: false
        },
        defaultTerms: {
          currency: 'usd',
          platformFeePercentage: 0.05,
          autoReleaseEnabled: true,
          disputeEligibleDays: 14
        },
        isActive: true,
        category: 'emergency',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    ];

    for (const template of escrowTemplates) {
      await setDoc(doc(db, 'escrowTemplates', template.id), template);
      console.log(`✅ Created escrow template: ${template.name}`);
    }

    // 2. Initialize Dispute Categories
    console.log('⚖️ Creating dispute categories...');
    
    const disputeCategories = [
      {
        id: 'payment_disputes',
        name: 'Payment Disputes',
        description: 'Disputes related to payment amount, timing, or method',
        types: ['payment'],
        averageResolutionTime: 5, // days
        escalationThreshold: 3, // days before escalation
        isActive: true,
        priority: 'normal',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      {
        id: 'quality_disputes',
        name: 'Work Quality Disputes',
        description: 'Disputes about quality of work performed',
        types: ['job_quality'],
        averageResolutionTime: 7,
        escalationThreshold: 5,
        isActive: true,
        priority: 'normal',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      {
        id: 'completion_disputes',
        name: 'Job Completion Disputes',
        description: 'Disputes about whether work was completed',
        types: ['job_completion'],
        averageResolutionTime: 5,
        escalationThreshold: 3,
        isActive: true,
        priority: 'high',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      {
        id: 'contract_disputes',
        name: 'Contract Term Disputes',
        description: 'Disputes about contract terms and agreements',
        types: ['contract_terms'],
        averageResolutionTime: 10,
        escalationThreshold: 7,
        isActive: true,
        priority: 'normal',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      {
        id: 'communication_disputes',
        name: 'Communication Disputes',
        description: 'Disputes about communication and coordination',
        types: ['communication'],
        averageResolutionTime: 3,
        escalationThreshold: 2,
        isActive: true,
        priority: 'low',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    ];

    for (const category of disputeCategories) {
      await setDoc(doc(db, 'disputeCategories', category.id), category);
      console.log(`✅ Created dispute category: ${category.name}`);
    }

    // 3. Initialize Mediation Templates
    console.log('🤝 Creating mediation templates...');
    
    const mediationTemplates = [
      {
        id: 'standard_mediation',
        name: 'Standard Mediation Process',
        description: 'Standard mediation workflow for most disputes',
        steps: [
          {
            order: 1,
            name: 'Initial Assessment',
            description: 'Review dispute details and evidence',
            estimatedDuration: 60, // minutes
            required: true
          },
          {
            order: 2,
            name: 'Party Statements',
            description: 'Allow each party to present their case',
            estimatedDuration: 120,
            required: true
          },
          {
            order: 3,
            name: 'Evidence Review',
            description: 'Review and discuss evidence provided',
            estimatedDuration: 90,
            required: true
          },
          {
            order: 4,
            name: 'Solution Discussion',
            description: 'Explore potential solutions and compromises',
            estimatedDuration: 120,
            required: true
          },
          {
            order: 5,
            name: 'Agreement Drafting',
            description: 'Draft final agreement or resolution',
            estimatedDuration: 60,
            required: false
          }
        ],
        totalEstimatedDuration: 450, // minutes
        maxSessions: 3,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      {
        id: 'expedited_mediation',
        name: 'Expedited Mediation Process',
        description: 'Fast-track mediation for urgent disputes',
        steps: [
          {
            order: 1,
            name: 'Rapid Assessment',
            description: 'Quick review of dispute essentials',
            estimatedDuration: 30,
            required: true
          },
          {
            order: 2,
            name: 'Direct Negotiation',
            description: 'Direct negotiation between parties',
            estimatedDuration: 60,
            required: true
          },
          {
            order: 3,
            name: 'Resolution',
            description: 'Immediate resolution or escalation',
            estimatedDuration: 30,
            required: true
          }
        ],
        totalEstimatedDuration: 120,
        maxSessions: 1,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    ];

    for (const template of mediationTemplates) {
      await setDoc(doc(db, 'mediationTemplates', template.id), template);
      console.log(`✅ Created mediation template: ${template.name}`);
    }

    // 4. Initialize Payment Notification Templates
    console.log('📧 Creating payment notification templates...');
    
    const paymentNotificationTemplates = [
      {
        id: 'escrow_funded',
        name: 'Escrow Funded Notification',
        subject: 'Escrow Account Funded - Job {jobTitle}',
        bodyTemplate: 'Hello {recipientName},\\n\\nThe escrow account for job "{jobTitle}" has been successfully funded.\\n\\nEscrow Details:\\n- Amount: ${amount}\\n- Job: {jobTitle}\\n- Property: {propertyAddress}\\n- Contractor: {contractorName}\\n\\nPayment will be released upon job completion and landlord approval.\\nAuto-release: {autoReleaseAfterDays} days after completion (if no disputes)\\n\\nBest regards,\\nPropAgentic Team',
        channels: ['email', 'in_app'],
        variables: ['recipientName', 'jobTitle', 'amount', 'propertyAddress', 'contractorName', 'milestones', 'autoReleaseAfterDays'],
        isActive: true,
        category: 'escrow',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      {
        id: 'escrow_released',
        name: 'Escrow Released Notification',
        subject: 'Payment Released - Job {jobTitle}',
        bodyTemplate: 'Hello {recipientName},\\n\\nPayment for job "{jobTitle}" has been released from escrow.\\n\\nPayment Details:\\n- Amount Released: ${releasedAmount}\\n- Job: {jobTitle}\\n- Property: {propertyAddress}\\n- Release Reason: {releaseReason}\\n\\nThe funds will appear in your Stripe account within 1-2 business days.\\n\\nBest regards,\\nPropAgentic Team',
        channels: ['email', 'in_app', 'sms'],
        variables: ['recipientName', 'jobTitle', 'releasedAmount', 'propertyAddress', 'releaseReason', 'milestone', 'milestoneTitle'],
        isActive: true,
        category: 'payment',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      {
        id: 'dispute_created',
        name: 'Dispute Created Notification',
        subject: 'New Dispute Filed - {disputeTitle}',
        bodyTemplate: 'Hello {recipientName},\\n\\nA dispute has been filed regarding job "{jobTitle}".\\n\\nDispute Details:\\n- Title: {disputeTitle}\\n- Type: {disputeType}\\n- Priority: {disputePriority}\\n- Amount in Dispute: ${amountInDispute}\\n- Filed by: {initiatedByName}\\n\\nDescription:\\n{disputeDescription}\\n\\nYou have 3 business days to respond to this dispute. Please log in to your account to view details and respond.\\n\\nNote: Escrow funds (${escrowAmount}) are currently held pending resolution.\\n\\nBest regards,\\nPropAgentic Team',
        channels: ['email', 'in_app'],
        variables: ['recipientName', 'jobTitle', 'disputeTitle', 'disputeType', 'disputePriority', 'amountInDispute', 'initiatedByName', 'disputeDescription', 'escrowHeld', 'escrowAmount'],
        isActive: true,
        category: 'dispute',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      {
        id: 'mediation_requested',
        name: 'Mediation Requested Notification',
        subject: 'Mediation Requested - {disputeTitle}',
        bodyTemplate: 'Hello {recipientName},\\n\\nMediation has been requested for the dispute "{disputeTitle}".\\n\\nA neutral mediator will be assigned to help resolve this matter. You will be notified once a mediation session is scheduled.\\n\\nExpected Timeline:\\n- Mediator Assignment: 1-2 business days\\n- Session Scheduling: 3-5 business days\\n- Mediation Duration: {estimatedDuration} minutes\\n\\nPlease ensure you have all relevant evidence and documentation ready for the mediation session.\\n\\nBest regards,\\nPropAgentic Team',
        channels: ['email', 'in_app'],
        variables: ['recipientName', 'disputeTitle', 'estimatedDuration'],
        isActive: true,
        category: 'mediation',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      {
        id: 'auto_release_warning',
        name: 'Auto-Release Warning Notification',
        subject: 'Escrow Auto-Release Warning - {jobTitle}',
        bodyTemplate: 'Hello {recipientName},\\n\\nThis is a reminder that escrow funds for job "{jobTitle}" will be automatically released in {daysRemaining} days.\\n\\nEscrow Details:\\n- Amount: ${amount}\\n- Job: {jobTitle}\\n- Auto-Release Date: {autoReleaseDate}\\n\\nIf you have any concerns about the job completion or quality, please file a dispute before the auto-release date.\\n\\nTo file a dispute or approve early release, log in to your account.\\n\\nBest regards,\\nPropAgentic Team',
        channels: ['email', 'in_app'],
        variables: ['recipientName', 'jobTitle', 'daysRemaining', 'amount', 'autoReleaseDate'],
        isActive: true,
        category: 'warning',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    ];

    for (const template of paymentNotificationTemplates) {
      await setDoc(doc(db, 'paymentNotificationTemplates', template.id), template);
      console.log(`✅ Created payment notification template: ${template.name}`);
    }

    // 5. Initialize Payment Settings
    console.log('⚙️ Creating payment settings...');
    
    const paymentSettings = {
      id: 'global_payment_settings',
      platformFees: {
        standardFeePercentage: 0.05, // 5%
        expeditedFeePercentage: 0.07, // 7% for expedited jobs
        minimumFee: 2.00, // $2 minimum
        maximumFee: 500.00 // $500 maximum
      },
      stripeFees: {
        percentage: 0.029, // 2.9%
        fixedFee: 0.30 // $0.30
      },
      escrowSettings: {
        defaultAutoReleaseDays: 7,
        minimumAutoReleaseDays: 1,
        maximumAutoReleaseDays: 30,
        disputeEligibilityDays: 30,
        maximumEscrowAmount: 50000.00, // $50,000
        minimumEscrowAmount: 10.00 // $10
      },
      disputeSettings: {
        responseTimeLimit: 3, // days
        escalationThreshold: 7, // days
        mediationFee: 25.00, // $25 per session
        maximumMediationSessions: 3
      },
      complianceSettings: {
        kycRequired: true,
        amlChecksEnabled: true,
        dailyTransactionLimit: 10000.00, // $10,000
        monthlyTransactionLimit: 50000.00, // $50,000
        suspiciousActivityThreshold: 25000.00 // $25,000
      },
      currencies: {
        primary: 'usd',
        supported: ['usd']
      },
      notifications: {
        escrowFunded: true,
        paymentReleased: true,
        disputeCreated: true,
        mediationRequested: true,
        autoReleaseWarning: true
      },
      isActive: true,
      lastUpdated: serverTimestamp(),
      updatedBy: 'system',
      version: '1.0.0'
    };

    await setDoc(doc(db, 'paymentSettings', paymentSettings.id), paymentSettings);
    console.log('✅ Created global payment settings');

    // 6. Initialize Compliance Rules
    console.log('🛡️ Creating compliance rules...');
    
    const complianceRules = [
      {
        id: 'kyc_verification_rule',
        name: 'KYC Verification Rule',
        description: 'Require KYC verification for contractors receiving payments',
        type: 'kyc',
        conditions: [
          {
            field: 'user.role',
            operator: 'equals',
            value: 'contractor'
          },
          {
            field: 'payment.amount',
            operator: 'greater_than',
            value: 500.00
          }
        ],
        actions: [
          'require_kyc_verification',
          'hold_payment_until_verified'
        ],
        isActive: true,
        priority: 'high',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      {
        id: 'aml_monitoring_rule',
        name: 'AML Monitoring Rule',
        description: 'Monitor for suspicious payment patterns',
        type: 'aml',
        conditions: [
          {
            field: 'payment.amount',
            operator: 'greater_than',
            value: 10000.00
          }
        ],
        actions: [
          'flag_for_review',
          'enhanced_monitoring'
        ],
        isActive: true,
        priority: 'high',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      {
        id: 'rapid_succession_rule',
        name: 'Rapid Succession Payment Rule',
        description: 'Flag rapid succession of large payments',
        type: 'pattern_detection',
        conditions: [
          {
            field: 'payment.count_24h',
            operator: 'greater_than',
            value: 5
          },
          {
            field: 'payment.total_24h',
            operator: 'greater_than',
            value: 25000.00
          }
        ],
        actions: [
          'temporary_hold',
          'manual_review_required'
        ],
        isActive: true,
        priority: 'medium',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    ];

    for (const rule of complianceRules) {
      await setDoc(doc(db, 'complianceRules', rule.id), rule);
      console.log(`✅ Created compliance rule: ${rule.name}`);
    }

    console.log('🎉 Phase 1.4 Payment Infrastructure initialized successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   • ${escrowTemplates.length} escrow templates`);
    console.log(`   • ${disputeCategories.length} dispute categories`);
    console.log(`   • ${mediationTemplates.length} mediation templates`);
    console.log(`   • ${paymentNotificationTemplates.length} notification templates`);
    console.log(`   • ${complianceRules.length} compliance rules`);
    console.log('   • Global payment settings');
    console.log('');
    console.log('🔧 Next Steps:');
    console.log('   1. Deploy Firebase Cloud Functions for escrow processing');
    console.log('   2. Configure Stripe Connect accounts for contractors');
    console.log('   3. Set up webhook endpoints for payment events');
    console.log('   4. Test escrow creation and release flows');
    console.log('   5. Implement dispute resolution UI components');

  } catch (error) {
    console.error('❌ Error initializing payment infrastructure:', error);
    throw error;
  }
};

// Export for use in other scripts
export default initializePaymentInfrastructure;

// Allow direct execution
if (require.main === module) {
  initializePaymentInfrastructure()
    .then(() => {
      console.log('✅ Payment infrastructure initialization completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Payment infrastructure initialization failed:', error);
      process.exit(1);
    });
} 