const express = require('express');
const router = express.Router();
const { controlValve, getValveStatus, getValveHistory } = require('../controllers/valveController');

/**
 * Manual Valve Control Routes
 */

router.post('/control', controlValve);
router.get('/status', getValveStatus);
router.get('/history', getValveHistory);

module.exports = router;
