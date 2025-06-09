/**
 * PropertyDashboardDemo - PropAgentic
 * 
 * Demo page for the Property Dashboard component
 */

import React, { useState } from 'react';
import PropertyDashboard from '../components/landlord/PropertyDashboard';
import { FadeIn, Container } from '../design-system';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { HomeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const PropertyDashboardDemo = () => {
  const [showDemo, setShowDemo] = useState(false);

  const handleViewProperty = (propertyId) => {
    console.log('Viewing property:', propertyId);
    alert(`Would navigate to property ${propertyId} details`);
  };

  const handleAddProperty = () => {
    console.log('Adding new property');
    alert('Would navigate to add property form');
  };

  const handleViewAllProperties = () => {
    console.log('Viewing all properties');
    alert('Would navigate to full property list');
  };

  if (showDemo) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="p-4">
          <Button
            variant="secondary"
            onClick={() => setShowDemo(false)}
            className="mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Overview
          </Button>
        </div>
        
        <PropertyDashboard
          onViewProperty={handleViewProperty}
          onAddProperty={handleAddProperty}
          onViewAllProperties={handleViewAllProperties}
        />
      </div>
    );
  }

  return (
    <FadeIn>
      <Container maxWidth="4xl" padding={true}>
        <div className="text-center mb-12">
          <HomeIcon className="mx-auto h-16 w-16 text-blue-600 dark:text-blue-400 mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Property Dashboard Demo
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Experience the comprehensive property dashboard with overview cards, 
            quick stats, and recent activity feed.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Dashboard Features
            </h2>
            <ul className="space-y-3 text-gray-600 dark:text-gray-400">
              <li>✅ Property overview cards with photos and status</li>
              <li>✅ Quick stats: occupancy, rent collected, maintenance</li>
              <li>✅ Recent activity feed with property actions</li>
              <li>✅ Responsive design for all device sizes</li>
              <li>✅ Real-time data from Firebase integration</li>
              <li>✅ Interactive navigation to property details</li>
              <li>✅ Quick actions for adding properties</li>
              <li>✅ Visual indicators for property health</li>
            </ul>
          </Card>

          <Card className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Stats & Analytics
            </h2>
            <ul className="space-y-3 text-gray-600 dark:text-gray-400">
              <li>📊 Total properties in portfolio</li>
              <li>📈 Occupancy rate percentage</li>
              <li>💰 Monthly rent collection amounts</li>
              <li>🔧 Properties requiring maintenance</li>
              <li>📅 Recent property activity timeline</li>
              <li>🏠 Property status distribution</li>
              <li>💼 Portfolio value calculations</li>
              <li>📱 Mobile-optimized viewing</li>
            </ul>
          </Card>
        </div>

        <div className="text-center">
          <Button
            variant="primary"
            size="lg"
            onClick={() => setShowDemo(true)}
            className="px-8 py-4"
          >
            <HomeIcon className="h-5 w-5 mr-2" />
            View Live Dashboard
          </Button>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            Interact with a fully functional property dashboard
          </p>
        </div>

        <Card className="mt-12 p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Dashboard Components
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Quick Stats Cards
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                Key metrics at a glance with trend indicators and color-coded status.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                    <HomeIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-green-500 text-sm">↗️</span>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Total Properties</p>
                <p className="text-lg font-bold text-blue-800 dark:text-blue-200">12</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Property Overview
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                Recent properties with photos, status, and quick view actions.
              </p>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-lg"></div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                      Sunset Apartments 3B
                    </p>
                    <p className="text-xs text-gray-500">Los Angeles, CA</p>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-400">2bed/2bath</span>
                      <span className="text-sm font-medium text-green-600">$3,500</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Activity Feed
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                Timeline of recent property events and financial activity.
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-1 rounded-full bg-green-100 dark:bg-green-900">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-900 dark:text-gray-100">Rent collected</p>
                    <p className="text-xs text-green-600 font-medium">$3,500</p>
                    <p className="text-xs text-gray-400">2 days ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-1 rounded-full bg-yellow-100 dark:bg-yellow-900">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-900 dark:text-gray-100">Property vacant</p>
                    <p className="text-xs text-gray-400">5 days ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </Container>
    </FadeIn>
  );
};

export default PropertyDashboardDemo; 