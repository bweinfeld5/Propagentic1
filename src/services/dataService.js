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
        // Try multiple field names that might be used for landlord reference
        const possibleFieldNames = ['landlordId', 'ownerId', 'owner', 'userId', 'createdBy'];
        let allProperties = [];
        let successes = [];
        let failures = [];
        
        console.log(`Attempting property queries with ${possibleFieldNames.length} potential field names`);
        
        // Try each field name
        for (const fieldName of possibleFieldNames) {
          try {
            const q = query(
              collection(db, 'properties'), 
              where(fieldName, '==', this.currentUser.uid)
            );
            
            console.log(`Trying query with field: ${fieldName}`);
            const querySnapshot = await getDocs(q);
            const properties = querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            
            console.log(`Query with field '${fieldName}' returned ${properties.length} properties`);
            
            // Add unique properties based on ID
            const existingIds = new Set(allProperties.map(p => p.id));
            const newProperties = properties.filter(p => !existingIds.has(p.id));
            allProperties.push(...newProperties);
            
            successes.push({field: fieldName, count: properties.length});
          } catch (fieldError) {
            console.error(`Query with field '${fieldName}' failed:`, fieldError);
            failures.push({field: fieldName, error: fieldError.message});
          }
        }
        
        console.log('Property query results:', {
          totalPropertiesFound: allProperties.length,
          successfulQueries: successes,
          failedQueries: failures
        });
        
        // If we found any properties, return them
        if (allProperties.length > 0) {
          return allProperties;
        }
        
        // If no properties found with any field, try one more approach with collection group query
        try {
          console.log('Attempting collection group query as last resort');
          // This works if properties are in subcollections instead of root collection
          const groupQuery = query(
            collectionGroup(db, 'properties'),
            where('createdBy', '==', this.currentUser.uid)
          );
          
          const groupSnapshot = await getDocs(groupQuery);
          const groupProperties = groupSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          console.log(`Collection group query returned ${groupProperties.length} properties`);
          return groupProperties;
        } catch (groupError) {
          console.error('Collection group query failed:', groupError);
          // If all queries failed, throw the original error
          throw new Error('Failed to find properties with any known field name');
        }
      } catch (error) {
        console.error('Error fetching properties:', error);
        throw error;
      }
    };

    // Use resilient operation for Firestore calls
    return await resilientFirestoreOperation(getPropertiesOperation, {
      operationName: 'Multi-field property query',
      maxRetries: 2 // Lower retries since we're already trying multiple approaches
    });
  }

  /**
   * Set up a real-time listener for properties
   * @param {Function} onData - Callback for data updates
   * @param {Function} onError - Callback for errors
   * @returns {Function} Unsubscribe function
   */
  subscribeToProperties(onData, onError) {
    if (!this.currentUser) {
      console.error('subscribeToProperties: No authenticated user');
      onError(new Error('No authenticated user'));
      return () => {};
    }

    const userId = this.currentUser.uid;
    console.log(`Setting up properties subscription for user: ${userId}`);

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

    try {
      // Check for empty or invalid user ID
      if (!userId || userId.trim() === '') {
        console.error('Invalid user ID for properties subscription');
        onError(new Error('Invalid user ID'));
        return () => {};
      }

      // Try to use the new multi-field approach
      let unsubscribeFunctions = [];
      let activePropertyIds = new Set(); // Track already-seen property IDs
      let isFirstSuccessfulQuery = true; // Track if we need to call onData

      // Helper function to handle property data
      const handlePropertyData = (properties) => {
        // Filter out properties we've already seen
        const newProperties = properties.filter(prop => !activePropertyIds.has(prop.id));
        
        // Add new property IDs to our set
        newProperties.forEach(prop => activePropertyIds.add(prop.id));

        // Combine with existing properties if not the first successful query
        if (isFirstSuccessfulQuery) {
          console.log(`First successful query with ${properties.length} properties`);
          onData(properties);
          isFirstSuccessfulQuery = false;
        } else if (newProperties.length > 0) {
          console.log(`Additional query found ${newProperties.length} new properties`);
          // For subsequent queries, we need to get the current data first and combine
          this.getPropertiesForCurrentLandlord()
            .then(allProperties => {
              console.log(`Updated properties with ${allProperties.length} total properties`);
              onData(allProperties);
            })
            .catch(err => {
              console.error('Failed to get updated property list', err);
            });
        }
      };

      // Try multiple field names that might be used for landlord reference
      const possibleFieldNames = ['landlordId', 'ownerId', 'owner', 'userId', 'createdBy'];
      
      console.log(`Attempting property subscriptions with ${possibleFieldNames.length} potential field names`);
      
      // Set up subscriptions for each field name
      for (const fieldName of possibleFieldNames) {
        try {
          console.log(`Setting up subscription with field: ${fieldName}`);
          
          const q = query(
            collection(db, 'properties'),
            where(fieldName, '==', userId)
          );
          
          const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
              const properties = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }));
              
              console.log(`Subscription with field '${fieldName}' returned ${properties.length} properties`);
              
              if (properties.length > 0) {
                handlePropertyData(properties);
              }
            },
            (error) => {
              console.error(`Subscription with field '${fieldName}' failed:`, error);
              // We don't call onError here as we're trying multiple fields
              // Only call onError if all subscriptions fail
            }
          );
          
          unsubscribeFunctions.push(unsubscribe);
        } catch (error) {
          console.error(`Failed to set up subscription with field '${fieldName}':`, error);
        }
      }
      
      // If we couldn't set up any subscriptions, fall back to one-time query
      if (unsubscribeFunctions.length === 0) {
        console.error('All subscriptions failed, falling back to one-time query');
        
        // Try a one-time query using the multi-field approach
        this.getPropertiesForCurrentLandlord()
          .then(properties => {
            console.log(`One-time query fallback returned ${properties.length} properties`);
            onData(properties);
          })
          .catch(error => {
            console.error('Fallback query also failed:', error);
            onError(error);
          });
        
        return () => {}; // Return a no-op cleanup function
      }
      
      // Return a combined unsubscribe function
      return () => {
        console.log(`Unsubscribing from ${unsubscribeFunctions.length} property subscriptions`);
        unsubscribeFunctions.forEach(unsubscribe => {
          try {
            unsubscribe();
          } catch (error) {
            console.error('Error unsubscribing:', error);
          }
        });
      };
    } catch (error) {
      console.error('Error setting up properties subscription:', error);
      onError(error);
      
      // Return a no-op cleanup function
      return () => {};
    }
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
   * Get a specific property by ID
   * @param {string} propertyId - Property ID
   * @returns {Promise<Object|null>} Property object or null if not found
   */
  async getPropertyById(propertyId) {
    if (!propertyId) {
      throw new Error('Property ID is required');
    }

    if (this.isDemoMode) {
      return demoData.getDemoPropertyById(propertyId);
    }

    const getPropertyOperation = async () => {
      const docRef = doc(db, 'properties', propertyId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const propertyData = docSnap.data();
        // Process and enhance the property data for tenant dashboard
        
        // Format the address as a single string if it's structured
        let formattedAddress = '';
        if (propertyData.address) {
          const addr = propertyData.address;
          formattedAddress = [
            addr.street,
            addr.city ? (addr.city + (addr.state ? ', ' : '')) : '',
            addr.state,
            addr.zip
          ].filter(Boolean).join(' ');
        } else if (propertyData.formattedAddress) {
          // Use pre-formatted address if available
          formattedAddress = propertyData.formattedAddress;
        }
        
        // Determine main photo URL
        let photoUrl = null;
        if (propertyData.photos && propertyData.photos.length > 0) {
          // Use the first photo as the main photo
          photoUrl = propertyData.photos[0];
        } else if (propertyData.photoUrl) {
          // Use the photoUrl field if it exists
          photoUrl = propertyData.photoUrl;
        } else if (propertyData.mainImage) {
          // Or try the mainImage field
          photoUrl = propertyData.mainImage;
        }
        
        // If current user is a tenant, filter units to only show relevant units
        let unitInfo = null;
        if (this.currentUser && propertyData.units) {
          const currentUserId = this.currentUser.uid;
          // Check if tenant is assigned to a specific unit
          const tenantUnit = propertyData.units.find(unit => 
            (unit.tenantId === currentUserId) || 
            (unit.tenants && unit.tenants.includes(currentUserId))
          );
          
          if (tenantUnit) {
            unitInfo = {
              unitNumber: tenantUnit.unitNumber || tenantUnit.number || tenantUnit.id,
              floor: tenantUnit.floor,
              bedrooms: tenantUnit.bedrooms,
              bathrooms: tenantUnit.bathrooms,
              // Include any other relevant unit details
            };
          }
        }
        
        // Include property manager info if available
        let managerInfo = null;
        if (propertyData.managerId || propertyData.landlordId) {
          const managerId = propertyData.managerId || propertyData.landlordId;
          try {
            const managerRef = doc(db, 'users', managerId);
            const managerSnap = await getDoc(managerRef);
            if (managerSnap.exists()) {
              const managerData = managerSnap.data();
              managerInfo = {
                name: managerData.displayName || managerData.name || 'Property Manager',
                email: managerData.email,
                phone: managerData.phone,
                // Include any other relevant manager details
              };
            }
          } catch (error) {
            console.warn('Could not fetch property manager details:', error);
          }
        }
        
        // Calculate property capacity if available
        let capacity = null;
        if (propertyData.units && Array.isArray(propertyData.units)) {
          capacity = propertyData.units.length;
        }
        
        return {
          id: docSnap.id,
          ...propertyData,
          // Add enhanced fields
          formattedAddress,
          photoUrl,
          unitInfo,
          managerInfo,
          capacity,
        };
      }
      
      return null;
    };

    return await resilientFirestoreOperation(getPropertyOperation);
  }

  /**
   * Create a new property
   * @param {Object} propertyData - Property data
   * @returns {Promise<Object>} Created property object
   */
  async createProperty(propertyData) {
    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    if (this.isDemoMode) {
      // Generate a fake ID for demo mode
      const newId = `demo-property-${Date.now()}`;
      const newProperty = {
        id: newId,
        ...propertyData,
        landlordId: this.currentUser.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      console.log('Demo mode: Created property', newProperty);
      return newProperty;
    }

    const createPropertyOperation = async () => {
      const propertyWithMetadata = {
        ...propertyData,
        landlordId: this.currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
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
   * Get tenants for a property
   * @param {string} propertyId - Property ID
   * @returns {Promise<Array>} Array of tenant objects
   */
  async getTenantsForProperty(propertyId) {
    if (!propertyId) {
      throw new Error('Property ID is required');
    }

    if (this.isDemoMode) {
      return demoData.getDemoTenantsForProperty(propertyId);
    }

    const getTenantsOperation = async () => {
      const q = query(
        collection(db, 'users'),
        where('propertyId', '==', propertyId),
        where('userType', '==', 'tenant')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    };

    return await resilientFirestoreOperation(getTenantsOperation);
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
   * Get properties for a specific tenant
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<Array>} Array of property objects
   */
  async getPropertiesForTenant(tenantId) {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    if (this.isDemoMode) {
      // For demo mode, return mock tenant properties
      return demoData.getDemoPropertiesForTenant ? 
             demoData.getDemoPropertiesForTenant(tenantId) : 
             [];
    }

    const getPropertiesOperation = async () => {
      try {
        console.log(`Fetching properties for tenant: ${tenantId}`);
        
        // Attempt different strategies to find tenant properties
        
        // Strategy 1: Check user profile for property assignments
        try {
          const userDoc = await getDoc(doc(db, 'users', tenantId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // If user has a direct propertyId assignment
            if (userData.propertyId) {
              const property = await this.getPropertyById(userData.propertyId);
              if (property) {
                console.log(`Found property directly assigned to tenant: ${property.id}`);
                return [property];
              }
            }
            
            // If user has multiple properties
            if (userData.properties && Array.isArray(userData.properties)) {
              if (userData.properties.length > 0) {
                console.log(`Found ${userData.properties.length} properties in user profile`);
                // If properties are IDs, fetch them
                if (typeof userData.properties[0] === 'string') {
                  const propertyPromises = userData.properties.map(id => this.getPropertyById(id));
                  const properties = await Promise.all(propertyPromises);
                  return properties.filter(p => p !== null);
                }
                // If properties are objects with IDs, fetch them
                else if (userData.properties[0].id) {
                  const propertyPromises = userData.properties.map(p => this.getPropertyById(p.id));
                  const properties = await Promise.all(propertyPromises);
                  return properties.filter(p => p !== null);
                }
                // If properties are embedded, return them directly
                else {
                  return userData.properties;
                }
              }
            }
          }
        } catch (profileError) {
          console.warn("Error checking user profile for properties:", profileError);
        }
        
        // Strategy 2: Check property records for tenant references (property.tenants array)
        try {
          const propertiesWithTenantRef = query(
            collection(db, 'properties'),
            where('tenants', 'array-contains', tenantId)
          );
          
          const querySnapshot = await getDocs(propertiesWithTenantRef);
          if (!querySnapshot.empty) {
            console.log(`Found ${querySnapshot.docs.length} properties with tenant in 'tenants' array`);
            return querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
          }
        } catch (arrayContainsError) {
          console.warn("Error querying properties with tenant reference:", arrayContainsError);
        }
        
        // Strategy 3: Check for units containing this tenant
        try {
          // First attempt: Try units as nested array in properties
          const propertiesWithUnitTenant = query(
            collection(db, 'properties')
          );
          
          const allProperties = await getDocs(propertiesWithUnitTenant);
          const matchingProperties = [];
          
          // Manually filter properties with units containing this tenant
          allProperties.forEach(propertyDoc => {
            const propertyData = propertyDoc.data();
            if (propertyData.units && Array.isArray(propertyData.units)) {
              // Check if any unit contains this tenant
              const hasTenant = propertyData.units.some(unit => 
                unit.tenantId === tenantId || 
                (unit.tenants && Array.isArray(unit.tenants) && unit.tenants.includes(tenantId))
              );
              
              if (hasTenant) {
                matchingProperties.push({
                  id: propertyDoc.id,
                  ...propertyData
                });
              }
            }
          });
          
          if (matchingProperties.length > 0) {
            console.log(`Found ${matchingProperties.length} properties with tenant in units`);
            return matchingProperties;
          }
        } catch (unitsError) {
          console.warn("Error searching units for tenant:", unitsError);
        }
        
        // Strategy 4: Check tenantProperties collection if it exists
        try {
          const tenantPropertiesRef = collection(db, 'tenantProperties');
          const tenantPropertiesQuery = query(
            tenantPropertiesRef,
            where('tenantId', '==', tenantId)
          );
          
          const tenantPropertiesSnapshot = await getDocs(tenantPropertiesQuery);
          if (!tenantPropertiesSnapshot.empty) {
            console.log(`Found ${tenantPropertiesSnapshot.docs.length} entries in tenantProperties collection`);
            
            // Extract property IDs and fetch full property data
            const propertyIds = tenantPropertiesSnapshot.docs.map(doc => doc.data().propertyId);
            const uniqueIds = [...new Set(propertyIds)]; // Remove duplicates
            
            const propertyPromises = uniqueIds.map(id => this.getPropertyById(id));
            const properties = await Promise.all(propertyPromises);
            return properties.filter(p => p !== null);
          }
        } catch (tenantPropertiesError) {
          console.warn("Error checking tenantProperties collection:", tenantPropertiesError);
        }
        
        // No properties found using any method
        console.log(`No properties found for tenant: ${tenantId}`);
        return [];
      } catch (error) {
        console.error('Error retrieving tenant properties:', error);
        throw error;
      }
    };

    return await resilientFirestoreOperation(getPropertiesOperation);
  }
}

// Create and export a singleton instance
const dataService = new DataService();
export default dataService; 