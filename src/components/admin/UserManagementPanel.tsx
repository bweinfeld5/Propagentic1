import React, { useState, useEffect, useCallback } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  UserPlusIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowDownTrayIcon,
  UserIcon,
  CalendarIcon,
  EnvelopeIcon,
  PhoneIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import CreateEditUserModal from './CreateEditUserModal';
import DeleteUserConfirmationModal from './DeleteUserConfirmationModal';
import adminService, { User, UserFilters } from '../../services/adminService';
import toast from 'react-hot-toast';

interface UserManagementPanelProps {
  roleFilter?: string;
}

const UserManagementPanel: React.FC<UserManagementPanelProps> = ({ roleFilter }) => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Modal states
  const [showCreateEditModal, setShowCreateEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 25;

  const [filters, setFilters] = useState<UserFilters>({
    role: roleFilter || 'all',
    status: 'all',
    search: '',
    dateRange: 'all'
  });

  // Load users with pagination and filtering
  const loadUsers = useCallback(async (reset = false) => {
    setIsLoading(true);

    try {
      const result = await adminService.getUsers(
        {
          role: filters.role,
          status: filters.status,
          dateRange: filters.dateRange
        },
        {
          pageSize: pageSize
        }
      );

      if (reset) {
        setUsers(result.users);
        setCurrentPage(1);
      } else {
        setUsers(prev => [...prev, ...result.users]);
      }

      setHasMore(result.hasMore);
    } catch (error: any) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, [filters, pageSize]);

  // Filter users by search term
  useEffect(() => {
    const searchResults = adminService.searchUsers(filters.search || '', users);
    setFilteredUsers(searchResults);
  }, [users, filters.search]);

  useEffect(() => {
    loadUsers(true);
  }, [loadUsers]);

  // Event handlers
  const handleCreateUser = () => {
    setSelectedUser(null);
    setShowCreateEditModal(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowCreateEditModal(true);
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowUserDetailsModal(true);
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleUserSaved = () => {
    loadUsers(true);
    setSelectedUser(null);
  };

  const handleUserDeleted = () => {
    loadUsers(true);
    setUserToDelete(null);
  };

  const handleQuickStatusChange = async (userId: string, newStatus: string) => {
    try {
      await adminService.updateUserStatus(userId, newStatus, currentUser?.uid);
      
      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      ));

      toast.success(`User status updated to ${newStatus}`);
    } catch (error: any) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    }
  };

  const handleExportUsers = () => {
    adminService.exportUsersToCSV(filteredUsers);
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="w-4 h-4 text-green-600" />;
      case 'suspended':
        return <XCircleIcon className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <ClockIcon className="w-4 h-4 text-yellow-600" />;
      case 'deleted':
        return <XCircleIcon className="w-4 h-4 text-gray-600" />;
      default:
        return <ExclamationTriangleIcon className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadgeColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'suspended':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'deleted':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {roleFilter ? `${roleFilter.charAt(0).toUpperCase() + roleFilter.slice(1)} Management` : 'User Management'}
          </h2>
          <p className="text-gray-600">
            Manage user accounts, roles, and permissions
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExportUsers}
            className="flex items-center gap-2"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            Export
          </Button>
          
          <Button
            onClick={handleCreateUser}
            className="flex items-center gap-2"
          >
            <UserPlusIcon className="w-4 h-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          {!roleFilter && (
            <select
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="landlord">Landlords</option>
              <option value="tenant">Tenants</option>
              <option value="contractor">Contractors</option>
              <option value="admin">Admins</option>
            </select>
          )}

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="pending">Pending</option>
            <option value="deleted">Deleted</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user, index) => (
                <tr key={`${user.id}-${index}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-gray-600">
                          {adminService.formatUserName(user).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {adminService.formatUserName(user)}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <EnvelopeIcon className="w-3 h-3" />
                          {user.email}
                        </div>
                        {user.phone && (
                          <div className="text-xs text-gray-400 flex items-center gap-1">
                            <PhoneIcon className="w-3 h-3" />
                            {user.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${adminService.getRoleColor(user.role)}`}>
                      {user.role ? user.role.replace('_', ' ').toUpperCase() : 'NO ROLE'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(user.status)}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${getStatusBadgeColor(user.status)}`}>
                        {user.status ? user.status.replace(/_/g, ' ') : 'unknown'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="w-4 h-4" />
                      {user.createdAt ? user.createdAt.toLocaleDateString() : 'Unknown'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastLoginAt ? user.lastLoginAt.toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      {/* Quick Actions */}
                      <button
                        onClick={() => handleViewUser(user)}
                        className="text-gray-600 hover:text-gray-900 p-1 rounded-md hover:bg-gray-100"
                        title="View Details"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-50"
                        title="Edit User"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      
                      {/* Quick Status Change */}
                      <select
                        value={user.status || 'pending'}
                        onChange={(e) => handleQuickStatusChange(user.id, e.target.value)}
                        className="text-xs border border-gray-300 rounded px-2 py-1 hover:border-gray-400"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                        <option value="pending">Pending</option>
                      </select>
                      
                      <button
                        onClick={() => handleDeleteUser(user)}
                        className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50"
                        title="Delete User"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="px-6 py-4 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600 mx-auto"></div>
          </div>
        )}

        {/* Load more button */}
        {hasMore && !isLoading && (
          <div className="px-6 py-4 text-center border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => loadUsers(false)}
              className="w-full"
            >
              Load More Users
            </Button>
          </div>
        )}

        {/* Empty state */}
        {filteredUsers.length === 0 && !isLoading && (
          <div className="px-6 py-12 text-center">
            <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-600 mb-4">
              {filters.search || filters.role !== 'all' || filters.status !== 'all'
                ? 'Try adjusting your filters to see more results.'
                : 'No users have been created yet.'}
            </p>
            <Button onClick={handleCreateUser} className="flex items-center gap-2 mx-auto">
              <UserPlusIcon className="w-4 h-4" />
              Create First User
            </Button>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateEditUserModal
        isOpen={showCreateEditModal}
        onClose={() => setShowCreateEditModal(false)}
        user={selectedUser}
        onUserSaved={handleUserSaved}
      />

      <DeleteUserConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        user={userToDelete}
        onUserDeleted={handleUserDeleted}
      />

      {/* User Details Modal (Simple for now) */}
      {showUserDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">User Details</h2>
              <button
                onClick={() => setShowUserDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-xl font-medium text-gray-600">
                    {adminService.formatUserName(selectedUser).charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {adminService.formatUserName(selectedUser)}
                  </h3>
                  <p className="text-gray-600">{selectedUser.email}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-500">Role:</span>
                  <p className="mt-1">{selectedUser.role || 'Not assigned'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Status:</span>
                  <p className="mt-1 capitalize">{selectedUser.status || 'Unknown'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Phone:</span>
                  <p className="mt-1">{selectedUser.phone || 'Not provided'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Created:</span>
                  <p className="mt-1">{selectedUser.createdAt ? selectedUser.createdAt.toLocaleDateString() : 'Unknown'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Last Login:</span>
                  <p className="mt-1">{selectedUser.lastLoginAt?.toLocaleDateString() || 'Never'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Profile Complete:</span>
                  <p className="mt-1">{selectedUser.profileComplete ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <Button variant="outline" onClick={() => setShowUserDetailsModal(false)}>
                Close
              </Button>
              <Button onClick={() => {
                setShowUserDetailsModal(false);
                handleEditUser(selectedUser);
              }}>
                Edit User
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPanel; 