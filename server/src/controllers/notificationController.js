const db = require('../config/database');
const moment = require('moment-timezone');

const TIMEZONE = 'America/Vancouver';

// 获取当前用户的通知列表
exports.getMyNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const { is_read, limit = 50 } = req.query;

        let query = `
            SELECT * FROM notifications 
            WHERE user_id = ?
        `;
        const params = [userId];

        if (is_read !== undefined) {
            query += ` AND is_read = ?`;
            params.push(is_read === 'true' ? 1 : 0);
        }

        query += ` ORDER BY created_at DESC LIMIT ?`;
        params.push(parseInt(limit));

        const [notifications] = await db.query(query, params);

        res.json({ notifications });

    } catch (error) {
        console.error('获取通知列表失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
};

// 获取未读通知数量
exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;

        const [result] = await db.query(
            `SELECT COUNT(*) as count FROM notifications 
             WHERE user_id = ? AND is_read = FALSE`,
            [userId]
        );

        res.json({ unreadCount: result[0].count });

    } catch (error) {
        console.error('获取未读通知数量失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
};

// 标记通知为已读
exports.markAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const { notificationId } = req.params;

        const readAt = moment().tz(TIMEZONE).format('YYYY-MM-DD HH:mm:ss');

        const [result] = await db.query(
            `UPDATE notifications 
             SET is_read = TRUE, read_at = ?
             WHERE id = ? AND user_id = ?`,
            [readAt, notificationId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: '通知不存在' });
        }

        res.json({ message: '已标记为已读' });

    } catch (error) {
        console.error('标记通知为已读失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
};

// 标记所有通知为已读
exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const readAt = moment().tz(TIMEZONE).format('YYYY-MM-DD HH:mm:ss');

        await db.query(
            `UPDATE notifications 
             SET is_read = TRUE, read_at = ?
             WHERE user_id = ? AND is_read = FALSE`,
            [readAt, userId]
        );

        res.json({ message: '所有通知已标记为已读' });

    } catch (error) {
        console.error('标记所有通知为已读失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
};

// 删除通知
exports.deleteNotification = async (req, res) => {
    try {
        const userId = req.user.id;
        const { notificationId } = req.params;

        const [result] = await db.query(
            `DELETE FROM notifications 
             WHERE id = ? AND user_id = ?`,
            [notificationId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: '通知不存在' });
        }

        res.json({ message: '通知已删除' });

    } catch (error) {
        console.error('删除通知失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
};

// 清空所有已读通知
exports.clearReadNotifications = async (req, res) => {
    try {
        const userId = req.user.id;

        await db.query(
            `DELETE FROM notifications 
             WHERE user_id = ? AND is_read = TRUE`,
            [userId]
        );

        res.json({ message: '已读通知已清空' });

    } catch (error) {
        console.error('清空已读通知失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
};
