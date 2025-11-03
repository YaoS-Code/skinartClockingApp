const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const auth = require('../middleware/auth');

// 获取通知列表
router.get('/', auth, notificationController.getMyNotifications);

// 获取未读数量
router.get('/unread-count', auth, notificationController.getUnreadCount);

// 标记为已读
router.patch('/:notificationId/read', auth, notificationController.markAsRead);

// 标记所有为已读
router.patch('/read-all', auth, notificationController.markAllAsRead);

// 删除通知
router.delete('/:notificationId', auth, notificationController.deleteNotification);

// 清空已读通知
router.delete('/clear/read', auth, notificationController.clearReadNotifications);

module.exports = router;
