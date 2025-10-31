// 在Docker环境中，完全跳过.env文件加载，只使用docker-compose设置的环境变量
if (!process.env.DOCKER_ENV) {
  require('dotenv').config();
} else {
  console.log('Docker环境：initDatabase使用Docker环境变量，忽略.env文件');
}
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const initDatabase = async () => {
    let connection;
    try {
        // Create connection - 使用环境变量
        // 在Docker环境中，先尝试用root创建数据库，然后用应用用户
        // 在Docker环境中，必须使用环境变量，不允许fallback到默认值
        const dbHost = process.env.DB_HOST;
        const dbName = process.env.DB_NAME;
        const dbUser = process.env.DB_USER;
        const dbPassword = process.env.DB_PASSWORD;
        const rootPassword = process.env.MYSQL_ROOT_PASSWORD;
        
        if (!dbHost || !dbName || !dbUser || !dbPassword || !rootPassword) {
          throw new Error('缺少必需的数据库环境变量：DB_HOST, DB_NAME, DB_USER, DB_PASSWORD, MYSQL_ROOT_PASSWORD');
        }
        
        console.log('初始化数据库配置:', { dbHost, dbName, dbUser, dbPassword: '***', rootPassword: '***' });
        
        // 首先用root用户连接创建数据库
        connection = await mysql.createConnection({
            host: dbHost,
            user: "root",
            password: rootPassword,
        });

        console.log('Connected to MySQL server');

        // Drop database if not exists
       //  await connection.query(`Drop DATABASE  ${dbName}`);
        // Create database if not exists
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
        console.log(`Database ${dbName} ensured`);

        // 关闭root连接，使用应用用户连接
        await connection.end();
        
        // 使用应用用户连接（如果root和应用用户不同）
        if (dbUser !== "root") {
            connection = await mysql.createConnection({
                host: dbHost,
                user: dbUser,
                password: dbPassword,
                database: dbName
            });
        } else {
            connection = await mysql.createConnection({
                host: dbHost,
                user: dbUser,
                password: dbPassword,
                database: dbName
            });
        }

        // Use the database
        await connection.query(`USE ${dbName}`);

        // Create users table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                full_name VARCHAR(100) NOT NULL,
                role ENUM('admin', 'user') DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                last_login TIMESTAMP NULL,
                status ENUM('active', 'inactive') DEFAULT 'active',
                INDEX idx_username (username),
                INDEX idx_email (email)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('Users table ensured');

        // Create clock_records table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS clock_records (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                clock_in DATETIME NOT NULL,
                clock_out DATETIME,
                status ENUM('in', 'out') NOT NULL,
                notes TEXT,
                break_minutes INT DEFAULT 30,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                modified_by INT,
                location VARCHAR(255),
                ip_address VARCHAR(45),
                device_info VARCHAR(255),
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (modified_by) REFERENCES users(id),
                INDEX idx_user_id (user_id),
                INDEX idx_clock_in (clock_in),
                INDEX idx_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('Clock records table ensured');
        
        // Add break_minutes column if it doesn't exist (for existing tables)
        try {
            const [columns] = await connection.query(`
                SHOW COLUMNS FROM clock_records LIKE 'break_minutes'
            `);
            if (columns.length === 0) {
                await connection.query(`
                    ALTER TABLE clock_records 
                    ADD COLUMN break_minutes INT DEFAULT 30
                `);
                console.log('Break minutes column added');
            } else {
                console.log('Break minutes column already exists');
            }
        } catch (error) {
            console.log('Break minutes column check error:', error.message);
        }

        // Create audit_logs table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                action VARCHAR(50) NOT NULL,
                table_name VARCHAR(50) NOT NULL,
                record_id INT,
                old_values JSON,
                new_values JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ip_address VARCHAR(45),
                FOREIGN KEY (user_id) REFERENCES users(id),
                INDEX idx_user_id (user_id),
                INDEX idx_action (action),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('Audit logs table ensured');

        // Create default admin user if not exists
        const hashedPassword = await bcrypt.hash('8780', 10);
        await connection.query(`
            INSERT IGNORE INTO users (username, password, email, full_name, role)
            VALUES (?, ?, ?, ?, ?)
        `, ['manager', hashedPassword, 'manager@company.com', 'System Manager', 'admin']);
        console.log('Default admin user ensured');

        console.log('Database initialization completed successfully');

    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('Database connection closed');
        }
    }
};

// Run the initialization
initDatabase()
    .then(() => {
        console.log('Database setup completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Database setup failed:', error);
        process.exit(1);
    });
