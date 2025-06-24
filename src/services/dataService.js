/**
 * Data Service - A unified interface for accessing data
 * Automatically switches between Firebase and demo data based on the current mode
 */

import { firebaseApp, db, auth, functions, storage, callFunction } from '../firebase/config';
import { 
  doc, 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  onSnapshot,
  collectionGroup,
  limit,
  orderBy,
  setDoc,
  writeBatch,
  runTransaction,
  Timestamp,
  increment,
  arrayUnion,
  arrayRemove,
  startAfter
} from 'firebase/firestore';
import * as demoData from '../utils/demoData';
import { resilientFirestoreOperation } from '../utils/retryUtils';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { 
  getTenantProperties, 
  getPropertyTenants, 
  createRelationship 
} from './propertyTenantService';

let currentUser = null;
let isDemoMode = false;
let propertiesUnsubscribe = null; // Declare propertiesUnsubscribe here

/**
 * Data service class with methods that work with both real and demo data
 */
class DataService {
  constructor() {
    this.isDemoMode = false;
    this.currentUser = null;
  }

  /**
   * Configure the service state
   * @param {Object} config - Configuration object
   * @param {boolean} config.isDemoMode - Whether demo mode is active
   * @param {Object} config.currentUser - Currently authenticated user
   * @param {string} config.userType - User type (optional)
   */
  configure({ isDemoMode, currentUser, userType }) {
    this.isDemoMode = isDemoMode;
    this.currentUser = currentUser;
    
    // Ensure userType is properly set even if missing
    if (userType) {
      // If explicitly provided, use it
      this.currentUser.userType = userType;
      this.currentUser.role = userType; // For backwards compatibility
    } else if (currentUser) {
      // Extract from user profile if available
      if (currentUser.userType) {
        // userType already exists on currentUser object
        this.currentUser.role = currentUser.userType; // Ensure role matches
      } else if (currentUser.role) {
        // role exists but userType doesn't
        this.currentUser.userType = currentUser.role;
      }
      
      // If still missing both userType and role, check for profile data
      if (!this.currentUser.userType && !this.currentUser.role) {
        // Try to get from localStorage as a fallback
        try {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const userData = JSON.parse(storedUser);
            if (userData.userType) {
              this.currentUser.userType = userData.userType;
              this.currentUser.role = userData.userType;
              console.log(`Set userType from localStorage: ${userData.userType}`);
            }
          }
        } catch (e) {
          console.error('Error reading user data from localStorage:', e);
        }
      }
    }
    
