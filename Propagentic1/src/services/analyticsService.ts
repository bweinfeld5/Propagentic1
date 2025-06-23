/**
 * Analytics Service - PropAgentic
 * 
 * Service for tracking user actions and events
 */

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

interface AnalyticsEvent {
  eventName: string;
  userId?: string | null;
  email?: string | null;
  properties?: Record<string, any>;
  timestamp: ReturnType<typeof serverTimestamp>;
  source: string;
  sessionId?: string;
  userAgent?: string;
}

/**
 * Track an event in the analytics system
 */
export const trackEvent = async (
  eventName: string,
  userId: string | null = null,
  properties: Record<string, any> = {},
  source: string = 'web_app'
): Promise<void> => {
  try {
    // Generate a session ID if not already set
    const sessionId = getOrCreateSessionId();
    
    const eventData: AnalyticsEvent = {
      eventName,
      userId,
      properties,
      timestamp: serverTimestamp(),
      source,
      sessionId,
      userAgent: navigator.userAgent.substring(0, 200)
    };
    
    // Store event in Firestore
    await addDoc(collection(db, 'analytics_events'), eventData);
    
    // If we had a third-party analytics service, we would also send the event there
    console.log(`Analytics event tracked: ${eventName}`, properties);
  } catch (error) {
    // Don't let analytics errors affect the user experience
    console.error('Error tracking analytics event:', error);
  }
};

/**
 * Track a page view
 */
export const trackPageView = async (
  pageName: string,
  userId: string | null = null,
  additionalProperties: Record<string, any> = {}
): Promise<void> => {
  return trackEvent('page_view', userId, {
    page: pageName,
    url: window.location.href,
    referrer: document.referrer,
    ...additionalProperties
  });
};

/**
 * Track a waitlist signup
 */
export const trackWaitlistSignup = async (
  email: string,
  role: string,
  userId: string | null = null,
  source: string = 'landing_page'
): Promise<void> => {
  return trackEvent('waitlist_signup', userId, {
    email,
    role,
    source
  });
};

/**
 * Get or create a session ID for the current user session
 */
const getOrCreateSessionId = (): string => {
  const sessionStorageKey = 'propagentic_session_id';
  let sessionId = sessionStorage.getItem(sessionStorageKey);
  
  if (!sessionId) {
    sessionId = generateUniqueId();
    sessionStorage.setItem(sessionStorageKey, sessionId);
  }
  
  return sessionId;
};

/**
 * Generate a unique ID for tracking purposes
 */
const generateUniqueId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const analyticsService = {
  trackEvent,
  trackPageView,
  trackWaitlistSignup
};

export default analyticsService; 