import React, { useEffect } from 'react';
import Button from '../components/ui/Button';
import AnimatedDropzone from '../components/ui/AnimatedDropzone';
import StatusPill from '../components/ui/StatusPill';
import PageTransition from '../components/shared/PageTransition';

const TestUIComponents = () => {
  // Add error detection
  useEffect(() => {
    console.log("TestUIComponents component mounted");
    
    // Log React version for debugging
    const reactVersion = React.version;
    console.log(`React version: ${reactVersion}`);
    
    // Check if UI components are loaded
    console.log("Button component loaded:", !!Button);
    console.log("AnimatedDropzone component loaded:", !!AnimatedDropzone);
    console.log("StatusPill component loaded:", !!StatusPill);
    
    // Track rendering errors
    window.addEventListener('error', (event) => {
      console.error('Global error caught:', event.error);
    });
    
    return () => {
      console.log("TestUIComponents component unmounted");
    };
  }, []);

  try {
    return (
      <PageTransition>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">UI Component Test Page</h1>
          
          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-4">Button Component</h2>
              <div className="flex flex-wrap gap-4">
                <Button variant="primary">Primary Button</Button>
                <Button variant="secondary">Secondary Button</Button>
                <Button variant="outline">Outline Button</Button>
                <Button variant="ghost">Ghost Button</Button>
                <Button variant="danger">Danger Button</Button>
              </div>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-4">Status Pills</h2>
              <div className="flex flex-wrap gap-4">
                <StatusPill status="active" />
                <StatusPill status="pending" />
                <StatusPill status="completed" />
                <StatusPill status="rejected" />
              </div>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-4">Animated Dropzone</h2>
              <AnimatedDropzone 
                onFilesAccepted={(files) => console.log('Files accepted:', files)}
                maxFiles={5}
                maxSize={5242880}
                acceptedFileTypes={['image/jpeg', 'image/png', 'application/pdf']}
                label="Drop files here"
                description="Accept JPG, PNG, PDF up to 5MB"
              />
            </section>
          </div>
        </div>
      </PageTransition>
    );
  } catch (error) {
    console.error("Error rendering TestUIComponents:", error);
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 bg-red-50 border border-red-200 rounded-lg">
        <h1 className="text-2xl font-bold text-red-800 mb-4">Error Rendering UI Components</h1>
        <p className="mb-4">There was an error rendering the UI components.</p>
        <pre className="bg-white p-4 rounded border border-red-100 text-sm overflow-auto">
          {error.toString()}
          {error.stack}
        </pre>
      </div>
    );
  }
};

export default TestUIComponents; 