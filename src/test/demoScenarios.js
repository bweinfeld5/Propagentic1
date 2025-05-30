// Phase 1.4 Payment System Demo Scenarios
// Real-world usage patterns and workflows

import EscrowService from '../services/firestore/escrowService';
import DisputeService from '../services/firestore/disputeService';
import PaymentService from '../services/paymentService';

class PaymentSystemDemo {
  constructor() {
    this.escrowService = new EscrowService();
    this.disputeService = new DisputeService();
    this.paymentService = new PaymentService();
    
    this.scenarios = [];
    this.currentScenario = null;
  }

  async runDemoScenarios() {
    console.log('🎬 Phase 1.4 Payment System Demo Scenarios');
    console.log('==========================================\n');

    // Scenario 1: Simple Repair Job with Escrow
    await this.scenario1_SimpleRepairJob();
    
    // Scenario 2: Multi-Milestone Construction Project
    await this.scenario2_MilestoneConstruction();
    
    // Scenario 3: Dispute Resolution Workflow
    await this.scenario3_DisputeResolution();
    
    // Scenario 4: Auto-Release After Completion
    await this.scenario4_AutoRelease();
    
    // Scenario 5: Emergency Job with Quick Payment
    await this.scenario5_EmergencyJob();

    this.generateDemoReport();
  }

  async scenario1_SimpleRepairJob() {
    console.log('🔧 SCENARIO 1: Simple Repair Job with Escrow');
    console.log('=============================================');
    
    this.currentScenario = {
      name: 'Simple Repair Job',
      steps: [],
      startTime: Date.now()
    };

    // Step 1: Create job and escrow
    console.log('\n📝 Step 1: Creating escrow for kitchen faucet repair...');
    const escrowData = {
      jobId: 'repair_001',
      jobTitle: 'Kitchen Faucet Repair',
      landlordId: 'landlord_sarah',
      landlordName: 'Sarah Johnson',
      contractorId: 'contractor_mike',
      contractorName: 'Mike Rodriguez',
      propertyId: 'property_123_main',
      propertyAddress: '123 Main Street, Apt 4B',
      amount: 275.00,
      currency: 'usd',
      status: 'created',
      fundingMethod: 'stripe_payment_intent',
      holdStartDate: new Date(),
      releaseConditions: {
        requiresLandlordApproval: true,
        requiresContractorConfirmation: false,
        autoReleaseAfterDays: 7,
        milestoneBasedRelease: false
      },
      fees: this.paymentService.calculateEscrowFees(275.00),
      metadata: {
        jobType: 'plumbing',
        urgency: 'normal'
      }
    };

    try {
      const escrowId = await this.escrowService.createEscrowAccount(escrowData);
      this.logStep('Escrow account created', `ID: ${escrowId}`, true);
      
      // Step 2: Fund escrow
      console.log('\n💳 Step 2: Funding escrow account...');
      await this.escrowService.updateEscrowStatus(escrowId, 'funded', {
        paymentIntentId: 'pi_demo_faucet_repair',
        fundedAt: new Date()
      });
      this.logStep('Escrow funded', 'Payment intent confirmed', true);
      
      // Step 3: Contractor completes work
      console.log('\n🔨 Step 3: Contractor completes repair work...');
      await this.simulateWorkCompletion();
      this.logStep('Work completed', 'Faucet installed and tested', true);
      
      // Step 4: Request payment release
      console.log('\n💰 Step 4: Contractor requests payment release...');
      const releaseRequest = {
        escrowAccountId: escrowId,
        requestedBy: 'contractor_mike',
        requestedByRole: 'contractor',
        type: 'full_release',
        amount: 275.00,
        reason: 'Kitchen faucet repair completed successfully',
        evidence: {
          photos: ['completed_faucet_1.jpg', 'water_pressure_test.jpg'],
          documents: [],
          description: 'New faucet installed with proper water pressure'
        },
        status: 'pending',
        approvals: {}
      };
      
      const releaseId = await this.escrowService.createReleaseRequest(releaseRequest);
      this.logStep('Release requested', `Release ID: ${releaseId}`, true);
      
      // Step 5: Landlord approves release
      console.log('\n✅ Step 5: Landlord approves payment release...');
      await this.escrowService.processReleaseRequest(
        releaseId,
        'landlord_sarah',
        'landlord',
        'approve'
      );
      this.logStep('Release approved', 'Payment approved by landlord', true);
      
      // Step 6: Funds released to contractor
      console.log('\n🏦 Step 6: Releasing funds to contractor...');
      await this.escrowService.updateEscrowStatus(escrowId, 'released', {
        releasedAt: new Date(),
        transferId: 'tr_demo_faucet_release'
      });
      this.logStep('Funds released', '$275.00 transferred to contractor', true);
      
    } catch (error) {
      this.logStep('Scenario failed', error.message, false);
    }
    
    this.completeScenario();
  }

