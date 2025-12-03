/**
 * Alert and Notification API Routes
 * Endpoints for managing alerts, notifications, acknowledgments, and audit logs
 */

const express = require('express');
const router = express.Router();

/**
 * Initialize alert service (would be dependency injected in real app)
 * For now, create instance per request (in production, use singleton)
 */
let alertService = null;

function getAlertService() {
  if (!alertService) {
    const AlertService = require('../services/alertService');
    alertService = new AlertService();
  }
  return alertService;
}

// ==================== ALERT CREATION ====================

/**
 * POST /api/alerts/create
 * Create a new alert from detection data
 */
router.post('/create', (req, res) => {
  try {
    const { detectionData } = req.body;

    if (!detectionData) {
      return res.status(400).json({
        error: 'detectionData required in request body'
      });
    }

    const alertService = getAlertService();
    const alert = alertService.createAlert(detectionData);

    res.status(201).json({
      success: true,
      alert,
      message: `Alert ${alert.id} created with severity: ${alert.severity}`
    });
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({
      error: 'Failed to create alert',
      details: error.message
    });
  }
});

/**
 * POST /api/alerts/create-from-detection
 * Create alert directly from leak detector output
 */
router.post('/create-from-detection', (req, res) => {
  try {
    const {
      location,
      leakRate,
      confidence,
      detectionTime,
      detectionMethod
    } = req.body;

    if (!location || leakRate === undefined) {
      return res.status(400).json({
        error: 'location and leakRate are required'
      });
    }

    // Determine severity based on leak rate
    let severity = 'warning';
    if (leakRate > 10) severity = 'critical';
    if (leakRate > 50) severity = 'emergency';

    const detectionData = {
      type: 'leak_detected',
      severity,
      location,
      source: 'leak_detector',
      description: `Leak detected at ${location} with rate ${leakRate} L/min`,
      value: leakRate,
      threshold: location === 'main' ? 5 : 2,
      confidence: confidence || 0.85,
      detectionMethod: detectionMethod || 'anomaly_detection',
      metadata: {
        detectionTime: detectionTime || new Date(),
        sensorReadings: req.body.sensorReadings || {}
      }
    };

    const alertService = getAlertService();
    const alert = alertService.createAlert(detectionData);

    res.status(201).json({
      success: true,
      alert,
      actionsTriggered: {
        valveClosureTriggered: alert.valveClosureTriggered,
        notificationsSent: alert.notificationsSent.length,
        severity: alert.severity
      }
    });
  } catch (error) {
    console.error('Error creating detection alert:', error);
    res.status(500).json({
      error: 'Failed to create alert from detection',
      details: error.message
    });
  }
});

// ==================== ALERT RETRIEVAL ====================

/**
 * GET /api/alerts/active
 * Get all active alerts
 */
