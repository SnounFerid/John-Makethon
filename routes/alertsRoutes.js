const express = require('express');
const router = express.Router();
const {
  getActiveAlerts,
  getUnacknowledgedAlerts,
  getAlertHistory,
  acknowledgeAlert,
  resolveAlert,
  getAlertStatistics
} = require('../controllers/alertsController');

router.get('/active', getActiveAlerts);
router.get('/unacknowledged', getUnacknowledgedAlerts);
router.get('/history', getAlertHistory);
router.post('/:id/acknowledge', acknowledgeAlert);
router.post('/:id/resolve', resolveAlert);
router.get('/statistics/overview', getAlertStatistics);

module.exports = router;
