const express = require('express');
const router = express.Router();
const {
  initializeEngine,
  processIntegratedReading,
  getDetectionStatus,
  getRecentDetections,
  getRecentAlerts,
  getDetectionPatterns,
  getComprehensiveReport,
  resetDetectionEngine,
  getSystemInfo,
  batchProcessReadings,
  getMaintenanceReport
} = require('../controllers/integratedController');

/**
 * Integrated Detection Routes
 * Combines rule-based, ML, and predictive maintenance systems
 */

// System initialization and status
router.post('/initialize', initializeEngine);
router.get('/status', getDetectionStatus);
router.get('/system-info', getSystemInfo);
router.post('/reset', resetDetectionEngine);

// Detection processing
router.post('/process', processIntegratedReading);
router.post('/batch-process', batchProcessReadings);

// Detection results
router.get('/recent', getRecentDetections);
router.get('/alerts', getRecentAlerts);
router.get('/patterns', getDetectionPatterns);
router.get('/report', getComprehensiveReport);

// Maintenance
router.get('/maintenance-report', getMaintenanceReport);

module.exports = router;
