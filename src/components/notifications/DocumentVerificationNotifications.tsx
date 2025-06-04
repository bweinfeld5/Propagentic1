import React, { useState, useEffect } from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentCheckIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import Button from '../ui/Button';
import toast from 'react-hot-toast';

interface VerificationNotification {
  id: string;
  contractorId: string;
  documentType: string;
  status: 'approved' | 'rejected' | 'pending' | 'requires_resubmission';
  message: string;
  createdAt: Date;
  read: boolean;
  rejectionReason?: string;
  actionRequired?: boolean;
}

interface DocumentVerificationNotificationsProps {
  showUnreadOnly?: boolean;
  maxNotifications?: number;
  onNotificationClick?: (notification: VerificationNotification) => void;
}

const DocumentVerificationNotifications: React.FC<DocumentVerificationNotificationsProps> = ({
  showUnreadOnly = false,
  maxNotifications = 10,
  onNotificationClick
}) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<VerificationNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const notificationsQuery = query(
      collection(db, 'verificationNotifications'),
      where('contractorId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notificationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as VerificationNotification[];

      let filteredNotifications = notificationsData;
      
      if (showUnreadOnly) {
        filteredNotifications = notificationsData.filter(n => !n.read);
      }
      
      if (maxNotifications) {
        filteredNotifications = filteredNotifications.slice(0, maxNotifications);
      }

      setNotifications(filteredNotifications);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, showUnreadOnly, maxNotifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'verificationNotifications', notificationId), {
        read: true,
        readAt: new Date()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationClick = async (notification: VerificationNotification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  const getNotificationIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon className="w-6 h-6 text-success" />;
      case 'rejected':
        return <XCircleIcon className="w-6 h-6 text-error" />;
      case 'pending':
        return <ClockIcon className="w-6 h-6 text-warning" />;
      case 'requires_resubmission':
        return <ExclamationTriangleIcon className="w-6 h-6 text-warning" />;
      default:
        return <DocumentCheckIcon className="w-6 h-6 text-content-secondary" />;
    }
  };

  const getNotificationColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'border-l-success bg-success/5';
      case 'rejected':
        return 'border-l-error bg-error/5';
      case 'pending':
        return 'border-l-warning bg-warning/5';
      case 'requires_resubmission':
        return 'border-l-warning bg-warning/5';
      default:
        return 'border-l-border bg-background-subtle';
    }
  };

  const formatDocumentType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'pending':
        return 'Under Review';
      case 'requires_resubmission':
        return 'Resubmission Required';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-background-subtle dark:bg-background-darkSubtle rounded-lg p-4 border-l-4 border-l-border">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-content-secondary/20 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-content-secondary/20 rounded w-3/4"></div>
                  <div className="h-3 bg-content-secondary/20 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-8">
        <BellIcon className="w-12 h-12 mx-auto text-content-secondary dark:text-content-darkSecondary mb-4" />
        <p className="text-content-secondary dark:text-content-darkSecondary">
          {showUnreadOnly ? 'No unread notifications' : 'No verification notifications'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`
            rounded-lg p-4 border-l-4 cursor-pointer transition-all duration-200 hover:shadow-md
            ${getNotificationColor(notification.status)}
            ${!notification.read ? 'ring-2 ring-primary/20' : ''}
          `}
          onClick={() => handleNotificationClick(notification)}
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              {getNotificationIcon(notification.status)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-content dark:text-content-dark">
                  {formatDocumentType(notification.documentType)} - {getStatusText(notification.status)}
                </p>
                {!notification.read && (
                  <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                )}
              </div>
              
              <p className="text-sm text-content-secondary dark:text-content-darkSecondary mt-1">
                {notification.message}
              </p>
              
              {notification.rejectionReason && (
                <div className="mt-2 p-2 bg-error/10 border border-error/20 rounded text-sm text-error">
                  <strong>Reason:</strong> {notification.rejectionReason}
                </div>
              )}
              
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-content-secondary dark:text-content-darkSecondary">
                  {notification.createdAt.toLocaleDateString()} at {notification.createdAt.toLocaleTimeString()}
                </p>
                
                                 {notification.actionRequired && (
                   <div onClick={(e) => e.stopPropagation()}>
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => {
                         // Navigate to document verification page
                         window.location.href = '/contractor/documents';
                       }}
                     >
                       Take Action
                     </Button>
                   </div>
                 )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DocumentVerificationNotifications; 