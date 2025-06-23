/**
 * Performance Testing Utilities
 * 
 * This module provides utilities for performance testing interactive components
 * with large datasets, measuring rendering time, memory usage, and interaction performance.
 */

// Generate large test datasets for components
export const generateTestData = {
  // Generate sample properties for map visualization
  properties: (count = 100) => {
    const result = [];
    
    // Define major US cities for realistic data
    const cities = [
      { name: 'New York', state: 'NY', lat: 40.7128, lng: -74.0060 },
      { name: 'Los Angeles', state: 'CA', lat: 34.0522, lng: -118.2437 },
      { name: 'Chicago', state: 'IL', lat: 41.8781, lng: -87.6298 },
      { name: 'Houston', state: 'TX', lat: 29.7604, lng: -95.3698 },
      { name: 'Phoenix', state: 'AZ', lat: 33.4484, lng: -112.0740 },
      { name: 'Philadelphia', state: 'PA', lat: 39.9526, lng: -75.1652 },
      { name: 'San Antonio', state: 'TX', lat: 29.4241, lng: -98.4936 },
      { name: 'San Diego', state: 'CA', lat: 32.7157, lng: -117.1611 },
      { name: 'Dallas', state: 'TX', lat: 32.7767, lng: -96.7970 },
      { name: 'San Jose', state: 'CA', lat: 37.3382, lng: -121.8863 }
    ];
    
    const statuses = ['active', 'vacant', 'maintenance', 'construction'];
    
    for (let i = 0; i < count; i++) {
      // Select a random city
      const city = cities[Math.floor(Math.random() * cities.length)];
      
      // Add some randomness to the coordinates to spread properties
      const latVariance = (Math.random() - 0.5) * 0.5;
      const lngVariance = (Math.random() - 0.5) * 0.5;
      
      result.push({
        id: `prop-${i + 1}`,
        name: `${city.name} ${['Apartments', 'Plaza', 'Towers', 'Heights', 'Gardens'][Math.floor(Math.random() * 5)]} ${Math.floor(Math.random() * 100) + 1}`,
        address: `${Math.floor(Math.random() * 9000) + 1000} ${['Main', 'Oak', 'Maple', 'Broadway', 'Park'][Math.floor(Math.random() * 5)]} ${['St', 'Ave', 'Blvd', 'Dr', 'Rd'][Math.floor(Math.random() * 5)]}, ${city.name}, ${city.state}`,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        coordinates: {
          latitude: city.lat + latVariance,
          longitude: city.lng + lngVariance
        },
        units: Math.floor(Math.random() * 50) + 1,
        revenue: Math.floor(Math.random() * 50000) + 10000
      });
    }
    
    return result;
  },
  
  // Generate sample tasks for the sortable task list
  tasks: (count = 100) => {
    const result = [];
    
    const titles = [
      'Fix leaking faucet', 'Replace HVAC filter', 'Repair broken cabinet door',
      'Paint hallway walls', 'Inspect roof', 'Replace smoke detectors',
      'Fix garbage disposal', 'Unclog bathroom drain', 'Repair door lock',
      'Replace ceiling fan', 'Clean gutters', 'Fix electrical outlet'
    ];
    
    const locations = [
      'Apt #101', 'Apt #202', 'Apt #303', 'Apt #404', 'Building A',
      'Building B', 'Common Area', 'Pool', 'Gym', 'Parking Garage', 
      'Unit 505', 'Unit 606'
    ];
    
    const statuses = ['New', 'In Progress', 'Pending', 'Completed', 'Urgent'];
    const priorities = ['low', 'medium', 'high'];
    
    const assignees = [
      { id: 'user-1', name: 'John Smith', avatar: null },
      { id: 'user-2', name: 'Jane Doe', avatar: null },
      { id: 'user-3', name: 'Mike Johnson', avatar: null },
      { id: 'user-4', name: 'Sarah Williams', avatar: null },
      { id: 'user-5', name: 'Robert Brown', avatar: null }
    ];
    
    // Generate random dates within the next 30 days
    const getRandomFutureDate = () => {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + Math.floor(Math.random() * 30) + 1);
      return futureDate.toISOString().split('T')[0];
    };
    
    for (let i = 0; i < count; i++) {
      result.push({
        id: `task-${i + 1}`,
        title: `${titles[Math.floor(Math.random() * titles.length)]} in ${locations[Math.floor(Math.random() * locations.length)]}`,
        description: `This maintenance task requires attention. Please address this issue promptly and update the status when complete.`,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        dueDate: getRandomFutureDate(),
        assignee: assignees[Math.floor(Math.random() * assignees.length)]
      });
    }
    
    return result;
  }
};

