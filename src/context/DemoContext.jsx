import React, { createContext, useContext, useState, useEffect } from 'react';
import { generateDemoData } from '../services/demoDataGenerator';

const DemoContext = createContext();

export const useDemo = () => {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
};

export const DemoProvider = ({ children }) => {
  // Demo data state
  const [demoData, setDemoData] = useState({
    landlord: null,
    properties: [],
    tenants: [],
    maintenanceRequests: [],
    invitations: []
  });

  // Metrics state
  const [metrics, setMetrics] = useState({
    propertySetupTime: 0,
    tenantInviteTime: 0,
    maintenanceResponseTime: 0,
    totalProperties: 0,
    totalTenants: 0,
    satisfactionScore: 4.7,
    responseTimeImprovement: 97,
    phoneCallReduction: 73
  });

  // Demo progress state
  const [demoProgress, setDemoProgress] = useState({
    landlordOnboarding: {
      started: false,
      completed: false,
      startTime: null,
      endTime: null
    },
    tenantInvitation: {
      started: false,
      completed: false,
      startTime: null,
      endTime: null
    },
    maintenanceWorkflow: {
      started: false,
      completed: false,
      startTime: null,
      endTime: null
    }
  });

  // Initialize demo data
  useEffect(() => {
    const initData = generateDemoData();
    setDemoData(initData);
  }, []);

  // Helper functions
  const addProperty = (property) => {
    setDemoData(prev => ({
      ...prev,
      properties: [...prev.properties, property]
    }));
    setMetrics(prev => ({
      ...prev,
      totalProperties: prev.totalProperties + 1
    }));
  };

  const bulkAddProperties = (properties) => {
    setDemoData(prev => ({
      ...prev,
      properties: [...prev.properties, ...properties]
    }));
    setMetrics(prev => ({
      ...prev,
      totalProperties: prev.totalProperties + properties.length
    }));
  };

  const sendInvitation = (invitation) => {
    const newInvite = {
      ...invitation,
      id: `invite-${Date.now()}`,
      status: 'pending',
      sentAt: new Date().toISOString(),
      code: generateInviteCode()
    };
    
    setDemoData(prev => ({
      ...prev,
      invitations: [...prev.invitations, newInvite]
    }));
    
    return newInvite;
  };

  const acceptInvitation = (inviteId, tenantData) => {
    setDemoData(prev => ({
      ...prev,
      invitations: prev.invitations.map(inv => 
        inv.id === inviteId ? { ...inv, status: 'accepted' } : inv
      ),
      tenants: [...prev.tenants, {
        ...tenantData,
        id: `tenant-${Date.now()}`,
        propertyId: prev.invitations.find(inv => inv.id === inviteId)?.propertyId,
        joinedAt: new Date().toISOString()
      }]
    }));
    
    setMetrics(prev => ({
      ...prev,
      totalTenants: prev.totalTenants + 1
    }));
  };

  const submitMaintenanceRequest = (request) => {
    const newRequest = {
      ...request,
      id: `req-${Date.now()}`,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      responseTime: null
    };
    
    setDemoData(prev => ({
      ...prev,
      maintenanceRequests: [...prev.maintenanceRequests, newRequest]
    }));
    
    return newRequest;
  };

  const respondToMaintenanceRequest = (requestId, response) => {
    const responseTime = Date.now();
    
    setDemoData(prev => ({
      ...prev,
      maintenanceRequests: prev.maintenanceRequests.map(req => 
        req.id === requestId 
          ? { 
              ...req, 
              status: 'in-progress',
              response: response,
              responseTime: responseTime - new Date(req.submittedAt).getTime(),
              respondedAt: new Date().toISOString()
            } 
          : req
      )
    }));
    
    // Update average response time metric
    const avgResponseTime = calculateAverageResponseTime();
    setMetrics(prev => ({
      ...prev,
      maintenanceResponseTime: avgResponseTime
    }));
  };

  const startSection = (sectionName) => {
    setDemoProgress(prev => ({
      ...prev,
      [sectionName]: {
        ...prev[sectionName],
        started: true,
        startTime: Date.now()
      }
    }));
  };

  const completeSection = (sectionName) => {
    const endTime = Date.now();
    setDemoProgress(prev => ({
      ...prev,
      [sectionName]: {
        ...prev[sectionName],
        completed: true,
        endTime: endTime
      }
    }));

    // Update time metrics
    if (sectionName === 'landlordOnboarding') {
      const setupTime = (endTime - demoProgress[sectionName].startTime) / 1000;
      setMetrics(prev => ({ ...prev, propertySetupTime: setupTime }));
    } else if (sectionName === 'tenantInvitation') {
      const inviteTime = (endTime - demoProgress[sectionName].startTime) / 1000;
      setMetrics(prev => ({ ...prev, tenantInviteTime: inviteTime }));
    }
  };

  const resetDemo = () => {
    const freshData = generateDemoData();
    setDemoData(freshData);
    setMetrics({
      propertySetupTime: 0,
      tenantInviteTime: 0,
      maintenanceResponseTime: 0,
      totalProperties: 0,
      totalTenants: 0,
      satisfactionScore: 4.7,
      responseTimeImprovement: 97,
      phoneCallReduction: 73
    });
    setDemoProgress({
      landlordOnboarding: { started: false, completed: false, startTime: null, endTime: null },
      tenantInvitation: { started: false, completed: false, startTime: null, endTime: null },
      maintenanceWorkflow: { started: false, completed: false, startTime: null, endTime: null }
    });
  };

  // Utility functions
  const generateInviteCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const calculateAverageResponseTime = () => {
    const respondedRequests = demoData.maintenanceRequests.filter(req => req.responseTime);
    if (respondedRequests.length === 0) return 0;
    
    const totalTime = respondedRequests.reduce((sum, req) => sum + req.responseTime, 0);
    return Math.round(totalTime / respondedRequests.length / 1000 / 60); // Convert to minutes
  };

  const value = {
    // State
    demoData,
    metrics,
    demoProgress,
    
    // Actions
    addProperty,
    bulkAddProperties,
    sendInvitation,
    acceptInvitation,
    submitMaintenanceRequest,
    respondToMaintenanceRequest,
    startSection,
    completeSection,
    resetDemo,
    
    // Utilities
    generateInviteCode
  };

  return (
    <DemoContext.Provider value={value}>
      {children}
    </DemoContext.Provider>
  );
};

export default DemoContext; 