// 在Docker环境中，完全跳过.env文件加载，只使用docker-compose设置的环境变量
if (!process.env.DOCKER_ENV) {
  require('dotenv').config();
} else {
  console.log('Docker环境：app.js使用Docker环境变量，忽略.env文件');
}
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const SchedulerService = require('./services/schedulerService');
const ipWhitelist = require('./middleware/ipWhitelist');

const authRoutes = require('./routes/authRoutes');
const clockRoutes = require('./routes/clockRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reminderRoutes = require('./routes/reminderRoutes'); // Add this line

const app = express();

// 信任代理（如果使用反向代理如Nginx）
app.set('trust proxy', true);

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://216.232.48.211:3001', 'http://localhost:3001', 'http://localhost:3000', 'https://clock.mmcwellness.ca'],
  credentials: true
}));
app.use(express.json()); // Make sure this is here
app.use(express.urlencoded({ extended: true }));

// IP白名单中间件（在所有路由之前应用）
app.use(ipWhitelist);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/clock', clockRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reminders', reminderRoutes);

// Debug middleware to log requests
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, {
        body: req.body,
        query: req.query,
        params: req.params
    });
    next();
});

// Initialize scheduler
// SchedulerService.initializeScheduledTasks();

// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 13000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`ClockingApp server is running on port ${PORT}`);
});
