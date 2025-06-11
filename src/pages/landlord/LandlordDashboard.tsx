import React, { useState, useEffect } from 'react';
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
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext.jsx';
import { useDemoMode } from '../../context/DemoModeContext';
import dataService from '../../services/dataService';
import CommunicationCenter from '../../components/communication/CommunicationCenter';
import InviteTenantModal from '../../components/landlord/InviteTenantModal';
import AddPropertyModal from '../../components/landlord/AddPropertyModal';

// Phase 1.2 Components
import GlobalSearch from '../../components/search/GlobalSearch';
import BulkOperations from '../../components/bulk/BulkOperations';

// Debug components for data persistence investigation
import DataPersistenceDiagnostic from '../../components/debug/DataPersistenceDiagnostic';
import TestRunner from '../../components/debug/TestRunner';

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
  units?: number;
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
  status?: string;
  propertyId?: string;
  propertyName?: string;
  leaseStart?: string;
  leaseEnd?: string;
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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [propertiesLoaded, setPropertiesLoaded] = useState<boolean>(false);
  
  // Phase 1.2 State
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [showGlobalSearch, setShowGlobalSearch] = useState<boolean>(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [dashboardMode, setDashboardMode] = useState<'default' | 'custom'>('default');

  // Add state for modals
  const [showInviteTenantModal, setShowInviteTenantModal] = useState<boolean>(false);
  const [showAddPropertyModal, setShowAddPropertyModal] = useState<boolean>(false);

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

      // Load maintenance tickets
      const ticketsData = await dataService.getTicketsForCurrentUser();
      setTickets(ticketsData);

      // Load tenants data for all properties
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
      
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      setError(error.message);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [currentUser, isDemoMode]);

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
              <p className="text-sm text-gray-600">Total Units</p>
              <p className="text-2xl font-bold text-gray-900">
                {properties.reduce((sum, p) => sum + safeNumber(p.units, 1), 0)}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <HomeIcon className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-white to-orange-50 p-6 rounded-xl border border-orange-100 shadow-sm hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Occupancy Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {properties.length > 0 
                  ? Math.round(
                      (properties.reduce((sum, p) => sum + safeNumber(p.occupiedUnits), 0) / 
                       properties.reduce((sum, p) => sum + safeNumber(p.units, 1), 0)) * 100
                    )
                  : 0}%
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Properties</h3>
          <div className="space-y-3">
            {properties.slice(0, 3).map((property) => {
              const units = safeNumber(property.units, 1);
              const occupiedUnits = safeNumber(property.occupiedUnits, 0);
              const occupancyRate = units > 0 ? Math.round((occupiedUnits / units) * 100) : 0;
              
              return (
                <div key={property.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-white rounded-lg border border-orange-100">
                  <div>
                    <div className="font-medium text-gray-900">{getPropertyName(property)}</div>
                    <div className="text-sm text-gray-600">{formatAddress(property)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-orange-600">
                      {occupancyRate}%
                    </div>
                    <div className="text-xs text-gray-500">occupied</div>
                  </div>
                </div>
              );
            })}
            {properties.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <BuildingOfficeIcon className="w-12 h-12 mx-auto mb-2 text-orange-300" />
                <p>No properties found</p>
                <button
                  onClick={() => setShowAddPropertyModal(true)}
                  className="mt-2 text-orange-600 hover:text-orange-700 text-sm font-medium"
                >
                  Add your first property
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
                const units = safeNumber(property.units, 1);
                const occupiedUnits = safeNumber(property.occupiedUnits, 0);
                const monthlyRevenue = safeNumber(property.monthlyRevenue || property.monthlyRent, 0);
                
                return (
                  <div
                    key={property.id}
                    className={`p-4 border rounded-lg transition-all cursor-pointer ${
                      selectedItems.includes(property.id)
                        ? 'border-orange-300 bg-gradient-to-r from-orange-100 to-orange-50 shadow-md'
                        : 'border-orange-200 hover:border-orange-300 hover:bg-gradient-to-r hover:from-orange-50 hover:to-white'
                    }`}
                    onClick={() => {
                      if (selectedItems.includes(property.id)) {
                        setSelectedItems(prev => prev.filter(id => id !== property.id));
                      } else {
                        setSelectedItems(prev => [...prev, property.id]);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(property.id)}
                          onChange={() => {}}
                          className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                        />
                        <div>
                          <h4 className="font-semibold text-gray-900">{getPropertyName(property)}</h4>
                          <p className="text-sm text-gray-600">{formatAddress(property)}</p>
                          {property.propertyType && (
                            <p className="text-xs text-gray-500 mt-1">{property.propertyType}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          {occupiedUnits}/{units} units
                        </div>
                        <div className="text-sm text-gray-600">
                          ${monthlyRevenue.toLocaleString()}/month
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {units > 0 ? Math.round((occupiedUnits / units) * 100) : 0}% occupied
                        </div>
                      </div>
                    </div>
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
      <div className="bg-gradient-to-br from-white to-orange-50 rounded-xl border border-orange-100 shadow-sm hover:shadow-lg transition-shadow">
        <div className="p-6 border-b border-orange-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Tenant Management</h3>
            <button
              onClick={() => setShowInviteTenantModal(true)}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
            >
              <UserGroupIcon className="w-4 h-4" />
              Invite Tenant
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {tenants.length === 0 ? (
            <div className="text-center py-12">
              <UsersIcon className="w-16 h-16 mx-auto mb-4 text-orange-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tenants Found</h3>
              <p className="text-gray-600 mb-6">
                Start by inviting tenants to your properties to manage leases and communications.
              </p>
              <button
                onClick={() => setShowInviteTenantModal(true)}
                className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
              >
                <UserGroupIcon className="w-5 h-5" />
                Invite First Tenant
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {tenants.map((tenant) => (
                <div key={tenant.id} className="p-4 border border-orange-200 rounded-lg hover:border-orange-300 hover:bg-gradient-to-r hover:from-orange-50 hover:to-white transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <UsersIcon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {tenant.displayName || tenant.name || tenant.email}
                        </h4>
                        <p className="text-sm text-gray-600">{tenant.email}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Property: {tenant.propertyName || 'Not assigned'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        tenant.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : tenant.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {tenant.status || 'pending'}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {tenant.leaseStart && tenant.leaseEnd 
                          ? `Lease: ${tenant.leaseStart} - ${tenant.leaseEnd}`
                          : 'No lease info'
                        }
                      </p>
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

  const renderMaintenanceView = (): JSX.Element => (
    <div className="p-6 bg-gradient-to-br from-orange-50 via-white to-orange-100 min-h-full">
      <div className="bg-gradient-to-br from-white to-orange-50 rounded-xl border border-orange-100 shadow-sm hover:shadow-lg transition-shadow">
        <div className="p-6 border-b border-orange-100">
          <h3 className="text-lg font-semibold text-gray-900">Maintenance Requests</h3>
        </div>
        
        <div className="p-6">
          {tickets.length === 0 ? (
            <div className="text-center py-12">
              <WrenchScrewdriverIcon className="w-16 h-16 mx-auto mb-4 text-orange-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Maintenance Requests</h3>
              <p className="text-gray-600">
                Maintenance requests from tenants will appear here for tracking and management.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="p-4 border border-orange-200 rounded-lg hover:border-orange-300 hover:bg-gradient-to-r hover:from-orange-50 hover:to-white transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        ticket.priority === 'high' 
                          ? 'bg-red-100'
                          : ticket.priority === 'medium'
                          ? 'bg-yellow-100'
                          : 'bg-green-100'
                      }`}>
                        <WrenchScrewdriverIcon className={`w-5 h-5 ${
                          ticket.priority === 'high' 
                            ? 'text-red-600'
                            : ticket.priority === 'medium'
                            ? 'text-yellow-600'
                            : 'text-green-600'
                        }`} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {ticket.title || ticket.description || 'Maintenance Request'}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {ticket.propertyName || 'Property'} • {ticket.category || 'General'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {ticket.createdAt ? new Date(ticket.createdAt.toString()).toLocaleDateString() : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        ticket.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : ticket.status === 'in-progress'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {ticket.status || 'pending'}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Priority: {ticket.priority || 'medium'}
                      </p>
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
          onClose={() => setShowInviteTenantModal(false)}
          properties={properties as any}
          onInviteSuccess={() => {
            setShowInviteTenantModal(false);
            // Refresh tenants data
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

      {/* Debug: Data Persistence Diagnostic Panel */}
      {process.env.NODE_ENV === 'development' && (
        <>
          <DataPersistenceDiagnostic />
          <TestRunner />
        </>
      )}
    </div>
  );
};

export default LandlordDashboard;
