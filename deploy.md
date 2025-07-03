# DigitalOcean Deployment Guide for TWT Hotspot

## Prerequisites
- DigitalOcean account
- SSH key configured
- Domain name (optional but recommended)

## Step 1: Create DigitalOcean Droplet
1. Create a new Ubuntu 22.04 LTS droplet
2. Minimum: 2GB RAM, 1 CPU, 50GB SSD
3. Add your SSH key
4. Note the droplet's IP address

## Step 2: Server Setup Commands
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Git, PM2, and other essentials
sudo apt install -y git nginx mysql-server
sudo npm install -g pm2

# Configure MySQL
sudo mysql_secure_installation
```

## Step 3: Database Setup
```sql
CREATE DATABASE twt_hotspot;
CREATE USER 'twt_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON twt_hotspot.* TO 'twt_user'@'localhost';
FLUSH PRIVILEGES;
```

## Step 4: Application Deployment
```bash
# Clone repository
git clone https://github.com/your-username/twt-hotspot.git
cd twt-hotspot

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your database credentials

# Start with PM2
pm2 start index.js --name "twt-hotspot"
pm2 startup
pm2 save
```

## Step 5: Nginx Configuration
Create `/etc/nginx/sites-available/twt-hotspot` with reverse proxy configuration.

## RADIUS Server Integration
- Server IP: 41.191.232.2
- NAS IP: 154.119.81.23
- Configure FreeRADIUS to communicate with your application
