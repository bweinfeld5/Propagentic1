/**
 * Firebase Cloud Functions for comprehensive logging and monitoring
 * Tracks ticket lifecycle events for debugging and analytics
 */

const {onDocumentCreated, onDocumentUpdated} = require("firebase-functions/v2/firestore");
const {https} = require("firebase-functions/v2");
const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");

// Initialize admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Logs ticket lifecycle events by listening to ticket document updates
 */
exports.logTicketLifecycleEvents = onDocumentUpdated({
  document: "tickets/{ticketId}",
  region: "us-central1",
}, async (event) => {
  try {
    const ticketId = event.params.ticketId;
    const beforeData = event.data.before.data();
    const afterData = event.data.after.data();
    
    // Skip if no real change
    if (JSON.stringify(beforeData) === JSON.stringify(afterData)) {
      return;
    }
    
    logger.info(`Ticket ${ticketId} updated`, {
      ticketId,
      previousStatus: beforeData.status,
      newStatus: afterData.status
    });
    
    // Determine what changed and log appropriate event
    const logEvent = {
      ticketId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      changes: {}
    };
    
    // Check for status change
    if (beforeData.status !== afterData.status) {
      logEvent.eventType = "status_change";
      logEvent.changes.status = {
        from: beforeData.status,
        to: afterData.status
      };
    }
    
    // Check for contractor assignment
    if (beforeData.assignedTo !== afterData.assignedTo) {
      logEvent.eventType = logEvent.eventType || "contractor_change";
      logEvent.changes.assignedTo = {
        from: beforeData.assignedTo,
        to: afterData.assignedTo
      };
    }
    
    // Check for urgency change
    if (beforeData.urgency !== afterData.urgency) {
      logEvent.eventType = logEvent.eventType || "urgency_change";
      logEvent.changes.urgency = {
        from: beforeData.urgency,
        to: afterData.urgency
      };
    }
    
    // Check for escalation
    if (!beforeData.escalated && afterData.escalated) {
      logEvent.eventType = "escalation";
      logEvent.changes.escalated = {
        from: false,
        to: true
      };
    }
    
    // If we don't have a specific event type, mark as generic update
    if (!logEvent.eventType) {
      logEvent.eventType = "generic_update";
    }
    
    // Calculate time since last update if available
    if (beforeData.lastUpdated) {
      const lastUpdateTime = beforeData.lastUpdated.toDate();
      const now = new Date();
      const timeDiffMs = now - lastUpdateTime;
      const timeDiffMinutes = Math.floor(timeDiffMs / 60000);
      
      logEvent.timeSinceLastUpdate = {
        ms: timeDiffMs,
        minutes: timeDiffMinutes
      };
    }
    
    // Add to ticket's log collection
    await admin.firestore()
      .collection("tickets")
      .doc(ticketId)
      .collection("logs")
      .add(logEvent);
    
    // For important transitions, add to the global logs collection
    const significantEvents = [
      "status_change", 
      "escalation", 
      "contractor_change"
    ];
    
    if (significantEvents.includes(logEvent.eventType)) {
      await admin.firestore()
        .collection("system_logs")
        .add({
          ...logEvent,
          logType: "ticket_event"
        });
    }
    
    // Track timing metrics for specific transitions
    await trackTransitionMetrics(ticketId, beforeData, afterData);
    
  } catch (error) {
    logger.error(`Error logging ticket lifecycle event for ${event.params.ticketId}:`, error);
  }
});

/**
 * Tracks timing metrics for specific ticket transitions
 */
