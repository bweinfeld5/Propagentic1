import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
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
import { useAuth } from '../../context/AuthContext';
import { useDemoMode } from '../../context/DemoModeContext';
import dataService from '../../services/dataService';
import BulkPropertyImport from '../../components/landlord/BulkPropertyImport';
import CommunicationCenter from '../../components/communication/CommunicationCenter';
import InviteTenantModal from '../../components/landlord/InviteTenantModal';
import AddPropertyModal from '../../components/landlord/AddPropertyModal';

// Phase 1.2 Components
import DragDropDashboard from '../../components/dashboard/DragDropDashboard';
import GlobalSearch from '../../components/search/GlobalSearch';
import BulkOperations from '../../components/bulk/BulkOperations';
import ReportsModule from '../../components/reports/ReportsModule';

const LandlordDashboard = () => {
  const { currentUser, userProfile } = useAuth();
  const { isDemoMode } = useDemoMode();
  const [showImport, setShowImport] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importProgress, setImportProgress] = useState(null);
  const [properties, setProperties] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Phase 1.2 State
  const [currentView, setCurrentView] = useState('dashboard'); // dashboard, reports, analytics
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [dashboardMode, setDashboardMode] = useState('default'); // default, custom

  // Add state for modals
  const [showInviteTenantModal, setShowInviteTenantModal] = useState(false);
  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [currentUser, userProfile, isDemoMode]);

  const loadDashboardData = async () => {
    if (!currentUser || !userProfile) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Configure dataService
      dataService.configure({ 
        isDemoMode, 
        currentUser,
        userType: userProfile.userType || 'landlord'
      });

      // Subscribe to properties with real-time updates
      const unsubscribeProperties = dataService.subscribeToProperties(
        (propertiesData) => {
          console.log('Properties data received:', propertiesData.length);
          setProperties(propertiesData);
          
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
        (error) => {
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
        const allTenants = [];
        for (const property of properties) {
          if (property.id) {
            const propertyTenants = await dataService.getTenantsForProperty(property.id);
            allTenants.push(...propertyTenants);
          }
        }
        setTenants(allTenants);
      }

      // Cleanup function
      return () => {
        if (typeof unsubscribeProperties === 'function') {
          unsubscribeProperties();
        }
      };
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError(error.message);
      setIsLoading(false);
    }
  };

  // Handle bulk operations
  const handleBulkAction = (action, items, values) => {
    console.log('Bulk action:', action, 'Items:', items, 'Values:', values);
    
    switch (action) {
      case 'export':
        // Export functionality
        const csvData = items.map(item => ({
          Name: item.name || item.title,
          Type: item.type,
          Status: item.status,
          'Last Updated': item.lastUpdated || item.date
        }));
        
        const csv = Papa.unparse(csvData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `bulk-export-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        break;
        
      case 'bulk_edit':
        // Update items with new values
        if (items[0]?.type === 'property') {
          setProperties(prev => prev.map(prop => {
            if (items.find(item => item.id === prop.id)) {
              return {
                ...prop,
                ...(values.status && { status: values.status }),
                ...(values.manager && { manager: values.manager })
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
  const navigationItems = [
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
    const handleKeyDown = (e) => {
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

  const renderSidebar = () => (
    <div className="w-64 bg-white border-r border-gray-200 h-full">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <BuildingOfficeIcon className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">PropAgentic</h2>
            <p className="text-sm text-gray-600">Landlord Portal</p>
          </div>
        </div>
      </div>
      
      <nav className="p-4">
        <div className="space-y-2">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.view)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                currentView === item.view
                  ? 'bg-orange-50 text-orange-700 border-r-2 border-orange-500'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );

  // Context-aware action bar for different views
  const renderActionBar = () => {
    if (currentView === 'dashboard' && dashboardMode === 'default') {
      return (
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-900">
                {navigationItems.find(item => item.view === currentView)?.label || 'Dashboard'}
              </h1>
              <button
                onClick={() => setDashboardMode('custom')}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <Square3Stack3DIcon className="w-4 h-4" />
                Switch to Custom View
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowGlobalSearch(true)}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
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
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-900">Custom Dashboard</h1>
              <button
                onClick={() => setDashboardMode('default')}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-orange-100 text-orange-700 transition-colors flex items-center gap-2"
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
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-900">Properties</h1>
              {selectedItems.length > 0 && (
                <span className="text-sm text-gray-600">
                  {selectedItems.length} selected
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowGlobalSearch(true)}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
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
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
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
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">Tenant Management</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowGlobalSearch(true)}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
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
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">
            {navigationItems.find(item => item.view === currentView)?.label || 'Dashboard'}
          </h1>
          <button
            onClick={() => setShowGlobalSearch(true)}
            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
            title="Search (Ctrl+K)"
          >
            <MagnifyingGlassIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Search</span>
          </button>
        </div>
      </div>
    );
  };

  const renderMainContent = () => {
    switch (currentView) {
      case 'dashboard':
        if (dashboardMode === 'custom') {
          return <DragDropDashboard userRole="landlord" />;
        }
        return renderDefaultDashboard();
      case 'reports':
        return <ReportsModule />;
      case 'properties':
        return renderPropertiesView();
      case 'tenants':
        return renderTenantsView();
      case 'maintenance':
        return renderMaintenanceView();
      case 'documents':
        return renderDocumentsView();
      case 'communications':
        return <CommunicationCenter userRole="landlord" currentUser={currentUser} />;
      case 'import':
        return <BulkPropertyImport />;
      default:
        return renderDefaultDashboard();
    }
  };

  // Helper function to safely render address
  const formatAddress = (property) => {
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
  const getPropertyName = (property) => {
    return property.name || property.propertyName || formatAddress(property) || 'Unnamed Property';
  };

  // Helper function to safely get numeric values
  const safeNumber = (value, defaultValue = 0) => {
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
  };

  const renderDefaultDashboard = () => (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-full">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
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
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Units</p>
              <p className="text-2xl font-bold text-gray-900">
                {properties.reduce((sum, p) => sum + safeNumber(p.units, 1), 0)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <HomeIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
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
            <div className="p-3 bg-green-100 rounded-lg">
              <UsersIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${properties.reduce((sum, p) => sum + safeNumber(p.monthlyRevenue || p.monthlyRent), 0).toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <ArrowTrendingUpIcon className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Properties</h3>
          <div className="space-y-3">
            {properties.slice(0, 3).map((property) => {
              const units = safeNumber(property.units, 1);
              const occupiedUnits = safeNumber(property.occupiedUnits, 0);
              const occupancyRate = units > 0 ? Math.round((occupiedUnits / units) * 100) : 0;
              
              return (
              <div key={property.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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
                <BuildingOfficeIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
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

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setShowAddPropertyModal(true)}
              className="p-4 border border-gray-200 rounded-lg hover:border-orange-200 hover:bg-orange-50 transition-colors text-left"
            >
              <PlusIcon className="w-5 h-5 text-orange-600 mb-2" />
              <div className="font-medium text-gray-900">Add Property</div>
              <div className="text-sm text-gray-600">Manual property entry</div>
            </button>
            
            <button
              onClick={() => setCurrentView('reports')}
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-200 hover:bg-blue-50 transition-colors text-left"
            >
              <ChartBarIcon className="w-5 h-5 text-blue-600 mb-2" />
              <div className="font-medium text-gray-900">View Reports</div>
              <div className="text-sm text-gray-600">Analytics & insights</div>
            </button>
            
            <button
              onClick={() => setDashboardMode('custom')}
              className="p-4 border border-gray-200 rounded-lg hover:border-purple-200 hover:bg-purple-50 transition-colors text-left"
            >
              <Square3Stack3DIcon className="w-5 h-5 text-purple-600 mb-2" />
              <div className="font-medium text-gray-900">Customize Dashboard</div>
              <div className="text-sm text-gray-600">Drag & drop widgets</div>
            </button>
            
            <button
              onClick={() => setShowGlobalSearch(true)}
              className="p-4 border border-gray-200 rounded-lg hover:border-green-200 hover:bg-green-50 transition-colors text-left"
            >
              <MagnifyingGlassIcon className="w-5 h-5 text-green-600 mb-2" />
              <div className="font-medium text-gray-900">Global Search</div>
              <div className="text-sm text-gray-600">Find anything quickly</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPropertiesView = () => (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-full">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
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
              <BuildingOfficeIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
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
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
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
                className={`p-4 border rounded-lg transition-colors cursor-pointer ${
                  selectedItems.includes(property.id)
                    ? 'border-orange-200 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
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

  // Placeholder views for other sections
  const renderTenantsView = () => (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-full">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
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
              <UsersIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
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
                <div key={tenant.id} className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
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

  const renderMaintenanceView = () => (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-full">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Maintenance Requests</h3>
        </div>
        
        <div className="p-6">
          {tickets.length === 0 ? (
            <div className="text-center py-12">
              <WrenchScrewdriverIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Maintenance Requests</h3>
              <p className="text-gray-600">
                Maintenance requests from tenants will appear here for tracking and management.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
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
                          {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : ''}
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

  const renderDocumentsView = () => (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-full">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
        <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Document Management</h3>
        <p className="text-gray-600">Coming in next phase - store and organize leases, contracts, and property documents.</p>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      {renderSidebar()}
      
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
        items={properties.map(p => ({ ...p, type: 'property' }))}
        selectedIds={selectedItems}
        onSelectionChange={setSelectedItems}
        onBulkAction={handleBulkAction}
        itemType="properties"
      />

      {/* Import Modal */}
      {showImportModal && (
        <BulkPropertyImport
          onClose={() => setShowImportModal(false)}
          onImportComplete={(newProperties) => {
            setProperties(prev => [...prev, ...newProperties]);
            setShowImportModal(false);
          }}
        />
      )}

      {/* Invite Tenant Modal */}
      {showInviteTenantModal && (
        <InviteTenantModal
          isOpen={showInviteTenantModal}
          onClose={() => setShowInviteTenantModal(false)}
          properties={properties}
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
          onPropertyAdded={(newProperty) => {
            setProperties(prev => [...prev, newProperty]);
            setShowAddPropertyModal(false);
          }}
        />
      )}
    </div>
  );
};

export default LandlordDashboard; 