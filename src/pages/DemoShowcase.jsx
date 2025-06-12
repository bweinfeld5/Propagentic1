import React, { useState } from 'react';
import { ClipboardIcon, CheckIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { PropAgenticMark } from '../components/brand/PropAgenticMark';
import Button from '../components/ui/Button';

const DemoShowcase = () => {
  const [copiedCode, setCopiedCode] = useState(null);

  const copyToClipboard = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  // Updated demo codes that will be created in Firestore
  const demoCodes = [
    {
      code: 'DEMO2024',
      property: 'Skyline Towers - Unit 2401',
      type: 'Luxury High-Rise',
      location: 'San Francisco, CA',
      description: 'Experience premium amenities including gym, pool, concierge, and rooftop deck with stunning city views.',
      rent: '$4,500/month',
      features: ['2 bed', '2 bath', '1,200 sqft', 'Pet-friendly']
    },
    {
      code: 'FAMILY01',
      property: 'Maple Street Family Home',
      type: 'Single-Family House',
      location: 'Palo Alto, CA',
      description: 'Perfect for families with spacious rooms, garden, garage, and modern amenities.',
      rent: '$5,500/month',
      features: ['3 bed', '2 bath', '1,800 sqft', 'Garden & Garage']
    },
    {
      code: 'STUDENT1',
      property: 'University Commons - Room 312',
      type: 'Student Housing',
      location: 'Berkeley, CA',
      description: 'Modern student accommodation near UC Berkeley with study spaces and high-speed WiFi.',
      rent: '$1,200/month',
      features: ['1 bed', '1 bath', '400 sqft', 'Study rooms']
    },
    {
      code: 'LOFT2024',
      property: 'Industrial Loft - Unit 5B',
      type: 'Urban Loft',
      location: 'Oakland, CA',
      description: 'Converted warehouse loft with exposed brick, high ceilings, and artist-friendly spaces.',
      rent: '$3,200/month',
      features: ['1 bed', '1 bath', '900 sqft', 'High ceilings']
    },
    {
      code: 'BUDGET99',
      property: 'Affordable Gardens - Apt 12C',
      type: 'Budget-Friendly',
      location: 'San Jose, CA',
      description: 'Community-focused living with amenities like pool, playground, and community garden.',
      rent: '$2,200/month',
      features: ['2 bed', '1 bath', '800 sqft', 'Community amenities']
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <PropAgenticMark className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">PropAgentic Demo</h1>
                <p className="text-sm text-gray-600">Experience real property management workflows</p>
              </div>
            </div>
            <Button 
              variant="primary" 
              onClick={() => {
                // Implement the logic to redirect to the registration page
              }}
              icon={<ArrowRightIcon className="h-4 w-4" />}
            >
              Try Demo
            </Button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Real Property Management Experience
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Our demo properties are now stored in Firestore with real invite codes, giving you an authentic experience of the PropAgentic platform.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-4xl mx-auto">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">🎯 New & Improved Demo System</h3>
            <p className="text-blue-800 text-left">
              <strong>✅ Real Firestore Integration:</strong> Demo properties are actual documents in our database<br/>
              <strong>✅ Authentic Workflow:</strong> Same validation and redemption process as production<br/>
              <strong>✅ Persistent Data:</strong> Your demo experience maintains state across sessions<br/>
              <strong>✅ Best Practice Architecture:</strong> Single source of truth for all property data
            </p>
          </div>
        </div>

        {/* Demo Flow Steps */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">How to Experience the Demo</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-teal-600">1</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Register Account</h4>
              <p className="text-sm text-gray-600">Create a new tenant account to get started</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-teal-600">2</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Enter Invite Code</h4>
              <p className="text-sm text-gray-600">First step of onboarding requires a valid property code</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-teal-600">3</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Complete Profile</h4>
              <p className="text-sm text-gray-600">Finish setting up your tenant profile</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-teal-600">4</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Explore Features</h4>
              <p className="text-sm text-gray-600">Access your dashboard with full maintenance tools</p>
            </div>
          </div>
        </div>

        {/* Demo Properties */}
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Available Demo Properties</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {demoCodes.map((demo, index) => (
              <div key={demo.code} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="p-8">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800 mb-2">
                        {demo.type}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{demo.property}</h3>
                      <p className="text-gray-600 text-sm">{demo.location}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-teal-600">{demo.rent}</div>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-4">{demo.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    {demo.features.map((feature, idx) => (
                      <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {feature}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Invite Code:</label>
                      <div className="font-mono text-lg font-bold text-gray-900">{demo.code}</div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(demo.code)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                    >
                      {copiedCode === demo.code ? (
                        <>
                          <CheckIcon className="h-4 w-4 mr-2 text-green-500" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <ClipboardIcon className="h-4 w-4 mr-2" />
                          Copy Code
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Setup Instructions for Developers */}
        <div className="mt-16 bg-gray-50 rounded-xl p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">🔧 For Developers: Setting Up Demo Properties</h3>
          <div className="bg-white rounded-lg p-6 mb-4">
            <h4 className="font-semibold text-gray-900 mb-2">To enable these demo codes, run:</h4>
            <div className="bg-gray-900 rounded-lg p-4 text-green-400 font-mono text-sm">
              node scripts/createDemoProperties.js
            </div>
            <p className="text-sm text-gray-600 mt-2">
              This script creates the demo properties in your Firestore database with the exact codes shown above.
              Requires appropriate Firestore write permissions.
            </p>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Alternative Setup Methods:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Manually create property documents in Firestore console</li>
              <li>• Use Firebase Admin SDK with elevated permissions</li>
              <li>• Deploy as a Cloud Function for proper access control</li>
              <li>• Set up demo data during application initialization</li>
            </ul>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-teal-500 to-blue-600 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">Ready to Experience PropAgentic?</h3>
            <p className="text-teal-100 mb-6 max-w-2xl mx-auto">
              Join thousands of property managers and tenants who are streamlining their workflows with our platform.
            </p>
            <div className="space-x-4">
              <Button 
                variant="secondary" 
                size="lg"
                onClick={() => {
                  // Implement the logic to redirect to the registration page
                }}
                className="bg-white text-teal-600 hover:bg-gray-50"
                icon={<ArrowRightIcon className="h-5 w-5" />}
              >
                Start Demo Experience
              </Button>
              <Button 
                variant="secondary" 
                size="lg"
                onClick={() => {
                  // Implement the logic to redirect to the about page
                }}
                className="bg-white text-white hover:bg-opacity-10"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoShowcase; 