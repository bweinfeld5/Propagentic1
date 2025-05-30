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
import BulkPropertyImport from '../../components/landlord/BulkPropertyImport';
import CommunicationCenter from '../../components/communication/CommunicationCenter';

// Phase 1.2 Components
import DragDropDashboard from '../../components/dashboard/DragDropDashboard';
import GlobalSearch from '../../components/search/GlobalSearch';
import BulkOperations from '../../components/bulk/BulkOperations';
import ReportsModule from '../../components/reports/ReportsModule';

const LandlordDashboard = () => {
  const { currentUser } = useAuth();
  const [showImport, setShowImport] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importProgress, setImportProgress] = useState(null);
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Phase 1.2 State
  const [currentView, setCurrentView] = useState('dashboard'); // dashboard, reports, analytics
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [dashboardMode, setDashboardMode] = useState('default'); // default, custom

  useEffect(() => {
    loadDashboardData();
  }, [currentUser]);

  const loadDashboardData = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      // Load properties, tenants, maintenance requests
      const propertiesData = [
        {
          id: '1',
          name: 'Sunset Apartments',
          address: '123 Main St, Downtown',
          units: 24,
          occupiedUnits: 22,
          monthlyRevenue: 36000,
          status: 'active',
          lastUpdated: new Date()
        },
        {
          id: '2',
          name: 'Downtown Lofts',
          address: '456 Business Ave, Central',
          units: 12,
          occupiedUnits: 12,
          monthlyRevenue: 26400,
          status: 'active',
          lastUpdated: new Date()
        },
        {
          id: '3',
          name: 'Garden Complex',
          address: '789 Park Lane, Suburbs',
          units: 36,
          occupiedUnits: 28,
          monthlyRevenue: 43200,
          status: 'active',
          lastUpdated: new Date()
        }
      ];
      
      setProperties(propertiesData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
    setIsLoading(false);
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

  const renderHeader = () => (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {navigationItems.find(item => item.view === currentView)?.label || 'Dashboard'}
          </h1>
          {currentView === 'dashboard' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDashboardMode(dashboardMode === 'default' ? 'custom' : 'default')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  dashboardMode === 'custom'
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Square3Stack3DIcon className="w-4 h-4" />
                {dashboardMode === 'custom' ? 'Custom View' : 'Default View'}
              </button>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {/* Global Search */}
          <button
            onClick={() => setShowGlobalSearch(true)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
            title="Search (Ctrl+K)"
          >
            <MagnifyingGlassIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden md:inline-flex items-center px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded border">
              ⌘K
            </kbd>
          </button>

          {/* Quick Actions */}
          {currentView === 'properties' && (
            <button
              onClick={() => setShowImportModal(true)}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              Import Properties
            </button>
          )}

          {/* Notifications */}
          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors relative">
            <BellIcon className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </button>

          {/* Settings */}
          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <Cog6ToothIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );

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
                {properties.reduce((sum, p) => sum + p.units, 0)}
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
                      (properties.reduce((sum, p) => sum + p.occupiedUnits, 0) / 
                       properties.reduce((sum, p) => sum + p.units, 0)) * 100
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
                ${properties.reduce((sum, p) => sum + p.monthlyRevenue, 0).toLocaleString()}
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
            {properties.slice(0, 3).map((property) => (
              <div key={property.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{property.name}</div>
                  <div className="text-sm text-gray-600">{property.address}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-orange-600">
                    {Math.round((property.occupiedUnits / property.units) * 100)}%
                  </div>
                  <div className="text-xs text-gray-500">occupied</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setShowImportModal(true)}
              className="p-4 border border-gray-200 rounded-lg hover:border-orange-200 hover:bg-orange-50 transition-colors text-left"
            >
              <PlusIcon className="w-5 h-5 text-orange-600 mb-2" />
              <div className="font-medium text-gray-900">Import Properties</div>
              <div className="text-sm text-gray-600">Bulk import from CSV</div>
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
          <div className="space-y-4">
            {properties.map((property) => (
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
                      <h4 className="font-semibold text-gray-900">{property.name}</h4>
                      <p className="text-sm text-gray-600">{property.address}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      {property.occupiedUnits}/{property.units} units
                    </div>
                    <div className="text-sm text-gray-600">
                      ${property.monthlyRevenue.toLocaleString()}/month
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Placeholder views for other sections
  const renderTenantsView = () => (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-full">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
        <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Tenants Management</h3>
        <p className="text-gray-600">Coming in next phase - manage tenant information, leases, and communications.</p>
      </div>
    </div>
  );

  const renderMaintenanceView = () => (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-full">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
        <WrenchScrewdriverIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Maintenance Requests</h3>
        <p className="text-gray-600">Coming in next phase - track and manage maintenance requests and work orders.</p>
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
        {/* Header */}
        {renderHeader()}
        
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
    </div>
  );
};

export default LandlordDashboard; 