async function trackTransitionMetrics(ticketId, beforeData, afterData) {
  try {
    // Only track timing for specific transitions
    
    // 1. From "new" to "ready_to_dispatch" (AI classification time)
    if (beforeData.status === "new" && afterData.status === "ready_to_dispatch") {
      const createdAt = beforeData.createdAt?.toDate();
      const classifiedAt = new Date();
      
      if (createdAt) {
        const classificationTimeMs = classifiedAt - createdAt;
        const classificationTimeMinutes = Math.floor(classificationTimeMs / 60000);
        
        await admin.firestore()
          .collection("performance_metrics")
          .add({
            ticketId,
            metricType: "classification_time",
            durationMs: classificationTimeMs,
            durationMinutes: classificationTimeMinutes,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          });
          
        logger.info(`Classification time for ticket ${ticketId}: ${classificationTimeMinutes} minutes`);
      }
    }
    
    // 2. From "ready_to_dispatch" to "assigned" (contractor assignment time)
    if (beforeData.status === "ready_to_dispatch" && 
        (afterData.status === "assigned" || afterData.status === "pending_acceptance")) {
      
      const classifiedAt = beforeData.classifiedAt?.toDate() || beforeData.lastUpdated?.toDate();
      const assignedAt = new Date();
      
      if (classifiedAt) {
        const assignmentTimeMs = assignedAt - classifiedAt;
        const assignmentTimeMinutes = Math.floor(assignmentTimeMs / 60000);
        
        await admin.firestore()
          .collection("performance_metrics")
          .add({
            ticketId,
            metricType: "assignment_time",
            durationMs: assignmentTimeMs,
            durationMinutes: assignmentTimeMinutes,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          });
          
        logger.info(`Assignment time for ticket ${ticketId}: ${assignmentTimeMinutes} minutes`);
      }
    }
    
    // 3. From "assigned" to "completed" (resolution time)
    if (beforeData.status === "in_progress" && afterData.status === "completed") {
      const startedAt = beforeData.meta?.startedAt?.toDate() || beforeData.lastUpdated?.toDate();
      const completedAt = new Date();
      
      if (startedAt) {
        const resolutionTimeMs = completedAt - startedAt;
        const resolutionTimeMinutes = Math.floor(resolutionTimeMs / 60000);
        const resolutionTimeHours = Math.floor(resolutionTimeMinutes / 60);
        
        await admin.firestore()
          .collection("performance_metrics")
          .add({
            ticketId,
            metricType: "resolution_time",
            durationMs: resolutionTimeMs,
            durationMinutes: resolutionTimeMinutes,
            durationHours: resolutionTimeHours,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          });
          
        logger.info(`Resolution time for ticket ${ticketId}: ${resolutionTimeHours} hours (${resolutionTimeMinutes} minutes)`);
      }
    }
    
    // 4. Total time (creation to completion)
    if (beforeData.status !== "completed" && afterData.status === "completed") {
      const createdAt = beforeData.createdAt?.toDate();
      const completedAt = new Date();
      
      if (createdAt) {
        const totalTimeMs = completedAt - createdAt;
        const totalTimeMinutes = Math.floor(totalTimeMs / 60000);
        const totalTimeHours = Math.floor(totalTimeMinutes / 60);
        const totalTimeDays = Math.floor(totalTimeHours / 24);
        
        await admin.firestore()
          .collection("performance_metrics")
          .add({
            ticketId,
            metricType: "total_time",
            durationMs: totalTimeMs,
            durationMinutes: totalTimeMinutes,
            durationHours: totalTimeHours,
            durationDays: totalTimeDays,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          });
          
        logger.info(`Total time for ticket ${ticketId}: ${totalTimeDays} days (${totalTimeHours} hours)`);
      }
    }
  } catch (error) {
    logger.error(`Error tracking transition metrics for ticket ${ticketId}:`, error);
  }
}

/**
 * Logs errors happening during the ticket lifecycle
 */
exports.logTicketError = https.onCall(async (data, context) => {
  try {
    // Verify authentication
    if (!context.auth) {
      throw new https.HttpsError(
        "unauthenticated",
        "You must be logged in to log an error"
      );
    }

    // Extract data
    const { ticketId, errorType, errorMessage, errorDetails } = data;
    if (!ticketId || !errorType) {
      throw new https.HttpsError(
        "invalid-argument", 
        "The function must be called with a valid ticketId and errorType"
      );
    }

    const userId = context.auth.uid;
    
    // Create error log entry
    const errorLog = {
      ticketId,
      userId,
      userRole: context.auth.token.role || "unknown",
      errorType,
      errorMessage: errorMessage || "No message provided",
      errorDetails: errorDetails || {},
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      userAgent: context.rawRequest?.headers?.['user-agent'] || "unknown"
    };
    
    // Add to ticket's error logs
    await admin.firestore()
      .collection("tickets")
      .doc(ticketId)
      .collection("error_logs")
      .add(errorLog);
    
    // Add to global error logs
    await admin.firestore()
      .collection("system_logs")
      .add({
        ...errorLog,
        logType: "error"
      });
    
    logger.error(`User ${userId} reported error for ticket ${ticketId}: ${errorType}`, {
      errorMessage,
      ticketId
    });
    
    return {
      success: true,
      loggedAt: new Date().toISOString()
    };
    
  } catch (error) {
    logger.error("Error logging ticket error:", error);
    throw new https.HttpsError("internal", error.message);
  }
});

/**
 * Gets logs for a specific ticket
 */
