import React, { useEffect, useState } from 'react';
import Button from '../components/ui/Button';
import StatusPill from '../components/ui/StatusPill';

const SimpleUIShowcase = () => {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  useEffect(() => {
    console.log("SimpleUIShowcase mounted - React version:", React.version);
    
    // Add error detection
    const errorHandler = (event) => {
      console.error("Error in SimpleUIShowcase:", event.error);
      setHasError(true);
      setErrorMessage(event.error.toString());
    };
    
    window.addEventListener('error', errorHandler);
    
    return () => {
      window.removeEventListener('error', errorHandler);
    };
  }, []);
  
  if (hasError) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 bg-red-50 border border-red-200 rounded-lg">
        <h1 className="text-2xl font-bold text-red-800 mb-4">Error Rendering UI Components</h1>
        <p className="mb-4">There was an error rendering the simple UI showcase.</p>
        <pre className="bg-white p-4 rounded border border-red-100 text-sm overflow-auto">
          {errorMessage}
        </pre>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Simple UI Component Showcase</h1>
      <p className="text-gray-600 mb-8">This is a simplified version without animations that should work in all browsers.</p>
      
      <div className="space-y-12">
        <section>
          <h2 className="text-xl font-semibold mb-4 pb-2 border-b">Button Component</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-3">Button Variants</h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="success">Success</Button>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-3">Button Sizes</h3>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="xs">Extra Small</Button>
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </div>
            </div>
          </div>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4 pb-2 border-b">Status Pills</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-3">Default Status Pills</h3>
              <div className="flex flex-wrap gap-3">
                <StatusPill status="new" />
                <StatusPill status="in progress" />
                <StatusPill status="completed" />
                <StatusPill status="canceled" />
                <StatusPill status="pending" />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-3">Custom Status Pills</h3>
              <div className="flex flex-wrap gap-3">
                <StatusPill status="submitted" />
                <StatusPill status="assigned" />
                <StatusPill status="resolved" />
                <StatusPill status="rejected" />
                <StatusPill status="waiting" />
              </div>
            </div>
          </div>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4 pb-2 border-b">Simple Cards</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['primary', 'secondary', 'success'].map((variant) => (
              <div key={variant} className={`bg-white rounded-lg shadow p-6 border-t-4 ${
                variant === 'primary' ? 'border-propagentic-teal' : 
                variant === 'secondary' ? 'border-propagentic-blue' : 
                'border-propagentic-success'
              }`}>
                <h3 className="text-lg font-medium mb-2">{variant.charAt(0).toUpperCase() + variant.slice(1)} Card</h3>
                <p className="text-gray-600">This is a simple card component with a {variant} accent.</p>
                <div className="mt-4">
                  <Button variant={variant === 'success' ? 'success' : variant}>
                    {variant.charAt(0).toUpperCase() + variant.slice(1)} Action
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default SimpleUIShowcase; 