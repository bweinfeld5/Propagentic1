import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, arrayUnion, getDocs, limit, startAfter } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage, callFunction } from '../../firebase/config';
import NotificationPreferences from '../notifications/NotificationPreferences';
import DocumentVerificationSystem from './documents/DocumentVerificationSystem';
import DocumentVerificationNotifications from '../notifications/DocumentVerificationNotifications';
import ContractorOverviewCards from './ContractorOverviewCards';
import Button from '../ui/Button';
import StatusPill from '../ui/StatusPill';
import { 
  XMarkIcon, 
  PhotoIcon,
  DocumentCheckIcon,
  BellIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

// Constants for validation
const MAX_PROGRESS_UPDATE_LENGTH = 500;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
const ITEMS_PER_PAGE = 10; // Number of tickets to load per page

const ContractorDashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [affiliatedLandlords, setAffiliatedLandlords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [progressUpdate, setProgressUpdate] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressPhotos, setProgressPhotos] = useState([]);
  const [progressPhotoURLs, setProgressPhotoURLs] = useState([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [submittingUpdate, setSubmittingUpdate] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [decisionLoading, setDecisionLoading] = useState({ accept: false, reject: false });
  // Pagination state
  const [lastVisible, setLastVisible] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  // Status filter state
  const [statusFilter, setStatusFilter] = useState('all');
  // Unsubscribe references
  const unsubscribeRefs = useRef({});
  // Add this state 
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [verificationStatus, setVerificationStatus] = useState('pending');
  const [contractorStats, setContractorStats] = useState({
    newJobs: 0,
    activeJobs: 0,
    completedThisMonth: 0,
    avgCompletionTime: null
  });

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const contractorId = currentUser.uid;
    
    // Fetch tickets assigned to this contractor
    const fetchTickets = () => {
      // Clear any existing subscription
      if (unsubscribeRefs.current.tickets) {
        unsubscribeRefs.current.tickets();
      }
      
      const ticketsRef = collection(db, 'tickets');
      
      // Build query based on filter
      let ticketsQuery;
      if (statusFilter === 'all') {
        ticketsQuery = query(
          ticketsRef,
          where('contractorId', '==', contractorId),
          where('status', 'in', ['assigned', 'accepted', 'in_progress', 'dispatched']),
          orderBy('updatedAt', 'desc'),
          limit(ITEMS_PER_PAGE)
        );
      } else {
        ticketsQuery = query(
          ticketsRef,
          where('contractorId', '==', contractorId),
          where('status', '==', statusFilter),
          orderBy('updatedAt', 'desc'),
          limit(ITEMS_PER_PAGE)
        );
      }
      
      const unsubscribeTickets = onSnapshot(ticketsQuery, (snapshot) => {
        if (!snapshot.empty) {
          const ticketsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          }));
          setTickets(ticketsData);
          // Store the last document for pagination
          setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
          setHasMore(snapshot.docs.length >= ITEMS_PER_PAGE);
        } else {
          setTickets([]);
          setHasMore(false);
        }
        setLoading(false);
      }, (err) => {
        console.error('Error fetching tickets:', err);
        setError('Failed to load assigned tickets');
        setLoading(false);
      });
      
      // Store unsubscribe function
      unsubscribeRefs.current.tickets = unsubscribeTickets;
    };
    
    // Fetch incoming assignments waiting for acceptance/rejection
    const fetchPendingTickets = () => {
      // Clear any existing subscription
      if (unsubscribeRefs.current.pendingTickets) {
        unsubscribeRefs.current.pendingTickets();
      }
      
      // Only fetch pending tickets if we're showing "all" or specifically "pending_acceptance"
      if (statusFilter !== 'all' && statusFilter !== 'pending_acceptance') {
        return;
      }
      
      const pendingTicketsRef = collection(db, 'tickets');
      const pendingTicketsQuery = query(
        pendingTicketsRef,
        where('contractorId', '==', contractorId),
        where('status', '==', 'pending_acceptance'),
        limit(ITEMS_PER_PAGE)
      );
      
      const unsubscribePending = onSnapshot(pendingTicketsQuery, (snapshot) => {
        if (!snapshot.empty) {
          const pendingTicketsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            isPending: true,
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          }));
          
          // Combine with active tickets
          setTickets(currentTickets => {
            const activeTickets = currentTickets.filter(ticket => !ticket.isPending);
            return [...pendingTicketsData, ...activeTickets];
          });
        }
      }, (err) => {
        console.error('Error fetching pending tickets:', err);
      });
      
      // Store unsubscribe function
      unsubscribeRefs.current.pendingTickets = unsubscribePending;
    };
    
    // Fetch affiliated landlords
    const fetchAffiliatedLandlords = async () => {
      try {
        // Query landlord profiles where contractors array contains this contractor's ID
        const landlordProfilesRef = collection(db, 'landlordProfiles');
        const landlordQuery = query(
          landlordProfilesRef, 
          where('contractors', 'array-contains', contractorId),
          limit(20) // Limit to 20 landlords max
        );
        
        const landlordSnapshot = await getDocs(landlordQuery);
        const landlordData = landlordSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setAffiliatedLandlords(landlordData);
      } catch (err) {
        console.error('Error fetching affiliated landlords:', err);
      }
    };
    
    fetchTickets();
    fetchPendingTickets();
    fetchAffiliatedLandlords();
    
    // Cleanup function to unsubscribe from all listeners when component unmounts
    return () => {
      Object.values(unsubscribeRefs.current).forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
    };
  }, [statusFilter]); // Re-run when statusFilter changes

  // Calculate contractor stats
  useEffect(() => {
    const newJobs = tickets.filter(ticket => ticket.status === 'pending_acceptance').length;
    const activeJobs = tickets.filter(ticket => ['assigned', 'accepted', 'in_progress', 'dispatched'].includes(ticket.status)).length;
    
    // Calculate completed jobs this month
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const completedThisMonth = tickets.filter(ticket => {
      if (ticket.status === 'completed' && ticket.updatedAt) {
        const ticketDate = ticket.updatedAt;
        return ticketDate.getMonth() === currentMonth && ticketDate.getFullYear() === currentYear;
      }
      return false;
    }).length;

    setContractorStats({
      newJobs,
      activeJobs,
      completedThisMonth,
      avgCompletionTime: null // Could calculate this from completed tickets
    });
  }, [tickets]);

  // Function to load more tickets
  const loadMoreTickets = async () => {
    if (!lastVisible || loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    
    try {
      const contractorId = currentUser.uid;
      const ticketsRef = collection(db, 'tickets');
      
      // Build query based on status filter
      let nextQuery;
      if (statusFilter === 'all') {
        nextQuery = query(
          ticketsRef,
          where('contractorId', '==', contractorId),
          where('status', 'in', ['assigned', 'accepted', 'in_progress', 'dispatched']),
          orderBy('updatedAt', 'desc'),
          startAfter(lastVisible),
          limit(ITEMS_PER_PAGE)
        );
      } else {
        nextQuery = query(
          ticketsRef,
          where('contractorId', '==', contractorId),
          where('status', '==', statusFilter),
          orderBy('updatedAt', 'desc'),
          startAfter(lastVisible),
          limit(ITEMS_PER_PAGE)
        );
      }
      
      const snapshot = await getDocs(nextQuery);
      
      if (!snapshot.empty) {
        const newTickets = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date()
        }));
        
        setTickets(currentTickets => {
          // Filter out pending tickets first
          const activeTickets = currentTickets.filter(ticket => !ticket.isPending);
          // Filter out pending tickets from new tickets too (just in case)
          const newActiveTickets = newTickets.filter(ticket => !ticket.isPending);
          // Combine both active ticket sets
          return [
            ...currentTickets.filter(ticket => ticket.isPending),
            ...activeTickets,
            ...newActiveTickets
          ];
        });
        
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        setHasMore(snapshot.docs.length >= ITEMS_PER_PAGE);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error loading more tickets:', err);
      setError('Failed to load more tickets');
    } finally {
      setLoadingMore(false);
    }
  };

  // Validate progress update input
  const validateProgressUpdate = () => {
    const errors = {};
    
    if (!progressUpdate.trim()) {
      errors.progressUpdate = 'Please enter a progress update';
    } else if (progressUpdate.length > MAX_PROGRESS_UPDATE_LENGTH) {
      errors.progressUpdate = `Update must be less than ${MAX_PROGRESS_UPDATE_LENGTH} characters`;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Sanitize text input
  const sanitizeText = (text) => {
    return text
      .replace(/<(|\/|[^>\/bi]|\/[^>bi]|[^\/>][^>]+|\/[^>][^>]+)>/g, '')
      .trim();
  };

  const handleAcceptTicket = async (ticketId) => {
    setDecisionLoading({ accept: true, reject: false });
    
    try {
      await callFunction('handleContractorAcceptance', {
        ticketId
      });
    } catch (err) {
      console.error('Error accepting ticket:', err);
      setError('Failed to accept ticket');
    } finally {
      setDecisionLoading({ accept: false, reject: false });
    }
  };

  const handleRejectTicket = async (ticketId) => {
    setDecisionLoading({ accept: false, reject: true });
    
    try {
      await callFunction('handleContractorRejection', {
        ticketId
      });
    } catch (err) {
      console.error('Error rejecting ticket:', err);
      setError('Failed to reject ticket');
    } finally {
      setDecisionLoading({ accept: false, reject: false });
    }
  };

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    const errors = {};
    const validFiles = [];
    const validPhotoURLs = [];
    
    files.forEach(file => {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        errors.fileSize = `File "${file.name}" exceeds the maximum size of 5MB`;
        return;
      }
      
      // Validate file type
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        errors.fileType = `File "${file.name}" is not a supported image type (JPG/PNG only)`;
        return;
      }
      
      validFiles.push(file);
      validPhotoURLs.push(URL.createObjectURL(file));
    });
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors({...validationErrors, ...errors});
    } else {
      setProgressPhotos([...progressPhotos, ...validFiles]);
      setProgressPhotoURLs([...progressPhotoURLs, ...validPhotoURLs]);
      
      // Clear file-related validation errors
      if (validationErrors.fileSize || validationErrors.fileType) {
        const newErrors = {...validationErrors};
        delete newErrors.fileSize;
        delete newErrors.fileType;
        setValidationErrors(newErrors);
      }
    }
  };

  const removePhoto = (index) => {
    const newPhotos = [...progressPhotos];
    const newPhotoURLs = [...progressPhotoURLs];
    
    newPhotos.splice(index, 1);
    newPhotoURLs.splice(index, 1);
    
    setProgressPhotos(newPhotos);
    setProgressPhotoURLs(newPhotoURLs);
  };

  const handleSubmitProgress = async (e) => {
    e.preventDefault();
    
    if (!selectedTicket) return;
    
    // Validate form
    if (!validateProgressUpdate()) {
      return;
    }
    
    setSubmittingUpdate(true);
    setError(null);
    
    try {
      const photoUrls = [];
      
      // Upload photos if any
      if (progressPhotos.length > 0) {
        setUploadingPhotos(true);
        
        for (const photo of progressPhotos) {
          const storageRef = ref(storage, `tickets/${selectedTicket.id}/progress_${Date.now()}_${photo.name}`);
          await uploadBytes(storageRef, photo);
          const url = await getDownloadURL(storageRef);
          photoUrls.push(url);
        }
        
        setUploadingPhotos(false);
      }
      
      // Sanitize text
      const sanitizedUpdate = sanitizeText(progressUpdate);
      
      // Update ticket document
      const ticketRef = doc(db, 'tickets', selectedTicket.id);
      
      const updateData = {
        progressUpdates: arrayUnion({
          timestamp: new Date().toISOString(),
          message: sanitizedUpdate,
          progressPercent: progressPercent,
          photos: photoUrls,
          contractorId: auth.currentUser.uid
        }),
        updatedAt: new Date()
      };
      
      // Update overall status if progress is 100%
      if (progressPercent === 100) {
        updateData.status = 'completed';
        updateData.completedAt = new Date();
      } else if (selectedTicket.status === 'accepted' || selectedTicket.status === 'assigned') {
        updateData.status = 'in_progress';
      }
      
      await updateDoc(ticketRef, updateData);
      
      // Create notification for tenant and landlord
      await callFunction('sendNotification', {
        ticketId: selectedTicket.id,
        title: progressPercent === 100 ? 'Job Completed' : 'Job Progress Update',
        message: sanitizedUpdate,
        notifyRoles: ['tenant', 'landlord']
      });
      
      // Reset form
      setProgressUpdate('');
      setProgressPhotos([]);
      setProgressPhotoURLs([]);
      setProgressPercent(0);
      
    } catch (err) {
      console.error('Error submitting progress update:', err);
      setError('Failed to submit progress update');
    } finally {
      setSubmittingUpdate(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary dark:border-primary-light"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-content dark:text-content-dark mb-6">Contractor Dashboard</h1>
      
      {affiliatedLandlords.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-medium text-content dark:text-content-dark mb-3">Your Network</h2>
          <div className="bg-background dark:bg-background-darkSubtle rounded-lg shadow overflow-hidden border border-border dark:border-border-dark">
            <div className="overflow-x-auto">
              <ul className="divide-y divide-border dark:divide-border-dark">
                {affiliatedLandlords.map(landlord => (
                  <li key={landlord.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-content dark:text-content-dark">{landlord.displayName}</p>
                      <p className="text-sm text-content-secondary dark:text-content-darkSecondary">{landlord.email}</p>
                    </div>
                    <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium bg-info-subtle text-info dark:bg-info-darkSubtle dark:text-blue-300 mt-2 sm:mt-0">
                      Connected
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="bg-danger-subtle dark:bg-danger-darkSubtle border-l-4 border-danger p-4 mb-6 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-danger dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 gap-2">
          <h2 className="text-lg font-medium text-content dark:text-content-dark">Job Assignments</h2>
          
          <div className="w-full md:w-auto">
            <label htmlFor="status-filter" className="block text-sm font-medium text-content-secondary dark:text-content-darkSecondary mb-1">
              Filter by Status:
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full md:w-auto rounded-md border-border dark:border-border-dark shadow-sm focus:border-primary focus:ring-primary sm:text-sm bg-background dark:bg-background-dark text-content dark:text-content-dark"
            >
              <option value="all">All Jobs</option>
              <option value="pending_acceptance">Pending Acceptance</option>
              <option value="accepted">Accepted</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
        
        {tickets.length === 0 ? (
          <div className="bg-background dark:bg-background-darkSubtle rounded-lg shadow border border-border dark:border-border-dark p-6 text-center">
            <p className="text-content-secondary dark:text-content-darkSecondary">No active job assignments.</p>
            <p className="text-sm text-content-subtle dark:text-content-darkSubtle mt-2">
              You'll see jobs here when landlords assign maintenance requests to you.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-background dark:bg-background-darkSubtle rounded-lg shadow overflow-hidden border border-border dark:border-border-dark">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border dark:divide-border-dark">
                    <thead className="bg-neutral-50 dark:bg-neutral-800">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-content-secondary dark:text-content-darkSecondary uppercase tracking-wider">
                          Property
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-content-secondary dark:text-content-darkSecondary uppercase tracking-wider">
                          Issue
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-content-secondary dark:text-content-darkSecondary uppercase tracking-wider">
                          Urgency
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-content-secondary dark:text-content-darkSecondary uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-content-secondary dark:text-content-darkSecondary uppercase tracking-wider">
                          Date
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-background dark:bg-background-darkSubtle divide-y divide-border dark:divide-border-dark">
                      {tickets.map((ticket) => (
                        <tr 
                          key={ticket.id} 
                          className={selectedTicket?.id === ticket.id ? 'bg-primary/5 dark:bg-primary/10' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-content dark:text-content-dark">{ticket.propertyName || 'Unknown'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="text-sm font-medium text-content dark:text-content-dark capitalize">
                                {ticket.issueType?.replace('_', ' ') || 'Unknown'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusPill status={ticket.urgencyLevel || 'normal'} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusPill status={ticket.status || 'unknown'} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-content-secondary dark:text-content-darkSecondary">
                            {ticket.updatedAt.toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {ticket.status === 'pending_acceptance' ? (
                              <div className="flex space-x-2 justify-end">
                                <Button
                                  variant="success" size="xs"
                                  onClick={() => handleAcceptTicket(ticket.id)}
                                  disabled={decisionLoading.accept || decisionLoading.reject}
                                  className="!px-2 !py-1"
                                >
                                  {decisionLoading.accept ? 'Accepting...' : 'Accept'}
                                </Button>
                                <Button
                                  variant="danger" size="xs"
                                  onClick={() => handleRejectTicket(ticket.id)}
                                  disabled={decisionLoading.accept || decisionLoading.reject}
                                  className="!px-2 !py-1"
                                >
                                  {decisionLoading.reject ? 'Rejecting...' : 'Reject'}
                                </Button>
                              </div>
                            ) : (
                              <Button 
                                variant="ghost" 
                                size="xs"
                                onClick={() => setSelectedTicket(ticket)}
                                className="text-primary dark:text-primary-light"
                              >
                                Manage
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {hasMore && (
                  <div className="px-6 py-4 border-t border-border dark:border-border-dark">
                    <Button 
                      variant="outline"
                      onClick={loadMoreTickets}
                      disabled={loadingMore}
                      size="sm"
                    >
                      {loadingMore ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Loading...
                        </>
                      ) : 'Load More'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              {selectedTicket ? (
                <div className="bg-background dark:bg-background-darkSubtle rounded-lg shadow p-6 border border-border dark:border-border-dark">
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-content dark:text-content-dark">Job Details</h3>
                    <p className="text-sm text-content-secondary dark:text-content-darkSecondary">#{selectedTicket.id.substring(0, 8)}</p>
                  </div>
                  
                  <div className="space-y-4 mb-6">
                    <div>
                      <h4 className="text-sm font-medium text-content-secondary dark:text-content-darkSecondary">Property</h4>
                      <p className="mt-1 text-content dark:text-content-dark">{selectedTicket.propertyName}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-content-secondary dark:text-content-darkSecondary">Issue Type</h4>
                      <p className="mt-1 text-content dark:text-content-dark capitalize">{selectedTicket.issueType?.replace('_', ' ')}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-content-secondary dark:text-content-darkSecondary">Description</h4>
                      <p className="mt-1 text-content dark:text-content-dark">{selectedTicket.description}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-content-secondary dark:text-content-darkSecondary">Status</h4>
                      <div className="mt-1">
                        <StatusPill status={selectedTicket.status || 'unknown'} />
                      </div>
                    </div>
                    
                    {selectedTicket.photos?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-content-secondary dark:text-content-darkSecondary">Photos</h4>
                        <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {selectedTicket.photos.map((photo, idx) => (
                            <a 
                              key={idx} 
                              href={photo} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="block group relative"
                            >
                              <img 
                                src={photo} 
                                alt={`Ticket photo ${idx+1}`} 
                                className="h-24 w-full object-cover rounded-md border border-border dark:border-border-dark"
                              />
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md">
                                <p className="text-white text-xs font-medium">View</p>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {(selectedTicket.status === 'accepted' || selectedTicket.status === 'in_progress') && (
                    <div className="border-t border-border dark:border-border-dark pt-4">
                      <h4 className="text-sm font-medium text-content dark:text-content-dark mb-3">Update Progress</h4>
                      
                      <form onSubmit={handleSubmitProgress}>
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="progress-update" className="block text-sm font-medium text-content-secondary dark:text-content-darkSecondary">
                              Progress Update <span className="text-danger dark:text-red-400">*</span>
                            </label>
                            <textarea
                              id="progress-update"
                              value={progressUpdate}
                              onChange={(e) => {
                                setProgressUpdate(e.target.value);
                                if (validationErrors.progressUpdate && e.target.value.trim()) {
                                  const newErrors = {...validationErrors};
                                  delete newErrors.progressUpdate;
                                  setValidationErrors(newErrors);
                                }
                              }}
                              rows={3}
                              maxLength={MAX_PROGRESS_UPDATE_LENGTH}
                              className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm bg-background dark:bg-background-dark text-content dark:text-content-dark placeholder-neutral-400 dark:placeholder-neutral-500 ${ validationErrors.progressUpdate ? 'border-danger focus:border-danger focus:ring-danger' : 'border-border dark:border-border-dark focus:border-primary focus:ring-primary' }`}
                              placeholder="Describe the work done or in progress..."
                              required
                              disabled={submittingUpdate || uploadingPhotos}
                            ></textarea>
                            <div className="mt-1 flex justify-between">
                              <p className={`text-xs ${progressUpdate.length > MAX_PROGRESS_UPDATE_LENGTH * 0.8 ? 'text-warning dark:text-amber-400' : 'text-content-subtle dark:text-content-darkSubtle'}`}>
                                {progressUpdate.length}/{MAX_PROGRESS_UPDATE_LENGTH} characters
                              </p>
                              {validationErrors.progressUpdate && (
                                <p className="text-sm text-danger dark:text-red-400">{validationErrors.progressUpdate}</p>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <label htmlFor="progress-percent" className="block text-sm font-medium text-content-secondary dark:text-content-darkSecondary">
                              Progress Percentage: {progressPercent}%
                            </label>
                            <input
                              type="range"
                              id="progress-percent"
                              min="0"
                              max="100"
                              step="5"
                              value={progressPercent}
                              onChange={(e) => setProgressPercent(parseInt(e.target.value))}
                              className="mt-1 block w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer range-lg accent-primary dark:accent-primary-light"
                              disabled={submittingUpdate || uploadingPhotos}
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-content-secondary dark:text-content-darkSecondary">
                              Add Photos (optional)
                            </label>
                            <div className="mt-1 flex justify-center px-6 py-4 border-2 border-border dark:border-border-dark border-dashed rounded-md bg-background dark:bg-background-darkSubtle hover:border-primary dark:hover:border-primary-light transition-colors">
                              <div className="space-y-1 text-center">
                                <PhotoIcon className="mx-auto h-8 w-8 text-content-subtle dark:text-content-darkSubtle" aria-hidden="true" />
                                <div className="flex text-sm text-content-subtle dark:text-content-darkSubtle">
                                  <label
                                    htmlFor="progress-photos"
                                    className="relative cursor-pointer bg-background dark:bg-background-darkSubtle rounded-md font-medium text-primary dark:text-primary-light hover:text-primary-dark dark:hover:text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 dark:focus-within:ring-offset-background-darkSubtle focus-within:ring-primary"
                                  >
                                    <span>Upload photos</span>
                                    <input 
                                      id="progress-photos"
                                      name="progress-photos"
                                      type="file"
                                      className="sr-only"
                                      accept="image/jpeg,image/jpg,image/png"
                                      multiple
                                      onChange={handlePhotoChange}
                                      disabled={submittingUpdate || uploadingPhotos}
                                    />
                                  </label>
                                </div>
                                <p className="text-xs text-content-subtle dark:text-content-darkSubtle">JPG, PNG only, up to 5MB each</p>
                              </div>
                            </div>
                            {validationErrors.fileSize && (
                              <div className="mt-2 text-sm text-danger dark:text-red-400">
                                {validationErrors.fileSize}
                              </div>
                            )}
                            {validationErrors.fileType && (
                              <div className="mt-2 text-sm text-danger dark:text-red-400">
                                {validationErrors.fileType}
                              </div>
                            )}
                            {progressPhotoURLs.length > 0 && (
                              <div className="mt-4 grid grid-cols-3 gap-2">
                                {progressPhotoURLs.map((url, idx) => (
                                  <div key={idx} className="relative group">
                                    <img src={url} alt={`Upload ${idx + 1}`} className="h-20 w-full object-cover rounded-md border border-border dark:border-border-dark" />
                                    <Button
                                      type="button"
                                      variant="danger"
                                      size="xs"
                                      onClick={() => removePhoto(idx)}
                                      disabled={submittingUpdate || uploadingPhotos}
                                      className="absolute -top-2 -right-2 !p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                      icon={<XMarkIcon className="h-3 w-3"/>}
                                      aria-label="Remove photo"
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          {uploadingPhotos && (
                            <div className="w-full">
                              <div className="text-xs font-semibold inline-block text-primary dark:text-primary-light mb-1">
                                Uploading photos...
                              </div>
                              <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2.5">
                                <div className="bg-primary dark:bg-primary-light h-2.5 rounded-full animate-pulse"></div>
                              </div>
                            </div>
                          )}
                          
                          <div>
                            <Button
                              type="submit"
                              variant="primary"
                              disabled={submittingUpdate || uploadingPhotos}
                              fullWidth
                            >
                              {(submittingUpdate || uploadingPhotos) && (
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              )}
                              {uploadingPhotos ? 'Uploading Photos...' : 
                               submittingUpdate ? 'Updating...' : 
                               progressPercent === 100 ? 'Mark as Complete' : 'Update Progress'}
                            </Button>
                          </div>
                        </div>
                      </form>
                    </div>
                  )}
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedTicket(null)}
                    className="mt-6 w-full"
                  >
                    Close Details
                  </Button>
                </div>
              ) : (
                <div className="bg-background dark:bg-background-darkSubtle rounded-lg shadow p-6 border border-border dark:border-border-dark text-center">
                  <p className="text-content-secondary dark:text-content-darkSecondary">Select a job assignment from the list to view details and update progress.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-medium text-content dark:text-content-dark">Settings & Preferences</h2>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md bg-background dark:bg-background-darkSubtle hover:bg-background dark:hover:bg-background-darkSubtle focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-primary-light"
          >
            {showSettings ? 'Hide Settings' : 'Show Settings'}
          </button>
        </div>
        
        {showSettings && (
          <div className="bg-background dark:bg-background-darkSubtle rounded-lg shadow">
            <NotificationPreferences />
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractorDashboard; 