/**
 * Audit Logger Service
 * Tracks complete chain of detection-to-action for every alert
 * Provides detailed logging for compliance, debugging, and analysis
 */

class AuditLogger {
  constructor() {
    this.auditLog = [];
    this.alertAuditMap = new Map(); // Maps alertId to its audit entries
    this.startTime = new Date();
  }

  /**
   * Log alert creation with full detection data
   */
  logAlertCreation(alert, detectionData) {
    const entry = {
      id: this.generateEntryId(),
      timestamp: new Date(),
      alertId: alert.id,
      action: 'alert_creation',
      source: detectionData.source || 'system',
      detectionMethod: detectionData.detectionMethod || 'ml_model',
      
      // Full detection chain
      sensorReadings: detectionData.sensorReadings || {},
      preprocessedValues: detectionData.preprocessedValues || {},
      modelInput: detectionData.modelInput || {},
      modelOutput: detectionData.modelOutput || {},
      anomalyScore: detectionData.anomalyScore || 0,
      
      // Alert details
      alert: {
        id: alert.id,
        type: alert.type,
        severity: alert.severity,
        location: alert.location,
        description: alert.description,
        value: alert.value,
        threshold: alert.threshold,
        confidence: alert.confidence
      },
      
      // Decision reasoning
      decisionReasoning: {
        thresholdExceeded: alert.value > alert.threshold,
        confidenceAboveMinimum: alert.confidence > 0.7,
        consistentAnomaly: detectionData.consistentAnomaly || false,
        historicalContext: detectionData.historicalContext || {}
      },
      
      metadata: {
        environment: process.env.NODE_ENV || 'development',
        systemVersion: process.env.APP_VERSION || '1.0.0',
        executionTime: 0
      },
      status: 'completed'
    };

    this.auditLog.push(entry);
    this.mapAlertEntry(alert.id, entry);

    return entry;
  }

  /**
   * Log any action with structured data
   */
  log(logData) {
    const entry = {
      id: this.generateEntryId(),
      timestamp: logData.timestamp || new Date(),
      alertId: logData.alertId || null,
      action: logData.action,
      userId: logData.userId || null,
      
      // Full context
      context: {
        source: logData.source || 'system',
        environment: process.env.NODE_ENV || 'development'
      },
      
      // Action-specific data
      ...logData,
      
      // Audit metadata
      metadata: {
        entryId: this.generateEntryId(),
        sequenceNumber: this.auditLog.length + 1,
        sessionStartTime: this.startTime,
        elapsedTime: Date.now() - this.startTime.getTime()
      }
    };

    // Remove duplicate fields
    delete entry.timestamp;
    entry.timestamp = logData.timestamp || new Date();

    this.auditLog.push(entry);

    if (logData.alertId) {
      this.mapAlertEntry(logData.alertId, entry);
    }

    // Also log to console in development
    if (process.env.NODE_ENV !== 'production') {
      this.printLogEntry(entry);
    }

    return entry;
  }

  /**
   * Get audit trail for specific alert
   */
  getAuditTrailForAlert(alertId) {
    return this.alertAuditMap.get(alertId) || [];
  }

  /**
   * Get audit log with filters
   */
  getLog(filters = {}) {
    let result = [...this.auditLog];

    if (filters.alertId) {
      result = result.filter(entry => entry.alertId === filters.alertId);
    }

    if (filters.action) {
      result = result.filter(entry => entry.action === filters.action);
    }

    if (filters.startTime && filters.endTime) {
      result = result.filter(entry => {
        const entryTime = new Date(entry.timestamp);
        return entryTime >= filters.startTime && entryTime <= filters.endTime;
      });
    }

    if (filters.userId) {
      result = result.filter(entry => entry.userId === filters.userId);
    }

    if (filters.sortBy === 'recent') {
      result.reverse();
    }

    if (filters.limit) {
      result = result.slice(0, filters.limit);
    }

    return result;
  }

  /**
   * Get execution timeline for alert
   */
  getExecutionTimeline(alertId) {
    const entries = this.getAuditTrailForAlert(alertId);
    
    return {
      alertId,
      timeline: entries.map(entry => ({
        timestamp: entry.timestamp,
        action: entry.action,
        duration: entry.metadata?.elapsedTime || 0,
        status: entry.status || 'completed',
        details: {
          severity: entry.severity,
          userId: entry.userId,
          result: entry.result || 'success'
        }
      })),
      totalActions: entries.length,
      startTime: entries[0]?.timestamp,
      endTime: entries[entries.length - 1]?.timestamp,
      totalDuration: entries.length > 0 ? 
        new Date(entries[entries.length - 1].timestamp) - new Date(entries[0].timestamp) : 0
    };
  }

