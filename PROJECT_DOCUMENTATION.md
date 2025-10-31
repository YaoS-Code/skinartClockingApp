# ClockingApp - Employee Time Tracking System

## Overview
ClockingApp is a comprehensive employee time tracking system designed for managing clock-in/clock-out records across multiple locations. The application provides both employee and administrative interfaces for time management, reporting, and user management.

## Architecture

### Technology Stack

#### Backend
- **Node.js** with Express.js framework
- **MySQL** database with connection pooling
- **JWT** for authentication
- **bcryptjs** for password hashing
- **node-cron** for scheduled tasks
- **nodemailer** for email notifications

#### Frontend
- **React.js** (v18.2.0) with modern hooks
- **Material-UI** (MUI v6.4.2) for UI components
- **Redux Toolkit** for state management
- **React Router** for navigation
- **Axios** for API communication
- **date-fns** and **moment.js** for date handling

### Project Structure

```
clockingApp/
├── client/                     # React frontend application
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/         # Admin-only components
│   │   │   ├── auth/          # Authentication components
│   │   │   ├── clock/         # Time tracking components
│   │   │   └── layout/        # Layout and navigation components
│   │   ├── services/          # API services and authentication
│   │   ├── store/             # Redux store configuration
│   │   └── utils/             # Utility functions
│   └── public/                # Static assets
├── server/                    # Node.js backend application
│   ├── src/
│   │   ├── controllers/       # Route handlers
│   │   ├── models/            # Database models
│   │   ├── routes/            # API route definitions
│   │   ├── middleware/        # Authentication and validation
│   │   ├── services/          # Business logic services
│   │   ├── config/            # Database and app configuration
│   │   ├── scripts/           # Database initialization and utilities
│   │   └── utils/             # Utility functions
│   └── attachments/           # Email templates and attachments
├── docker-compose.yml          # Docker multi-service orchestration
└── docker-compose.override.yml.example
```

## Features

### Core Functionality

#### Employee Features
1. **Clock In/Out Management**
   - Location-based clock in/out (MMC, SkinartMD, RAAC, Remote, Other)
   - Notes for each clock in/out session
   - Automatic break time calculation (30 minutes default)
   - Real-time status tracking

2. **Time Records**
   - View personal clock records with filtering by date range
   - Detailed hours calculation including break deductions
   - Location-based time summaries
   - Export capabilities

3. **Authentication**
   - Secure login/logout
   - JWT-based session management
   - Profile management

#### Administrative Features
1. **User Management**
   - Create, view, and manage employee accounts
   - Role-based access control (admin/user)
   - User status management (active/inactive)
   - Account settings including break exemptions

2. **Records Management**
   - View all employee records with advanced filtering
   - Edit/modify existing clock records
   - Comprehensive audit trail
   - Bulk operations and reporting

3. **Reporting & Analytics**
   - Summary reports by time period
   - Location-based time tracking
   - User productivity analytics
   - Detailed audit logs

### Security Features
- **Authentication**: JWT-based with 24-hour expiration
- **Authorization**: Role-based access control
- **Audit Logging**: Complete audit trail for all modifications
- **Input Validation**: Server-side validation using express-validator
- **Password Security**: bcrypt hashing with salt rounds
- **CORS Protection**: Configured for specific domains
- **Helmet.js**: Security headers implementation

## Database Schema

### Core Tables

#### Users Table
```sql
CREATE TABLE users (
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
    no_break BOOLEAN DEFAULT FALSE
);
```

#### Clock Records Table
```sql
CREATE TABLE clock_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    clock_in DATETIME NOT NULL,
    clock_out DATETIME,
    status ENUM('in', 'out') NOT NULL,
    notes TEXT,
    location VARCHAR(255),
    break_minutes INT DEFAULT 30,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    modified_by INT,
    ip_address VARCHAR(45),
    device_info VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### Audit Logs Table
```sql
CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id INT,
    old_values JSON,
    new_values JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## API Endpoints

### Authentication Routes (`/api/auth`)
- `POST /register` - Register new user (admin only)
- `POST /login` - User login
- `GET /profile` - Get user profile

### Clock Routes (`/api/clock`)
- `POST /in` - Clock in
- `POST /out` - Clock out
- `GET /records` - Get user's clock records
- `GET /location-summary` - Get location-based summary

### Admin Routes (`/api/admin`)
- `GET /users` - Get all users
- `GET /records-summary` - Get comprehensive records summary
- `GET /users/:user_id/records` - Get specific user's records
- `PUT /records/:id` - Modify clock record
- `PUT /users/:id/status` - Update user status

### Reminder Routes (`/api/reminders`)
- Email reminder functionality for appointments
- Scheduled task management

## Configuration