    console.log(`DataService configured: demoMode=${isDemoMode}, user=${currentUser?.uid}, userType=${this.currentUser?.userType || 'undefined'}`);
  }

  /**
   * Get properties for the current landlord
   * @returns {Promise<Array>} Array of property objects
   */
  async getPropertiesForCurrentLandlord() {
    if (!this.currentUser) {
      console.error('getPropertiesForCurrentLandlord: No authenticated user');
      throw new Error('No authenticated user');
    }

    console.log(`Fetching properties for landlord: ${this.currentUser.uid}`);
    
    if (this.isDemoMode) {
      console.log('Using demo data for properties');
      return demoData.getDemoPropertiesForLandlord('landlord-001');
    }

    const getPropertiesOperation = async () => {
      try {
        // Use only landlordId field for consistency
        console.log('Querying properties with landlordId field');
        const q = query(
          collection(db, 'properties'), 
          where('landlordId', '==', this.currentUser.uid)
        );
        
        const querySnapshot = await getDocs(q);
        const properties = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        console.log(`Query returned ${properties.length} properties`);
        return properties;
      } catch (error) {
        console.error('Error fetching properties:', error);
        throw error;
      }
    };

    // Use resilient operation for Firestore calls
    return await resilientFirestoreOperation(getPropertiesOperation, {
      operationName: 'Properties query',
      maxRetries: 2
    });
  }

  /**
   * Set up a real-time listener for properties with enhanced reliability
   * @param {Function} onData - Callback for data updates
   * @param {Function} onError - Callback for errors
   * @param {Object} options - Configuration options
   * @returns {Function} Unsubscribe function
   */
  subscribeToProperties(onData, onError, options = {}) {
    const {
      enableRetry = true,
      maxRetries = 5,
      retryDelay = 2000,
      enableConnectionMonitoring = true
    } = options;

    if (!this.currentUser) {
      console.error('subscribeToProperties: No authenticated user');
      const error = new Error('No authenticated user');
      onError(error);
      return () => {};
    }

    const userId = this.currentUser.uid;
    console.log(`Setting up enhanced properties subscription for user: ${userId}`);

    if (this.isDemoMode) {
      console.log('Using demo data for properties subscription');
      // In demo mode, just call onData once with demo data
      setTimeout(() => {
        const demoProperties = demoData.getDemoPropertiesForLandlord('landlord-001');
        console.log(`Returning ${demoProperties.length} demo properties`);
        onData(demoProperties);
      }, 500);
      return () => {};
    }

    let unsubscribe = null;
    let retryCount = 0;
    let retryTimeout = null;
    let connectionMonitor = null;
    let isActive = true;

    // Enhanced subscription setup with retry logic
    const setupSubscription = async () => {
      if (!isActive) return;

      try {
        // Check for empty or invalid user ID
        if (!userId || userId.trim() === '') {
          console.error('Invalid user ID for properties subscription');
          const error = new Error('Invalid user ID');
          onError(error);
          return;
        }

        console.log(`Setting up properties subscription (attempt ${retryCount + 1})`);
        
        const q = query(
          collection(db, 'properties'),
          where('landlordId', '==', userId)
        );
        
        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            if (!isActive) return;

            try {
              const properties = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                // Ensure dates are properly converted
                createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(),
                updatedAt: doc.data().updatedAt?.toDate ? doc.data().updatedAt.toDate() : new Date()
              }));
              
              console.log(`Properties subscription success: ${properties.length} properties received`);
              
              // Reset retry count on successful data receive
              retryCount = 0;
              
              onData(properties);
            } catch (dataError) {
              console.error('Error processing properties data:', dataError);
              onError(dataError);
            }
          },
          (error) => {
            if (!isActive) return;

            console.error(`Properties subscription failed (attempt ${retryCount + 1}):`, error);
            
            // Classify error type for retry decision
            const isRetryableError = 
              error.code === 'unavailable' ||
              error.code === 'deadline-exceeded' ||
              error.code === 'resource-exhausted' ||
              error.code === 'internal' ||
              error.code === 'failed-precondition' ||
              error.message?.includes('network') ||
              error.message?.includes('connection');

            if (enableRetry && isRetryableError && retryCount < maxRetries) {
              retryCount++;
              const delay = retryDelay * Math.pow(2, retryCount - 1); // Exponential backoff
              
              console.log(`Retrying properties subscription in ${delay}ms (attempt ${retryCount}/${maxRetries})`);
              
              retryTimeout = setTimeout(() => {
                if (isActive) {
                  setupSubscription();
                }
              }, delay);
            } else {
              console.error(`Properties subscription failed permanently after ${retryCount} retries`);
              onError(error);
            }
          }
        );
        
      } catch (setupError) {
        console.error('Error setting up properties subscription:', setupError);
        
        if (enableRetry && retryCount < maxRetries) {
          retryCount++;
          const delay = retryDelay * Math.pow(2, retryCount - 1);
          
          console.log(`Retrying subscription setup in ${delay}ms`);
          retryTimeout = setTimeout(() => {
            if (isActive) {
              setupSubscription();
            }
          }, delay);
        } else {
          onError(setupError);
        }
      }
    };

    // Connection monitoring (if available)
    if (enableConnectionMonitoring && typeof window !== 'undefined') {
      const handleOnline = () => {
        if (isActive) {
          console.log('Connection restored, re-establishing properties subscription');
          retryCount = 0; // Reset retry count on connection restore
          setupSubscription();
        }
      };

      const handleOffline = () => {
        console.log('Connection lost, properties subscription may be affected');
        // Don't call onError for offline events, just log
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      connectionMonitor = () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    // Start the subscription
    setupSubscription();
    
    // Return enhanced cleanup function
    return () => {
      isActive = false;
      
      console.log('Cleaning up properties subscription');
      
      // Clear retry timeout
      if (retryTimeout) {
        clearTimeout(retryTimeout);
        retryTimeout = null;
      }
      
      // Unsubscribe from Firestore
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
      
      // Clean up connection monitoring
      if (connectionMonitor) {
        connectionMonitor();
        connectionMonitor = null;
      }
    };
  }

  /**
   * Get maintenance tickets for the current user based on role
   * @returns {Promise<Array>} Array of ticket objects
   */
  async getTicketsForCurrentUser() {
    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    if (this.isDemoMode) {
      console.log('Demo mode: Using mock ticket data');
      // Determine which demo tickets to return based on user type
      const userProfile = demoData.getDemoUser(this.currentUser.uid) || 
                         { userType: 'landlord', id: 'landlord-001' };
      
      switch (userProfile.userType) {
        case 'landlord':
          return demoData.demoTickets;
        case 'tenant':
          return demoData.getDemoTicketsForTenant(userProfile.id);
        case 'contractor':
          return demoData.getDemoTicketsForContractor(userProfile.id);
        default:
          return [];
      }
    }

    const getTicketsOperation = async () => {
      try {
        let q;
        const userType = this.currentUser.userType || this.currentUser.role;
        console.log(`Fetching tickets for user type: ${userType}, ID: ${this.currentUser.uid}`);
        
        // Create appropriate query based on user type
        if (userType === 'landlord') {
          // For landlord, get properties first, then tickets for those properties
          try {
            console.log('Landlord ticket retrieval - fetching properties first');
            const properties = await this.getPropertiesForCurrentLandlord();
            console.log(`Found ${properties.length} properties for landlord`);
            
            if (properties.length === 0) {
              console.log('No properties found for landlord, returning empty tickets array');
              return [];
            }
            
            // Extract property IDs for query
            const propertyIds = properties.map(p => p.id);
            console.log('Property IDs for ticket query:', propertyIds);
            
            // If we have too many properties, we might hit Firestore limit on 'in' queries
            // Firestore 'in' queries are limited to 10 values
            if (propertyIds.length > 10) {
              console.log('More than 10 properties, using multiple queries');
              // Split into chunks of 10 and combine results
              const results = [];
              
              // Process in chunks of 10
              for (let i = 0; i < propertyIds.length; i += 10) {
                const chunk = propertyIds.slice(i, i + 10);
                const chunkQuery = query(
                  collection(db, 'tickets'),
                  where('propertyId', 'in', chunk)
                );
                
                const querySnapshot = await getDocs(chunkQuery);
                const chunkResults = querySnapshot.docs.map(doc => ({
                  id: doc.id,
                  ...doc.data(),
                  createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(),
                  updatedAt: doc.data().updatedAt?.toDate ? doc.data().updatedAt.toDate() : new Date()
                }));
                
                results.push(...chunkResults);
              }
              
              console.log(`Retrieved ${results.length} tickets across all property chunks`);
              return results;
            } else {
              // Standard query for 10 or fewer properties
              q = query(
                collection(db, 'tickets'),
                where('propertyId', 'in', propertyIds)
              );
            }
          } catch (error) {
            console.error('Error getting properties for ticket query:', error);
            throw new Error(`Failed to load properties for ticket query: ${error.message}`);
          }
        } else if (userType === 'tenant') {
          console.log('Building tenant ticket query');
          q = query(
            collection(db, 'tickets'),
            where('tenantId', '==', this.currentUser.uid)
          );
        } else if (userType === 'contractor') {
          console.log('Building contractor ticket query');
          q = query(
            collection(db, 'tickets'),
            where('assignedTo', '==', this.currentUser.uid)
          );
        } else {
          console.warn(`Unknown user type: ${userType}, cannot retrieve tickets`);
          throw new Error(`Unknown user type: ${userType}`);
        }
        
        // Only execute query if it was properly set up
        if (q) {
          console.log('Executing ticket query');
          const querySnapshot = await getDocs(q);
          console.log(`Retrieved ${querySnapshot.docs.length} tickets`);
          
          return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(),
            updatedAt: doc.data().updatedAt?.toDate ? doc.data().updatedAt.toDate() : new Date()
          }));
        }
        
        return [];
      } catch (error) {
        console.error('Error retrieving tickets:', error);
        throw error; // Let the resilient operation handle the retry
      }
    };

    return await resilientFirestoreOperation(getTicketsOperation);
  }

  /**
   * Get a single property by ID
   * @param {string} propertyId - Property ID
   * @returns {Promise<Object>} Property object
   */
  async getPropertyById(propertyId) {
    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    if (this.isDemoMode) {
      const demoProperties = demoData.getDemoPropertiesForLandlord('landlord-001');
      return demoProperties.find(p => p.id === propertyId) || null;
    }

    const getPropertyOperation = async () => {
      try {
        const propertyRef = doc(db, 'properties', propertyId);
        const propertySnap = await getDoc(propertyRef);
        
        if (!propertySnap.exists()) {
          return null;
        }

        const propertyData = propertySnap.data();
        
        // Verify user has access to this property
        const userId = this.currentUser.uid;
        if (propertyData.landlordId !== userId && 
            propertyData.ownerId !== userId && 
            propertyData.userId !== userId &&
            propertyData.createdBy !== userId) {
          throw new Error('Access denied to this property');
        }

        return {
          id: propertySnap.id,
          ...propertyData,
          createdAt: propertyData.createdAt?.toDate ? propertyData.createdAt.toDate() : new Date(),
          updatedAt: propertyData.updatedAt?.toDate ? propertyData.updatedAt.toDate() : new Date()
        };
      } catch (error) {
        console.error('Error getting property by ID:', error);
        throw error;
      }
    };

    return await resilientFirestoreOperation(getPropertyOperation);
  }

  /**
   * Create a new property
   * @param {Object} propertyData - Property data
   * @returns {Promise<Object>} Created property
   */
  async createProperty(propertyData) {
    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    if (this.isDemoMode) {
      // Generate a fake ID for demo mode
      const newId = `demo-prop-${Date.now()}`;
      return {
        id: newId,
        ...propertyData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }

    const createPropertyOperation = async () => {
      // Ensure landlordId is set properly
      if (!propertyData.landlordId) {
        propertyData.landlordId = this.currentUser.uid;
      }

      // For backward compatibility, maintain any legacy fields that might be expected
      // but ensure they match landlordId
      if (!propertyData.ownerId) {
        propertyData.ownerId = propertyData.landlordId;
      }
      
      const propertyWithMetadata = {
        ...propertyData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: this.currentUser.uid
      };
      
      const docRef = await addDoc(collection(db, 'properties'), propertyWithMetadata);
      
      return {
        id: docRef.id,
        ...propertyWithMetadata,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    };

    return await resilientFirestoreOperation(createPropertyOperation);
  }

  /**
   * Update an existing property
   * @param {string} propertyId - Property ID
   * @param {Object} propertyData - Updated property data
   * @returns {Promise<Object>} Updated property object
   */
  async updateProperty(propertyId, propertyData) {
    if (!propertyId) {
      throw new Error('Property ID is required');
    }

    if (this.isDemoMode) {
      console.log(`Demo mode: Updated property ${propertyId}`, propertyData);
      return {
        id: propertyId,
        ...propertyData,
        updatedAt: new Date()
      };
    }

    const updatePropertyOperation = async () => {
      const propertyRef = doc(db, 'properties', propertyId);
      
      const updateData = {
        ...propertyData,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(propertyRef, updateData);
      
      // Fetch the updated document to return
      const updatedDoc = await getDoc(propertyRef);
      
      return {
        id: updatedDoc.id,
        ...updatedDoc.data()
      };
    };

    return await resilientFirestoreOperation(updatePropertyOperation);
  }

  /**
   * Delete a property
   * @param {string} propertyId - Property ID
   * @returns {Promise<void>}
   */
  async deleteProperty(propertyId) {
    if (!propertyId) {
      throw new Error('Property ID is required');
    }

    if (this.isDemoMode) {
      console.log(`Demo mode: Deleted property ${propertyId}`);
      return;
    }

    const deletePropertyOperation = async () => {
      const propertyRef = doc(db, 'properties', propertyId);
      await deleteDoc(propertyRef);
    };

    return await resilientFirestoreOperation(deletePropertyOperation);
  }

  /**
   * Get tenants for a property using real relationships
   * @param {string} propertyId - Property ID
   * @returns {Promise<Array>} Array of tenant objects
   */
  async getTenantsForProperty(propertyId) {
    if (!propertyId) {
      throw new Error('Property ID is required');
    }

    if (this.isDemoMode) {
      // Still support demo mode for testing
      return demoData.getDemoTenantsForProperty(propertyId);
    }

    try {
      // Get property-tenant relationships
      const relationships = await getPropertyTenants(propertyId);
      
      if (relationships.length === 0) {
        return [];
      }

      // Fetch full tenant profiles
      const tenants = [];
      for (const relationship of relationships) {
        const tenantDoc = await getDoc(doc(db, 'users', relationship.tenantId));
        if (tenantDoc.exists()) {
          tenants.push({
            id: tenantDoc.id,
            ...tenantDoc.data(),
            // Include relationship info
            unitId: relationship.unitId,
            status: relationship.status,
            startDate: relationship.startDate,
            endDate: relationship.endDate
          });
        }
      }

      return tenants;
    } catch (error) {
      console.error('Error fetching tenants for property:', error);
      throw new Error('Failed to fetch tenants for property');
    }
  }

  /**
   * Get properties for a tenant using real relationships
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<Array>} Array of property objects
   */
  async getPropertiesForTenant(tenantId) {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    if (this.isDemoMode) {
      // Still support demo mode for testing
      return demoData.getDemoPropertiesForTenant ? 
             demoData.getDemoPropertiesForTenant(tenantId) : 
             [];
    }

    try {
      // Get tenant-property relationships
      const relationships = await getTenantProperties(tenantId);
      
      if (relationships.length === 0) {
        return [];
      }

      // Fetch full property details
      const properties = [];
      for (const relationship of relationships) {
        const propertyDoc = await getDoc(doc(db, 'properties', relationship.propertyId));
        if (propertyDoc.exists()) {
          properties.push({
            id: propertyDoc.id,
            ...propertyDoc.data(),
            // Include relationship info
            unitId: relationship.unitId,
            tenantStatus: relationship.status,
            tenantStartDate: relationship.startDate,
            tenantEndDate: relationship.endDate
          });
        }
      }

      return properties;
    } catch (error) {
      console.error('Error fetching properties for tenant:', error);
      throw new Error('Failed to fetch properties for tenant');
    }
  }

  /**
   * Create a new maintenance ticket
   * @param {Object} ticketData - Ticket data
   * @returns {Promise<Object>} Created ticket object
   */
  async createMaintenanceTicket(ticketData) {
    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    if (this.isDemoMode) {
      // Generate a fake ID for demo mode
      const newId = `demo-ticket-${Date.now()}`;
      const newTicket = {
        id: newId,
        ...ticketData,
        tenantId: this.currentUser.uid,
        status: 'new',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      console.log('Demo mode: Created maintenance ticket', newTicket);
      return newTicket;
    }

    const createTicketOperation = async () => {
      const ticketWithMetadata = {
        ...ticketData,
        tenantId: this.currentUser.uid,
        status: 'new',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'tickets'), ticketWithMetadata);
      
      return {
        id: docRef.id,
        ...ticketWithMetadata,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    };

    return await resilientFirestoreOperation(createTicketOperation);
  }

  /**
   * Update a maintenance ticket
   * @param {string} ticketId - Ticket ID
   * @param {Object} ticketData - Updated ticket data
   * @returns {Promise<Object>} Updated ticket object
   */
  async updateMaintenanceTicket(ticketId, ticketData) {
    if (!ticketId) {
      throw new Error('Ticket ID is required');
    }

    if (this.isDemoMode) {
      console.log(`Demo mode: Updated ticket ${ticketId}`, ticketData);
      return {
        id: ticketId,
        ...ticketData,
        updatedAt: new Date()
      };
    }

    const updateTicketOperation = async () => {
      const ticketRef = doc(db, 'tickets', ticketId);
      
      const updateData = {
        ...ticketData,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(ticketRef, updateData);
      
      // Fetch the updated document to return
      const updatedDoc = await getDoc(ticketRef);
      
      return {
        id: updatedDoc.id,
        ...updatedDoc.data(),
        createdAt: updatedDoc.data().createdAt?.toDate ? updatedDoc.data().createdAt.toDate() : new Date(),
        updatedAt: new Date()
      };
    };

    return await resilientFirestoreOperation(updateTicketOperation);
  }

  /**
   * Call the sendPropertyInvite Cloud Function
   * @param {string} propertyId - The ID of the property to invite to.
   * @param {string} tenantEmail - The email of the tenant being invited.
   * @returns {Promise<any>} The result from the cloud function
   */
  async sendInvite(propertyId, tenantEmail) {
    if (this.isDemoMode) {
      console.log(`Demo mode: Sending invite to ${tenantEmail} for property ${propertyId}`);
      // Simulate success after a delay
      return new Promise(resolve => setTimeout(() => resolve({ data: { success: true, message: "Demo invite sent.", inviteId: `demo-${Date.now()}` } }), 500));
    }

    if (!propertyId || !tenantEmail) {
        throw new Error("Property ID and Tenant Email are required to send an invitation.");
    }

    const functions = getFunctions(); // Get functions instance
    const inviteFunction = httpsCallable(functions, 'sendPropertyInvite');

    try {
      console.log(`Calling sendPropertyInvite function for ${tenantEmail} to property ${propertyId}`);
      const result = await inviteFunction({ propertyId, tenantEmail });
      console.log('sendPropertyInvite function result:', result.data);
      if (!result.data.success) {
          throw new Error(result.data.message || 'Failed to send invite.');
      }
      return result.data;
    } catch (error) {
      console.error('Error calling sendPropertyInvite function:', error);
      const message = error.message || 'An unknown error occurred while sending the invitation.';
      throw new Error(message);
    }
  }

  /**
   * Call the acceptPropertyInvite Cloud Function
   * @param {string} inviteId - The ID of the invitation document
   * @returns {Promise<any>} The result from the cloud function
   */
  async acceptInvite(inviteId) {
    if (this.isDemoMode) {
      console.log(`Demo mode: Accepting invite ${inviteId}`);
      // Simulate success after a delay
      return new Promise(resolve => setTimeout(() => resolve({ data: { success: true, message: "Demo invite accepted." } }), 500));
    }
    
    const functions = getFunctions(); // Get functions instance
    const acceptFunction = httpsCallable(functions, 'acceptPropertyInvite');
    
    try {
      console.log(`Calling acceptPropertyInvite function for invite: ${inviteId}`);
      const result = await acceptFunction({ inviteId });
      console.log('acceptPropertyInvite function result:', result.data);
      if (!result.data.success) {
          throw new Error(result.data.message || 'Failed to accept invite.');
      }
      return result.data;
    } catch (error) {
      console.error('Error calling acceptPropertyInvite function:', error);
      // Enhance error message parsing if needed
      const message = error.message || 'An unknown error occurred while accepting the invitation.';
      throw new Error(message);
    }
  }

  /**
   * Call the rejectPropertyInvite Cloud Function
   * @param {string} inviteId - The ID of the invitation document
   * @returns {Promise<any>} The result from the cloud function
   */
  async rejectInvite(inviteId) {
     if (this.isDemoMode) {
      console.log(`Demo mode: Rejecting invite ${inviteId}`);
      return new Promise(resolve => setTimeout(() => resolve({ data: { success: true, message: "Demo invite rejected." } }), 300));
    }
    
    const functions = getFunctions();
    const rejectFunction = httpsCallable(functions, 'rejectPropertyInvite');
    
    try {
      console.log(`Calling rejectPropertyInvite function for invite: ${inviteId}`);
      const result = await rejectFunction({ inviteId });
      console.log('rejectPropertyInvite function result:', result.data);
       if (!result.data.success) {
          throw new Error(result.data.message || 'Failed to reject invite.');
      }
      return result.data;
    } catch (error) {
      console.error('Error calling rejectPropertyInvite function:', error);
      const message = error.message || 'An unknown error occurred while rejecting the invitation.';
      throw new Error(message);
    }
  }

  // New function to subscribe to properties using multiple fields
  subscribeToPropertiesMultiField(onData, onError) {
    if (!this.currentUser) {
      console.error('subscribeToPropertiesMultiField: No authenticated user');
      onError(new Error('User not authenticated.'));
      return () => {}; // Return an empty unsubscribe function
    }
    if (this.isDemoMode) {
       console.log('Using demo data for properties subscription');
       // Use setTimeout to simulate async loading for demo
       setTimeout(() => onData(demoData.getDemoPropertiesForLandlord('landlord-001')), 500);
       return () => {};
    }

    const userId = this.currentUser.uid;
    console.log(`Subscribing to properties for landlord: ${userId}`);

    // Clean up previous listener if exists
    if (propertiesUnsubscribe) {
      console.log("Unsubscribing from previous properties listener.");
      propertiesUnsubscribe();
      propertiesUnsubscribe = null;
    }

    const possibleFieldNames = ['landlordId', 'ownerId', 'userId', 'createdBy'];
    let activeListenerFound = false;
    let combinedUnsubscribes = [];

    // Function to process snapshot and deduplicate
    let combinedProperties = {};
    const processSnapshot = (snapshot, fieldName) => {
        console.log(`Snapshot received for field '${fieldName}', docs: ${snapshot.docs.length}`);
        let changesMade = false;
        snapshot.docs.forEach(doc => {
            // Use doc.id as the key for deduplication
            if (!combinedProperties[doc.id] || JSON.stringify(combinedProperties[doc.id]) !== JSON.stringify({ id: doc.id, ...doc.data() })) {
                 combinedProperties[doc.id] = { id: doc.id, ...doc.data() };
                 changesMade = true;
            }
        });
         // Check for deletions (less common in multi-query but good practice)
         Object.keys(combinedProperties).forEach(id => {
            if (!snapshot.docs.some(doc => doc.id === id) && combinedProperties[id]?._sourceField === fieldName) {
                // If a doc previously found via this field is now gone from this snapshot, remove it
                // This is imperfect logic for multi-query; a simpler approach might be just always combining results
                 delete combinedProperties[id];
                 changesMade = true;
            }
         });

        if(changesMade) {
            onData(Object.values(combinedProperties));
        }
    };

    // Try setting up listeners for each field
    possibleFieldNames.forEach(fieldName => {
        try {
            const q = query(
                collection(db, 'properties'),
                where(fieldName, '==', userId)
            );

            const unsubscribe = onSnapshot(q,
                (snapshot) => {
                    // Mark that at least one listener is active
                    activeListenerFound = true;
                    // Add a temporary field to track which query found this doc (helps with deletion logic, though imperfect)
                    snapshot.docs.forEach(doc => doc.data()._sourceField = fieldName);
                    processSnapshot(snapshot, fieldName);
                },
                (err) => {
                    console.error(`Error on property subscription for field '${fieldName}':`, err);
                    // Don't call onError for individual listener errors if others might work
                    // onError(new Error(`Failed to subscribe to properties using field ${fieldName}.`));
                }
            );
            combinedUnsubscribes.push(unsubscribe);
            console.log(`Successfully subscribed using field: ${fieldName}`);

        } catch (error) {
             console.error(`Failed to create query for field '${fieldName}':`, error);
        }
    });

    // If no listeners were set up (e.g., all queries failed immediately)
    // try a collection group query as a fallback one-time fetch
    if (combinedUnsubscribes.length === 0) {
        console.warn("No direct listeners attached, attempting collectionGroup query...");
        const attemptCollectionGroup = async () => {
             try {
                const groupQuery = query(
                    collectionGroup(db, 'properties'),
                    where('landlordId', '==', userId), // Adjust field if needed for group query
                    limit(50) // Add a limit for safety
                );
                const groupSnapshot = await getDocs(groupQuery);
                 console.log(`Collection group query found ${groupSnapshot.docs.length} properties.`);
                if (groupSnapshot.docs.length > 0) {
                     onData(groupSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                 } else {
                     onData([]); // Explicitly send empty array if nothing found
                 }
             } catch (groupError) {
                 console.error('Collection group query failed:', groupError);
                 onError(new Error('Failed to fetch properties using all available methods.'));
                 onData([]); // Send empty array on final failure
             }
        };
        attemptCollectionGroup();
    }

    // Assign the combined unsubscribe function
    propertiesUnsubscribe = () => {
        console.log(`Unsubscribing from ${combinedUnsubscribes.length} property listeners.`);
        combinedUnsubscribes.forEach(unsub => unsub());
        combinedUnsubscribes = [];
        propertiesUnsubscribe = null;
    };

    return propertiesUnsubscribe; // Return the master unsubscribe function
  }

  /**
   * Get analytics data for reports
   * @param {Object} options - Query options (dateRange, propertyId, etc.)
   * @returns {Promise<Object>} Analytics data
   */
  async getAnalyticsData(options = {}) {
    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    if (this.isDemoMode) {
      console.log('Demo mode: Using mock analytics data');
      return this.getDemoAnalyticsData(options);
    }

    const getAnalyticsOperation = async () => {
      try {
        const userId = this.currentUser.uid;
        const { dateRange = 'last30days', propertyId = 'all' } = options;
        
        // Calculate date range
        const now = new Date();
        let startDate = new Date();
        
        switch (dateRange) {
          case 'last7days':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'last30days':
            startDate.setDate(now.getDate() - 30);
            break;
          case 'last90days':
            startDate.setDate(now.getDate() - 90);
            break;
          case 'last12months':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
          default:
            startDate.setDate(now.getDate() - 30);
        }

        // Get properties for user
        const properties = await this.getPropertiesForCurrentLandlord();
        const propertyIds = propertyId === 'all' 
          ? properties.map(p => p.id)
          : [propertyId];

        // Get maintenance data
        const maintenanceData = await this.getMaintenanceAnalytics(propertyIds, startDate, now);
        
        // Get financial data
        const financialData = await this.getFinancialAnalytics(propertyIds, startDate, now);
        
        // Get occupancy data
        const occupancyData = await this.getOccupancyAnalytics(propertyIds, startDate, now);

        return {
          propertyPerformance: this.calculatePropertyPerformance(properties),
          maintenanceCosts: maintenanceData.costs,
          monthlyRevenue: financialData.monthlyRevenue,
          occupancyTrends: occupancyData.trends,
          tenantAnalytics: await this.getTenantAnalytics(propertyIds),
          dateRange: { startDate, endDate: now },
          propertyFilter: propertyId
        };
      } catch (error) {
        console.error('Error getting analytics data:', error);
        throw error;
      }
    };

    return await resilientFirestoreOperation(getAnalyticsOperation);
  }

  /**
   * Get maintenance analytics data
   */
  async getMaintenanceAnalytics(propertyIds, startDate, endDate) {
    const maintenanceQuery = query(
      collection(db, 'tickets'),
      where('propertyId', 'in', propertyIds.slice(0, 10)), // Firestore limit
      where('createdAt', '>=', startDate),
      where('createdAt', '<=', endDate)
    );

    const snapshot = await getDocs(maintenanceQuery);
    const tickets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Group by category and calculate costs
    const categories = {};
    tickets.forEach(ticket => {
      const category = ticket.category || ticket.issueType || 'General';
      const cost = ticket.cost || ticket.estimatedCost || 0;
      
      if (!categories[category]) {
        categories[category] = { cost: 0, requests: 0, avgCost: 0 };
      }
      
      categories[category].cost += cost;
      categories[category].requests += 1;
    });

    // Calculate averages
    Object.keys(categories).forEach(category => {
      categories[category].avgCost = Math.round(
        categories[category].cost / categories[category].requests
      );
    });

    return {
      costs: Object.entries(categories).map(([category, data]) => ({
        category,
        ...data
      })),
      totalTickets: tickets.length,
      totalCost: tickets.reduce((sum, ticket) => sum + (ticket.cost || 0), 0)
    };
  }

  /**
   * Get financial analytics data
   */
  async getFinancialAnalytics(propertyIds, startDate, endDate) {
    // For MVP, calculate from property rent amounts
    // In production, you'd have a payments/transactions collection
    const properties = await Promise.all(
      propertyIds.map(id => this.getPropertyById(id))
    );

    const monthlyRevenue = [];
    const months = this.getMonthsBetween(startDate, endDate);

    months.forEach(month => {
      const revenue = properties.reduce((sum, property) => {
        return sum + (property?.monthlyRent || property?.rentAmount || 0);
      }, 0);

      const expenses = revenue * 0.3; // Estimate 30% expenses
      
      monthlyRevenue.push({
        month: month.toLocaleDateString('en-US', { month: 'short' }),
        revenue,
        expenses,
        profit: revenue - expenses
      });
    });

    return { monthlyRevenue };
  }

  /**
   * Get occupancy analytics data  
   */
  async getOccupancyAnalytics(propertyIds, startDate, endDate) {
    const properties = await Promise.all(
      propertyIds.map(id => this.getPropertyById(id))
    );

    const months = this.getMonthsBetween(startDate, endDate);
    const trends = months.map(month => {
      const totalUnits = properties.reduce((sum, p) => sum + (p?.units || 1), 0);
      const occupiedUnits = properties.reduce((sum, p) => sum + (p?.occupiedUnits || p?.units || 1), 0);
      
      return {
        month: month.toLocaleDateString('en-US', { month: 'short' }),
        occupied: occupiedUnits,
        vacant: totalUnits - occupiedUnits
      };
    });

    return { trends };
  }

  /**
   * Calculate property performance metrics
   */
  calculatePropertyPerformance(properties) {
    return properties.map(property => ({
      property: property.name || property.address,
      revenue: property.monthlyRent || property.rentAmount || 0,
      expenses: (property.monthlyRent || property.rentAmount || 0) * 0.3,
      occupancy: Math.round(
        ((property.occupiedUnits || property.units || 1) / (property.units || 1)) * 100
      ),
      units: property.units || 1
    }));
  }

  /**
   * Get tenant analytics
   */
  async getTenantAnalytics(propertyIds) {
    // Simplified for MVP - in production, analyze lease terms
    return [
      { segment: 'Long-term (>2 years)', count: 45, percentage: 50 },
      { segment: 'Medium-term (1-2 years)', count: 27, percentage: 30 },
      { segment: 'Short-term (<1 year)', count: 18, percentage: 20 }
    ];
  }

  /**
   * Helper method to get months between dates
   */
  getMonthsBetween(startDate, endDate) {
    const months = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      months.push(new Date(current));
      current.setMonth(current.getMonth() + 1);
    }
    
    return months.slice(-6); // Return last 6 months
  }

  /**
   * Get demo analytics data for demo mode
   */
  getDemoAnalyticsData(options = {}) {
    return {
      propertyPerformance: [
        { property: 'Sunset Apartments', revenue: 36000, expenses: 12000, occupancy: 92, units: 24 },
        { property: 'Downtown Lofts', revenue: 26400, expenses: 8000, occupancy: 100, units: 12 },
        { property: 'Garden Complex', revenue: 43200, expenses: 15000, occupancy: 78, units: 36 }
      ],
      monthlyRevenue: [
        { month: 'Jan', revenue: 125000, expenses: 45000, profit: 80000 },
        { month: 'Feb', revenue: 132000, expenses: 48000, profit: 84000 },
        { month: 'Mar', revenue: 128000, expenses: 52000, profit: 76000 },
        { month: 'Apr', revenue: 135000, expenses: 49000, profit: 86000 },
        { month: 'May', revenue: 142000, expenses: 51000, profit: 91000 },
        { month: 'Jun', revenue: 138000, expenses: 47000, profit: 91000 }
      ],
      maintenanceCosts: [
        { category: 'Plumbing', cost: 8500, requests: 24, avgCost: 354 },
        { category: 'Electrical', cost: 6200, requests: 18, avgCost: 344 },
        { category: 'HVAC', cost: 12400, requests: 15, avgCost: 827 },
        { category: 'General', cost: 4800, requests: 32, avgCost: 150 },
        { category: 'Appliances', cost: 7200, requests: 12, avgCost: 600 }
      ],
      occupancyTrends: [
        { month: 'Jan', occupied: 78, vacant: 12 },
        { month: 'Feb', occupied: 82, vacant: 8 },
        { month: 'Mar', occupied: 85, vacant: 5 },
        { month: 'Apr', occupied: 87, vacant: 3 },
        { month: 'May', occupied: 88, vacant: 2 },
        { month: 'Jun', occupied: 90, vacant: 0 }
      ],
      tenantAnalytics: [
        { segment: 'Long-term (>2 years)', count: 45, percentage: 50 },
        { segment: 'Medium-term (1-2 years)', count: 27, percentage: 30 },
        { segment: 'Short-term (<1 year)', count: 18, percentage: 20 }
      ]
    };
  }

  /**
   * Save custom dashboard layout for user
   * @param {string} userType - User type (landlord, tenant, contractor)
   * @param {Array} layout - Dashboard layout configuration
   * @returns {Promise<void>}
   */
  async saveDashboardLayout(userType, layout) {
    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    if (this.isDemoMode) {
      console.log('Demo mode: Dashboard layout saved to localStorage');
      localStorage.setItem(`dashboard_layout_${userType}_${this.currentUser.uid}`, JSON.stringify(layout));
      return;
    }

    const saveLayoutOperation = async () => {
      try {
        const userLayoutRef = doc(db, 'userDashboards', this.currentUser.uid);
        const layoutData = {
          [userType]: layout,
          updatedAt: serverTimestamp(),
          userId: this.currentUser.uid
        };

        await setDoc(userLayoutRef, layoutData, { merge: true });
        console.log(`Dashboard layout saved for ${userType}`);
      } catch (error) {
        console.error('Error saving dashboard layout:', error);
        throw error;
      }
    };

    return await resilientFirestoreOperation(saveLayoutOperation);
  }

  /**
   * Load custom dashboard layout for user
   * @param {string} userType - User type (landlord, tenant, contractor)
   * @returns {Promise<Array|null>} Dashboard layout configuration or null
   */
  async loadDashboardLayout(userType) {
    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    if (this.isDemoMode) {
      console.log('Demo mode: Loading dashboard layout from localStorage');
      const saved = localStorage.getItem(`dashboard_layout_${userType}_${this.currentUser.uid}`);
      return saved ? JSON.parse(saved) : null;
    }

    const loadLayoutOperation = async () => {
      try {
        const userLayoutRef = doc(db, 'userDashboards', this.currentUser.uid);
        const layoutSnap = await getDoc(userLayoutRef);
        
        if (!layoutSnap.exists()) {
          return null;
        }

        const layoutData = layoutSnap.data();
        return layoutData[userType] || null;
      } catch (error) {
        console.error('Error loading dashboard layout:', error);
        return null; // Return null on error to use default layout
      }
    };

    return await resilientFirestoreOperation(loadLayoutOperation);
  }

  /**
   * Perform global search across all user data
   * @param {string} query - Search query
   * @param {Object} filters - Search filters (type, status, etc.)
   * @returns {Promise<Array>} Search results
   */
  async performGlobalSearch(query = '', filters = {}) {
    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    if (this.isDemoMode) {
      console.log('Demo mode: Using mock search data');
      return this.getDemoSearchResults(query, filters);
    }

    const searchOperation = async () => {
      try {
        const userId = this.currentUser.uid;
        const results = [];

        // Search properties
        if (!filters.type || filters.type === 'all' || filters.type === 'properties') {
          const propertiesQuery = query 
            ? query(
                collection(db, 'properties'),
                where('landlordId', '==', userId)
              )
            : query(
                collection(db, 'properties'),
                where('landlordId', '==', userId)
              );
          
          const propertiesSnapshot = await getDocs(propertiesQuery);
          const properties = propertiesSnapshot.docs.map(doc => ({
            id: doc.id,
            type: 'property',
            title: doc.data().name || doc.data().address,
            subtitle: doc.data().address,
            status: doc.data().status || 'active',
            details: `${doc.data().units || 1} units • ${doc.data().occupancy || 0}% occupied`,
            icon: 'HomeIcon',
            color: 'orange',
            date: doc.data().createdAt?.toDate() || new Date(),
            ...doc.data()
          }));

          // Filter by search query if provided
          if (query) {
            const filteredProperties = properties.filter(prop => 
              prop.title?.toLowerCase().includes(query.toLowerCase()) ||
              prop.subtitle?.toLowerCase().includes(query.toLowerCase()) ||
              prop.details?.toLowerCase().includes(query.toLowerCase())
            );
            results.push(...filteredProperties);
          } else {
            results.push(...properties);
          }
        }

        // Search maintenance tickets
        if (!filters.type || filters.type === 'all' || filters.type === 'maintenance') {
          const tickets = await this.getTicketsForCurrentUser();
          const ticketResults = tickets.map(ticket => ({
            id: ticket.id,
            type: 'maintenance',
            title: ticket.title || ticket.description,
            subtitle: ticket.propertyName || 'Property',
            status: ticket.status || 'pending',
            details: `Priority: ${ticket.priority || 'Medium'} • ${ticket.category || 'General'}`,
            icon: 'WrenchScrewdriverIcon',
            color: ticket.priority === 'high' ? 'red' : ticket.status === 'completed' ? 'green' : 'yellow',
            date: ticket.createdAt || new Date(),
            priority: ticket.priority || 'medium',
            ...ticket
          }));

          // Filter by search query if provided
          if (query) {
            const filteredTickets = ticketResults.filter(ticket => 
              ticket.title?.toLowerCase().includes(query.toLowerCase()) ||
              ticket.subtitle?.toLowerCase().includes(query.toLowerCase()) ||
              ticket.details?.toLowerCase().includes(query.toLowerCase())
            );
            results.push(...filteredTickets);
          } else {
            results.push(...ticketResults);
          }
        }

        // Search tenants across all properties
        if (!filters.type || filters.type === 'all' || filters.type === 'tenants') {
          const properties = await this.getPropertiesForCurrentLandlord();
          const allTenants = [];
          
          for (const property of properties) {
            const tenants = await this.getTenantsForProperty(property.id);
            const tenantResults = tenants.map(tenant => ({
              id: tenant.id,
              type: 'tenant',
              title: tenant.displayName || tenant.name || tenant.email,
              subtitle: `${property.name || property.address}`,
              status: tenant.status || 'active',
              details: `Lease: ${tenant.leaseStart || 'N/A'} - ${tenant.leaseEnd || 'N/A'}`,
              icon: 'UsersIcon',
              color: 'blue',
              date: tenant.createdAt || new Date(),
              ...tenant
            }));
            allTenants.push(...tenantResults);
          }

          // Filter by search query if provided
          if (query) {
            const filteredTenants = allTenants.filter(tenant => 
              tenant.title?.toLowerCase().includes(query.toLowerCase()) ||
              tenant.subtitle?.toLowerCase().includes(query.toLowerCase()) ||
              tenant.details?.toLowerCase().includes(query.toLowerCase())
            );
            results.push(...filteredTenants);
          } else {
            results.push(...allTenants);
          }
        }

        // Apply additional filters
        let filteredResults = results;

        if (filters.status && filters.status !== 'all') {
          filteredResults = filteredResults.filter(item => item.status === filters.status);
        }

        if (filters.priority && filters.priority !== 'all') {
          filteredResults = filteredResults.filter(item => 
            item.type !== 'maintenance' || item.priority === filters.priority
          );
        }

        // Sort by relevance and date
        filteredResults.sort((a, b) => {
          // If there's a query, prioritize exact matches
          if (query) {
            const aExactMatch = a.title?.toLowerCase().includes(query.toLowerCase());
            const bExactMatch = b.title?.toLowerCase().includes(query.toLowerCase());
            if (aExactMatch && !bExactMatch) return -1;
            if (!aExactMatch && bExactMatch) return 1;
          }
          
          // Then sort by date (newest first)
          return new Date(b.date) - new Date(a.date);
        });

        return filteredResults;
      } catch (error) {
        console.error('Error performing global search:', error);
        throw error;
      }
    };

    return await resilientFirestoreOperation(searchOperation);
  }

  /**
   * Get demo search results for demo mode
   */
  getDemoSearchResults(query = '', filters = {}) {
    const mockResults = [
      {
        id: 'prop1',
        type: 'property',
        title: 'Sunset Apartments',
        subtitle: '123 Main St, Downtown',
        status: 'active',
        details: '24 units • 92% occupied • $36k monthly revenue',
        icon: 'HomeIcon',
        color: 'orange',
        date: '2024-01-15'
      },
      {
        id: 'tenant1',
        type: 'tenant',
        title: 'John Smith',
        subtitle: 'Unit 204, Sunset Apartments',
        status: 'active',
        details: 'Lease expires: Dec 2024 • $1,800/month • 2 years tenure',
        icon: 'UsersIcon',
        color: 'blue',
        date: '2022-12-01'
      },
      {
        id: 'maint1',
        type: 'maintenance',
        title: 'Plumbing Repair',
        subtitle: 'Unit 204, Sunset Apartments',
        status: 'pending',
        details: 'Kitchen sink leak • Priority: High • Assigned to: ABC Plumbing',
        icon: 'WrenchScrewdriverIcon',
        color: 'red',
        priority: 'high',
        date: '2024-06-01'
      }
    ];

    let results = mockResults;

    // Apply type filter
    if (filters.type && filters.type !== 'all') {
      results = results.filter(item => item.type === filters.type);
    }

    // Apply search query
    if (query) {
      results = results.filter(item => 
        item.title?.toLowerCase().includes(query.toLowerCase()) ||
        item.subtitle?.toLowerCase().includes(query.toLowerCase()) ||
        item.details?.toLowerCase().includes(query.toLowerCase())
      );
    }

    return results;
  }

  /**
   * Send a message to tenant or contractor
   * @param {Object} messageData - Message data
   * @returns {Promise<Object>} Created message
   */
  async sendMessage(messageData) {
    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    if (this.isDemoMode) {
      console.log('Demo mode: Message sent', messageData);
      return {
        id: `demo-msg-${Date.now()}`,
        ...messageData,
        fromUserId: this.currentUser.uid,
        sentAt: new Date(),
        status: 'sent'
      };
    }

    const sendMessageOperation = async () => {
      try {
        const message = {
          ...messageData,
          fromUserId: this.currentUser.uid,
          fromUserType: this.currentUser.userType || 'landlord',
          sentAt: serverTimestamp(),
          status: 'sent',
          isRead: false
        };

        const docRef = await addDoc(collection(db, 'messages'), message);
        
        // Update conversation metadata
        const conversationId = messageData.conversationId || 
          `${Math.min(this.currentUser.uid, messageData.toUserId)}_${Math.max(this.currentUser.uid, messageData.toUserId)}`;
        
        await setDoc(doc(db, 'conversations', conversationId), {
          participants: [this.currentUser.uid, messageData.toUserId],
          lastMessage: messageData.content,
          lastMessageAt: serverTimestamp(),
          lastMessageBy: this.currentUser.uid,
          updatedAt: serverTimestamp()
        }, { merge: true });

        return {
          id: docRef.id,
          ...message,
          sentAt: new Date()
        };
      } catch (error) {
        console.error('Error sending message:', error);
        throw error;
      }
    };

    return await resilientFirestoreOperation(sendMessageOperation);
  }

  /**
   * Get conversations for current user
   * @returns {Promise<Array>} Array of conversations
   */
  async getConversations() {
    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    if (this.isDemoMode) {
      return this.getDemoConversations();
    }

    const getConversationsOperation = async () => {
      try {
        const q = query(
          collection(db, 'conversations'),
          where('participants', 'array-contains', this.currentUser.uid),
          orderBy('lastMessageAt', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          lastMessageAt: doc.data().lastMessageAt?.toDate() || new Date()
        }));
      } catch (error) {
        console.error('Error getting conversations:', error);
        throw error;
      }
    };

    return await resilientFirestoreOperation(getConversationsOperation);
  }

  /**
   * Get messages for a conversation
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<Array>} Array of messages
   */
  async getMessages(conversationId) {
    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    if (this.isDemoMode) {
      return this.getDemoMessages(conversationId);
    }

    const getMessagesOperation = async () => {
      try {
        const q = query(
          collection(db, 'messages'),
          where('conversationId', '==', conversationId),
          orderBy('sentAt', 'asc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          sentAt: doc.data().sentAt?.toDate() || new Date()
        }));
      } catch (error) {
        console.error('Error getting messages:', error);
        throw error;
      }
    };

    return await resilientFirestoreOperation(getMessagesOperation);
  }

  /**
   * Mark messages as read
   * @param {Array} messageIds - Array of message IDs to mark as read
   * @returns {Promise<void>}
   */
  async markMessagesAsRead(messageIds) {
    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    if (this.isDemoMode) {
      console.log('Demo mode: Messages marked as read', messageIds);
      return;
    }

    const markReadOperation = async () => {
      try {
        const batch = writeBatch(db);
        
        messageIds.forEach(messageId => {
          const messageRef = doc(db, 'messages', messageId);
          batch.update(messageRef, { 
            isRead: true, 
            readAt: serverTimestamp() 
          });
        });

        await batch.commit();
        console.log(`Marked ${messageIds.length} messages as read`);
      } catch (error) {
        console.error('Error marking messages as read:', error);
        throw error;
      }
    };

    return await resilientFirestoreOperation(markReadOperation);
  }

  /**
   * Create or update user notification preferences
   * @param {Object} preferences - Notification preferences
   * @returns {Promise<void>}
   */
  async saveNotificationPreferences(preferences) {
    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    if (this.isDemoMode) {
      console.log('Demo mode: Notification preferences saved', preferences);
      localStorage.setItem(`notification_prefs_${this.currentUser.uid}`, JSON.stringify(preferences));
      return;
    }

    const savePrefsOperation = async () => {
      try {
        const userPrefsRef = doc(db, 'userPreferences', this.currentUser.uid);
        await setDoc(userPrefsRef, {
          notifications: preferences,
          updatedAt: serverTimestamp(),
          userId: this.currentUser.uid
        }, { merge: true });

        console.log('Notification preferences saved');
      } catch (error) {
        console.error('Error saving notification preferences:', error);
        throw error;
      }
    };

    return await resilientFirestoreOperation(savePrefsOperation);
  }

  /**
   * Get user notification preferences
   * @returns {Promise<Object>} Notification preferences
   */
  async getNotificationPreferences() {
    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    if (this.isDemoMode) {
      const saved = localStorage.getItem(`notification_prefs_${this.currentUser.uid}`);
      return saved ? JSON.parse(saved) : this.getDefaultNotificationPreferences();
    }

    const getPrefsOperation = async () => {
      try {
        const userPrefsRef = doc(db, 'userPreferences', this.currentUser.uid);
        const prefsSnap = await getDoc(userPrefsRef);
        
        if (!prefsSnap.exists()) {
          return this.getDefaultNotificationPreferences();
        }

        return prefsSnap.data().notifications || this.getDefaultNotificationPreferences();
      } catch (error) {
        console.error('Error getting notification preferences:', error);
        return this.getDefaultNotificationPreferences();
      }
    };

    return await resilientFirestoreOperation(getPrefsOperation);
  }

  /**
   * Get default notification preferences
   */
  getDefaultNotificationPreferences() {
    return {
      email: {
        maintenanceRequests: true,
        paymentReminders: true,
        tenantMessages: true,
        contractorUpdates: true,
        systemAlerts: true
      },
      push: {
        maintenanceRequests: true,
        urgentMessages: true,
        systemAlerts: true
      },
      sms: {
        urgentMaintenanceOnly: true,
        systemAlertsOnly: false
      }
    };
  }

  /**
   * Demo conversation data
   */
  getDemoConversations() {
    return [
      {
        id: 'conv1',
        participants: [this.currentUser.uid, 'tenant1'],
        participantNames: ['John Smith'],
        lastMessage: 'The dishwasher is making strange noises',
        lastMessageAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        lastMessageBy: 'tenant1',
        unreadCount: 1
      },
      {
        id: 'conv2',
        participants: [this.currentUser.uid, 'contractor1'],
        participantNames: ['ABC Plumbing'],
        lastMessage: 'I can start the job tomorrow morning',
        lastMessageAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        lastMessageBy: 'contractor1',
        unreadCount: 0
      }
    ];
  }

  /**
   * Demo messages data
   */
  getDemoMessages(conversationId) {
    const messages = {
      conv1: [
        {
          id: 'msg1',
          conversationId: 'conv1',
          fromUserId: 'tenant1',
          content: 'Hi, I have an issue with the dishwasher',
          sentAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
          isRead: true
        },
        {
          id: 'msg2',
          conversationId: 'conv1',
          fromUserId: this.currentUser.uid,
          content: 'What seems to be the problem?',
          sentAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000),
          isRead: true
        },
        {
          id: 'msg3',
          conversationId: 'conv1',
          fromUserId: 'tenant1',
          content: 'The dishwasher is making strange noises',
          sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          isRead: false
        }
      ]
    };

    return messages[conversationId] || [];
  }

  /**
   * Perform bulk operations on properties
   * @param {string} operation - Operation type (update, delete, export)
   * @param {Array} propertyIds - Array of property IDs
   * @param {Object} values - Values for bulk update
   * @returns {Promise<Object>} Operation results
   */
  async performBulkPropertyOperation(operation, propertyIds, values = {}) {
    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    if (this.isDemoMode) {
      console.log(`Demo mode: Bulk ${operation} on properties`, propertyIds, values);
      return { success: propertyIds.length, errors: [] };
    }

    const bulkOperation = async () => {
      try {
        const results = { success: 0, errors: [] };

        switch (operation) {
          case 'update':
            return await this.bulkUpdateProperties(propertyIds, values);
          case 'delete':
            return await this.bulkDeleteProperties(propertyIds);
          case 'export':
            return await this.exportProperties(propertyIds);
          default:
            throw new Error(`Unknown operation: ${operation}`);
        }
      } catch (error) {
        console.error(`Error performing bulk ${operation}:`, error);
        throw error;
      }
    };

    return await resilientFirestoreOperation(bulkOperation);
  }

  /**
   * Bulk update properties
   */
  async bulkUpdateProperties(propertyIds, values) {
    const batch = writeBatch(db);
    const results = { success: 0, errors: [] };

    // Validate user ownership of properties first
    for (const propertyId of propertyIds) {
      try {
        const property = await this.getPropertyById(propertyId);
        if (!property) {
          results.errors.push({ propertyId, error: 'Property not found' });
          continue;
        }

        const propertyRef = doc(db, 'properties', propertyId);
        const updateData = {
          ...values,
          updatedAt: serverTimestamp(),
          lastModifiedBy: this.currentUser.uid
        };

        batch.update(propertyRef, updateData);
        results.success++;
      } catch (error) {
        results.errors.push({ propertyId, error: error.message });
      }
    }

    if (results.success > 0) {
      await batch.commit();
      console.log(`Bulk updated ${results.success} properties`);
    }

    return results;
  }

  /**
   * Bulk delete properties
   */
  async bulkDeleteProperties(propertyIds) {
    const batch = writeBatch(db);
    const results = { success: 0, errors: [] };

    // Validate user ownership of properties first
    for (const propertyId of propertyIds) {
      try {
        const property = await this.getPropertyById(propertyId);
        if (!property) {
          results.errors.push({ propertyId, error: 'Property not found' });
          continue;
        }

        const propertyRef = doc(db, 'properties', propertyId);
        batch.delete(propertyRef);
        results.success++;
      } catch (error) {
        results.errors.push({ propertyId, error: error.message });
      }
    }

    if (results.success > 0) {
      await batch.commit();
      console.log(`Bulk deleted ${results.success} properties`);
    }

    return results;
  }

  /**
   * Export properties to CSV data
   */
  async exportProperties(propertyIds = []) {
    try {
      let properties;
      
      if (propertyIds.length > 0) {
        // Export specific properties
        properties = await Promise.all(
          propertyIds.map(id => this.getPropertyById(id))
        );
        properties = properties.filter(p => p !== null);
      } else {
        // Export all properties
        properties = await this.getPropertiesForCurrentLandlord();
      }

      const csvData = properties.map(property => ({
        ID: property.id,
        Name: property.name || property.address,
        Address: property.address,
        City: property.city,
        State: property.state,
        'Zip Code': property.zipCode,
        Units: property.units || 1,
        'Property Type': property.propertyType || 'Apartment',
        'Monthly Rent': property.monthlyRent || 0,
        Status: property.status || 'active',
        'Occupancy Rate': property.occupancy || 0,
        'Created Date': property.createdAt ? property.createdAt.toLocaleDateString() : '',
        Notes: property.notes || ''
      }));

      return {
        success: properties.length,
        data: csvData,
        filename: `properties_export_${new Date().toISOString().split('T')[0]}.csv`
      };
    } catch (error) {
      console.error('Error exporting properties:', error);
      throw error;
    }
  }

  /**
   * Perform bulk operations on maintenance tickets
   * @param {string} operation - Operation type
   * @param {Array} ticketIds - Array of ticket IDs
   * @param {Object} values - Values for bulk update
   * @returns {Promise<Object>} Operation results
   */
  async performBulkTicketOperation(operation, ticketIds, values = {}) {
    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    if (this.isDemoMode) {
      console.log(`Demo mode: Bulk ${operation} on tickets`, ticketIds, values);
      return { success: ticketIds.length, errors: [] };
    }

    const bulkOperation = async () => {
      try {
        switch (operation) {
          case 'update':
            return await this.bulkUpdateTickets(ticketIds, values);
          case 'close':
            return await this.bulkCloseTickets(ticketIds);
          case 'assign':
            return await this.bulkAssignTickets(ticketIds, values.contractorId);
          default:
            throw new Error(`Unknown operation: ${operation}`);
        }
      } catch (error) {
        console.error(`Error performing bulk ${operation} on tickets:`, error);
        throw error;
      }
    };

    return await resilientFirestoreOperation(bulkOperation);
  }

  /**
   * Bulk update tickets
   */
  async bulkUpdateTickets(ticketIds, values) {
    const batch = writeBatch(db);
    const results = { success: 0, errors: [] };

    for (const ticketId of ticketIds) {
      try {
        const ticketRef = doc(db, 'tickets', ticketId);
        const updateData = {
          ...values,
          updatedAt: serverTimestamp(),
          lastModifiedBy: this.currentUser.uid
        };

        batch.update(ticketRef, updateData);
        results.success++;
      } catch (error) {
        results.errors.push({ ticketId, error: error.message });
      }
    }

    if (results.success > 0) {
      await batch.commit();
      console.log(`Bulk updated ${results.success} tickets`);
    }

    return results;
  }

  /**
   * Bulk close tickets
   */
  async bulkCloseTickets(ticketIds) {
    return await this.bulkUpdateTickets(ticketIds, {
      status: 'completed',
      completedAt: serverTimestamp(),
      completedBy: this.currentUser.uid
    });
  }

  /**
   * Bulk assign tickets to contractor
   */
  async bulkAssignTickets(ticketIds, contractorId) {
    if (!contractorId) {
      throw new Error('Contractor ID is required for assignment');
    }

    return await this.bulkUpdateTickets(ticketIds, {
      assignedTo: contractorId,
      status: 'assigned',
      assignedAt: serverTimestamp(),
      assignedBy: this.currentUser.uid
    });
  }

  /**
   * Add user to waitlist for pre-launch
   * @param {Object} waitlistData - Waitlist data
   * @returns {Promise<Object>} Created waitlist entry
   */
  async addToWaitlist(waitlistData) {
    if (this.isDemoMode) {
      console.log('Demo mode: Would add to waitlist:', waitlistData);
      return { id: 'demo_waitlist_' + Date.now(), ...waitlistData };
    }

    const addToWaitlistOperation = async () => {
      try {
        const docRef = await addDoc(collection(db, 'waitlist'), {
          ...waitlistData,
          createdAt: serverTimestamp(),
          status: 'pending'
        });
        
        console.log('Added to waitlist with ID:', docRef.id);
        return { id: docRef.id, ...waitlistData };
      } catch (error) {
        console.error('Error adding to waitlist:', error);
        throw error;
      }
    };

    return await resilientFirestoreOperation(addToWaitlistOperation);
  }

  /**
   * Get waitlist entries (admin function)
   * @returns {Promise<Array>} Waitlist entries
   */
  async getWaitlistEntries() {
    if (this.isDemoMode) {
      return [
        {
          id: 'demo1',
          email: 'landlord@example.com',
          role: 'landlord',
          timestamp: new Date().toISOString(),
          status: 'pending'
        },
        {
          id: 'demo2',
          email: 'tenant@example.com',
          role: 'tenant',
          timestamp: new Date().toISOString(),
          status: 'pending'
        }
      ];
    }

    const getWaitlistOperation = async () => {
      try {
        const querySnapshot = await getDocs(
          query(collection(db, 'waitlist'), orderBy('createdAt', 'desc'))
        );
        
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().timestamp
        }));
      } catch (error) {
        console.error('Error getting waitlist entries:', error);
        throw error;
      }
    };

    return await resilientFirestoreOperation(getWaitlistOperation);
  }

  /**
   * Check if user has early access
   * @param {string} email - User email
   * @returns {Promise<boolean>} Whether user has early access
   */
  async hasEarlyAccess(email) {
    if (this.isDemoMode) {
      // In demo mode, allow all access
      return true;
    }

    const checkAccessOperation = async () => {
      try {
        // Check for early access in a separate collection
        const accessQuery = query(
          collection(db, 'early_access'),
          where('email', '==', email),
          where('status', '==', 'approved')
        );
        
        const querySnapshot = await getDocs(accessQuery);
        return !querySnapshot.empty;
      } catch (error) {
        console.error('Error checking early access:', error);
        // Default to allowing access on error to prevent lockouts
        return true;
      }
    };

    return await resilientFirestoreOperation(checkAccessOperation);
  }

  /**
   * Send pre-launch email using existing email infrastructure
   * @param {string} email - User email
   * @param {string} role - User role (landlord, tenant, contractor)
   * @returns {Promise<void>}
   */
  async sendPreLaunchEmail(email, role) {
    if (this.isDemoMode) {
      console.log('Demo mode: Would send pre-launch email to:', email, 'for role:', role);
      return;
    }

    const sendEmailOperation = async () => {
      try {
        // Create email content based on role
        const emailContent = this.getPreLaunchEmailTemplate(role);
        
        // Add email to the mail collection using the correct format for the extension
        // Based on the extension configuration, use direct fields not wrapped in 'message'
        const mailDoc = {
          to: email,
          subject: emailContent.subject,
          text: emailContent.text,
          html: emailContent.html,
          // Additional metadata for tracking
          template: 'pre_launch_welcome',
          userRole: role,
          source: 'waitlist_signup',
          createdAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'mail'), mailDoc);
        console.log('Pre-launch email queued successfully for:', email, 'Document ID:', docRef.id);

        // Also add to newsletter subscription
        try {
          await addDoc(collection(db, 'newsletter_subscribers'), {
            email: email,
            role: role,
            source: 'pre_launch',
            subscribedAt: serverTimestamp(),
            status: 'active',
            preferences: {
              marketing: true,
              product_updates: true,
              newsletters: true
            }
          });
          console.log('Added to newsletter subscription:', email);
        } catch (newsletterError) {
          console.warn('Newsletter subscription failed (non-critical):', newsletterError);
        }

      } catch (error) {
        console.error('Error sending pre-launch email:', error);
        throw error;
      }
    };

    return await resilientFirestoreOperation(sendEmailOperation);
  }

  /**
   * Get pre-launch email template based on user role
   * @param {string} role - User role
   * @returns {Object} Email template content
   */
  getPreLaunchEmailTemplate(role) {
    const baseContent = {
      landlord: {
        subject: "🏠 You're on the PropAgentic Pre-Launch List!",
        preview: "Get ready to revolutionize your property management",
        greeting: "property owner",
        benefits: [
          "Streamlined tenant communication and maintenance requests",
          "AI-powered rent optimization and market analysis", 
          "Automated contractor vetting and job management",
          "Real-time property performance analytics"
        ],
        cta: "We'll notify you the moment PropAgentic launches for landlords."
      },
      tenant: {
        subject: "🏠 You're on the PropAgentic Pre-Launch List!",
        preview: "Maintenance requests are about to get much easier",
        greeting: "tenant",
        benefits: [
          "Submit maintenance requests instantly with photos",
          "Track repair status in real-time",
          "Direct communication with your landlord and contractors",
          "Rate and review completed work"
        ],
        cta: "We'll notify you when your landlord can invite you to PropAgentic."
      },
      contractor: {
        subject: "🔧 You're on the PropAgentic Pre-Launch List!",
        preview: "Get ready to access quality maintenance jobs",
        greeting: "contractor",
        benefits: [
          "Access to pre-screened maintenance jobs in your area",
          "Secure escrow payments for peace of mind",
          "Build your reputation with verified reviews",
          "Streamlined communication with property managers"
        ],
        cta: "We'll notify you when PropAgentic launches in your service area."
      }
    };

    const content = baseContent[role] || baseContent.landlord;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${content.subject}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f1eb;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Welcome to the Future!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">${content.preview}</p>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #1f2937; margin-bottom: 20px;">Hello ${content.greeting}! 👋</h2>
            
            <p style="color: #4b5563; line-height: 1.6; margin-bottom: 25px;">
              Thank you for joining the PropAgentic pre-launch waitlist! You're among the first to experience the next generation of property management technology.
            </p>
            
            <div style="background: #fef3c7; padding: 25px; border-radius: 12px; margin: 30px 0; border-left: 4px solid #f59e0b;">
              <h3 style="color: #92400e; margin-top: 0; margin-bottom: 15px;">What's coming your way:</h3>
              <ul style="color: #92400e; margin: 0; padding-left: 20px;">
                ${content.benefits.map(benefit => `<li style="margin-bottom: 8px;">${benefit}</li>`).join('')}
              </ul>
            </div>
            
            <p style="color: #4b5563; line-height: 1.6; margin-bottom: 25px;">
              ${content.cta}
            </p>
            
            <div style="text-align: center; margin: 35px 0;">
              <div style="background: #f97316; color: white; padding: 15px 30px; border-radius: 8px; display: inline-block; font-weight: bold;">
                🚀 Early Access Reserved
              </div>
            </div>
            
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 30px 0;">
              <h4 style="color: #374151; margin-top: 0;">In the meantime...</h4>
              <p style="color: #6b7280; margin: 10px 0; font-size: 14px;">
                Follow us on social media for the latest updates, property management tips, and behind-the-scenes content as we build PropAgentic.
              </p>
            </div>
            
            <p style="color: #4b5563; line-height: 1.6;">
              Have questions? Simply reply to this email - we'd love to hear from you!
            </p>
            
            <p style="color: #4b5563; margin-top: 30px;">
              Best regards,<br>
              <strong>The PropAgentic Team</strong>
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} PropAgentic. All rights reserved.<br>
              You're receiving this because you signed up for our pre-launch updates.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Welcome to PropAgentic Pre-Launch!
      
      Hello ${content.greeting}!
      
      Thank you for joining the PropAgentic pre-launch waitlist! You're among the first to experience the next generation of property management technology.
      
      What's coming your way:
      ${content.benefits.map(benefit => `• ${benefit}`).join('\n')}
      
      ${content.cta}
      
      Have questions? Simply reply to this email - we'd love to hear from you!
      
      Best regards,
      The PropAgentic Team
      
      © ${new Date().getFullYear()} PropAgentic. All rights reserved.
    `;

    return {
      subject: content.subject,
      html: html,
      text: text
    };
  }
}

// Create and export a singleton instance
const dataService = new DataService();
export default dataService; 