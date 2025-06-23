import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import Modal from '../common/Modal';
import TenantCard from '../tenant/TenantCard';
import { Tenant } from '../../utils/DataModel';

interface PropertyTenantManagerProps {
  propertyId: string;
}

const PropertyTenantManager: React.FC<PropertyTenantManagerProps> = ({ propertyId }) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [availableTenants, setAvailableTenants] = useState<Tenant[]>([]);
  const [isAddingTenant, setIsAddingTenant] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Fetch current tenants for this property
  useEffect(() => {
    const fetchTenants = async () => {
      if (!propertyId) return;
      
      setLoading(true);
      try {
        const q = query(
          collection(db, "propertyTenants"),
          where("propertyId", "==", propertyId)
        );
        const snapshot = await getDocs(q);
        
        // Get full tenant details
        const tenantPromises = snapshot.docs.map(async (docSnapshot) => {
          const tenantData = docSnapshot.data();
          const tenantDocRef = doc(db, "tenantProfiles", tenantData.tenantId);
          const tenantDoc = await getDoc(tenantDocRef);
          
          if (tenantDoc.exists()) {
            return {
              id: tenantData.tenantId,
              ...tenantDoc.data(),
              status: tenantData.status
            } as Tenant;
          }
          return null;
        });
        
        const resolvedTenants = (await Promise.all(tenantPromises))
          .filter((tenant): tenant is Tenant => tenant !== null);
          
        setTenants(resolvedTenants);
      } catch (error) {
        console.error("Error fetching tenants:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTenants();
  }, [propertyId]);
  
  // Fetch available tenants (not assigned to this property)
  const fetchAvailableTenants = async () => {
    setLoading(true);
    try {
      const tenantsQuery = query(collection(db, "tenantProfiles"));
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
  
  const assignTenantToProperty = async (tenantId: string) => {
    try {
      // Create relationship document
      await addDoc(collection(db, "propertyTenants"), {
        propertyId,
        tenantId,
        assignedAt: serverTimestamp(),
        status: "active"
      });
      
      // Refresh tenant list
      setIsAddingTenant(false);
      
      // Fetch the tenant we just added
      const tenantDocRef = doc(db, "tenantProfiles", tenantId);
      const tenantDoc = await getDoc(tenantDocRef);
      
      if (tenantDoc.exists()) {
        const newTenant = {
          id: tenantId,
          ...tenantDoc.data(),
          status: "active"
        } as Tenant;
        
        setTenants(prev => [...prev, newTenant]);
      }
    } catch (error) {
      console.error("Error assigning tenant:", error);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Property Tenants</h2>
      
      {loading ? (
        <div className="text-center py-4">Loading...</div>
      ) : (
        <>
          {tenants.length > 0 ? (
            <div className="space-y-3">
              {tenants.map(tenant => (
                <TenantCard key={tenant.id} tenant={tenant} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 py-4">No tenants assigned to this property.</p>
          )}
        </>
      )}
      
      <button
        onClick={() => {
          setIsAddingTenant(true);
          fetchAvailableTenants();
        }}
        className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md"
      >
        Add Tenant
      </button>
      
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
                      <span>{tenant.name || tenant.email || 'Unnamed Tenant'}</span>
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
