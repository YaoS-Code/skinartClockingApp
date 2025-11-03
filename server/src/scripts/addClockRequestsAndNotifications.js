// 在Docker环境中，完全跳过.env文件加载，只使用docker-compose设置的环境变量
if (!process.env.DOCKER_ENV) {
  require('dotenv').config();
} else {
  console.log('Docker环境：使用Docker环境变量，忽略.env文件');
}
const mysql = require('mysql2/promise');

const addTables = async () => {
    let connection;
    try {
        const dbHost = process.env.DB_HOST;
        const dbName = process.env.DB_NAME;
        const dbUser = process.env.DB_USER;
        const dbPassword = process.env.DB_PASSWORD;
        
        if (!dbHost || !dbName || !dbUser || !dbPassword) {
          throw new Error('缺少必需的数据库环境变量');
        }
        
        console.log('连接数据库:', { dbHost, dbName, dbUser });
        
        connection = await mysql.createConnection({
            host: dbHost,
            user: dbUser,
            password: dbPassword,
            database: dbName
        });

        console.log('已连接到MySQL数据库');

        // 创建补打卡申请表
        await connection.query(`
            CREATE TABLE IF NOT EXISTS clock_requests (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                request_type ENUM('clock_in', 'clock_out') NOT NULL,
                request_date DATE NOT NULL,
                request_time TIME NOT NULL,
                reason TEXT NOT NULL,
                status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
                admin_id INT NULL,
                admin_note TEXT NULL,
                reviewed_at DATETIME NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_user_id (user_id),
                INDEX idx_status (status),
                INDEX idx_request_date (request_date),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✓ clock_requests 表已创建');

        // 创建通知表
        await connection.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                type ENUM('clock_request', 'clock_request_approved', 'clock_request_rejected', 'system') NOT NULL,
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                related_id INT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                read_at DATETIME NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_id (user_id),
                INDEX idx_is_read (is_read),
                INDEX idx_created_at (created_at),
                INDEX idx_type (type)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✓ notifications 表已创建');

        console.log('\n✓ 数据库迁移完成！');

    } catch (error) {
        console.error('❌ 数据库迁移失败:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('数据库连接已关闭');
        }
    }
};

// 运行迁移
addTables()
    .then(() => {
        console.log('迁移脚本执行成功');
        process.exit(0);
    })
    .catch((error) => {
        console.error('迁移脚本执行失败:', error);
        process.exit(1);
    });