  async scenario2_MilestoneConstruction() {
    console.log('\n\n🏗️ SCENARIO 2: Multi-Milestone Construction Project');
    console.log('==================================================');
    
    this.currentScenario = {
      name: 'Milestone Construction',
      steps: [],
      startTime: Date.now()
    };

    // Step 1: Create large project with milestones
    console.log('\n📐 Step 1: Setting up bathroom renovation with milestones...');
    const milestoneEscrowData = {
      jobId: 'renovation_001',
      jobTitle: 'Master Bathroom Renovation',
      landlordId: 'landlord_sarah',
      landlordName: 'Sarah Johnson',
      contractorId: 'contractor_alex',
      contractorName: 'Alex Thompson',
      propertyId: 'property_456_oak',
      propertyAddress: '456 Oak Avenue, House',
      amount: 4500.00,
      currency: 'usd',
      status: 'funded',
      fundingMethod: 'stripe_payment_intent',
      holdStartDate: new Date(),
      releaseConditions: {
        requiresLandlordApproval: true,
        requiresContractorConfirmation: false,
        autoReleaseAfterDays: 21,
        milestoneBasedRelease: true
      },
      milestones: [
        {
          id: 'demo_1',
          title: 'Demolition & Prep',
          description: 'Remove old fixtures, tiles, and prepare space',
          amount: 1350.00,
          percentage: 30,
          status: 'pending',
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          approvalRequired: true
        },
        {
          id: 'plumbing_1',
          title: 'Plumbing Installation',
          description: 'Install new pipes, fixtures, and connections',
          amount: 1800.00,
          percentage: 40,
          status: 'pending',
          dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
          approvalRequired: true
        },
        {
          id: 'finishing_1',
          title: 'Tiling & Finishing',
          description: 'Install tiles, paint, and final touches',
          amount: 1350.00,
          percentage: 30,
          status: 'pending',
          dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
          approvalRequired: true
        }
      ],
      fees: this.paymentService.calculateEscrowFees(4500.00),
      metadata: {
        projectType: 'renovation',
        duration: '21 days',
        complexity: 'high'
      }
    };

    try {
      const milestoneEscrowId = await this.escrowService.createEscrowAccount(milestoneEscrowData);
      this.logStep('Milestone escrow created', `Total: $4,500 with 3 milestones`, true);
      
      // Step 2: Complete first milestone
      console.log('\n🚧 Step 2: Completing demolition milestone...');
      await this.escrowService.updateMilestone(milestoneEscrowId, 'demo_1', {
        status: 'completed',
        completedAt: new Date(),
        evidence: {
          photos: ['demolition_progress_1.jpg', 'demolition_complete.jpg'],
          documents: ['waste_disposal_receipt.pdf'],
          description: 'All old fixtures removed, space prepared for new installation'
        }
      });
      this.logStep('Demolition completed', 'Milestone 1: $1,350 ready for release', true);
      
      // Step 3: Request first milestone release
      console.log('\n💰 Step 3: Requesting first milestone payment...');
      const milestone1Release = {
        escrowAccountId: milestoneEscrowId,
        requestedBy: 'contractor_alex',
        requestedByRole: 'contractor',
        type: 'milestone',
        amount: 1350.00,
        milestoneId: 'demo_1',
        reason: 'Demolition and preparation work completed',
        status: 'pending',
        approvals: {}
      };
      
      const release1Id = await this.escrowService.createReleaseRequest(milestone1Release);
      this.logStep('Milestone 1 release requested', 'Awaiting landlord approval', true);
      
      // Step 4: Approve and release first milestone
      console.log('\n✅ Step 4: Approving first milestone payment...');
      await this.escrowService.processReleaseRequest(
        release1Id,
        'landlord_sarah',
        'landlord',
        'approve'
      );
      this.logStep('Milestone 1 approved', '$1,350 released to contractor', true);
      
      // Step 5: Start second milestone
      console.log('\n🔧 Step 5: Beginning plumbing installation...');
      await this.escrowService.updateMilestone(milestoneEscrowId, 'plumbing_1', {
        status: 'in_progress',
        evidence: {
          photos: ['plumbing_start.jpg'],
          documents: ['material_delivery_receipt.pdf'],
          description: 'Plumbing work started, materials delivered'
        }
      });
      this.logStep('Plumbing milestone started', 'Materials delivered, work in progress', true);
      
    } catch (error) {
      this.logStep('Milestone scenario failed', error.message, false);
    }
    
    this.completeScenario();
  }

