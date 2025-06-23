# Interactive Dashboard Features Implementation

To make the dashboard more interactive and enhance the demo experience, implement these additional features:

## 1. Drag-and-Drop Maintenance Priority System

```jsx
// Install needed package:
// npm install react-beautiful-dnd

// src/components/landlord/DraggableRequestList.jsx
import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import StatusBadge from '../shared/StatusBadge';

const DraggableRequestList = ({ requests, onReorder }) => {
  const handleDragEnd = (result) => {
    // Dropped outside a valid drop zone
    if (!result.destination) return;
    
    // Reorder logic
    const items = Array.from(requests);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Notify parent component of the reordering
    onReorder(items);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="requests">
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="space-y-2"
          >
            {requests.map((request, index) => (
              <Draggable key={request.id} draggableId={request.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`bg-white p-4 rounded-lg border ${
                      snapshot.isDragging 
                        ? 'border-teal-500 shadow-lg' 
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between">
                      <div>
                        <h4 className="font-medium">{request.title}</h4>
                        <p className="text-sm text-gray-500">{request.location}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <StatusBadge status={request.status} />
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className="h-5 w-5 text-gray-400" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default DraggableRequestList;
```

## 2. Expandable Property Cards with Animation

```jsx
// src/components/landlord/ExpandablePropertyCard.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ExpandablePropertyCard = ({ property }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div 
      className="bg-white rounded-xl shadow-md overflow-hidden cursor-pointer"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Card Header - Always visible */}
      <div className="p-5 flex justify-between items-center">
        <div>
          <h3 className="font-medium text-lg text-gray-900">{property.name}</h3>
          <p className="text-gray-500 text-sm">{property.address}</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            property.isOccupied 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {property.isOccupied ? 'Occupied' : 'Vacant'}
          </span>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 text-gray-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
        </div>
      </div>
      
      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-gray-200"
          >
            <div className="p-5 space-y-4">
              {/* Property Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="block text-gray-500">Units</span>
                  <span className="block text-lg font-medium">{property.numberOfUnits}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="block text-gray-500">Tenants</span>
                  <span className="block text-lg font-medium">{property.occupiedUnits}</span>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="flex space-x-2">
                <button className="flex-1 py-2 px-3 bg-teal-100 text-teal-700 rounded-md text-sm font-medium hover:bg-teal-200 transition-colors">
                  View Details
                </button>
                <button className="flex-1 py-2 px-3 bg-blue-100 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-200 transition-colors">
                  Manage Tenants
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExpandablePropertyCard;
```

## 3. Interactive Dashboard Demo with Guided Tour

```jsx
// Install needed package:
// npm install react-joyride

// src/components/demo/GuidedDashboardDemo.jsx
import React, { useState } from 'react';
import Joyride, { STATUS } from 'react-joyride';
import LandlordDashboard from '../landlord/LandlordDashboard';

const GuidedDashboardDemo = () => {
  const [runTour, setRunTour] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  // Define the tour steps
  const steps = [
    {
      target: '.dashboard-overview-section',
      content: 'This is your dashboard overview. It shows key metrics about your properties at a glance.',
      disableBeacon: true,
    },
    {
      target: '.maintenance-requests-section',
      content: 'Here you can see all maintenance requests from your tenants. You can filter, sort, and prioritize them.',
    },
    {
      target: '.properties-table-section',
      content: 'This table shows all your properties. You can filter by occupancy status and click on a property for more details.',
    },
    {
      target: '.quick-actions-section',
      content: 'Quick actions let you perform common tasks with just one click.',
    },
  ];

  const handleJoyrideCallback = (data) => {
    const { status, index } = data;
    
    // Update the step index
    setStepIndex(index);
    
    // Tour is finished or skipped
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRunTour(false);
    }
  };

  return (
    <div>
      {/* Tour Button */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setRunTour(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-indigo-700 transition-colors flex items-center"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 mr-2" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
          </svg>
          Take a Tour
        </button>
      </div>
      
      {/* Tour Component */}
      <Joyride
        steps={steps}
        run={runTour}
        continuous
        showProgress
        showSkipButton
        callback={handleJoyrideCallback}
        styles={{
          options: {
            primaryColor: '#0d9488', // teal-600
            textColor: '#374151', // gray-700
            zIndex: 1000,
          },
        }}
      />
      
      {/* Regular Dashboard */}
      <LandlordDashboard />
    </div>
  );
};

