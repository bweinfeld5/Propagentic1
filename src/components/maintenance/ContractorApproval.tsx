import React, { useState } from 'react';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import Modal from '../common/Modal';
import { Contractor } from '../../utils/DataModel';

interface ContractorApprovalProps {
  contractor: Contractor;
}

const ContractorApproval: React.FC<ContractorApprovalProps> = ({ contractor }) => {
  const { userProfile } = useAuth();
  const [status, setStatus] = useState<string>(contractor.status || "pending");
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  
  const handleApproval = () => {
    setShowConfirmation(true);
  };
  
  const confirmApproval = async () => {
    if (!auth.currentUser) return;
    
    try {
      await updateDoc(doc(db, "landlordProfiles", auth.currentUser.uid, "contractors", contractor.id), {
        status: "approved",
        approvedAt: serverTimestamp()
      });
      setStatus("approved");
      setShowConfirmation(false);
      
      await addDoc(collection(db, "notifications"), {
        userId: contractor.id,
        type: "contractor_approved",
        message: `You've been approved by ${userProfile?.name || 'a landlord'}`,
        read: false,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error approving contractor:", error);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold text-lg">{contractor.name}</h3>
      <div className="mt-2">
        <span className={`px-2 py-1 text-xs rounded-full ${
          status === 'approved' 
            ? 'bg-green-100 text-green-800' 
            : status === 'pending'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-100 text-gray-800'
        }`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>
      
      {status === "pending" && (
        <button onClick={handleApproval} className="mt-3 bg-blue-500 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-600">
          Approve Contractor
        </button>
      )}
      
      {showConfirmation && (
        <Modal onClose={() => setShowConfirmation(false)} title="Confirm Approval">
          <p className="mb-4">Are you sure you want to approve {contractor.name}?</p>
          <div className="flex justify-end space-x-3">
            <button onClick={() => setShowConfirmation(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={confirmApproval} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
              Confirm Approval
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ContractorApproval;
