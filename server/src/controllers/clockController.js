const db = require('../config/database');
const moment = require('moment');
const { DEFAULT_LOCATION } = require('../config/constants');

exports.clockIn = async (req, res) => {
    try {
        const userId = req.user.id;
        const { notes } = req.body;
        
        // 自动设置为SkinartMD，无需location参数
        const location = DEFAULT_LOCATION;

        // Check if user already clocked in
        const [activeClocking] = await db.query(
            `SELECT * FROM clock_records 
             WHERE user_id = ? AND status = 'in' 
             AND clock_out IS NULL`,
            [userId]
        );

        if (activeClocking.length > 0) {
            return res.status(400).json({
                error: 'You are already clocked in'
            });
        }

        const [result] = await db.query(
            `INSERT INTO clock_records (user_id, clock_in, status, notes, location) 
             VALUES (?, NOW(), 'in', ?, ?)`,
            [userId, notes, location]
        );

        res.status(201).json({
            message: 'Clocked in successfully',
            recordId: result.insertId,
            location: location
        });
    } catch (error) {
        console.error('Clock in error:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.clockOut = async (req, res) => {
    try {
        const userId = req.user.id;
        const { notes, break_minutes } = req.body;
        
        // 自动设置为SkinartMD，无需location参数
        const location = DEFAULT_LOCATION;

        // Find active clock-in record
        const [activeClocking] = await db.query(
            `SELECT * FROM clock_records 
             WHERE user_id = ? AND status = 'in' 
             AND clock_out IS NULL
             ORDER BY clock_in DESC LIMIT 1`,
            [userId]
        );

        if (activeClocking.length === 0) {
            return res.status(400).json({
                error: 'No active clock-in found'
            });
        }

        // Calculate duration
        const clockInTime = moment(activeClocking[0].clock_in);
        const clockOutTime = moment();
        const workSeconds = clockOutTime.diff(clockInTime, 'seconds');
        const duration = clockOutTime.diff(clockInTime, 'hours', true);
        
        // Dynamic break logic: < 4 hours = 0, >= 4 hours = 30 minutes
        const autoBreakMinutes = workSeconds < 14400 ? 0 : 30; // 4 hours = 14400 seconds
        
        // Allow manual override if provided, otherwise use automatic calculation
        const validatedBreakMinutes = break_minutes !== undefined ? 
            Math.max(0, parseInt(break_minutes) || 0) : autoBreakMinutes;

        // Update the record
        await db.query(
            `UPDATE clock_records 
             SET clock_out = NOW(), 
                 status = 'out', 
                 notes = CONCAT(IFNULL(notes, ''), '\nOut: ', ?),
                 location = ?,
                 break_minutes = ?
             WHERE id = ?`,
            [notes || '', location, validatedBreakMinutes, activeClocking[0].id]
        );

        // Calculate actual hours worked (including break deduction)
        const actualDuration = Math.max(duration - (validatedBreakMinutes / 60), 0);

        res.json({
            message: 'Clocked out successfully',
            duration: actualDuration.toFixed(2),
            location: location,
            break_minutes: validatedBreakMinutes
        });
    } catch (error) {
        console.error('Clock out error:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getRecords = async (req, res) => {
    try {
        const userId = req.user.id;
        const { start_date, end_date } = req.query;

        let query = `
            SELECT 
                cr.*,
                CASE 
                    WHEN cr.clock_out IS NOT NULL THEN 
                        ROUND(
                            GREATEST(
                                (TIMESTAMPDIFF(MINUTE, cr.clock_in, cr.clock_out) - IFNULL(cr.break_minutes, 0)),
                                0
                            ) / 60.0,
                            2
                        )
                    ELSE 
                        ROUND(
                            GREATEST(
                                (TIMESTAMPDIFF(MINUTE, cr.clock_in, NOW()) - IFNULL(cr.break_minutes, 0)),
                                0
                            ) / 60.0,
                            2
                        )
                END as hours_worked,
                u.username,
                u.full_name
            FROM clock_records cr
            JOIN users u ON cr.user_id = u.id
            WHERE cr.user_id = ?
        `;
        let params = [userId];

        if (start_date && end_date) {
            // Add buffer to handle timezone differences
            // Subtract 1 day from start_date to include records from previous day evening
            // Add 1 day to end_date to include records from next day morning
            query += ` AND DATE(cr.clock_in) >= DATE_SUB(?, INTERVAL 1 DAY) AND DATE(cr.clock_in) <= DATE_ADD(?, INTERVAL 1 DAY)`;
            params.push(start_date, end_date);
        }

        query += ` ORDER BY cr.clock_in DESC`;

        const [records] = await db.query(query, params);

        // Format records
        const formattedRecords = records.map(record => ({
            ...record,
            hours_worked: Math.max(Number(record.hours_worked || 0), 0).toFixed(2),
            clock_in: moment(record.clock_in).format('YYYY-MM-DD HH:mm:ss'),
            clock_out: record.clock_out ?
                moment(record.clock_out).format('YYYY-MM-DD HH:mm:ss') :
                null
        }));

        res.json(formattedRecords);
    } catch (error) {
        console.error('Get records error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get summary by location
exports.getLocationSummary = async (req, res) => {
    try {
        const userId = req.user.id;
        const { start_date, end_date } = req.query;

        let query = `
            SELECT 
                location,
                COUNT(*) as total_records,
                SUM(
                    GREATEST(
                        TIMESTAMPDIFF(SECOND, clock_in, 
                            CASE 
                                WHEN clock_out IS NOT NULL THEN clock_out 
                                ELSE NOW() 
                            END
                        ) - IFNULL(break_minutes, 0) * 60,
                        0
                    )
                ) / 3600 as total_hours
            FROM clock_records
            WHERE user_id = ?
        `;
        let params = [userId];

        if (start_date && end_date) {
            query += ` AND clock_in BETWEEN ? AND ?`;
            params.push(start_date, end_date);
        }

        query += ` GROUP BY location ORDER BY total_hours DESC`;

        const [summary] = await db.query(query, params);

        // Format summary
        const formattedSummary = summary.map(item => ({
            ...item,
            total_hours: Number(item.total_hours).toFixed(2)
        }));

        res.json(formattedSummary);
    } catch (error) {
        console.error('Get location summary error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get current clock status
exports.getClockStatus = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find active clock-in record
        const [activeClocking] = await db.query(
            `SELECT 
                cr.*,
                u.full_name,
                u.username
            FROM clock_records cr
            JOIN users u ON cr.user_id = u.id
            WHERE cr.user_id = ? 
            AND cr.status = 'in' 
            AND cr.clock_out IS NULL
            ORDER BY cr.clock_in DESC 
            LIMIT 1`,
            [userId]
        );

        if (activeClocking.length === 0) {
            return res.json({
                clockedIn: false,
                record: null
            });
        }

        const record = activeClocking[0];
        const clockInTime = moment(record.clock_in);
        const currentTime = moment();
        const duration = currentTime.diff(clockInTime, 'hours', true);
        const breakMinutes = record.break_minutes != null ? record.break_minutes : 30;
        const adjustedHours = Math.max(duration - (breakMinutes / 60), 0);

        res.json({
            clockedIn: true,
            record: {
                id: record.id,
                clock_in: moment(record.clock_in).format('YYYY-MM-DD HH:mm:ss'),
                location: record.location || DEFAULT_LOCATION,
                notes: record.notes || '',
                break_minutes: breakMinutes,
                duration: duration.toFixed(2),
                hours_worked: adjustedHours.toFixed(2)
            }
        });
    } catch (error) {
        console.error('Get clock status error:', error);
        res.status(500).json({ error: error.message });
    }
};