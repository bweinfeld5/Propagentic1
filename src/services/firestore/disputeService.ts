import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp,
  onSnapshot,
  writeBatch,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../firebase/config';

// Interfaces for Dispute System
export interface Dispute {
  id?: string;
  type: 'payment' | 'job_quality' | 'job_completion' | 'contract_terms' | 'communication' | 'other';
  status: 'open' | 'in_mediation' | 'awaiting_response' | 'escalated' | 'resolved' | 'closed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  initiatedBy: string;
  initiatedByRole: 'landlord' | 'tenant' | 'contractor';
  initiatedByName: string;
  respondent: string;
  respondentRole: 'landlord' | 'tenant' | 'contractor';
  respondentName: string;
  jobId?: string;
  jobTitle?: string;
  escrowAccountId?: string;
  propertyId?: string;
  propertyAddress?: string;
  title: string;
  description: string;
  category: string;
  amountInDispute?: number;
  desiredOutcome: string;
  evidence: DisputeEvidence[];
  timeline: DisputeTimelineEvent[];
  mediationDetails?: MediationDetails;
  resolution?: DisputeResolution;
  communications: DisputeMessage[];
  tags: string[];
  isEscalated: boolean;
  escalatedAt?: Date;
  escalatedTo?: string; // Admin user ID
  autoCloseAt?: Date;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  closedAt?: Date;
}

export interface DisputeEvidence {
  id: string;
  type: 'photo' | 'document' | 'video' | 'audio' | 'text' | 'invoice' | 'contract';
  title: string;
  description?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  uploadedBy: string;
  uploadedByRole: string;
  uploadedAt: Date;
  isPublic: boolean; // Whether visible to both parties
  metadata: Record<string, any>;
}

export interface DisputeTimelineEvent {
  id: string;
  type: 'created' | 'response_submitted' | 'evidence_added' | 'mediation_requested' | 'mediation_started' | 'offer_made' | 'offer_accepted' | 'offer_rejected' | 'escalated' | 'resolved' | 'closed';
  description: string;
  actor: string;
  actorRole: string;
  actorName: string;
  timestamp: Date;
  metadata: Record<string, any>;
}

export interface MediationDetails {
  mediatorId?: string;
  mediatorName?: string;
  mediatorType: 'auto' | 'human' | 'ai_assisted';
  sessionId?: string;
  scheduledAt?: Date;
  startedAt?: Date;
  endedAt?: Date;
  status: 'requested' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  sessionNotes?: string;
  recommendedResolution?: string;
  mediationFee?: number;
  sessionDuration?: number; // in minutes
}

export interface DisputeResolution {
  type: 'settlement' | 'ruling' | 'withdrawal' | 'escalation';
  outcome: string;
  financialAdjustment?: {
    amount: number;
    direction: 'to_landlord' | 'to_contractor' | 'held_in_escrow' | 'refunded';
    reason: string;
  };
  workAdjustment?: {
    additionalWork: boolean;
    workDescription?: string;
    timeline?: string;
    noChargeWork?: boolean;
  };
  futureActions?: string[];
  agreedBy: {
    landlord?: boolean;
    contractor?: boolean;
    mediator?: boolean;
    admin?: boolean;
  };
  binding: boolean;
  enforcementDeadline?: Date;
  notes?: string;
  resolvedBy: string;
  resolvedByRole: string;
  resolvedAt: Date;
}

export interface DisputeMessage {
  id: string;
  senderId: string;
  senderRole: string;
  senderName: string;
  recipientId?: string; // For private messages to mediator
  message: string;
  type: 'general' | 'offer' | 'counter_offer' | 'clarification' | 'evidence_request' | 'mediation_note';
  isPrivate: boolean;
  attachments?: {
    name: string;
    url: string;
    type: string;
    size: number;
  }[];
  readBy: Record<string, Date>;
  timestamp: Date;
  editedAt?: Date;
  isEdited: boolean;
}