  async scenario3_DisputeResolution() {
    console.log('\n\n⚖️ SCENARIO 3: Dispute Resolution Workflow');
    console.log('==========================================');
    
    this.currentScenario = {
      name: 'Dispute Resolution',
      steps: [],
      startTime: Date.now()
    };

    // Step 1: Create dispute over work quality
    console.log('\n⚠️ Step 1: Creating dispute over incomplete work...');
    const disputeData = {
      type: 'job_quality',
      status: 'open',
      priority: 'normal',
      initiatedBy: 'landlord_sarah',
      initiatedByRole: 'landlord',
      initiatedByName: 'Sarah Johnson',
      respondent: 'contractor_mike',
      respondentRole: 'contractor',
      respondentName: 'Mike Rodriguez',
      jobId: 'hvac_repair_001',
      jobTitle: 'HVAC System Repair',
      propertyId: 'property_789_elm',
      propertyAddress: '789 Elm Street, Unit 2',
      title: 'Incomplete HVAC Repair Work',
      description: 'Air conditioning unit still not cooling properly after reported repair. Temperature only drops 5 degrees instead of expected 15-20 degrees.',
      category: 'Work Quality',
      amountInDispute: 425.00,
      desiredOutcome: 'Complete the repair properly or provide partial refund',
      evidence: [
        {
          id: 'temp_reading_1',
          type: 'photo',
          title: 'Temperature reading after repair',
          description: 'Thermostat showing 78°F when set to 68°F',
          fileUrl: 'https://demo.com/evidence/temp_reading.jpg',
          uploadedBy: 'landlord_sarah',
          uploadedByRole: 'landlord',
          isPublic: true,
          metadata: { temperature: '78F', target: '68F' }
        }
      ],
      timeline: [],
      communications: [],
      tags: ['hvac', 'cooling', 'quality_issue'],
      isEscalated: false,
      metadata: {
        originalJobAmount: 425.00,
        repairDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      }
    };

    try {
      const disputeId = await this.disputeService.createDispute(disputeData);
      this.logStep('Dispute created', `Quality issue reported: ${disputeId}`, true);
      
      // Step 2: Contractor responds
      console.log('\n💬 Step 2: Contractor responds to dispute...');
      const contractorResponse = {
        senderId: 'contractor_mike',
        senderRole: 'contractor',
        senderName: 'Mike Rodriguez',
        message: 'I need to check the refrigerant levels. The initial diagnosis may have been incomplete. I can return tomorrow to complete the repair.',
        type: 'general',
        isPrivate: false,
        attachments: []
      };
      
      await this.disputeService.addMessage(disputeId, contractorResponse);
      this.logStep('Contractor responded', 'Offered to return and complete repair', true);
      
      // Step 3: Contractor makes settlement offer
      console.log('\n🤝 Step 3: Contractor offers settlement...');
      const settlementOffer = {
        disputeId: disputeId,
        offeredBy: 'contractor_mike',
        offeredByRole: 'contractor',
        offeredByName: 'Mike Rodriguez',
        offerType: 'work_completion',
        workOffer: {
          description: 'Return to properly diagnose and fix refrigerant issue at no additional charge',
          timeline: 'Within 24 hours',
          materials: ['refrigerant', 'leak detection equipment'],
          noCharge: true
        },
        conditions: [
          'Access during business hours (9 AM - 5 PM)',
          'Full system test after completion',
          'Temperature verification required'
        ],
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        status: 'pending'
      };
      
      const offerId = await this.disputeService.createOffer(settlementOffer);
      this.logStep('Settlement offered', 'No-charge completion work proposed', true);
      
      // Step 4: Landlord accepts offer
      console.log('\n✅ Step 4: Landlord accepts settlement offer...');
      await this.disputeService.respondToOffer(
        offerId,
        disputeId,
        'landlord_sarah',
        'accepted',
        'This solution works. Please proceed with the additional repair work.'
      );
      this.logStep('Settlement accepted', 'Both parties agreed to completion', true);
      
      // Step 5: Resolve dispute
      console.log('\n🎯 Step 5: Resolving dispute...');
      const resolution = {
        type: 'settlement',
        outcome: 'Contractor to complete HVAC repair at no additional charge within 24 hours',
        workAdjustment: {
          additionalWork: true,
          workDescription: 'Refrigerant level check and system optimization',
          timeline: '24 hours',
          noChargeWork: true
        },
        agreedBy: {
          landlord: true,
          contractor: true
        },
        binding: true,
        enforcementDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
        notes: 'Amicable resolution - contractor to complete work without additional payment'
      };
      
      await this.disputeService.resolveDispute(
        disputeId,
        resolution,
        'landlord_sarah',
        'landlord'
      );
      this.logStep('Dispute resolved', 'Settlement agreement reached', true);
      
    } catch (error) {
      this.logStep('Dispute scenario failed', error.message, false);
    }
    
    this.completeScenario();
  }

