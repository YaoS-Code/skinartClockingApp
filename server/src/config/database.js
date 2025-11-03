const mysql = require('mysql2');
const dotenv = require('dotenv');
const path = require('path');

// 在Docker环境中，完全跳过.env文件加载，只使用docker-compose设置的环境变量
// 这样可以确保Docker应用使用独立的数据库，不会连接到远程服务器
if (!process.env.DOCKER_ENV) {
  dotenv.config({ path: path.join(__dirname, '../../.env') });
} else {
  // Docker环境：明确使用环境变量，不加载.env文件
  console.log('Docker环境：使用Docker环境变量，忽略.env文件');
}

// Log the configuration (temporarily for debugging)
console.log('Database Config:', {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  timezone: 'America/Vancouver', // Vancouver timezone (Pacific Time)
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test the connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('Successfully connected to database');
  connection.release();
});

const promisePool = pool.promise();

module.exports = promisePool;