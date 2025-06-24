import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  doc, 
  getDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import Modal from '../common/Modal';
// Import the real property-tenant service
import { 
  createRelationship, 
  getPropertyTenants, 
  getTenantProperties 
} from '../../services/propertyTenantService';

interface Tenant {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  status?: string;
  unitId?: string;
  startDate?: any;
  endDate?: any;
}

interface PropertyTenantManagerProps {
  propertyId: string;
  tenants: Tenant[];
  setTenants: (tenants: Tenant[]) => void;
}

const PropertyTenantManager: React.FC<PropertyTenantManagerProps> = ({ 
  propertyId, 
  tenants, 
  setTenants 
}) => {
  const [availableTenants, setAvailableTenants] = useState<Tenant[]>([]);
  const [isAddingTenant, setIsAddingTenant] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAddingTenant) {
      fetchAvailableTenants();
    }
  }, [isAddingTenant]);

  // Fetch available tenants (not assigned to this property)
  const fetchAvailableTenants = async () => {
    setLoading(true);
    try {
      // Get all users with tenant role
      const tenantsQuery = query(
        collection(db, "users"),
        where("userType", "==", "tenant")
      );
      const snapshot = await getDocs(tenantsQuery);
      const allTenants = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Tenant));
      
      // Filter out tenants already assigned to this property
      const assignedTenantIds = tenants.map(t => t.id);
      setAvailableTenants(allTenants.filter(t => !assignedTenantIds.includes(t.id)));
    } catch (error) {
      console.error("Error fetching available tenants:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const assignTenantToProperty = async (tenantId: string, unitId?: string) => {
    try {
      // Use the real propertyTenantService to create relationship
      const inviteCodeId = 'manual-assignment'; // For manual assignments
      const relationship = await createRelationship(
        propertyId, 
        tenantId, 
        inviteCodeId,
        { unitId }
      );
      
      // Refresh tenant list by fetching updated relationships
      await refreshTenantList();
      
      // Close modal
      setIsAddingTenant(false);
    } catch (error) {
      console.error("Error assigning tenant:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert('Failed to assign tenant: ' + errorMessage);
    }
  };

  const refreshTenantList = async () => {
    try {
      // Get property-tenant relationships
      const relationships = await getPropertyTenants(propertyId);
      
      // Fetch full tenant profiles
      const updatedTenants = [];
      for (const relationship of relationships) {
        const tenantDoc = await getDoc(doc(db, 'users', relationship.tenantId));
        if (tenantDoc.exists()) {
          updatedTenants.push({
            id: tenantDoc.id,
            ...tenantDoc.data(),
            // Include relationship info
            unitId: relationship.unitId,
            status: relationship.status,
            startDate: relationship.startDate,
            endDate: relationship.endDate
          });
        }
      }
      
      setTenants(updatedTenants);
    } catch (error) {
      console.error("Error refreshing tenant list:", error);
    }
  };

  // Helper function to get tenant display name
  const getTenantDisplayName = (tenant: Tenant): string => {
    if (tenant.name) return tenant.name;
    if (tenant.firstName && tenant.lastName) {
      return `${tenant.firstName} ${tenant.lastName}`;
    }
    if (tenant.firstName) return tenant.firstName;
    if (tenant.email) return tenant.email;
    return 'Unnamed Tenant';
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Property Tenants</h3>
        <button
          onClick={() => setIsAddingTenant(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
        >
          Add Tenant
        </button>
      </div>

      {tenants.length > 0 ? (
        <div className="space-y-2">
          {tenants.map(tenant => (
            <div key={tenant.id} className="flex justify-between items-center p-3 border border-gray-200 rounded-md">
              <div>
                <span className="font-medium">
                  {getTenantDisplayName(tenant)}
                </span>
                {tenant.unitId && (
                  <span className="text-sm text-gray-500 ml-2">Unit: {tenant.unitId}</span>
                )}
                <div className="text-sm text-gray-500">
                  Status: {tenant.status || 'active'}
                  {tenant.startDate && (
                    <span className="ml-2">
                      Start: {tenant.startDate.toDate?.()?.toLocaleDateString() || tenant.startDate}
                    </span>
                  )}
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs ${
                tenant.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {tenant.status || 'Active'}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No tenants assigned to this property yet.</p>
      )}

      {isAddingTenant && (
        <Modal onClose={() => setIsAddingTenant(false)} title="Add Tenant to Property">
          {loading ? (
            <div className="text-center py-4">Loading available tenants...</div>
          ) : (
            <>
              {availableTenants.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {availableTenants.map(tenant => (
                    <div key={tenant.id} className="flex justify-between items-center p-3 border border-gray-200 rounded-md">
                      <div>
                        <span className="font-medium">
                          {getTenantDisplayName(tenant)}
                        </span>
                        <div className="text-sm text-gray-500">{tenant.email}</div>
                      </div>
                      <button
                        onClick={() => assignTenantToProperty(tenant.id)}
                        className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-600"
                      >
                        Assign
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 py-4">No available tenants found.</p>
              )}
            </>
          )}
        </Modal>
      )}
    </div>
  );
};

export default PropertyTenantManager;