### Environment Variables
```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=clockingapp
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your_jwt_secret

# Server Configuration
PORT=13000
NODE_ENV=production

# Email Configuration (for reminders)
EMAIL_HOST=your_smtp_host
EMAIL_PORT=587
EMAIL_USER=your_email
EMAIL_PASS=your_password

# Reminder Configuration
REMINDER_DAYS_BEFORE=1
REMINDER_HOUR=17
```

### Deployment Configuration

#### Docker Compose (`docker-compose.yml`)
```yaml
version: '3.8'
services:
  server:
    build: ./server
    ports:
      - "13000:13000"
    env_file:
      - ./server/.env
    depends_on:
      - db
  client:
    build: ./client
    ports:
      - "3001:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:13000/api
  db:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=your_password
      - MYSQL_DATABASE=clockingapp
    volumes:
      - mysql-data:/var/lib/mysql
volumes:
  mysql-data:
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- Docker & Docker Compose (for containerized deployment)

### Backend Setup (Local without Docker)
```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Initialize database
npm run init-db

# Start development server
npm run dev

# Or start production server
npm start
```

### Frontend Setup (Local without Docker)
```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

### Database Initialization
```bash
# Run database initialization script
cd server
node src/scripts/initDatabase.js
```

### Docker Deployment
```bash
# Start all services
docker-compose up -d

# Tail logs
docker-compose logs -f

# Stop and remove containers
docker-compose down
```

Docker handles process management within each container, so no additional PM2 configuration is required when deploying via Docker. To override environment variables, create a custom file based on `docker-compose.override.yml.example`.

### Default Admin Account
- **Username**: `manager`
- **Password**: `8780`
- **Email**: `manager@company.com`

## Usage Guide

### For Employees
1. **Login**: Use provided credentials to access the system
2. **Clock In**: Select location and add optional notes
3. **Clock Out**: Add notes and specify break duration
4. **View Records**: Check personal time tracking history
5. **Generate Reports**: Export time records for payroll

### For Administrators
1. **User Management**: Create and manage employee accounts
2. **Monitor Activity**: View real-time clock status of all employees
3. **Edit Records**: Modify clock records when necessary
4. **Generate Reports**: Create comprehensive time reports
5. **Audit Trail**: Review all system modifications

## Business Logic

### Time Calculation
- **Standard Break**: 30 minutes automatically deducted
- **No Break Users**: Configurable accounts with zero break deduction
- **Overtime**: Hours beyond standard work day tracked
- **Location Tracking**: Time tracked per work location

### Validation Rules
- **Clock In**: Must select valid location
- **Clock Out**: Cannot clock out without active clock in
- **Time Range**: Working hours must be realistic (0-24 hours)
- **Data Integrity**: All modifications logged in audit trail

## Monitoring & Maintenance

### Logging
- **Application Logs**: Console logging for debugging
- **Audit Logs**: Database-stored modification history
- **Error Handling**: Comprehensive error catching and reporting

### Backup Strategy
- **Database Backups**: Regular MySQL dumps
- **Code Repository**: Git version control
- **Configuration Backups**: Environment files and Docker Compose configuration

### Performance Considerations
- **Database Indexing**: Optimized queries for large datasets
- **Connection Pooling**: Efficient database connection management
- **Caching**: Strategic caching for frequently accessed data

## Security Considerations

### Data Protection
- **Password Security**: bcrypt hashing with appropriate salt rounds
- **JWT Security**: Short-lived tokens with secure signing
- **Input Sanitization**: All user inputs validated and sanitized
- **SQL Injection Prevention**: Parameterized queries

### Access Control
- **Role-Based Access**: Admin vs. user permissions
- **Route Protection**: Middleware-based authentication
- **CORS Configuration**: Restricted to authorized domains

## Troubleshooting

### Common Issues
1. **Database Connection**: Check MySQL service and credentials
2. **JWT Errors**: Verify JWT_SECRET configuration
3. **CORS Issues**: Ensure frontend URL in CORS allowlist
4. **Clock Status**: Database sync issues with active sessions

### Development Tips
- **API Testing**: Use Postman or similar tools for endpoint testing
- **Database Debugging**: MySQL Workbench for query optimization
- **Frontend Debugging**: React Developer Tools for component inspection

## Future Enhancements

### Planned Features
1. **Mobile Application**: React Native implementation
2. **Geolocation Tracking**: GPS-based location verification
3. **Biometric Authentication**: Fingerprint/face recognition
4. **Advanced Reporting**: Data visualization and analytics
5. **Integration**: Payroll system integration
6. **Notifications**: Real-time alerts and reminders

### Scalability Considerations
- **Microservices**: Service decomposition for larger scale
- **Database Sharding**: Horizontal scaling for high volume
- **Load Balancing**: Multiple server instances
- **Caching Layer**: Redis implementation for performance

## Support & Contact

For technical support or feature requests, please contact the development team or create an issue in the project repository.

---

*Last Updated: [Current Date]*
*Version: 1.0.0*
