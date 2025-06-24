import React, { useState } from 'react';
import { Bell, Home, User, AlertTriangle, Clock, CheckCircle, Camera } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import Button from '../components/ui/Button';
import { PropAgenticMark } from '../components/brand/PropAgenticMark';

const TenantDemo = () => {
  const [filter, setFilter] = useState('all');
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  
  // Mock data for demonstration
  const mockUser = {
    uid: 'demo-tenant-123',
    email: 'tenant@demo.com',
    displayName: 'Demo Tenant'
  };

  const mockProperty = {
    id: 'demo-property-123',
    name: 'Sunset Vista Apartments',
    nickname: 'Sunset Vista',
    streetAddress: '123 Demo Street, Demo City, DC 12345',
    landlordName: 'Demo Landlord',
    landlordEmail: 'landlord@demo.com'
  };

  const handleSubmitRequest = (e) => {
    e.preventDefault();
    toast.success('🎉 Demo: Maintenance request submitted successfully!');
    setShowRequestForm(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <PropAgenticMark className="h-8 w-8" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Tenant Dashboard</h1>
                <p className="text-sm text-gray-600">Demo Mode - Empty State</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {mockUser.displayName}</span>
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </div>
      </header>

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
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6 mb-8">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-purple-900 mb-2">
                  🧪 Tenant Interface Demo - Empty State
                </h3>
                <p className="text-purple-700 mb-4">
                  This demonstrates what a new tenant sees when they first access their dashboard. 
                  No maintenance requests have been submitted yet, showing the clean empty state.
                </p>
                <div className="bg-white rounded-lg p-4 border border-purple-200">
                  <h4 className="font-medium text-purple-900 mb-2">Demo Features Available:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-purple-700">
                    <div>• ✅ Property information display</div>
                    <div>• ✅ Maintenance request form</div>
                    <div>• ✅ Empty state messaging</div>
                    <div>• ✅ Responsive design</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Property Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Property</h2>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Home className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{mockProperty.name}</h3>
                  <p className="text-gray-600 mb-2">{mockProperty.streetAddress}</p>
                  <div className="flex items-center text-sm text-gray-500">
                    <span>Managed by {mockProperty.landlordName}</span>
                  </div>
                </div>
                <Button
                  onClick={() => setShowRequestForm(true)}
                  variant="primary"
                  className="flex items-center space-x-2"
                >
                  <span>Submit Request</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Maintenance Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Maintenance Request Form */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Submit Maintenance Request</h3>
                
                {!showRequestForm ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertTriangle className="w-8 h-8 text-orange-600" />
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Need Maintenance?</h4>
                    <p className="text-gray-600 mb-6">
                      Click below to submit a maintenance request for your property.
                    </p>
                    <Button
                      onClick={() => setShowRequestForm(true)}
                      variant="primary"
                      className="w-full"
                    >
                      Create Request
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitRequest} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Issue Title
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Brief description of the issue"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                        <option value="">Select a category</option>
                        <option value="plumbing">Plumbing</option>
                        <option value="electrical">Electrical</option>
                        <option value="hvac">HVAC</option>
                        <option value="appliance">Appliance</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Urgency
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                        <option value="low">Low - Can wait a few days</option>
                        <option value="medium">Medium - Should be addressed soon</option>
                        <option value="high">High - Needs immediate attention</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Detailed description of the maintenance issue..."
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Photo (Optional)
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          Click to upload a photo of the issue
                        </p>
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <Button
                        type="button"
                        onClick={() => setShowRequestForm(false)}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        className="flex-1"
                      >
                        Submit Request
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Maintenance Request History - Empty State */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Maintenance Request History</h3>
                
                {/* Filter Tabs */}
                <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
                  {['all', 'pending', 'in-progress', 'completed'].map((filterType) => (
                    <button
                      key={filterType}
                      onClick={() => setFilter(filterType)}
                      className={`px-3 py-2 text-sm font-medium rounded-md capitalize transition-colors ${
                        filter === filterType
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {filterType === 'all' ? 'All' : filterType.replace('-', ' ')}
                    </button>
                  ))}
                </div>

                {/* Empty State */}
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-gray-400" />
                  </div>
                  <h4 className="text-xl font-medium text-gray-900 mb-3">No Maintenance Requests Yet</h4>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    When you submit maintenance requests, they'll appear here. You can track their status and communicate with your landlord.
                  </p>
                  
                  <div className="bg-gray-50 rounded-xl p-6 text-left max-w-lg mx-auto">
                    <h5 className="font-semibold text-gray-900 mb-4">What happens when you submit a request:</h5>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-semibold text-blue-600">1</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Request Submitted</p>
                          <p className="text-xs text-gray-600">Your landlord receives an immediate notification</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-semibold text-yellow-600">2</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Under Review</p>
                          <p className="text-xs text-gray-600">Landlord reviews and schedules the work</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-semibold text-green-600">3</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Completed</p>
                          <p className="text-xs text-gray-600">You receive confirmation when work is done</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Back to Main App */}
          <div className="mt-8 text-center">
            <Button
              onClick={() => window.close()}
              variant="outline"
              className="mr-4"
            >
              Close Demo
            </Button>
            <Button
              onClick={() => window.location.href = '/test'}
              variant="secondary"
            >
              Back to Test Page
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TenantDemo; 