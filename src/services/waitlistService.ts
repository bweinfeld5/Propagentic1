/**
 * Waitlist Service - PropAgentic
 * 
 * Service for managing pre-launch waitlist functionality
 */

import { collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

interface WaitlistEntry {
  email: string;
  role: string;
  name?: string;
  timestamp: string;
  source: string;
  userId: string | null;
  subscribed_to_newsletter: boolean;
  marketing_consent?: boolean;
  early_access?: boolean;
  createdAt: ReturnType<typeof serverTimestamp>;
}

/**
 * Add a user to the waitlist
 */
export const addToWaitlist = async (data: Omit<WaitlistEntry, 'timestamp' | 'createdAt'>): Promise<string> => {
  try {
    // Check if email already exists in waitlist
    const existingEntries = await getDocs(
      query(collection(db, 'waitlist'), where('email', '==', data.email))
    );
    
    if (!existingEntries.empty) {
      // Email already exists in waitlist
      return 'existing';
    }
    
    // Add new entry to waitlist
    const waitlistData: WaitlistEntry = {
      ...data,
      timestamp: new Date().toISOString(),
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'waitlist'), waitlistData);
    
    // Optionally add to newsletter subscribers if they opted in
    if (data.subscribed_to_newsletter) {
      try {
        const newsletterData = {
          email: data.email,
          name: data.name || '',
          role: data.role,
          source: 'waitlist',
          subscribedAt: serverTimestamp(),
          status: 'active',
          preferences: {
            marketing: data.marketing_consent || false,
            product_updates: true,
            newsletters: true
          }
        };
        
        await addDoc(collection(db, 'newsletter_subscribers'), newsletterData);
      } catch (newsletterError) {
        console.warn('Newsletter subscription failed (non-critical):', newsletterError);
      }
    }
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding to waitlist:', error);
    throw error;
  }
};

/**
 * Check if an email is already on the waitlist
 */
export const checkWaitlistStatus = async (email: string): Promise<boolean> => {
  try {
    const existingEntries = await getDocs(
      query(collection(db, 'waitlist'), where('email', '==', email))
    );
    
    return !existingEntries.empty;
  } catch (error) {
    console.error('Error checking waitlist status:', error);
    throw error;
  }
};

const waitlistService = {
  addToWaitlist,
  checkWaitlistStatus
};

export default waitlistService; 