router.get('/active', (req, res) => {
  try {
    const alertService = getAlertService();
    const alerts = alertService.getActiveAlerts();

    res.json({
      count: alerts.length,
      alerts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/alerts/unacknowledged
 * Get all unacknowledged alerts
 */
router.get('/unacknowledged', (req, res) => {
  try {
    const alertService = getAlertService();
    const alerts = alertService.getUnacknowledgedAlerts();

    res.json({
      count: alerts.length,
      alerts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/alerts/severity/:severity
 * Get alerts by severity level
 */
router.get('/severity/:severity', (req, res) => {
  try {
    const { severity } = req.params;
    const alertService = getAlertService();
    const alerts = alertService.getAlertsBySeverity(severity);

    res.json({
      severity,
      count: alerts.length,
      alerts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/alerts/location/:location
 * Get alerts by location
 */
router.get('/location/:location', (req, res) => {
  try {
    const { location } = req.params;
    const alertService = getAlertService();
    const alerts = alertService.getAlertsByLocation(location);

    res.json({
      location,
      count: alerts.length,
      alerts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/alerts/:id
 * Get specific alert by ID
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const alertService = getAlertService();
    const alert = alertService.getAlertById(id, true); // Search in history

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json({
      alert,
      auditTrail: alertService.getAlertAuditTrail(id)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/alerts/time-range
 * Get alerts within time range
 */
router.get('/range/:startTime/:endTime', (req, res) => {
  try {
    const { startTime, endTime } = req.params;
    const alertService = getAlertService();
    const alerts = alertService.getAlertsByTimeRange(
      new Date(startTime),
      new Date(endTime)
    );

    res.json({
      timeRange: { startTime, endTime },
      count: alerts.length,
      alerts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ALERT ACTIONS ====================

/**
 * POST /api/alerts/:id/acknowledge
 * Acknowledge an alert
 */
router.post('/:id/acknowledge', (req, res) => {
  try {
    const { id } = req.params;
    const { userId, notes } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const alertService = getAlertService();
    const alert = alertService.acknowledgeAlert(id, userId, notes || '');

    res.json({
      success: true,
      alert,
      message: `Alert ${id} acknowledged by ${userId}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/alerts/:id/resolve
 * Resolve an alert
 */
router.post('/:id/resolve', (req, res) => {
  try {
    const { id } = req.params;
    const { userId, notes, feedback } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const alertService = getAlertService();
    const alert = alertService.resolveAlert(id, userId, notes || '', feedback || null);

    res.json({
      success: true,
      alert,
      message: `Alert ${id} resolved by ${userId}`,
      feedbackRecorded: !!feedback
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/alerts/:id/feedback
 * Provide feedback for model improvement
 */
router.post('/:id/feedback', (req, res) => {
  try {
    const { id } = req.params;
    const feedback = req.body;

    const alertService = getAlertService();
    const feedbackRecord = alertService.provideFeedback(id, feedback);

    res.json({
      success: true,
      feedback: feedbackRecord,
      message: 'Feedback recorded for model improvement'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== NOTIFICATIONS ====================

/**
 * POST /api/alerts/:id/resend-notifications
 * Resend notifications for an alert
 */
router.post('/:id/resend-notifications', (req, res) => {
  try {
    const { id } = req.params;
    const { channels } = req.body;

    const alertService = getAlertService();
    const alert = alertService.getAlertById(id, true);

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    // Resend to specified channels or all channels
    const notificationChannels = channels || ['email', 'sms', 'slack', 'inApp'];
    const results = [];

    notificationChannels.forEach(channel => {
      if (alertService.notificationChannels[channel]) {
        try {
          alertService.notificationChannels[channel](alert);
          results.push({ channel, status: 'sent' });
        } catch (error) {
          results.push({ channel, status: 'failed', error: error.message });
        }
      }
    });

    res.json({
      success: true,
      alertId: id,
      notificationResults: results,
      totalSent: results.filter(r => r.status === 'sent').length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== STATISTICS & REPORTING ====================

/**
 * GET /api/alerts/statistics
 * Get alert statistics
 */
router.get('/statistics/overview', (req, res) => {
  try {
    const alertService = getAlertService();
    const stats = alertService.getStatistics();

    res.json({
      statistics: stats,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/alerts/report
 * Generate alert report for time period
 */
router.get('/report/:startTime/:endTime', (req, res) => {
  try {
    const { startTime, endTime } = req.params;
    const { type, severity, status } = req.query;

    const alertService = getAlertService();
    const filters = {};
    if (type) filters.type = type;
    if (severity) filters.severity = severity;
    if (status) filters.status = status;

    const report = alertService.generateReport(
      new Date(startTime),
      new Date(endTime),
      filters
    );

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== AUDIT LOG ====================

/**
 * GET /api/alerts/:id/audit-trail
 * Get audit trail for specific alert
 */
router.get('/:id/audit-trail', (req, res) => {
  try {
    const { id } = req.params;
    const alertService = getAlertService();
    const auditTrail = alertService.getAlertAuditTrail(id);

    res.json({
      alertId: id,
      entries: auditTrail,
      count: auditTrail.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/alerts/audit-log/complete
 * Get complete audit log
 */
router.get('/audit-log/complete', (req, res) => {
  try {
    const { action, limit, sortBy } = req.query;
    const alertService = getAlertService();
    
    const filters = {};
    if (action) filters.action = action;
    if (limit) filters.limit = parseInt(limit);
    if (sortBy) filters.sortBy = sortBy;

    const auditLog = alertService.getCompleteAuditLog(filters);

    res.json({
      entries: auditLog,
      count: auditLog.length,
      filters
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/alerts/audit-log/report
 * Generate audit report
 */
router.get('/audit-log/report/:startTime/:endTime', (req, res) => {
  try {
    const { startTime, endTime } = req.params;
    const alertService = getAlertService();
    
    const auditReport = alertService.auditLogger.generateAuditReport(
      new Date(startTime),
      new Date(endTime)
    );

    res.json(auditReport);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/alerts/audit-log/export/:format
 * Export audit log
 */
router.get('/audit-log/export/:format', (req, res) => {
  try {
    const { format } = req.params;
    const alertService = getAlertService();
    
    let exported;
    if (format === 'json') {
      exported = alertService.auditLogger.exportAsJson();
      res.setHeader('Content-Type', 'application/json');
    } else if (format === 'csv') {
      exported = alertService.auditLogger.exportAsCsv();
      res.setHeader('Content-Type', 'text/csv');
    } else {
      return res.status(400).json({ error: 'Format must be json or csv' });
    }

    res.setHeader('Content-Disposition', `attachment; filename=audit-log.${format}`);
    res.send(exported);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/alerts/audit-log/verify
 * Verify audit log integrity
 */
router.post('/audit-log/verify', (req, res) => {
  try {
    const alertService = getAlertService();
    const integrity = alertService.auditLogger.verifyIntegrity();

    res.json({
      integrity,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== UTILITY ====================

/**
 * POST /api/alerts/clear-old
 * Clear alerts older than specified days (admin only)
 */
router.post('/clear-old/:days', (req, res) => {
  try {
    const { days } = req.params;
    const alertService = getAlertService();
    const deleted = alertService.clearOldAlerts(parseInt(days));

    res.json({
      success: true,
      deletedCount: deleted,
      message: `Removed ${deleted} alerts older than ${days} days`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/alerts/reset
 * Reset alert service (testing only)
 */
router.post('/reset', (req, res) => {
  try {
    const alertService = getAlertService();
    alertService.reset();

    res.json({
      success: true,
      message: 'Alert service reset successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
