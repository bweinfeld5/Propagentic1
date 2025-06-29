import React, { useState, useMemo } from 'react';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon,
  PhotoIcon,
  CalendarDaysIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronDownIcon,
  ChatBubbleLeftRightIcon,
  WrenchScrewdriverIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { format, formatDistanceToNow, isToday, isYesterday, isThisWeek } from 'date-fns';
import { 
  doc, 
  deleteDoc, 
  getDoc, 
  updateDoc, 
  arrayRemove 
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext.jsx';
import toast from 'react-hot-toast';

interface Ticket {
  id: string;
  issueTitle: string;
  description: string;
  status: string;
  urgency?: string;
  category?: string;
  location?: string;
  photoUrls?: string[];
  photoUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
  submittedBy: string;
  propertyName?: string;
  unitNumber?: string;
  tenantName?: string;
  submissionMethod?: string;
  photosCount?: number;
  bestTimeToContact?: string;
  accessInstructions?: string;
  [key: string]: any;
}

interface EnhancedRequestHistoryProps {
  tickets: Ticket[];
  loading: boolean;
  filter?: string;
}

const STATUS_CONFIG = {
  pending_classification: {
    label: 'Under Review',
    color: 'bg-blue-100 text-blue-800',
    icon: <ClockIcon className="w-4 h-4" />,
    description: 'Your request is being reviewed'
  },
  open: {
    label: 'Open',
    color: 'bg-yellow-100 text-yellow-800',
    icon: <ExclamationCircleIcon className="w-4 h-4" />,
    description: 'Assigned and pending work'
  },
  in_progress: {
    label: 'In Progress',
    color: 'bg-purple-100 text-purple-800',
    icon: <WrenchScrewdriverIcon className="w-4 h-4" />,
    description: 'Work is currently being performed'
  },
  resolved: {
    label: 'Resolved',
    color: 'bg-green-100 text-green-800',
    icon: <CheckCircleIcon className="w-4 h-4" />,
    description: 'Issue has been fixed'
  },
  closed: {
    label: 'Closed',
    color: 'bg-gray-100 text-gray-800',
    icon: <CheckCircleIcon className="w-4 h-4" />,
    description: 'Request is complete'
  }
};

const URGENCY_CONFIG = {
  low: { label: 'Low', color: 'bg-green-100 text-green-700' },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
  high: { label: 'High', color: 'bg-red-100 text-red-700' }
};

const CATEGORY_ICONS = {
  plumbing: '🔧',
  electrical: '⚡',
  hvac: '🌡️',
  appliances: '🏠',
  structural: '🏗️',
  security: '🔒',
  pest: '🐛',
  cleaning: '🧹',
  other: '📝'
};

const EnhancedRequestHistory: React.FC<EnhancedRequestHistoryProps> = ({
  tickets,
  loading,
  filter
}) => {
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [deletingTickets, setDeletingTickets] = useState<Set<string>>(new Set());
  const [localTickets, setLocalTickets] = useState<Ticket[]>(tickets);

  // Sync local tickets with prop tickets
  React.useEffect(() => {
    setLocalTickets(tickets);
  }, [tickets]);

  // Delete maintenance request function
  const deleteMaintenanceRequest = async (ticket: Ticket) => {
    if (!currentUser) {
      toast.error('You must be logged in to delete requests');
      return;
    }

    const ticketId = ticket.id;
    
    try {
      // Track deleting state
      setDeletingTickets(prev => new Set(prev).add(ticketId));
      
      // Optimistic UI update - remove from local state immediately
      console.log('🗑️ [Delete] Starting optimistic UI update for ticket:', ticketId);
      setLocalTickets(prev => {
        const filtered = prev.filter(t => t.id !== ticketId);
        console.log('🗑️ [Delete] Removed ticket from local state. Remaining tickets:', filtered.length);
        return filtered;
      });
      
      console.log('🗑️ [Delete] Starting deletion for ticket:', ticketId);

      // Only delete from maintenanceRequests collection if it's from that source
      if ((ticket as any).source === 'maintenanceRequests') {
        console.log('🗑️ [Delete] Deleting from maintenanceRequests collection...');
        
        // 1. Delete the maintenance request document
        const requestRef = doc(db, 'maintenanceRequests', ticketId);
        await deleteDoc(requestRef);
        console.log('✅ [Delete] Deleted from maintenanceRequests collection:', ticketId);

        // 2. Remove from all associated properties
        await removeFromProperties(ticketId);
      } else {
        // Delete from tickets collection
        console.log('🗑️ [Delete] Deleting from tickets collection...');
        const ticketRef = doc(db, 'tickets', ticketId);
        await deleteDoc(ticketRef);
        console.log('✅ [Delete] Deleted from tickets collection:', ticketId);
      }
      
      console.log('✅ [Delete] Successfully completed deletion for ticket:', ticketId);
      toast.success('Maintenance request deleted successfully');
      
    } catch (error) {
      console.error('❌ [Delete] Error deleting maintenance request:', error);
      
      // Restore the ticket to local state on error
      console.log('🔄 [Delete] Restoring ticket to local state due to error');
      setLocalTickets(prev => [...prev, ticket].sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      }));
      
      toast.error('Failed to delete maintenance request. Please try again.');
    } finally {
      setDeletingTickets(prev => {
        const newSet = new Set(prev);
        newSet.delete(ticketId);
        return newSet;
      });
    }
  };

  // Helper function to remove request ID from properties
  const removeFromProperties = async (requestId: string) => {
    try {
      console.log('🗑️ [Delete] Removing request from tenant properties...');
      
      // Get tenant profile to find their properties
      const tenantProfileRef = doc(db, 'tenantProfiles', currentUser!.uid);
      const tenantProfileSnap = await getDoc(tenantProfileRef);
      
      let propertyIds: string[] = [];
      
      if (tenantProfileSnap.exists()) {
        const tenantProfile = tenantProfileSnap.data();
        propertyIds = tenantProfile.properties || [];
        console.log('🗑️ [Delete] Found', propertyIds.length, 'properties in tenant profile');
      } else {
        // Fallback to legacy user profile
        const userRef = doc(db, 'users', currentUser!.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists() && userSnap.data().propertyId) {
          propertyIds = [userSnap.data().propertyId];
          console.log('🗑️ [Delete] Found legacy property ID:', propertyIds[0]);
        }
      }
      
      // Remove request ID from each property's maintenanceRequests array
      for (const propertyId of propertyIds) {
        try {
          const propertyRef = doc(db, 'properties', propertyId);
          await updateDoc(propertyRef, {
            maintenanceRequests: arrayRemove(requestId)
          });
          console.log('✅ [Delete] Removed request from property:', propertyId);
        } catch (error) {
          console.warn('⚠️ [Delete] Failed to remove request from property:', propertyId, error);
          // Continue with other properties even if one fails
        }
      }
      
    } catch (error) {
      console.error('❌ [Delete] Error removing request from properties:', error);
      throw error; // Re-throw to trigger the error handling in the main function
    }
  };

  // Filter and sort tickets
  const filteredAndSortedTickets = useMemo(() => {
    let filtered = localTickets;

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(ticket => 
        ticket.issueTitle.toLowerCase().includes(term) ||
        ticket.description.toLowerCase().includes(term) ||
        ticket.category?.toLowerCase().includes(term) ||
        ticket.location?.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }

    // Apply urgency filter
    if (urgencyFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.urgency === urgencyFilter);
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.category === categoryFilter);
    }

    // Apply legacy filter prop
    if (filter && filter !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === filter);
    }

    // Sort tickets
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          if (!a.createdAt && !b.createdAt) return 0;
          if (!a.createdAt) return 1;
          if (!b.createdAt) return -1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          if (!a.createdAt && !b.createdAt) return 0;
          if (!a.createdAt) return 1;
          if (!b.createdAt) return -1;
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'urgency':
          const urgencyOrder = { high: 3, medium: 2, low: 1 };
          return (urgencyOrder[b.urgency as keyof typeof urgencyOrder] || 0) - 
                 (urgencyOrder[a.urgency as keyof typeof urgencyOrder] || 0);
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    return sorted;
  }, [localTickets, searchTerm, statusFilter, urgencyFilter, categoryFilter, filter, sortBy]);

  // Get unique categories from local tickets
  const availableCategories = useMemo(() => {
    const categories = Array.from(new Set(
      localTickets
        .map(t => t.category)
        .filter((category): category is string => Boolean(category))
    ));
    return categories.sort();
  }, [localTickets]);

  // Format date for display
  const formatDate = (date: Date) => {
    if (isToday(date)) {
      return `Today at ${format(date, 'h:mm a')}`;
    } else if (isYesterday(date)) {
      return `Yesterday at ${format(date, 'h:mm a')}`;
    } else if (isThisWeek(date)) {
      return format(date, 'EEEE \'at\' h:mm a');
    } else {
      return format(date, 'MMM d, yyyy \'at\' h:mm a');
    }
  };

  // Get time ago for relative display
  const getTimeAgo = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true });
  };

  // Toggle expanded ticket details
  const toggleExpanded = (ticketId: string) => {
    setExpandedTicket(expandedTicket === ticketId ? null : ticketId);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4">
        <h2 className="text-xl font-bold text-white flex items-center">
          <ChatBubbleLeftRightIcon className="w-6 h-6 mr-2" />
          Request History
        </h2>
        <p className="text-teal-100 text-sm mt-1">
          {filteredAndSortedTickets.length} of {localTickets.length} requests
        </p>
      </div>

      {/* Filters */}
      <div className="p-6 border-b border-gray-200">
        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="all">All Statuses</option>
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>

          {/* Urgency Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="all">All Urgencies</option>
              {Object.entries(URGENCY_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="all">All Categories</option>
              {availableCategories.map((category) => (
                <option key={category} value={category}>
                  {CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS]} {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="urgency">By Urgency</option>
              <option value="status">By Status</option>
            </select>
          </div>
        </div>
      </div>

      {/* Request List */}
      <div className="p-6">
        {filteredAndSortedTickets.length === 0 ? (
          <div className="text-center py-12">
            <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
            <p className="text-gray-500">
              {localTickets.length === 0 
                ? "You haven't submitted any maintenance requests yet."
                : "Try adjusting your filters to see more requests."
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedTickets.map((ticket) => {
              const statusConfig = STATUS_CONFIG[ticket.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending_classification;
              const urgencyConfig = URGENCY_CONFIG[ticket.urgency as keyof typeof URGENCY_CONFIG] || URGENCY_CONFIG.medium;
              const isExpanded = expandedTicket === ticket.id;
              const isDeleting = deletingTickets.has(ticket.id);

              return (
                <div key={ticket.id} className={`border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all duration-200 group relative ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}>
                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMaintenanceRequest(ticket);
                    }}
                    className={`absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-all duration-200 p-2 rounded-full text-white shadow-lg hover:shadow-xl ${
                      isDeleting 
                        ? 'bg-gray-500 cursor-not-allowed' 
                        : 'bg-red-500 hover:bg-red-600 transform hover:scale-105'
                    }`}
                    disabled={isDeleting}
                    title={isDeleting ? "Deleting..." : "Delete maintenance request"}
                  >
                    {isDeleting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <TrashIcon className="w-4 h-4" />
                    )}
                  </button>

                  {/* Main Content */}
                  <div
                    className="p-4 cursor-pointer pr-16"
                    onClick={() => !isDeleting && toggleExpanded(ticket.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        {/* Title and Category */}
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-lg">
                            {CATEGORY_ICONS[ticket.category as keyof typeof CATEGORY_ICONS] || '📝'}
                          </span>
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {ticket.issueTitle}
                          </h3>
                        </div>

                        {/* Status and Urgency */}
                        <div className="flex items-center space-x-3 mb-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                            {statusConfig.icon}
                            <span className="ml-1">{statusConfig.label}</span>
                          </span>
                          {ticket.urgency && (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${urgencyConfig.color}`}>
                              {urgencyConfig.label} Priority
                            </span>
                          )}
                          {ticket.photoUrls && ticket.photoUrls.length > 0 && (
                            <span className="inline-flex items-center text-xs text-gray-500">
                              <PhotoIcon className="w-4 h-4 mr-1" />
                              {ticket.photoUrls.length} photo{ticket.photoUrls.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>

                        {/* Location and Date */}
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          {ticket.location && (
                            <span>📍 {ticket.location}</span>
                          )}
                          {ticket.createdAt && (
                            <>
                              <span className="flex items-center">
                                <CalendarDaysIcon className="w-4 h-4 mr-1" />
                                {formatDate(ticket.createdAt)}
                              </span>
                              <span>({getTimeAgo(ticket.createdAt)})</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Expand Arrow - positioned to avoid delete button */}
                      <div className="mr-12">
                        <ChevronDownIcon 
                          className={`w-5 h-5 text-gray-400 transition-transform ${
                            isExpanded ? 'transform rotate-180' : ''
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 bg-gray-50 p-4">
                      <div className="space-y-4">
                        {/* Description */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {ticket.description}
                          </p>
                        </div>

                        {/* Additional Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {ticket.bestTimeToContact && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-1">Best Time to Contact</h4>
                              <p className="text-sm text-gray-700">{ticket.bestTimeToContact}</p>
                            </div>
                          )}
                          
                          {ticket.accessInstructions && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-1">Access Instructions</h4>
                              <p className="text-sm text-gray-700">{ticket.accessInstructions}</p>
                            </div>
                          )}
                        </div>

                        {/* Photos */}
                        {ticket.photoUrls && ticket.photoUrls.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Photos</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                              {ticket.photoUrls.map((url, index) => (
                                <div key={index} className="relative group">
                                  <img
                                    src={url}
                                    alt={`Photo ${index + 1}`}
                                    className="w-full h-24 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => window.open(url, '_blank')}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Metadata */}
                        <div className="pt-4 border-t border-gray-200">
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Request ID: {ticket.id}</span>
                            {ticket.updatedAt && (
                              <span>
                                Last updated: {formatDate(ticket.updatedAt)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedRequestHistory; 