  /**
   * Generate detailed audit report
   */
  generateAuditReport(startTime, endTime) {
    const entries = this.getLog({
      startTime,
      endTime
    });

    const actionBreakdown = {};
    const userActions = {};

    entries.forEach(entry => {
      // Count by action
      actionBreakdown[entry.action] = (actionBreakdown[entry.action] || 0) + 1;

      // Count by user
      if (entry.userId) {
        if (!userActions[entry.userId]) {
          userActions[entry.userId] = {};
        }
        userActions[entry.userId][entry.action] = 
          (userActions[entry.userId][entry.action] || 0) + 1;
      }
    });

    return {
      period: { startTime, endTime },
      summary: {
        totalEntries: entries.length,
        uniqueAlerts: new Set(entries.map(e => e.alertId)).size,
        uniqueUsers: Object.keys(userActions).length,
        actionBreakdown,
        userActions
      },
      entries: entries,
      statistics: {
        averageEntriesPerMinute: (entries.length / ((endTime - startTime) / 60000)).toFixed(2),
        topAction: Object.entries(actionBreakdown)
          .sort((a, b) => b[1] - a[1])[0]?.[0] || 'none'
      }
    };
  }

  /**
   * Export audit log as JSON
   */
  exportAsJson(filters = {}) {
    const entries = this.getLog(filters);
    return JSON.stringify({
      exportTime: new Date().toISOString(),
      filters,
      totalEntries: entries.length,
      entries
    }, null, 2);
  }

  /**
   * Export audit log as CSV
   */
  exportAsCsv(filters = {}) {
    const entries = this.getLog(filters);

    if (entries.length === 0) {
      return 'No audit log entries found';
    }

    // Get all unique keys
    const allKeys = new Set();
    entries.forEach(entry => {
      Object.keys(entry).forEach(key => allKeys.add(key));
    });

    const headers = Array.from(allKeys);
    const csvRows = [headers.join(',')];

    entries.forEach(entry => {
      const row = headers.map(header => {
        const value = entry[header];
        if (typeof value === 'object') {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  /**
   * Search audit log
   */
  search(query) {
    const lowerQuery = query.toLowerCase();
    return this.auditLog.filter(entry => {
      // Search in string representations of the entry
      const entryString = JSON.stringify(entry).toLowerCase();
      return entryString.includes(lowerQuery);
    });
  }

  /**
   * Get audit statistics
   */
  getStatistics() {
    if (this.auditLog.length === 0) {
      return {
        totalEntries: 0,
        totalAlerts: 0,
        actionsPerAlert: 0,
        averageResponseTime: 0
      };
    }

    const alertIds = new Set(this.auditLog.map(e => e.alertId).filter(id => id));
    const totalTime = Date.now() - this.startTime.getTime();

    return {
      totalEntries: this.auditLog.length,
      totalAlerts: alertIds.size,
      entriesPerAlert: (this.auditLog.length / alertIds.size).toFixed(2),
      systemUptime: totalTime,
      entriesPerMinute: ((this.auditLog.length / (totalTime / 60000)) || 0).toFixed(2),
      oldestEntry: this.auditLog[0]?.timestamp,
      newestEntry: this.auditLog[this.auditLog.length - 1]?.timestamp
    };
  }

  /**
   * Get integrity check - verify audit log consistency
   */
  verifyIntegrity() {
    const issues = [];

    // Check for missing alert mappings
    this.auditLog.forEach(entry => {
      if (entry.alertId) {
        const mapping = this.alertAuditMap.get(entry.alertId);
        if (!mapping || !mapping.includes(entry)) {
          issues.push({
            type: 'missing_mapping',
            alertId: entry.alertId,
            entryId: entry.id
          });
        }
      }
    });

    // Check for duplicate entries (by id)
    const ids = this.auditLog.map(e => e.id);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicates.length > 0) {
      issues.push({
        type: 'duplicate_ids',
        count: duplicates.length,
        ids: duplicates
      });
    }

    return {
      isValid: issues.length === 0,
      issues,
      totalEntries: this.auditLog.length,
      totalAlerts: this.alertAuditMap.size
    };
  }

  /**
   * Reset audit log (for testing)
   */
  reset() {
    this.auditLog = [];
    this.alertAuditMap.clear();
    this.startTime = new Date();
  }

  /**
   * Private: Map audit entry to alert
   */
  mapAlertEntry(alertId, entry) {
    if (!this.alertAuditMap.has(alertId)) {
      this.alertAuditMap.set(alertId, []);
    }
    this.alertAuditMap.get(alertId).push(entry);
  }

  /**
   * Private: Generate entry ID
   */
  generateEntryId() {
    return `AUDIT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Private: Print formatted log entry
   */
  printLogEntry(entry) {
    const timestamp = new Date(entry.timestamp).toISOString();
    const action = entry.action.toUpperCase();
    const alertId = entry.alertId ? ` [${entry.alertId}]` : '';
    
    console.log(`[${timestamp}] ${action}${alertId}: ${JSON.stringify(entry, null, 2)}`);
  }
}

module.exports = AuditLogger;
