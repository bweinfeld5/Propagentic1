/**
 * Uptime Monitoring Service for PropAgentic
 * Monitors Firebase connectivity, API endpoints, and external services
 * Provides real-time status tracking and alerting system
 */

import { 
  connectFirestoreEmulator, 
  enableNetwork, 
  disableNetwork,
  doc,
  getDoc,
  writeBatch,
  collection,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { 
  connectAuthEmulator,
  onAuthStateChanged 
} from 'firebase/auth';
import { db, auth } from '../firebase/config';

class UptimeMonitoringService {
  constructor() {
    this.isInitialized = false;
    this.monitoringInterval = null;
    this.alertInterval = null;
    this.checkInterval = 30000; // 30 seconds
    this.alertThreshold = 3; // Alert after 3 consecutive failures
    this.services = new Map();
    this.statusHistory = [];
    this.maxHistorySize = 288; // 24 hours at 5-minute intervals
    this.alertCallbacks = [];
    this.consecutiveFailures = new Map();
    
    this.initializeServices();
    this.initialize();
  }

  /**
   * Initialize monitoring service
   */
  async initialize() {
    try {
      // Setup periodic monitoring
      this.startMonitoring();
      
      // Setup alert processing
      this.startAlertProcessing();
      
      // Setup network status monitoring
      this.setupNetworkMonitoring();
      
      // Setup Firebase connection monitoring
      this.setupFirebaseConnectionMonitoring();
      
      this.isInitialized = true;
      console.log('[UptimeMonitoring] Service initialized successfully');
      
      // Run initial health check
      await this.runHealthCheck();
    } catch (error) {
      console.error('[UptimeMonitoring] Failed to initialize:', error);
    }
  }

  /**
   * Initialize service configurations
   */
  initializeServices() {
    this.services.set('firebase-firestore', {
      name: 'Firebase Firestore',
      type: 'database',
      checkFunction: this.checkFirestoreHealth.bind(this),
      critical: true,
      timeout: 10000
    });

    this.services.set('firebase-auth', {
      name: 'Firebase Authentication',
      type: 'auth',
      checkFunction: this.checkAuthHealth.bind(this),
      critical: true,
      timeout: 10000
    });

    this.services.set('firebase-storage', {
      name: 'Firebase Storage',
      type: 'storage',
      checkFunction: this.checkStorageHealth.bind(this),
      critical: false,
      timeout: 15000
    });

    // External API endpoints
    this.services.set('stripe-api', {
      name: 'Stripe API',
      type: 'external_api',
      url: 'https://api.stripe.com/v1/charges',
      checkFunction: this.checkExternalAPIHealth.bind(this),
      critical: false,
      timeout: 15000
    });

    this.services.set('google-maps', {
      name: 'Google Maps API',
      type: 'external_api',
      url: 'https://maps.googleapis.com/maps/api/js',
      checkFunction: this.checkGoogleMapsHealth.bind(this),
      critical: false,
      timeout: 10000
    });

    // Internal API endpoints (if any)
    this.services.set('propAgentic-api', {
      name: 'PropAgentic API',
      type: 'internal_api',
      url: process.env.REACT_APP_API_URL || 'https://api.propagentic.com',
      checkFunction: this.checkInternalAPIHealth.bind(this),
      critical: false,
      timeout: 15000
    });
  }

  /**
   * Start periodic monitoring
   */
  startMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(async () => {
      await this.runHealthCheck();
    }, this.checkInterval);

    console.log('[UptimeMonitoring] Periodic monitoring started');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    if (this.alertInterval) {
      clearInterval(this.alertInterval);
      this.alertInterval = null;
    }

    console.log('[UptimeMonitoring] Monitoring stopped');
  }

  /**
   * Run comprehensive health check
   */
  async runHealthCheck() {
    const checkId = this.generateCheckId();
    const timestamp = new Date().toISOString();
    const results = {};

    console.log(`[UptimeMonitoring] Running health check: ${checkId}`);

    // Check all services in parallel
    const checkPromises = Array.from(this.services.entries()).map(async ([serviceId, service]) => {
      try {
        const startTime = performance.now();
        const result = await this.checkServiceHealth(service);
        const responseTime = performance.now() - startTime;

        results[serviceId] = {
          ...result,
          responseTime: Math.round(responseTime),
          timestamp
        };
      } catch (error) {
        results[serviceId] = {
          status: 'down',
          error: error.message,
          timestamp,
          responseTime: service.timeout
        };
      }
    });

    await Promise.allSettled(checkPromises);

    // Process results
    const healthCheckResult = {
      checkId,
      timestamp,
      services: results,
      overallStatus: this.calculateOverallStatus(results),
      networkStatus: navigator.onLine ? 'online' : 'offline'
    };

    // Update status history
    this.updateStatusHistory(healthCheckResult);

    // Check for alerts
    this.processAlerts(healthCheckResult);

    // Report to analytics
    this.reportHealthMetrics(healthCheckResult);

    return healthCheckResult;
  }

  /**
   * Check individual service health
   */
  async checkServiceHealth(service) {
    return new Promise(async (resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Health check timeout (${service.timeout}ms)`));
      }, service.timeout);

      try {
        const result = await service.checkFunction(service);
        clearTimeout(timeoutId);
        resolve(result);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * Check Firestore health
   */
  async checkFirestoreHealth() {
    try {
      // Try to read a test document
      const testDocRef = doc(db, '_health', 'status');
      await getDoc(testDocRef);
      
      // Try to write a test document
      const testCollection = collection(db, '_health_checks');
      await addDoc(testCollection, {
        timestamp: serverTimestamp(),
        type: 'uptime_check'
      });

      return { status: 'up', message: 'Firestore operations successful' };
    } catch (error) {
      return { status: 'down', error: error.message };
    }
  }

  /**
   * Check Authentication health
   */
  async checkAuthHealth() {
    try {
      return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, () => {
          unsubscribe();
          resolve({ status: 'up', message: 'Auth service responsive' });
        });

        // Timeout if no response
        setTimeout(() => {
          unsubscribe();
          resolve({ status: 'down', error: 'Auth service timeout' });
        }, 5000);
      });
    } catch (error) {
      return { status: 'down', error: error.message };
    }
  }

  /**
   * Check Storage health
   */
  async checkStorageHealth() {
    try {
      // Since we can't easily test storage without uploading,
      // we'll check if the storage instance is available
      if (window.firebase && window.firebase.storage) {
        return { status: 'up', message: 'Storage service available' };
      }
      return { status: 'down', error: 'Storage service unavailable' };
    } catch (error) {
      return { status: 'down', error: error.message };
    }
  }

  /**
   * Check external API health
   */
  async checkExternalAPIHealth(service) {
    try {
      const response = await fetch(service.url, {
        method: 'HEAD',
        mode: 'no-cors'
      });
      
      return { status: 'up', message: 'External API responsive' };
    } catch (error) {
      return { status: 'down', error: error.message };
    }
  }

  /**
   * Check Google Maps health
   */
  async checkGoogleMapsHealth() {
    try {
      if (window.google && window.google.maps) {
        return { status: 'up', message: 'Google Maps loaded' };
      }
      
      // Try to load Google Maps script
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places`;
      
      return new Promise((resolve) => {
        script.onload = () => {
          resolve({ status: 'up', message: 'Google Maps API loaded' });
        };
        script.onerror = () => {
          resolve({ status: 'down', error: 'Failed to load Google Maps API' });
        };
        
        setTimeout(() => {
          resolve({ status: 'down', error: 'Google Maps API timeout' });
        }, 8000);
      });
    } catch (error) {
      return { status: 'down', error: error.message };
    }
  }

  /**
   * Check internal API health
   */
  async checkInternalAPIHealth(service) {
    try {
      const response = await fetch(`${service.url}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        return { status: 'up', message: 'Internal API healthy' };
      } else {
        return { status: 'down', error: `HTTP ${response.status}` };
      }
    } catch (error) {
      return { status: 'down', error: error.message };
    }
  }

  /**
   * Calculate overall system status
   */
  calculateOverallStatus(results) {
    const criticalServices = Array.from(this.services.entries())
      .filter(([_, service]) => service.critical)
      .map(([id, _]) => id);

    const criticalDown = criticalServices.some(serviceId => 
      results[serviceId]?.status === 'down'
    );

    if (criticalDown) {
      return 'critical';
    }

    const anyDown = Object.values(results).some(result => result.status === 'down');
    if (anyDown) {
      return 'degraded';
    }

    return 'operational';
  }

  /**
   * Update status history
   */
  updateStatusHistory(healthCheckResult) {
    this.statusHistory.push(healthCheckResult);
    
    // Trim history to max size
    if (this.statusHistory.length > this.maxHistorySize) {
      this.statusHistory = this.statusHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Process alerts based on health check results
   */
  processAlerts(healthCheckResult) {
    Object.entries(healthCheckResult.services).forEach(([serviceId, result]) => {
      if (result.status === 'down') {
        const failures = this.consecutiveFailures.get(serviceId) || 0;
        this.consecutiveFailures.set(serviceId, failures + 1);

        if (failures + 1 >= this.alertThreshold) {
          this.triggerAlert({
            type: 'service_down',
            serviceId,
            serviceName: this.services.get(serviceId)?.name || serviceId,
            consecutiveFailures: failures + 1,
            error: result.error,
            timestamp: healthCheckResult.timestamp,
            critical: this.services.get(serviceId)?.critical || false
          });
        }
      } else {
        // Reset failure count on success
        this.consecutiveFailures.set(serviceId, 0);
      }
    });

    // Check overall system status
    if (healthCheckResult.overallStatus === 'critical') {
      this.triggerAlert({
        type: 'system_critical',
        message: 'Critical services are down',
        timestamp: healthCheckResult.timestamp,
        critical: true
      });
    }
  }

  /**
   * Trigger alert
   */
  triggerAlert(alertData) {
    console.warn('[UptimeMonitoring] ALERT:', alertData);

    // Store alert locally
    this.storeAlert(alertData);

    // Notify alert callbacks
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alertData);
      } catch (error) {
        console.error('[UptimeMonitoring] Alert callback error:', error);
      }
    });

    // Send to external monitoring services
    this.sendExternalAlert(alertData);

    // Send to analytics
    if (window.gtag) {
      window.gtag('event', 'uptime_alert', {
        alert_type: alertData.type,
        service_id: alertData.serviceId,
        critical: alertData.critical
      });
    }
  }

  /**
   * Store alert locally
   */
  storeAlert(alertData) {
    try {
      const alerts = this.getStoredAlerts();
      alerts.push({
        ...alertData,
        id: this.generateAlertId()
      });
      
      // Keep only last 100 alerts
      const trimmedAlerts = alerts.slice(-100);
      localStorage.setItem('propAgentic_uptime_alerts', JSON.stringify(trimmedAlerts));
    } catch (error) {
      console.warn('[UptimeMonitoring] Failed to store alert:', error);
    }
  }

  /**
   * Send alert to external monitoring services
   */
  async sendExternalAlert(alertData) {
    try {
      // Send to Firebase for admin notification
      await addDoc(collection(db, 'uptime_alerts'), {
        ...alertData,
        timestamp: serverTimestamp(),
        resolved: false
      });

      // Send to error reporting service
      const { default: errorReportingService } = await import('./errorReportingService');
      await errorReportingService.captureMessage(
        `Uptime Alert: ${alertData.type}`,
        'warning',
        { alertData }
      );
    } catch (error) {
      console.warn('[UptimeMonitoring] Failed to send external alert:', error);
    }
  }

  /**
   * Setup network status monitoring
   */
  setupNetworkMonitoring() {
    window.addEventListener('online', () => {
      console.log('[UptimeMonitoring] Network connection restored');
      this.triggerAlert({
        type: 'network_restored',
        message: 'Internet connection restored',
        timestamp: new Date().toISOString(),
        critical: false
      });
    });

    window.addEventListener('offline', () => {
      console.warn('[UptimeMonitoring] Network connection lost');
      this.triggerAlert({
        type: 'network_lost',
        message: 'Internet connection lost',
        timestamp: new Date().toISOString(),
        critical: true
      });
    });
  }

  /**
   * Setup Firebase connection monitoring
   */
  setupFirebaseConnectionMonitoring() {
    // Monitor Firestore connection status
    let isOnline = true;
    
    const checkConnection = async () => {
      try {
        await enableNetwork(db);
        if (!isOnline) {
          isOnline = true;
          this.triggerAlert({
            type: 'firebase_restored',
            message: 'Firebase connection restored',
            timestamp: new Date().toISOString(),
            critical: false
          });
        }
      } catch (error) {
        if (isOnline) {
          isOnline = false;
          this.triggerAlert({
            type: 'firebase_lost',
            message: 'Firebase connection lost',
            timestamp: new Date().toISOString(),
            critical: true
          });
        }
      }
    };

    // Check Firebase connection every minute
    setInterval(checkConnection, 60000);
  }

  /**
   * Start alert processing
   */
  startAlertProcessing() {
    this.alertInterval = setInterval(() => {
      this.processPeriodicAlerts();
    }, 300000); // Every 5 minutes
  }

  /**
   * Process periodic alerts (summary, etc.)
   */
  processPeriodicAlerts() {
    const recentHistory = this.statusHistory.slice(-12); // Last hour
    if (recentHistory.length === 0) return;

    const downtime = recentHistory.filter(check => 
      check.overallStatus !== 'operational'
    ).length;

    const uptimePercentage = ((recentHistory.length - downtime) / recentHistory.length) * 100;

    if (uptimePercentage < 95) {
      this.triggerAlert({
        type: 'low_uptime',
        message: `System uptime is ${uptimePercentage.toFixed(1)}% in the last hour`,
        uptimePercentage,
        timestamp: new Date().toISOString(),
        critical: uptimePercentage < 90
      });
    }
  }

  /**
   * Report health metrics to analytics
   */
  reportHealthMetrics(healthCheckResult) {
    if (window.gtag) {
      window.gtag('event', 'uptime_check', {
        overall_status: healthCheckResult.overallStatus,
        services_up: Object.values(healthCheckResult.services)
          .filter(s => s.status === 'up').length,
        services_down: Object.values(healthCheckResult.services)
          .filter(s => s.status === 'down').length,
        network_status: healthCheckResult.networkStatus
      });
    }
  }

  /**
   * Get current system status
   */
  getCurrentStatus() {
    const latestCheck = this.statusHistory[this.statusHistory.length - 1];
    if (!latestCheck) return null;

    return {
      overall: latestCheck.overallStatus,
      services: latestCheck.services,
      lastCheck: latestCheck.timestamp,
      uptime: this.calculateUptime(),
      alerts: this.getRecentAlerts()
    };
  }

  /**
   * Calculate uptime percentage
   */
  calculateUptime(timeframe = 24 * 60 * 60 * 1000) { // 24 hours default
    const cutoff = new Date(Date.now() - timeframe);
    const relevantChecks = this.statusHistory.filter(check => 
      new Date(check.timestamp) >= cutoff
    );

    if (relevantChecks.length === 0) return 100;

    const upChecks = relevantChecks.filter(check => 
      check.overallStatus === 'operational'
    ).length;

    return (upChecks / relevantChecks.length) * 100;
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(limit = 10) {
    return this.getStoredAlerts().slice(-limit);
  }

  /**
   * Get stored alerts from localStorage
   */
  getStoredAlerts() {
    try {
      const stored = localStorage.getItem('propAgentic_uptime_alerts');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Add alert callback
   */
  addAlertCallback(callback) {
    this.alertCallbacks.push(callback);
  }

  /**
   * Remove alert callback
   */
  removeAlertCallback(callback) {
    const index = this.alertCallbacks.indexOf(callback);
    if (index > -1) {
      this.alertCallbacks.splice(index, 1);
    }
  }

  /**
   * Get service status history
   */
  getServiceHistory(serviceId, limit = 50) {
    return this.statusHistory
      .slice(-limit)
      .map(check => ({
        timestamp: check.timestamp,
        status: check.services[serviceId]?.status || 'unknown',
        responseTime: check.services[serviceId]?.responseTime || 0
      }));
  }

  /**
   * Utility methods
   */
  generateCheckId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  generateAlertId() {
    return 'alert_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Get monitoring statistics
   */
  getStats() {
    return {
      totalChecks: this.statusHistory.length,
      uptime: this.calculateUptime(),
      recentAlerts: this.getRecentAlerts(5),
      services: Array.from(this.services.entries()).map(([id, service]) => ({
        id,
        name: service.name,
        type: service.type,
        critical: service.critical,
        currentStatus: this.statusHistory[this.statusHistory.length - 1]?.services[id]?.status || 'unknown'
      }))
    };
  }
}

// Create singleton instance
const uptimeMonitoringService = new UptimeMonitoringService();

export default uptimeMonitoringService; 