export interface DisputeOffer {
  id?: string;
  disputeId: string;
  offeredBy: string;
  offeredByRole: string;
  offeredByName: string;
  offerType: 'financial' | 'work_completion' | 'partial_refund' | 'credit' | 'replacement' | 'other';
  financialOffer?: {
    amount: number;
    description: string;
    paymentMethod: 'escrow_release' | 'direct_payment' | 'credit' | 'refund';
  };
  workOffer?: {
    description: string;
    timeline: string;
    materials?: string[];
    noCharge: boolean;
  };
  conditions?: string[];
  expiresAt?: Date;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn' | 'expired';
  responseBy?: string;
  responseAt?: Date;
  responseMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DisputeStats {
  totalDisputes: number;
  openDisputes: number;
  inMediationDisputes: number;
  resolvedDisputes: number;
  escalatedDisputes: number;
  averageResolutionTime: number; // in days
  resolutionRate: number; // percentage
  disputesByType: Record<string, number>;
  disputesByPriority: Record<string, number>;
}

class DisputeService {
  private disputesRef = collection(db, 'disputes');
  private disputeOffersRef = collection(db, 'disputeOffers');
  private mediationSessionsRef = collection(db, 'mediationSessions');

  // Create new dispute
  async createDispute(disputeData: Omit<Dispute, 'id' | 'createdAt' | 'updatedAt' | 'timeline' | 'communications'>): Promise<string> {
    try {
      const initialTimelineEvent: DisputeTimelineEvent = {
        id: `event_${Date.now()}`,
        type: 'created',
        description: `Dispute created by ${disputeData.initiatedByName}`,
        actor: disputeData.initiatedBy,
        actorRole: disputeData.initiatedByRole,
        actorName: disputeData.initiatedByName,
        timestamp: new Date(),
        metadata: {}
      };

      const dispute: Omit<Dispute, 'id'> = {
        ...disputeData,
        timeline: [initialTimelineEvent],
        communications: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(this.disputesRef, {
        ...dispute,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        timeline: dispute.timeline.map(event => ({
          ...event,
          timestamp: Timestamp.fromDate(event.timestamp)
        })),
        ...(dispute.autoCloseAt && { autoCloseAt: Timestamp.fromDate(dispute.autoCloseAt) }),
        ...(dispute.escalatedAt && { escalatedAt: Timestamp.fromDate(dispute.escalatedAt) }),
        ...(dispute.resolvedAt && { resolvedAt: Timestamp.fromDate(dispute.resolvedAt) }),
        ...(dispute.closedAt && { closedAt: Timestamp.fromDate(dispute.closedAt) })
      });

      console.log('Dispute created:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating dispute:', error);
      throw error;
    }
  }

  // Get dispute details
  async getDispute(disputeId: string): Promise<Dispute | null> {
    try {
      const docSnap = await getDoc(doc(this.disputesRef, disputeId));
      
      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        escalatedAt: data.escalatedAt?.toDate(),
        resolvedAt: data.resolvedAt?.toDate(),
        closedAt: data.closedAt?.toDate(),
        autoCloseAt: data.autoCloseAt?.toDate(),
        timeline: data.timeline?.map((event: any) => ({
          ...event,
          timestamp: event.timestamp?.toDate() || new Date()
        })) || [],
        communications: data.communications?.map((msg: any) => ({
          ...msg,
          timestamp: msg.timestamp?.toDate() || new Date(),
          editedAt: msg.editedAt?.toDate(),
          readBy: Object.fromEntries(
            Object.entries(msg.readBy || {}).map(([key, value]: [string, any]) => [
              key, 
              value?.toDate ? value.toDate() : new Date(value)
            ])
          )
        })) || [],
        evidence: data.evidence?.map((ev: any) => ({
          ...ev,
          uploadedAt: ev.uploadedAt?.toDate() || new Date()
        })) || [],
        mediationDetails: data.mediationDetails ? {
          ...data.mediationDetails,
          scheduledAt: data.mediationDetails.scheduledAt?.toDate(),
          startedAt: data.mediationDetails.startedAt?.toDate(),
          endedAt: data.mediationDetails.endedAt?.toDate()
        } : undefined,
        resolution: data.resolution ? {
          ...data.resolution,
          resolvedAt: data.resolution.resolvedAt?.toDate() || new Date(),
          enforcementDeadline: data.resolution.enforcementDeadline?.toDate()
        } : undefined
      } as Dispute;
    } catch (error) {
      console.error('Error getting dispute:', error);
      throw error;
    }
  }

