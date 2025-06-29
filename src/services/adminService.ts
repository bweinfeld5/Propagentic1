import { httpsCallable, getFunctions } from 'firebase/functions';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
  DocumentSnapshot
} from 'firebase/firestore';
import { db } from '../firebase/config';
import toast from 'react-hot-toast';

// Initialize Firebase Functions
const functions = getFunctions();

// Types
export interface CreateUserData {
  firstName: string;
  lastName: string;
  email: string;
  role: 'landlord' | 'tenant' | 'contractor' | 'admin';
  phone?: string;
}

export interface UpdateUserData {
  uid: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  status?: string;
  phone?: string;
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  name?: string;
  role?: string;
  userType?: string;
  status?: string;
  phone?: string;
  createdAt: Date;
  lastLoginAt?: Date;
  profileComplete?: boolean;
  emailVerified?: boolean;
}

export interface UserFilters {
  role?: string;
  status?: string;
  search?: string;
  dateRange?: string;
}

export interface PaginationOptions {
  pageSize?: number;
  lastDoc?: DocumentSnapshot;
}

// Cloud Function callables
const createUserFunction = httpsCallable(functions, 'createUser');
const updateUserFunction = httpsCallable(functions, 'updateUser');
const deleteUserFunction = httpsCallable(functions, 'deleteUser');
const sendInvitationEmailFunction = httpsCallable(functions, 'sendInvitationEmail');
const sendPasswordResetFunction = httpsCallable(functions, 'sendPasswordReset');

/**
 * Admin Service Class
 * Handles all admin-related operations including user management
 */
class AdminService {
  /**
   * Create a new user account
   */
  async createUser(userData: CreateUserData): Promise<{ uid: string }> {
    try {
      // Call Cloud Function
      const createUserFunction = httpsCallable(functions, 'createUser');
      const result = await createUserFunction({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        role: userData.role,
        phone: userData.phone
      });

      const data = result.data as { uid: string; success: boolean };
      
      if (!data.success) {
        throw new Error('Failed to create user account');
      }
      
      return { uid: data.uid };
    } catch (error: any) {
      console.error('Error creating user:', error);
      throw new Error(error.message || 'Failed to create user account');
    }
  }

  /**
   * Update an existing user account
   */
  async updateUser(userData: UpdateUserData): Promise<void> {
    try {
      // Call Cloud Function
      const updateUserFunction = httpsCallable(functions, 'updateUser');
      const result = await updateUserFunction({
        uid: userData.uid,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        status: userData.status,
        phone: userData.phone
      });

      const data = result.data as { success: boolean };
      
      if (!data.success) {
        throw new Error('Failed to update user account');
      }
    } catch (error: any) {
      console.error('Error updating user:', error);
      throw new Error(error.message || 'Failed to update user account');
    }
  }

