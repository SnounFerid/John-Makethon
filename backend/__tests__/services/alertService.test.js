/**
 * Alert Service Tests
 * Comprehensive test suite for alert functionality
 */

const AlertService = require('../services/alertService');

describe('AlertService', () => {
  let alertService;

  beforeEach(() => {
    alertService = new AlertService();
  });

  afterEach(() => {
    alertService.reset();
  });

  // ==================== ALERT CREATION ====================
  describe('createAlert', () => {
    test('should create alert with correct properties', () => {
      const detectionData = {
        type: 'leak_detected',
        severity: 'critical',
        location: 'main_pipe',
        description: 'Critical leak detected',
        value: 25,
        threshold: 5,
        confidence: 0.95
      };

      const alert = alertService.createAlert(detectionData);

      expect(alert.id).toBeDefined();
      expect(alert.timestamp).toBeDefined();
      expect(alert.type).toBe('leak_detected');
      expect(alert.severity).toBe('critical');
      expect(alert.location).toBe('main_pipe');
      expect(alert.status).toBe('active');
      expect(alert.acknowledged).toBe(false);
      expect(alert.resolved).toBe(false);
    });

    test('should add alert to queue and history', () => {
      const detectionData = {
        severity: 'warning',
        description: 'Minor leak'
      };

      alertService.createAlert(detectionData);
      alertService.createAlert(detectionData);

      expect(alertService.alertQueue.length).toBe(2);
      expect(alertService.alertHistory.length).toBe(2);
    });

    test('should trigger valve closure for critical alerts', () => {
      const detectionData = {
        severity: 'critical',
        location: 'main',
        description: 'Critical leak',
        value: 50,
        threshold: 5,
        confidence: 0.9
      };

      const alert = alertService.createAlert(detectionData);

      expect(alert.valveClosureTriggered).toBe(true);
      expect(alert.valveClosureTime).toBeDefined();
    });

    test('should trigger valve closure for emergency alerts', () => {
      const detectionData = {
        severity: 'emergency',
        location: 'main',
        description: 'Emergency leak',
        value: 100,
        threshold: 5,
        confidence: 0.95
      };

      const alert = alertService.createAlert(detectionData);

      expect(alert.valveClosureTriggered).toBe(true);
    });

    test('should not trigger valve closure for warning alerts', () => {
      const detectionData = {
        severity: 'warning',
        location: 'main',
        description: 'Minor leak',
        value: 3,
        threshold: 5,
        confidence: 0.7
      };

      const alert = alertService.createAlert(detectionData);

      expect(alert.valveClosureTriggered).toBe(false);
    });

    test('should emit alert:created event', (done) => {
      alertService.on('alert:created', (alert) => {
        expect(alert.type).toBe('test');
        done();
      });

      alertService.createAlert({
        type: 'test',
        severity: 'info',
        description: 'Test alert'
      });
    });

    test('should send notifications', (done) => {
      let notificationCount = 0;

      alertService.on('notification:sent', () => {
        notificationCount++;
        if (notificationCount >= 2) {
          expect(notificationCount).toBeGreaterThanOrEqual(2);
          done();
        }
      });

      alertService.createAlert({
        severity: 'critical',
        location: 'test',
        description: 'Test'
      });
    });
  });

  // ==================== ALERT RETRIEVAL ====================
  describe('getAlerts', () => {
    beforeEach(() => {
      alertService.createAlert({ severity: 'info', description: 'Info alert' });
      alertService.createAlert({ severity: 'warning', description: 'Warning alert' });
      alertService.createAlert({ severity: 'critical', location: 'pipe1', description: 'Critical alert' });
    });

    test('should get all active alerts', () => {
      const alerts = alertService.getActiveAlerts();
      expect(alerts.length).toBe(3);
    });

    test('should filter by severity', () => {
      const critical = alertService.getAlertsBySeverity('critical');
      expect(critical.length).toBe(1);
      expect(critical[0].severity).toBe('critical');
    });

    test('should filter by location', () => {
      const alerts = alertService.getAlertsByLocation('pipe1');
      expect(alerts.length).toBe(1);
      expect(alerts[0].location).toBe('pipe1');
    });

    test('should get unacknowledged alerts', () => {
      const unacknowledged = alertService.getUnacknowledgedAlerts();
      expect(unacknowledged.length).toBe(3);

      alertService.acknowledgeAlert(unacknowledged[0].id, 'user1');

      const updated = alertService.getUnacknowledgedAlerts();
      expect(updated.length).toBe(2);
    });

    test('should get alerts by time range', () => {
      const now = new Date();
      const oneHourAgo = new Date(now - 60 * 60 * 1000);
      const oneHourFromNow = new Date(now + 60 * 60 * 1000);

      const alerts = alertService.getAlertsByTimeRange(oneHourAgo, oneHourFromNow);
      expect(alerts.length).toBe(3);
    });

    test('should get alert by ID', () => {
      const allAlerts = alertService.getActiveAlerts();
      const alert = alertService.getAlertById(allAlerts[0].id, true);

      expect(alert).toBeDefined();
      expect(alert.id).toBe(allAlerts[0].id);
    });

    test('should return null for nonexistent alert', () => {
      const alert = alertService.getAlertById('nonexistent-id');
      expect(alert).toBeUndefined();
    });
  });

  // ==================== ACKNOWLEDGMENT ====================
  describe('acknowledgeAlert', () => {
    let alertId;

    beforeEach(() => {
      const alert = alertService.createAlert({
        severity: 'critical',
        description: 'Test'
      });
      alertId = alert.id;
    });

    test('should acknowledge alert correctly', () => {
      const alert = alertService.acknowledgeAlert(alertId, 'user1', 'Noted');

      expect(alert.acknowledged).toBe(true);
      expect(alert.acknowledgedBy).toBe('user1');
      expect(alert.acknowledgedAt).toBeDefined();
      expect(alert.acknowledgeNotes).toBe('Noted');
    });

    test('should update acknowledgment stats', () => {
      expect(alertService.alertStats.acknowledged).toBe(0);

      alertService.acknowledgeAlert(alertId, 'user1');

      expect(alertService.alertStats.acknowledged).toBe(1);
    });

    test('should emit alert:acknowledged event', (done) => {
      alertService.on('alert:acknowledged', (data) => {
        expect(data.alertId).toBe(alertId);
        expect(data.userId).toBe('user1');
        done();
      });

      alertService.acknowledgeAlert(alertId, 'user1');
    });

    test('should throw for nonexistent alert', () => {
      expect(() => {
        alertService.acknowledgeAlert('nonexistent-id', 'user1');
      }).toThrow();
    });
  });

  // ==================== RESOLUTION ====================
  describe('resolveAlert', () => {
    let alertId;

    beforeEach(() => {
      const alert = alertService.createAlert({
        severity: 'warning',
        description: 'Test'
      });
      alertId = alert.id;
    });

    test('should resolve alert correctly', () => {
      const feedback = {
        isCorrectPositive: true,
        comments: 'Alert was accurate'
      };

      const alert = alertService.resolveAlert(alertId, 'user1', 'Fixed', feedback);

      expect(alert.resolved).toBe(true);
      expect(alert.resolvedBy).toBe('user1');
      expect(alert.resolutionNotes).toBe('Fixed');
      expect(alert.status).toBe('resolved');
    });

    test('should remove from active queue when resolved', () => {
      expect(alertService.alertQueue.length).toBe(1);

      alertService.resolveAlert(alertId, 'user1');

      expect(alertService.alertQueue.length).toBe(0);
    });

    test('should track false positives', () => {
      const feedback = { isFalsePositive: true };

      alertService.resolveAlert(alertId, 'user1', 'False alarm', feedback);

      expect(alertService.alertStats.falsePositives).toBe(1);
    });

    test('should update resolution stats', () => {
      expect(alertService.alertStats.resolved).toBe(0);

      alertService.resolveAlert(alertId, 'user1');

      expect(alertService.alertStats.resolved).toBe(1);
    });
  });

  // ==================== FEEDBACK ====================
  describe('provideFeedback', () => {
    let alertId;

    beforeEach(() => {
      const alert = alertService.createAlert({
        severity: 'warning',
        description: 'Test',
        confidence: 0.7
      });
      alertId = alert.id;
    });

    test('should record feedback correctly', () => {
      const feedback = {
        isCorrectPositive: true,
        comments: 'Alert was accurate',
        confidence: 0.9
      };

      const recorded = alertService.provideFeedback(alertId, feedback);

      expect(recorded.alertId).toBe(alertId);
      expect(recorded.isCorrectPositive).toBe(true);
      expect(recorded.comments).toBe('Alert was accurate');
      expect(recorded.confidence).toBe(0.9);
    });

    test('should mark as false positive', () => {
      const feedback = {
        isFalsePositive: true,
        comments: 'This was wrong'
      };

      const recorded = alertService.provideFeedback(alertId, feedback);

      expect(recorded.isFalsePositive).toBe(true);
      expect(recorded.isCorrectPositive).toBe(false);
    });

    test('should emit feedback:provided event', (done) => {
      alertService.on('feedback:provided', (feedback) => {
        expect(feedback.alertId).toBe(alertId);
        done();
      });

      alertService.provideFeedback(alertId, { isFalsePositive: false });
    });
  });

  // ==================== VALVE CLOSURE ====================
  describe('triggerValveClosure', () => {
    test('should close valve for critical alert', () => {
      const alert = alertService.createAlert({
        severity: 'critical',
        location: 'main',
        description: 'Critical'
      });

      expect(alertService.valveStates.get('main')).toBe('closed');
      expect(alert.valveClosureTriggered).toBe(true);
    });

    test('should not duplicate valve closure', () => {
      const alert1 = alertService.createAlert({
        severity: 'critical',
        location: 'main',
        description: 'Critical 1'
      });

      const alert2 = alertService.createAlert({
        severity: 'critical',
        location: 'main',
        description: 'Critical 2'
      });

      // Second alert should also mark closure but valve already closed
      expect(alert1.valveClosureTriggered).toBe(true);
      expect(alert2.valveClosureTriggered).toBe(true);
    });

    test('should emit valve:closed event', (done) => {
      alertService.on('valve:closed', (data) => {
        expect(data.valveId).toBeDefined();
        done();
      });

      alertService.createAlert({
        severity: 'critical',
        location: 'test_valve',
        description: 'Critical'
      });
    });
  });

  // ==================== NOTIFICATIONS ====================
  describe('sendNotifications', () => {
    test('should send email for critical alerts', (done) => {
      let emailSent = false;

      alertService.on('notification:sent', (data) => {
        if (data.channel === 'email') {
          emailSent = true;
          expect(emailSent).toBe(true);
          done();
        }
      });

      alertService.createAlert({
        severity: 'critical',
        description: 'Test'
      });
    });

    test('should send SMS for critical alerts', (done) => {
      let smsSent = false;

      alertService.on('notification:sent', (data) => {
        if (data.channel === 'sms') {
          smsSent = true;
          expect(smsSent).toBe(true);
          done();
        }
      });

      alertService.createAlert({
        severity: 'critical',
        description: 'Test'
      });
    });

    test('should send in-app for all alerts', (done) => {
      let inAppSent = false;

      alertService.on('notification:sent', (data) => {
        if (data.channel === 'inApp') {
          inAppSent = true;
          expect(inAppSent).toBe(true);
          done();
        }
      });

      alertService.createAlert({
        severity: 'info',
        description: 'Test'
      });
    });
  });

  // ==================== STATISTICS ====================
  describe('getStatistics', () => {
    beforeEach(() => {
      // Create various alerts
      alertService.createAlert({ severity: 'info', description: 'Info' });
      alertService.createAlert({ severity: 'warning', description: 'Warning' });
      alertService.createAlert({ severity: 'critical', description: 'Critical' });

      // Acknowledge some
      const alerts = alertService.getActiveAlerts();
      alertService.acknowledgeAlert(alerts[0].id, 'user1');
    });

    test('should calculate statistics correctly', () => {
      const stats = alertService.getStatistics();

      expect(stats.total).toBe(3);
      expect(stats.active).toBe(3);
      expect(stats.acknowledged).toBe(1);
      expect(stats.acknowledgeRate).toBe('33.3');
    });

    test('should track severity breakdown', () => {
      const stats = alertService.getStatistics();

      expect(stats.severityBreakdown.info).toBeGreaterThanOrEqual(1);
      expect(stats.severityBreakdown.warning).toBeGreaterThanOrEqual(1);
      expect(stats.severityBreakdown.critical).toBeGreaterThanOrEqual(1);
    });

    test('should calculate response time', () => {
      const stats = alertService.getStatistics();

      expect(stats.averageResponseTime).toBeGreaterThanOrEqual(0);
      expect(typeof stats.averageResponseTime).toBe('number');
    });
  });

  // ==================== AUDIT LOG ====================
  describe('auditLogger', () => {
    test('should create audit entries for alerts', () => {
      alertService.createAlert({
        severity: 'critical',
        description: 'Test'
      });

      const auditLog = alertService.auditLogger.auditLog;
      expect(auditLog.length).toBeGreaterThan(0);
    });

    test('should get audit trail for alert', () => {
      const alert = alertService.createAlert({
        severity: 'warning',
        description: 'Test'
      });

      const trail = alertService.getAlertAuditTrail(alert.id);
      expect(trail.length).toBeGreaterThan(0);
      expect(trail[0].alertId).toBe(alert.id);
    });

    test('should verify audit log integrity', () => {
      alertService.createAlert({ description: 'Test' });

      const integrity = alertService.auditLogger.verifyIntegrity();
      expect(integrity.isValid).toBe(true);
      expect(integrity.issues).toEqual([]);
    });
  });

  // ==================== CLEANUP ====================
  describe('clearOldAlerts', () => {
    test('should remove alerts older than specified days', () => {
      alertService.createAlert({ description: 'Old alert' });

      // Manually set timestamp to old date
      alertService.alertHistory[0].timestamp = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000);

      const deleted = alertService.clearOldAlerts(30);

      expect(deleted).toBe(1);
      expect(alertService.alertHistory.length).toBe(0);
    });

    test('should keep recent alerts', () => {
      alertService.createAlert({ description: 'Recent alert' });

      const deleted = alertService.clearOldAlerts(30);

      expect(deleted).toBe(0);
      expect(alertService.alertHistory.length).toBe(1);
    });
  });

  // ==================== RESET ====================
  describe('reset', () => {
    test('should clear all data on reset', () => {
      alertService.createAlert({ description: 'Test' });
      alertService.createAlert({ description: 'Test 2' });

      alertService.reset();

      expect(alertService.alertQueue.length).toBe(0);
      expect(alertService.alertHistory.length).toBe(0);
      expect(alertService.alertStats.total).toBe(0);
    });
  });
});