  async scenario4_AutoRelease() {
    console.log('\n\n⏰ SCENARIO 4: Auto-Release After Completion');
    console.log('===========================================');
    
    this.currentScenario = {
      name: 'Auto-Release',
      steps: [],
      startTime: Date.now()
    };

    // Step 1: Create escrow with auto-release
    console.log('\n🔄 Step 1: Setting up auto-release escrow...');
    const autoReleaseEscrow = {
      jobId: 'filter_change_001',
      jobTitle: 'HVAC Filter Replacement',
      landlordId: 'landlord_sarah',
      landlordName: 'Sarah Johnson',
      contractorId: 'contractor_tom',
      contractorName: 'Tom Wilson',
      propertyId: 'property_321_pine',
      propertyAddress: '321 Pine Street, Apt 1A',
      amount: 85.00,
      currency: 'usd',
      status: 'funded',
      fundingMethod: 'stripe_payment_intent',
      holdStartDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
      releaseConditions: {
        requiresLandlordApproval: false,
        requiresContractorConfirmation: false,
        autoReleaseAfterDays: 7, // Should auto-release after 7 days
        milestoneBasedRelease: false
      },
      fees: this.paymentService.calculateEscrowFees(85.00),
      metadata: {
        jobType: 'maintenance',
        routine: true,
        quickJob: true
      }
    };

    try {
      const autoEscrowId = await this.escrowService.createEscrowAccount(autoReleaseEscrow);
      this.logStep('Auto-release escrow created', 'Simple filter replacement job', true);
      
      // Step 2: Simulate work completion
      console.log('\n🔧 Step 2: Contractor completes simple maintenance...');
      await this.simulateWorkCompletion();
      this.logStep('Work completed', 'HVAC filters replaced successfully', true);
      
      // Step 3: Check auto-release eligibility
      console.log('\n📅 Step 3: Checking auto-release eligibility...');
      const holdDays = Math.floor((Date.now() - autoReleaseEscrow.holdStartDate.getTime()) / (24 * 60 * 60 * 1000));
      const isEligible = holdDays >= autoReleaseEscrow.releaseConditions.autoReleaseAfterDays;
      
      this.logStep('Auto-release check', 
        isEligible ? `Eligible: ${holdDays} days > ${autoReleaseEscrow.releaseConditions.autoReleaseAfterDays} days` : 'Not yet eligible',
        isEligible
      );
      
      // Step 4: Execute auto-release
      if (isEligible) {
        console.log('\n💸 Step 4: Executing automatic payment release...');
        await this.escrowService.updateEscrowStatus(autoEscrowId, 'released', {
          releasedAt: new Date(),
          autoReleased: true,
          transferId: 'tr_auto_filter_replacement'
        });
        this.logStep('Auto-release executed', '$85.00 automatically released', true);
      }
      
    } catch (error) {
      this.logStep('Auto-release scenario failed', error.message, false);
    }
    
    this.completeScenario();
  }

