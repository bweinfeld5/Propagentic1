import React from 'react';
import { useAuth } from 'context/AuthContext';
import { Link } from 'react-router-dom';
import { HomeIcon, UsersIcon, DocumentTextIcon, CogIcon } from '@heroicons/react/24/outline';
import Button from '../ui/Button';

const Dashboard = () => {
  const { userProfile, isLandlord, isTenant, isContractor } = useAuth();

  // Role-specific dashboard content
  const getLandlordDashboard = () => (
    <>
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Property Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-800">Total Properties</h3>
            <p className="text-2xl font-bold">5</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-medium text-green-800">Active Tenants</h3>
            <p className="text-2xl font-bold">12</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-medium text-purple-800">Maintenance Requests</h3>
            <p className="text-2xl font-bold">3</p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <ul className="divide-y divide-gray-200">
          <li className="py-3">
            <div className="flex items-center space-x-3">
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">New Tenant</span>
              <p className="text-gray-800">John Smith has been added to Apartment 3B</p>
            </div>
            <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
          </li>
          <li className="py-3">
            <div className="flex items-center space-x-3">
              <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">Maintenance</span>
              <p className="text-gray-800">New request for plumbing issue at 45 Main St</p>
            </div>
            <p className="text-xs text-gray-500 mt-1">Yesterday</p>
          </li>
          <li className="py-3">
            <div className="flex items-center space-x-3">
              <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">Payment</span>
              <p className="text-gray-800">Rent payment received from Apartment 2A</p>
            </div>
            <p className="text-xs text-gray-500 mt-1">2 days ago</p>
          </li>
        </ul>
      </div>
    </>
  );

  const getTenantDashboard = () => (
    <>
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Your Apartment</h2>
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <p className="text-gray-600">123 Main Street, Apt 4B</p>
            <p className="text-gray-600">Lease ends: June 30, 2023</p>
          </div>
          <button className="mt-4 md:mt-0 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Report an Issue
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Payment Information</h2>
          <div className="mb-4">
            <p className="text-gray-600">Next payment due:</p>
            <p className="text-xl font-semibold">May 1, 2023</p>
          </div>
          <div className="mb-4">
            <p className="text-gray-600">Amount:</p>
            <p className="text-xl font-semibold">$1,250.00</p>
          </div>
          <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
            Make a Payment
          </button>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Maintenance Requests</h2>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded mr-2">In Progress</span>
                <p className="text-gray-800">Leaking faucet in bathroom</p>
              </div>
              <p className="text-xs text-gray-500">Reported on Apr 15</p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded mr-2">Completed</span>
                <p className="text-gray-800">Replace smoke detector batteries</p>
              </div>
              <p className="text-xs text-gray-500">Completed on Mar 28</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const getContractorDashboard = () => (
    <>
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Available Jobs</h2>
        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-800">New Jobs</h3>
            <p className="text-2xl font-bold">3</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-medium text-yellow-800">In Progress</h3>
            <p className="text-2xl font-bold">2</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-medium text-green-800">Completed this Month</h3>
            <p className="text-2xl font-bold">7</p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Job Requests</h2>
        <ul className="divide-y divide-gray-200">
          <li className="py-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Plumbing Repair - 123 Main St, Apt 4B</h3>
                <p className="text-sm text-gray-600">Leaking faucet in bathroom</p>
                <div className="flex items-center mt-1">
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">Plumbing</span>
                  <span className="text-xs text-gray-500 ml-2">Posted 1 day ago</span>
                </div>
              </div>
              <button className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700">
                Accept Job
              </button>
            </div>
          </li>
          <li className="py-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Electrical Work - 45 Park Avenue, Apt 2A</h3>
                <p className="text-sm text-gray-600">Replace light fixtures in kitchen</p>
                <div className="flex items-center mt-1">
                  <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">Electrical</span>
                  <span className="text-xs text-gray-500 ml-2">Posted 3 days ago</span>
                </div>
              </div>
              <button className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700">
                Accept Job
              </button>
            </div>
          </li>
        </ul>
      </div>
    </>
  );

  // Render dashboard based on user role
  return (
    <div className="p-6 bg-background dark:bg-background-dark">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-content dark:text-content-dark">Dashboard</h1>
          <p className="mt-1 text-sm text-content-secondary dark:text-content-darkSecondary">
            Overview of your property management activities.
          </p>
        </div>
        <Button variant="primary" className="mt-4 md:mt-0">
          Create New Request
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Stats Cards - Use theme colors */}
        {stats.map((stat) => (
          <div key={stat.name} className={`p-4 rounded-lg shadow ${stat.color.replace('bg-', 'bg-opacity-20 ')} dark:bg-opacity-30 border border-transparent hover:border-current`}>
            <p className={`text-sm font-medium ${stat.textColor.replace('-800', '-700')} dark:${stat.textColor.replace('-800', '-300')} truncate`}>{stat.name}</p>
            <p className={`mt-1 text-3xl font-semibold ${stat.textColor.replace('-800', '-900')} dark:${stat.textColor.replace('-800', '-100')}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-background dark:bg-background-darkSubtle p-6 rounded-lg shadow border border-border dark:border-border-dark">
          <h2 className="text-lg font-semibold text-content dark:text-content-dark mb-4">Recent Activity</h2>
          <ul className="divide-y divide-border dark:divide-border-dark">
            {recentActivity.map((activity) => (
              <li key={activity.id} className="py-3 flex justify-between items-center">
                <div>
                  <p className="text-sm text-content dark:text-content-dark">
                    <span className="font-medium">{activity.user}</span> {activity.action}
                  </p>
                </div>
                <span className="text-xs text-content-subtle dark:text-content-darkSubtle">{activity.time}</span>
              </li>
            ))}
          </ul>
          <Button variant="outline" size="sm" className="mt-4 w-full">View All Activity</Button>
        </div>

        <div className="bg-background dark:bg-background-darkSubtle p-6 rounded-lg shadow border border-border dark:border-border-dark">
          <h2 className="text-lg font-semibold text-content dark:text-content-dark mb-4">Quick Links</h2>
          <nav className="space-y-2">
            <Link to="/maintenance/new" className="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-content-secondary dark:text-content-darkSecondary hover:bg-neutral-100 dark:hover:bg-neutral-700/50 hover:text-primary dark:hover:text-primary-light">
              <DocumentTextIcon className="mr-3 h-5 w-5 text-neutral-400 dark:text-neutral-500 group-hover:text-primary dark:group-hover:text-primary-light" /> New Request
            </Link>
            <Link to="/tenants" className="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-content-secondary dark:text-content-darkSecondary hover:bg-neutral-100 dark:hover:bg-neutral-700/50 hover:text-primary dark:hover:text-primary-light">
              <UsersIcon className="mr-3 h-5 w-5 text-neutral-400 dark:text-neutral-500 group-hover:text-primary dark:group-hover:text-primary-light" /> Manage Tenants
            </Link>
            <Link to="/settings" className="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-content-secondary dark:text-content-darkSecondary hover:bg-neutral-100 dark:hover:bg-neutral-700/50 hover:text-primary dark:hover:text-primary-light">
              <CogIcon className="mr-3 h-5 w-5 text-neutral-400 dark:text-neutral-500 group-hover:text-primary dark:group-hover:text-primary-light" /> Settings
            </Link>
          </nav>
        </div>
      </div>

      {/* Fallback if role is not recognized */}
      {!isLandlord() && !isTenant() && !isContractor() && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Your role doesn't appear to be set correctly. Please contact support.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 