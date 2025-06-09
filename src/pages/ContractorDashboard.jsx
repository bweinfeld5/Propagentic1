import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { db } from '../firebase/config';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';

import ContractorOverviewCards from '../components/contractor/ContractorOverviewCards';
import JobBoard from '../components/contractor/JobBoard';

const ContractorDashboard = () => {
  const { currentUser, userProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  
  // Redirect and auth loading check
  useEffect(() => {
    if (!authLoading && (!currentUser || userProfile?.userType !== 'contractor')) {
      navigate('/login');
    }
  }, [currentUser, userProfile, authLoading, navigate]);

  // Fetch assigned jobs
  useEffect(() => {
    if (!currentUser) return;
    
    try {
      setLoadingData(true);
      const q = query(
        collection(db, 'tickets'), 
        where('assignedContractorId', '==', currentUser.uid)
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const jobsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date()
        }));
        setJobs(jobsData);
        setLoadingData(false);
      }, (error) => {
        console.error("Error fetching jobs:", error);
        setJobs([]);
        setLoadingData(false);
      });
      
      return () => unsubscribe();
    } catch (error) {
      console.error("Error setting up jobs listener:", error);
      setJobs([]);
      setLoadingData(false);
    }
  }, [currentUser]);

  // Handle accepting a job
  const handleAcceptJob = async (jobId) => {
    try {
      // Logic to update the job status to 'accepted' and set acceptedAt timestamp
      console.log('Accepting job:', jobId);
      // This would be implemented with a Firestore update call
    } catch (error) {
      console.error("Error accepting job:", error);
    }
  };

  // Handle updating job status
  const handleUpdateJobStatus = (jobId) => {
    // Navigate to the job detail page where status can be updated
    navigate(`/contractor/jobs/${jobId}`);
  };

  // Calculate statistics for the overview cards
  const dashboardStats = {
    newJobs: jobs.filter(job => 
      job.status === 'new' || 
      job.status === 'assigned' || 
      job.status === 'ready_to_dispatch'
    ).length,
    
    activeJobs: jobs.filter(job => 
      job.status === 'accepted' || 
      job.status === 'in_progress' || 
      job.status === 'scheduled'
    ).length,
    
    completedThisMonth: (() => {
      // Get jobs completed this month
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      return jobs.filter(job => 
        job.status === 'completed' && 
        job.completedAt && 
        new Date(job.completedAt) >= firstDayOfMonth
      ).length;
    })(),
    
    // Optional: Calculate average completion time in days
    avgCompletionTime: (() => {
      // Get completed jobs with both accepted and completed timestamps
      const completedJobs = jobs.filter(job => 
        job.status === 'completed' && 
        job.acceptedAt && 
        job.completedAt
      );
      
      if (completedJobs.length === 0) return null;
      
      // Calculate average time in days
      const totalDays = completedJobs.reduce((sum, job) => {
        const acceptedDate = new Date(job.acceptedAt);
        const completedDate = new Date(job.completedAt);
        const diffTime = Math.abs(completedDate - acceptedDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return sum + diffDays;
      }, 0);
      
      const avg = (totalDays / completedJobs.length).toFixed(1);
      return `${avg} days`;
    })()
  };

  // Display loading indicator until authentication and data are ready
  if (authLoading || loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-t-2 border-b-2 border-teal-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1 md:p-4">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">Contractor Dashboard</h1>
        <p className="text-sm text-slate-500">Welcome back, {userProfile?.firstName || 'Contractor'}</p>
      </div>
      
      {/* 1. Overview Cards Panel */}
      <section aria-labelledby="overview-heading">
        <h2 id="overview-heading" className="sr-only">Dashboard Overview</h2>
        <ContractorOverviewCards stats={dashboardStats} />
      </section>

      {/* 2. Job Board */}
      <section aria-labelledby="jobs-heading">
        <h2 id="jobs-heading" className="sr-only">Maintenance Jobs</h2>
        <JobBoard 
          jobs={jobs} 
          onAcceptJob={handleAcceptJob} 
          onUpdateJobStatus={handleUpdateJobStatus} 
        />
      </section>
    </div>
  );
};

export default ContractorDashboard; 