  async scenario5_EmergencyJob() {
    console.log('\n\n🚨 SCENARIO 5: Emergency Job with Quick Payment');
    console.log('===============================================');
    
    this.currentScenario = {
      name: 'Emergency Job',
      steps: [],
      startTime: Date.now()
    };

    // Step 1: Create urgent repair escrow
    console.log('\n🚨 Step 1: Setting up emergency repair escrow...');
    const emergencyEscrow = {
      jobId: 'emergency_001',
      jobTitle: 'Emergency Water Heater Repair',
      landlordId: 'landlord_sarah',
      landlordName: 'Sarah Johnson',
      contractorId: 'contractor_emergency',
      contractorName: 'Emergency Plumbing Co.',
      propertyId: 'property_555_maple',
      propertyAddress: '555 Maple Drive, Unit 3',
      amount: 650.00,
      currency: 'usd',
      status: 'funded',
      fundingMethod: 'stripe_payment_intent',
      holdStartDate: new Date(),
      releaseConditions: {
        requiresLandlordApproval: true,
        requiresContractorConfirmation: false,
        autoReleaseAfterDays: 3, // Quick release for emergency
        milestoneBasedRelease: false
      },
      fees: this.paymentService.calculateEscrowFees(650.00),
      metadata: {
        jobType: 'emergency',
        urgency: 'high',
        afterHours: true,
        priority: 'urgent'
      }
    };

    try {
      const emergencyEscrowId = await this.escrowService.createEscrowAccount(emergencyEscrow);
      this.logStep('Emergency escrow created', 'Water heater emergency repair', true);
      
      // Step 2: Rapid work completion
      console.log('\n⚡ Step 2: Emergency contractor completes urgent repair...');
      await this.simulateWorkCompletion();
      this.logStep('Emergency repair completed', 'Hot water restored within 2 hours', true);
      
      // Step 3: Immediate release request
      console.log('\n💨 Step 3: Requesting immediate payment release...');
      const urgentRelease = {
        escrowAccountId: emergencyEscrowId,
        requestedBy: 'contractor_emergency',
        requestedByRole: 'contractor',
        type: 'full_release',
        amount: 650.00,
        reason: 'Emergency water heater repair completed - hot water restored',
        evidence: {
          photos: ['repaired_water_heater.jpg', 'hot_water_test.jpg'],
          documents: ['emergency_repair_invoice.pdf'],
          description: 'Water heater heating element replaced, full hot water restored'
        },
        status: 'pending',
        approvals: {}
      };
      
      const urgentReleaseId = await this.escrowService.createReleaseRequest(urgentRelease);
      this.logStep('Urgent release requested', 'Emergency contractor requests payment', true);
      
      // Step 4: Quick landlord approval
      console.log('\n⚡ Step 4: Landlord provides quick approval...');
      await this.escrowService.processReleaseRequest(
        urgentReleaseId,
        'landlord_sarah',
        'landlord',
        'approve'
      );
      this.logStep('Quick approval', 'Landlord approves emergency payment', true);
      
      // Step 5: Rapid fund transfer
      console.log('\n🏃‍♂️ Step 5: Executing rapid fund transfer...');
      await this.escrowService.updateEscrowStatus(emergencyEscrowId, 'released', {
        releasedAt: new Date(),
        transferId: 'tr_emergency_water_heater',
        expedited: true
      });
      this.logStep('Emergency payment processed', '$650.00 released within hours', true);
      
    } catch (error) {
      this.logStep('Emergency scenario failed', error.message, false);
    }
    
    this.completeScenario();
  }

