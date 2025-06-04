import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, getDoc, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import { useNavigate } from 'react-router-dom';
import { Contractor } from '../../utils/DataModel';
import { formatFirebaseError } from '../../utils/errorHandling';

interface AssignContractorToTicketProps {
  ticketId: string;
  onAssigned?: () => void;
}

const AssignContractorToTicket: React.FC<AssignContractorToTicketProps> = ({ ticketId, onAssigned }) => {
  const navigate = useNavigate();
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [selectedContractor, setSelectedContractor] = useState<string | null>(null);
  const [issueType, setIssueType] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  
  // First get the ticket to determine issue type
  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const ticketDoc = await getDoc(doc(db, "maintenanceTickets", ticketId));
        if (ticketDoc.exists()) {
          setIssueType(ticketDoc.data().issueType);
        }
      } catch (error) {
        setError(formatFirebaseError(error));
      }
    };
    
    fetchTicket();
  }, [ticketId]);
  
  // Then fetch approved contractors matching issue type
  useEffect(() => {
    if (!issueType || !auth.currentUser) return;
    
    const fetchContractors = async () => {
      setLoading(true);
      try {
        // Add null check to prevent TypeScript error
        if (!auth.currentUser) {
          setError("You must be logged in to assign contractors");
          setLoading(false);
          return;
        }
        
        // Get approved contractors from landlord's network
        const contractorsRef = collection(db, "landlordProfiles", auth.currentUser.uid, "contractors");
        const q = query(contractorsRef, where("status", "==", "approved"));
        const snapshot = await getDocs(q);
        
        // Get full contractor profiles for those in network
        const contractorIds = snapshot.docs.map(doc => doc.data().contractorId);
        
        // If we have contractors, fetch their profiles
        if (contractorIds.length > 0) {
          const contractorProfiles: Contractor[] = [];
          for (const id of contractorIds) {
            const profileDoc = await getDoc(doc(db, "contractorProfiles", id));
            if (profileDoc.exists()) {
              const profile = profileDoc.data();
              // Filter by service category matching issue type
              if (profile.serviceCategories && profile.serviceCategories.includes(issueType)) {
                contractorProfiles.push({ 
                  id, 
                  name: profile.name || profile.businessName || 'Unnamed Contractor',
                  businessName: profile.businessName,
                  serviceCategories: profile.serviceCategories,
                  serviceArea: profile.serviceArea,
                  rating: profile.rating
                });
              }
            }
          }
          setContractors(contractorProfiles);
        }
      } catch (error) {
        setError(formatFirebaseError(error));
      } finally {
        setLoading(false);
      }
    };
    
    fetchContractors();
  }, [issueType]);
  
  const assignContractor = async () => {
    if (!selectedContractor || !auth.currentUser) return;
    
    try {
      setLoading(true);
      
      // Get the current ticket data to preserve existing timeline
      const ticketDoc = await getDoc(doc(db, "maintenanceTickets", ticketId));
      const existingTimeline = ticketDoc.exists() ? (ticketDoc.data().timeline || []) : [];
      
      // Update ticket with contractor assignment
      await updateDoc(doc(db, "maintenanceTickets", ticketId), {
        status: "assigned",
        contractorId: selectedContractor,
        assignedAt: serverTimestamp(),
        assignedBy: auth.currentUser.uid,
        timeline: [
          ...existingTimeline,
          {
            status: "assigned",
            timestamp: serverTimestamp(),
            userId: auth.currentUser.uid,
            notes: `Assigned to contractor (ID: ${selectedContractor})`
          }
        ]
      });
      
      // Create notification for contractor
      await addDoc(collection(db, "notifications"), {
        userId: selectedContractor,
        type: "new_job",
        ticketId,
        message: `You've been assigned a new ${issueType} job`,
        read: false,
        createdAt: serverTimestamp()
      });
      
      if (onAssigned) onAssigned();
    } catch (error) {
      setError(formatFirebaseError(error));
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-4">Assign Contractor for {issueType} Issue</h3>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 mb-4 text-sm" role="alert">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-4">Loading contractors...</div>
      ) : contractors.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {contractors.map(contractor => (
              <div 
                key={contractor.id} 
                className={`border p-4 rounded-lg cursor-pointer transition-colors ${
                  selectedContractor === contractor.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => setSelectedContractor(contractor.id)}
              >
                <h4 className="font-semibold">{contractor.businessName || contractor.name}</h4>
                {contractor.rating !== undefined && (
                  <div className="text-yellow-500 text-sm">{contractor.rating || '4.0'} ★</div>
                )}
                <div className="text-gray-500 text-sm mt-1">
                  Service Area: {contractor.serviceArea || 'Local'}
                </div>
              </div>
            ))}
          </div>
          
          <button 
            disabled={!selectedContractor || loading} 
            onClick={assignContractor}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Assigning...' : 'Assign Contractor'}
          </button>
        </>
      ) : (
        <div className="text-center py-6 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No approved contractors available for {issueType} issues.</p>
          <button 
            onClick={() => navigate('/contractors')}
            className="mt-2 text-blue-500 hover:underline"
          >
            Manage Contractor Network
          </button>
        </div>
      )}
    </div>
  );
};

export default AssignContractorToTicket;