  /**
   * Soft delete a user (deactivate account)
   */
  async softDeleteUser(uid: string): Promise<void> {
    try {
      // Update user status to 'deleted' in Firestore
      await updateDoc(doc(db, 'users', uid), {
        status: 'deleted',
        deletedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    } catch (error: any) {
      console.error('Error deactivating user:', error);
      throw new Error(error.message || 'Failed to deactivate user account');
    }
  }

  /**
   * Hard delete a user (permanently remove)
   */
  async deleteUser(uid: string): Promise<void> {
    try {
      // Call Cloud Function
      const deleteUserFunction = httpsCallable(functions, 'deleteUser');
      const result = await deleteUserFunction({ uid });

      const data = result.data as { success: boolean };
      
      if (!data.success) {
        throw new Error('Failed to permanently delete user');
      }
    } catch (error: any) {
      // Log all possible error details
      console.error('Error deleting user (full details):', error, {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        stack: error?.stack,
        raw: JSON.stringify(error)
      });
      // Show the most informative error to the user
      throw new Error(error?.message || error?.details || error?.code || 'Failed to permanently delete user');
    }
  }

  /**
   * Send invitation email to a user
   */
  async sendInvitationEmail(email: string, firstName: string): Promise<void> {
    try {
      // Call Cloud Function
      const sendInvitationEmailFunction = httpsCallable(functions, 'sendInvitationEmail');
      const result = await sendInvitationEmailFunction({
        email,
        firstName
      });

      const data = result.data as { success: boolean; message: string };
      
      if (!data.success) {
        throw new Error('Failed to send invitation email');
      }
      
      toast.success(`Invitation email sent to ${firstName}`);
    } catch (error: any) {
      console.error('Error sending invitation email:', error);
      toast.error('Failed to send invitation email');
      throw new Error(error.message || 'Failed to send invitation email');
    }
  }

  /**
   * Send password reset email to a user
   */
  async sendPasswordReset(email: string): Promise<void> {
    try {
      // Call Cloud Function
      const sendPasswordResetFunction = httpsCallable(functions, 'sendPasswordReset');
      const result = await sendPasswordResetFunction({ email });

      const data = result.data as { success: boolean; message: string };
      
      if (!data.success) {
        throw new Error('Failed to send password reset email');
      }
      
      toast.success('Password reset email sent');
    } catch (error: any) {
      console.error('Error sending password reset:', error);
      toast.error('Failed to send password reset email');
      throw new Error(error.message || 'Failed to send password reset email');
    }
  }

  /**
   * Fetch users with filtering and pagination
   */
  async getUsers(
    filters: UserFilters = {}, 
    pagination: PaginationOptions = {}
  ): Promise<{ users: User[]; hasMore: boolean; lastDoc?: DocumentSnapshot }> {
    try {
      const { pageSize = 25 } = pagination;
      let q = query(collection(db, 'users'));

      // For now, we'll fetch all users and filter client-side to avoid index requirements
      // In production, you should create the compound indexes for better performance
      
      // Only apply ordering initially to avoid compound index requirements
      q = query(q, orderBy('createdAt', 'desc'));
      
      if (pagination.lastDoc) {
        q = query(q, startAfter(pagination.lastDoc));
      }
      
      // Fetch more than needed to account for client-side filtering
      const fetchSize = Math.max(pageSize * 3, 100);
      q = query(q, limit(fetchSize));

      const snapshot = await getDocs(q);
      let usersList: User[] = snapshot.docs.map(doc => {
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

      // Apply client-side filters
      if (filters.role && filters.role !== 'all') {
        usersList = usersList.filter(user => user.role === filters.role);
      }

      if (filters.status && filters.status !== 'all') {
        usersList = usersList.filter(user => user.status === filters.status);
      }

      // Apply date range filter if needed
      if (filters.dateRange && filters.dateRange !== 'all') {
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
        
        usersList = usersList.filter(user => user.createdAt >= startDate);
      }

      // Apply pagination to filtered results
      const paginatedUsers = usersList.slice(0, pageSize);
      const hasMore = usersList.length > pageSize;
      const lastDoc = hasMore && snapshot.docs.length > 0 ? 
                     snapshot.docs[snapshot.docs.length - 1] : undefined;

      return {
        users: paginatedUsers,
        hasMore,
        lastDoc
      };
    } catch (error: any) {
      console.error('Error fetching users:', error);
      throw new Error('Failed to fetch users');
    }
  }

  /**
   * Search users by text
   */
  searchUsers(searchTerm: string, users: User[]): User[] {
    if (!searchTerm.trim()) {
      return users;
    }

    const term = searchTerm.toLowerCase();
    return users.filter(user => 
      user.email?.toLowerCase().includes(term) ||
      user.firstName?.toLowerCase().includes(term) ||
      user.lastName?.toLowerCase().includes(term) ||
      user.displayName?.toLowerCase().includes(term) ||
      user.name?.toLowerCase().includes(term) ||
      user.id?.toLowerCase().includes(term)
    );
  }

  /**
   * Update user status (active, suspended, pending, etc.)
   */
  async updateUserStatus(uid: string, status: string, updatedBy?: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', uid), {
        status,
        updatedAt: Timestamp.now(),
        ...(updatedBy && { updatedBy })
      });
    } catch (error: any) {
      console.error('Error updating user status:', error);
      throw new Error('Failed to update user status');
    }
  }

  /**
   * Update user role (and userType for backward compatibility)
   */
  async updateUserRole(uid: string, role: string, updatedBy?: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', uid), {
        role,
        userType: role, // Backward compatibility
        updatedAt: Timestamp.now(),
        ...(updatedBy && { updatedBy })
      });
    } catch (error: any) {
      console.error('Error updating user role:', error);
      throw new Error('Failed to update user role');
    }
  }

  /**
   * Get user statistics for admin dashboard
   */
  async getUserStats(): Promise<{
    total: number;
    active: number;
    pending: number;
    suspended: number;
    byRole: Record<string, number>;
  }> {
    try {
      // This is a simplified version - in production, you might want to use aggregation queries
      const snapshot = await getDocs(collection(db, 'users'));
      const users = snapshot.docs.map(doc => doc.data());

      const stats = {
        total: users.length,
        active: users.filter(u => u.status === 'active').length,
        pending: users.filter(u => u.status === 'pending').length,
        suspended: users.filter(u => u.status === 'suspended').length,
        byRole: {} as Record<string, number>
      };

      // Count by role
      users.forEach(user => {
        const role = user.role || 'unknown';
        stats.byRole[role] = (stats.byRole[role] || 0) + 1;
      });

      return stats;
    } catch (error: any) {
      console.error('Error fetching user stats:', error);
      throw new Error('Failed to fetch user statistics');
    }
  }

  /**
   * Export users to CSV format
   */
  exportUsersToCSV(users: User[]): void {
    const csvData = users.map(user => ({
      'User ID': user.id,
      'Email': user.email,
      'First Name': user.firstName || '',
      'Last Name': user.lastName || '',
      'Display Name': user.displayName || '',
      'Role': user.role || '',
      'Status': user.status || '',
      'Phone': user.phone || '',
      'Created': user.createdAt.toLocaleDateString(),
      'Last Login': user.lastLoginAt?.toLocaleDateString() || 'Never',
      'Profile Complete': user.profileComplete ? 'Yes' : 'No',
      'Email Verified': user.emailVerified ? 'Yes' : 'No'
    }));

    const headers = Object.keys(csvData[0]).join(',');
    const rows = csvData.map(row => Object.values(row).map(value => 
      typeof value === 'string' && value.includes(',') ? `"${value}"` : value
    ).join(','));

    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('User data exported successfully');
  }

  /**
   * Format user display name
   */
  formatUserName(user: User): string {
    if (user.displayName) return user.displayName;
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    if (user.name) return user.name;
    return user.email.split('@')[0];
  }

  /**
   * Get role badge color
   */
  getRoleColor(role?: string): string {
    if (!role) return 'bg-gray-100 text-gray-800';
    
    switch (role.toLowerCase()) {
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
  }

  /**
   * Get status badge variant
   */
  getStatusVariant(status?: string): string {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'success';
      case 'suspended':
        return 'danger';
      case 'pending':
        return 'warning';
      case 'deleted':
        return 'danger';
      default:
        return 'neutral';
    }
  }

  /**
   * Fetch all properties with filtering and pagination for admin panel
   */
  async getAllProperties(
    filters: { status?: string; search?: string } = {},
    pagination: { pageSize?: number; lastDoc?: DocumentSnapshot } = {}
  ): Promise<{ properties: any[]; hasMore: boolean; lastDoc?: DocumentSnapshot }> {
    try {
      const { pageSize = 20 } = pagination;
      let q = query(collection(db, 'properties'), orderBy('createdAt', 'desc'));

      // Note: For simplicity, we will fetch and then filter client-side.
      // For larger datasets, creating Firestore indexes for server-side filtering is recommended.
      if (pagination.lastDoc) {
        q = query(q, startAfter(pagination.lastDoc));
      }
      q = query(q, limit(pageSize * 2)); // Fetch more to account for client-side filtering

      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return { properties: [], hasMore: false };
      }

      let properties = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

      // Enrich properties with landlord information
      const landlordIds = [...new Set(properties.map((p: any) => p.landlordId).filter(id => id))];
      if (landlordIds.length > 0) {
        const landlordDocs = await getDocs(query(collection(db, 'users'), where('__name__', 'in', landlordIds)));
        const landlordsMap = new Map(landlordDocs.docs.map(doc => [doc.id, doc.data()]));

        properties = properties.map((prop: any) => ({
          ...prop,
          landlordName: this.formatUserName(landlordsMap.get(prop.landlordId) as User) || 'N/A',
          createdAt: (prop.createdAt as Timestamp)?.toDate ? (prop.createdAt as Timestamp).toDate() : new Date(),
        }));
      } else {
        properties = properties.map((prop: any) => ({
          ...prop,
          landlordName: 'N/A',
          createdAt: (prop.createdAt as Timestamp)?.toDate ? (prop.createdAt as Timestamp).toDate() : new Date(),
        }));
      }

      // Client-side filtering
      if (filters.search) {
        const term = filters.search.toLowerCase();
        properties = properties.filter((p: any) =>
          p.address?.full?.toLowerCase().includes(term) ||
          p.landlordName?.toLowerCase().includes(term) ||
          p.address?.street?.toLowerCase().includes(term) ||
          p.address?.city?.toLowerCase().includes(term)
        );
      }
      if (filters.status && filters.status !== 'all') {
        properties = properties.filter((p: any) => p.status === filters.status);
      }

      // Limit to requested page size after filtering
      const paginatedProperties = properties.slice(0, pageSize);
      const hasMore = properties.length > pageSize;
      const lastDoc = hasMore && snapshot.docs.length > 0 ? 
                     snapshot.docs[Math.min(paginatedProperties.length - 1, snapshot.docs.length - 1)] : undefined;

      return {
        properties: paginatedProperties,
        hasMore,
        lastDoc,
      };
    } catch (error: any) {
      console.error('Error fetching all properties:', error);
      toast.error('Failed to load property data.');
      throw new Error('Failed to fetch properties');
    }
  }

  /**
   * Get property status badge color for UI display
   */
  getPropertyStatusVariant(status?: string): string {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'vacant':
        return 'bg-yellow-100 text-yellow-800';
      case 'maintenance':
        return 'bg-orange-100 text-orange-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  }
}

// Export singleton instance
export const adminService = new AdminService();
export default adminService; 