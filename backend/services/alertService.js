/**
 * Alert and Notification Service
 * Manages alert queue, notification delivery, valve closure logic,
 * acknowledgment system, and detailed audit logging
 */

const EventEmitter = require('events');
const AuditLogger = require('./auditLogger');

class AlertService extends EventEmitter {
  constructor() {
    super();
    this.alertQueue = [];
    this.alertHistory = [];
    this.acknowledgedAlerts = new Set();
    this.auditLogger = new AuditLogger();
    this.notificationChannels = {
      email: this.sendEmailNotification.bind(this),
      sms: this.sendSmsNotification.bind(this),
      slack: this.sendSlackNotification.bind(this),
      inApp: this.sendInAppNotification.bind(this)
    };
    this.severityLevels = {
      info: 1,
      warning: 2,
      critical: 3,
      emergency: 4
    };
    this.valveStates = new Map(); // Track valve closure status
    this.alertStats = {
      total: 0,
      acknowledged: 0,
      resolved: 0,
      falsePositives: 0
    };
  }

  /**
   * Create and queue a new alert
   */
  createAlert(detectionData) {
    const alert = {
      id: this.generateAlertId(),
      timestamp: new Date(),
      type: detectionData.type || 'unknown',
      severity: detectionData.severity || 'warning',
      location: detectionData.location || null,
      source: detectionData.source || 'manual',
      description: detectionData.description || '',
      value: detectionData.value,
      threshold: detectionData.threshold,
      confidence: detectionData.confidence || 0,
      status: 'active',
      acknowledged: false,
      acknowledgedAt: null,
      acknowledgedBy: null,
      acknowledgeNotes: null,
      resolved: false,
      resolvedAt: null,
      resolvedBy: null,
      resolutionNotes: null,
      feedback: null,
      valveClosureTriggered: false,
      valveClosureTime: null,
      notificationsSent: [],
      metadata: detectionData.metadata || {}
    };

    // Add to queue and history
    this.alertQueue.push(alert);
    this.alertHistory.push({ ...alert });
    this.alertStats.total++;

    // Log alert creation in audit trail
    this.auditLogger.logAlertCreation(alert, detectionData);

    // Handle severity-based actions
    this.handleSeverityBasedActions(alert);

    // Send notifications
    this.sendNotifications(alert);

    // Emit event for real-time updates
    this.emit('alert:created', alert);

    return alert;
  }

  /**
   * Handle actions based on severity level
   */
  handleSeverityBasedActions(alert) {
    const severityLevel = this.severityLevels[alert.severity] || 0;

    this.auditLogger.log({
      action: 'severity_evaluation',
      alertId: alert.id,
      severity: alert.severity,
      severityLevel,
      timestamp: new Date(),
      details: `Alert evaluated at severity level ${severityLevel}`
    });

    // Critical or emergency alerts trigger valve closure
    if (severityLevel >= this.severityLevels.critical) {
      this.triggerValveClosure(alert);
    }

    // Emergency alerts trigger immediate escalation
    if (severityLevel >= this.severityLevels.emergency) {
      this.escalateAlert(alert);
    }
  }

  /**
   * Trigger automatic valve closure for critical leaks
   */
  triggerValveClosure(alert) {
    const valveId = alert.location || 'main';
    
    // Check if already closed to prevent duplicate operations
    if (this.valveStates.get(valveId) === 'closed') {
      this.auditLogger.log({
        action: 'valve_closure_redundant',
        alertId: alert.id,
        valveId,
        timestamp: new Date(),
        details: `Valve ${valveId} already closed`
      });
      return;
    }

    // Update alert with valve closure info
    alert.valveClosureTriggered = true;
    alert.valveClosureTime = new Date();

    // Simulate valve closure (in production, this would call actual hardware API)
    this.valveStates.set(valveId, 'closed');

    this.auditLogger.log({
      action: 'valve_closure_triggered',
      alertId: alert.id,
      valveId,
      timestamp: new Date(),
      severity: alert.severity,
      leakRate: alert.value,
      reason: `Critical leak detected: ${alert.description}`,
      status: 'success'
    });

    console.log(`[VALVE CLOSURE] Valve ${valveId} CLOSED automatically due to ${alert.severity} alert`);
    this.emit('valve:closed', { valveId, alertId: alert.id, reason: alert.description });
  }

