import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp, 
  writeBatch,
  runTransaction,
  Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase/config';

// Import types
import {
  TenantUser,
  TenantProfile,
  PropertyAssociation,
  Invite,
  InviteCode,
  MaintenanceTicket,
  Property,
  Notification,
  TenantOnboardingData,
  MaintenanceFormData,
  ApiResponse,
  ValidationResult,
  InviteServiceResult,
  InviteCodeValidation
} from '../models/tenantSchema';

// Import converters
import {
  tenantUserConverter,
  tenantProfileConverter,
  inviteConverter,
  inviteCodeConverter,
  maintenanceTicketConverter,
  propertyConverter,
  notificationConverter
} from '../models/tenantConverters';

/**
 * Enhanced Tenant Service - Phase 1 Foundation
 * Handles all tenant-related operations with proper error handling and validation
 */
export class TenantService {
  private currentUser: { uid: string; email: string } | null = null;

  /**
   * Initialize service with current user
   */
  configure(currentUser: { uid: string; email: string } | null) {
    this.currentUser = currentUser;
  }

  // ==================== TENANT MANAGEMENT ====================

  /**
   * Create a new tenant profile
   */
  async createTenantProfile(
    uid: string, 
    onboardingData: TenantOnboardingData
  ): Promise<ApiResponse<TenantUser>> {
    try {
      if (!this.currentUser) {
        throw new Error('User not authenticated');
      }

      const tenantData: Partial<TenantUser> = {
        uid,
        email: this.currentUser.email,
        role: 'tenant',
        userType: 'tenant',
        firstName: onboardingData.personalInfo.firstName,
        lastName: onboardingData.personalInfo.lastName,
        name: `${onboardingData.personalInfo.firstName} ${onboardingData.personalInfo.lastName}`,
        phone: onboardingData.personalInfo.phone,
        status: 'active',
        emailVerified: false,
        onboardingComplete: true,
        profileComplete: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        preferences: {
          notifications: {
            email: true,
            push: true,
            sms: false,
            maintenanceUpdates: true,
            invoiceReminders: true,
            leaseUpdates: true,
            emergencyAlerts: true
          },
          theme: 'light',
          language: 'en',
          timezone: 'America/New_York',
          contactPreference: 'email',
          ...onboardingData.preferences
        },
        tenantProfile: {
          tenantId: uid,
          emergencyContact: onboardingData.emergencyContact,
          hasKeys: false,
          accessCodes: [],
          documents: []
        },
        propertyAssociations: []
      };

      // Save tenant data
      const tenantRef = doc(db, 'users', uid).withConverter(tenantUserConverter);
      await setDoc(tenantRef, tenantData as TenantUser);

      // Get the created tenant
      const tenantDoc = await getDoc(tenantRef);
      const tenant = tenantDoc.data();

      return {
        success: true,
        data: tenant,
        message: 'Tenant profile created successfully'
      };
    } catch (error: any) {
      console.error('Error creating tenant profile:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to create tenant profile'
      };
    }
  }

  /**
   * Get tenant profile by ID
   */
  async getTenantProfile(tenantId: string): Promise<ApiResponse<TenantUser>> {
    try {
      const tenantRef = doc(db, 'users', tenantId).withConverter(tenantUserConverter);
      const tenantDoc = await getDoc(tenantRef);

      if (!tenantDoc.exists()) {
        return {
          success: false,
          error: 'Tenant not found',
          message: 'Tenant profile does not exist'
        };
      }

      const tenant = tenantDoc.data();

      return {
        success: true,
        data: tenant,
        message: 'Tenant profile retrieved successfully'
      };
    } catch (error: any) {
      console.error('Error fetching tenant profile:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to fetch tenant profile'
      };
    }
  }

