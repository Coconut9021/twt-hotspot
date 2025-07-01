# TWT Hotspot Management System

A comprehensive web-based management system for WiFi hotspots with RADIUS integration, user management, and real-time monitoring capabilities.

## Features

- **User Management**: Register, manage, and monitor hotspot users
- **RADIUS Integration**: Full RADIUS server integration for authentication and accounting
- **Real-time Monitoring**: Live dashboard with active sessions and usage statistics
- **Admin Panel**: Comprehensive administrative interface
- **Session Management**: View, monitor, and terminate active user sessions
- **Usage Reports**: Detailed usage analytics and reporting
- **Service Management**: Built-in service manager for running multiple processes
- **Log Processing**: Automatic RADIUS log parsing and processing

## Directory Structure

```
twt-hotspot/
├── index.js                  # Main Express application
├── database.js               # Database connection and basic functions
├── radius_routes.js          # Routes for RADIUS data access
├── radius_data.js            # Functions to interact with RADIUS data
├── radius_log_processor.js   # Background process for log parsing
├── radius_schema.sql         # SQL schema for RADIUS tables
├── start.js                  # Service starter script
├── .env                      # Environment variables
├── package.json              # Project dependencies
├── service-config.json       # Service configuration
├── public/                   # Static assets
│   ├── css/
│   ├── js/
│   └── images/
├── views/                    # EJS templates
│   ├── index.ejs
│   ├── admin.ejs
│   ├── success.ejs
│   ├── partials/
│   │   ├── header.ejs
│   │   └── footer.ejs
│   └── radius/               # RADIUS-specific views
│       ├── dashboard.ejs
│       ├── accounting.ejs
│       ├── auth.ejs
│       ├── user.ejs
│       ├── usage.ejs
│       └── active.ejs
└── node_modules/
```

## Installation

### Prerequisites

- Node.js (v14 or higher)
- MySQL/MariaDB
- FreeRADIUS (optional, for full RADIUS functionality)

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd twt-hotspot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Copy the `.env` file and update the values:
   ```bash
   cp .env .env.local
   ```
   
   Edit `.env` with your database credentials and other settings:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_NAME=radius
   PORT=3000
   ```

4. **Set up the database**
   ```bash
   # Create the database
   mysql -u root -p -e "CREATE DATABASE radius;"
   
   # Import the schema
   mysql -u root -p radius < radius_schema.sql
   ```

5. **Start the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   
   # Using service manager
   npm run start:service
   ```

## Usage

### Development Mode

```bash
npm run dev
```

This starts the application in development mode with auto-reload on file changes.

### Production Mode

```bash
# Start all services
npm run start:service

# Check service status
npm run status:service

# Stop all services
npm run stop:service

# Restart all services
npm run restart:service
```

### Service Management

The application includes a built-in service manager that can run multiple processes:

```bash
# Start specific service
node start.js service web start

# Stop specific service
node start.js service web stop

# View all services
node start.js status
```

### Database Setup

The application uses MySQL/MariaDB with the FreeRADIUS schema. The included `radius_schema.sql` file contains all necessary tables and indexes.

### RADIUS Integration

To enable full RADIUS functionality:

1. Install and configure FreeRADIUS
2. Configure FreeRADIUS to use MySQL backend
3. Point FreeRADIUS to use the same database as this application
4. Enable the log processor service in `service-config.json`

## API Endpoints

### System API
- `GET /api/system-status` - Get system status
- `GET /api/uptime` - Get system uptime

### RADIUS API
- `GET /radius/api/stats` - Get dashboard statistics
- `GET /radius/api/active-sessions` - Get active sessions
- `POST /radius/api/terminate-session` - Terminate a session
- `GET /radius/api/session/:id` - Get session details

### Web Routes
- `/` - Main hotspot portal
- `/admin` - Admin panel
- `/radius/dashboard` - RADIUS dashboard
- `/radius/accounting` - Accounting records
- `/radius/auth` - Authentication logs
- `/radius/active` - Active sessions
- `/radius/usage` - Usage reports
- `/radius/user/:username` - User details

## Configuration

### Environment Variables

Key environment variables in `.env`:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=radius_user
DB_PASSWORD=radius_password
DB_NAME=radius

# Application
PORT=3000
NODE_ENV=production
SESSION_SECRET=your_session_secret

# RADIUS
RADIUS_LOG_DIR=/var/log/freeradius
LOG_PROCESS_INTERVAL=30000
DEFAULT_NAS_SECRET=testing123

# Features
ENABLE_LOG_PROCESSOR=false
ENABLE_ANALYTICS=true
ENABLE_NOTIFICATIONS=false
```

### Service Configuration

Edit `service-config.json` to configure services:

```json
{
  "services": {
    "web": {
      "script": "index.js",
      "enabled": true,
      "env": "production"
    },
    "logProcessor": {
      "script": "radius_log_processor.js",
      "enabled": false,
      "env": "production"
    }
  },
  "options": {
    "restartOnCrash": true,
    "maxRestarts": 5,
    "restartDelay": 5000
  }
}
```

## Security Considerations

1. **Database Security**: Use strong passwords and restrict database access
2. **Session Security**: Change the default session secret
3. **Admin Access**: Secure admin panel with proper authentication
4. **RADIUS Secrets**: Use strong RADIUS shared secrets
5. **HTTPS**: Enable HTTPS in production
6. **Firewall**: Restrict access to necessary ports only

## Monitoring

The application provides several monitoring features:

1. **Real-time Dashboard**: Live statistics and active sessions
2. **System Status**: Database and service health checks
3. **Usage Analytics**: Detailed usage reports and trends
4. **Session Monitoring**: Active session tracking and management
5. **Log Processing**: Automatic log parsing and analysis

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check database credentials in `.env`
   - Ensure MySQL/MariaDB is running
   - Verify database exists and schema is imported

2. **RADIUS Integration Issues**
   - Check FreeRADIUS configuration
   - Verify database connectivity from FreeRADIUS
   - Check RADIUS log directory permissions

3. **Service Start Issues**
   - Check port availability
   - Verify Node.js version compatibility
   - Check log files for error details

### Logs

Application logs are available in:
- Console output (development mode)
- Service manager logs
- System logs (production mode)

## Development

### Adding New Features

1. Create new route files in the root directory
2. Add corresponding view files in `views/`
3. Update `index.js` to include new routes
4. Add any new database functions to `database.js`

### Database Schema Changes

1. Update `radius_schema.sql`
2. Create migration scripts for existing installations
3. Update corresponding data access functions

## License

This project is licensed under the ISC License.

## Support

For support and questions:
1. Check the troubleshooting section
2. Review the configuration files
3. Check application logs
4. Create an issue in the repository
