import React, { useEffect, useRef, useState } from 'react';
import styles from './AnimatedBlueprintBackground.module.css';
import { blueprintGridDataUri, blueprintDetailsDataUri } from './inline-blueprint-grid';

/**
 * AnimatedBlueprintBackground - Creates a subtle technical blueprint background with parallax effect
 * @param {Object} props - Component props
 * @param {string} props.density - Controls the opacity of the layers ('sparse', 'normal', 'dense')
 * @param {string} props.section - Section identifier for styling (hero, features, etc.)
 * @param {boolean} props.useInlineSvg - Use inline SVGs instead of external files
 * @returns {JSX.Element} - The blueprint background component
 */
const AnimatedBlueprintBackground = ({ 
  density = 'normal', 
  section = 'default',
  useInlineSvg = true // Default to true for reliable rendering
}) => {
  // Refs for tracking elements and component mounted state
  const isMounted = useRef(false);
  const gridRef = useRef(null);
  const detailsRef = useRef(null);
  
  // State for visibility and browser detection
  const [gridVisible, setGridVisible] = useState(true);
  const [detailsVisible, setDetailsVisible] = useState(true);
  const [isSafari, setIsSafari] = useState(false);
  const [isDebugMode, setIsDebugMode] = useState(false);
  // Force inline SVG when external files fail to load
  const [forcedInlineSvg, setForcedInlineSvg] = useState(false);

  // Get appropriate opacity based on density and section
  const getOpacity = (layer) => {
    // Base opacities determined by density
    let baseOpacity = 0.25;
    switch (density) {
      case 'sparse':
        baseOpacity = layer === 'grid' ? 0.15 : 0.18;
        break;
      case 'dense':
        baseOpacity = layer === 'grid' ? 0.35 : 0.4;
        break;
      case 'normal':
      default:
        baseOpacity = layer === 'grid' ? 0.25 : 0.3;
        break;
    }
    
    // Section-specific adjustments for blending
    if (section === 'hero') {
      // Hero section gets special treatment for blend mode integration
      return baseOpacity * 1.3; // Increase opacity for better blend effects
    }
    
    return baseOpacity;
  };

  useEffect(() => {
    isMounted.current = true;
    
    // Detect Safari browser
    const isSafariBrowser = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    setIsSafari(isSafariBrowser);
    
    // Check for debug mode
    const urlParams = new URLSearchParams(window.location.search);
    setIsDebugMode(urlParams.get('debug') === 'true');

    // Handle scroll event for parallax effect
    const handleScroll = () => {
      if (!isMounted.current) return;
      
      const scrollY = window.scrollY;
      
      if (gridRef.current) {
        gridRef.current.style.transform = `translate3d(0, ${scrollY * 0.05}px, 0)`;
      }
      
      if (detailsRef.current) {
        detailsRef.current.style.transform = `translate3d(0, ${scrollY * 0.02}px, 0)`;
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial positioning
    
    // Handle SVG loading errors - fallback to inline SVGs
    const onGridError = () => {
      setForcedInlineSvg(true);
      setGridVisible(true); // Keep visible but switch to inline
    };
    
    const onDetailsError = () => {
      setForcedInlineSvg(true);
      setDetailsVisible(true); // Keep visible but switch to inline
    };
    
    // Test loading external SVGs
    if (!useInlineSvg && !forcedInlineSvg) {
      const testImg = new Image();
      testImg.onerror = () => setForcedInlineSvg(true);
      testImg.src = '/assets/blueprint-grid.svg';
    }
    
    if (gridRef.current) {
      gridRef.current.addEventListener('error', onGridError);
    }
    
    if (detailsRef.current) {
      detailsRef.current.addEventListener('error', onDetailsError);
    }
    
    return () => {
      isMounted.current = false;
      window.removeEventListener('scroll', handleScroll);
      
      if (gridRef.current) {
        gridRef.current.removeEventListener('error', onGridError);
      }
      
      if (detailsRef.current) {
        detailsRef.current.removeEventListener('error', onDetailsError);
      }
    };
  }, [useInlineSvg, forcedInlineSvg]);

  // Create the section class
  const sectionClass = styles[`${section}Section`] || '';
  
  // Determine which SVG sources to use
  const shouldUseInlineSvg = useInlineSvg || forcedInlineSvg;
  
  return (
    <div className={`${styles.background} ${sectionClass}`} style={{ zIndex: 1 }}>
      {gridVisible && (
        <div
          ref={gridRef}
          className={`${styles.gridLayer} ${styles.animatedElement} ${styles.fadeIn}`}
          style={{
            backgroundImage: shouldUseInlineSvg 
              ? `url("${blueprintGridDataUri}")` 
              : 'url("/assets/blueprint-grid.svg")',
            opacity: getOpacity('grid'),
            zIndex: 5
          }}
        />
      )}
      
      {detailsVisible && (
        <div
          ref={detailsRef}
          className={`${styles.detailsLayer} ${styles.animatedElement} ${styles.fadeIn}`}
          style={{
            backgroundImage: shouldUseInlineSvg 
              ? `url("${blueprintDetailsDataUri}")` 
              : 'url("/assets/blueprint-details.svg")',
            opacity: getOpacity('details'),
            zIndex: 6
          }}
        />
      )}

      {isDebugMode && (
        <div style={{
          position: 'fixed',
          bottom: 10,
          right: 10,
          zIndex: 9999,
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          fontSize: '12px'
        }}>
          <div>Section: {section}</div>
          <div>Density: {density}</div>
          <div>Using Inline SVG: {shouldUseInlineSvg ? 'Yes' : 'No'}</div>
          <div>Safari: {isSafari ? 'Yes' : 'No'}</div>
          <div>Grid visible: {gridVisible ? 'Yes' : 'No'}</div>
          <div>Details visible: {detailsVisible ? 'Yes' : 'No'}</div>
        </div>
      )}
    </div>
  );
};

export default AnimatedBlueprintBackground; 