export default GuidedDashboardDemo;
```

## 4. Interactive Property Map Feature

```jsx
// Install needed package:
// npm install react-simple-maps

// src/components/landlord/PropertyMapView.jsx
import React, { useState } from 'react';
import { 
  ComposableMap, 
  Geographies, 
  Geography, 
  Marker,
  ZoomableGroup
} from 'react-simple-maps';
import { motion } from 'framer-motion';

// US map data
const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const PropertyMapView = ({ properties }) => {
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [tooltip, setTooltip] = useState('');
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  
  return (
    <div className="relative h-96 bg-blue-50 rounded-xl overflow-hidden">
      <ComposableMap
        projection="geoAlbersUsa"
        projectionConfig={{ scale: 1000 }}
        className="w-full h-full"
      >
        <ZoomableGroup>
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map(geo => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#dbeafe" // bg-blue-100
                  stroke="#93c5fd" // bg-blue-300
                  className="outline-none focus:outline-none hover:fill-blue-200 transition-colors duration-200"
                />
              ))
            }
          </Geographies>
          
          {/* Property Markers */}
          {properties.map(property => (
            <Marker
              key={property.id}
              coordinates={[property.coordinates.long, property.coordinates.lat]}
              onMouseEnter={() => {
                setTooltip(property.name);
              }}
              onMouseLeave={() => {
                setTooltip('');
              }}
              onMouseMove={(evt) => {
                setTooltipPos({ x: evt.clientX, y: evt.clientY });
              }}
              onClick={() => setSelectedProperty(property)}
            >
              <circle
                r={6}
                fill={property.isOccupied ? "#10b981" : "#f59e0b"} // emerald-500 or amber-500
                stroke="#fff"
                strokeWidth={2}
                className="cursor-pointer hover:r-8 transition-all duration-200"
              />
            </Marker>
          ))}
        </ZoomableGroup>
      </ComposableMap>
      
      {/* Tooltip */}
      {tooltip && (
        <div 
          className="absolute bg-white px-2 py-1 rounded shadow-md text-sm z-10 pointer-events-none"
          style={{ 
            left: tooltipPos.x, 
            top: tooltipPos.y - 40,
            transform: 'translate(-50%, -100%)'
          }}
        >
          {tooltip}
        </div>
      )}
      
      {/* Property Details Panel */}
      <AnimatePresence>
        {selectedProperty && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            className="absolute top-0 right-0 w-72 h-full bg-white shadow-lg p-4"
          >
            <div className="flex justify-between items-start">
              <h3 className="font-medium text-lg">{selectedProperty.name}</h3>
              <button 
                onClick={() => setSelectedProperty(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            <p className="text-sm text-gray-500 mt-1">{selectedProperty.address}</p>
            
            <div className="mt-4 space-y-3">
              <div className="bg-gray-50 p-3 rounded">
                <div className="flex justify-between">
                  <span className="text-gray-500">Occupancy:</span>
                  <span className="font-medium">{selectedProperty.occupancyRate}%</span>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="flex justify-between">
                  <span className="text-gray-500">Units:</span>
                  <span className="font-medium">{selectedProperty.numberOfUnits}</span>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="flex justify-between">
                  <span className="text-gray-500">Active Tickets:</span>
                  <span className="font-medium">{selectedProperty.activeTickets || 0}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <button className="w-full bg-teal-600 text-white py-2 rounded-md hover:bg-teal-700 transition-colors">
                View Property Details
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PropertyMapView;
```

## 5. Time-Series Rent Collection Chart

```jsx
// Install needed package:
// npm install react-chartjs-2 chart.js

// src/components/landlord/RentCollectionChart.jsx
import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const timeRanges = [
  { label: '30 Days', value: '30d' },
  { label: '90 Days', value: '90d' },
  { label: '6 Months', value: '6m' },
  { label: '1 Year', value: '1y' },
];

const RentCollectionChart = ({ rentData }) => {
  const [timeRange, setTimeRange] = useState('30d');
  
  // Filter data based on selected time range
  const getFilteredData = () => {
    // In a real app, this would filter based on the timeRange
    // For demo, we'll just return different subsets of the data
    switch(timeRange) {
      case '90d':
        return rentData.slice(0, 3);
      case '6m':
        return rentData.slice(0, 6);
      case '1y':
        return rentData;
      default: // 30d
        return rentData.slice(0, 1);
    }
  };
  
  const filteredData = getFilteredData();
  
  const chartData = {
    labels: filteredData.map(d => d.month),
    datasets: [
      {
        label: 'Rent Collected',
        data: filteredData.map(d => d.collected),
        borderColor: '#0d9488', // teal-600
        backgroundColor: 'rgba(13, 148, 136, 0.1)', // teal-600 with opacity
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Expected Rent',
        data: filteredData.map(d => d.expected),
        borderColor: '#6b7280', // gray-500
        backgroundColor: 'transparent',
        borderDashed: [5, 5],
        tension: 0.4,
      },
    ],
  };
  
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Rent Collection Over Time',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: $${value.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      y: {
        ticks: {
          callback: function(value) {
            return '$' + value.toLocaleString();
          }
        }
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-5">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-gray-900">Rent Collection</h3>
        
        {/* Time range selector */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {timeRanges.map(range => (
            <button
              key={range.value}
              className={`px-3 py-1 text-xs font-medium rounded-md ${
                timeRange === range.value
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setTimeRange(range.value)}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="h-64">
        <Line data={chartData} options={options} />
      </div>
      
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="text-center">
          <span className="block text-gray-500">Collection Rate</span>
          <span className="text-2xl font-bold text-teal-600">
            {Math.round((filteredData.reduce((sum, d) => sum + d.collected, 0) / 
              filteredData.reduce((sum, d) => sum + d.expected, 0)) * 100)}%
          </span>
        </div>
        <div className="text-center">
          <span className="block text-gray-500">Total Collected</span>
          <span className="text-2xl font-bold text-gray-800">
            ${filteredData.reduce((sum, d) => sum + d.collected, 0).toLocaleString()}
          </span>
        </div>
        <div className="text-center">
          <span className="block text-gray-500">Outstanding</span>
          <span className="text-2xl font-bold text-amber-500">
            ${(filteredData.reduce((sum, d) => sum + d.expected, 0) - 
               filteredData.reduce((sum, d) => sum + d.collected, 0)).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default RentCollectionChart;
```

## Integration Plan

To integrate these interactive components effectively:

1. **First Phase: Basic UI Improvements**
   - Implement the styling updates to cards and badges
   - Create the StatusBadge component
   - Add consistent styling to the About page
   
2. **Second Phase: Dashboard Enhancements**
   - Add the GradientStatCard component to the dashboard
   - Implement the OccupancyChart for property statistics
   - Integrate the ExpandablePropertyCard into the property list
   
3. **Third Phase: Advanced Interactivity**
   - Add the DraggableRequestList for maintenance tickets
   - Implement the RentCollectionChart for financial insights
   - Add the PropertyMapView for geographical representation
   
4. **Final Phase: Guided Tour and Polishing**
   - Implement the GuidedDashboardDemo component
   - Add smooth page transitions with Framer Motion
   - Final UI adjustments and consistency checks

The completed dashboard will feature a rich, interactive experience that showcases PropAgentic's capabilities far more effectively than the current static UI. 