  // Get disputes for a user
  async getDisputesForUser(userId: string, role: 'landlord' | 'contractor', status?: string): Promise<Dispute[]> {
    try {
      // Query for disputes where user is either initiator or respondent
      const q1 = query(
        this.disputesRef,
        where('initiatedBy', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const q2 = query(
        this.disputesRef,
        where('respondent', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const [snapshot1, snapshot2] = await Promise.all([
        getDocs(q1),
        getDocs(q2)
      ]);

      const allDisputes = [...snapshot1.docs, ...snapshot2.docs];
      
      // Remove duplicates and convert to Dispute objects
      const uniqueDisputes = Array.from(
        new Map(allDisputes.map(doc => [doc.id, doc])).values()
      );

      let disputes = uniqueDisputes.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          escalatedAt: data.escalatedAt?.toDate(),
          resolvedAt: data.resolvedAt?.toDate(),
          closedAt: data.closedAt?.toDate(),
          autoCloseAt: data.autoCloseAt?.toDate(),
          timeline: data.timeline?.map((event: any) => ({
            ...event,
            timestamp: event.timestamp?.toDate() || new Date()
          })) || [],
          communications: data.communications?.map((msg: any) => ({
            ...msg,
            timestamp: msg.timestamp?.toDate() || new Date(),
            editedAt: msg.editedAt?.toDate(),
            readBy: Object.fromEntries(
              Object.entries(msg.readBy || {}).map(([key, value]: [string, any]) => [
                key, 
                value?.toDate ? value.toDate() : new Date(value)
              ])
            )
          })) || [],
          evidence: data.evidence?.map((ev: any) => ({
            ...ev,
            uploadedAt: ev.uploadedAt?.toDate() || new Date()
          })) || [],
          mediationDetails: data.mediationDetails ? {
            ...data.mediationDetails,
            scheduledAt: data.mediationDetails.scheduledAt?.toDate(),
            startedAt: data.mediationDetails.startedAt?.toDate(),
            endedAt: data.mediationDetails.endedAt?.toDate()
          } : undefined,
          resolution: data.resolution ? {
            ...data.resolution,
            resolvedAt: data.resolution.resolvedAt?.toDate() || new Date(),
            enforcementDeadline: data.resolution.enforcementDeadline?.toDate()
          } : undefined
        } as Dispute;
      });

      // Filter by status if provided
      if (status) {
        disputes = disputes.filter(dispute => dispute.status === status);
      }

      return disputes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('Error getting disputes for user:', error);
      throw error;
    }
  }

  // Update dispute status
  async updateDisputeStatus(disputeId: string, status: Dispute['status'], metadata?: Record<string, any>): Promise<void> {
    try {
      const updateData: any = {
        status,
        updatedAt: serverTimestamp(),
        ...metadata
      };

      // Add timestamp fields based on status
      if (status === 'resolved') {
        updateData.resolvedAt = serverTimestamp();
      } else if (status === 'closed') {
        updateData.closedAt = serverTimestamp();
      } else if (status === 'escalated') {
        updateData.escalatedAt = serverTimestamp();
        updateData.isEscalated = true;
      }

      await updateDoc(doc(this.disputesRef, disputeId), updateData);
    } catch (error) {
      console.error('Error updating dispute status:', error);
      throw error;
    }
  }

  // Add timeline event
  async addTimelineEvent(disputeId: string, event: Omit<DisputeTimelineEvent, 'id' | 'timestamp'>): Promise<void> {
    try {
      const dispute = await this.getDispute(disputeId);
      if (!dispute) {
        throw new Error('Dispute not found');
      }

      const newEvent: DisputeTimelineEvent = {
        id: `event_${Date.now()}`,
        timestamp: new Date(),
        ...event
      };

      const updatedTimeline = [...dispute.timeline, newEvent];

      await updateDoc(doc(this.disputesRef, disputeId), {
        timeline: updatedTimeline.map(ev => ({
          ...ev,
          timestamp: Timestamp.fromDate(ev.timestamp)
        })),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error adding timeline event:', error);
      throw error;
    }
  }

  // Add evidence to dispute
  async addEvidence(disputeId: string, evidence: Omit<DisputeEvidence, 'id' | 'uploadedAt'>): Promise<void> {
    try {
      const dispute = await this.getDispute(disputeId);
      if (!dispute) {
        throw new Error('Dispute not found');
      }

      const newEvidence: DisputeEvidence = {
        id: `evidence_${Date.now()}`,
        uploadedAt: new Date(),
        ...evidence
      };

      const updatedEvidence = [...dispute.evidence, newEvidence];

      await updateDoc(doc(this.disputesRef, disputeId), {
        evidence: updatedEvidence.map(ev => ({
          ...ev,
          uploadedAt: Timestamp.fromDate(ev.uploadedAt)
        })),
        updatedAt: serverTimestamp()
      });

      // Add timeline event
      await this.addTimelineEvent(disputeId, {
        type: 'evidence_added',
        description: `Evidence added: ${evidence.title}`,
        actor: evidence.uploadedBy,
        actorRole: evidence.uploadedByRole,
        actorName: evidence.uploadedBy, // You might want to pass the actual name
        metadata: { evidenceId: newEvidence.id, evidenceType: evidence.type }
      });
    } catch (error) {
      console.error('Error adding evidence:', error);
      throw error;
    }
  }

  // Add message to dispute
  async addMessage(disputeId: string, message: Omit<DisputeMessage, 'id' | 'timestamp' | 'readBy' | 'isEdited'>): Promise<void> {
    try {
      const dispute = await this.getDispute(disputeId);
      if (!dispute) {
        throw new Error('Dispute not found');
      }

      const newMessage: DisputeMessage = {
        id: `msg_${Date.now()}`,
        timestamp: new Date(),
        readBy: { [message.senderId]: new Date() },
        isEdited: false,
        ...message
      };

      const updatedCommunications = [...dispute.communications, newMessage];

      await updateDoc(doc(this.disputesRef, disputeId), {
        communications: updatedCommunications.map(msg => ({
          ...msg,
          timestamp: Timestamp.fromDate(msg.timestamp),
          editedAt: msg.editedAt ? Timestamp.fromDate(msg.editedAt) : undefined,
          readBy: Object.fromEntries(
            Object.entries(msg.readBy).map(([key, value]) => [
              key, 
              Timestamp.fromDate(value as Date)
            ])
          )
        })),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  }

  // Create dispute offer
  async createOffer(offer: Omit<DisputeOffer, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const offerData: Omit<DisputeOffer, 'id'> = {
        ...offer,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(this.disputeOffersRef, {
        ...offerData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...(offerData.expiresAt && { expiresAt: Timestamp.fromDate(offerData.expiresAt) }),
        ...(offerData.responseAt && { responseAt: Timestamp.fromDate(offerData.responseAt) })
      });

      // Add timeline event to dispute
      await this.addTimelineEvent(offer.disputeId, {
        type: 'offer_made',
        description: `${offer.offerType} offer made by ${offer.offeredByName}`,
        actor: offer.offeredBy,
        actorRole: offer.offeredByRole,
        actorName: offer.offeredByName,
        metadata: { offerId: docRef.id, offerType: offer.offerType }
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating offer:', error);
      throw error;
    }
  }

  // Respond to dispute offer
  async respondToOffer(
    offerId: string, 
    disputeId: string,
    responderId: string, 
    response: 'accepted' | 'rejected', 
    responseMessage?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        status: response,
        responseBy: responderId,
        responseAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (responseMessage) {
        updateData.responseMessage = responseMessage;
      }

      await updateDoc(doc(this.disputeOffersRef, offerId), updateData);

      // Add timeline event
      await this.addTimelineEvent(disputeId, {
        type: response === 'accepted' ? 'offer_accepted' : 'offer_rejected',
        description: `Offer ${response} by responder`,
        actor: responderId,
        actorRole: 'contractor', // You might want to determine this dynamically
        actorName: responderId, // You might want to pass the actual name
        metadata: { offerId, response, responseMessage }
      });

      // If offer is accepted, potentially move dispute to resolution
      if (response === 'accepted') {
        await this.updateDisputeStatus(disputeId, 'resolved', {
          resolvedViaOffer: true,
          acceptedOfferId: offerId
        });
      }
    } catch (error) {
      console.error('Error responding to offer:', error);
      throw error;
    }
  }

  // Request mediation
  async requestMediation(disputeId: string, requestedBy: string, reason?: string): Promise<void> {
    try {
      const mediationDetails: MediationDetails = {
        mediatorType: 'auto',
        status: 'requested',
        sessionId: `session_${Date.now()}`
      };

      await updateDoc(doc(this.disputesRef, disputeId), {
        status: 'in_mediation',
        mediationDetails,
        updatedAt: serverTimestamp()
      });

      // Add timeline event
      await this.addTimelineEvent(disputeId, {
        type: 'mediation_requested',
        description: `Mediation requested${reason ? `: ${reason}` : ''}`,
        actor: requestedBy,
        actorRole: 'contractor', // Determine dynamically
        actorName: requestedBy, // Pass actual name
        metadata: { reason, sessionId: mediationDetails.sessionId }
      });
    } catch (error) {
      console.error('Error requesting mediation:', error);
      throw error;
    }
  }

  // Resolve dispute
  async resolveDispute(
    disputeId: string, 
    resolution: Omit<DisputeResolution, 'resolvedAt'>,
    resolvedBy: string,
    resolvedByRole: string
  ): Promise<void> {
    try {
      const resolvedResolution: DisputeResolution = {
        ...resolution,
        resolvedAt: new Date()
      };

      await updateDoc(doc(this.disputesRef, disputeId), {
        status: 'resolved',
        resolution: {
          ...resolvedResolution,
          resolvedAt: serverTimestamp(),
          ...(resolvedResolution.enforcementDeadline && {
            enforcementDeadline: Timestamp.fromDate(resolvedResolution.enforcementDeadline)
          })
        },
        resolvedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Add timeline event
      await this.addTimelineEvent(disputeId, {
        type: 'resolved',
        description: `Dispute resolved: ${resolution.outcome}`,
        actor: resolvedBy,
        actorRole: resolvedByRole,
        actorName: resolvedBy, // Pass actual name
        metadata: { resolutionType: resolution.type, binding: resolution.binding }
      });
    } catch (error) {
      console.error('Error resolving dispute:', error);
      throw error;
    }
  }

  // Get dispute statistics
  async getDisputeStats(userId?: string, role?: 'landlord' | 'contractor'): Promise<DisputeStats> {
    try {
      let disputes: Dispute[] = [];

      if (userId && role) {
        disputes = await this.getDisputesForUser(userId, role);
      } else {
        // Get all disputes (admin view)
        const querySnapshot = await getDocs(query(this.disputesRef, orderBy('createdAt', 'desc')));
        disputes = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            resolvedAt: data.resolvedAt?.toDate()
          } as Dispute;
        });
      }

      const totalDisputes = disputes.length;
      const openDisputes = disputes.filter(d => ['open', 'awaiting_response'].includes(d.status)).length;
      const inMediationDisputes = disputes.filter(d => d.status === 'in_mediation').length;
      const resolvedDisputes = disputes.filter(d => d.status === 'resolved').length;
      const escalatedDisputes = disputes.filter(d => d.isEscalated).length;

      // Calculate average resolution time
      const resolvedWithTimes = disputes.filter(d => d.status === 'resolved' && d.resolvedAt);
      const averageResolutionTime = resolvedWithTimes.length > 0
        ? resolvedWithTimes.reduce((sum, d) => {
            const resolutionTime = Math.floor((d.resolvedAt!.getTime() - d.createdAt.getTime()) / (1000 * 60 * 60 * 24));
            return sum + resolutionTime;
          }, 0) / resolvedWithTimes.length
        : 0;

      const resolutionRate = totalDisputes > 0 ? (resolvedDisputes / totalDisputes) * 100 : 0;

      // Group by type and priority
      const disputesByType = disputes.reduce((acc, d) => {
        acc[d.type] = (acc[d.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const disputesByPriority = disputes.reduce((acc, d) => {
        acc[d.priority] = (acc[d.priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalDisputes,
        openDisputes,
        inMediationDisputes,
        resolvedDisputes,
        escalatedDisputes,
        averageResolutionTime: Math.round(averageResolutionTime),
        resolutionRate: Math.round(resolutionRate),
        disputesByType,
        disputesByPriority
      };
    } catch (error) {
      console.error('Error getting dispute stats:', error);
      throw error;
    }
  }

  // Subscribe to dispute changes
  subscribeToDispute(disputeId: string, callback: (dispute: Dispute | null) => void): () => void {
    return onSnapshot(
      doc(this.disputesRef, disputeId),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          const dispute: Dispute = {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            escalatedAt: data.escalatedAt?.toDate(),
            resolvedAt: data.resolvedAt?.toDate(),
            closedAt: data.closedAt?.toDate(),
            autoCloseAt: data.autoCloseAt?.toDate(),
            timeline: data.timeline?.map((event: any) => ({
              ...event,
              timestamp: event.timestamp?.toDate() || new Date()
            })) || [],
            communications: data.communications?.map((msg: any) => ({
              ...msg,
              timestamp: msg.timestamp?.toDate() || new Date(),
              editedAt: msg.editedAt?.toDate(),
              readBy: Object.fromEntries(
                Object.entries(msg.readBy || {}).map(([key, value]: [string, any]) => [
                  key, 
                  value?.toDate ? value.toDate() : new Date(value)
                ])
              )
            })) || [],
            evidence: data.evidence?.map((ev: any) => ({
              ...ev,
              uploadedAt: ev.uploadedAt?.toDate() || new Date()
            })) || [],
            mediationDetails: data.mediationDetails ? {
              ...data.mediationDetails,
              scheduledAt: data.mediationDetails.scheduledAt?.toDate(),
              startedAt: data.mediationDetails.startedAt?.toDate(),
              endedAt: data.mediationDetails.endedAt?.toDate()
            } : undefined,
            resolution: data.resolution ? {
              ...data.resolution,
              resolvedAt: data.resolution.resolvedAt?.toDate() || new Date(),
              enforcementDeadline: data.resolution.enforcementDeadline?.toDate()
            } : undefined
          } as Dispute;
          callback(dispute);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('Error in dispute subscription:', error);
      }
    );
  }

  // Subscribe to user disputes
  subscribeToUserDisputes(userId: string, role: 'landlord' | 'contractor', callback: (disputes: Dispute[]) => void): () => void {
    const unsubscribe1 = onSnapshot(
      query(this.disputesRef, where('initiatedBy', '==', userId), orderBy('createdAt', 'desc')),
      () => this.getDisputesForUser(userId, role).then(callback),
      (error) => console.error('Error in user disputes subscription (initiated):', error)
    );

    const unsubscribe2 = onSnapshot(
      query(this.disputesRef, where('respondent', '==', userId), orderBy('createdAt', 'desc')),
      () => this.getDisputesForUser(userId, role).then(callback),
      (error) => console.error('Error in user disputes subscription (respondent):', error)
    );

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }
}

// Export the service instance as default
const disputeService = new DisputeService();
export default disputeService; 