import React, { useState, useEffect, useCallback } from 'react';
import {
  HomeIcon,
  BuildingOfficeIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
  DocumentTextIcon,
  ChartBarIcon,
  PlusIcon,
  BellIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  Square3Stack3DIcon,
  ClipboardDocumentListIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  CloudArrowUpIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext.jsx';
import { useDemoMode } from '../../context/DemoModeContext';
import dataService from '../../services/dataService';
import landlordProfileService from '../../services/firestore/landlordProfileService';
import { getPropertyById } from '../../services/firestore/propertyService';
import maintenanceService from '../../services/firestore/maintenanceService';
import contractorService from '../../services/firestore/contractorService';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { toast } from 'react-hot-toast';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import CommunicationCenter from '../../components/communication/CommunicationCenter';
import InviteTenantModal from '../../components/landlord/InviteTenantModal';
import AddPropertyModal from '../../components/landlord/AddPropertyModal';
import EditPropertyModal from '../../components/landlord/EditPropertyModal';
import AcceptedTenantsSection from '../../components/landlord/AcceptedTenantsSection.jsx';
import PreferredContractorsGrid from '../../components/landlord/PreferredContractorsGrid';
import AddContractorModal from '../../components/landlord/AddContractorModal';
import SMSTestPanel from '../../components/landlord/SMSTestPanel';
import UnitCard from '../../components/landlord/UnitCard';

// Phase 1.2 Components
import GlobalSearch from '../../components/search/GlobalSearch';
import BulkOperations from '../../components/bulk/BulkOperations';

// Debug components for data persistence investigation
import DataPersistenceDiagnostic from '../../components/debug/DataPersistenceDiagnostic';
import TestRunner from '../../components/debug/TestRunner';
import InvitationFlowTest from '../../components/debug/InvitationFlowTest';

// Define interfaces for type safety
interface Property {
  id: string;
  name?: string;
  nickname?: string;
  title?: string;
  address?: string | {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  zip?: string;
  propertyType?: string;
  status?: string;
  monthlyRent?: number;
  rentAmount?: number;
  monthlyRevenue?: number;
  isOccupied?: boolean;
  occupiedUnits?: number;
  units?: {
    [unitId: string]: {
      capacity: number;
      tenants: string[];
    };
  } | number; // Keep backward compatibility with old number format
  updatedAt?: Date;
  lastUpdated?: Date;
  type?: string;
  [key: string]: any; // For additional flexible properties
}

interface Tenant {
  id: string;
  name?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phoneNumber?: string;
  phone?: string;
  status?: string;
  propertyId?: string;
  propertyName?: string;
  propertyAddress?: string;
  leaseStart?: string;
  leaseEnd?: string;
  joinedDate?: Date | string;
  inviteMethod?: string;
  notes?: string;
  acceptedAt?: Date | string;
  inviteCode?: string;
  unitNumber?: string;
  [key: string]: any; // For additional flexible properties
}

interface Ticket {
  id: string;
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  category?: string;
  propertyId?: string;
  propertyName?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  submittedBy?: string;
  assignedTo?: string;
  [key: string]: any; // For additional flexible properties
}

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  view: string;
}

interface UserProfile {
  userType?: string;
  role?: string;
  firstName?: string;
  lastName?: string;
  [key: string]: any;
}

const LandlordDashboard: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const { isDemo: isDemoMode } = useDemoMode();
  const [showImport, setShowImport] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importProgress, setImportProgress] = useState<number | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [landlordStats, setLandlordStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [propertiesLoaded, setPropertiesLoaded] = useState<boolean>(false);
  
  // Add new state for maintenance requests with detailed information
  const [maintenanceRequests, setMaintenanceRequests] = useState<any[]>([]);
  const [isLoadingMaintenance, setIsLoadingMaintenance] = useState<boolean>(false);
  
  // Add new state for contractors and assignment tracking
  const [contractors, setContractors] = useState<any[]>([]);
  const [isAssigning, setIsAssigning] = useState<string | null>(null); // To track which request is being updated
  
  // Add state for tenant information caching
  const [tenantCache, setTenantCache] = useState<{[tenantId: string]: any}>({});
  const [enhancedTickets, setEnhancedTickets] = useState<any[]>([]);
  const [hoveredTicket, setHoveredTicket] = useState<string | null>(null);
  const [deletingTicket, setDeletingTicket] = useState<string | null>(null);
  
  // Phase 1.2 State
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [showGlobalSearch, setShowGlobalSearch] = useState<boolean>(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [dashboardMode, setDashboardMode] = useState<'default' | 'custom'>('default');

  // Add state for modals
  const [showInviteTenantModal, setShowInviteTenantModal] = useState<boolean>(false);
  const [showAddPropertyModal, setShowAddPropertyModal] = useState<boolean>(false);
  const [showEditPropertyModal, setShowEditPropertyModal] = useState<boolean>(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  
  // State for pre-filling invite modal
  const [prefilledInviteData, setPrefilledInviteData] = useState<{
    propertyId?: string;
    propertyName?: string;
    unitId?: string;
  }>({});
  
  // Contractor modal state
  const [showAddContractorModal, setShowAddContractorModal] = useState<boolean>(false);
  const [editingContractor, setEditingContractor] = useState<any>(null);

  // Efficient batch fetching of maintenance requests when properties change
  useEffect(() => {
    const fetchMaintenanceRequests = async () => {
      if (properties.length === 0) {
        setTickets([]);
        setMaintenanceRequests([]);
        return;
      }

      setIsLoadingMaintenance(true);

      // Step 1: Aggregate all maintenance request IDs from all properties
      const requestIds = properties.flatMap(p => (p as any).maintenanceRequests || []);
      
      if (requestIds.length === 0) {
        setTickets([]);
        setMaintenanceRequests([]);
        setIsLoadingMaintenance(false);
        return;
      }

      console.log(`Found ${requestIds.length} maintenance request IDs to fetch.`);

      try {
        // Step 2: Fetch all requests in a single, efficient batch
        const fetchedRequests = await maintenanceService.getMaintenanceRequestsByIds(requestIds);
        
        // Step 3: Map fetched data to the 'Ticket' interface and add property names
        const ticketsData = fetchedRequests.map((request: any) => {
          const property = properties.find(p => (p as any).maintenanceRequests?.includes(request.id));
          const propertyData = property as any;
          
          return {
            ...request,
            propertyName: propertyData ? (propertyData.name || propertyData.nickname || formatAddress(propertyData)) : 'Unknown Property',
            propertyAddress: propertyData ? (typeof propertyData.address === 'string' 
              ? propertyData.address 
              : `${propertyData.address?.street || ''} ${propertyData.address?.city || ''}`.trim() || 
                `${propertyData.street || ''} ${propertyData.city || ''}`.trim() || 
                'Address not available') : 'Address not available'
          };
        });

        console.log(`Successfully fetched ${ticketsData.length} maintenance tickets.`);
        
        // Sort by creation date (newest first)
        const sortedTickets = ticketsData.sort((a: any, b: any) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        
        setTickets(sortedTickets);
        setMaintenanceRequests(sortedTickets);

      } catch (error) {
        console.error("Error fetching maintenance requests in batch: ", error);
        setError("Failed to load maintenance requests. Please check permissions and network.");
        setTickets([]); // Clear tickets on error
        setMaintenanceRequests([]);
      } finally {
        setIsLoadingMaintenance(false);
      }
    };

    fetchMaintenanceRequests();
  }, [properties]); // This effect runs whenever the 'properties' state changes

  const loadDashboardData = async (): Promise<void> => {
    if (!currentUser) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Configure dataService
      dataService.configure({ 
        isDemoMode, 
        currentUser,
        userType: userProfile?.userType || 'landlord'
      });

      // Subscribe to properties with real-time updates
      const unsubscribeProperties = dataService.subscribeToProperties(
        (propertiesData: Property[]) => {
          console.log('Properties data received:', propertiesData.length);
          
          // Calculate additional fields for dashboard
          const enhancedProperties = propertiesData.map(property => ({
            ...property,
            monthlyRevenue: property.monthlyRent || property.rentAmount || 0,
            status: property.status || 'active',
            lastUpdated: property.updatedAt || new Date()
          }));
          
          setProperties(enhancedProperties);
          setIsLoading(false);
        },
        (error: Error) => {
          console.error('Error loading properties:', error);
          setError(error.message);
          setIsLoading(false);
        }
      );

      // Maintenance requests will be loaded via useEffect when properties change

      // Load landlord profile data and accepted tenants
      try {
        const [acceptedTenants, stats] = await Promise.all([
          landlordProfileService.getAcceptedTenantsWithDetails(currentUser.uid),
          landlordProfileService.getLandlordStatistics(currentUser.uid)
        ]);
        
        console.log('Loaded accepted tenants:', acceptedTenants.length);
        console.log('Loaded landlord stats:', stats);
        
        // Map the accepted tenants to match our Tenant interface
        const mappedTenants: Tenant[] = acceptedTenants.map((tenant: any) => ({
          id: tenant.tenantId || tenant.id,
          email: tenant.email,
          name: tenant.name,
          displayName: tenant.displayName,
          phoneNumber: tenant.phone,
          phone: tenant.phone,
          status: tenant.status || 'active',
          propertyId: tenant.propertyId,
          propertyName: tenant.propertyName,
          propertyAddress: tenant.propertyAddress,
          joinedDate: tenant.joinedDate || tenant.acceptedAt,
          inviteMethod: tenant.inviteMethod,
          notes: tenant.notes,
          acceptedAt: tenant.acceptedAt,
          inviteCode: tenant.inviteCode,
          unitNumber: tenant.unitNumber,
          ...tenant // Include any additional properties
        }));
        
        setTenants(mappedTenants);
        setLandlordStats(stats);
      } catch (profileError) {
        console.error('Error loading landlord profile data:', profileError);
        // Fallback to original tenant loading method
        if (properties.length > 0) {
          const allTenants: Tenant[] = [];
          for (const property of properties) {
            if (property.id) {
              const propertyTenants = await dataService.getTenantsForProperty(property.id);
              allTenants.push(...propertyTenants);
            }
          }
          setTenants(allTenants);
        }
      }
      
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      setError(error.message);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [currentUser, isDemoMode]);

  // Fetch contractors when component loads
  useEffect(() => {
    const loadContractors = async () => {
      if (currentUser) {
        console.log("STEP 1: Fetching landlord profile for landlord:", currentUser.uid);
        try {
          const landlordProfile = await landlordProfileService.getLandlordProfile(currentUser.uid);
          const contractorIds = landlordProfile?.contractors || [];
          
          console.log(`STEP 2: Found ${contractorIds.length} contractor IDs in profile.`);

          if (contractorIds.length > 0) {
            // Use the new service function to get full contractor profiles
            console.log("STEP 3: Fetching full profiles for contractor IDs...");
            const fetchedContractors = await contractorService.getContractorsByIds(contractorIds);
            setContractors(fetchedContractors);
          } else {
            // If there are no contractor IDs, ensure the state is an empty array.
            setContractors([]);
          }
        } catch (error) {
          console.error("Error loading contractors:", error);
          toast.error("Could not load your list of contractors.");
          setContractors([]); // Reset state on error
        }
      }
    };
    loadContractors();
  }, [currentUser]);

  // Enhance tickets with tenant information when tickets change
  useEffect(() => {
    const enhanceTicketsWithTenantInfo = async () => {
      if (tickets.length === 0) {
        setEnhancedTickets([]);
        return;
      }

      const enhanced = await Promise.all(
        tickets.map(async (ticket) => {
          let tenantInfo = { name: 'Unknown Tenant', email: '', phone: '' };
          
          if (ticket.tenantId) {
            tenantInfo = await fetchTenantInfo(ticket.tenantId);
          } else if (ticket.submittedBy) {
            tenantInfo = await fetchTenantInfo(ticket.submittedBy);
          }

          return {
            ...ticket,
            tenantInfo
          };
        })
      );

      setEnhancedTickets(enhanced);
    };

    enhanceTicketsWithTenantInfo();
  }, [tickets, tenantCache]);

  // Maintenance requests are now automatically loaded when properties change

  // Handle property edit
  const handleEditProperty = (property: Property): void => {
    setEditingProperty(property);
    setShowEditPropertyModal(true);
  };

  // Handle property delete with confirmation
  const handleDeleteProperty = async (property: Property): Promise<void> => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${getPropertyName(property)}"? This action cannot be undone.`
    );
    
    if (confirmDelete) {
      try {
        await dataService.deleteProperty(property.id);
        setProperties(prev => prev.filter(p => p.id !== property.id));
        // Remove from selected items if it was selected
        setSelectedItems(prev => prev.filter(id => id !== property.id));
      } catch (error) {
        console.error('Error deleting property:', error);
        alert('Failed to delete property. Please try again.');
      }
    }
  };

  // Handle property update after edit
  const handlePropertyUpdated = (updatedProperty: Property): void => {
    setProperties(prev => prev.map(p => p.id === updatedProperty.id ? updatedProperty : p));
    setShowEditPropertyModal(false);
    setEditingProperty(null);
  };

  // Contractor handlers
  const handleAddContractor = (): void => {
    setEditingContractor(null);
    setShowAddContractorModal(true);
  };

  const handleEditContractor = (contractor: any): void => {
    setEditingContractor(contractor);
    setShowAddContractorModal(true);
  };

  const handleRateContractor = (contractor: any): void => {
    // TODO: Implement rating modal
    console.log('Rate contractor:', contractor);
  };

  const handleRemoveContractor = async (contractorId: string): Promise<void> => {
    try {
      // TODO: Implement contractor removal logic
      console.log('Remove contractor:', contractorId);
      // For now, remove from local state
      setContractors(prev => prev.filter(c => c.id !== contractorId));
      toast.success('Contractor removed successfully');
    } catch (error) {
      console.error('Error removing contractor:', error);
      toast.error('Failed to remove contractor');
    }
  };

  const handleContractorSuccess = (): void => {
    // Refresh contractor data if needed
    setShowAddContractorModal(false);
    setEditingContractor(null);
  };

  const handleRefreshContractors = (): void => {
    // Refresh contractors by re-fetching them
    if (currentUser) {
      const fetchContractors = async () => {
        try {
          const landlordProfile = await landlordProfileService.getLandlordProfile(currentUser.uid);
          const contractorIds = landlordProfile?.contractors || [];

          if (contractorIds.length > 0) {
            const fetchedContractors = await contractorService.getContractorsByIds(contractorIds);
            setContractors(fetchedContractors);
          } else {
            setContractors([]);
          }
        } catch (error) {
          console.error("Error fetching contractors:", error);
          toast.error("Could not load your list of contractors.");
        }
      };
      fetchContractors();
    }
  };

  // Handle empty slot click to open invite modal with pre-filled data
  const handleEmptySlotClick = (propertyId: string, propertyName: string, unitId: string): void => {
    setPrefilledInviteData({
      propertyId,
      propertyName,
      unitId
    });
    setShowInviteTenantModal(true);
  };

  // Helper function to fetch tenant information
  const fetchTenantInfo = async (tenantId: string) => {
    if (tenantCache[tenantId]) {
      return tenantCache[tenantId];
    }

    try {
      // Try to get tenant profile first
      const tenantProfileDoc = await getDoc(doc(db, 'tenantProfiles', tenantId));
      let tenantInfo: any = {};

      if (tenantProfileDoc.exists()) {
        const tenantProfileData = tenantProfileDoc.data();
        tenantInfo = {
          name: tenantProfileData.fullName || tenantProfileData.name,
          email: tenantProfileData.email,
          phone: tenantProfileData.phoneNumber,
          ...tenantProfileData
        };
      }

      // Fallback to users collection if tenant profile doesn't have all info
      const userDoc = await getDoc(doc(db, 'users', tenantId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        tenantInfo = {
          ...tenantInfo,
          name: tenantInfo.name || userData.displayName || userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
          email: tenantInfo.email || userData.email,
          phone: tenantInfo.phone || userData.phoneNumber,
        };
      }

      // Fallback to email if no name found
      if (!tenantInfo.name && tenantInfo.email) {
        tenantInfo.name = tenantInfo.email.split('@')[0];
      }

      // Cache the result
      setTenantCache(prev => ({
        ...prev,
        [tenantId]: tenantInfo
      }));

      return tenantInfo;
    } catch (error) {
      console.error(`Error fetching tenant info for ${tenantId}:`, error);
      return { name: 'Unknown Tenant', email: '', id: tenantId };
    }
  };

  // Handle contractor assignment to maintenance request
  const handleAssignContractor = async (requestId: string, contractorId: string) => {
    if (!window.confirm("Are you sure you want to assign this contractor?")) {
      return;
    }

    setIsAssigning(requestId);
    const toastId = toast.loading('Assigning contractor...');

    try {
      const functions = getFunctions();
      const assignContractor = httpsCallable(functions, 'assignContractorToRequest');
      
      await assignContractor({ requestId, contractorId });

      toast.success('Contractor assigned successfully!', { id: toastId });

      // Refresh the dashboard data to show the change
      loadDashboardData();

    } catch (error: any) {
      console.error("Error assigning contractor:", error);
      toast.error(`Assignment failed: ${error.message}`, { id: toastId });
    } finally {
      setIsAssigning(null);
    }
  };

  // Handle deleting a maintenance request
  const handleDeleteMaintenanceRequest = async (requestId: string, requestTitle: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the maintenance request "${requestTitle}"?\n\nThis action cannot be undone.`
    );
    
    if (!confirmed) return;

    setDeletingTicket(requestId);
    const toastId = toast.loading('Deleting maintenance request...');

    try {
      // Delete from Firestore
      await maintenanceService.deleteMaintenanceRequest(requestId);
      
      // Update local state
      setTickets(prev => prev.filter(ticket => ticket.id !== requestId));
      setEnhancedTickets(prev => prev.filter(ticket => ticket.id !== requestId));
      
      toast.success('Maintenance request deleted successfully!', { id: toastId });
    } catch (error: any) {
      console.error("Error deleting maintenance request:", error);
      toast.error(`Failed to delete request: ${error.message}`, { id: toastId });
    } finally {
      setDeletingTicket(null);
    }
  };

  // Handle bulk operations
  const handleBulkAction = (action: string, items: any[], values?: any): void => {
    console.log('Bulk action:', action, 'Items:', items, 'Values:', values);
    
    switch (action) {
      case 'export':
        // Export functionality - temporarily disabled
        console.log('Export functionality temporarily disabled - missing CSV library');
        break;
        
      case 'bulk_edit':
        // Update items with new values
        if (items[0]?.type === 'property') {
          setProperties(prev => prev.map(prop => {
            if (items.find(item => item.id === prop.id)) {
              return {
                ...prop,
                ...(values?.status && { status: values.status }),
                ...(values?.manager && { manager: values.manager })
              };
            }
            return prop;
          }));
        }
        break;
        
      case 'delete':
        // Remove items
        if (items[0]?.type === 'property') {
          const itemIds = items.map(item => item.id);
          setProperties(prev => prev.filter(prop => !itemIds.includes(prop.id)));
        }
        setSelectedItems([]);
        break;
        
      default:
        console.log('Unhandled bulk action:', action);
    }
  };

  // Navigation items with Phase 1.2 additions
  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: HomeIcon,
      view: 'dashboard'
    },
    {
      id: 'reports',
      label: 'Reports & Analytics',
      icon: ChartBarIcon,
      view: 'reports'
    },
    {
      id: 'properties',
      label: 'Properties',
      icon: BuildingOfficeIcon,
      view: 'properties'
    },
    {
      id: 'tenants',
      label: 'Tenants',
      icon: UsersIcon,
      view: 'tenants'
    },
    {
      id: 'contractors',
      label: 'Contractors',
      icon: UserIcon,
      view: 'contractors'
    },
    {
      id: 'maintenance',
      label: 'Maintenance',
      icon: WrenchScrewdriverIcon,
      view: 'maintenance'
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: DocumentTextIcon,
      view: 'documents'
    },
    {
      id: 'communications',
      label: 'Communications',
      icon: ChatBubbleLeftRightIcon,
      view: 'communications'
    },
    {
      id: 'import',
      label: 'Import Properties',
      icon: CloudArrowUpIcon,
      view: 'import'
    }
  ];

  // Add this helper function inside the LandlordDashboard component
  const getOccupancyDetails = (property: Property) => {
    if (!property.units || typeof property.units !== 'object' || Object.keys(property.units).length === 0) {
      return {
        totalUnits: 0,
        occupiedTenants: 0,
        totalCapacity: 0,
        occupancyPercentage: 0,
      };
    }

    const units = Object.values(property.units);
    const totalUnits = units.length;
    const occupiedTenants = units.reduce((sum, unit) => sum + (unit.tenants?.length || 0), 0);
    const totalCapacity = units.reduce((sum, unit) => sum + (unit.capacity || 0), 0);
    const occupancyPercentage = totalCapacity > 0 ? Math.round((occupiedTenants / totalCapacity) * 100) : 0;

    return { totalUnits, occupiedTenants, totalCapacity, occupancyPercentage };
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      // Ctrl/Cmd + K for global search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowGlobalSearch(true);
      }
      // Escape to close search
      if (e.key === 'Escape' && showGlobalSearch) {
        setShowGlobalSearch(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showGlobalSearch]);

  // Context-aware action bar for different views
  const renderActionBar = (): JSX.Element => {
    if (currentView === 'dashboard' && dashboardMode === 'default') {
      return (
        <div className="bg-gradient-to-r from-white to-orange-50 border-b border-orange-100 px-6 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-900">
                {navigationItems.find(item => item.view === currentView)?.label || 'Dashboard'}
              </h1>
              <button
                onClick={() => setDashboardMode('custom')}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors flex items-center gap-2"
              >
                <Square3Stack3DIcon className="w-4 h-4" />
                Switch to Custom View
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowGlobalSearch(true)}
                className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors flex items-center gap-2"
                title="Search (Ctrl+K)"
              >
                <MagnifyingGlassIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Search</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (currentView === 'dashboard' && dashboardMode === 'custom') {
      return (
        <div className="bg-gradient-to-r from-white to-orange-50 border-b border-orange-100 px-6 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-900">Custom Dashboard</h1>
              <button
                onClick={() => setDashboardMode('default')}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors flex items-center gap-2"
              >
                <Square3Stack3DIcon className="w-4 h-4" />
                Switch to Default View
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (currentView === 'properties') {
      return (
        <div className="bg-gradient-to-r from-white to-orange-50 border-b border-orange-100 px-6 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-900">Properties</h1>
              {selectedItems.length > 0 && (
                <span className="text-sm text-orange-600">
                  {selectedItems.length} selected
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowGlobalSearch(true)}
                className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors flex items-center gap-2"
                title="Search (Ctrl+K)"
              >
                <MagnifyingGlassIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Search</span>
              </button>
              <button
                onClick={() => setShowAddPropertyModal(true)}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
              >
                <PlusIcon className="w-4 h-4" />
                Add Property
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
              >
                <CloudArrowUpIcon className="w-4 h-4" />
                Import CSV
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (currentView === 'tenants') {
      return (
        <div className="bg-gradient-to-r from-white to-orange-50 border-b border-orange-100 px-6 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">Tenant Management</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowGlobalSearch(true)}
                className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors flex items-center gap-2"
                title="Search (Ctrl+K)"
              >
                <MagnifyingGlassIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Search</span>
              </button>
              <button
                onClick={() => setShowInviteTenantModal(true)}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
              >
                <UserGroupIcon className="w-4 h-4" />
                Invite Tenant
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (currentView === 'contractors') {
      return (
        <div className="bg-gradient-to-r from-white to-orange-50 border-b border-orange-100 px-6 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">Preferred Contractors</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowGlobalSearch(true)}
                className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors flex items-center gap-2"
                title="Search (Ctrl+K)"
              >
                <MagnifyingGlassIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Search</span>
              </button>
              <button
                onClick={handleAddContractor}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
              >
                <PlusIcon className="w-4 h-4" />
                Add Contractor
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Default action bar for other views
    return (
      <div className="bg-gradient-to-r from-white to-orange-50 border-b border-orange-100 px-6 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">
            {navigationItems.find(item => item.view === currentView)?.label || 'Dashboard'}
          </h1>
          <button
            onClick={() => setShowGlobalSearch(true)}
            className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors flex items-center gap-2"
            title="Search (Ctrl+K)"
          >
            <MagnifyingGlassIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Search</span>
          </button>
        </div>
      </div>
    );
  };

  const renderMainContent = (): JSX.Element | null => {
    switch (currentView) {
      case 'dashboard':
        if (dashboardMode === 'custom') {
          return (
            <div className="p-6 bg-gradient-to-br from-orange-50 via-white to-orange-100 min-h-full">
              <div className="bg-white rounded-xl border border-orange-100 shadow-sm p-8 text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Custom Dashboard</h3>
                <p className="text-gray-600">Drag & drop dashboard coming soon - requires additional dependencies.</p>
                <button
                  onClick={() => setDashboardMode('default')}
                  className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Back to Default Dashboard
                </button>
              </div>
            </div>
          );
        }
        return renderDefaultDashboard();
      case 'reports':
        return (
          <div className="p-6 bg-gradient-to-br from-orange-50 via-white to-orange-100 min-h-full">
            <div className="bg-white rounded-xl border border-orange-100 shadow-sm p-8 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Reports & Analytics</h3>
              <p className="text-gray-600">Advanced reporting features coming soon - requires additional dependencies.</p>
            </div>
          </div>
        );
      case 'properties':
        return renderPropertiesView();
      case 'tenants':
        return renderTenantsView();
      case 'contractors':
        return renderContractorsView();
      case 'maintenance':
        return renderMaintenanceView();
      case 'documents':
        return renderDocumentsView();
      case 'communications':
        if (!currentUser) return null;
        return <CommunicationCenter userRole="landlord" currentUser={currentUser} />;
      case 'import':
        return (
          <div className="p-6 bg-gradient-to-br from-orange-50 via-white to-orange-100 min-h-full">
            <div className="bg-white rounded-xl border border-orange-100 shadow-sm p-8 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Bulk Property Import</h3>
              <p className="text-gray-600">CSV import functionality coming soon - requires additional dependencies.</p>
              <button
                onClick={() => setCurrentView('properties')}
                className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                Back to Properties
              </button>
            </div>
          </div>
        );
      default:
        return renderDefaultDashboard();
    }
  };

  const renderDefaultDashboard = (): JSX.Element => (
    <div className="p-6 bg-gradient-to-br from-orange-50 via-white to-orange-100 min-h-full">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-white to-orange-50 p-6 rounded-xl border border-orange-100 shadow-sm hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Properties</p>
              <p className="text-2xl font-bold text-gray-900">{properties.length}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <BuildingOfficeIcon className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-white to-orange-50 p-6 rounded-xl border border-orange-100 shadow-sm hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Tenants</p>
              <p className="text-2xl font-bold text-gray-900">
                {landlordStats?.totalTenants || tenants.length}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <UsersIcon className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-white to-orange-50 p-6 rounded-xl border border-orange-100 shadow-sm hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Maintenance Requests</p>
              <p className="text-2xl font-bold text-gray-900">
                {maintenanceRequests.filter(request => 
                  request.status !== 'completed' && request.status !== 'cancelled'
                ).length}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <WrenchScrewdriverIcon className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-white to-orange-50 p-6 rounded-xl border border-orange-100 shadow-sm hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${properties.reduce((sum, p) => sum + safeNumber(p.monthlyRevenue || p.monthlyRent), 0).toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <ArrowTrendingUpIcon className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gradient-to-br from-white to-orange-50 rounded-xl border border-orange-100 shadow-sm hover:shadow-lg transition-shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Tenants</h3>
          <div className="space-y-3">
            {tenants.slice(0, 3).map((tenant) => (
              <div key={tenant.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-white rounded-lg border border-orange-100">
                <div>
                  <div className="font-medium text-gray-900">
                    {tenant.displayName || tenant.name || tenant.email}
                  </div>
                  <div className="text-sm text-gray-600">
                    {tenant.propertyName}{tenant.unitNumber ? ` • Unit ${tenant.unitNumber}` : ''}
                  </div>
                  {tenant.inviteCode && (
                    <div className="text-xs text-gray-500">Code: {tenant.inviteCode}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-semibold text-orange-600">
                    {(() => {
                      const joinDate: any = tenant.acceptedAt || tenant.joinedDate;
                      if (joinDate) {
                        try {
                          let date;
                          // Handle Firestore Timestamp objects
                          if (joinDate && typeof joinDate.toDate === 'function') {
                            date = joinDate.toDate();
                          }
                          // Handle Date objects
                          else if (joinDate instanceof Date) {
                            date = joinDate;
                          }
                          // Handle string dates
                          else if (typeof joinDate === 'string') {
                            date = new Date(joinDate);
                          }
                          // Handle epoch timestamps
                          else if (typeof joinDate === 'number') {
                            date = new Date(joinDate);
                          }
                          else {
                            return 'Recent';
                          }
                          
                          // Check if the resulting date is valid
                          if (isNaN(date.getTime())) {
                            return 'Recent';
                          }
                          
                          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        } catch (e) {
                          return 'Recent';
                        }
                      }
                      return 'Recent';
                    })()}
                  </div>
                  <div className="text-xs text-gray-500">joined</div>
                </div>
              </div>
            ))}
            {tenants.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <UsersIcon className="w-12 h-12 mx-auto mb-2 text-orange-300" />
                <p>No tenants have accepted invites yet</p>
                <button
                  onClick={() => setShowInviteTenantModal(true)}
                  className="mt-2 text-orange-600 hover:text-orange-700 text-sm font-medium"
                >
                  Send your first invite
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-orange-50 rounded-xl border border-orange-100 shadow-sm hover:shadow-lg transition-shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setShowAddPropertyModal(true)}
              className="p-4 border border-orange-200 rounded-lg hover:border-orange-300 hover:bg-gradient-to-r hover:from-orange-50 hover:to-white transition-all text-left"
            >
              <PlusIcon className="w-5 h-5 text-orange-600 mb-2" />
              <div className="font-medium text-gray-900">Add Property</div>
              <div className="text-sm text-gray-600">Manual property entry</div>
            </button>
            
            <button
              onClick={() => setCurrentView('reports')}
              className="p-4 border border-orange-200 rounded-lg hover:border-orange-300 hover:bg-gradient-to-r hover:from-orange-50 hover:to-white transition-all text-left"
            >
              <ChartBarIcon className="w-5 h-5 text-orange-600 mb-2" />
              <div className="font-medium text-gray-900">View Reports</div>
              <div className="text-sm text-gray-600">Analytics & insights</div>
            </button>
            
            <button
              onClick={() => setDashboardMode('custom')}
              className="p-4 border border-orange-200 rounded-lg hover:border-orange-300 hover:bg-gradient-to-r hover:from-orange-50 hover:to-white transition-all text-left"
            >
              <Square3Stack3DIcon className="w-5 h-5 text-orange-600 mb-2" />
              <div className="font-medium text-gray-900">Customize Dashboard</div>
              <div className="text-sm text-gray-600">Drag & drop widgets</div>
            </button>
            
            <button
              onClick={() => setShowGlobalSearch(true)}
              className="p-4 border border-orange-200 rounded-lg hover:border-orange-300 hover:bg-gradient-to-r hover:from-orange-50 hover:to-white transition-all text-left"
            >
              <MagnifyingGlassIcon className="w-5 h-5 text-orange-600 mb-2" />
              <div className="font-medium text-gray-900">Global Search</div>
              <div className="text-sm text-gray-600">Find anything quickly</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPropertiesView = (): JSX.Element => (
    <div className="p-6 bg-gradient-to-br from-orange-50 via-white to-orange-100 min-h-full">
      <div className="bg-gradient-to-br from-white to-orange-50 rounded-xl border border-orange-100 shadow-sm hover:shadow-lg transition-shadow">
        <div className="p-6 border-b border-orange-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Properties</h3>
            <div className="flex items-center gap-3">
              {selectedItems.length > 0 && (
                <span className="text-sm text-gray-600">
                  {selectedItems.length} selected
                </span>
              )}
              <button
                onClick={() => setShowImportModal(true)}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
              >
                <PlusIcon className="w-4 h-4" />
                Import Properties
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {properties.length === 0 ? (
            <div className="text-center py-12">
              <BuildingOfficeIcon className="w-16 h-16 mx-auto mb-4 text-orange-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Properties Found</h3>
              <p className="text-gray-600 mb-6">
                Start by adding your first property to get started with property management.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setShowAddPropertyModal(true)}
                  className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
                >
                  <PlusIcon className="w-5 h-5" />
                  Add Property
                </button>
                <button
                  onClick={() => setShowImportModal(true)}
                  className="px-6 py-3 border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-50 transition-colors flex items-center gap-2"
                >
                  <CloudArrowUpIcon className="w-5 h-5" />
                  Import CSV
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {properties.map((property) => {
                const { totalUnits, occupiedTenants, totalCapacity, occupancyPercentage } = getOccupancyDetails(property);
                const monthlyRevenue = safeNumber(property.monthlyRevenue || property.monthlyRent, 0);
                
                return (
                  <div
                    key={property.id}
                    className={`p-4 border rounded-lg transition-all ${
                      selectedItems.includes(property.id)
                        ? 'border-orange-300 bg-gradient-to-r from-orange-100 to-orange-50 shadow-md'
                        : 'border-orange-200 hover:border-orange-300 hover:bg-gradient-to-r hover:from-orange-50 hover:to-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(property.id)}
                          onChange={() => {
                            if (selectedItems.includes(property.id)) {
                              setSelectedItems(prev => prev.filter(id => id !== property.id));
                            } else {
                              setSelectedItems(prev => [...prev, property.id]);
                            }
                          }}
                          className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{getPropertyName(property)}</h4>
                          <p className="text-sm text-gray-600">{formatAddress(property)}</p>
                          {property.propertyType && (
                            <p className="text-xs text-gray-500 mt-1">{property.propertyType}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">
                            {occupiedTenants}/{totalCapacity} Occupied
                          </div>
                          <div className="text-sm text-gray-600">
                            {totalUnits} {totalUnits === 1 ? 'Unit' : 'Units'}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {occupancyPercentage}% occupied
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditProperty(property);
                            }}
                            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Property"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProperty(property);
                            }}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Property"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Render the units for this property */}
                    {property.units && typeof property.units === 'object' && Object.keys(property.units).length > 0 && (
                      <div className="mt-2">
                        {Object.entries(property.units).map(([unitId, unitData]) => (
                          <UnitCard
                            key={unitId}
                            unitId={unitId}
                            unitData={unitData}
                            allTenants={tenants}
                            propertyId={property.id}
                            propertyName={getPropertyName(property)}
                            onEmptySlotClick={handleEmptySlotClick}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderTenantsView = (): JSX.Element => (
    <div className="p-6 bg-gradient-to-br from-orange-50 via-white to-orange-100 min-h-full">
      {/* Add Tenant Button */}
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => {
            setPrefilledInviteData({}); // Clear any pre-filled data
            setShowInviteTenantModal(true);
          }}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
        >
          <UserGroupIcon className="w-4 h-4" />
          Invite Tenant
        </button>
      </div>
      
      {/* Enhanced Tenants Section */}
      <AcceptedTenantsSection properties={properties as any} />
    </div>
  );

  const renderContractorsView = (): JSX.Element => (
    <div className="p-6 bg-gradient-to-br from-orange-50 via-white to-orange-100 min-h-full">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main contractors grid - takes up 2 columns on large screens */}
        <div className="lg:col-span-2">
          <PreferredContractorsGrid
            contractors={contractors}
            onAddContractor={handleAddContractor}
            onEditContractor={handleEditContractor}
            onRateContractor={handleRateContractor}
            onRemoveContractor={handleRemoveContractor}
            isLoading={isLoading}
            onRefresh={handleRefreshContractors}
          />
        </div>
        
        {/* SMS test panel - takes up 1 column on large screens */}
        <div className="lg:col-span-1">
          <SMSTestPanel />
        </div>
      </div>
    </div>
  );

  const renderMaintenanceView = (): JSX.Element => {
    const ongoingTickets = enhancedTickets.filter(t => t.status === 'pending' || t.status === 'in-progress');
    const finishedTickets = enhancedTickets.filter(t => t.status === 'completed' || t.status === 'closed');

    const formatDate = (date: any) => {
      if (!date) return 'Unknown';
      try {
        let dateObj;
        if (date.toDate && typeof date.toDate === 'function') {
          dateObj = date.toDate();
        } else if (date.seconds) {
          dateObj = new Date(date.seconds * 1000);
        } else {
          dateObj = new Date(date);
        }
        return dateObj.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      } catch {
        return 'Unknown';
      }
    };

    const getPriorityColor = (priority: string) => {
      switch (priority?.toLowerCase()) {
        case 'high':
        case 'urgent':
          return 'border-red-200 bg-gradient-to-br from-red-50 to-red-100';
        case 'medium':
          return 'border-yellow-200 bg-gradient-to-br from-yellow-50 to-yellow-100';
        case 'low':
          return 'border-green-200 bg-gradient-to-br from-green-50 to-green-100';
        default:
          return 'border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100';
      }
    };

    const getStatusColor = (status: string) => {
      switch (status?.toLowerCase()) {
        case 'pending':
          return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'in-progress':
          return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'completed':
          return 'bg-green-100 text-green-800 border-green-200';
        case 'closed':
          return 'bg-gray-100 text-gray-800 border-gray-200';
        default:
          return 'bg-orange-100 text-orange-800 border-orange-200';
      }
    };

    return (
      <div className="p-6 bg-gradient-to-br from-orange-50 via-white to-orange-100 min-h-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Ongoing Section */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <WrenchScrewdriverIcon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Ongoing Requests</h3>
              <span className="px-3 py-1 text-sm font-medium bg-orange-100 text-orange-800 rounded-full">
                {ongoingTickets.length}
              </span>
            </div>
            
            {ongoingTickets.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-orange-200 shadow-sm">
                <WrenchScrewdriverIcon className="w-16 h-16 mx-auto mb-4 text-orange-300" />
                <p className="text-gray-600 font-medium">No ongoing maintenance requests</p>
                <p className="text-sm text-gray-500 mt-1">New requests from tenants will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {ongoingTickets.map((ticket) => (
                  <div 
                    key={ticket.id} 
                    className={`relative border-2 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 ${getPriorityColor(ticket.priority)}`}
                    onMouseEnter={() => setHoveredTicket(ticket.id)}
                    onMouseLeave={() => setHoveredTicket(null)}
                  >
                    {/* Header */}
                    <div className="p-5 border-b border-orange-200/50">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 text-lg mb-1">
                            {ticket.title || 'Maintenance Request'}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <HomeIcon className="w-4 h-4" />
                              {ticket.propertyName}
                            </span>
                            {ticket.unitNumber && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                Unit {ticket.unitNumber}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusColor(ticket.status)}`}>
                            {(ticket.status || 'pending').toUpperCase()}
                          </span>
                          
                          {/* Delete button - appears on hover */}
                          {(hoveredTicket === ticket.id || deletingTicket === ticket.id) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteMaintenanceRequest(ticket.id, ticket.title || 'Maintenance Request');
                              }}
                              disabled={deletingTicket === ticket.id}
                              className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                              title="Delete maintenance request"
                            >
                              {deletingTicket === ticket.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                <TrashIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Tenant Info */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                          <UserIcon className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{ticket.tenantInfo?.name || 'Unknown Tenant'}</p>
                          {ticket.tenantInfo?.email && (
                            <p className="text-xs text-gray-500">{ticket.tenantInfo.email}</p>
                          )}
                        </div>
                        <div className="ml-auto text-right">
                          <p className="text-xs text-gray-500">Created</p>
                          <p className="text-sm font-medium text-gray-700">{formatDate(ticket.createdAt)}</p>
                        </div>
                      </div>

                      {/* Description */}
                      {ticket.description && (
                        <div className="bg-white/60 rounded-lg p-3 border border-orange-100">
                          <p className="text-sm text-gray-700 leading-relaxed">{ticket.description}</p>
                        </div>
                      )}
                    </div>

                    {/* Assignment Section */}
                    <div className="p-5">
                      {ticket.status === 'pending' && (
                        <div>
                          <label htmlFor={`assign-${ticket.id}`} className="block text-sm font-bold text-gray-800 mb-2">
                            Assign Contractor
                          </label>
                          <div className="flex gap-3">
                            <select
                              id={`assign-${ticket.id}`}
                              disabled={isAssigning === ticket.id || contractors.length === 0}
                              onChange={(e) => e.target.value && handleAssignContractor(ticket.id, e.target.value)}
                              className="flex-1 border-2 border-orange-200 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <option value="">
                                {contractors.length === 0 ? 'No contractors found' : 'Select a contractor...'}
                              </option>
                              {/* This maps over the `contractors` array from the component's state */}
                              {contractors.map(contractor => (
                                <option key={contractor.id} value={contractor.id}>
                                  {contractor.name || contractor.businessName || contractor.email}
                                </option>
                              ))}
                            </select>
                            {isAssigning === ticket.id && (
                              <div className="flex items-center px-3">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-2 flex items-center gap-1">
                            <span className="w-1 h-1 bg-orange-500 rounded-full"></span>
                            Status will become "in-progress" upon assignment
                          </p>
                        </div>
                      )}
                      {ticket.status === 'in-progress' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-sm font-bold text-blue-900 mb-1">Assigned Contractor</p>
                          <p className="text-blue-800">
                            {contractors.find(c => c.id === ticket.contractorId)?.name || 'Unknown Contractor'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Finished Section */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <DocumentTextIcon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Completed Requests</h3>
              <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full">
                {finishedTickets.length}
              </span>
            </div>
            
            {finishedTickets.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-green-200 shadow-sm">
                <DocumentTextIcon className="w-16 h-16 mx-auto mb-4 text-green-300" />
                <p className="text-gray-600 font-medium">No completed requests</p>
                <p className="text-sm text-gray-500 mt-1">Finished work will be tracked here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {finishedTickets.map((ticket) => (
                  <div 
                    key={ticket.id} 
                    className="relative border-2 border-green-200 rounded-xl shadow-sm bg-gradient-to-br from-green-50 to-green-100 opacity-90"
                    onMouseEnter={() => setHoveredTicket(ticket.id)}
                    onMouseLeave={() => setHoveredTicket(null)}
                  >
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-800 mb-1">{ticket.title || 'Maintenance Request'}</h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <HomeIcon className="w-4 h-4" />
                              {ticket.propertyName}
                            </span>
                            {ticket.unitNumber && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                Unit {ticket.unitNumber}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusColor(ticket.status)}`}>
                            {(ticket.status || 'completed').toUpperCase()}
                          </span>
                          
                          {/* Delete button - appears on hover */}
                          {(hoveredTicket === ticket.id || deletingTicket === ticket.id) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteMaintenanceRequest(ticket.id, ticket.title || 'Maintenance Request');
                              }}
                              disabled={deletingTicket === ticket.id}
                              className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                              title="Delete maintenance request"
                            >
                              {deletingTicket === ticket.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                <TrashIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center">
                            <UserIcon className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            {ticket.tenantInfo?.name || 'Unknown Tenant'}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Completed</p>
                          <p className="text-sm font-medium text-gray-700">{formatDate(ticket.updatedAt)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderDocumentsView = (): JSX.Element => (
    <div className="p-6 bg-gradient-to-br from-orange-50 via-white to-orange-100 min-h-full">
      <div className="bg-gradient-to-br from-white to-orange-50 rounded-xl border border-orange-100 shadow-sm hover:shadow-lg transition-shadow p-8 text-center">
        <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Document Management</h3>
        <p className="text-gray-600">Coming in next phase - store and organize leases, contracts, and property documents.</p>
      </div>
    </div>
  );

  // Helper function to safely render address
  const formatAddress = (property: Property): string => {
    if (!property) return 'Address not available';
    
    // If address is a string, return it directly
    if (typeof property.address === 'string') {
      return property.address;
    }
    
    // If address is an object, construct the address string
    if (typeof property.address === 'object' && property.address) {
      const { street, city, state, zip } = property.address;
      const parts = [street, city, state, zip].filter(Boolean);
      return parts.join(', ') || 'Address not complete';
    }
    
    // Fallback to individual fields if they exist
    const parts = [
      property.street,
      property.city, 
      property.state,
      property.zipCode || property.zip
    ].filter(Boolean);
    
    return parts.length > 0 ? parts.join(', ') : 'Address not available';
  };

  // Helper function to safely get property name
  const getPropertyName = (property: Property): string => {
    return property.name || property.propertyName || formatAddress(property) || 'Unnamed Property';
  };

  // Helper function to safely get numeric values
  const safeNumber = (value: any, defaultValue = 0): number => {
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center">
        <div className="text-center bg-white/95 backdrop-blur-sm rounded-xl p-8 shadow-2xl border border-orange-200">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-gradient-to-b from-white to-orange-50 border-r border-orange-100 h-full shadow-sm">
        <div className="p-6 border-b border-orange-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center shadow-sm">
              <BuildingOfficeIcon className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">PropAgentic</h2>
              <p className="text-sm text-orange-600">
                {userProfile ? (
                  `Welcome, ${userProfile.firstName && userProfile.lastName 
                    ? `${userProfile.firstName} ${userProfile.lastName}` 
                    : userProfile.name || userProfile.email || 'User'}`
                ) : (
                  'Landlord Portal'
                )}
              </p>
            </div>
          </div>
        </div>
        
        <nav className="p-4">
          <div className="space-y-2">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.view)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${
                  currentView === item.view
                    ? 'bg-gradient-to-r from-orange-100 to-orange-50 text-orange-700 border-r-2 border-orange-500 shadow-sm'
                    : 'text-gray-700 hover:bg-gradient-to-r hover:from-orange-50 hover:to-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </div>
        </nav>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
          {/* Context-aware Action Bar */}
          {renderActionBar()}
        
        {/* Content */}
        <div className="flex-1 overflow-auto">
          {renderMainContent()}
        </div>
      </div>

      {/* Global Search Modal */}
      <GlobalSearch 
        isOpen={showGlobalSearch}
        onClose={() => setShowGlobalSearch(false)}
      />

      {/* Bulk Operations */}
      <BulkOperations
        items={properties.map(p => ({ ...p, type: 'property' })) as any}
        selectedIds={selectedItems as any}
        onSelectionChange={setSelectedItems}
        onBulkAction={handleBulkAction}
        itemType="properties"
      />

{/* Import Modal - Temporarily disabled */}

      {/* Invite Tenant Modal */}
      {showInviteTenantModal && (
        <InviteTenantModal
          isOpen={showInviteTenantModal}
          onClose={() => {
            setShowInviteTenantModal(false);
            setPrefilledInviteData({}); // Clear pre-filled data when closing
          }}
          propertyId={prefilledInviteData.propertyId}
          propertyName={prefilledInviteData.propertyName}
          initialUnitId={prefilledInviteData.unitId}
          properties={properties as any}
          onInviteSuccess={() => {
            setShowInviteTenantModal(false);
            setPrefilledInviteData({}); // Clear pre-filled data on success
            // Refresh dashboard data to get updated landlord profile stats
            loadDashboardData();
          }}
        />
      )}

      {/* Add Property Modal */}
      {showAddPropertyModal && (
        <AddPropertyModal
          isOpen={showAddPropertyModal}
          onClose={() => setShowAddPropertyModal(false)}
          onPropertyAdded={(newProperty: Property) => {
            setProperties(prev => [...prev, newProperty]);
            setShowAddPropertyModal(false);
          }}
        />
      )}

              {/* Edit Property Modal */}
        {showEditPropertyModal && (
          <EditPropertyModal
            isOpen={showEditPropertyModal}
            onClose={() => {
              setShowEditPropertyModal(false);
              setEditingProperty(null);
            }}
            property={editingProperty as any}
            onSuccess={handlePropertyUpdated}
          />
        )}

      {/* Add Contractor Modal */}
      {showAddContractorModal && (
        <AddContractorModal
          isOpen={showAddContractorModal}
          onClose={() => setShowAddContractorModal(false)}
          landlordId={currentUser?.uid || ''}
          onSuccess={handleContractorSuccess}
          editContractor={editingContractor}
        />
      )}

      {/* Debug: Data Persistence Diagnostic Panel */}
      {process.env.NODE_ENV === 'development' && (
        <>
          <DataPersistenceDiagnostic />
          <TestRunner />
          <InvitationFlowTest />
        </>
      )}
    </div>
  );
};

export default LandlordDashboard;

