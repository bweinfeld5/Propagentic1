import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SafeMotion, AnimatePresence } from '../../shared/SafeMotion';
import { UIComponentErrorBoundary } from '../../shared/ErrorBoundary';
import StatusPill from '../../ui/StatusPill';
import Button from '../../ui/Button';
// Import our custom icons
import { 
  BuildingIcon, 
  UnitsIcon, 
  OccupancyIcon, 
  RentPaymentIcon, 
  CalendarIcon, 
  BriefcaseIcon, 
  ClipboardCheckIcon, 
  CurrencyDollarIcon,
  WrenchIcon,
  HomeIcon,
  SettingsIcon,
  PaymentIcon,
  PlusIcon
} from '../../../components/icons/DashboardIcons';

const DashboardPreview = ({ activeTab: initialActiveTab = 'landlord' }) => {
  const [activeTab, setActiveTab] = useState(initialActiveTab);
  const [activeRequest, setActiveRequest] = useState(null);
  const [showFeatureTooltip, setShowFeatureTooltip] = useState(null);
  
  // Update activeTab when the prop changes
  useEffect(() => {
    setActiveTab(initialActiveTab);
  }, [initialActiveTab]);
  
  // Mock data matching the screenshot
  const maintenanceRequests = [
    { id: 1, title: 'Leaking faucet in Unit 101', unit: 'Unit 101', timeAgo: '2 hours ago', status: 'New' },
    { id: 2, title: 'Broken thermostat', unit: 'Unit 205', timeAgo: '5 hours ago', status: 'Assigned' }
  ];

  const tenantRequests = [
    { id: 1, title: 'Leaking faucet in bathroom', unit: 'Unit 101', timeAgo: '2 hours ago', status: 'Submitted' },
    { id: 2, title: 'Ceiling fan not working', unit: 'Unit 101', timeAgo: '1 day ago', status: 'In Progress' }
  ];
  
  // Add contractor jobs mock data
  const contractorJobs = [
    { id: 1, title: 'Repair leaking faucet', location: 'Maple Gardens, Unit 101', timeAgo: '3 hours ago', status: 'New', client: 'John Doe' },
    { id: 2, title: 'HVAC maintenance', location: 'Cedar Heights, Unit 302', timeAgo: '1 day ago', status: 'Scheduled', client: 'Lisa Wong' }
  ];
  
  const handleFeatureHover = (feature) => {
    setShowFeatureTooltip(feature);
  };
  
  const renderTooltip = (feature) => {
    if (showFeatureTooltip !== feature) return null;
    
    const tooltipContent = {
      aiPowered: "AI analyzes maintenance requests and automatically categorizes them",
      statCards: "Real-time metrics of your property portfolio",
      maintenanceRequests: "Track and manage all maintenance requests in one place",
      jobStats: "Monitor your job metrics and earnings"
    };
    
    return (
      <SafeMotion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute -top-12 left-1/2 transform -translate-x-1/2 z-10 bg-slate-800 text-white p-2 rounded-md text-xs shadow-lg pointer-events-none whitespace-nowrap"
      >
        {tooltipContent[feature]}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-800"></div>
      </SafeMotion.div>
    );
  };
  
  return (
    <UIComponentErrorBoundary componentName="Dashboard Preview">
      <div className="dashboard-preview-container max-w-6xl mx-auto">
        {/* Toggle buttons */}
        <div className="flex justify-center mb-10">
          <div 
            className="inline-flex flex-wrap justify-center bg-neutral-100 dark:bg-neutral-800 rounded-full p-1 shadow-sm border border-border dark:border-border-dark"
            role="tablist"
            aria-label="Dashboard view selector"
          >
            <Button
              variant={activeTab === 'landlord' ? 'tab-active' : 'tab-inactive'}
              onClick={() => setActiveTab('landlord')}
              size="sm"
              role="tab"
              aria-selected={activeTab === 'landlord'}
              className="!rounded-full"
            >
              Landlord View
            </Button>
            <Button
              variant={activeTab === 'tenant' ? 'tab-active' : 'tab-inactive'}
              onClick={() => setActiveTab('tenant')}
              size="sm"
              role="tab"
              aria-selected={activeTab === 'tenant'}
              className="!rounded-full"
            >
              Tenant View
            </Button>
            <Button
              variant={activeTab === 'contractor' ? 'tab-active' : 'tab-inactive'}
              onClick={() => setActiveTab('contractor')}
              size="sm"
              role="tab"
              aria-selected={activeTab === 'contractor'}
              className="!rounded-full"
            >
              Contractor View
            </Button>
          </div>
        </div>
      
        <SafeMotion.div
          key={activeTab}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="dashboard-preview rounded-xl overflow-hidden shadow-xl border border-border dark:border-border-dark bg-background dark:bg-background-darkSubtle"
        >
          {/* Header */}
          <div className="bg-neutral-100 dark:bg-neutral-800 p-3 flex items-center border-b border-border dark:border-border-dark">
            <div className="flex space-x-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div className="text-sm font-medium text-content-secondary dark:text-content-darkSecondary mx-auto">
              {activeTab === 'landlord' ? 'Landlord Dashboard' : 
               activeTab === 'tenant' ? 'Tenant Dashboard' : 
               'Contractor Dashboard'}
            </div>
            <div
              className="px-2.5 py-1 bg-primary/10 border border-primary/20 rounded-md text-xs font-semibold text-primary dark:text-primary-light relative shadow-sm cursor-default"
              onMouseEnter={() => handleFeatureHover('aiPowered')}
              onMouseLeave={() => setShowFeatureTooltip(null)}
            >
              ✨ AI-Powered
              {renderTooltip('aiPowered')}
            </div>
          </div>
          
          {/* Dashboard content */}
          <div className="flex flex-col md:flex-row min-h-[450px]">
            {/* Sidebar */}
            <div className="w-full md:w-60 bg-background-subtle dark:bg-background-dark p-5 border-r border-border dark:border-border-dark">
              <div className="flex items-center mb-8">
                <div className="w-10 h-10 rounded-full bg-propagentic-teal flex items-center justify-center text-white text-lg font-bold shadow-inner">P</div>
                <div className="ml-3">
                  <div className="font-semibold text-gray-800 dark:text-gray-100">Propagentic Demo</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {activeTab === 'landlord' ? 'Landlord Account' : 
                     activeTab === 'tenant' ? 'Tenant Portal' : 
                     'Contractor Portal'}
                  </div>
                </div>
              </div>
              
              <nav className="space-y-2">
                <SidebarLink icon={<HomeIcon />} active>Dashboard</SidebarLink>
                {activeTab === 'contractor' ? (
                  <>
                    <SidebarLink icon={<BriefcaseIcon />}>Active Jobs</SidebarLink>
                    <SidebarLink icon={<ClipboardCheckIcon />}>Job History</SidebarLink>
                    <SidebarLink icon={<CurrencyDollarIcon />}>Earnings</SidebarLink>
                  </>
                ) : (
                  <>
                    <SidebarLink icon={<WrenchIcon />}>Maintenance</SidebarLink>
                    {activeTab === 'landlord' && <SidebarLink icon={<BuildingIcon />}>Properties</SidebarLink>}
                    {activeTab === 'tenant' && <SidebarLink icon={<PaymentIcon />}>Payments</SidebarLink>}
                  </>
                )}
                <SidebarLink icon={<SettingsIcon />}>Settings</SidebarLink>
              </nav>
            </div>
            
            {/* Main content */}
            <div className="flex-1 p-6 bg-background dark:bg-background-darkSubtle">
              <h2 className="text-2xl font-semibold text-content dark:text-content-dark mb-6">Dashboard Overview</h2>
              
              {/* Stats cards - for landlord view */}
              {activeTab === 'landlord' && (
                <div
                  className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8 relative"
                  onMouseEnter={() => handleFeatureHover('statCards')}
                  onMouseLeave={() => setShowFeatureTooltip(null)}
                >
                  {renderTooltip('statCards')}
                  <StatCard title="Total Properties" value="4" subValue="2 Multi-family, 2 Single-family" icon={<BuildingIcon className="w-5 h-5" />} />
                  <StatCard title="Total Units" value="16" subValue="14 Occupied, 2 Vacant" icon={<UnitsIcon className="w-5 h-5" />} />
                  <StatCard title="Occupancy Rate" value="87.5%" subValue="↑ 3.2% from last month" icon={<OccupancyIcon className="w-5 h-5" />} />
                </div>
              )}
              
              {/* Stats for tenant view */}
              {activeTab === 'tenant' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                  <StatCard title="Next Rent Payment" value="$1,250" subValue="Due in 7 days" icon={<RentPaymentIcon className="w-5 h-5" />} />
                  <StatCard title="Lease End Date" value="Sep 30, 2023" subValue="Renewal discussion in 60 days" icon={<CalendarIcon className="w-5 h-5" />} />
                </div>
              )}
              
              {/* Stats for contractor view */}
              {activeTab === 'contractor' && (
                <div
                  className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8 relative"
                  onMouseEnter={() => handleFeatureHover('jobStats')}
                  onMouseLeave={() => setShowFeatureTooltip(null)}
                >
                  {renderTooltip('jobStats')}
                  <StatCard title="Active Jobs" value="3" subValue="2 High priority, 1 Medium priority" icon={<BriefcaseIcon className="w-5 h-5" />} />
                  <StatCard title="Completed Jobs" value="28" subValue="This month: 7" icon={<ClipboardCheckIcon className="w-5 h-5" />} />
                  <StatCard title="Earnings" value="$3,850" subValue="↑ $750 from last month" icon={<CurrencyDollarIcon className="w-5 h-5" />} />
                </div>
              )}
              
              {/* Maintenance requests - dynamically show based on active tab */}
              <div 
                className="relative"
                onMouseEnter={() => handleFeatureHover('maintenanceRequests')}
                onMouseLeave={() => setShowFeatureTooltip(null)}
              >
                {renderTooltip('maintenanceRequests')}
                <h3 className="text-lg font-semibold text-content dark:text-content-dark mb-4">
                  {activeTab === 'landlord' ? 'Recent Maintenance Requests' : 
                   activeTab === 'tenant' ? 'My Maintenance Requests' :
                   'Available Jobs'}
                </h3>
                <div className="space-y-3">
                  {activeTab === 'landlord' ? maintenanceRequests.map(request => (
                    <MaintenanceRequestItem 
                      key={request.id} 
                      request={request} 
                      isActive={activeRequest === request.id}
                      onClick={() => setActiveRequest(request.id === activeRequest ? null : request.id)}
                      activeTab={activeTab}
                    />
                  )) : activeTab === 'tenant' ? tenantRequests.map(request => (
                    <MaintenanceRequestItem 
                      key={request.id} 
                      request={request} 
                      isActive={activeRequest === request.id}
                      onClick={() => setActiveRequest(request.id === activeRequest ? null : request.id)}
                      activeTab={activeTab}
                    />
                  )) : contractorJobs.map(job => (
                    <ContractorJobItem 
                      key={job.id} 
                      job={job} 
                      isActive={activeRequest === job.id}
                      onClick={() => setActiveRequest(job.id === activeRequest ? null : job.id)}
                    />
                  ))}
                </div>
                {/* Add Button for Tenant */}
                {activeTab === 'tenant' && (
                  <div className="mt-6">
                    <Button variant="primary" icon={<PlusIcon className="w-5 h-5"/>}>
                      Submit New Request
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </SafeMotion.div>
        
        <div className="mt-10 text-center">
          <Button to="/demo" size="lg" variant="outline" href="/demo">
            Explore Full Interactive Demo
          </Button>
        </div>
      </div>
    </UIComponentErrorBoundary>
  );
};

// --- Sub Components for Styling --- 

const SidebarLink = ({ icon, children, active = false }) => (
  <a href="#" className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 relative group ${
    active 
      ? 'text-primary dark:text-primary-light font-semibold bg-primary/10 dark:bg-primary/10'
      : 'text-content-secondary dark:text-content-darkSecondary hover:bg-neutral-100 dark:hover:bg-neutral-700/50'
  }`}>
    {active && (
      <span className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-md"></span>
    )}
    {React.cloneElement(icon, { 
      className: `w-5 h-5 mr-3 flex-shrink-0 ${active ? 'text-primary dark:text-primary-light' : 'text-neutral-400 dark:text-neutral-500 group-hover:text-content dark:group-hover:text-content-dark'}`
    })}
    {children}
  </a>
);

// Simplified StatCard component that uses the provided icon directly
const StatCard = ({ title, value, subValue, icon }) => {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 flex items-start gap-3">
      <div className="p-2 rounded-lg bg-gray-50 text-gray-600 flex-shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-sm text-gray-500 font-medium">{title}</div>
        <div className="text-xl font-semibold">{value}</div>
        {subValue && <div className="text-xs text-gray-500 mt-1">{subValue}</div>}
      </div>
    </div>
  );
};

const MaintenanceRequestItem = ({ request, isActive, onClick, activeTab }) => (
  <UIComponentErrorBoundary componentName="Maintenance Request Item">
    <div 
      className={`border border-border dark:border-border-dark rounded-xl transition-all duration-200 ${isActive ? 'bg-primary/5 dark:bg-primary/10 shadow-lg border-primary/30' : 'bg-background dark:bg-background-darkSubtle'}`}
    >
      <div 
        className="flex justify-between items-start p-4 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700/50" 
        onClick={onClick} 
        aria-expanded={isActive}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
      >
        <div className="flex-1 pr-4">
          <div className="text-md font-semibold text-content dark:text-content-dark mb-0.5">{request.title}</div>
          <div className="text-xs text-content-secondary dark:text-content-darkSecondary">{request.unit} • {request.timeAgo}</div>
        </div>
        <div className="flex items-center">
          <StatusPill status={request.status} className="mt-0.5 mr-3"/>
          <SafeMotion.div 
            animate={{ rotate: isActive ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-neutral-400 dark:text-neutral-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </SafeMotion.div>
        </div>
      </div>
      
      <AnimatePresence>
        {isActive && (
          <SafeMotion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0, transition: { duration: 0.2 } }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-3 border-t border-border dark:border-border-dark">
              <div className="text-sm text-content dark:text-content-dark">
                <p className="mb-3">
                  {activeTab === 'landlord' 
                  ? `Submitted by: ${request.id === 1 ? 'Alex Johnson' : 'Sarah Chen'} (Unit ${request.unit.split(' ')[1]})`
                  : 'Details: ' + (request.title.includes('faucet') 
                      ? 'Water is continuously dripping from the bathroom sink faucet even when turned off.' 
                      : 'The ceiling fan in the living room doesn\'t turn on when using the switch or pull chain.')
                  }
                </p>
                <div className="flex justify-between items-center">
                  <div className="text-xs text-content-subtle dark:text-content-darkSubtle">
                    ID: REQ-{2024000 + request.id}
                  </div>
                  <Button size="xs" variant="outline">
                    {activeTab === 'landlord' ? 'Manage Request' : 'View Details'}
                  </Button>
                </div>
              </div>
            </div>
          </SafeMotion.div>
        )}
      </AnimatePresence>
    </div>
  </UIComponentErrorBoundary>
);

const ContractorJobItem = ({ job, isActive, onClick }) => (
  <UIComponentErrorBoundary componentName="Contractor Job Item">
    <div 
      className={`border border-border dark:border-border-dark rounded-xl transition-all duration-200 ${isActive ? 'bg-primary/5 dark:bg-primary/10 shadow-lg border-primary/30' : 'bg-background dark:bg-background-darkSubtle'}`}
    >
      <div 
        className="flex justify-between items-start p-4 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700/50" 
        onClick={onClick} 
        aria-expanded={isActive}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
      >
        <div className="flex-1 pr-4">
          <div className="text-md font-semibold text-content dark:text-content-dark mb-0.5">{job.title}</div>
          <div className="text-xs text-content-secondary dark:text-content-darkSecondary">{job.location} • {job.timeAgo}</div>
        </div>
        <div className="flex items-center">
          <StatusPill status={job.status} className="mt-0.5 mr-3"/>
          <SafeMotion.div 
            animate={{ rotate: isActive ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-neutral-400 dark:text-neutral-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </SafeMotion.div>
        </div>
      </div>
      
      <AnimatePresence>
        {isActive && (
          <SafeMotion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0, transition: { duration: 0.2 } }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-3 border-t border-border dark:border-border-dark">
              <div className="text-sm text-content dark:text-content-dark">
                <p className="mb-3">
                  Client: {job.client}<br/>
                  {job.title.includes('faucet') 
                    ? 'Fix leaking faucet in bathroom that is dripping continuously. Client reports it may need new washers or cartridge.' 
                    : 'Regular HVAC maintenance and filter replacement. Client reports decreased efficiency and airflow.'}
                </p>
                <div className="flex justify-between items-center">
                  <div className="text-xs text-content-subtle dark:text-content-darkSubtle">
                    Job ID: JOB-{2024000 + job.id}
                  </div>
                  <Button size="xs" variant="outline">
                    View Job Details
                  </Button>
                </div>
              </div>
            </div>
          </SafeMotion.div>
        )}
      </AnimatePresence>
    </div>
  </UIComponentErrorBoundary>
);

export default DashboardPreview; 