  /**
   * Escalate alert for immediate attention
   */
  escalateAlert(alert) {
    const escalationPath = ['supervisor', 'manager', 'emergency_contact'];
    
    this.auditLogger.log({
      action: 'alert_escalation',
      alertId: alert.id,
      escalationPath,
      timestamp: new Date(),
      severity: alert.severity,
      reason: 'Emergency severity level detected'
    });

    console.log(`[ESCALATION] Alert ${alert.id} escalated to emergency contacts`);
    this.emit('alert:escalated', { alertId: alert.id, escalationPath });
  }

  /**
   * Send notifications through configured channels
   */
  sendNotifications(alert) {
    const channels = this.getNotificationChannels(alert.severity);
    
    channels.forEach(channel => {
      if (this.notificationChannels[channel]) {
        this.notificationChannels[channel](alert);
      }
    });
  }

  /**
   * Determine notification channels based on severity
   */
  getNotificationChannels(severity) {
    const channels = {
      info: ['inApp'],
      warning: ['inApp', 'email'],
      critical: ['inApp', 'email', 'sms'],
      emergency: ['inApp', 'email', 'sms', 'slack']
    };
    return channels[severity] || ['inApp'];
  }

  /**
   * Send email notification (mock)
   */
  sendEmailNotification(alert) {
    const emailData = {
      to: 'operations@company.com',
      subject: `[${alert.severity.toUpperCase()}] Leak Alert - ${alert.location || 'Unknown Location'}`,
      body: this.formatEmailBody(alert),
      timestamp: new Date()
    };

    this.auditLogger.log({
      action: 'notification_sent',
      alertId: alert.id,
      channel: 'email',
      timestamp: new Date(),
      recipient: emailData.to,
      subject: emailData.subject
    });

    console.log(`[EMAIL] Notification sent to ${emailData.to}`);
    console.log(`Subject: ${emailData.subject}`);
    console.log(`Body:\n${emailData.body}\n`);

    alert.notificationsSent.push({
      channel: 'email',
      timestamp: new Date(),
      recipient: emailData.to
    });

    this.emit('notification:sent', { alertId: alert.id, channel: 'email', recipient: emailData.to });
  }

  /**
   * Send SMS notification (mock)
   */
  sendSmsNotification(alert) {
    const phoneNumber = '+1-555-0100'; // Mock phone number
    const messageBody = `ALERT: ${alert.severity.toUpperCase()} - ${alert.description} at ${alert.location || 'Unknown'}. Value: ${alert.value}`;

    this.auditLogger.log({
      action: 'notification_sent',
      alertId: alert.id,
      channel: 'sms',
      timestamp: new Date(),
      recipient: phoneNumber,
      messageLength: messageBody.length
    });

    console.log(`[SMS] Notification sent to ${phoneNumber}`);
    console.log(`Message: ${messageBody}\n`);

    alert.notificationsSent.push({
      channel: 'sms',
      timestamp: new Date(),
      recipient: phoneNumber
    });

    this.emit('notification:sent', { alertId: alert.id, channel: 'sms', recipient: phoneNumber });
  }

