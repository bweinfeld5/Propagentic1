import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDemoMode } from '../../context/DemoModeContext';
import dataService from '../../services/dataService';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

const DataPersistenceDiagnostic = () => {
  const { currentUser, userProfile, authLoading } = useAuth();
  const { isDemoMode } = useDemoMode();
  const [diagnosticLog, setDiagnosticLog] = useState([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState('none');
  const [propertiesCount, setPropertiesCount] = useState(0);
  const [manualQueryResult, setManualQueryResult] = useState(null);
  const [userDocumentData, setUserDocumentData] = useState(null);
  const [isVisible, setIsVisible] = useState(true);
  const subscriptionRef = useRef(null);

  const addLog = (message, data = null) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      message,
      data: data ? JSON.stringify(data, null, 2) : null
    };
    setDiagnosticLog(prev => [...prev, logEntry]);
    console.log(`[DIAGNOSTIC] ${timestamp}: ${message}`, data);
  };

  // Monitor auth state changes
  useEffect(() => {
    addLog('Auth state changed', {
      currentUser: currentUser ? { uid: currentUser.uid, email: currentUser.email } : null,
      userProfile: userProfile ? { userType: userProfile.userType, email: userProfile.email } : null,
      authLoading,
      isDemoMode
    });
  }, [currentUser, userProfile, authLoading, isDemoMode]);

  // Test direct Firestore queries
  const testManualQuery = async () => {
    if (!currentUser) {
      addLog('Cannot test manual query - no current user');
      return;
    }

    try {
      addLog('Starting manual Firestore query');
      
      // Test user document
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        setUserDocumentData(userData);
        addLog('User document retrieved', userData);
      } else {
        addLog('User document does not exist!');
      }

      // Test properties query
      const propertiesQuery = query(
        collection(db, 'properties'),
        where('landlordId', '==', currentUser.uid)
      );
      
      const propertiesSnapshot = await getDocs(propertiesQuery);
      const properties = propertiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setManualQueryResult(properties);
      addLog('Manual properties query result', {
        count: properties.length,
        properties: properties.map(p => ({ id: p.id, name: p.name, landlordId: p.landlordId }))
      });

    } catch (error) {
      addLog('Manual query failed', { error: error.message });
    }
  };

  // Test dataService subscription
  const testDataServiceSubscription = () => {
    if (!currentUser || !userProfile) {
      addLog('Cannot test subscription - missing currentUser or userProfile');
      return;
    }

    addLog('Setting up dataService subscription test');
    
    // Configure dataService
    dataService.configure({ 
      isDemoMode, 
      currentUser,
      userType: userProfile.userType || 'landlord'
    });

    setSubscriptionStatus('setting-up');

    // Clean up existing subscription
    if (subscriptionRef.current) {
      addLog('Cleaning up previous subscription');
      subscriptionRef.current();
      subscriptionRef.current = null;
    }

    // Set up new subscription
    const unsubscribe = dataService.subscribeToProperties(
      (propertiesData) => {
        addLog('Properties data received via subscription', {
          count: propertiesData.length,
          properties: propertiesData.map(p => ({ id: p.id, name: p.name, landlordId: p.landlordId }))
        });
        setPropertiesCount(propertiesData.length);
        setSubscriptionStatus('active');
      },
      (error) => {
        addLog('Subscription error', { error: error.message });
        setSubscriptionStatus('error');
      }
    );

    subscriptionRef.current = unsubscribe;
    addLog('Subscription set up successfully');
  };

  // Clean up subscription on unmount
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        addLog('Cleaning up subscription on component unmount');
        subscriptionRef.current();
      }
    };
  }, []);

  // Test property creation
  const testPropertyCreation = async () => {
    if (!currentUser) {
      addLog('Cannot test property creation - no current user');
      return;
    }

    try {
      addLog('Testing property creation');
      
      const testPropertyData = {
        name: `Test Property ${Date.now()}`,
        propertyType: 'apartment',
        description: 'Test property for diagnostic purposes',
        street: '123 Test Street',
        city: 'Test City',
        state: 'CA',
        zipCode: '12345',
        monthlyRent: 1000,
        landlordId: currentUser.uid,
        landlordEmail: currentUser.email,
        source: 'diagnostic_test'
      };

      const newProperty = await dataService.createProperty(testPropertyData);
      addLog('Property created successfully', newProperty);
      
      // Refresh manual query
      setTimeout(testManualQuery, 1000);
      
    } catch (error) {
      addLog('Property creation failed', { error: error.message });
    }
  };

  const clearLog = () => {
    setDiagnosticLog([]);
    setManualQueryResult(null);
    setUserDocumentData(null);
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded shadow-lg z-50"
      >
        Show Debug Panel
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 h-96 bg-white border-2 border-red-500 rounded-lg shadow-lg z-50 overflow-hidden">
      <div className="bg-red-600 text-white px-4 py-2 flex justify-between items-center">
        <h3 className="font-bold">Data Persistence Debug</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-white hover:text-gray-200"
        >
          ×
        </button>
      </div>
      
      <div className="p-4 h-full overflow-y-auto">
        {/* Status */}
        <div className="mb-4 text-sm">
          <div><strong>Auth:</strong> {currentUser ? '✅' : '❌'}</div>
          <div><strong>Profile:</strong> {userProfile ? '✅' : '❌'}</div>
          <div><strong>Demo Mode:</strong> {isDemoMode ? '✅' : '❌'}</div>
          <div><strong>Subscription:</strong> {subscriptionStatus}</div>
          <div><strong>Properties Count:</strong> {propertiesCount}</div>
        </div>

        {/* Actions */}
        <div className="mb-4 space-y-2">
          <button
            onClick={testManualQuery}
            className="w-full bg-blue-500 text-white px-3 py-1 rounded text-sm"
            disabled={!currentUser}
          >
            Test Manual Query
          </button>
          <button
            onClick={testDataServiceSubscription}
            className="w-full bg-green-500 text-white px-3 py-1 rounded text-sm"
            disabled={!currentUser || !userProfile}
          >
            Test Subscription
          </button>
          <button
            onClick={testPropertyCreation}
            className="w-full bg-purple-500 text-white px-3 py-1 rounded text-sm"
            disabled={!currentUser}
          >
            Create Test Property
          </button>
          <button
            onClick={clearLog}
            className="w-full bg-gray-500 text-white px-3 py-1 rounded text-sm"
          >
            Clear Log
          </button>
        </div>

        {/* Results */}
        {userDocumentData && (
          <div className="mb-2">
            <strong>User Doc:</strong>
            <div className="text-xs bg-gray-100 p-2 rounded">
              userType: {userDocumentData.userType}<br/>
              role: {userDocumentData.role}
            </div>
          </div>
        )}

        {manualQueryResult && (
          <div className="mb-2">
            <strong>Manual Query:</strong>
            <div className="text-xs bg-gray-100 p-2 rounded">
              {manualQueryResult.length} properties found
            </div>
          </div>
        )}

        {/* Log */}
        <div className="border-t pt-2">
          <div className="text-xs space-y-1 max-h-32 overflow-y-auto">
            {diagnosticLog.slice(-10).map((entry, index) => (
              <div key={index} className="border-b pb-1">
                <div className="font-mono text-xs text-gray-500">
                  {entry.timestamp.split('T')[1].split('.')[0]}
                </div>
                <div className="text-xs">{entry.message}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataPersistenceDiagnostic; 