// Performance measurement utilities
export const performanceTesting = {
  // Measure component render time
  measureRenderTime: (callback, iterations = 5) => {
    const results = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      callback();
      const end = performance.now();
      results.push(end - start);
    }
    
    return {
      average: results.reduce((sum, time) => sum + time, 0) / results.length,
      min: Math.min(...results),
      max: Math.max(...results),
      measurements: results
    };
  },
  
  // Monitor memory usage
  monitorMemoryUsage: async (callback) => {
    let beforeMemory = null;
    let afterMemory = null;
    
    if (performance.memory) {
      beforeMemory = { ...performance.memory };
    }
    
    await callback();
    
    if (performance.memory) {
      afterMemory = { ...performance.memory };
    }
    
    if (beforeMemory && afterMemory) {
      return {
        usedJSHeapSizeDiff: afterMemory.usedJSHeapSize - beforeMemory.usedJSHeapSize,
        usedJSHeapSizeBefore: beforeMemory.usedJSHeapSize,
        usedJSHeapSizeAfter: afterMemory.usedJSHeapSize,
        jsHeapSizeLimit: afterMemory.jsHeapSizeLimit
      };
    }
    
    return {
      memoryMeasurementNotSupported: true,
      message: 'Performance.memory is not available in this browser'
    };
  },
  
  // Measure interaction performance (e.g., dragging in sortable list)
  measureInteractionPerformance: (callback, interactionCount = 10) => {
    const frameTimes = [];
    let slowFrames = 0;
    let frameCallback;
    
    return new Promise((resolve) => {
      let count = 0;
      
      const measureFrame = (timestamp) => {
        if (frameTimes.length > 0) {
          const frameTime = timestamp - frameTimes[frameTimes.length - 1];
          frameTimes.push(timestamp);
          
          // Consider frames taking longer than 16.7ms (60fps) as slow
          if (frameTime > 16.7) {
            slowFrames++;
          }
        } else {
          frameTimes.push(timestamp);
        }
        
        if (count < interactionCount) {
          count++;
          callback(count);
          frameCallback = requestAnimationFrame(measureFrame);
        } else {
          cancelAnimationFrame(frameCallback);
          
          // Calculate frame statistics
          const frameDurations = [];
          for (let i = 1; i < frameTimes.length; i++) {
            frameDurations.push(frameTimes[i] - frameTimes[i - 1]);
          }
          
          resolve({
            averageFrameTime: frameDurations.reduce((sum, time) => sum + time, 0) / frameDurations.length,
            slowFramePercentage: (slowFrames / frameDurations.length) * 100,
            totalFrames: frameDurations.length,
            slowFrames: slowFrames,
            fps: 1000 / (frameDurations.reduce((sum, time) => sum + time, 0) / frameDurations.length)
          });
        }
      };
      
      frameCallback = requestAnimationFrame(measureFrame);
    });
  },
  
  // Run a comprehensive performance test on map component
  testMapPerformance: async (renderMapCallback, markerCount = 500) => {
    console.log(`Testing map performance with ${markerCount} markers...`);
    
    const properties = generateTestData.properties(markerCount);
    
    const renderTime = performanceTesting.measureRenderTime(() => {
      renderMapCallback(properties);
    });
    
    const memoryUsage = await performanceTesting.monitorMemoryUsage(() => {
      return new Promise(resolve => {
        renderMapCallback(properties);
        setTimeout(resolve, 1000); // Wait for rendering to complete
      });
    });
    
    return {
      component: 'PropertyMapVisualization',
      dataSize: markerCount,
      renderTime,
      memoryUsage,
      timestamp: new Date().toISOString()
    };
  },
  
  // Run a comprehensive performance test on sortable task list
  testSortableListPerformance: async (renderListCallback, taskCount = 200) => {
    console.log(`Testing sortable list performance with ${taskCount} tasks...`);
    
    const tasks = generateTestData.tasks(taskCount);
    
    const renderTime = performanceTesting.measureRenderTime(() => {
      renderListCallback(tasks);
    });
    
    const memoryUsage = await performanceTesting.monitorMemoryUsage(() => {
      return new Promise(resolve => {
        renderListCallback(tasks);
        setTimeout(resolve, 1000); // Wait for rendering to complete
      });
    });
    
    // Simulate drag and drop interaction
    const interactionPerformance = await performanceTesting.measureInteractionPerformance((iteration) => {
      // Simulate dragging a task from position 0 to position 5
      const currentTasks = [...tasks];
      const [movedTask] = currentTasks.splice(0, 1);
      currentTasks.splice(5, 0, movedTask);
      renderListCallback(currentTasks);
    });
    
    return {
      component: 'SortableTaskList',
      dataSize: taskCount,
      renderTime,
      memoryUsage,
      interactionPerformance,
      timestamp: new Date().toISOString()
    };
  }
}; 