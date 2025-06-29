import React, { useState } from 'react';
import {
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import AdminNotifications from './AdminNotifications';
import { PropAgenticMark } from '../brand/PropAgenticMark';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  view: string;
  adminLevel?: 'moderator' | 'admin' | 'super_admin';
}

interface AdminLayoutProps {
  children: React.ReactNode;
  navigationItems: NavigationItem[];
  currentView: string;
  onViewChange: (view: string) => void;
  actionBar?: React.ReactNode;
  userProfile?: any;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  navigationItems,
  currentView,
  onViewChange,
  actionBar,
  userProfile
}) => {
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'moderator':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`${mobile ? 'lg:hidden' : 'hidden lg:flex'} flex-col w-64 bg-gray-900`}>
      {/* Logo */}
      <div className="flex items-center justify-center h-16 px-4 border-b border-gray-700">
        <PropAgenticMark className="h-8 w-auto" />
        <span className="ml-2 text-white text-lg font-semibold">Admin</span>
      </div>

      {/* Admin Role Badge */}
      <div className="px-4 py-3 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <ShieldCheckIcon className="w-5 h-5 text-gray-400" />
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(userProfile?.role)}`}>
            {userProfile?.role?.replace('_', ' ').toUpperCase() || 'ADMIN'}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigationItems.map((item) => {
          const isActive = currentView === item.view;
          return (
            <button
              key={item.id}
              onClick={() => {
                onViewChange(item.view);
                if (mobile) setSidebarOpen(false);
              }}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-red-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center">
          <UserCircleIcon className="w-8 h-8 text-gray-400" />
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {userProfile?.displayName || userProfile?.email || 'Admin User'}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {userProfile?.email}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="w-full mt-3 flex items-center px-3 py-2 text-sm font-medium text-gray-300 rounded-lg hover:bg-gray-800 hover:text-white transition-colors"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div 
            className="fixed inset-0 bg-gray-600 bg-opacity-75" 
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative flex flex-col w-64 h-full bg-gray-900">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <XMarkIcon className="h-6 w-6 text-white" />
              </button>
            </div>
            <Sidebar mobile={true} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="bg-white border-b border-gray-200 lg:border-b-0">
          <div className="flex items-center justify-between px-4 py-2 lg:px-6">
            {/* Mobile menu button */}
            <button
              type="button"
              className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              onClick={() => setSidebarOpen(true)}
            >
              <Bars3Icon className="h-6 w-6" />
            </button>

            {/* Desktop header content is handled by actionBar */}
            <div className="hidden lg:block flex-1">
              {/* Action bar will be rendered here */}
            </div>

            {/* Header actions */}
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg relative"
                >
                  <BellIcon className="w-6 h-6" />
                  {/* Notification badge */}
                  <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500" />
                </button>
                
                {showNotifications && (
                  <AdminNotifications 
                    onClose={() => setShowNotifications(false)}
                  />
                )}
              </div>

              {/* User menu */}
              <div className="relative lg:block">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                >
                  <UserCircleIcon className="w-6 h-6" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {userProfile?.displayName || 'Admin User'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {userProfile?.email}
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Action bar */}
        {actionBar && (
          <div className="lg:block hidden">
            {actionBar}
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-auto bg-gray-50">
          {children}
        </main>
      </div>

      {/* Click outside handlers */}
      {showNotifications && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => setShowNotifications(false)}
        />
      )}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </div>
  );
};

export default AdminLayout; 