  /**
   * Update tenant profile
   */
  async updateTenantProfile(
    tenantId: string, 
    updateData: Partial<TenantUser>
  ): Promise<ApiResponse<TenantUser>> {
    try {
      if (!this.currentUser || this.currentUser.uid !== tenantId) {
        throw new Error('Unauthorized to update this profile');
      }

      const tenantRef = doc(db, 'users', tenantId);
      const updatePayload = {
        ...updateData,
        updatedAt: serverTimestamp()
      };

      await updateDoc(tenantRef, updatePayload);

      // Get updated tenant
      const updatedTenant = await this.getTenantProfile(tenantId);
      return updatedTenant;
    } catch (error: any) {
      console.error('Error updating tenant profile:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to update tenant profile'
      };
    }
  }

  // ==================== PROPERTY ASSOCIATIONS ====================

  /**
   * Get properties associated with a tenant
   */
  async getTenantProperties(tenantId: string): Promise<ApiResponse<Property[]>> {
    try {
      // Get tenant to find property associations
      const tenantResult = await this.getTenantProfile(tenantId);
      if (!tenantResult.success || !tenantResult.data) {
        return {
          success: false,
          error: 'Tenant not found',
          message: 'Cannot find tenant properties'
        };
      }

      const tenant = tenantResult.data;
      const propertyIds = tenant.propertyAssociations
        .filter(assoc => assoc.status === 'active')
        .map(assoc => assoc.propertyId);

      if (propertyIds.length === 0) {
        return {
          success: true,
          data: [],
          message: 'No properties found for tenant'
        };
      }

      // Fetch properties
      const properties: Property[] = [];
      for (const propertyId of propertyIds) {
        const propertyRef = doc(db, 'properties', propertyId).withConverter(propertyConverter);
        const propertyDoc = await getDoc(propertyRef);
        
        if (propertyDoc.exists()) {
          properties.push(propertyDoc.data());
        }
      }

      return {
        success: true,
        data: properties,
        message: 'Tenant properties retrieved successfully'
      };
    } catch (error: any) {
      console.error('Error fetching tenant properties:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to fetch tenant properties'
      };
    }
  }

  /**
   * Add property association to tenant
   */
  async addPropertyAssociation(
    tenantId: string,
    propertyId: string,
    unitId?: string,
    inviteId?: string
  ): Promise<ApiResponse<PropertyAssociation>> {
    try {
      const association: PropertyAssociation = {
        propertyId,
        unitId,
        status: 'active',
        startDate: Timestamp.now(),
        inviteId
      };

      // Update tenant document
      const tenantRef = doc(db, 'users', tenantId);
      await runTransaction(db, async (transaction) => {
        const tenantDoc = await transaction.get(tenantRef);
        
        if (!tenantDoc.exists()) {
          throw new Error('Tenant not found');
        }

        const tenantData = tenantDoc.data();
        const existingAssociations = tenantData.propertyAssociations || [];
        
        // Check if association already exists
        const existingIndex = existingAssociations.findIndex(
          (assoc: PropertyAssociation) => assoc.propertyId === propertyId
        );

        if (existingIndex >= 0) {
          // Update existing association
          existingAssociations[existingIndex] = association;
        } else {
          // Add new association
          existingAssociations.push(association);
        }

        transaction.update(tenantRef, {
          propertyAssociations: existingAssociations,
          updatedAt: serverTimestamp()
        });
      });

      return {
        success: true,
        data: association,
        message: 'Property association added successfully'
      };
    } catch (error: any) {
      console.error('Error adding property association:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to add property association'
      };
    }
  }

  // ==================== INVITE MANAGEMENT ====================

