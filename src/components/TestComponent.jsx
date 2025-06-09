import React, { useState } from 'react';

function TestComponent() {
  const [count, setCount] = useState(0);

  return (
    <div className="test-component" style={{ padding: '20px', margin: '20px', border: '1px solid #ccc' }}>
      <h2>Test Component</h2>
      <p>This is a simple test component to verify React is working correctly.</p>
      <p>Count: {count}</p>
      <button 
        onClick={() => setCount(count + 1)}
        style={{ 
          padding: '8px 16px', 
          background: '#4a5568', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Increment
      </button>
    </div>
  );
}

export default TestComponent; 