  /**
   * Send Slack notification (mock)
   */
  sendSlackNotification(alert) {
    const slackMessage = {
      channel: '#alerts',
      username: 'LeakDetectionBot',
      text: `${alert.severity.toUpperCase()} Alert: ${alert.description}`,
      attachments: [{
        color: this.getSeverityColor(alert.severity),
        fields: [
          { title: 'Location', value: alert.location || 'Unknown', short: true },
          { title: 'Value', value: `${alert.value}`, short: true },
          { title: 'Confidence', value: `${(alert.confidence * 100).toFixed(1)}%`, short: true },
          { title: 'Time', value: alert.timestamp.toISOString(), short: true }
        ]
      }],
      timestamp: new Date()
    };

    this.auditLogger.log({
      action: 'notification_sent',
      alertId: alert.id,
      channel: 'slack',
      timestamp: new Date(),
      slackChannel: slackMessage.channel
    });

    console.log(`[SLACK] Message posted to ${slackMessage.channel}`);
    console.log(`Message: ${slackMessage.text}`);
    console.log(`Details:`, JSON.stringify(slackMessage.attachments, null, 2), '\n');

    alert.notificationsSent.push({
      channel: 'slack',
      timestamp: new Date(),
      recipient: slackMessage.channel
    });

    this.emit('notification:sent', { alertId: alert.id, channel: 'slack', recipient: slackMessage.channel });
  }

  /**
   * Send in-app notification (mock)
   */
  sendInAppNotification(alert) {
    this.auditLogger.log({
      action: 'notification_sent',
      alertId: alert.id,
      channel: 'inApp',
      timestamp: new Date(),
      displayLocation: 'dashboard'
    });

    console.log(`[IN-APP] Notification displayed on dashboard: ${alert.description}`);

    alert.notificationsSent.push({
      channel: 'inApp',
      timestamp: new Date(),
      recipient: 'all_users'
    });

    this.emit('notification:sent', { alertId: alert.id, channel: 'inApp', recipient: 'all_users' });
  }

  /**
   * Format email body for alert
   */
  formatEmailBody(alert) {
    return `
Leak Detection Alert
====================

Severity: ${alert.severity.toUpperCase()}
Location: ${alert.location || 'Unknown'}
Time: ${alert.timestamp.toISOString()}

Alert Details:
- Description: ${alert.description}
- Detected Value: ${alert.value}
- Threshold: ${alert.threshold}
- Detection Confidence: ${(alert.confidence * 100).toFixed(1)}%
- Source: ${alert.source}

${alert.valveClosureTriggered ? `
VALVE CLOSURE:
- Automatic valve closure triggered at ${alert.valveClosureTime.toISOString()}
- Status: ACTIVE
` : ''}

Action Required:
Please review the alert and take appropriate action.
Visit the dashboard for more details and to acknowledge this alert.

Detection System
    `;
  }

  /**
   * Get color based on severity for Slack
   */
  getSeverityColor(severity) {
    const colors = {
      info: '#0099ff',
      warning: '#ffaa00',
      critical: '#ff3333',
      emergency: '#cc0000'
    };
    return colors[severity] || '#999999';
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId, userId, notes = '') {
    const alert = this.getAlertById(alertId);
    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }

    alert.acknowledged = true;
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = userId;
    alert.acknowledgeNotes = notes;
    this.acknowledgedAlerts.add(alertId);
    this.alertStats.acknowledged++;

    this.auditLogger.log({
      action: 'alert_acknowledged',
      alertId,
      userId,
      timestamp: new Date(),
      notes,
      alertSeverity: alert.severity,
      alertDescription: alert.description
    });

    console.log(`[ACKNOWLEDGMENT] Alert ${alertId} acknowledged by ${userId}`);
    this.emit('alert:acknowledged', { alertId, userId, notes, timestamp: alert.acknowledgedAt });

