const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { DEFAULT_LOCATION } = require('../config/constants');
const {
    clockIn,
    clockOut,
    getRecords,
    getLocationSummary,
    getClockStatus
} = require('../controllers/clockController');

router.use(auth);

router.post('/in', clockIn);
router.post('/out', clockOut);
router.get('/status', getClockStatus);
router.get('/records', getRecords);
router.get('/location-summary', getLocationSummary);

// 返回默认location（兼容性保留）
router.get('/locations', (req, res) => {
    res.json([DEFAULT_LOCATION]);
});

module.exports = router;