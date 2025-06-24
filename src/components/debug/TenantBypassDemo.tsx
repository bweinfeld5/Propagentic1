import React, { useState } from 'react';
import { Bell, Home, User, AlertTriangle } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { Skeleton } from '../ui/Skeleton';
import Button from '../ui/Button';
import RequestForm from '../tenant/RequestForm';
import RequestHistory from '../tenant/RequestHistory';
import HeaderBar from '../layout/HeaderBar';
import NotificationPanel from '../layout/NotificationPanel';
import PropertyList from '../PropertyList';

interface TenantBypassDemoProps {
  currentUser: any;
  userProfile: any;
}

const TenantBypassDemo: React.FC<TenantBypassDemoProps> = ({ currentUser, userProfile }) => {
  const [filter, setFilter] = useState('all');
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  
  // Mock empty data for demonstration
  const mockProperty = {
    id: 'demo-property-123',
    name: 'Demo Apartment Complex',
    nickname: 'Demo Complex',
    streetAddress: '123 Test Street',
    address: '123 Test Street',
    landlordName: 'Demo Landlord',
    landlordEmail: 'demo@landlord.com'
  };

  const emptyTickets: any[] = [];
  
  const handleRequestSuccess = () => {
    toast.success('Demo: Maintenance request would be submitted here!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Notification Panel */}
      <NotificationPanel 
        isOpen={notificationPanelOpen} 
        onClose={() => setNotificationPanelOpen(false)} 
      />
      
      {/* Header Bar with filter options */}
      <HeaderBar filter={filter} setFilter={setFilter} />
      
      {/* Mobile Notification Button */}
      <div className="md:hidden fixed bottom-4 right-4 z-20">
        <button
          type="button"
          className="p-3 rounded-full bg-[#176B5D] text-white shadow-lg hover:bg-teal-700 focus:outline-none"
          onClick={() => setNotificationPanelOpen(true)}
        >
          <Bell className="h-6 w-6" />
        </button>
      </div>

      <main className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Demo Banner */}
          <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-6 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <User className="h-5 w-5 text-orange-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-orange-800">
                  🧪 Tenant Demo Mode - Empty State
                </h3>
                <div className="mt-2 text-sm text-orange-700">
                  <p>
                    This is a demonstration of the tenant interface with no maintenance requests.
                    This shows what a new tenant would see when they first access their dashboard.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Property Management Section - Mock Property */}
          <div className="mb-8">
            <PropertyList
              properties={[mockProperty]}
              onRequestMaintenance={(propertyId) => {
                toast.success(`Demo: Would open maintenance form for property ${propertyId}`);
              }}
            />
          </div>

          {/* Maintenance Section - Show interface with empty data */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* New Maintenance Request Form */}
            <div className="lg:col-span-1">
              <RequestForm 
                onSuccess={handleRequestSuccess} 
                currentUser={currentUser}
                userProfile={userProfile}
              />
            </div>
            
            {/* Maintenance Request History - Empty State */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Maintenance Request History</h3>
                
                {/* Empty State */}
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Home className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No Maintenance Requests Yet</h4>
                  <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                    When you submit maintenance requests, they'll appear here. You can track their status and communicate with your landlord.
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4 text-left max-w-sm mx-auto">
                    <h5 className="font-medium text-gray-900 mb-2">What you can do:</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Submit maintenance requests using the form on the left</li>
                      <li>• Upload photos to help describe issues</li>
                      <li>• Track request status and updates</li>
                      <li>• Communicate with your landlord about repairs</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Demo Information */}
          <div className="mt-8 bg-blue-50 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-blue-900 mb-3">🎯 Demo Features Available</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="font-medium text-blue-800 mb-2">Functional Components:</h5>
                <ul className="text-blue-700 space-y-1">
                  <li>• Maintenance request form (demo mode)</li>
                  <li>• Property information display</li>
                  <li>• Notification panel</li>
                  <li>• Filter controls</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium text-blue-800 mb-2">Demo Behaviors:</h5>
                <ul className="text-blue-700 space-y-1">
                  <li>• Form submissions show success messages</li>
                  <li>• No actual data is saved</li>
                  <li>• All interactions are safe to test</li>
                  <li>• Shows empty states for new tenants</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TenantBypassDemo;