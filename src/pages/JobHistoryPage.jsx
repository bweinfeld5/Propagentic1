import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import CompletedJobsHistory from '../components/contractor/CompletedJobsHistory';

const JobHistoryPage = () => {
  const { currentUser, userProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [completedJobs, setCompletedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Redirect if not authenticated or not a contractor
  useEffect(() => {
    if (!authLoading && (!currentUser || userProfile?.userType !== 'contractor')) {
      navigate('/login');
    }
  }, [currentUser, userProfile, authLoading, navigate]);
  
  // Fetch completed jobs
  useEffect(() => {
    if (!currentUser) return;
    
    const fetchCompletedJobs = async () => {
      setLoading(true);
      setError('');
      
      try {
        // Query tickets collection for completed jobs assigned to this contractor
        const q = query(
          collection(db, 'tickets'),
          where('assignedContractorId', '==', currentUser.uid),
          where('status', '==', 'completed')
        );
        
        const querySnapshot = await getDocs(q);
        const jobsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        // Convert any timestamps to JavaScript Date objects
        jobsData.forEach(job => {
          if (job.completedAt && typeof job.completedAt.toDate === 'function') {
            job.completedAt = job.completedAt.toDate();
          }
          if (job.acceptedAt && typeof job.acceptedAt.toDate === 'function') {
            job.acceptedAt = job.acceptedAt.toDate();
          }
          if (job.createdAt && typeof job.createdAt.toDate === 'function') {
            job.createdAt = job.createdAt.toDate();
          }
        });
        
        setCompletedJobs(jobsData);
      } catch (err) {
        console.error('Error fetching completed jobs:', err);
        setError('Failed to load completed jobs. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCompletedJobs();
  }, [currentUser]);
  
  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-t-2 border-b-2 border-teal-500 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 p-4">
      {/* Page title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">Completed Jobs History</h1>
        <button
          onClick={() => navigate('/contractor')}
          className="mt-2 sm:mt-0 inline-flex items-center text-sm text-slate-600 hover:text-teal-600"
        >
          <svg className="h-5 w-5 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Dashboard
        </button>
      </div>
      
      {/* Completed jobs table */}
      <CompletedJobsHistory completedJobs={completedJobs} />
    </div>
  );
};

export default JobHistoryPage; 