  /**
   * Get pending invites for a tenant by email
   */
  async getPendingInvites(tenantEmail: string): Promise<ApiResponse<Invite[]>> {
    try {
      const invitesRef = collection(db, 'invites').withConverter(inviteConverter);
      const q = query(
        invitesRef,
        where('tenantEmail', '==', tenantEmail),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const invites = snapshot.docs.map(doc => doc.data());

      return {
        success: true,
        data: invites,
        message: 'Pending invites retrieved successfully'
      };
    } catch (error: any) {
      console.error('Error fetching pending invites:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to fetch pending invites'
      };
    }
  }

  /**
   * Accept an invite
   */
  async acceptInvite(inviteId: string, tenantId: string): Promise<InviteServiceResult> {
    try {
      if (!this.currentUser || this.currentUser.uid !== tenantId) {
        throw new Error('Unauthorized to accept this invite');
      }

      return await runTransaction(db, async (transaction) => {
        // Get invite
        const inviteRef = doc(db, 'invites', inviteId);
        const inviteDoc = await transaction.get(inviteRef);

        if (!inviteDoc.exists()) {
          throw new Error('Invite not found');
        }

        const invite = inviteDoc.data() as Invite;

        if (invite.status !== 'pending') {
          throw new Error('Invite is no longer pending');
        }

        if (invite.tenantEmail !== this.currentUser?.email) {
          throw new Error('Invite is not for this email address');
        }

        // Update invite status
        transaction.update(inviteRef, {
          status: 'accepted',
          acceptedAt: serverTimestamp(),
          acceptedBy: tenantId,
          updatedAt: serverTimestamp()
        });

        // Add property association to tenant
        const tenantRef = doc(db, 'users', tenantId);
        const tenantDoc = await transaction.get(tenantRef);

        if (tenantDoc.exists()) {
          const tenantData = tenantDoc.data();
          const associations = tenantData.propertyAssociations || [];
          
          associations.push({
            propertyId: invite.propertyId,
            unitId: invite.unitId,
            status: 'active',
            startDate: Timestamp.now(),
            inviteId: inviteId
          });

          transaction.update(tenantRef, {
            propertyAssociations: associations,
            updatedAt: serverTimestamp()
          });
        }

        return {
          success: true,
          message: 'Invite accepted successfully',
          invite
        };
      });
    } catch (error: any) {
      console.error('Error accepting invite:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Decline an invite
   */
  async declineInvite(inviteId: string): Promise<InviteServiceResult> {
    try {
      const inviteRef = doc(db, 'invites', inviteId);
      
      await updateDoc(inviteRef, {
        status: 'declined',
        updatedAt: serverTimestamp()
      });

      return {
        success: true,
        message: 'Invite declined successfully'
      };
    } catch (error: any) {
      console.error('Error declining invite:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Validate invite code
   */
  async validateInviteCode(code: string): Promise<InviteCodeValidation> {
    try {
      const codeRef = doc(db, 'inviteCodes', code).withConverter(inviteCodeConverter);
      const codeDoc = await getDoc(codeRef);

      if (!codeDoc.exists()) {
        return {
          isValid: false,
          message: 'Invalid invite code'
        };
      }

      const inviteCode = codeDoc.data();

      // Check if code is active
      if (inviteCode.status !== 'active') {
        return {
          isValid: false,
          message: 'Invite code is no longer valid'
        };
      }

      // Check if code has expired
      if (inviteCode.expiresAt.toDate() < new Date()) {
        return {
          isValid: false,
          message: 'Invite code has expired'
        };
      }

      // Check usage limits
      if (inviteCode.currentUses >= inviteCode.maxUses) {
        return {
          isValid: false,
          message: 'Invite code has reached maximum usage'
        };
      }

      return {
        isValid: true,
        message: 'Valid invite code',
        propertyId: inviteCode.propertyId,
        propertyName: inviteCode.propertyName,
        unitId: inviteCode.unitId,
        restrictedEmail: inviteCode.email,
        expiresAt: inviteCode.expiresAt
      };
    } catch (error: any) {
      console.error('Error validating invite code:', error);
      return {
        isValid: false,
        message: 'Error validating invite code'
      };
    }
  }

  /**
   * Redeem invite code
   */
  async redeemInviteCode(code: string, tenantId: string): Promise<InviteServiceResult> {
    try {
      if (!this.currentUser || this.currentUser.uid !== tenantId) {
        throw new Error('Unauthorized to redeem this code');
      }

      // First validate the code
      const validation = await this.validateInviteCode(code);
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.message
        };
      }

      // Check email restriction if exists
      if (validation.restrictedEmail && validation.restrictedEmail !== this.currentUser?.email) {
        return {
          success: false,
          message: `This invite code is restricted to ${validation.restrictedEmail}`
        };
      }

      return await runTransaction(db, async (transaction) => {
        // Update invite code usage
        const codeRef = doc(db, 'inviteCodes', code);
        const codeDoc = await transaction.get(codeRef);
        
        if (!codeDoc.exists()) {
          throw new Error('Invite code not found');
        }

        const inviteCodeData = codeDoc.data();
        const newUsageCount = inviteCodeData.currentUses + 1;
        const newStatus = newUsageCount >= inviteCodeData.maxUses ? 'used' : 'active';

        transaction.update(codeRef, {
          currentUses: newUsageCount,
          status: newStatus,
          usedAt: serverTimestamp(),
          usedBy: tenantId
        });

        // Add property association to tenant
        const association: PropertyAssociation = {
          propertyId: validation.propertyId!,
          unitId: validation.unitId,
          status: 'active',
          startDate: Timestamp.now(),
          inviteCodeId: code
        };

        await this.addPropertyAssociation(
          tenantId,
          validation.propertyId!,
          validation.unitId,
          undefined
        );

        return {
          success: true,
          message: 'Invite code redeemed successfully',
          data: {
            propertyId: validation.propertyId,
            propertyName: validation.propertyName,
            unitId: validation.unitId
          }
        };
      });
    } catch (error: any) {
      console.error('Error redeeming invite code:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // ==================== MAINTENANCE TICKETS ====================

  /**
   * Create maintenance ticket
   */
  async createMaintenanceTicket(
    formData: MaintenanceFormData,
    propertyId: string,
    unitId?: string
  ): Promise<ApiResponse<MaintenanceTicket>> {
    try {
      if (!this.currentUser) {
        throw new Error('User not authenticated');
      }

      // Get property info for landlord ID
      const propertyRef = doc(db, 'properties', propertyId);
      const propertyDoc = await getDoc(propertyRef);
      
      if (!propertyDoc.exists()) {
        throw new Error('Property not found');
      }

      const property = propertyDoc.data();
      
      const ticketData: Partial<MaintenanceTicket> = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        status: 'pending',
        
        // Location details
        propertyId,
        propertyName: property.name || property.propertyName,
        unitId,
        location: formData.location,
        
        // Stakeholders
        submittedBy: this.currentUser.uid,
        landlordId: property.landlordId,
        
        // Media and scheduling
        photos: [], // Photos will be uploaded separately
        documents: [],
        preferredTimes: formData.preferredTimes,
        
        // Communication
        updates: [],
        messages: [],
        
        // Timestamps
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      // Create the ticket
      const ticketsRef = collection(db, 'tickets').withConverter(maintenanceTicketConverter);
      const ticketRef = doc(ticketsRef);
      await setDoc(ticketRef, ticketData as MaintenanceTicket);

      // Get the created ticket
      const ticketDoc = await getDoc(ticketRef);
      const ticket = ticketDoc.data();

      return {
        success: true,
        data: ticket,
        message: 'Maintenance ticket created successfully'
      };
    } catch (error: any) {
      console.error('Error creating maintenance ticket:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to create maintenance ticket'
      };
    }
  }

  /**
   * Get maintenance tickets for a tenant
   */
  async getTenantTickets(tenantId: string, status?: string): Promise<ApiResponse<MaintenanceTicket[]>> {
    try {
      const ticketsRef = collection(db, 'tickets').withConverter(maintenanceTicketConverter);
      let q = query(
        ticketsRef,
        where('submittedBy', '==', tenantId),
        orderBy('createdAt', 'desc')
      );

      if (status) {
        q = query(
          ticketsRef,
          where('submittedBy', '==', tenantId),
          where('status', '==', status),
          orderBy('createdAt', 'desc')
        );
      }

      const snapshot = await getDocs(q);
      const tickets = snapshot.docs.map(doc => doc.data());

      return {
        success: true,
        data: tickets,
        message: 'Tickets retrieved successfully'
      };
    } catch (error: any) {
      console.error('Error fetching tenant tickets:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to fetch tickets'
      };
    }
  }

  // ==================== NOTIFICATIONS ====================

  /**
   * Get notifications for a tenant
   */
  async getTenantNotifications(tenantId: string, unreadOnly = false): Promise<ApiResponse<Notification[]>> {
    try {
      const notificationsRef = collection(db, 'notifications').withConverter(notificationConverter);
      let q = query(
        notificationsRef,
        where('userId', '==', tenantId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      if (unreadOnly) {
        q = query(
          notificationsRef,
          where('userId', '==', tenantId),
          where('read', '==', false),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
      }

      const snapshot = await getDocs(q);
      const notifications = snapshot.docs.map(doc => doc.data());

      return {
        success: true,
        data: notifications,
        message: 'Notifications retrieved successfully'
      };
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to fetch notifications'
      };
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationRead(notificationId: string): Promise<ApiResponse<void>> {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true,
        readAt: serverTimestamp()
      });

      return {
        success: true,
        message: 'Notification marked as read'
      };
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to mark notification as read'
      };
    }
  }

  // ==================== FILE UPLOAD ====================

  /**
   * Upload file to Firebase Storage
   */
  async uploadFile(
    file: File, 
    path: string, 
    tenantId: string
  ): Promise<ApiResponse<{ url: string; path: string }>> {
    try {
      if (!this.currentUser || this.currentUser.uid !== tenantId) {
        throw new Error('Unauthorized to upload files');
      }

      const storageRef = ref(storage, `tenants/${tenantId}/${path}/${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      return {
        success: true,
        data: {
          url: downloadURL,
          path: snapshot.ref.fullPath
        },
        message: 'File uploaded successfully'
      };
    } catch (error: any) {
      console.error('Error uploading file:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to upload file'
      };
    }
  }

  // ==================== REAL-TIME SUBSCRIPTIONS ====================

  /**
   * Subscribe to tenant ticket updates
   */
  subscribeToTickets(
    tenantId: string, 
    callback: (tickets: MaintenanceTicket[]) => void,
    errorCallback?: (error: Error) => void
  ): () => void {
    try {
      const ticketsRef = collection(db, 'tickets').withConverter(maintenanceTicketConverter);
      const q = query(
        ticketsRef,
        where('submittedBy', '==', tenantId),
        orderBy('createdAt', 'desc')
      );

      return onSnapshot(
        q,
        (snapshot) => {
          const tickets = snapshot.docs.map(doc => doc.data());
          callback(tickets);
        },
        (error) => {
          console.error('Error in tickets subscription:', error);
          if (errorCallback) {
            errorCallback(error);
          }
        }
      );
    } catch (error: any) {
      console.error('Error setting up tickets subscription:', error);
      if (errorCallback) {
        errorCallback(error);
      }
      return () => {}; // Return empty unsubscribe function
    }
  }

  /**
   * Subscribe to tenant notifications
   */
  subscribeToNotifications(
    tenantId: string,
    callback: (notifications: Notification[]) => void,
    errorCallback?: (error: Error) => void
  ): () => void {
    try {
      const notificationsRef = collection(db, 'notifications').withConverter(notificationConverter);
      const q = query(
        notificationsRef,
        where('userId', '==', tenantId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      return onSnapshot(
        q,
        (snapshot) => {
          const notifications = snapshot.docs.map(doc => doc.data());
          callback(notifications);
        },
        (error) => {
          console.error('Error in notifications subscription:', error);
          if (errorCallback) {
            errorCallback(error);
          }
        }
      );
    } catch (error: any) {
      console.error('Error setting up notifications subscription:', error);
      if (errorCallback) {
        errorCallback(error);
      }
      return () => {}; // Return empty unsubscribe function
    }
  }
}

// Export singleton instance
export const tenantService = new TenantService();
export default tenantService; 