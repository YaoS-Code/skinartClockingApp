const express = require('express');
const router = express.Router();
const clockRequestController = require('../controllers/clockRequestController');
const auth = require('../middleware/auth');

// 员工路由
router.post('/', auth, clockRequestController.createClockRequest);
router.get('/my', auth, clockRequestController.getMyClockRequests);
router.delete('/:requestId', auth, clockRequestController.deleteClockRequest);

// 管理员路由
router.get('/all', auth, clockRequestController.getAllClockRequests);
router.post('/:requestId/review', auth, clockRequestController.reviewClockRequest);

module.exports = router;
