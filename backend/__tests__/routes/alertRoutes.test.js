/**
 * Alert Routes Tests
 * Integration tests for alert API endpoints
 */

const request = require('supertest');
const express = require('express');
const AlertService = require('../../services/alertService');
const alertRoutes = require('../../routes/alertRoutes');

describe('Alert Routes', () => {
  let app;
  let server;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/alerts', alertRoutes);

    server = app.listen(3001);
  });

  afterEach(() => {
    server.close();
  });

  // ==================== ALERT CREATION ====================
  describe('POST /api/alerts/create', () => {
    test('should create alert successfully', async () => {
      const res = await request(app)
        .post('/api/alerts/create')
        .send({
          type: 'leak_detected',
          severity: 'critical',
          location: 'main_pipe',
          description: 'Critical leak detected',
          value: 25,
          threshold: 5,
          confidence: 0.95
        });

      expect(res.status).toBe(201);
      expect(res.body.alert).toBeDefined();
      expect(res.body.alert.id).toBeDefined();
      expect(res.body.alert.severity).toBe('critical');
    });

    test('should return 400 for invalid data', async () => {
      const res = await request(app)
        .post('/api/alerts/create')
        .send({
          // Missing required fields
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test('should trigger valve closure for critical alerts', async () => {
      const res = await request(app)
        .post('/api/alerts/create')
        .send({
          severity: 'critical',
          location: 'main',
          description: 'Critical leak',
          value: 50,
          threshold: 5
        });

      expect(res.status).toBe(201);
      expect(res.body.alert.valveClosureTriggered).toBe(true);
    });
  });

  describe('POST /api/alerts/create-from-detection', () => {
    test('should create alert from detection data', async () => {
      const res = await request(app)
        .post('/api/alerts/create-from-detection')
        .send({
          detectionId: 'det-123',
          sensorReadings: [12.5, 12.6, 12.7],
          anomalyScore: 0.92,
          location: 'pipe_section_1'
        });

      expect(res.status).toBe(201);
      expect(res.body.alert).toBeDefined();
      expect(res.body.alert.detectionId).toBe('det-123');
    });
  });

  // ==================== ALERT RETRIEVAL ====================
  describe('GET /api/alerts/active', () => {
    beforeEach(async () => {
      // Create test alerts
      await request(app)
        .post('/api/alerts/create')
        .send({ severity: 'warning', description: 'Warning alert' });

      await request(app)
        .post('/api/alerts/create')
        .send({ severity: 'critical', description: 'Critical alert' });
    });

    test('should get all active alerts', async () => {
      const res = await request(app)
        .get('/api/alerts/active');

      expect(res.status).toBe(200);
      expect(res.body.alerts).toBeDefined();
      expect(res.body.alerts.length).toBeGreaterThan(0);
    });

    test('should include alert count', async () => {
      const res = await request(app)
        .get('/api/alerts/active');

      expect(res.status).toBe(200);
      expect(res.body.count).toBeGreaterThan(0);
    });
  });

  describe('GET /api/alerts/unacknowledged', () => {
    let alertId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/alerts/create')
        .send({ severity: 'critical', description: 'Critical alert' });

      alertId = res.body.alert.id;
    });

    test('should get unacknowledged alerts', async () => {
      const res = await request(app)
        .get('/api/alerts/unacknowledged');

      expect(res.status).toBe(200);
      expect(res.body.alerts).toBeDefined();
      expect(res.body.alerts.length).toBeGreaterThan(0);
    });

    test('should exclude acknowledged alerts', async () => {
      // Acknowledge the alert
      await request(app)
        .post(`/api/alerts/${alertId}/acknowledge`)
        .send({ userId: 'user1', notes: 'Acknowledged' });

      const res = await request(app)
        .get('/api/alerts/unacknowledged');

      expect(res.status).toBe(200);
      expect(res.body.alerts.length).toBe(0);
    });
  });

  describe('GET /api/alerts/severity/:severity', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/alerts/create')
        .send({ severity: 'critical', description: 'Critical' });

      await request(app)
        .post('/api/alerts/create')
        .send({ severity: 'critical', description: 'Critical 2' });

      await request(app)
        .post('/api/alerts/create')
        .send({ severity: 'warning', description: 'Warning' });
    });

    test('should filter by critical severity', async () => {
      const res = await request(app)
        .get('/api/alerts/severity/critical');

      expect(res.status).toBe(200);
      expect(res.body.alerts.length).toBe(2);
      expect(res.body.alerts.every(a => a.severity === 'critical')).toBe(true);
    });

    test('should filter by warning severity', async () => {
      const res = await request(app)
        .get('/api/alerts/severity/warning');

      expect(res.status).toBe(200);
      expect(res.body.alerts.length).toBe(1);
      expect(res.body.alerts[0].severity).toBe('warning');
    });

    test('should return 400 for invalid severity', async () => {
      const res = await request(app)
        .get('/api/alerts/severity/invalid');

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/alerts/location/:location', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/alerts/create')
        .send({ severity: 'critical', location: 'main_pipe', description: 'Main pipe' });

      await request(app)
        .post('/api/alerts/create')
        .send({ severity: 'warning', location: 'branch_pipe', description: 'Branch pipe' });
    });

    test('should filter by location', async () => {
      const res = await request(app)
        .get('/api/alerts/location/main_pipe');

      expect(res.status).toBe(200);
      expect(res.body.alerts.length).toBe(1);
      expect(res.body.alerts[0].location).toBe('main_pipe');
    });
  });

  describe('GET /api/alerts/:id', () => {
    let alertId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/alerts/create')
        .send({ severity: 'critical', description: 'Test alert' });

      alertId = res.body.alert.id;
    });

    test('should get alert by ID', async () => {
      const res = await request(app)
        .get(`/api/alerts/${alertId}`);

      expect(res.status).toBe(200);
      expect(res.body.alert).toBeDefined();
      expect(res.body.alert.id).toBe(alertId);
      expect(res.body.auditTrail).toBeDefined();
    });

    test('should return 404 for nonexistent alert', async () => {
      const res = await request(app)
        .get('/api/alerts/nonexistent-id');

      expect(res.status).toBe(404);
    });
  });

  // ==================== ALERT ACTIONS ====================
  describe('POST /api/alerts/:id/acknowledge', () => {
    let alertId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/alerts/create')
        .send({ severity: 'critical', description: 'Test alert' });

      alertId = res.body.alert.id;
    });

    test('should acknowledge alert', async () => {
      const res = await request(app)
        .post(`/api/alerts/${alertId}/acknowledge`)
        .send({
          userId: 'user1',
          notes: 'I will handle this'
        });

      expect(res.status).toBe(200);
      expect(res.body.alert.acknowledged).toBe(true);
      expect(res.body.alert.acknowledgedBy).toBe('user1');
    });

    test('should return 400 without userId', async () => {
      const res = await request(app)
        .post(`/api/alerts/${alertId}/acknowledge`)
        .send({
          notes: 'No user ID'
        });

      expect(res.status).toBe(400);
    });

    test('should return 404 for nonexistent alert', async () => {
      const res = await request(app)
        .post('/api/alerts/nonexistent-id/acknowledge')
        .send({ userId: 'user1' });

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/alerts/:id/resolve', () => {
    let alertId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/alerts/create')
        .send({ severity: 'warning', description: 'Test alert' });

      alertId = res.body.alert.id;
    });

    test('should resolve alert', async () => {
      const res = await request(app)
        .post(`/api/alerts/${alertId}/resolve`)
        .send({
          userId: 'user1',
          notes: 'Fixed the leak',
          feedback: {
            isCorrectPositive: true,
            comments: 'Alert was accurate'
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.alert.resolved).toBe(true);
      expect(res.body.alert.status).toBe('resolved');
    });

    test('should track false positives in feedback', async () => {
      const res = await request(app)
        .post(`/api/alerts/${alertId}/resolve`)
        .send({
          userId: 'user1',
          feedback: {
            isFalsePositive: true
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.feedback.isFalsePositive).toBe(true);
    });
  });

  describe('POST /api/alerts/:id/feedback', () => {
    let alertId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/alerts/create')
        .send({ severity: 'critical', description: 'Test alert' });

      alertId = res.body.alert.id;
    });

    test('should accept feedback', async () => {
      const res = await request(app)
        .post(`/api/alerts/${alertId}/feedback`)
        .send({
          isCorrectPositive: true,
          confidence: 0.9,
          comments: 'Alert was very accurate'
        });

      expect(res.status).toBe(200);
      expect(res.body.feedback).toBeDefined();
      expect(res.body.feedback.isCorrectPositive).toBe(true);
    });
  });

  // ==================== STATISTICS ====================
  describe('GET /api/alerts/statistics/overview', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/alerts/create')
        .send({ severity: 'info', description: 'Info' });

      await request(app)
        .post('/api/alerts/create')
        .send({ severity: 'critical', description: 'Critical' });
    });

    test('should return statistics', async () => {
      const res = await request(app)
        .get('/api/alerts/statistics/overview');

      expect(res.status).toBe(200);
      expect(res.body.statistics).toBeDefined();
      expect(res.body.statistics.total).toBeGreaterThan(0);
      expect(res.body.statistics.severityBreakdown).toBeDefined();
    });

    test('should include all required metrics', async () => {
      const res = await request(app)
        .get('/api/alerts/statistics/overview');

      const stats = res.body.statistics;
      expect(stats.total).toBeDefined();
      expect(stats.active).toBeDefined();
      expect(stats.acknowledged).toBeDefined();
      expect(stats.resolved).toBeDefined();
      expect(stats.acknowledgeRate).toBeDefined();
      expect(stats.averageResponseTime).toBeDefined();
    });
  });

  // ==================== AUDIT LOG ====================
  describe('GET /api/alerts/audit-log/complete', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/alerts/create')
        .send({ severity: 'critical', description: 'Critical' });
    });

    test('should get audit log', async () => {
      const res = await request(app)
        .get('/api/alerts/audit-log/complete');

      expect(res.status).toBe(200);
      expect(res.body.auditLog).toBeDefined();
      expect(Array.isArray(res.body.auditLog)).toBe(true);
    });
  });

  describe('GET /api/alerts/:id/audit-trail', () => {
    let alertId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/alerts/create')
        .send({ severity: 'critical', description: 'Test' });

      alertId = res.body.alert.id;
    });

    test('should get alert audit trail', async () => {
      const res = await request(app)
        .get(`/api/alerts/${alertId}/audit-trail`);

      expect(res.status).toBe(200);
      expect(res.body.auditTrail).toBeDefined();
      expect(Array.isArray(res.body.auditTrail)).toBe(true);
      expect(res.body.auditTrail.length).toBeGreaterThan(0);
    });
  });

  // ==================== EXPORT ====================
  describe('GET /api/alerts/audit-log/export/:format', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/alerts/create')
        .send({ severity: 'critical', description: 'Critical' });
    });

    test('should export as JSON', async () => {
      const res = await request(app)
        .get('/api/alerts/audit-log/export/json');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/json');
    });

    test('should export as CSV', async () => {
      const res = await request(app)
        .get('/api/alerts/audit-log/export/csv');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
    });

    test('should return 400 for invalid format', async () => {
      const res = await request(app)
        .get('/api/alerts/audit-log/export/invalid');

      expect(res.status).toBe(400);
    });
  });

  // ==================== CLEANUP ====================
  describe('POST /api/alerts/clear-old/:days', () => {
    beforeEach(async () => {
      // Create alert and manually set to old date
      const res = await request(app)
        .post('/api/alerts/create')
        .send({ severity: 'warning', description: 'Old' });

      // Note: In real implementation, would need to access service to modify
    });

    test('should clear old alerts', async () => {
      const res = await request(app)
        .post('/api/alerts/clear-old/30');

      expect(res.status).toBe(200);
      expect(res.body.deletedCount).toBeDefined();
    });
  });

  describe('POST /api/alerts/reset', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/alerts/create')
        .send({ severity: 'critical', description: 'Alert' });
    });

    test('should reset alert system', async () => {
      const res = await request(app)
        .post('/api/alerts/reset');

      expect(res.status).toBe(200);
      expect(res.body.message).toBeDefined();
    });

    test('should clear all alerts after reset', async () => {
      await request(app)
        .post('/api/alerts/reset');

      const res = await request(app)
        .get('/api/alerts/active');

      expect(res.body.count).toBe(0);
    });
  });
});
