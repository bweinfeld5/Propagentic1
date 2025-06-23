import React, { useState, useEffect, Component } from 'react';
import { motion } from 'framer-motion';
import PageTransition from '../components/shared/PageTransition';
import DashboardCard from '../components/dashboard/DashboardCard';
import AnimatedDashboardStats from '../components/dashboard/AnimatedDashboardStats';
import StatsChart from '../components/dashboard/StatsChart';
import SortableTaskList from '../components/ui/SortableTaskList';
import AnimatedDropzone from '../components/ui/AnimatedDropzone';
import PropertyMapVisualization from '../components/dashboard/PropertyMapVisualization';
import AppTourGuide from '../components/ui/AppTourGuide';
import { generateTestData, performanceTesting } from '../utils/performanceTests';

// Check compatibility between framer-motion and React 19
const checkFramerMotionCompatibility = () => {
  try {
    // Simple test of framer-motion basic functionality
    const testMotion = motion.div;
    console.log("Framer motion imported successfully:", !!testMotion);
    return true;
  } catch (error) {
    console.error("Framer motion compatibility issue:", error);
    return false;
  }
};

// Error Boundary Component
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error("UI Component Error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 m-4 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Something went wrong rendering this component</h2>
          <details className="text-sm">
            <summary className="cursor-pointer text-red-600 mb-2">View Technical Details</summary>
            <pre className="bg-gray-100 p-2 rounded overflow-auto text-xs">
              {this.state.error && this.state.error.toString()}
              <br />
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </pre>
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

const ComponentsShowcasePage = () => {
  const [compatibilityStatus, setCompatibilityStatus] = useState(null);
  const [isPerformanceTesting, setIsPerformanceTesting] = useState(false);
  const [performanceResults, setPerformanceResults] = useState(null);
  const [framerMotionCompatible, setFramerMotionCompatible] = useState(true);

  // Run compatibility check for framer-motion on mount
  useEffect(() => {
    // Check framer-motion compatibility
    const isCompatible = checkFramerMotionCompatibility();
    setFramerMotionCompatible(isCompatible);
    
    // Log React version for debugging
    console.log("React version in ComponentsShowcasePage:", React.version);
    
    // Check if browser compatibility helper is loaded
    if (window.PropAgentic?.compat?.checkCompatibility) {
      const status = window.PropAgentic.compat.checkCompatibility();
      setCompatibilityStatus(status);

      // Apply polyfills if needed and available
      if (!status.compatible && window.PropAgentic.compat.applyCompatibilityFixes) {
        window.PropAgentic.compat.applyCompatibilityFixes().then(result => {
          console.log('Compatibility fixes applied:', result);
        });
      }
    }
  }, []);

  // Sample chart data
  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Revenue',
        data: [65, 59, 80, 81, 56, 90],
        backgroundColor: 'rgba(10, 179, 172, 0.2)',
        borderColor: 'rgb(10, 179, 172)',
        borderWidth: 2,
        tension: 0.4
      }
    ]
  };
  
  // Sample task data for the sortable list
  const [tasks, setTasks] = useState([
    {
      id: "task-1",
      title: "Fix leaky faucet in Apt #304",
      description: "Tenant reported a leaking faucet in the bathroom sink that needs repair.",
      status: "In Progress",
      priority: "medium",
      dueDate: "2023-06-15",
      assignee: {
        id: "user-1",
        name: "John Doe",
        avatar: null
      }
    },
    {
      id: "task-2",
      title: "Schedule HVAC maintenance",
      description: "Annual maintenance check for all HVAC units in the Willow Creek property.",
      status: "Pending",
      priority: "high",
      dueDate: "2023-06-20",
      assignee: {
        id: "user-2",
        name: "Jane Smith",
        avatar: null
      }
    },
    {
      id: "task-3",
      title: "Replace carpet in Apt #201",
      description: "Tenant moving out on the 30th. Need to schedule carpet replacement before new tenant arrives.",
      status: "Completed",
      priority: "low",
      dueDate: "2023-06-25",
      assignee: {
        id: "user-3",
        name: "Mike Johnson",
        avatar: null
      }
    }
  ]);
  
  // Sample property data for the map
  const properties = [
    {
      id: "prop-1",
      name: "Sunset Apartments",
      address: "123 Sunset Blvd, Los Angeles, CA",
      status: "active",
      coordinates: {
        latitude: 34.0522,
        longitude: -118.2437
      }
    },
    {
      id: "prop-2",
      name: "Lakeside Manor",
      address: "456 Lake Dr, Chicago, IL",
      status: "maintenance",
      coordinates: {
        latitude: 41.8781,
        longitude: -87.6298
      }
    },
    {
      id: "prop-3",
      name: "Mountain View Residences",
      address: "789 Mountain Rd, Denver, CO",
      status: "vacant",
      coordinates: {
        latitude: 39.7392,
        longitude: -104.9903
      }
    },
    {
      id: "prop-4",
      name: "Urban Heights",
      address: "101 City Center, New York, NY",
      status: "construction",
      coordinates: {
        latitude: 40.7128,
        longitude: -74.0060
      }
    }
  ];
  
  // Tour steps
  const tourSteps = [
    {
      target: '#animated-stats',
      title: 'Animated Statistics',
      content: 'These cards show key metrics with smooth animations and mini trends.',
      placement: 'bottom'
    },
    {
      target: '#charts-section',
      title: 'Interactive Charts',
      content: 'Visualize your data with beautiful, responsive charts.',
      placement: 'top'
    },
    {
      target: '#sortable-tasks',
      title: 'Sortable Task List',
      content: 'Drag and drop to reorder tasks and manage priorities.',
      placement: 'right'
    },
    {
      target: '#dropzone',
      title: 'File Upload Dropzone',
      content: 'Easily upload files by dragging and dropping them here.',
      placement: 'left'
    },
    {
      target: '#property-map',
      title: 'Property Map',
      content: 'Visualize your properties on an interactive map.',
      placement: 'top'
    }
  ];
  
  // Handle task reordering
  const handleTasksReordered = (reorderedTasks) => {
    setTasks(reorderedTasks);
  };
  
  // Handle tour completion
  const handleTourComplete = () => {
    console.log('Tour completed');
  };

  // Run performance tests
  const runPerformanceTests = async () => {
    setIsPerformanceTesting(true);
    
    try {
      // Test the map component with 100 properties
      const mapResults = await performanceTesting.testMapPerformance(
        (testProperties) => {
          // This would normally render to a DOM node, here we'll just log
          console.log(`Rendering map with ${testProperties.length} properties`);
        },
        100
      );
      
      // Test the sortable task list with 50 tasks
      const listResults = await performanceTesting.testSortableListPerformance(
        (testTasks) => {
          // This would normally render to a DOM node, here we'll just log
          console.log(`Rendering task list with ${testTasks.length} tasks`);
        },
        50
      );
      
      setPerformanceResults({
        mapResults,
        listResults
      });
    } catch (error) {
      console.error('Performance testing error:', error);
    } finally {
      setIsPerformanceTesting(false);
    }
  };
  
  // Render a simplified version if framer-motion is not compatible
  if (!framerMotionCompatible) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Animation Library Compatibility Issue
              </h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                <p>The UI showcase requires framer-motion animation library which appears to be incompatible with your current React version.</p>
                <p className="mt-2">Please try viewing the basic components at <a href="/test-ui" className="font-medium underline">test-ui page</a> instead.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <PageTransition>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Tour Guide */}
          <AppTourGuide 
            steps={tourSteps}
            isEnabled={true}
            autoStart={false}
            onComplete={handleTourComplete}
            showProgress={true}
          />
          
          {/* Page Header */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold text-propagentic-slate-dark dark:text-white">
              UI Components Showcase
            </h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
              Interactive demonstration of PropAgentic's enhanced UI components
            </p>
          </motion.div>

          {/* Compatibility Check */}
          {compatibilityStatus && !compatibilityStatus.compatible && (
            <section className="mb-6">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Browser Compatibility Warning
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                      <p>Some features may not work correctly in your browser.</p>
                      <ul className="list-disc pl-5 space-y-1 mt-2">
                        {compatibilityStatus.issues.map((issue, index) => (
                          <li key={index}>
                            <strong>{issue.feature}</strong>: Used for {issue.component.join(', ')}
                            {issue.canPolyfill && " (will be polyfilled)"}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Performance Testing Controls */}
          <section className="mb-8">
            <div className="bg-white dark:bg-propagentic-slate-dark shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-propagentic-slate-dark dark:text-white">Performance Testing</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Test components with large datasets</p>
                </div>
                <button
                  className={`px-4 py-2 rounded-lg bg-propagentic-teal text-white ${isPerformanceTesting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-propagentic-teal-dark'}`}
                  onClick={runPerformanceTests}
                  disabled={isPerformanceTesting}
                >
                  {isPerformanceTesting ? 'Running Tests...' : 'Run Performance Tests'}
                </button>
              </div>

              {/* Performance Results */}
              {performanceResults && (
                <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="text-md font-medium text-propagentic-slate-dark dark:text-white mb-2">Test Results</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <h5 className="font-medium text-sm mb-2">Map Visualization ({performanceResults.mapResults.dataSize} markers)</h5>
                      <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                        <li>Avg. Render Time: {performanceResults.mapResults.renderTime.average.toFixed(2)}ms</li>
                        <li>Min/Max: {performanceResults.mapResults.renderTime.min.toFixed(2)}/{performanceResults.mapResults.renderTime.max.toFixed(2)}ms</li>
                      </ul>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <h5 className="font-medium text-sm mb-2">Task List ({performanceResults.listResults.dataSize} tasks)</h5>
                      <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                        <li>Avg. Render Time: {performanceResults.listResults.renderTime.average.toFixed(2)}ms</li>
                        <li>Interaction FPS: {performanceResults.listResults.interactionPerformance.fps.toFixed(2)}</li>
                        <li>Slow Frames: {performanceResults.listResults.interactionPerformance.slowFramePercentage.toFixed(2)}%</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
          
          {/* Animated Dashboard Stats */}
          <section className="mb-10" id="animated-stats">
            <h2 className="text-xl font-semibold mb-4 text-propagentic-slate-dark dark:text-white">
              Animated Dashboard Stats
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <AnimatedDashboardStats 
                title="Total Revenue"
                value={34875}
                previousValue={29520}
                percentageChange={18.1}
                description="vs. last month"
                theme="primary"
                delay={0}
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                chartData={{
                  labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
                  datasets: [{
                    data: [3, 7, 5, 9, 6, 8, 10],
                    borderColor: 'rgb(10, 179, 172)',
                    backgroundColor: 'rgba(10, 179, 172, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 2
                  }]
                }}
              />
              
              <AnimatedDashboardStats 
                title="Properties"
                value={42}
                previousValue={40}
                percentageChange={5}
                description="vs. last month"
                theme="secondary"
                delay={0.1}
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                }
                chartData={{
                  labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
                  datasets: [{
                    data: [38, 39, 40, 40, 41, 42, 42],
                    borderColor: 'rgb(23, 140, 249)',
                    backgroundColor: 'rgba(23, 140, 249, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 2
                  }]
                }}
              />
              
              <AnimatedDashboardStats 
                title="Occupancy Rate"
                value={94}
                previousValue={89}
                percentageChange={5.6}
                description="vs. last month"
                theme="success"
                delay={0.2}
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
                chartData={{
                  labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
                  datasets: [{
                    data: [89, 90, 91, 92, 93, 93, 94],
                    borderColor: 'rgb(4, 184, 81)',
                    backgroundColor: 'rgba(4, 184, 81, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 2
                  }]
                }}
              />
              
              <AnimatedDashboardStats 
                title="Maintenance Costs"
                value={5240}
                previousValue={6120}
                percentageChange={-14.4}
                description="vs. last month"
                theme="warning"
                delay={0.3}
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                }
                chartData={{
                  labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
                  datasets: [{
                    data: [6120, 6000, 5800, 5650, 5500, 5300, 5240],
                    borderColor: 'rgb(255, 184, 0)',
                    backgroundColor: 'rgba(255, 184, 0, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 2
                  }]
                }}
              />
            </div>
          </section>
          
          {/* Charts Section */}
          <section className="mb-10" id="charts-section">
            <h2 className="text-xl font-semibold mb-4 text-propagentic-slate-dark dark:text-white">
              Interactive Charts
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DashboardCard
                title="Revenue Trend"
                theme="primary"
                animate
                delay={0.4}
              >
                <div className="h-80">
                  <StatsChart 
                    type="line"
                    data={chartData}
                    height={300}
                    animate
                  />
                </div>
              </DashboardCard>
              
              <DashboardCard
                title="Revenue by Category"
                theme="secondary"
                animate
                delay={0.5}
              >
                <div className="h-80">
                  <StatsChart 
                    type="bar"
                    data={{
                      labels: ['Residential', 'Commercial', 'Industrial', 'Land', 'Other'],
                      datasets: [
                        {
                          label: 'Revenue ($)',
                          data: [35000, 25000, 15000, 8000, 5000],
                          backgroundColor: 'rgba(23, 140, 249, 0.6)',
                          borderColor: 'rgb(23, 140, 249)',
                          borderWidth: 1
                        }
                      ]
                    }}
                    height={300}
                    animate
                  />
                </div>
              </DashboardCard>
            </div>
          </section>
          
          {/* Sortable Task List */}
          <section className="mb-10" id="sortable-tasks">
            <h2 className="text-xl font-semibold mb-4 text-propagentic-slate-dark dark:text-white">
              Sortable Task List
            </h2>
            
            <DashboardCard theme="neutral" animate delay={0.6}>
              <div className="p-2">
                <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                  Drag and drop tasks to reorder them. Each task can be clicked for more details.
                </p>
                <SortableTaskList 
                  tasks={tasks} 
                  onTasksReordered={handleTasksReordered}
                  onTaskSelected={(task) => console.log('Selected task:', task)}
                />
              </div>
            </DashboardCard>
          </section>
          
          {/* File Dropzone */}
          <section className="mb-10" id="dropzone">
            <h2 className="text-xl font-semibold mb-4 text-propagentic-slate-dark dark:text-white">
              Animated File Dropzone
            </h2>
            
            <DashboardCard theme="neutral" animate delay={0.7}>
              <div className="p-4">
                <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                  Drag and drop files to upload them, or click to browse.
                </p>
                <AnimatedDropzone 
                  onFilesAccepted={(files) => console.log('Files accepted:', files)}
                  maxFiles={5}
                  maxSize={5242880}
                  acceptedFileTypes={['image/jpeg', 'image/png', 'image/webp', 'application/pdf']}
                  label="Drop property images or documents here"
                  description="Accept JPG, PNG, WebP, PDF up to 5MB"
                />
              </div>
            </DashboardCard>
          </section>
          
          {/* Property Map */}
          <section className="mb-10" id="property-map">
            <h2 className="text-xl font-semibold mb-4 text-propagentic-slate-dark dark:text-white">
              Property Map Visualization
            </h2>
            
            <DashboardCard theme="neutral" animate delay={0.8}>
              <div className="p-4">
                <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                  Interactive map showing property locations across the United States.
                </p>
                <div className="h-[500px]">
                  <PropertyMapVisualization 
                    properties={properties}
                    height={450}
                    onPropertySelected={(property) => console.log('Selected property:', property)}
                  />
                </div>
              </div>
            </DashboardCard>
          </section>
        </div>
      </PageTransition>
    </ErrorBoundary>
  );
};

export default ComponentsShowcasePage; 