    return alert;
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId, userId, notes = '', feedback = null) {
    const alert = this.getAlertById(alertId);
    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }

    alert.resolved = true;
    alert.resolvedAt = new Date();
    alert.resolvedBy = userId;
    alert.resolutionNotes = notes;
    alert.status = 'resolved';
    alert.feedback = feedback;
    this.alertStats.resolved++;

    // If marked as false positive, update stats
    if (feedback && feedback.isFalsePositive) {
      this.alertStats.falsePositives++;
    }

    this.auditLogger.log({
      action: 'alert_resolved',
      alertId,
      userId,
      timestamp: new Date(),
      notes,
      feedback,
      resolutionTime: (alert.resolvedAt - alert.timestamp) / 1000 // seconds
    });

    console.log(`[RESOLUTION] Alert ${alertId} resolved by ${userId}`);
    this.emit('alert:resolved', { alertId, userId, notes, feedback, timestamp: alert.resolvedAt });

    // Remove from active queue
    this.alertQueue = this.alertQueue.filter(a => a.id !== alertId);

    return alert;
  }

  /**
   * Provide feedback for model improvement
   */
  provideFeedback(alertId, feedback) {
    const alert = this.getAlertById(alertId, true); // Check history
    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }

    const feedbackRecord = {
      alertId,
      timestamp: new Date(),
      isFalsePositive: feedback.isFalsePositive || false,
      isCorrectPositive: feedback.isCorrectPositive || false,
      comments: feedback.comments || '',
      confidence: feedback.confidence || alert.confidence,
      suggestedThreshold: feedback.suggestedThreshold || null
    };

    alert.feedback = feedbackRecord;

    this.auditLogger.log({
      action: 'feedback_provided',
      alertId,
      timestamp: new Date(),
      feedback: feedbackRecord,
      purpose: 'model_improvement'
    });

    console.log(`[FEEDBACK] Feedback recorded for alert ${alertId}`);
    console.log(`Feedback:`, JSON.stringify(feedbackRecord, null, 2), '\n');

    this.emit('feedback:provided', feedbackRecord);

    return feedbackRecord;
  }

  /**
   * Get alerts by severity
   */
  getAlertsBySeverity(severity) {
    return this.alertQueue.filter(alert => alert.severity === severity);
  }

  /**
   * Get active alerts
   */
  getActiveAlerts() {
    return this.alertQueue.filter(alert => alert.status === 'active');
  }

  /**
   * Get unacknowledged alerts
   */
  getUnacknowledgedAlerts() {
    return this.alertQueue.filter(alert => !alert.acknowledged);
  }

  /**
   * Get alerts by location
   */
  getAlertsByLocation(location) {
    return this.alertQueue.filter(alert => alert.location === location);
  }

  /**
   * Get alerts within time range
   */
  getAlertsByTimeRange(startTime, endTime) {
    return this.alertHistory.filter(alert => {
      const alertTime = new Date(alert.timestamp);
      return alertTime >= startTime && alertTime <= endTime;
    });
  }

  /**
   * Get alert by ID
   */
  getAlertById(alertId, searchHistory = false) {
    const source = searchHistory ? this.alertHistory : this.alertQueue;
    return source.find(alert => alert.id === alertId);
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const now = new Date();
    const last24h = new Date(now - 24 * 60 * 60 * 1000);
    const lastHour = new Date(now - 60 * 60 * 1000);

    const last24hAlerts = this.alertHistory.filter(a => new Date(a.timestamp) >= last24h);
    const lastHourAlerts = this.alertHistory.filter(a => new Date(a.timestamp) >= lastHour);

    const severityBreakdown = {};
    Object.keys(this.severityLevels).forEach(level => {
      severityBreakdown[level] = last24hAlerts.filter(a => a.severity === level).length;
    });

    return {
      total: this.alertStats.total,
      active: this.alertQueue.length,
      acknowledged: this.alertStats.acknowledged,
      resolved: this.alertStats.resolved,
      falsePositives: this.alertStats.falsePositives,
      last24hCount: last24hAlerts.length,
      lastHourCount: lastHourAlerts.length,
      severityBreakdown,
      acknowledgeRate: this.alertStats.total > 0 ? 
        ((this.alertStats.acknowledged / this.alertStats.total) * 100).toFixed(1) : 0,
      resolutionRate: this.alertStats.total > 0 ? 
        ((this.alertStats.resolved / this.alertStats.total) * 100).toFixed(1) : 0,
      averageResponseTime: this.calculateAverageResponseTime(),
      valveClosuresTriggered: Array.from(this.valveStates.entries())
        .filter(([, state]) => state === 'closed')
        .map(([valveId]) => valveId)
    };
  }

  /**
   * Calculate average response time
   */
  calculateAverageResponseTime() {
    const acknowledgedAlerts = this.alertHistory.filter(a => a.acknowledged);
    if (acknowledgedAlerts.length === 0) return 0;

    const totalTime = acknowledgedAlerts.reduce((sum, alert) => {
      const responseTime = new Date(alert.acknowledgedAt) - new Date(alert.timestamp);
      return sum + responseTime;
    }, 0);

    return Math.round(totalTime / acknowledgedAlerts.length / 1000); // seconds
  }

  /**
   * Get audit log for specific alert
   */
  getAlertAuditTrail(alertId) {
    return this.auditLogger.getAuditTrailForAlert(alertId);
  }

  /**
   * Get complete audit log
   */
  getCompleteAuditLog(filters = {}) {
    return this.auditLogger.getLog(filters);
  }

  /**
   * Generate alert report
   */
  generateReport(startTime, endTime, filters = {}) {
    const alerts = this.getAlertsByTimeRange(startTime, endTime);
    const filteredAlerts = this.filterAlerts(alerts, filters);

    return {
      period: { startTime, endTime },
      summary: {
        total: filteredAlerts.length,
        byType: this.groupBy(filteredAlerts, 'type'),
        bySeverity: this.groupBy(filteredAlerts, 'severity'),
        byStatus: this.groupBy(filteredAlerts, 'status'),
        acknowledged: filteredAlerts.filter(a => a.acknowledged).length,
        resolved: filteredAlerts.filter(a => a.resolved).length,
        falsePositives: filteredAlerts.filter(a => a.feedback?.isFalsePositive).length
      },
      alerts: filteredAlerts,
      statistics: this.getStatistics()
    };
  }

  /**
   * Filter alerts based on criteria
   */
  filterAlerts(alerts, filters) {
    return alerts.filter(alert => {
      if (filters.type && alert.type !== filters.type) return false;
      if (filters.severity && alert.severity !== filters.severity) return false;
      if (filters.status && alert.status !== filters.status) return false;
      if (filters.location && alert.location !== filters.location) return false;
      if (filters.acknowledged !== undefined && alert.acknowledged !== filters.acknowledged) return false;
      return true;
    });
  }

  /**
   * Group alerts by property
   */
  groupBy(alerts, property) {
    return alerts.reduce((groups, alert) => {
      const key = alert[property];
      groups[key] = (groups[key] || 0) + 1;
      return groups;
    }, {});
  }

  /**
   * Generate alert ID
   */
  generateAlertId() {
    return `ALERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clear old alerts (for maintenance)
   */
  clearOldAlerts(olderThanDays = 30) {
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    const initialLength = this.alertHistory.length;

    this.alertHistory = this.alertHistory.filter(alert => 
      new Date(alert.timestamp) > cutoffDate
    );

    const deletedCount = initialLength - this.alertHistory.length;

    this.auditLogger.log({
      action: 'alerts_cleanup',
      timestamp: new Date(),
      deletedCount,
      olderThanDays
    });

    console.log(`[CLEANUP] Removed ${deletedCount} alerts older than ${olderThanDays} days`);

    return deletedCount;
  }

  /**
   * Reset service (for testing)
   */
  reset() {
    this.alertQueue = [];
    this.alertHistory = [];
    this.acknowledgedAlerts.clear();
    this.valveStates.clear();
    this.alertStats = {
      total: 0,
      acknowledged: 0,
      resolved: 0,
      falsePositives: 0
    };
    this.auditLogger.reset();
  }
}

module.exports = AlertService;
