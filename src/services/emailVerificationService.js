/**
 * Email Verification Service
 * 
 * Handles email verification synchronization between Firebase Auth and Firestore.
 * This service addresses the common issue where Firestore marks emails as verified
 * during onboarding but Firebase Auth may not be in sync.
 */

import { 
  sendEmailVerification, 
  updateProfile,
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  doc, 
  updateDoc, 
  getDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../firebase/config';

class EmailVerificationService {
  /**
   * Send email verification to current user
   * @returns {Promise<boolean>} Success status
   */
  async sendVerificationEmail() {
    try {
      if (!auth.currentUser) {
        throw new Error('No authenticated user');
      }

      if (auth.currentUser.emailVerified) {
        console.log('Email already verified');
        return true;
      }

      await sendEmailVerification(auth.currentUser);
      console.log('Verification email sent');
      return true;
    } catch (error) {
      console.error('Error sending verification email:', error);
      return false;
    }
  }

  /**
   * Check and sync email verification status between Auth and Firestore
   * @param {string} uid - User ID
   * @returns {Promise<Object>} Sync result
   */
  async syncEmailVerificationStatus(uid) {
    try {
      if (!auth.currentUser || auth.currentUser.uid !== uid) {
        throw new Error('User not authenticated or UID mismatch');
      }

      // Get current Auth status
      const authVerified = auth.currentUser.emailVerified;
      
      // Get Firestore status
      const userDocRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        throw new Error('User document not found');
      }

      const userData = userDoc.data();
      const firestoreVerified = userData.emailVerified === true;

      console.log('Email verification status:', {
        auth: authVerified,
        firestore: firestoreVerified,
        uid: uid.substring(0, 8) + '...'
      });

      // If Firestore says verified but Auth doesn't, update Firestore to match Auth
      // This is the conservative approach - we trust Auth's verification status
      if (firestoreVerified && !authVerified) {
        console.log('Updating Firestore to match Auth (unverified)');
        await updateDoc(userDocRef, {
          emailVerified: false,
          emailVerificationSyncedAt: serverTimestamp()
        });

        return {
          action: 'Updated Firestore to match Auth',
          before: { auth: authVerified, firestore: firestoreVerified },
          after: { auth: authVerified, firestore: false }
        };
      }

      // If Auth says verified but Firestore doesn't, update Firestore
      if (authVerified && !firestoreVerified) {
        console.log('Updating Firestore to match Auth (verified)');
        await updateDoc(userDocRef, {
          emailVerified: true,
          emailVerificationSyncedAt: serverTimestamp()
        });

        return {
          action: 'Updated Firestore to match Auth',
          before: { auth: authVerified, firestore: firestoreVerified },
          after: { auth: authVerified, firestore: true }
        };
      }

      return {
        action: 'Already in sync',
        status: { auth: authVerified, firestore: firestoreVerified }
      };

    } catch (error) {
      console.error('Error syncing email verification:', error);
      throw error;
    }
  }

  /**
   * Mark email as verified in Firestore (for admin use or special cases)
   * @param {string} uid - User ID
   * @returns {Promise<boolean>} Success status
   */
  async markEmailVerifiedInFirestore(uid) {
    try {
      const userDocRef = doc(db, 'users', uid);
      await updateDoc(userDocRef, {
        emailVerified: true,
        emailVerificationOverride: true,
        emailVerificationOverrideAt: serverTimestamp()
      });

      console.log(`Marked email as verified in Firestore for user ${uid}`);
      return true;
    } catch (error) {
      console.error('Error marking email as verified:', error);
      return false;
    }
  }

  /**
   * Setup automatic sync when user's email verification status changes
   * @param {string} uid - User ID
   * @returns {Function} Unsubscribe function
   */
  setupAutoSync(uid) {
    let lastKnownVerificationStatus = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user || user.uid !== uid) return;

      // Check if verification status changed
      if (lastKnownVerificationStatus !== user.emailVerified) {
        lastKnownVerificationStatus = user.emailVerified;
        
        console.log(`Email verification status changed for ${uid}: ${user.emailVerified}`);
        
        // Sync with Firestore
        try {
          await this.syncEmailVerificationStatus(uid);
        } catch (error) {
          console.error('Auto-sync failed:', error);
        }
      }
    });

    return unsubscribe;
  }

  /**
   * Get email verification status from both systems
   * @param {string} uid - User ID
   * @returns {Promise<Object>} Verification status
   */
  async getVerificationStatus(uid) {
    try {
      const userDocRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userDocRef);
      
      let firestoreVerified = false;
      if (userDoc.exists()) {
        firestoreVerified = userDoc.data().emailVerified === true;
      }

      const authVerified = auth.currentUser?.emailVerified || false;

      return {
        auth: authVerified,
        firestore: firestoreVerified,
        consistent: authVerified === firestoreVerified,
        uid: uid
      };
    } catch (error) {
      console.error('Error getting verification status:', error);
      throw error;
    }
  }
}

export default new EmailVerificationService(); 