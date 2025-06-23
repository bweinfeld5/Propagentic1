import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { 
  ComposableMap, 
  Geographies, 
  Geography, 
  Marker,
  ZoomableGroup 
} from 'react-simple-maps';
import { SafeMotion } from "../shared/SafeMotion";

// US map coordinates
const USA_COORDINATES = [-96, 38];
const DEFAULT_ZOOM = 3.5;

/**
 * PropertyMapVisualization Component
 * 
 * A component for visualizing property locations on an interactive map.
 * Supports zooming, tooltips, and property selection.
 */
const PropertyMapVisualization = ({
  properties = [],
  onPropertySelected,
  className = '',
  width = '100%',
  height = 400,
  showTooltips = true,
  mapUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"
}) => {
  const [position, setPosition] = useState({ coordinates: USA_COORDINATES, zoom: DEFAULT_ZOOM });
  const [tooltipContent, setTooltipContent] = useState(null);
  const [activeProperty, setActiveProperty] = useState(null);
  
  // Handle map zoom and pan
  const handleMoveEnd = useCallback((position) => {
    setPosition(position);
  }, []);
  
  // Handle property selection
  const handlePropertyClick = useCallback((property) => {
    setActiveProperty(property.id === activeProperty?.id ? null : property);
    if (onPropertySelected) {
      onPropertySelected(property);
    }
  }, [activeProperty, onPropertySelected]);
  
  // Show tooltip on marker hover
  const handleMarkerHover = useCallback((property, show) => {
    if (showTooltips) {
      setTooltipContent(show ? property : null);
    }
  }, [showTooltips]);
  
  // Get color for property marker based on status or type
  const getMarkerColor = useCallback((property) => {
    // Colors based on property status
    if (!property.status || property.status === 'active') {
      return "#00AB9E"; // propagentic-teal 
    }
    
    if (property.status === 'vacant') {
      return "#FFCC00"; // Yellow/warning
    }
    
    if (property.status === 'maintenance') {
      return "#FF9933"; // Orange
    }
    
    if (property.status === 'construction') {
      return "#1a83ff"; // Blue
    }
    
    return "#00AB9E"; // Default to teal
  }, []);
  
  // Process properties to ensure they have coordinates
  const propertyMarkers = useMemo(() => {
    return properties.filter(property => 
      property.coordinates && 
      property.coordinates.latitude && 
      property.coordinates.longitude
    );
  }, [properties]);
  
  return (
    <div className={`relative ${className}`}>
      <SafeMotion.div 
        className="rounded-lg overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-propagentic-slate-dark"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <ComposableMap
          width={width}
          height={height}
          projection="geoAlbersUsa"
          className="text-gray-700 dark:text-gray-300"
        >
          <ZoomableGroup
            zoom={position.zoom}
            center={position.coordinates}
            onMoveEnd={handleMoveEnd}
            filterZoomEvent={evt => !evt.altKey}
          >
            <Geographies geography={mapUrl}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#E5E7EB" // light-gray
                    stroke="#D1D5DB" // gray-300
                    className="dark:fill-propagentic-slate dark:stroke-propagentic-slate-light outline-none focus:outline-none hover:fill-gray-200 dark:hover:fill-propagentic-slate-light transition-colors duration-200"
                  />
                ))
              }
            </Geographies>
            
            {/* Property Markers */}
            {propertyMarkers.map((property) => (
              <Marker
                key={property.id}
                coordinates={[property.coordinates.longitude, property.coordinates.latitude]}
                onMouseEnter={() => handleMarkerHover(property, true)}
                onMouseLeave={() => handleMarkerHover(property, false)}
                onClick={() => handlePropertyClick(property)}
              >
                <SafeMotion.circle
                  r={property.id === activeProperty?.id ? 8 : 5}
                  fill={getMarkerColor(property)}
                  stroke="#fff"
                  strokeWidth={2}
                  className="cursor-pointer"
                  whileHover={{ 
                    scale: 1.3,
                    transition: { duration: 0.2 }
                  }}
                  animate={{ 
                    r: property.id === activeProperty?.id ? 8 : 5,
                    scale: property.id === activeProperty?.id ? 1.2 : 1
                  }}
                  transition={{ duration: 0.3 }}
                />
              </Marker>
            ))}
          </ZoomableGroup>
        </ComposableMap>
        
        {/* Tooltip */}
        {tooltipContent && (
          <SafeMotion.div
            className="absolute z-10 bg-white dark:bg-propagentic-slate-dark p-2 rounded shadow-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-800 dark:text-gray-200 max-w-xs"
            style={{
              left: `${tooltipContent.tooltipPosition?.x || '50%'}`,
              top: `${tooltipContent.tooltipPosition?.y || '50%'}`,
              transform: 'translate(-50%, -130%)',
              pointerEvents: 'none'
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="font-medium">{tooltipContent.name}</div>
            {tooltipContent.address && (
              <div className="text-xs text-gray-600 dark:text-gray-400">{tooltipContent.address}</div>
            )}
            {tooltipContent.status && (
              <div className="text-xs mt-1">
                <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  {tooltipContent.status}
                </span>
              </div>
            )}
          </SafeMotion.div>
        )}
      </SafeMotion.div>
      
      {/* Map Controls */}
      <div className="absolute bottom-3 right-3 flex flex-col space-y-2">
        <SafeMotion.button
          className="w-8 h-8 rounded-full bg-white dark:bg-propagentic-slate text-gray-700 dark:text-gray-300 shadow-md flex items-center justify-center focus:outline-none hover:bg-gray-100 dark:hover:bg-propagentic-slate-light"
          onClick={() => setPosition(prev => ({ ...prev, zoom: prev.zoom + 1 }))}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </SafeMotion.button>
        <SafeMotion.button
          className="w-8 h-8 rounded-full bg-white dark:bg-propagentic-slate text-gray-700 dark:text-gray-300 shadow-md flex items-center justify-center focus:outline-none hover:bg-gray-100 dark:hover:bg-propagentic-slate-light"
          onClick={() => setPosition(prev => ({ ...prev, zoom: prev.zoom - 1 }))}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          disabled={position.zoom <= 1}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
          </svg>
        </SafeMotion.button>
        <SafeMotion.button
          className="w-8 h-8 rounded-full bg-white dark:bg-propagentic-slate text-gray-700 dark:text-gray-300 shadow-md flex items-center justify-center focus:outline-none hover:bg-gray-100 dark:hover:bg-propagentic-slate-light"
          onClick={() => setPosition({ coordinates: USA_COORDINATES, zoom: DEFAULT_ZOOM })}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </SafeMotion.button>
      </div>
      
      {/* Properties Legend */}
      <SafeMotion.div 
        className="absolute top-3 left-3 bg-white/90 dark:bg-propagentic-slate-dark/90 backdrop-blur-sm p-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-300"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="font-medium mb-1">Properties</div>
        <div className="space-y-1">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-propagentic-teal mr-2"></div>
            <span>Active</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></div>
            <span>Vacant</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-orange-400 mr-2"></div>
            <span>Maintenance</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
            <span>Construction</span>
          </div>
        </div>
      </SafeMotion.div>
    </div>
  );
};

PropertyMapVisualization.propTypes = {
  properties: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      coordinates: PropTypes.shape({
        latitude: PropTypes.number.isRequired,
        longitude: PropTypes.number.isRequired
      }).isRequired,
      status: PropTypes.string,
      address: PropTypes.string,
      type: PropTypes.string
    })
  ),
  onPropertySelected: PropTypes.func,
  className: PropTypes.string,
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  showTooltips: PropTypes.bool,
  mapUrl: PropTypes.string
};

export default PropertyMapVisualization; 