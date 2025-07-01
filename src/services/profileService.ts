import { doc, updateDoc, onSnapshot, serverTimestamp, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth, db, storage } from '../firebase/config';
import { User } from 'firebase/auth';
import { UserProfile } from '../models/UserProfile';
import toast from 'react-hot-toast';

export class ProfileService {
  /**
   * Get user profile data from Firestore
   */
  static async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userDocRef = doc(db, 'users', uid);
      const docSnap = await getDoc(userDocRef);
      return docSnap.exists() ? (docSnap.data() as unknown as UserProfile) : null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  /**
   * Stream user profile data in real-time
   */
  static streamUserProfile(uid: string, callback: (profile: UserProfile | null) => void): () => void {
    const userDocRef = doc(db, 'users', uid);
    return onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() } as unknown as UserProfile);
      } else {
        callback(null);
      }
    });
  }

  /**
   * Update user profile data (Firestore and Auth)
   */
  static async updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    if (!auth.currentUser || auth.currentUser.uid !== uid) {
      throw new Error("You are not authorized to perform this action.");
    }

    const userDocRef = doc(db, 'users', uid);
    const updateData = { ...data, updatedAt: new Date() };

    // Update Firestore document
    await updateDoc(userDocRef, updateData);

    // Update Firebase Auth profile
    if (data.displayName || data.photoURL) {
      await updateProfile(auth.currentUser, {
        displayName: data.displayName,
        photoURL: data.photoURL,
      });
    }
  }

  /**
   * Upload profile photo to Firebase Storage
   */
  static async uploadProfilePhoto(uid: string, file: File): Promise<string> {
    const storageRef = ref(storage, `profile-photos/${uid}/${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  }

  /**
   * Change user password
   */
  static async changeUserPassword(currentPassword: string, newPassword: string): Promise<void> {
    const user = auth.currentUser;
    if (!user || !user.email) throw new Error("User not authenticated.");

    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    
    // Re-authenticate before changing password for security
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
  }

  /**
   * Update user profile with optimistic UI updates
   */
  static async updateProfile(user: User, profileData: any): Promise<void> {
    try {
      const userRef = doc(db, 'users', user.uid);
      
      // Prepare update data with timestamp
      const updateData = {
        ...profileData,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(userRef, updateData);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
      throw error;
    }
  }

  /**
   * Subscribe to real-time profile updates
   */
  static subscribeToProfile(userId: string, callback: (profile: any) => void): () => void {
    const userRef = doc(db, 'users', userId);
    
    return onSnapshot(
      userRef, 
      (doc) => {
        if (doc.exists()) {
          const profileData = { id: doc.id, ...doc.data() };
          callback(profileData);
        } else {
          console.warn('Profile document does not exist for user:', userId);
          callback(null);
        }
      },
      (error) => {
        console.error('Error listening to profile changes:', error);
        toast.error('Connection error. Some data may not be up to date.');
      }
    );
  }

  /**
   * Calculate profile completion percentage based on role
   */
  static calculateProfileCompletion(profile: any, role: string): number {
    if (!profile) return 0;
    
    const requiredFields = this.getRequiredFields(role);
    const completedFields = requiredFields.filter(field => {
      const value = this.getNestedValue(profile, field);
      return value !== null && value !== undefined && value !== '' && value !== 0;
    });
    
    return Math.round((completedFields.length / requiredFields.length) * 100);
  }

  /**
   * Get required fields for profile completion based on role
   */
  private static getRequiredFields(role: string): string[] {
    const baseFields = ['firstName', 'lastName', 'email', 'phone'];
    
    switch (role) {
      case 'landlord':
        return [...baseFields, 'businessName'];
      case 'tenant':
        return [...baseFields];
      case 'contractor':
        return [...baseFields, 'businessName', 'serviceTypes'];
      case 'admin':
      case 'super_admin':
        return baseFields;
      default:
        return baseFields;
    }
  }

  /**
   * Get nested value from object using dot notation
   */
  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Get account status based on profile data
   */
  static getAccountStatus(profile: any): 'active' | 'inactive' | 'pending' | 'suspended' {
    if (!profile) return 'inactive';
    
    // Check if email is verified
    if (!profile.emailVerified) return 'pending';
    
    // Check if onboarding is complete
    if (!profile.onboardingComplete) return 'pending';
    
    // Check if profile is sufficiently complete
    const completionPercentage = this.calculateProfileCompletion(profile, profile.role);
    if (completionPercentage < 50) return 'inactive';
    
    // Check for explicit status
    if (profile.status) return profile.status;
    
    return 'active';
  }

  /**
   * Get account status display information
   */
  static getAccountStatusDisplay(status: string) {
    switch (status) {
      case 'active':
        return { label: 'Active', color: 'green', description: 'Account is active and fully functional' };
      case 'inactive':
        return { label: 'Inactive', color: 'gray', description: 'Complete your profile to activate your account' };
      case 'pending':
        return { label: 'Pending', color: 'yellow', description: 'Verification or setup required' };
      case 'suspended':
        return { label: 'Suspended', color: 'red', description: 'Account access is temporarily restricted' };
      default:
        return { label: 'Unknown', color: 'gray', description: 'Account status unknown' };
    }
  }
}