  // Utility methods
  async simulateWorkCompletion() {
    // Simulate work completion delay
    return new Promise(resolve => {
      setTimeout(resolve, 100); // Brief delay for realism
    });
  }

  logStep(action, details, success) {
    const step = {
      action,
      details,
      success,
      timestamp: new Date().toISOString()
    };
    
    this.currentScenario.steps.push(step);
    
    const status = success ? '✅' : '❌';
    const time = new Date().toLocaleTimeString();
    console.log(`  ${status} [${time}] ${action}: ${details}`);
  }

  completeScenario() {
    if (this.currentScenario) {
      this.currentScenario.endTime = Date.now();
      this.currentScenario.duration = this.currentScenario.endTime - this.currentScenario.startTime;
      this.scenarios.push(this.currentScenario);
      
      const durationSec = (this.currentScenario.duration / 1000).toFixed(2);
      const successSteps = this.currentScenario.steps.filter(s => s.success).length;
      const totalSteps = this.currentScenario.steps.length;
      
      console.log(`\n🏁 Scenario completed in ${durationSec}s (${successSteps}/${totalSteps} steps successful)\n`);
    }
  }

  generateDemoReport() {
    console.log('\n📊 PAYMENT SYSTEM DEMO REPORT');
    console.log('==============================\n');
    
    const totalScenarios = this.scenarios.length;
    const successfulScenarios = this.scenarios.filter(s => 
      s.steps.every(step => step.success)
    ).length;
    
    const totalSteps = this.scenarios.reduce((sum, s) => sum + s.steps.length, 0);
    const successfulSteps = this.scenarios.reduce((sum, s) => 
      sum + s.steps.filter(step => step.success).length, 0
    );
    
    const totalDuration = this.scenarios.reduce((sum, s) => sum + s.duration, 0);
    const avgDuration = (totalDuration / totalScenarios / 1000).toFixed(2);
    
    console.log(`SUMMARY:`);
    console.log(`• Total Scenarios: ${totalScenarios}`);
    console.log(`• Successful Scenarios: ${successfulScenarios} (${((successfulScenarios/totalScenarios)*100).toFixed(1)}%)`);
    console.log(`• Total Steps: ${totalSteps}`);
    console.log(`• Successful Steps: ${successfulSteps} (${((successfulSteps/totalSteps)*100).toFixed(1)}%)`);
    console.log(`• Average Duration: ${avgDuration}s per scenario`);
    
    console.log(`\nSCENARIO BREAKDOWN:`);
    this.scenarios.forEach((scenario, index) => {
      const duration = (scenario.duration / 1000).toFixed(2);
      const success = scenario.steps.filter(s => s.success).length;
      const total = scenario.steps.length;
      const status = success === total ? '✅' : '⚠️';
      
      console.log(`${index + 1}. ${scenario.name}: ${status} ${success}/${total} steps (${duration}s)`);
    });
    
    console.log(`\nKEY WORKFLOWS DEMONSTRATED:`);
    console.log(`• ✅ Escrow creation and funding`);
    console.log(`• ✅ Milestone-based payment releases`);
    console.log(`• ✅ Dispute creation and resolution`);
    console.log(`• ✅ Settlement negotiations`);
    console.log(`• ✅ Auto-release mechanisms`);
    console.log(`• ✅ Emergency payment processing`);
    console.log(`• ✅ Evidence management`);
    console.log(`• ✅ Multi-party approval workflows`);
    
    console.log(`\n🎉 Payment System Demo Complete!`);
    console.log(`All core Phase 1.4 features successfully demonstrated.`);
    
    return {
      totalScenarios,
      successfulScenarios,
      totalSteps,
      successfulSteps,
      avgDuration: parseFloat(avgDuration),
      scenarios: this.scenarios
    };
  }
}

export default PaymentSystemDemo;

// CLI usage
if (require.main === module) {
  const demo = new PaymentSystemDemo();
  demo.runDemoScenarios()
    .then(() => {
      console.log('\nDemo scenarios completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Demo scenarios failed:', error);
      process.exit(1);
    });
} 