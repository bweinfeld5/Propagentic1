import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

const FirestoreDataInspector: React.FC = () => {
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [testDocId, setTestDocId] = useState('38LXEX7F');
  const [testResult, setTestResult] = useState<any>(null);

  const loadAllInvites = async () => {
    setLoading(true);
    try {
      const invitesRef = collection(db, 'invites');
      const snapshot = await getDocs(invitesRef);
      const invitesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        exists: true
      }));
      setInvites(invitesList);
      console.log('All invites found:', invitesList);
    } catch (error) {
      console.error('Error loading invites:', error);
    }
    setLoading(false);
  };

  const testDocumentExists = async () => {
    try {
      console.log('Testing document ID:', testDocId);
      const docRef = doc(db, 'invites', testDocId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('Document exists:', data);
        setTestResult({
          exists: true,
          id: docSnap.id,
          data: data
        });
      } else {
        console.log('Document does not exist');
        setTestResult({
          exists: false,
          id: testDocId,
          message: 'Document not found'
        });
      }
    } catch (error) {
      console.error('Error testing document:', error);
      setTestResult({
        exists: false,
        id: testDocId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  useEffect(() => {
    loadAllInvites();
  }, []);

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-h-96 overflow-y-auto z-50">
      <h3 className="text-lg font-semibold mb-2">🔍 Firestore Data Inspector</h3>
      
      <div className="mb-4">
        <button
          onClick={loadAllInvites}
          disabled={loading}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm mr-2"
        >
          {loading ? 'Loading...' : 'Refresh Invites'}
        </button>
        <span className="text-sm text-gray-600">Found: {invites.length} invites</span>
      </div>

      <div className="mb-4 border-t pt-2">
        <h4 className="font-medium mb-2">Test Document ID:</h4>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={testDocId}
            onChange={(e) => setTestDocId(e.target.value)}
            className="flex-1 px-2 py-1 border rounded text-sm"
            placeholder="Document ID to test"
          />
          <button
            onClick={testDocumentExists}
            className="px-3 py-1 bg-green-500 text-white rounded text-sm"
          >
            Test
          </button>
        </div>
        
        {testResult && (
          <div className={`p-2 rounded text-sm ${testResult.exists ? 'bg-green-100' : 'bg-red-100'}`}>
            <strong>Result:</strong> {testResult.exists ? '✅ Exists' : '❌ Not Found'}
            <pre className="mt-1 text-xs">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <div className="border-t pt-2">
        <h4 className="font-medium mb-2">All Invites:</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {invites.map((invite, index) => (
            <div key={index} className="p-2 bg-gray-50 rounded text-xs">
              <div><strong>ID:</strong> {invite.id}</div>
              <div><strong>Short Code:</strong> {invite.shortCode || 'None'}</div>
              <div><strong>Status:</strong> {invite.status}</div>
              <div><strong>Email:</strong> {invite.tenantEmail}</div>
              <div><strong>Property:</strong> {invite.propertyName}</div>
              {invite.expiresAt && (
                <div><strong>Expires:</strong> {new Date(invite.expiresAt.seconds * 1000).toLocaleDateString()}</div>
              )}
            </div>
          ))}
          {invites.length === 0 && !loading && (
            <div className="text-gray-500 text-sm">No invites found</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FirestoreDataInspector; 