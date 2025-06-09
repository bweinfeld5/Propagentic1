import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import JobDetailView from '../components/contractor/JobDetailView';

const JobDetailPage = () => {
  const { jobId } = useParams();
  const { currentUser, userProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Redirect if not authenticated or not a contractor
  useEffect(() => {
    if (!authLoading && (!currentUser || userProfile?.userType !== 'contractor')) {
      navigate('/login');
    }
  }, [currentUser, userProfile, authLoading, navigate]);
  
  // Fetch job data
  useEffect(() => {
    if (!currentUser || !jobId) return;
    
    setLoading(true);
    setError('');
    
    try {
      const jobRef = doc(db, 'tickets', jobId);
      
      const unsubscribe = onSnapshot(jobRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const jobData = {
            id: docSnapshot.id,
            ...docSnapshot.data(),
          };
          
          // Verify that this job is assigned to the current contractor
          if (jobData.assignedContractorId !== currentUser.uid) {
            setError('You do not have permission to view this job.');
            setJob(null);
          } else {
            setJob(jobData);
            setError('');
          }
        } else {
          setError('Job not found.');
          setJob(null);
        }
        setLoading(false);
      }, (err) => {
        console.error('Error fetching job:', err);
        setError('Error loading job details. Please try again.');
        setLoading(false);
      });
      
      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up job listener:', err);
      setError('Error loading job details. Please try again.');
      setLoading(false);
    }
  }, [jobId, currentUser]);
  
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
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => navigate('/contractor')}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 p-4">
      {/* Back to dashboard link */}
      <div className="mb-4">
        <button
          onClick={() => navigate('/contractor')}
          className="inline-flex items-center text-sm text-slate-600 hover:text-teal-600"
        >
          <svg className="h-5 w-5 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Dashboard
        </button>
      </div>
      
      {/* Job detail view */}
      <JobDetailView job={job} />
    </div>
  );
};

export default JobDetailPage; 