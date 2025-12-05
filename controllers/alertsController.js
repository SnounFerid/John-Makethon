const { integratedEngine } = require('../utils/integratedEngine');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

/**
 * GET /api/alerts/active
 * Return active alerts (not resolved)
 */
const getActiveAlerts = asyncHandler(async (req, res) => {
  const { count = 100 } = req.query;
  let alerts = integratedEngine.getRecentAlerts(parseInt(count));
  alerts = alerts.filter(a => !a.resolved);
  // Debug: log first alert object so frontend mapping issues can be diagnosed
  if (alerts.length > 0) {
    try {
      console.log('[ALERTS_CONTROLLER] Returning active alert (sample):');
      console.dir(alerts[0], { depth: 4 });
    } catch (e) {
      console.log('[ALERTS_CONTROLLER] Alert logging failed');
    }
  }

  res.json({ success: true, alerts, count: alerts.length });
});

/**
 * GET /api/alerts/unacknowledged
 */
const getUnacknowledgedAlerts = asyncHandler(async (req, res) => {
  const { count = 100 } = req.query;
  let alerts = integratedEngine.getRecentAlerts(parseInt(count));
  alerts = alerts.filter(a => !a.acknowledged);
  res.json({ success: true, alerts, count: alerts.length });
});

/**
 * GET /api/alerts/history
 */
const getAlertHistory = asyncHandler(async (req, res) => {
  const { count = 200 } = req.query;
  const alerts = integratedEngine.getRecentAlerts(parseInt(count));
  res.json({ success: true, alerts, count: alerts.length });
});

/**
 * POST /api/alerts/:id/acknowledge
 */
const acknowledgeAlert = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId = 'unknown', notes = '' } = req.body;

  const alerts = integratedEngine.alerts;
  const idx = alerts.findIndex(a => a.id === id);
  if (idx === -1) throw new AppError('Alert not found', 404);

  alerts[idx].acknowledged = true;
  alerts[idx].acknowledgedBy = userId;
  alerts[idx].acknowledgedAt = Date.now();
  alerts[idx].acknowledgeNotes = notes;

  res.json({ success: true, alert: alerts[idx] });
});

/**
 * POST /api/alerts/:id/resolve
 */
const resolveAlert = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId = 'unknown', notes = '', feedback = null } = req.body;

  const alerts = integratedEngine.alerts;
  const idx = alerts.findIndex(a => a.id === id);
  if (idx === -1) throw new AppError('Alert not found', 404);

  alerts[idx].resolved = true;
  alerts[idx].resolvedBy = userId;
  alerts[idx].resolvedAt = Date.now();
  alerts[idx].resolveNotes = notes;
  if (feedback) alerts[idx].feedback = feedback;

  // Clear active anomalies to allow new alert if anomaly condition resumes
  integratedEngine.clearActiveAnomalies();

  res.json({ success: true, alert: alerts[idx] });
});

/**
 * GET /api/alerts/statistics/overview
 */
const getAlertStatistics = asyncHandler(async (req, res) => {
  const alerts = integratedEngine.alerts;
  const total = alerts.length;
  const active = alerts.filter(a => !a.resolved).length;
  const acknowledged = alerts.filter(a => a.acknowledged).length;
  const resolved = alerts.filter(a => a.resolved).length;
  const falsePositives = alerts.filter(a => a.feedback && a.feedback.isFalsePositive).length;
  const avgResponseTime = alerts.reduce((sum, a) => {
    if (a.acknowledgedAt && a.timestamp) return sum + (a.acknowledgedAt - a.timestamp);
    return sum;
  }, 0);
  const averageResponseTime = acknowledged > 0 ? Math.round((avgResponseTime / acknowledged) / 1000) : 0;

  const valveClosuresTriggered = alerts.filter(a => a.recommendedActions && a.recommendedActions.some(act => /close/i.test(act))).map(a => ({ id: a.id, timestamp: a.timestamp }));

  res.json({
    success: true,
    statistics: {
      total,
      active,
      acknowledged,
      resolved,
      falsePositives,
      acknowledgeRate: total > 0 ? Math.round((acknowledged / total) * 100) : 0,
      averageResponseTime,
      valveClosuresTriggered
    }
  });
});

module.exports = {
  getActiveAlerts,
  getUnacknowledgedAlerts,
  getAlertHistory,
  acknowledgeAlert,
  resolveAlert,
  getAlertStatistics
};
