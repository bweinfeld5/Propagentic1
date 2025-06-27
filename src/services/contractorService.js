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
  arrayUnion,
  arrayRemove,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Contractor Service
 * Handles contractor management operations for landlords
 */
class ContractorService {
  
  /**
   * Get all contractors for a landlord
   */
  async getContractors(landlordId) {
    try {
      const contractorsRef = collection(db, 'contractors');
      const q = query(
        contractorsRef,
        where('landlordId', '==', landlordId),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const contractors = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return { success: true, data: contractors };
    } catch (error) {
      console.error('Error fetching contractors:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Add a new contractor
   */
  async addContractor(landlordId, contractorData) {
    try {
      const contractorRef = doc(collection(db, 'contractors'));
      
      const contractor = {
        ...contractorData,
        id: contractorRef.id,
        landlordId,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isPreferred: true,
        ratings: {
          overall: 0,
          communication: 0,
          timeliness: 0,
          quality: 0,
          reviewCount: 0
        },
        statistics: {
          totalJobs: 0,
          completedJobs: 0,
          averageResponseTime: 0,
          repeatCustomer: false
        }
      };

      // Use batch to ensure both operations succeed or fail together
      const batch = writeBatch(db);
      
      // Add contractor to contractors collection
      batch.set(contractorRef, contractor);
      
      // Update landlord profile to include this contractor
      const landlordProfileRef = doc(db, 'landlordProfiles', landlordId);
      batch.update(landlordProfileRef, {
        contractors: arrayUnion(contractorRef.id),
        updatedAt: serverTimestamp()
      });
      
      await batch.commit();

      return { 
        success: true, 
        data: { id: contractorRef.id, ...contractor },
        message: 'Contractor added successfully'
      };
    } catch (error) {
      console.error('Error adding contractor:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update contractor information
   */
  async updateContractor(contractorId, updateData) {
    try {
      const contractorRef = doc(db, 'contractors', contractorId);
      
      const updates = {
        ...updateData,
        updatedAt: serverTimestamp()
      };

      await updateDoc(contractorRef, updates);

      // Get updated contractor
      const updatedDoc = await getDoc(contractorRef);
      const updatedContractor = { id: updatedDoc.id, ...updatedDoc.data() };

      return {
        success: true,
        data: updatedContractor,
        message: 'Contractor updated successfully'
      };
    } catch (error) {
      console.error('Error updating contractor:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Remove contractor (soft delete)
   */
  async removeContractor(contractorId) {
    try {
      const contractorRef = doc(db, 'contractors', contractorId);
      
      // Get contractor data to find landlordId
      const contractorDoc = await getDoc(contractorRef);
      if (!contractorDoc.exists()) {
        throw new Error('Contractor not found');
      }
      
      const contractorData = contractorDoc.data();
      const landlordId = contractorData.landlordId;
      
      // Use batch to ensure both operations succeed or fail together
      const batch = writeBatch(db);
      
      // Soft delete contractor
      batch.update(contractorRef, {
        status: 'removed',
        updatedAt: serverTimestamp()
      });
      
      // Remove contractor from landlord profile
      const landlordProfileRef = doc(db, 'landlordProfiles', landlordId);
      batch.update(landlordProfileRef, {
        contractors: arrayRemove(contractorId),
        updatedAt: serverTimestamp()
      });
      
      await batch.commit();

      return {
        success: true,
        message: 'Contractor removed successfully'
      };
    } catch (error) {
      console.error('Error removing contractor:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get contractors by trade/specialty
   */
  async getContractorsByTrade(landlordId, tradeType) {
    try {
      const contractorsRef = collection(db, 'contractors');
      const q = query(
        contractorsRef,
        where('landlordId', '==', landlordId),
        where('trades', 'array-contains', tradeType),
        where('status', '==', 'active')
      );

      const snapshot = await getDocs(q);
      const contractors = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return { success: true, data: contractors };
    } catch (error) {
      console.error('Error fetching contractors by trade:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update contractor rating
   */
  async updateContractorRating(contractorId, ratingData) {
    try {
      const contractorRef = doc(db, 'contractors', contractorId);
      const contractorDoc = await getDoc(contractorRef);
      
      if (!contractorDoc.exists()) {
        throw new Error('Contractor not found');
      }

      const contractor = contractorDoc.data();
      const currentRatings = contractor.ratings || {};
      const reviewCount = (currentRatings.reviewCount || 0) + 1;

      // Calculate new averages
      const newRatings = {
        overall: ((currentRatings.overall || 0) * (reviewCount - 1) + ratingData.overall) / reviewCount,
        communication: ((currentRatings.communication || 0) * (reviewCount - 1) + ratingData.communication) / reviewCount,
        timeliness: ((currentRatings.timeliness || 0) * (reviewCount - 1) + ratingData.timeliness) / reviewCount,
        quality: ((currentRatings.quality || 0) * (reviewCount - 1) + ratingData.quality) / reviewCount,
        reviewCount
      };

      await updateDoc(contractorRef, {
        ratings: newRatings,
        updatedAt: serverTimestamp()
      });

      return {
        success: true,
        data: newRatings,
        message: 'Rating updated successfully'
      };
    } catch (error) {
      console.error('Error updating contractor rating:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Subscribe to contractor updates
   */
  subscribeToContractors(landlordId, callback, errorCallback) {
    try {
      const contractorsRef = collection(db, 'contractors');
      const q = query(
        contractorsRef,
        where('landlordId', '==', landlordId),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      );

      return onSnapshot(q, 
        (snapshot) => {
          const contractors = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          callback(contractors);
        },
        (error) => {
          console.error('Contractor subscription error:', error);
          if (errorCallback) errorCallback(error);
        }
      );
    } catch (error) {
      console.error('Error setting up contractor subscription:', error);
      if (errorCallback) errorCallback(error);
      return () => {}; // Return empty unsubscribe function
    }
  }

  /**
   * Search contractors by name or company
   */
  async searchContractors(landlordId, searchTerm) {
    try {
      const contractorsRef = collection(db, 'contractors');
      const q = query(
        contractorsRef,
        where('landlordId', '==', landlordId),
        where('status', '==', 'active')
      );

      const snapshot = await getDocs(q);
      const contractors = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Client-side filtering for more flexible search
      const filteredContractors = contractors.filter(contractor => {
        const searchLower = searchTerm.toLowerCase();
        return (
          contractor.name?.toLowerCase().includes(searchLower) ||
          contractor.companyName?.toLowerCase().includes(searchLower) ||
          contractor.email?.toLowerCase().includes(searchLower) ||
          contractor.trades?.some(trade => trade.toLowerCase().includes(searchLower))
        );
      });

      return { success: true, data: filteredContractors };
    } catch (error) {
      console.error('Error searching contractors:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
const contractorService = new ContractorService();
export default contractorService; 