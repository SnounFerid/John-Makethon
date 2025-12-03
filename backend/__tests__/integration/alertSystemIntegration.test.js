/**
 * Integration Tests for Alert System
 * End-to-end tests for complete alert workflow
 */

const AlertService = require('../../services/alertService');
const AuditLogger = require('../../services/auditLogger');

describe('Alert System Integration', () => {
  let alertService;
  let auditLogger;

  beforeEach(() => {
    alertService = new AlertService();
    auditLogger = alertService.auditLogger;
  });

  afterEach(() => {
    alertService.reset();
  });

  // ==================== COMPLETE WORKFLOW ====================
  describe('Complete Alert Workflow', () => {
    test('should handle full alert lifecycle: create -> acknowledge -> resolve', () => {
      // Create alert
      const alertData = {
        severity: 'critical',
        location: 'main_pipe',
        description: 'Critical leak detected',
        value: 25,
        threshold: 5,
        confidence: 0.95
      };

      const createdAlert = alertService.createAlert(alertData);

      expect(createdAlert.id).toBeDefined();
      expect(createdAlert.status).toBe('active');
      expect(createdAlert.acknowledged).toBe(false);
      expect(createdAlert.resolved).toBe(false);

      // Acknowledge alert
      const acknowledgedAlert = alertService.acknowledgeAlert(
        createdAlert.id,
        'user1',
        'I am investigating this'
      );

      expect(acknowledgedAlert.acknowledged).toBe(true);
      expect(acknowledgedAlert.acknowledgedBy).toBe('user1');

      // Resolve alert
      const feedback = {
        isCorrectPositive: true,
        comments: 'Found and fixed the leak',
        confidence: 0.98
      };

      const resolvedAlert = alertService.resolveAlert(
        createdAlert.id,
        'user1',
        'Leak has been repaired',
        feedback
      );

      expect(resolvedAlert.resolved).toBe(true);
      expect(resolvedAlert.status).toBe('resolved');

      // Verify audit trail
      const auditTrail = alertService.getAlertAuditTrail(createdAlert.id);
      expect(auditTrail.length).toBeGreaterThan(0);

      // Should contain creation, acknowledgment, and resolution entries
      const eventTypes = auditTrail.map(entry => entry.eventType);
      expect(eventTypes).toContain('ALERT_CREATED');
      expect(eventTypes).toContain('ALERT_ACKNOWLEDGED');
      expect(eventTypes).toContain('ALERT_RESOLVED');
    });

    test('should track valve closure through complete workflow', () => {
      const alert = alertService.createAlert({
        severity: 'emergency',
        location: 'main',
        description: 'Emergency leak',
        value: 100,
        threshold: 5,
        confidence: 0.99
      });

      expect(alert.valveClosureTriggered).toBe(true);
      expect(alert.valveClosureTime).toBeDefined();

      // Valve state should be tracked
      expect(alertService.valveStates.get('main')).toBe('closed');

      // Audit should record valve closure
      const auditTrail = alertService.getAlertAuditTrail(alert.id);
      const valveClosureEvent = auditTrail.find(e => e.eventType === 'VALVE_CLOSURE_TRIGGERED');
      expect(valveClosureEvent).toBeDefined();
    });

    test('should collect feedback throughout workflow', () => {
      const alert = alertService.createAlert({
        severity: 'warning',
        description: 'Test',
        confidence: 0.7
      });

      // Provide feedback
      const feedback1 = alertService.provideFeedback(alert.id, {
        isCorrectPositive: false,
        comments: 'Initially uncertain',
        confidence: 0.6
      });

      expect(feedback1.isCorrectPositive).toBe(false);
      expect(feedback1.confidence).toBe(0.6);

      // Provide updated feedback
      const feedback2 = alertService.provideFeedback(alert.id, {
        isCorrectPositive: true,
        comments: 'After investigation, confirmed leak',
        confidence: 0.95
      });

      expect(feedback2.isCorrectPositive).toBe(true);
      expect(feedback2.confidence).toBe(0.95);
    });
  });

  // ==================== MULTI-ALERT SCENARIOS ====================
  describe('Multi-Alert Scenarios', () => {
    test('should handle multiple alerts at different severity levels', () => {
      const alerts = [
        alertService.createAlert({ severity: 'info', description: 'Info' }),
        alertService.createAlert({ severity: 'warning', description: 'Warning' }),
        alertService.createAlert({ severity: 'critical', description: 'Critical' }),
        alertService.createAlert({ severity: 'emergency', description: 'Emergency' })
      ];

      expect(alertService.alertQueue.length).toBe(4);

      // Check severity-based filtering
      const critical = alertService.getAlertsBySeverity('critical');
      const warning = alertService.getAlertsBySeverity('warning');

      expect(critical.length).toBeGreaterThan(0);
      expect(warning.length).toBeGreaterThan(0);
    });

    test('should manage multiple alerts at same location', () => {
      const location = 'main_pipe';

      alertService.createAlert({
        severity: 'warning',
        location,
        description: 'Minor leak'
      });

      alertService.createAlert({
        severity: 'critical',
        location,
        description: 'Critical leak'
      });

      const locationAlerts = alertService.getAlertsByLocation(location);
      expect(locationAlerts.length).toBe(2);

      // Valve should only close once for the location
      const valveState = alertService.valveStates.get(location);
      expect(valveState).toBe('closed');
    });

    test('should calculate statistics correctly with multiple alerts', () => {
      // Create 10 alerts
      for (let i = 0; i < 10; i++) {
        alertService.createAlert({
          severity: i % 4 === 0 ? 'emergency' : i % 3 === 0 ? 'critical' : 'warning',
          description: `Alert ${i}`
        });
      }

      const stats = alertService.getStatistics();

      expect(stats.total).toBe(10);
      expect(stats.active).toBe(10);

      // Acknowledge 5
      const activeAlerts = alertService.getActiveAlerts();
      for (let i = 0; i < 5; i++) {
        alertService.acknowledgeAlert(activeAlerts[i].id, 'user1');
      }

      const updatedStats = alertService.getStatistics();
      expect(updatedStats.acknowledged).toBe(5);
      expect(updatedStats.acknowledgeRate).toBe('50.0');
    });
  });

  // ==================== NOTIFICATION SYSTEM ====================
  describe('Notification System Integration', () => {
    test('should send appropriate notifications based on severity', (done) => {
      const notifications = [];

      alertService.on('notification:sent', (data) => {
        notifications.push(data);

        // Critical should trigger email, SMS, Slack, and in-app
        if (data.alertId && notifications.length >= 4) {
          expect(notifications.length).toBeGreaterThanOrEqual(4);
          done();
        }
      });

      alertService.createAlert({
        severity: 'critical',
        description: 'Critical alert'
      });
    });

    test('should include alert details in notifications', (done) => {
      alertService.on('notification:sent', (data) => {
        expect(data.alertId).toBeDefined();
        expect(data.channel).toBeDefined();
        expect(data.timestamp).toBeDefined();
        expect(data.message).toContain(data.alertId);
        done();
      });

      alertService.createAlert({
        severity: 'warning',
        description: 'Test alert'
      });
    });

    test('should handle resend notifications', (done) => {
      let sendCount = 0;

      alertService.on('notification:sent', () => {
        sendCount++;
      });

      const alert = alertService.createAlert({
        severity: 'critical',
        description: 'Test'
      });

      setTimeout(() => {
        const initialCount = sendCount;

        alertService.resendNotifications(alert.id);

        setTimeout(() => {
          expect(sendCount).toBeGreaterThan(initialCount);
          done();
        }, 100);
      }, 100);
    });
  });

  // ==================== AUDIT TRAIL INTEGRITY ====================
  describe('Audit Trail Integrity', () => {
    test('should maintain complete detection-to-action chain', () => {
      const detectionData = {
        detectionId: 'det-123',
        sensorReadings: [10, 12, 15, 20, 25],
        anomalyScore: 0.92,
        severity: 'critical',
        location: 'main'
      };

      const alert = alertService.createAlert(detectionData);

      // Perform actions
      alertService.acknowledgeAlert(alert.id, 'user1', 'Acknowledged');
      alertService.resolveAlert(
        alert.id,
        'user1',
        'Fixed',
        { isCorrectPositive: true, confidence: 0.98 }
      );

      // Get full trail
      const trail = alertService.getAlertAuditTrail(alert.id);

      // Verify chain
      expect(trail.length).toBeGreaterThan(0);

      // Each entry should have required fields
      trail.forEach(entry => {
        expect(entry.timestamp).toBeDefined();
        expect(entry.eventType).toBeDefined();
        expect(entry.userId || entry.system).toBeDefined();
        expect(entry.details).toBeDefined();
      });

      // Verify sequence
      const types = trail.map(e => e.eventType);
      const createdIdx = types.indexOf('ALERT_CREATED');
      const ackedIdx = types.indexOf('ALERT_ACKNOWLEDGED');
      const resolvedIdx = types.indexOf('ALERT_RESOLVED');

      expect(createdIdx).toBeLessThan(ackedIdx);
      expect(ackedIdx).toBeLessThan(resolvedIdx);
    });

    test('should export audit log without corruption', () => {
      // Create several alerts with different actions
      const alert1 = alertService.createAlert({ severity: 'critical', description: 'Test 1' });
      const alert2 = alertService.createAlert({ severity: 'warning', description: 'Test 2' });

      alertService.acknowledgeAlert(alert1.id, 'user1');
      alertService.resolveAlert(alert2.id, 'user2', 'Fixed', { isCorrectPositive: true });

      // Export as JSON
      const jsonExport = auditLogger.exportAsJson();
      expect(jsonExport).toBeDefined();
      expect(typeof jsonExport).toBe('string');

      // Parse and validate
      const parsed = JSON.parse(jsonExport);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBeGreaterThan(0);

      // Export as CSV
      const csvExport = auditLogger.exportAsCsv();
      expect(csvExport).toBeDefined();
      expect(csvExport).toContain(',');
    });
  });

  // ==================== FALSE POSITIVE HANDLING ====================
  describe('False Positive Detection and Feedback', () => {
    test('should track false positives correctly', () => {
      // Create 5 alerts
      const alerts = [];
      for (let i = 0; i < 5; i++) {
        alerts.push(alertService.createAlert({
          severity: 'warning',
          description: `Alert ${i}`
        }));
      }

      // Resolve 2 as false positives
      alertService.resolveAlert(alerts[0].id, 'user1', 'False alarm', {
        isFalsePositive: true,
        comments: 'No actual leak'
      });

      alertService.resolveAlert(alerts[1].id, 'user1', 'False alarm', {
        isFalsePositive: true,
        comments: 'Sensor malfunction'
      });

      // Resolve 3 as correct detections
      alertService.resolveAlert(alerts[2].id, 'user1', 'Fixed', {
        isCorrectPositive: true,
        comments: 'Real leak found and fixed'
      });

      alertService.resolveAlert(alerts[3].id, 'user1', 'Fixed', {
        isCorrectPositive: true,
        comments: 'Confirmed leak'
      });

      alertService.resolveAlert(alerts[4].id, 'user1', 'Fixed', {
        isCorrectPositive: true,
        comments: 'Fixed'
      });

      const stats = alertService.getStatistics();

      expect(stats.falsePositives).toBe(2);
      expect(stats.resolved).toBe(5);
    });

    test('should use feedback for model improvement', () => {
      const alert = alertService.createAlert({
        severity: 'warning',
        description: 'Test',
        confidence: 0.7
      });

      // Initial low confidence, later confirmed as correct
      const feedback = alertService.provideFeedback(alert.id, {
        isCorrectPositive: true,
        confidence: 0.95, // Confidence improved after investigation
        comments: 'Alert was correct, confidence can be increased'
      });

      expect(feedback.confidence).toBe(0.95);
      expect(feedback.isCorrectPositive).toBe(true);

      // This feedback can be used to improve the ML model's confidence thresholds
      const auditTrail = alertService.getAlertAuditTrail(alert.id);
      const feedbackEntry = auditTrail.find(e => e.eventType === 'FEEDBACK_PROVIDED');

      expect(feedbackEntry).toBeDefined();
      expect(feedbackEntry.details.feedback).toBeDefined();
    });
  });

  // ==================== PERFORMANCE ====================
  describe('System Performance', () => {
    test('should handle large number of alerts efficiently', () => {
      const startTime = Date.now();

      // Create 100 alerts
      for (let i = 0; i < 100; i++) {
        alertService.createAlert({
          severity: ['info', 'warning', 'critical', 'emergency'][i % 4],
          location: `location_${i % 10}`,
          description: `Alert ${i}`,
          value: Math.random() * 50,
          threshold: 5
        });
      }

      const creationTime = Date.now() - startTime;

      // Filtering should be fast
      const filterStart = Date.now();
      alertService.getAlertsBySeverity('critical');
      alertService.getAlertsByLocation('location_0');
      alertService.getActiveAlerts();
      const filterTime = Date.now() - filterStart;

      // Statistics calculation should be fast
      const statsStart = Date.now();
      alertService.getStatistics();
      const statsTime = Date.now() - statsStart;

      expect(creationTime).toBeLessThan(1000); // Should create 100 in < 1 second
      expect(filterTime).toBeLessThan(100); // Filtering should be fast
      expect(statsTime).toBeLessThan(100); // Stats calc should be fast
    });

    test('should maintain audit log integrity with many operations', () => {
      // Create multiple alerts with multiple operations each
      for (let i = 0; i < 20; i++) {
        const alert = alertService.createAlert({
          severity: i % 2 === 0 ? 'critical' : 'warning',
          description: `Alert ${i}`
        });

        if (i % 2 === 0) {
          alertService.acknowledgeAlert(alert.id, 'user1');
          alertService.provideFeedback(alert.id, { isCorrectPositive: true });
        }

        alertService.resolveAlert(alert.id, 'user1', 'Done', { isCorrectPositive: true });
      }

      // Verify audit integrity
      const integrity = auditLogger.verifyIntegrity();
      expect(integrity.isValid).toBe(true);
      expect(integrity.issues.length).toBe(0);

      // Verify all audit entries are accessible
      expect(auditLogger.auditLog.length).toBeGreaterThan(0);
    });
  });

  // ==================== ERROR SCENARIOS ====================
  describe('Error Handling in Workflows', () => {
    test('should handle acknowledging already acknowledged alert', () => {
      const alert = alertService.createAlert({
        severity: 'warning',
        description: 'Test'
      });

      alertService.acknowledgeAlert(alert.id, 'user1', 'First ack');

      // Second acknowledgment should update
      const updated = alertService.acknowledgeAlert(alert.id, 'user2', 'Second ack');

      expect(updated.acknowledgedBy).toBe('user2');
    });

    test('should handle resolving already resolved alert gracefully', () => {
      const alert = alertService.createAlert({
        severity: 'warning',
        description: 'Test'
      });

      alertService.resolveAlert(alert.id, 'user1', 'Resolved');

      // Try to resolve again should fail gracefully
      expect(() => {
        alertService.resolveAlert(alert.id, 'user2', 'Resolved again');
      }).toThrow();
    });

    test('should validate severity levels', () => {
      const alert = alertService.createAlert({
        severity: 'warning',
        description: 'Test'
      });

      expect(alert).toBeDefined();

      const critical = alertService.createAlert({
        severity: 'critical',
        description: 'Test'
      });

      expect(critical).toBeDefined();
    });
  });
});
