const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

exports.register = async (req, res) => {
    try {
        const { username, password, email, full_name } = req.body;
        
        // Force role to 'user' - register endpoint always creates regular users
        // Admins should use /api/admin/users endpoint to create admin users
        const role = 'user';
        const status = 'active';
        
        // Additional validation for admin creating users
        if (!username || !password || !email || !full_name) {
            return res.status(400).json({ 
                error: 'All fields are required' 
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                error: 'Invalid email format' 
            });
        }

        // Validate password strength (minimum 4 characters)
        if (password.length < 4) {
            return res.status(400).json({ 
                error: 'Password must be at least 4 characters long' 
            });
        }

        // Check if user already exists
        const [existingUsers] = await db.query(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ 
                error: 'Username or email already exists' 
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user - always as 'user' role with 'active' status
        const [result] = await db.query(
            `INSERT INTO users (username, password, email, full_name, role, status, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [username, hashedPassword, email, full_name, role, status]
        );

        // Log the action in audit_logs (only if user is authenticated, otherwise use system user id = 0)
        const userId = req.user?.id || 0;
        await db.query(
            `INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values, ip_address) 
             VALUES (?, 'CREATE', 'users', ?, ?, ?)`,
            [
                userId,
                result.insertId,
                JSON.stringify({ username, email, full_name, role, status }),
                req.ip || 'unknown'
            ]
        );

        res.status(201).json({
            message: 'User registered successfully',
            userId: result.insertId,
            username,
            email,
            full_name,
            role,
            status
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find user
        const [users] = await db.query(
            'SELECT * FROM users WHERE username = ? AND status = "active"',
            [username]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = users[0];

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last login
        await db.query(
            'UPDATE users SET last_login = NOW() WHERE id = ?',
            [user.id]
        );

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username,
                role: user.role 
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const [users] = await db.query(
            `SELECT id, username, email, full_name, role, created_at, 
                    last_login, status 
             FROM users 
             WHERE id = ?`,
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(users[0]);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: error.message });
    }
};