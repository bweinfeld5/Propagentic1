import React, { useState } from 'react';
import { PlayIcon, StopIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import DataPersistenceTest from '../../tests/DataPersistenceTest';

const TestRunner = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [logs, setLogs] = useState([]);
  const [currentTest, setCurrentTest] = useState(null);

  const runTests = async () => {
    setIsRunning(true);
    setTestResults(null);
    setLogs([]);
    setCurrentTest(null);

    try {
      const testSuite = new DataPersistenceTest();
      
      // Override the log method to capture logs in real-time
      const originalLog = testSuite.log.bind(testSuite);
      testSuite.log = (message, type = 'info') => {
        originalLog(message, type);
        setLogs(prev => [...prev, { message, type, timestamp: new Date().toISOString() }]);
        
        // Extract current test from message
        if (message.includes('=== TEST')) {
          setCurrentTest(message.replace(/=/g, '').trim());
        }
      };

      const results = await testSuite.runAllTests();
      setTestResults(results);
      
    } catch (error) {
      setLogs(prev => [...prev, { 
        message: `Test suite error: ${error.message}`, 
        type: 'error', 
        timestamp: new Date().toISOString() 
      }]);
    } finally {
      setIsRunning(false);
      setCurrentTest(null);
    }
  };

  const clearResults = () => {
    setTestResults(null);
    setLogs([]);
    setCurrentTest(null);
  };

  const getStatusIcon = (type) => {
    switch (type) {
      case 'error':
        return <XCircleIcon className="w-4 h-4 text-red-500" />;
      case 'warn':
        return <XCircleIcon className="w-4 h-4 text-yellow-500" />;
      case 'info':
      default:
        return <CheckCircleIcon className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Data Persistence Test</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={clearResults}
              disabled={isRunning}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
            >
              Clear
            </button>
            <button
              onClick={runTests}
              disabled={isRunning}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                isRunning 
                  ? 'bg-orange-100 text-orange-700 cursor-not-allowed' 
                  : 'bg-orange-500 text-white hover:bg-orange-600'
              }`}
            >
              {isRunning ? (
                <>
                  <StopIcon className="w-4 h-4" />
                  Running...
                </>
              ) : (
                <>
                  <PlayIcon className="w-4 h-4" />
                  Run Tests
                </>
              )}
            </button>
          </div>
        </div>
        
        {currentTest && (
          <div className="mt-2 text-sm text-orange-600">
            {currentTest}
          </div>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {testResults && (
          <div className="p-4 border-b border-gray-200">
            <div className={`p-3 rounded-lg ${
              testResults.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center gap-2">
                {testResults.success ? (
                  <CheckCircleIcon className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircleIcon className="w-5 h-5 text-red-600" />
                )}
                <div>
                  <div className={`font-semibold ${
                    testResults.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {testResults.success ? 'All Tests Passed!' : 'Some Tests Failed'}
                  </div>
                  {testResults.summary && (
                    <div className={`text-sm ${
                      testResults.success ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {testResults.summary.passed}/{testResults.summary.total} tests passed
                      <br />
                      Execution time: {testResults.summary.executionTime}ms
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="p-4">
          <div className="space-y-2 text-sm">
            {logs.length === 0 && !isRunning && (
              <div className="text-gray-500 text-center py-4">
                Click "Run Tests" to start the data persistence test suite
              </div>
            )}
            
            {logs.slice(-20).map((log, index) => (
              <div key={index} className="flex items-start gap-2">
                {getStatusIcon(log.type)}
                <div className="flex-1">
                  <div className={`${
                    log.type === 'error' ? 'text-red-700' :
                    log.type === 'warn' ? 'text-yellow-700' :
                    'text-gray-700'
                  }`}>
                    {log.message}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            
            {isRunning && (
              <div className="flex items-center gap-2 py-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                <span className="text-gray-600">Running tests...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestRunner; 