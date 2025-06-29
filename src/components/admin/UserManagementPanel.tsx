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
  PhoneIcon
} from '@heroicons/react/24/outline';
import Button from '../ui/Button';
import StatusPill from '../ui/StatusPill';
import { useAuth } from '../../context/AuthContext';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  name?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  userType?: string;
  status?: string;
  phone?: string;
  createdAt: Date;
  lastLoginAt?: Date;
  profileComplete?: boolean;
  emailVerified?: boolean;
}

interface UserFilters {
  role: 'all' | 'landlord' | 'tenant' | 'contractor' | 'admin';
  status: 'all' | 'active' | 'suspended' | 'pending' | 'deleted';
  search: string;
  dateRange: 'all' | 'today' | 'week' | 'month' | 'year';
}

interface UserManagementPanelProps {
  roleFilter?: string;
}

const UserManagementPanel: React.FC<UserManagementPanelProps> = ({ roleFilter }) => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 25;

  const [filters, setFilters] = useState<UserFilters>({
    role: roleFilter as any || 'all',
    status: 'all',
    search: '',
    dateRange: 'all'
  });

  // Load users with pagination and filtering
  const loadUsers = useCallback(async (reset = false) => {
    setIsLoading(true);

    try {
      let q = query(collection(db, 'users'));

      // Apply role filter
      if (filters.role !== 'all') {
        q = query(q, where('role', '==', filters.role));
      }

      // Apply status filter
      if (filters.status !== 'all') {
        q = query(q, where('status', '==', filters.status));
      }

      // Apply date range filter (temporarily disabled due to index requirements)
      // TODO: Add proper date filtering once composite indexes are set up
      if (false && filters.dateRange !== 'all') {
        const now = new Date();
        const startDate = new Date();
        
        switch (filters.dateRange) {
          case 'today':
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
          case 'year':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        }
        
        // Use ISO string for date comparison since createdAt might be stored as string
        q = query(q, where('createdAt', '>=', startDate.toISOString()));
      }

      // Apply pagination (ordering temporarily disabled due to index requirements)
      q = query(q, limit(pageSize));

      const snapshot = await getDocs(q);
      const usersList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : 
                     (data.createdAt ? new Date(data.createdAt) : new Date()),
          lastLoginAt: data.lastLoginAt?.toDate ? data.lastLoginAt.toDate() : 
                      (data.lastLoginAt ? new Date(data.lastLoginAt) : undefined),
        } as User;
      });

      if (reset) {
        setUsers(usersList);
        setCurrentPage(1);
      } else {
        setUsers(prev => [...prev, ...usersList]);
      }

      setHasMore(usersList.length === pageSize);
      setIsLoading(false);
    } catch (error: any) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
      setIsLoading(false);
    }
  }, [filters, pageSize]);

  // Filter users by search term
  useEffect(() => {
    if (!filters.search) {
      setFilteredUsers(users);
      return;
    }

    const searchTerm = filters.search.toLowerCase();
    const filtered = users.filter(user => 
      user.email.toLowerCase().includes(searchTerm) ||
      user.name?.toLowerCase().includes(searchTerm) ||
      user.displayName?.toLowerCase().includes(searchTerm) ||
      user.firstName?.toLowerCase().includes(searchTerm) ||
      user.lastName?.toLowerCase().includes(searchTerm) ||
      user.id.toLowerCase().includes(searchTerm)
    );

    setFilteredUsers(filtered);
  }, [users, filters.search]);

  useEffect(() => {
    loadUsers(true);
  }, [loadUsers]);

  const handleUpdateUserStatus = async (userId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        status: newStatus,
        updatedAt: Timestamp.now(),
        updatedBy: currentUser?.uid
      });

      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      ));

      toast.success(`User status updated to ${newStatus}`);
    } catch (error: any) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole,
        userType: newRole, // For backward compatibility
        updatedAt: Timestamp.now(),
        updatedBy: currentUser?.uid
      });

      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, role: newRole, userType: newRole } : user
      ));

      toast.success(`User role updated to ${newRole}`);
    } catch (error: any) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    }
  };

  const handleDeleteUser = async (user: User) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      // Soft delete - update status instead of actual deletion
      await updateDoc(doc(db, 'users', userToDelete.id), {
        status: 'deleted',
        deletedAt: Timestamp.now(),
        deletedBy: currentUser?.uid
      });

      setUsers(prev => prev.filter(user => user.id !== userToDelete.id));
      setShowDeleteModal(false);
      setUserToDelete(null);
      toast.success('User account deactivated');
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="w-4 h-4 text-green-600" />;
      case 'suspended':
        return <XCircleIcon className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <ClockIcon className="w-4 h-4 text-yellow-600" />;
      default:
        return <ExclamationTriangleIcon className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusVariant = (status?: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'suspended':
        return 'danger';
      case 'pending':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  const getRoleColor = (role?: string) => {
    if (!role) return 'bg-gray-100 text-gray-800';
    
    switch (role) {
      case 'admin':
      case 'super_admin':
        return 'bg-red-100 text-red-800';
      case 'landlord':
        return 'bg-blue-100 text-blue-800';
      case 'contractor':
        return 'bg-green-100 text-green-800';
      case 'tenant':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatUserName = (user: User) => {
    return user.displayName || user.name || 
           (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : '') ||
           user.email.split('@')[0];
  };

  const exportUsers = () => {
    const csvData = filteredUsers.map(user => ({
      'User ID': user.id,
      'Email': user.email,
      'Name': formatUserName(user),
      'Role': user.role,
      'Status': user.status,
      'Created': user.createdAt.toLocaleDateString(),
      'Last Login': user.lastLoginAt?.toLocaleDateString() || 'Never',
      'Profile Complete': user.profileComplete ? 'Yes' : 'No'
    }));

    const csvContent = "data:text/csv;charset=utf-8," 
      + Object.keys(csvData[0]).join(",") + "\n"
      + csvData.map(row => Object.values(row).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `users_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            onClick={exportUsers}
            className="flex items-center gap-2"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            Export
          </Button>
          
          <Button
            onClick={() => setShowUserModal(true)}
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
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          {!roleFilter && (
            <select
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value as any })}
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
            onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="pending">Pending</option>
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
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <UserIcon className="w-8 h-8 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatUserName(user)}
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
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                      {user.role ? user.role.replace('_', ' ').toUpperCase() : 'NO ROLE'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(user.status)}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${getStatusVariant(user.status)}`}>
                        {user.status ? user.status.replace(/_/g, ' ') : 'unknown'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="w-4 h-4" />
                      {user.createdAt.toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastLoginAt ? user.lastLoginAt.toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowUserModal(true);
                        }}
                        className="text-gray-600 hover:text-gray-900"
                        title="View Details"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      
                      <select
                        value={user.status || 'pending'}
                        onChange={(e) => handleUpdateUserStatus(user.id, e.target.value)}
                        className="text-xs border border-gray-300 rounded px-2 py-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                        <option value="pending">Pending</option>
                      </select>
                      
                      <button
                        onClick={() => handleDeleteUser(user)}
                        className="text-red-600 hover:text-red-900"
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
            <p className="text-gray-600">
              {filters.search || filters.role !== 'all' || filters.status !== 'all'
                ? 'Try adjusting your filters to see more results.'
                : 'No users have been created yet.'}
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Delete User Account</h3>
            </div>
            
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete the account for <strong>{formatUserName(userToDelete)}</strong>? 
              This will deactivate their account and they will lose access to the system.
            </p>
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setUserToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={confirmDeleteUser}
              >
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPanel; 