exports.getTicketLogs = https.onCall(async (data, context) => {
  try {
    // Verify authentication
    if (!context.auth) {
      throw new https.HttpsError(
        "unauthenticated",
        "You must be logged in to view ticket logs"
      );
    }

    // Extract data
    const { ticketId } = data;
    if (!ticketId) {
      throw new https.HttpsError(
        "invalid-argument", 
        "The function must be called with a valid ticketId"
      );
    }

    const userId = context.auth.uid;
    const userRole = context.auth.token.role || "tenant";
    
    // Verify ticket exists
    const ticketSnapshot = await admin.firestore()
      .collection("tickets")
      .doc(ticketId)
      .get();
    
    if (!ticketSnapshot.exists) {
      throw new https.HttpsError(
        "not-found", 
        "The specified ticket was not found"
      );
    }
    
    const ticketData = ticketSnapshot.data();
    
    // Only allow access to users with appropriate permissions
    let hasAccess = false;
    
    if (userRole === "admin") {
      hasAccess = true;
    } else if (userRole === "landlord") {
      // Check if user is the property owner
      const propertySnapshot = await admin.firestore()
        .collection("properties")
        .doc(ticketData.propertyId)
        .get();
      
      if (propertySnapshot.exists && propertySnapshot.data().owner === userId) {
        hasAccess = true;
      }
    } else if (userRole === "contractor" && ticketData.assignedTo === userId) {
      hasAccess = true;
    } else if (userRole === "tenant" && ticketData.submittedBy === userId) {
      hasAccess = true;
    }
    
    if (!hasAccess) {
      throw new https.HttpsError(
        "permission-denied",
        "You do not have permission to view logs for this ticket"
      );
    }
    
    // Get regular logs
    const logsSnapshot = await admin.firestore()
      .collection("tickets")
      .doc(ticketId)
      .collection("logs")
      .orderBy("timestamp", "desc")
      .limit(100)
      .get();
    
    const logs = [];
    logsSnapshot.forEach(doc => {
      logs.push({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate().toISOString()
      });
    });
    
    // Only admins and landlords can see error logs
    let errors = [];
    if (userRole === "admin" || (userRole === "landlord" && hasAccess)) {
      const errorsSnapshot = await admin.firestore()
        .collection("tickets")
        .doc(ticketId)
        .collection("error_logs")
        .orderBy("timestamp", "desc")
        .limit(50)
        .get();
      
      errorsSnapshot.forEach(doc => {
        errors.push({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate().toISOString()
        });
      });
    }
    
    return {
      ticketId,
      logs,
      errors,
      hasErrors: errors.length > 0
    };
    
  } catch (error) {
    logger.error("Error getting ticket logs:", error);
    throw new https.HttpsError("internal", error.message);
  }
});

/**
 * Gets system-wide performance metrics
 * Only accessible to admins
 */
exports.getSystemPerformanceMetrics = https.onCall(async (data, context) => {
  try {
    // Verify authentication and admin role
    if (!context.auth) {
      throw new https.HttpsError(
        "unauthenticated",
        "You must be logged in to view system metrics"
      );
    }
    
    const userRole = context.auth.token.role || "";
    if (userRole !== "admin") {
      throw new https.HttpsError(
        "permission-denied",
        "Only admins can view system-wide performance metrics"
      );
    }
    
    // Define time range - default to last 30 days
    const { daysBack } = data || {};
    const daysToLookBack = daysBack || 30;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToLookBack);
    const cutoffTimestamp = admin.firestore.Timestamp.fromDate(cutoffDate);
    
    // Get performance metrics
    const metricsSnapshot = await admin.firestore()
      .collection("performance_metrics")
      .where("timestamp", ">=", cutoffTimestamp)
      .get();
    
    // Group metrics by type
    const metricsByType = {
      classification_time: [],
      assignment_time: [],
      resolution_time: [],
      total_time: []
    };
    
    metricsSnapshot.forEach(doc => {
      const metric = {
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate().toISOString()
      };
      
      if (metricsByType[metric.metricType]) {
        metricsByType[metric.metricType].push(metric);
      }
    });
    
    // Calculate averages
    const averages = {};
    for (const [type, metrics] of Object.entries(metricsByType)) {
      if (metrics.length > 0) {
        // For time-based metrics, calculate average in minutes
        const totalMinutes = metrics.reduce((sum, m) => sum + (m.durationMinutes || 0), 0);
        averages[type] = {
          averageMinutes: totalMinutes / metrics.length,
          sampleSize: metrics.length,
          unit: "minutes"
        };
        
        // For longer metrics, also provide hours or days
        if (type === "resolution_time" || type === "total_time") {
          const totalHours = metrics.reduce((sum, m) => sum + (m.durationHours || 0), 0);
          averages[type].averageHours = totalHours / metrics.length;
          averages[type].unit = "hours";
          
          if (type === "total_time") {
            const totalDays = metrics.reduce((sum, m) => sum + (m.durationDays || 0), 0);
            averages[type].averageDays = totalDays / metrics.length;
            averages[type].unit = "days";
          }
        }
      }
    }
    
    return {
      timeRange: {
        days: daysToLookBack,
        from: cutoffDate.toISOString(),
        to: new Date().toISOString()
      },
      metrics: metricsByType,
      averages,
      totalMetricsCount: metricsSnapshot.size
    };
    
  } catch (error) {
    logger.error("Error getting system performance metrics:", error);
    throw new https.HttpsError("internal", error.message);
  }
}); 