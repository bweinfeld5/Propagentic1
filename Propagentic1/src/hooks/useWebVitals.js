/**
 * Web Vitals and User Experience Monitoring Hook
 * Tracks Core Web Vitals, user interactions, and performance metrics
 * Provides real-time UX monitoring and analytics integration
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export const useWebVitals = (options = {}) => {
  const {
    reportInterval = 30000, // 30 seconds
    enableRealTimeReporting = true,
    enableUserInteractionTracking = true,
    enableNetworkTracking = true,
    onReport = null
  } = options;

  const [vitals, setVitals] = useState({
    fcp: null,      // First Contentful Paint
    lcp: null,      // Largest Contentful Paint
    fid: null,      // First Input Delay
    cls: null,      // Cumulative Layout Shift
    ttfb: null,     // Time to First Byte
    inp: null       // Interaction to Next Paint (new metric)
  });

  const [userExperience, setUserExperience] = useState({
    pageLoadTime: 0,
    domInteractive: 0,
    domComplete: 0,
    firstPaint: 0,
    navigationTiming: {},
    resourceTiming: [],
    networkInfo: {},
    memoryInfo: {},
    deviceInfo: {}
  });

  const [interactionMetrics, setInteractionMetrics] = useState({
    clickLatency: [],
    scrollLatency: [],
    inputLatency: [],
    pageVisibility: 'visible',
    timeOnPage: 0,
    userEngagement: 0
  });

  const reportingRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const observersRef = useRef({});

  /**
   * Initialize Web Vitals monitoring
   */
  useEffect(() => {
    initializeWebVitalsTracking();
    initializeUserExperienceTracking();
    
    if (enableUserInteractionTracking) {
      initializeInteractionTracking();
    }

    if (enableRealTimeReporting) {
      startPeriodicReporting();
    }

    return () => {
      cleanup();
    };
  }, []);

  /**
   * Initialize Core Web Vitals tracking
   */
  const initializeWebVitalsTracking = useCallback(async () => {
    try {
      // Dynamic import to avoid loading if not supported
      const { onCLS, onFCP, onFID, onLCP, onTTFB, onINP } = await import('web-vitals');

      // First Contentful Paint
      onFCP((metric) => {
        setVitals(prev => ({ ...prev, fcp: metric }));
        reportVital('FCP', metric);
      });

      // Largest Contentful Paint
      onLCP((metric) => {
        setVitals(prev => ({ ...prev, lcp: metric }));
        reportVital('LCP', metric);
      });

      // First Input Delay
      onFID((metric) => {
        setVitals(prev => ({ ...prev, fid: metric }));
        reportVital('FID', metric);
      });

      // Cumulative Layout Shift
      onCLS((metric) => {
        setVitals(prev => ({ ...prev, cls: metric }));
        reportVital('CLS', metric);
      });

      // Time to First Byte
      onTTFB((metric) => {
        setVitals(prev => ({ ...prev, ttfb: metric }));
        reportVital('TTFB', metric);
      });

      // Interaction to Next Paint (if available)
      if (onINP) {
        onINP((metric) => {
          setVitals(prev => ({ ...prev, inp: metric }));
          reportVital('INP', metric);
        });
      }

      console.log('[WebVitals] Core Web Vitals tracking initialized');
    } catch (error) {
      console.warn('[WebVitals] Failed to initialize Web Vitals tracking:', error);
      // Fallback to manual tracking
      initializeManualVitalsTracking();
    }
  }, []);

  /**
   * Initialize manual Web Vitals tracking as fallback
   */
  const initializeManualVitalsTracking = useCallback(() => {
    // Track performance timing manually
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      
      // Calculate TTFB manually
      const ttfb = timing.responseStart - timing.requestStart;
      setVitals(prev => ({ ...prev, ttfb: { value: ttfb, rating: ttfb < 200 ? 'good' : ttfb < 500 ? 'needs-improvement' : 'poor' } }));

      // Track FCP using PerformanceObserver
      if ('PerformanceObserver' in window) {
        try {
          const fcpObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.name === 'first-contentful-paint') {
                const fcp = entry.startTime;
                setVitals(prev => ({ 
                  ...prev, 
                  fcp: { 
                    value: fcp, 
                    rating: fcp < 1800 ? 'good' : fcp < 3000 ? 'needs-improvement' : 'poor' 
                  } 
                }));
              }
            }
          });
          fcpObserver.observe({ entryTypes: ['paint'] });
          observersRef.current.fcp = fcpObserver;
        } catch (error) {
          console.warn('[WebVitals] FCP observer failed:', error);
        }
      }
    }
  }, []);

  /**
   * Initialize user experience tracking
   */
  const initializeUserExperienceTracking = useCallback(() => {
    // Navigation timing
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      const navigationTiming = {
        redirectTime: timing.redirectEnd - timing.redirectStart,
        dnsTime: timing.domainLookupEnd - timing.domainLookupStart,
        tcpTime: timing.connectEnd - timing.connectStart,
        requestTime: timing.responseEnd - timing.requestStart,
        responseTime: timing.responseEnd - timing.responseStart,
        domProcessingTime: timing.domComplete - timing.domLoading,
        loadEventTime: timing.loadEventEnd - timing.loadEventStart
      };

      setUserExperience(prev => ({
        ...prev,
        pageLoadTime: timing.loadEventEnd - timing.navigationStart,
        domInteractive: timing.domInteractive - timing.navigationStart,
        domComplete: timing.domComplete - timing.navigationStart,
        navigationTiming
      }));
    }

    // Performance navigation API
    if (window.performance && window.performance.getEntriesByType) {
      const navigationEntries = window.performance.getEntriesByType('navigation');
      if (navigationEntries.length > 0) {
        const nav = navigationEntries[0];
        setUserExperience(prev => ({
          ...prev,
          firstPaint: nav.responseEnd - nav.fetchStart
        }));
      }
    }

    // Resource timing
    trackResourceTiming();

    // Network information
    trackNetworkInfo();

    // Device information
    trackDeviceInfo();

    // Memory information
    trackMemoryInfo();
  }, []);

  /**
   * Track resource timing for performance analysis
   */
  const trackResourceTiming = useCallback(() => {
    if (window.performance && window.performance.getEntriesByType) {
      const resources = window.performance.getEntriesByType('resource');
      const resourceMetrics = resources.map(resource => ({
        name: resource.name,
        duration: resource.duration,
        size: resource.transferSize,
        type: resource.initiatorType,
        startTime: resource.startTime,
        responseEnd: resource.responseEnd
      }));

      setUserExperience(prev => ({
        ...prev,
        resourceTiming: resourceMetrics
      }));
    }
  }, []);

  /**
   * Track network information
   */
  const trackNetworkInfo = useCallback(() => {
    if (navigator.connection) {
      const networkInfo = {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt,
        saveData: navigator.connection.saveData
      };

      setUserExperience(prev => ({
        ...prev,
        networkInfo
      }));

      // Listen for network changes
      navigator.connection.addEventListener('change', () => {
        setUserExperience(prev => ({
          ...prev,
          networkInfo: {
            effectiveType: navigator.connection.effectiveType,
            downlink: navigator.connection.downlink,
            rtt: navigator.connection.rtt,
            saveData: navigator.connection.saveData
          }
        }));
      });
    }
  }, []);

  /**
   * Track device information
   */
  const trackDeviceInfo = useCallback(() => {
    const deviceInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      language: navigator.language,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: navigator.deviceMemory,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      screen: {
        width: window.screen.width,
        height: window.screen.height,
        pixelRatio: window.devicePixelRatio
      }
    };

    setUserExperience(prev => ({
      ...prev,
      deviceInfo
    }));
  }, []);

  /**
   * Track memory information
   */
  const trackMemoryInfo = useCallback(() => {
    if (window.performance && window.performance.memory) {
      const memoryInfo = {
        usedJSHeapSize: window.performance.memory.usedJSHeapSize,
        totalJSHeapSize: window.performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: window.performance.memory.jsHeapSizeLimit
      };

      setUserExperience(prev => ({
        ...prev,
        memoryInfo
      }));
    }
  }, []);

  /**
   * Initialize interaction tracking
   */
  const initializeInteractionTracking = useCallback(() => {
    // Track click latency
    document.addEventListener('click', handleClick);
    
    // Track scroll performance
    document.addEventListener('scroll', handleScroll, { passive: true });
    
    // Track input latency
    document.addEventListener('input', handleInput);
    
    // Track page visibility
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Track time on page
    startTimeTracking();

    console.log('[WebVitals] Interaction tracking initialized');
  }, []);

  /**
   * Handle click events for latency tracking
   */
  const handleClick = useCallback((event) => {
    const clickTime = performance.now();
    
    // Measure time to next paint after click
    requestAnimationFrame(() => {
      const paintTime = performance.now();
      const latency = paintTime - clickTime;
      
      setInteractionMetrics(prev => ({
        ...prev,
        clickLatency: [...prev.clickLatency.slice(-19), latency] // Keep last 20
      }));
    });
  }, []);

  /**
   * Handle scroll events for performance tracking
   */
  const handleScroll = useCallback(() => {
    const scrollTime = performance.now();
    
    requestAnimationFrame(() => {
      const frameTime = performance.now();
      const latency = frameTime - scrollTime;
      
      setInteractionMetrics(prev => ({
        ...prev,
        scrollLatency: [...prev.scrollLatency.slice(-19), latency]
      }));
    });
  }, []);

  /**
   * Handle input events for latency tracking
   */
  const handleInput = useCallback((event) => {
    const inputTime = performance.now();
    
    requestAnimationFrame(() => {
      const responseTime = performance.now();
      const latency = responseTime - inputTime;
      
      setInteractionMetrics(prev => ({
        ...prev,
        inputLatency: [...prev.inputLatency.slice(-19), latency]
      }));
    });
  }, []);

  /**
   * Handle page visibility changes
   */
  const handleVisibilityChange = useCallback(() => {
    setInteractionMetrics(prev => ({
      ...prev,
      pageVisibility: document.visibilityState
    }));
  }, []);

  /**
   * Start time tracking for engagement metrics
   */
  const startTimeTracking = useCallback(() => {
    const updateTimeOnPage = () => {
      const timeOnPage = Date.now() - startTimeRef.current;
      setInteractionMetrics(prev => ({
        ...prev,
        timeOnPage,
        userEngagement: calculateEngagement(timeOnPage, prev)
      }));
    };

    // Update every 10 seconds
    const timeInterval = setInterval(updateTimeOnPage, 10000);
    
    return () => clearInterval(timeInterval);
  }, []);

  /**
   * Calculate user engagement score
   */
  const calculateEngagement = useCallback((timeOnPage, metrics) => {
    let score = 0;
    
    // Time on page factor (max 40 points)
    score += Math.min(timeOnPage / 1000 / 60 * 10, 40); // 10 points per minute, max 40
    
    // Interaction factor (max 30 points)
    const totalInteractions = metrics.clickLatency.length + 
                             metrics.inputLatency.length + 
                             metrics.scrollLatency.length;
    score += Math.min(totalInteractions * 2, 30);
    
    // Performance factor (max 30 points)
    const avgClickLatency = metrics.clickLatency.length > 0 ? 
      metrics.clickLatency.reduce((a, b) => a + b, 0) / metrics.clickLatency.length : 0;
    if (avgClickLatency < 100) score += 30;
    else if (avgClickLatency < 300) score += 20;
    else score += 10;
    
    return Math.min(score, 100);
  }, []);

  /**
   * Report vital metric
   */
  const reportVital = useCallback((name, metric) => {
    console.log(`[WebVitals] ${name}:`, metric.value, metric.rating);
    
    // Send to analytics
    if (window.gtag) {
      window.gtag('event', 'web_vitals', {
        metric_name: name,
        metric_value: metric.value,
        metric_rating: metric.rating,
        metric_id: metric.id
      });
    }

    // Custom reporting callback
    if (onReport) {
      onReport(name, metric);
    }
  }, [onReport]);

  /**
   * Start periodic reporting
   */
  const startPeriodicReporting = useCallback(() => {
    reportingRef.current = setInterval(() => {
      reportCurrentMetrics();
    }, reportInterval);
  }, [reportInterval]);

  /**
   * Report current metrics
   */
  const reportCurrentMetrics = useCallback(() => {
    const report = {
      vitals,
      userExperience,
      interactionMetrics,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    console.log('[WebVitals] Periodic report:', report);

    // Send to analytics
    if (window.gtag) {
      window.gtag('event', 'ux_metrics_report', {
        page_load_time: userExperience.pageLoadTime,
        time_on_page: interactionMetrics.timeOnPage,
        user_engagement: interactionMetrics.userEngagement,
        click_latency_avg: interactionMetrics.clickLatency.length > 0 ? 
          interactionMetrics.clickLatency.reduce((a, b) => a + b, 0) / interactionMetrics.clickLatency.length : 0
      });
    }

    // Custom reporting
    if (onReport) {
      onReport('periodic_report', report);
    }
  }, [vitals, userExperience, interactionMetrics, onReport]);

  /**
   * Get performance score based on Web Vitals
   */
  const getPerformanceScore = useCallback(() => {
    let score = 0;
    let totalMetrics = 0;

    // FCP scoring
    if (vitals.fcp) {
      totalMetrics++;
      if (vitals.fcp.rating === 'good') score += 25;
      else if (vitals.fcp.rating === 'needs-improvement') score += 15;
      else score += 5;
    }

    // LCP scoring
    if (vitals.lcp) {
      totalMetrics++;
      if (vitals.lcp.rating === 'good') score += 25;
      else if (vitals.lcp.rating === 'needs-improvement') score += 15;
      else score += 5;
    }

    // FID scoring
    if (vitals.fid) {
      totalMetrics++;
      if (vitals.fid.rating === 'good') score += 25;
      else if (vitals.fid.rating === 'needs-improvement') score += 15;
      else score += 5;
    }

    // CLS scoring
    if (vitals.cls) {
      totalMetrics++;
      if (vitals.cls.rating === 'good') score += 25;
      else if (vitals.cls.rating === 'needs-improvement') score += 15;
      else score += 5;
    }

    return totalMetrics > 0 ? Math.round(score / totalMetrics * 4) : 0; // Scale to 100
  }, [vitals]);

  /**
   * Get recommendations based on metrics
   */
  const getRecommendations = useCallback(() => {
    const recommendations = [];

    // FCP recommendations
    if (vitals.fcp && vitals.fcp.rating === 'poor') {
      recommendations.push({
        type: 'FCP',
        message: 'First Contentful Paint is slow. Consider optimizing critical resources and reducing render-blocking resources.',
        priority: 'high'
      });
    }

    // LCP recommendations
    if (vitals.lcp && vitals.lcp.rating === 'poor') {
      recommendations.push({
        type: 'LCP',
        message: 'Largest Contentful Paint is slow. Optimize image loading and consider using CDN.',
        priority: 'high'
      });
    }

    // FID recommendations
    if (vitals.fid && vitals.fid.rating === 'poor') {
      recommendations.push({
        type: 'FID',
        message: 'First Input Delay is high. Reduce JavaScript execution time and break up long tasks.',
        priority: 'medium'
      });
    }

    // CLS recommendations
    if (vitals.cls && vitals.cls.rating === 'poor') {
      recommendations.push({
        type: 'CLS',
        message: 'Cumulative Layout Shift is high. Set dimensions for images and avoid inserting content above existing content.',
        priority: 'medium'
      });
    }

    // Interaction recommendations
    const avgClickLatency = interactionMetrics.clickLatency.length > 0 ? 
      interactionMetrics.clickLatency.reduce((a, b) => a + b, 0) / interactionMetrics.clickLatency.length : 0;
    
    if (avgClickLatency > 300) {
      recommendations.push({
        type: 'Interaction',
        message: 'Click response time is slow. Optimize event handlers and reduce main thread work.',
        priority: 'medium'
      });
    }

    return recommendations;
  }, [vitals, interactionMetrics]);

  /**
   * Cleanup function
   */
  const cleanup = useCallback(() => {
    // Clear intervals
    if (reportingRef.current) {
      clearInterval(reportingRef.current);
    }

    // Disconnect observers
    Object.values(observersRef.current).forEach(observer => {
      if (observer && observer.disconnect) {
        observer.disconnect();
      }
    });

    // Remove event listeners
    document.removeEventListener('click', handleClick);
    document.removeEventListener('scroll', handleScroll);
    document.removeEventListener('input', handleInput);
    document.removeEventListener('visibilitychange', handleVisibilityChange);

    console.log('[WebVitals] Cleanup completed');
  }, [handleClick, handleScroll, handleInput, handleVisibilityChange]);

  /**
   * Manual metric reporting
   */
  const reportMetric = useCallback((name, value, rating = 'unknown') => {
    const metric = { name, value, rating, timestamp: Date.now() };
    reportVital(name, metric);
  }, [reportVital]);

  return {
    // Core Web Vitals
    vitals,
    
    // User Experience Metrics
    userExperience,
    
    // Interaction Metrics
    interactionMetrics,
    
    // Analysis
    performanceScore: getPerformanceScore(),
    recommendations: getRecommendations(),
    
    // Actions
    reportMetric,
    reportCurrentMetrics,
    
    // Utils
    isSupported: 'PerformanceObserver' in window,
    isTracking: !!reportingRef.current
  };
}; 