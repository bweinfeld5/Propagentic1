import React, { useState, useEffect } from 'react';
import { 
  BellIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon,
  HomeIcon,
  UserGroupIcon,
  EnvelopeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

/**
 * Non-Email Invitation System
 * 
 * Provides alternative notification methods for property invitations:
 * 1. In-app notifications
 * 2. Dashboard banners  
 * 3. Browser notifications
 * 4. Toast notifications
 * 5. Badge counters
 */
const NonEmailInvitationSystem = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    // Request browser notification permission
    requestNotificationPermission();

    // Listen to property invitations for current user
    const invitationsQuery = query(
      collection(db, 'propertyInvitations'),
      where('tenantEmail', '==', currentUser.email),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(invitationsQuery, (snapshot) => {
      const invitations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setNotifications(invitations);
      setLoading(false);

      // Handle new invitations
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const invitation = { id: change.doc.id, ...change.doc.data() };
          handleNewInvitation(invitation);
        }
      });
    });

    return () => unsubscribe();
  }, [currentUser]);

  /**
   * Request browser notification permission
   */
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setHasPermission(permission === 'granted');
    }
  };

  /**
   * Handle new property invitation
   */
  const handleNewInvitation = async (invitation) => {
    // 1. Show toast notification
    toast.success(
      `🏠 New property invitation from ${invitation.landlordEmail}!`,
      {
        duration: 8000,
        position: 'top-right',
        style: {
          background: '#10B981',
          color: 'white',
        },
      }
    );

    // 2. Create in-app notification
    try {
      await addDoc(collection(db, 'notifications'), {
        userId: currentUser.uid,
        type: 'property_invitation',
        title: 'New Property Invitation',
        message: `You've been invited to join ${invitation.propertyName || 'a property'} by ${invitation.landlordEmail}`,
        data: {
          invitationId: invitation.id,
          propertyName: invitation.propertyName,
          landlordEmail: invitation.landlordEmail,
          propertyAddress: invitation.propertyAddress
        },
        read: false,
        priority: 'high',
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error creating in-app notification:', error);
    }

    // 3. Show browser notification
    if (hasPermission && 'Notification' in window) {
      const notification = new Notification('PropAgentic - Property Invitation', {
        body: `${invitation.landlordEmail} invited you to join ${invitation.propertyName || 'a property'}`,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `property-invitation-${invitation.id}`,
        requireInteraction: true,
        actions: [
          {
            action: 'view',
            title: 'View Dashboard'
          },
          {
            action: 'close',
            title: 'Close'
          }
        ]
      });

      notification.onclick = () => {
        window.focus();
        // Navigate to tenant dashboard
        window.location.href = '/tenant/dashboard';
        notification.close();
      };

      // Auto close after 10 seconds
      setTimeout(() => {
        notification.close();
      }, 10000);
    }

    // 4. Update page title to show notification count
    updatePageTitle();
  };

  /**
   * Update page title with notification count
   */
  const updatePageTitle = () => {
    const unreadCount = notifications.filter(n => !n.read).length;
    const baseTitle = 'PropAgentic';
    
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) ${baseTitle} - Property Invitations`;
    } else {
      document.title = baseTitle;
    }
  };

  /**
   * Accept property invitation
   */
  const acceptInvitation = async (invitation) => {
    try {
      // Update invitation status
      await updateDoc(doc(db, 'propertyInvitations', invitation.id), {
        status: 'accepted',
        acceptedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      toast.success(`✅ Successfully joined ${invitation.propertyName}!`);
      
      // Remove from local notifications
      setNotifications(prev => prev.filter(n => n.id !== invitation.id));
      
      updatePageTitle();
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast.error('Failed to accept invitation. Please try again.');
    }
  };

  /**
   * Decline property invitation
   */
  const declineInvitation = async (invitation) => {
    try {
      // Update invitation status
      await updateDoc(doc(db, 'propertyInvitations', invitation.id), {
        status: 'declined',
        declinedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      toast.success('Invitation declined');
      
      // Remove from local notifications
      setNotifications(prev => prev.filter(n => n.id !== invitation.id));
      
      updatePageTitle();
    } catch (error) {
      console.error('Error declining invitation:', error);
      toast.error('Failed to decline invitation. Please try again.');
    }
  };

  /**
   * Send test notification (for demonstration)
   */
  const sendTestNotification = async () => {
    const testInvitation = {
      id: `test-${Date.now()}`,
      propertyName: 'Demo Property',
      landlordEmail: 'demo@landlord.com',
      propertyAddress: '123 Demo Street, Demo City',
      tenantEmail: currentUser.email,
      status: 'pending',
      createdAt: new Date()
    };

    await handleNewInvitation(testInvitation);
    setNotifications(prev => [testInvitation, ...prev]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading notifications...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BellIcon className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Property Invitations
              </h2>
              <p className="text-sm text-gray-600">
                Non-email notification system for property invitations
              </p>
            </div>
          </div>
          
          {/* Notification badge */}
          {notifications.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {notifications.length} pending
              </span>
              <button
                onClick={sendTestNotification}
                className="text-sm text-blue-600 hover:text-blue-700 underline"
              >
                Test Notification
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Browser Notification Status */}
      <div className={`rounded-lg border p-4 ${
        hasPermission 
          ? 'bg-green-50 border-green-200' 
          : 'bg-yellow-50 border-yellow-200'
      }`}>
        <div className="flex items-center space-x-2">
          <BellIcon className={`h-5 w-5 ${
            hasPermission ? 'text-green-600' : 'text-yellow-600'
          }`} />
          <span className={`text-sm ${
            hasPermission ? 'text-green-700' : 'text-yellow-700'
          }`}>
            Browser notifications: {hasPermission ? 'Enabled' : 'Disabled'}
          </span>
          {!hasPermission && (
            <button
              onClick={requestNotificationPermission}
              className="text-sm text-yellow-700 underline hover:text-yellow-800"
            >
              Enable
            </button>
          )}
        </div>
      </div>

      {/* Available Notification Methods */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Available Notification Methods
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* In-App Notifications */}
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-800">In-App Notifications</span>
            </div>
            <p className="text-sm text-green-700">
              Real-time notifications appear in your dashboard when invitations are received.
            </p>
          </div>

          {/* Dashboard Banners */}
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-800">Dashboard Banners</span>
            </div>
            <p className="text-sm text-green-700">
              Prominent banners show pending invitations when you log in.
            </p>
          </div>

          {/* Browser Notifications */}
          <div className={`rounded-lg p-4 border ${
            hasPermission 
              ? 'bg-green-50 border-green-200' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center space-x-2 mb-2">
              {hasPermission ? (
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
              ) : (
                <ExclamationCircleIcon className="h-5 w-5 text-gray-500" />
              )}
              <span className={`font-medium ${
                hasPermission ? 'text-green-800' : 'text-gray-600'
              }`}>
                Browser Notifications
              </span>
            </div>
            <p className={`text-sm ${
              hasPermission ? 'text-green-700' : 'text-gray-600'
            }`}>
              {hasPermission 
                ? 'Desktop notifications will pop up even when browser is in background.'
                : 'Enable browser notifications for desktop alerts.'
              }
            </p>
          </div>

          {/* Toast Notifications */}
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-800">Toast Notifications</span>
            </div>
            <p className="text-sm text-green-700">
              Temporary pop-up messages appear when new invitations arrive.
            </p>
          </div>

          {/* SMS (Future) */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center space-x-2 mb-2">
              <ExclamationCircleIcon className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-800">SMS Notifications</span>
            </div>
            <p className="text-sm text-blue-700">
              Text message alerts (available for implementation with Twilio).
            </p>
          </div>

          {/* Push Notifications (Future) */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center space-x-2 mb-2">
              <ExclamationCircleIcon className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-800">Push Notifications</span>
            </div>
            <p className="text-sm text-blue-700">
              Mobile app push notifications (available with FCM integration).
            </p>
          </div>
        </div>
      </div>

      {/* Active Invitations */}
      {notifications.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Pending Property Invitations
          </h3>
          <div className="space-y-4">
            {notifications.map((invitation) => (
              <div
                key={invitation.id}
                className="border border-orange-200 rounded-lg p-4 bg-orange-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <HomeIcon className="h-6 w-6 text-orange-600 mt-1" />
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {invitation.propertyName || 'Property Invitation'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        From: {invitation.landlordEmail}
                      </p>
                      {invitation.propertyAddress && (
                        <p className="text-sm text-gray-500 mt-1">
                          📍 {invitation.propertyAddress}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Received: {invitation.createdAt?.toDate?.()?.toLocaleDateString?.() || 'Recently'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => acceptInvitation(invitation)}
                      className="bg-green-600 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => declineInvitation(invitation)}
                      className="bg-gray-400 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-gray-500 transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <UserGroupIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No pending invitations
          </h3>
          <p className="text-gray-600 mb-6">
            Property invitations will appear here when landlords invite you to join their properties.
          </p>
          <button
            onClick={sendTestNotification}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Test Notification System
          </button>
        </div>
      )}

      {/* Implementation Notes */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Implementation Benefits
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">✅ Working Now</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Real-time dashboard notifications</li>
              <li>• Browser notification support</li>
              <li>• Toast message alerts</li>
              <li>• In-app badge counters</li>
              <li>• No email dependency</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">🔮 Future Enhancements</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• SMS notifications via Twilio</li>
              <li>• Mobile push notifications via FCM</li>
              <li>• Webhook integrations</li>
              <li>• Slack/Discord notifications</li>
              <li>• Email fallback (when fixed)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NonEmailInvitationSystem; 