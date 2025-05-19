import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import dataService from '../../services/dataService';
import Button from '../../components/ui/Button';
import { HomeIcon, EnvelopeOpenIcon, ExclamationTriangleIcon, TicketIcon, ArrowUpTrayIcon, BellAlertIcon } from '@heroicons/react/24/outline';
import { query, collection, where, getDocs, addDoc, serverTimestamp, orderBy, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; // Import storage functions
import { db, storage } from '../../firebase/config'; // Import storage
import MaintenanceRequestModal from '../../components/tenant/MaintenanceRequestModal'; // Import the modal
import StatusPill from '../../components/ui/StatusPill'; // Import StatusPill
import InvitationCard from '../../components/tenant/InvitationCard';
import toast from 'react-hot-toast';
import { getPendingInvitesForTenant, acceptInvite, deleteInvite } from '../../services/firestore/inviteService';

const TenantDashboard = () => {
  // Execute the component tracer
  useEffect(() => {
    console.log('COMPONENT_LOADED: TenantDashboard.jsx');
    try {
      localStorage.setItem('LAST_COMPONENT_LOADED', 'TenantDashboard.jsx');
      localStorage.setItem('LAST_COMPONENT_LOAD_TIME', new Date().toISOString());
    } catch (e) {
      console.error('Could not write to localStorage');
    }
  }, []);

  const { currentUser, userProfile, loading: authLoading, fetchUserProfile } = useAuth();
  const [pendingInvites, setPendingInvites] = useState([]);
  const [propertyDetails, setPropertyDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for Maintenance Modal
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [submitError, setSubmitError] = useState(''); // Separate error state for submission
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false); // Separate loading for requests
  const [isLoadingInvites, setIsLoadingInvites] = useState(true);
  const [isProcessingInvite, setIsProcessingInvite] = useState(false); // To disable buttons during action

  // Rest of the component code...

  return (
    // Render component JSX code...
  );
};

export default TenantDashboard; 