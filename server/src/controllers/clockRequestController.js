const db = require('../config/database');
const moment = require('moment-timezone');

// 获取温哥华时区
const TIMEZONE = 'America/Vancouver';

// 创建补打卡申请
exports.createClockRequest = async (req, res) => {
    try {
        const userId = req.user.id;
        const { request_type, request_date, request_time, reason } = req.body;

        // 验证必填字段
        if (!request_type || !request_date || !request_time || !reason) {
            return res.status(400).json({ 
                error: '请填写所有必填字段' 
            });
        }

        // 验证申请类型
        if (!['clock_in', 'clock_out'].includes(request_type)) {
            return res.status(400).json({ 
                error: '无效的申请类型' 
            });
        }

        // 验证日期格式
        if (!moment(request_date, 'YYYY-MM-DD', true).isValid()) {
            return res.status(400).json({ 
                error: '无效的日期格式，请使用 YYYY-MM-DD' 
            });
        }

        // 验证时间格式
        if (!moment(request_time, 'HH:mm', true).isValid()) {
            return res.status(400).json({ 
                error: '无效的时间格式，请使用 HH:mm' 
            });
        }

        // 检查是否已经有相同日期和类型的pending申请
        const [existingRequests] = await db.query(
            `SELECT id FROM clock_requests 
             WHERE user_id = ? 
             AND request_date = ? 
             AND request_type = ? 
             AND status = 'pending'`,
            [userId, request_date, request_type]
        );

        if (existingRequests.length > 0) {
            return res.status(400).json({ 
                error: '您已有相同日期和类型的待处理申请' 
            });
        }

        // 创建申请
        const [result] = await db.query(
            `INSERT INTO clock_requests 
             (user_id, request_type, request_date, request_time, reason, status) 
             VALUES (?, ?, ?, ?, ?, 'pending')`,
            [userId, request_type, request_date, request_time, reason]
        );

        // 获取所有管理员ID
        const [admins] = await db.query(
            `SELECT id FROM users WHERE role = 'admin' AND status = 'active'`
        );

        // 获取申请人信息
        const [users] = await db.query(
            `SELECT full_name FROM users WHERE id = ?`,
            [userId]
        );
        const userName = users[0]?.full_name || '员工';

        // 为所有管理员创建通知
        const typeText = request_type === 'clock_in' ? '上班' : '下班';
        const notificationPromises = admins.map(admin => 
            db.query(
                `INSERT INTO notifications 
                 (user_id, type, title, message, related_id) 
                 VALUES (?, 'clock_request', ?, ?, ?)`,
                [
                    admin.id,
                    '新的补打卡申请',
                    `${userName} 申请补打卡（${typeText}）- ${request_date} ${request_time}`,
                    result.insertId
                ]
            )
        );

        await Promise.all(notificationPromises);

        res.status(201).json({ 
            message: '补打卡申请已提交',
            requestId: result.insertId 
        });

    } catch (error) {
        console.error('创建补打卡申请失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
};

// 获取当前用户的补打卡申请列表
exports.getMyClockRequests = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status, limit = 50 } = req.query;

        let query = `
            SELECT 
                cr.*,
                u.full_name as user_name,
                a.full_name as admin_name
            FROM clock_requests cr
            LEFT JOIN users u ON cr.user_id = u.id
            LEFT JOIN users a ON cr.admin_id = a.id
            WHERE cr.user_id = ?
        `;
        const params = [userId];

        if (status && ['pending', 'approved', 'rejected'].includes(status)) {
            query += ` AND cr.status = ?`;
            params.push(status);
        }

        query += ` ORDER BY cr.created_at DESC LIMIT ?`;
        params.push(parseInt(limit));

        const [requests] = await db.query(query, params);

        res.json({ requests });

    } catch (error) {
        console.error('获取补打卡申请列表失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
};

// 获取所有补打卡申请（管理员）
exports.getAllClockRequests = async (req, res) => {
    try {
        const { status, limit = 100 } = req.query;

        let query = `
            SELECT 
                cr.*,
                u.full_name as user_name,
                u.email as user_email,
                a.full_name as admin_name
            FROM clock_requests cr
            LEFT JOIN users u ON cr.user_id = u.id
            LEFT JOIN users a ON cr.admin_id = a.id
            WHERE 1=1
        `;
        const params = [];

        if (status && ['pending', 'approved', 'rejected'].includes(status)) {
            query += ` AND cr.status = ?`;
            params.push(status);
        }

        query += ` ORDER BY 
            CASE cr.status 
                WHEN 'pending' THEN 1 
                WHEN 'approved' THEN 2 
                WHEN 'rejected' THEN 3 
            END,
            cr.created_at DESC 
            LIMIT ?`;
        params.push(parseInt(limit));

        const [requests] = await db.query(query, params);

        res.json({ requests });

    } catch (error) {
        console.error('获取所有补打卡申请失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
};

// 审批补打卡申请（管理员）
exports.reviewClockRequest = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const adminId = req.user.id;
        const { requestId } = req.params;
        const { action, admin_note } = req.body;

        // 验证action
        if (!['approve', 'reject'].includes(action)) {
            await connection.rollback();
            return res.status(400).json({ error: '无效的操作' });
        }

        // 获取申请详情
        const [requests] = await connection.query(
            `SELECT * FROM clock_requests WHERE id = ?`,
            [requestId]
        );

        if (requests.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: '申请不存在' });
        }

        const request = requests[0];

        if (request.status !== 'pending') {
            await connection.rollback();
            return res.status(400).json({ error: '该申请已被处理' });
        }

        const newStatus = action === 'approve' ? 'approved' : 'rejected';
        const reviewedAt = moment().tz(TIMEZONE).format('YYYY-MM-DD HH:mm:ss');

        // 更新申请状态
        await connection.query(
            `UPDATE clock_requests 
             SET status = ?, admin_id = ?, admin_note = ?, reviewed_at = ?
             WHERE id = ?`,
            [newStatus, adminId, admin_note || null, reviewedAt, requestId]
        );

        // 如果批准，创建打卡记录
        if (action === 'approve') {
            const requestDateTime = moment.tz(
                `${request.request_date} ${request.request_time}`, 
                'YYYY-MM-DD HH:mm:ss',
                TIMEZONE
            ).format('YYYY-MM-DD HH:mm:ss');

            if (request.request_type === 'clock_in') {
                // 创建上班打卡记录
                await connection.query(
                    `INSERT INTO clock_records 
                     (user_id, clock_in, status, notes, modified_by) 
                     VALUES (?, ?, 'in', ?, ?)`,
                    [request.user_id, requestDateTime, `补打卡申请 #${requestId}`, adminId]
                );
            } else {
                // 查找最近的未打下班卡记录
                const [openRecords] = await connection.query(
                    `SELECT * FROM clock_records 
                     WHERE user_id = ? 
                     AND status = 'in' 
                     AND clock_out IS NULL 
                     ORDER BY clock_in DESC 
                     LIMIT 1`,
                    [request.user_id]
                );

                if (openRecords.length > 0) {
                    // 更新现有记录的下班时间
                    await connection.query(
                        `UPDATE clock_records 
                         SET clock_out = ?, status = 'out', 
                             notes = CONCAT(COALESCE(notes, ''), ' 补打卡申请 #', ?),
                             modified_by = ?
                         WHERE id = ?`,
                        [requestDateTime, requestId, adminId, openRecords[0].id]
                    );
                } else {
                    // 没有未完成的打卡记录，创建新的完整记录
                    // 假设工作8小时前打的上班卡
                    const clockInTime = moment(requestDateTime).subtract(8, 'hours').format('YYYY-MM-DD HH:mm:ss');
                    await connection.query(
                        `INSERT INTO clock_records 
                         (user_id, clock_in, clock_out, status, notes, modified_by) 
                         VALUES (?, ?, ?, 'out', ?, ?)`,
                        [request.user_id, clockInTime, requestDateTime, `补打卡申请 #${requestId} (自动生成上班时间)`, adminId]
                    );
                }
            }
        }

        // 创建通知给申请人
        const statusText = action === 'approve' ? '已批准' : '已拒绝';
        const typeText = request.request_type === 'clock_in' ? '上班' : '下班';
        const notificationType = action === 'approve' ? 'clock_request_approved' : 'clock_request_rejected';
        
        let notificationMessage = `您的补打卡申请（${typeText} - ${request.request_date} ${request.request_time}）${statusText}`;
        if (admin_note) {
            notificationMessage += `\n管理员备注：${admin_note}`;
        }

        await connection.query(
            `INSERT INTO notifications 
             (user_id, type, title, message, related_id) 
             VALUES (?, ?, ?, ?, ?)`,
            [request.user_id, notificationType, `补打卡申请${statusText}`, notificationMessage, requestId]
        );

        await connection.commit();

        res.json({ 
            message: `申请已${statusText}`,
            status: newStatus 
        });

    } catch (error) {
        await connection.rollback();
        console.error('审批补打卡申请失败:', error);
        res.status(500).json({ error: '服务器错误' });
    } finally {
        connection.release();
    }
};

// 删除补打卡申请（仅限pending状态）
exports.deleteClockRequest = async (req, res) => {
    try {
        const userId = req.user.id;
        const { requestId } = req.params;

        // 获取申请
        const [requests] = await db.query(
            `SELECT * FROM clock_requests WHERE id = ? AND user_id = ?`,
            [requestId, userId]
        );

        if (requests.length === 0) {
            return res.status(404).json({ error: '申请不存在' });
        }

        if (requests[0].status !== 'pending') {
            return res.status(400).json({ error: '只能删除待处理的申请' });
        }

        // 删除相关通知
        await db.query(
            `DELETE FROM notifications WHERE related_id = ? AND type = 'clock_request'`,
            [requestId]
        );

        // 删除申请
        await db.query(
            `DELETE FROM clock_requests WHERE id = ?`,
            [requestId]
        );

        res.json({ message: '申请已删除' });

    } catch (error) {
        console.error('删除补打卡申请失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
};
